<script>
  import { getTopology } from './context.js';
  import Maximize from '@lucide/svelte/icons/maximize';
  import Cable from '@lucide/svelte/icons/cable';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

  const topology = getTopology();

  function resetZoom() {
    window.dispatchEvent(new CustomEvent('reset-zoom'));
  }
</script>

<div class="action-sidebar">
  <button class="action-btn glass-effect" onclick={() => topology.resetToInitial()} aria-label="Reset Project">
    <RotateCcw size={20} color="var(--text-primary)" strokeWidth={1.5} />
  </button>

  <div class="divider"></div>

  <button class="action-btn glass-effect" onclick={() => topology.undo()} disabled={!topology.canUndo} aria-label="Undo">
    <Undo2 size={20} color={topology.canUndo ? 'var(--text-primary)' : 'var(--text-secondary)'} strokeWidth={1.5} style={topology.canUndo ? '' : 'opacity: 0.3'} />
  </button>

  <button class="action-btn glass-effect" onclick={() => topology.redo()} disabled={!topology.canRedo} aria-label="Redo">
    <Redo2 size={20} color={topology.canRedo ? 'var(--text-primary)' : 'var(--text-secondary)'} strokeWidth={1.5} style={topology.canRedo ? '' : 'opacity: 0.3'} />
  </button>

  <div class="divider"></div>

  <button class="action-btn glass-effect" onclick={resetZoom} aria-label="Reset zoom">
    <Maximize size={20} color="var(--text-primary)" strokeWidth={1.5} />
  </button>

  <div class="divider"></div>

  <button class="action-btn glass-effect {topology.isLinkingMode ? 'active' : ''}" onclick={() => topology.toggleLinkingMode()} aria-label="Connect Nodes">
    <Cable size={20} color={topology.isLinkingMode ? 'var(--surface)' : 'var(--text-primary)'} strokeWidth={1.5} />
  </button>
</div>

<style>
  .action-sidebar {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .action-btn {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    pointer-events: auto;
    transition: transform 0.1s, background 0.1s;
    cursor: pointer;
    padding: 0;
  }
  
  .action-btn:active {
    transform: scale(0.95);
  }

  .action-btn.active {
    background: var(--text-primary);
    border-color: var(--text-primary);
  }

  .divider {
    width: 24px;
    height: 1px;
    background: var(--border);
    margin: 4px auto;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    .action-sidebar {
      top: 16px;
      right: 16px;
    }
  }
</style>
