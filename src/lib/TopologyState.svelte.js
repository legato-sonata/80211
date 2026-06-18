export class TopologyState {
  nodes = $state([]);
  links = $state([]);
  selectedNodeId = $state(null);
  selectedLinkId = $state(null);
  isEditing = $state(false);
  isLinkingMode = $state(false);
  linkSourceId = $state(null);

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
        { id: 'n5', type: 'ap', label: 'Ceiling AP (Floor)', ip: '192.168.1.10', status: 'offline', details: { mac: '00:1A:2B:3C:4D:60', ssid: 'Store_Guest' }, x: 150, y: 150 }
      ],
      links: [
        { id: 'l1', source: 'n1', target: 'n2', type: 'fiber', status: 'active' },
        { id: 'l2', source: 'n2', target: 'n3', type: 'ethernet', status: 'active' },
        { id: 'l3', source: 'n2', target: 'n4', type: 'ethernet', status: 'warning' },
        { id: 'l4', source: 'n2', target: 'n5', type: 'wireless', status: 'active' }
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
    this.selectedLinkId = id;
    this.selectedNodeId = null;
    this.isEditing = false;
    this.isLinkingMode = false;
    this.linkSourceId = null;
  }

  toggleLinkingMode() {
    this.isLinkingMode = !this.isLinkingMode;
    this.linkSourceId = null;
    if (this.isLinkingMode) {
      this.selectedNodeId = null;
      this.selectedLinkId = null;
    }
  }

  addNode(type) {
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
      this.selectLink(id);
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
