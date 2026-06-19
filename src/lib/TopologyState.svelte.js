export class TopologyState {
  nodes = $state([]);
  links = $state([]);
  selectedNodeId = $state(null);
  selectedLinkId = $state(null);
  isEditing = $state(false);
  isLinkingMode = $state(false);
  linkSourceId = $state(null);
  isUIHidden = $state(false);
  isReportOpen = $state(false);

  history = $state([]);
  historyIndex = $state(-1);
  isRecording = true;
  initialState = null;

  constructor() {
    this.initialState = {
      nodes: [
        { id: 'n1', type: 'router', label: 'Main Gateway', ip: '192.168.1.1', status: 'online', details: { dhcp: '192.168.1.100 - 192.168.1.200', firmware: 'v2.4.1', model: 'ER-X' }, x: -50, y: -200 },
        { id: 'n2', type: 'switch', label: 'Core Switch', ip: '192.168.1.2', status: 'online', details: { ports: 24, poe: true, model: 'USW-24-PoE' }, x: -50, y: -50 },
        { id: 'n3', type: 'pos', label: 'Register 1', ip: '192.168.1.101', status: 'online', details: { mac: '00:1A:2B:3C:4D:5E', location: 'Front Counter' }, x: -250, y: 150 },
        { id: 'n4', type: 'pos', label: 'Register 2', ip: '192.168.1.102', status: 'warning', details: { mac: '00:1A:2B:3C:4D:5F', location: 'Front Counter', error: 'High Latency detected' }, x: -50, y: 150 },
        { id: 'n5', type: 'ap', label: 'Ceiling AP (Floor)', ip: '192.168.1.10', status: 'offline', details: { mac: '00:1A:2B:3C:4D:60', ssid: 'Store_Guest' }, x: 150, y: 150 },
        { id: 'n6', type: 'camera', label: 'CCTV Front Door', ip: '192.168.1.20', status: 'online', details: { mac: '00:1A:2B:3C:4D:61', resolution: '1080p' }, x: 150, y: -200 },
        { id: 'n7', type: 'printer', label: 'Kitchen Printer', ip: '192.168.1.50', status: 'warning', details: { mac: '00:1A:2B:3C:4D:62', ink: 'Low' }, x: -250, y: -50 }
      ],
      links: [
        { id: 'l1', source: 'n1', target: 'n2', type: 'fiber', status: 'active' },
        { id: 'l2', source: 'n2', target: 'n3', type: 'ethernet', status: 'active' },
        { id: 'l3', source: 'n2', target: 'n4', type: 'ethernet', status: 'warning' },
        { id: 'l4', source: 'n2', target: 'n5', type: 'wireless', status: 'active' },
        { id: 'l5', source: 'n2', target: 'n6', type: 'ethernet', status: 'active' },
        { id: 'l6', source: 'n2', target: 'n7', type: 'ethernet', status: 'warning' }
      ]
    };
    this.nodes = JSON.parse(JSON.stringify(this.initialState.nodes));
    this.links = JSON.parse(JSON.stringify(this.initialState.links));
    this.pushHistory();
  }

  pushHistory() {
    if (!this.isRecording) return;
    const snapshot = JSON.stringify({ nodes: this.nodes, links: this.links });
    if (this.historyIndex >= 0 && this.history[this.historyIndex] === snapshot) return;
    
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snapshot);
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadSnapshot(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadSnapshot(this.history[this.historyIndex]);
    }
  }

  resetToInitial() {
    this.nodes = JSON.parse(JSON.stringify(this.initialState.nodes));
    this.links = JSON.parse(JSON.stringify(this.initialState.links));
    this.selectedNodeId = null;
    this.selectedLinkId = null;
    this.isLinkingMode = false;
    this.history = [];
    this.historyIndex = -1;
    this.pushHistory();
  }

  loadSnapshot(snapshotString) {
    this.isRecording = false;
    const data = JSON.parse(snapshotString);
    this.nodes = data.nodes;
    this.links = data.links;
    this.selectedNodeId = null;
    this.selectedLinkId = null;
    this.isLinkingMode = false;
    this.isRecording = true;
  }

  get canUndo() { return this.historyIndex > 0; }
  get canRedo() { return this.historyIndex < this.history.length - 1; }

  get selectedNode() { return this.nodes.find(n => n.id === this.selectedNodeId) || null; }
  get selectedLink() { return this.links.find(l => l.id === this.selectedLinkId) || null; }

  selectNode(id) {
    this.isUIHidden = false;
    if (this.isLinkingMode) {
      if (!this.linkSourceId) {
        this.linkSourceId = id;
      } else if (this.linkSourceId !== id) {
        this.addLink(this.linkSourceId, id, 'ethernet');
        this.linkSourceId = null;
        this.isLinkingMode = false;
      }
      return;
    }
    this.selectedNodeId = id;
    this.selectedLinkId = null;
    this.isEditing = false;
  }

  selectLink(id) {
    this.isUIHidden = false;
    this.selectedLinkId = id;
    this.selectedNodeId = null;
    this.isEditing = false;
    this.isLinkingMode = false;
    this.linkSourceId = null;
  }

  toggleLinkingMode() {
    this.isUIHidden = false;
    this.isLinkingMode = !this.isLinkingMode;
    this.linkSourceId = null;
    if (this.isLinkingMode) {
      this.selectedNodeId = null;
      this.selectedLinkId = null;
    }
  }

  addNode(type) {
    this.isUIHidden = false;
    const id = `n${Date.now()}`;
    const newNode = {
      id,
      type,
      label: `New ${type.toUpperCase()}`,
      ip: '0.0.0.0',
      status: 'online',
      details: {},
      x: window.innerWidth / 2 - 50 + Math.random() * 100,
      y: window.innerHeight / 2 - 50 + Math.random() * 100
    };
    this.nodes.push(newNode);
    this.selectNode(id);
    this.isEditing = true;
    this.pushHistory();
  }

  deleteNode(id) {
    this.links = this.links.filter(l => l.source !== id && l.target !== id);
    this.nodes = this.nodes.filter(n => n.id !== id);
    if (this.selectedNodeId === id) this.selectedNodeId = null;
    this.pushHistory();
  }

  addLink(source, target, type) {
    const exists = this.links.find(l => (l.source === source && l.target === target) || (l.source === target && l.target === source));
    if (!exists) {
      const id = `l${Date.now()}`;
      this.links.push({ id, source, target, type, status: 'active' });
      // Delay selecting the link to let the user see the connection happen smoothly
      setTimeout(() => {
        this.selectLink(id);
      }, 500);
      this.pushHistory();
    }
  }

  deleteLink(id) {
    this.links = this.links.filter(l => l.id !== id);
    if (this.selectedLinkId === id) this.selectedLinkId = null;
    this.pushHistory();
  }

  moveNode(id, x, y) {
    const node = this.nodes.find(n => n.id === id);
    if (node) {
      node.x = x;
      node.y = y;
    }
  }

  autoLayout() {
    if (this.nodes.length === 0) return;
    
    // Fruchterman-Reingold Force-Directed Layout
    const iterations = 100;
    // Base ideal distance between nodes
    const k = 150; 
    
    const nodes = this.nodes;
    const links = this.links;
    
    for (let i = 0; i < iterations; i++) {
      const forces = nodes.map(() => ({ x: 0, y: 0 }));
      
      // Repulsion
      for (let j = 0; j < nodes.length; j++) {
        for (let l = j + 1; l < nodes.length; l++) {
          let dx = nodes[j].x - nodes[l].x;
          let dy = nodes[j].y - nodes[l].y;
          let dist = Math.hypot(dx, dy) || 1;
          let force = (k * k) / dist;
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          forces[j].x += fx;
          forces[j].y += fy;
          forces[l].x -= fx;
          forces[l].y -= fy;
        }
      }
      
      // Attraction
      for (let link of links) {
        const sourceIdx = nodes.findIndex(n => n.id === link.source);
        const targetIdx = nodes.findIndex(n => n.id === link.target);
        if (sourceIdx >= 0 && targetIdx >= 0) {
          let dx = nodes[sourceIdx].x - nodes[targetIdx].x;
          let dy = nodes[sourceIdx].y - nodes[targetIdx].y;
          let dist = Math.hypot(dx, dy) || 1;
          let force = (dist * dist) / k;
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          forces[sourceIdx].x -= fx;
          forces[sourceIdx].y -= fy;
          forces[targetIdx].x += fx;
          forces[targetIdx].y += fy;
        }
      }
      
      // Apply forces
      const temp = k * 0.1 * (1 - i / iterations);
      for (let j = 0; j < nodes.length; j++) {
        const dist = Math.hypot(forces[j].x, forces[j].y) || 1;
        const moveX = (forces[j].x / dist) * Math.min(dist, temp);
        const moveY = (forces[j].y / dist) * Math.min(dist, temp);
        nodes[j].x += moveX;
        nodes[j].y += moveY;
      }
    }
    
    this.centerGraph();
    // Dispatch reset zoom to recenter canvas view on the newly laid out graph
    window.dispatchEvent(new CustomEvent('reset-zoom'));
  }

  applyGridLayout() {
    if (this.nodes.length === 0) return;

    const cols = Math.ceil(Math.sqrt(this.nodes.length));
    const spacingX = 180;
    const spacingY = 150;

    this.nodes.forEach((n, i) => {
      n.x = (i % cols) * spacingX;
      n.y = Math.floor(i / cols) * spacingY;
    });

    this.centerGraph();
  }

  applyCircularLayout() {
    if (this.nodes.length === 0) return;

    const radius = Math.max(200, this.nodes.length * 40);
    this.nodes.forEach((n, i) => {
      const angle = (i / this.nodes.length) * 2 * Math.PI;
      n.x = radius * Math.cos(angle);
      n.y = radius * Math.sin(angle);
    });

    this.centerGraph();
  }

  centerGraph() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    });
    
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    
    this.nodes.forEach(n => {
      n.x -= cx;
      n.y -= cy;
    });
    
    this.pushHistory();
    window.dispatchEvent(new CustomEvent('reset-zoom'));
  }

  exportProject() {
    return JSON.stringify({ nodes: this.nodes, links: this.links }, null, 2);
  }

  loadProject(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.nodes && data.links) {
        this.nodes = data.nodes;
        this.links = data.links;
        this.selectedNodeId = null;
        this.selectedLinkId = null;
        this.isLinkingMode = false;
        this.history = [];
        this.historyIndex = -1;
        this.pushHistory();
        return true;
      }
    } catch (e) {
      console.error("Invalid project file", e);
    }
    return false;
  }
}

export function createTopologyState() {
  return new TopologyState();
}
