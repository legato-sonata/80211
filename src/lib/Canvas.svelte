<script>
  import { getTopology } from './context.js';
  import Server from '@lucide/svelte/icons/server';
  import Router from '@lucide/svelte/icons/router';
  import MonitorSmartphone from '@lucide/svelte/icons/monitor-smartphone';
  import Wifi from '@lucide/svelte/icons/wifi';
  import CreditCard from '@lucide/svelte/icons/credit-card';
  import PrinterIcon from '@lucide/svelte/icons/printer';

  import { onMount } from 'svelte';
  
  const topology = getTopology();
  
  let transform = $state({ x: 0, y: 0, k: 1 });
  let svgContainer;
  let mounted = $state(false);

  onMount(() => {
    function doReset() {
      transform.x = window.innerWidth / 2;
      transform.y = window.innerHeight / 2;
      transform.k = Math.min(1, window.innerWidth / 600);
    }
    
    doReset();
    
    window.addEventListener('reset-zoom', doReset);
    
    // Small delay to ensure render is perfectly stable before fading in
    requestAnimationFrame(() => {
      mounted = true;
    });
  });

  // Node dragging
  let draggingNode = null;
  let nodeDragStartPos = { x: 0, y: 0 };
  let nodeHasDragged = false;
  let lastNodeTap = { id: null, time: 0 };
  
  // Panning/Zooming state
  let pointers = $state([]);
  let isPanning = $state(false);
  let canvasHasDragged = false;
  let canvasDragStart = { x: 0, y: 0 };
  let pointerDownTarget = null;
  let lastLinkTap = { id: null, time: 0 };

  function handlePointerDown(e) {
    if (e.target.closest('.node')) return; 
    
    // We allow tracking pointer down on links so panning works over them
    pointerDownTarget = e.target.closest('.link');
    
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
    
    if (pointers.length === 1) {
      isPanning = true;
      canvasHasDragged = false;
      canvasDragStart = { x: e.clientX, y: e.clientY };
    }
  }

  function handlePointerMove(e) {
    const index = pointers.findIndex(p => p.id === e.pointerId);
    if (index === -1) return;

    if (pointers.length === 1 && isPanning) {
      const dist = Math.hypot(e.clientX - canvasDragStart.x, e.clientY - canvasDragStart.y);
      if (dist > 5) canvasHasDragged = true;

      // Pan
      transform.x += e.clientX - pointers[0].x;
      transform.y += e.clientY - pointers[0].y;
      pointers[0] = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else if (pointers.length === 2) {
      canvasHasDragged = true; // Zooming counts as a drag to invalidate taps
      // Pinch to zoom
      const p1 = pointers[0];
      const p2 = pointers[1];
      const distOld = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      
      pointers[index] = { id: e.pointerId, x: e.clientX, y: e.clientY };
      
      const newP1 = pointers[0];
      const newP2 = pointers[1];
      const distNew = Math.hypot(newP1.x - newP2.x, newP1.y - newP2.y);
      
      const midX = (newP1.x + newP2.x) / 2;
      const midY = (newP1.y + newP2.y) / 2;

      const scaleDelta = distNew / distOld;
      const newK = Math.min(Math.max(transform.k * scaleDelta, 0.1), 5);
      
      const scaleRatio = newK / transform.k;
      transform.x = midX - (midX - transform.x) * scaleRatio;
      transform.y = midY - (midY - transform.y) * scaleRatio;
      transform.k = newK;
    }
  }

  function handlePointerUp(e) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    pointers = pointers.filter(p => p.id !== e.pointerId);
    
    if (pointers.length === 0) {
      isPanning = false;
      
      // Tap detection for links
      if (!canvasHasDragged && pointerDownTarget) {
        const linkId = pointerDownTarget.getAttribute('data-id');
        if (linkId) {
          const now = Date.now();
          if (lastLinkTap.id === linkId && now - lastLinkTap.time < 400) {
            topology.selectLink(linkId);
            lastLinkTap = { id: null, time: 0 };
          } else {
            lastLinkTap = { id: linkId, time: now };
          }
        }
      }
      pointerDownTarget = null;
    }
  }

  function handleWheel(e) {
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newK = Math.min(Math.max(transform.k * scaleDelta, 0.1), 5);
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleRatio = newK / transform.k;
    transform.x = mouseX - (mouseX - transform.x) * scaleRatio;
    transform.y = mouseY - (mouseY - transform.y) * scaleRatio;
    transform.k = newK;
  }

  let nodeDragOffset = {x: 0, y: 0};
  
  function onNodePointerDown(e, node) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    
    if (topology.isLinkingMode) {
      topology.selectNode(node.id);
      return;
    }
    
    draggingNode = node;
    nodeHasDragged = false;
    nodeDragStartPos = { x: e.clientX, y: e.clientY };
    
    nodeDragOffset = {
      x: (e.clientX - transform.x) / transform.k - node.x,
      y: (e.clientY - transform.y) / transform.k - node.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onNodePointerMove(e) {
    if (!draggingNode) return;
    e.stopPropagation();
    
    const dist = Math.hypot(e.clientX - nodeDragStartPos.x, e.clientY - nodeDragStartPos.y);
    if (dist > 5) {
      nodeHasDragged = true;
    }
    
    const newX = (e.clientX - transform.x) / transform.k - nodeDragOffset.x;
    const newY = (e.clientY - transform.y) / transform.k - nodeDragOffset.y;
    topology.moveNode(draggingNode.id, newX, newY);
  }

  function onNodePointerUp(e, node) {
    if (!draggingNode) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (!nodeHasDragged) {
      if (topology.isLinkingMode) {
        topology.selectNode(node.id);
      } else {
        const now = Date.now();
        if (lastNodeTap.id === node.id && now - lastNodeTap.time < 400) {
          topology.selectNode(node.id);
          lastNodeTap = { id: null, time: 0 };
        } else {
          lastNodeTap = { id: node.id, time: now };
        }
      }
    } else {
      topology.pushHistory(); // Node finished dragging
    }
    
    draggingNode = null;
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
      case 'printer': return PrinterIcon;
      default: return MonitorSmartphone;
    }
  }

  function getStrokePattern(type) {
    if (type === 'wireless') return "6 6";
    return "none";
  }

  function getStrokeColor(status) {
    if (status === 'offline') return "var(--border)";
    if (status === 'warning') return "#f59e0b";
    return "var(--text-primary)";
  }

  function handleLinkClick(e, linkId) {
    e.stopPropagation();
    topology.selectLink(linkId);
  }
