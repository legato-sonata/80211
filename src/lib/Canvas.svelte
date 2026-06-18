<script>
  import { getTopology } from './context.js';
  import { Server, Router, MonitorSmartphone, Wifi, CreditCard } from '@lucide/svelte';

  const topology = getTopology();
  
  let draggingNode = null;
  let dragOffset = { x: 0, y: 0 };
  let svgContainer;

  function handlePointerDown(e, node) {
    if (e.button !== 0) return;
    draggingNode = node;
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset = {
      x: e.clientX - node.x,
      y: e.clientY - node.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!draggingNode) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    topology.moveNode(draggingNode.id, newX, newY);
  }

  function handlePointerUp(e) {
    if (draggingNode) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      draggingNode = null;
    }
  }

  function getNodePos(id) {
    return topology.nodes.find(n => n.id === id);
  }

  function getIcon(type) {
    switch(type) {
      case 'router': return Router;
      case 'switch': return Server;
      case 'pos': return CreditCard;
      case 'ap': return Wifi;
      default: return MonitorSmartphone;
    }
  }

  function getStatusColor(status) {
    switch(status) {
      case 'online': return 'var(--status-online)';
      case 'warning': return 'var(--status-warning)';
      case 'offline': return 'var(--status-offline)';
      default: return 'var(--text-secondary)';
    }
  }
</script>

<div class="canvas-container" role="application" onpointermove={handlePointerMove} onpointerup={handlePointerUp}>
  <svg class="links-layer" bind:this={svgContainer}>
    {#each topology.links as link (link.id)}
      {@const source = getNodePos(link.source)}
      {@const target = getNodePos(link.target)}
      {#if source && target}
        <g class="link" class:status-warning={link.status === 'warning'} class:status-offline={link.status === 'offline'}>
          <line 
            x1={source.x + 40} 
            y1={source.y + 40} 
            x2={target.x + 40} 
            y2={target.y + 40} 
            stroke-width="2" 
            class="link-line"
          />
          {#if link.status === 'active'}
            <circle r="4" class="link-packet">
              <animateMotion 
                dur="2s" 
                repeatCount="indefinite" 
                path="M {source.x + 40},{source.y + 40} L {target.x + 40},{target.y + 40}"
              />
            </circle>
          {/if}
        </g>
      {/if}
    {/each}
  </svg>

  <div class="nodes-layer">
    {#each topology.nodes as node (node.id)}
      {@const Icon = getIcon(node.type)}
      <button 
        class="node glass-panel {topology.selectedNodeId === node.id ? 'selected' : ''}" 
        style="transform: translate({node.x}px, {node.y}px);"
        onpointerdown={(e) => {
          topology.selectNode(node.id);
          handlePointerDown(e, node);
        }}
        aria-label="{node.label} details"
      >
        <div class="node-icon" style="color: {getStatusColor(node.status)}">
          <Icon size={28} />
        </div>
        <div class="node-info">
          <span class="node-label">{node.label}</span>
          <span class="node-ip">{node.ip}</span>
        </div>
        <div class="node-status-indicator" style="background-color: {getStatusColor(node.status)}; box-shadow: 0 0 8px {getStatusColor(node.status)}"></div>
      </button>
    {/each}
  </div>
</div>

<style>
  .canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .links-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .link-line {
    stroke: var(--accent-primary);
    opacity: 0.5;
    transition: var(--transition-normal);
  }

  .link.status-warning .link-line {
    stroke: var(--status-warning);
    stroke-dasharray: 4;
    animation: dash 20s linear infinite;
  }

  .link.status-offline .link-line {
    stroke: var(--status-offline);
    opacity: 0.2;
  }

  .link-packet {
    fill: var(--accent-primary);
    filter: drop-shadow(0 0 6px var(--accent-primary-glow));
  }

  .nodes-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }

  .node {
    position: absolute;
    width: 180px;
    padding: 12px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: grab;
    touch-action: none;
    user-select: none;
    transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
    text-align: left;
  }

  .node:active {
    cursor: grabbing;
  }

  .node.selected {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 1px var(--accent-primary), 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  }

  .node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
  }

  .node-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .node-label {
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .node-ip {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  .node-status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: absolute;
    top: -2px;
    right: -2px;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 1000;
    }
  }
</style>
