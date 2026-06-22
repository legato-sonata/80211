<script>
  import Workspace from '$lib/Workspace.svelte';
  import { TopologyState } from '$lib/TopologyState.svelte.js';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  
  const initialTabId = Date.now();
  let tabs = $state([
    { id: initialTabId, state: new TopologyState() }
  ]);
  let activeTabId = $state(initialTabId);
  let editingTabId = $state(null);

  function addTab() {
    const id = Date.now();
    const newState = new TopologyState(true);
    newState.name = `Office ${tabs.length + 1}`;
    tabs.push({ id, state: newState });
    activeTabId = id;
  }

  function closeTab(id, e) {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const index = tabs.findIndex(t => t.id === id);
    tabs = tabs.filter(t => t.id !== id);
    if (activeTabId === id) {
      activeTabId = tabs[Math.max(0, index - 1)].id;
    }
  }
</script>

<div class="app-layout">
  <div class="workspace-area">
    {#each tabs as tab (tab.id)}
      <div class="workspace-wrapper" style="display: {tab.id === activeTabId ? 'block' : 'none'};">
         <Workspace topology={tab.state} />
      </div>
    {/each}
  </div>

  <div class="tabs-bar glass-effect">
    <div class="tabs-scroll">
      {#each tabs as tab (tab.id)}
        <div 
          class="tab {tab.id === activeTabId ? 'active' : ''}" 
          onclick={() => activeTabId = tab.id}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && (activeTabId = tab.id)}
        >
          {#if editingTabId === tab.id}
            <input 
              id="edit-tab-{tab.id}"
              class="tab-name input-active" 
              bind:value={tab.state.name} 
              onblur={() => editingTabId = null}
              onkeydown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') editingTabId = null;
              }}
              onpointerdown={(e) => e.stopPropagation()}
            />
          {:else}
            <span 
              class="tab-name" 
              role="button"
              tabindex="0"
              ondblclick={() => {
                editingTabId = tab.id;
                setTimeout(() => document.getElementById('edit-tab-' + tab.id)?.focus(), 0);
              }}
            >
              {tab.state.name}
            </span>
          {/if}
          {#if tabs.length > 1}
            <button class="close-tab" onclick={(e) => closeTab(tab.id, e)} aria-label="Close tab">
              <X size={14} strokeWidth={2} color="var(--text-secondary)" />
            </button>
          {/if}
        </div>
      {/each}
    </div>
    <button class="add-tab" onclick={addTab} aria-label="New tab">
      <Plus size={16} strokeWidth={2} color="var(--text-primary)" />
    </button>
  </div>
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    width: 100vw;
    overflow: hidden;
  }

  .tabs-bar {
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-top: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 50;
    flex-shrink: 0;
  }

  .tabs-scroll {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    flex: 1;
  }
  .tabs-scroll::-webkit-scrollbar {
    display: none;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }

  .tab:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  .tab.active {
    background: #f4f4f5;
    border-color: var(--border-focus);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .tab-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary);
    width: 140px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    user-select: none;
    touch-action: manipulation; /* Improves double-tap responsiveness on mobile */
  }

  input.tab-name.input-active {
    border: none;
    background: transparent;
    outline: none;
    border-bottom: 1px solid var(--text-primary);
    user-select: text;
  }

  .close-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
  }

  .close-tab:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .add-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    margin-left: 12px;
    transition: all 0.15s;
  }

  .add-tab:hover {
    background: #f4f4f5;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }

  .workspace-area {
    flex: 1;
    position: relative;
    width: 100%;
    height: calc(100dvh - 48px);
  }

  .workspace-wrapper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