</script>

<div 
  class="canvas-container {topology.isLinkingMode ? 'linking-mode' : ''}" 
  style="opacity: {mounted ? 1 : 0}; transition: opacity 0.15s ease-out;"
  role="application" 
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove} 
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
  onwheel={handleWheel}
  ondblclick={(e) => {
    // Only toggle if they click the canvas background, not nodes
    if (!e.target.closest('.node') && !e.target.closest('.link')) {
      topology.isUIHidden = !topology.isUIHidden;
    }
  }}
>
  <div class="transform-layer" style="transform: translate({transform.x}px, {transform.y}px) scale({transform.k});">
    <svg class="links-layer" bind:this={svgContainer}>
      {#each topology.links as link (link.id)}
        {@const source = getNodePos(link.source)}
        {@const target = getNodePos(link.target)}
        {#if source && target}
          <g 
            class="link {topology.selectedLinkId === link.id ? 'selected' : ''}" 
            data-id={link.id}
            role="button"
            tabindex="0"
            aria-label="Link from {link.source} to {link.target}"
          >
            <!-- Invisible wide line for easier clicking -->
            <line 
              x1={source.x + 50} 
              y1={source.y + 50} 
              x2={target.x + 50} 
              y2={target.y + 50} 
              stroke-width="32" 
              stroke="rgba(0,0,0,0.01)"
              stroke-linecap="round"
              class="link-hitbox"
            />
            <line 
              x1={source.x + 50} 
              y1={source.y + 50} 
              x2={target.x + 50} 
              y2={target.y + 50} 
              stroke-width={topology.selectedLinkId === link.id ? "3" : "2"} 
              stroke={getStrokeColor(link.status)}
              stroke-dasharray={getStrokePattern(link.type)}
              class="link-line"
            />
          </g>
        {/if}
      {/each}
    </svg>

    <div class="nodes-layer">
      {#each topology.nodes as node (node.id)}
        {@const Icon = getIcon(node.type)}
        <button 
          class="node {topology.selectedNodeId === node.id ? 'selected' : ''} {topology.linkSourceId === node.id ? 'link-source' : ''}" 
          style="transform: translate({node.x}px, {node.y}px);"
          onpointerdown={(e) => onNodePointerDown(e, node)}
          onpointermove={onNodePointerMove}
          onpointerup={(e) => onNodePointerUp(e, node)}
          onpointercancel={(e) => onNodePointerUp(e, node)}
          aria-label="{node.label} details"
        >
          <div class="node-icon">
            <Icon size={28} color="var(--text-primary)" strokeWidth={topology.selectedNodeId === node.id ? 2.5 : 1.5} />
          </div>
          <div class="node-info">
            <span class="node-label">{node.label}</span>
            <span class="node-ip">{node.ip}</span>
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--bg-color);
    background-image: radial-gradient(#d4d4d4 1px, transparent 0);
    background-size: 32px 32px;
    background-position: -15px -15px;
    cursor: grab;
    touch-action: none;
  }
  .canvas-container:active {
    cursor: grabbing;
  }

  .canvas-container.linking-mode {
    cursor: crosshair;
  }
  .canvas-container.linking-mode .node {
    cursor: crosshair;
  }

  .transform-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: 0 0;
    will-change: transform;
  }

  .links-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .link {
    pointer-events: auto;
    cursor: pointer;
    outline: none;
  }

  .link:focus, .link:active {
    outline: none;
  }

  .link-line {
    transition: stroke-width 0.1s, stroke 0.1s;
  }

  .link.selected .link-line {
    stroke: var(--text-primary) !important;
  }

  .nodes-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .node {
    position: absolute;
    width: 100px;
    padding: 12px 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: grab;
    touch-action: none;
    user-select: none;
    text-align: center;
    pointer-events: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: border-color 0.1s, box-shadow 0.1s, background 0.1s;
  }

  .node.link-source {
    border-color: var(--text-primary);
    background: #f4f4f5;
  }
  
  .node:active {
    cursor: grabbing;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .node.selected {
    border-color: var(--border-focus);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .node-info {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .node-label {
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: var(--text-primary);
  }

  .node-ip {
    font-size: 0.65rem;
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }
</style>
