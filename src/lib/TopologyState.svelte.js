export class TopologyState {
  nodes = $state([]);
  links = $state([]);
  selectedNodeId = $state(null);
  isEditing = $state(false);

  constructor() {
    this.nodes = [
      { id: 'n1', type: 'router', label: 'Main Gateway', ip: '192.168.1.1', status: 'online', details: { dhcp: '192.168.1.100 - 192.168.1.200', firmware: 'v2.4.1', model: 'ER-X' }, x: 500, y: 100 },
      { id: 'n2', type: 'switch', label: 'Core Switch', ip: '192.168.1.2', status: 'online', details: { ports: 24, poe: true, model: 'USW-24-PoE' }, x: 500, y: 250 },
      { id: 'n3', type: 'pos', label: 'Register 1', ip: '192.168.1.101', status: 'online', details: { mac: '00:1A:2B:3C:4D:5E', location: 'Front Counter' }, x: 250, y: 450 },
      { id: 'n4', type: 'pos', label: 'Register 2', ip: '192.168.1.102', status: 'warning', details: { mac: '00:1A:2B:3C:4D:5F', location: 'Front Counter', error: 'High Latency detected' }, x: 500, y: 450 },
      { id: 'n5', type: 'ap', label: 'Ceiling AP (Floor)', ip: '192.168.1.10', status: 'offline', details: { mac: '00:1A:2B:3C:4D:60', ssid: 'Store_Guest' }, x: 750, y: 450 }
    ];
    this.links = [
      { id: 'l1', source: 'n1', target: 'n2', type: 'fiber', status: 'active' },
      { id: 'l2', source: 'n2', target: 'n3', type: 'ethernet', status: 'active' },
      { id: 'l3', source: 'n2', target: 'n4', type: 'ethernet', status: 'warning' },
      { id: 'l4', source: 'n2', target: 'n5', type: 'ethernet', status: 'offline' }
    ];
  }

  get selectedNode() {
    return this.nodes.find(n => n.id === this.selectedNodeId) || null;
  }

  selectNode(id) {
    this.selectedNodeId = id;
    this.isEditing = false;
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
      x: window.innerWidth / 2 - 100 + Math.random() * 200,
      y: window.innerHeight / 2 - 100 + Math.random() * 200
    };
    this.nodes.push(newNode);
    this.selectedNodeId = id;
    this.isEditing = true;
  }

  deleteNode(id) {
    this.links = this.links.filter(l => l.source !== id && l.target !== id);
    this.nodes = this.nodes.filter(n => n.id !== id);
    if (this.selectedNodeId === id) {
      this.selectedNodeId = null;
    }
  }

  updateNode(id, updates) {
    const node = this.nodes.find(n => n.id === id);
    if (node) {
      Object.assign(node, updates);
    }
  }

  moveNode(id, x, y) {
    const node = this.nodes.find(n => n.id === id);
    if (node) {
      node.x = x;
      node.y = y;
    }
  }
}
