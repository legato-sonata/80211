<script>
  import { getTopology } from './context.js';
  import { Plus, Server, Router, MonitorSmartphone, Wifi, CreditCard } from '@lucide/svelte';

  const topology = getTopology();
  
  let menuOpen = $state(false);

  const deviceTypes = [
    { type: 'pos', icon: CreditCard, label: 'POS Terminal' },
    { type: 'router', icon: Router, label: 'Router' },
    { type: 'switch', icon: Server, label: 'Switch' },
    { type: 'ap', icon: Wifi, label: 'Access Point' },
    { type: 'camera', icon: MonitorSmartphone, label: 'IP Camera' }
  ];

  function handleAdd(type) {
    topology.addNode(type);
    menuOpen = false;
  }
</script>

<div class="toolbar-wrapper">
  {#if menuOpen}
    <div class="add-menu glass-panel">
      {#each deviceTypes as device}
        <button class="menu-item" onclick={() => handleAdd(device.type)}>
          <device.icon size={18} />
          <span>{device.label}</span>
        </button>
      {/each}
    </div>
  {/if}
  
  <button 
    class="fab glass-panel {menuOpen ? 'active' : ''}" 
    onclick={() => menuOpen = !menuOpen}
    aria-label="Add Device"
  >
    <div class="fab-icon">
      <Plus size={24} />
    </div>
  </button>
</div>

{#if menuOpen}
  <div class="backdrop" onclick={() => menuOpen = false} role="button" aria-label="Close menu" tabindex="0" onkeydown={(e) => e.key === 'Escape' && (menuOpen = false)}></div>
{/if}

<style>
  .toolbar-wrapper {
    position: absolute;
    bottom: 24px;
    right: 24px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 16px;
  }

  .fab {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    background: var(--surface-color);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 0 0 1px var(--surface-border);
    transition: transform var(--transition-normal), background var(--transition-fast);
  }

  .fab:hover {
    background: rgba(30, 41, 59, 0.8);
    transform: scale(1.05);
  }

  .fab.active .fab-icon {
    transform: rotate(45deg);
  }

  .fab-icon {
    transition: transform var(--transition-normal);
  }

  .add-menu {
    border-radius: 16px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    min-width: 200px;
    animation: fadeIn var(--transition-fast);
    transform-origin: bottom right;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    transition: background var(--transition-fast);
    text-align: left;
    width: 100%;
  }

  .menu-item:hover {
    background: var(--surface-highlight);
    color: var(--accent-primary);
  }

  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 15;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 768px) {
    .toolbar-wrapper {
      bottom: 24px;
      right: 24px;
    }
  }
</style>
