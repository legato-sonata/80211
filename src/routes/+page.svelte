<script>
  import { setTopology } from '$lib/context.js';
  import Canvas from '$lib/Canvas.svelte';
  import NodeSidebar from '$lib/NodeSidebar.svelte';
  import Toolbar from '$lib/Toolbar.svelte';

  const topology = setTopology();
</script>

<div class="workspace">
  <Canvas />
  <NodeSidebar />
  <Toolbar />
  
  <header class="top-nav glass-panel">
    <div class="logo">
      <div class="logo-icon"></div>
      <h1>NetViz</h1>
    </div>
    <div class="store-info">
      <span class="store-id">Store #80211</span>
      <span class="status-indicator"></span>
      <span class="status-text">System Online</span>
    </div>
  </header>
</div>

<style>
  .workspace {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: inherit;
  }

  .top-nav {
    position: absolute;
    top: 16px;
    left: 16px;
    padding: 12px 24px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 32px;
    z-index: 10;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-primary);
    box-shadow: 0 0 12px var(--accent-primary-glow);
  }

  .logo h1 {
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  .store-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.875rem;
  }

  .store-id {
    font-weight: 600;
    color: var(--text-secondary);
    padding-right: 12px;
    border-right: 1px solid var(--surface-border);
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--status-online);
    box-shadow: 0 0 8px var(--status-online-glow);
  }

  .status-text {
    font-weight: 500;
    color: var(--status-online);
  }
</style>
