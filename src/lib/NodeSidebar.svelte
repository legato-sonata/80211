<script>
  import { getTopology } from './context.js';
  import { X, Save, Trash2, Edit2 } from '@lucide/svelte';

  const topology = getTopology();

  function handleClose() {
    topology.selectNode(null);
  }

  function handleDelete() {
    if (topology.selectedNodeId) {
      topology.deleteNode(topology.selectedNodeId);
    }
  }
</script>

{#if topology.selectedNode}
  <aside class="sidebar glass-panel">
    <header class="sidebar-header">
      <div class="header-title">
        <h2>{topology.selectedNode.label}</h2>
        <span class="badge {topology.selectedNode.status}">{topology.selectedNode.status}</span>
      </div>
      <button class="icon-btn" onclick={handleClose} aria-label="Close Sidebar">
        <X size={20} />
      </button>
    </header>

    <div class="sidebar-content">
      {#if topology.isEditing}
        <div class="form-group">
          <label for="node-label">Device Name</label>
          <input id="node-label" type="text" bind:value={topology.selectedNode.label} />
        </div>
        <div class="form-group">
          <label for="node-ip">IP Address</label>
          <input id="node-ip" type="text" bind:value={topology.selectedNode.ip} />
        </div>
        <div class="form-group">
          <label for="node-status">Status</label>
          <select id="node-status" bind:value={topology.selectedNode.status}>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <div class="form-group">
          <label>Details (JSON format)</label>
          <textarea 
            rows="5" 
            value={JSON.stringify(topology.selectedNode.details, null, 2)}
            onchange={(e) => {
              try {
                topology.selectedNode.details = JSON.parse(e.target.value);
              } catch(err) {
                // Ignore parse errors while typing
              }
            }}
          ></textarea>
        </div>
      {:else}
        <div class="info-group">
          <span class="info-label">Type</span>
          <span class="info-value type-caps">{topology.selectedNode.type}</span>
        </div>
        <div class="info-group">
          <span class="info-label">IP Address</span>
          <span class="info-value font-mono">{topology.selectedNode.ip}</span>
        </div>
        
        <div class="divider"></div>
        <h3 class="section-title">Device Specifics</h3>
        
        {#if Object.keys(topology.selectedNode.details).length === 0}
          <p class="text-muted">No additional details configured.</p>
        {:else}
          {#each Object.entries(topology.selectedNode.details) as [key, value]}
            <div class="info-group">
              <span class="info-label capitalize">{key}</span>
              <span class="info-value">{value}</span>
            </div>
          {/each}
        {/if}
      {/if}
    </div>

    <footer class="sidebar-footer">
      {#if topology.isEditing}
        <button class="btn btn-primary" onclick={() => topology.isEditing = false}>
          <Save size={16} /> Save Changes
        </button>
      {:else}
        <button class="btn btn-secondary" onclick={() => topology.isEditing = true}>
          <Edit2 size={16} /> Edit
        </button>
      {/if}
      <button class="btn btn-danger" onclick={handleDelete}>
        <Trash2 size={16} /> Delete
      </button>
    </footer>
  </aside>
{/if}

<style>
  .sidebar {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 320px;
    max-height: calc(100vh - 32px);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    z-index: 10;
    animation: slideIn var(--transition-normal);
  }

  .sidebar-header {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--surface-border);
  }

  .header-title h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .badge.online { background: rgba(74, 222, 128, 0.1); color: var(--status-online); border: 1px solid rgba(74, 222, 128, 0.2); }
  .badge.warning { background: rgba(251, 191, 36, 0.1); color: var(--status-warning); border: 1px solid rgba(251, 191, 36, 0.2); }
  .badge.offline { background: rgba(244, 63, 94, 0.1); color: var(--status-offline); border: 1px solid rgba(244, 63, 94, 0.2); }

  .icon-btn {
    color: var(--text-secondary);
    padding: 4px;
    border-radius: 6px;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .icon-btn:hover {
    background: var(--surface-highlight);
    color: var(--text-primary);
  }

  .sidebar-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 8px 12px;
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: border-color var(--transition-fast);
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .info-group {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .info-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .info-value {
    font-size: 0.875rem;
    font-weight: 500;
    text-align: right;
    word-break: break-all;
    max-width: 60%;
  }

  .font-mono {
    font-family: var(--font-mono);
  }

  .type-caps {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.75rem;
  }

  .capitalize {
    text-transform: capitalize;
  }

  .divider {
    height: 1px;
    background: var(--surface-border);
    margin: 4px 0;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .text-muted {
    color: var(--text-muted);
    font-size: 0.875rem;
    font-style: italic;
  }

  .sidebar-footer {
    padding: 20px;
    border-top: 1px solid var(--surface-border);
    display: flex;
    gap: 12px;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    flex: 1;
    transition: background var(--transition-fast), filter var(--transition-fast);
  }

  .btn:hover {
    filter: brightness(1.1);
  }

  .btn-primary {
    background: var(--accent-primary);
    color: #020617;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }

  .btn-danger {
    background: rgba(244, 63, 94, 0.1);
    color: var(--status-offline);
    flex: none;
    padding: 10px;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @media (max-width: 768px) {
    .sidebar {
      top: auto;
      bottom: 0;
      right: 0;
      left: 0;
      width: 100%;
      border-radius: 24px 24px 0 0;
      animation: slideUp var(--transition-normal);
      border-bottom: none;
      border-left: none;
      border-right: none;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  }
</style>
