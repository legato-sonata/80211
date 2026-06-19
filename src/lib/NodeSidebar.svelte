<script>
  import { getTopology } from './context.js';
  import X from '@lucide/svelte/icons/x';

  const topology = getTopology();

  // No longer using configText as we directly bind to details properties.

  function handleClose() {
    if (topology.selectedNodeId) topology.selectNode(null);
    if (topology.selectedLinkId) topology.selectLink(null);
  }

  function handleDelete() {
    if (topology.selectedNodeId) topology.deleteNode(topology.selectedNodeId);
    if (topology.selectedLinkId) topology.deleteLink(topology.selectedLinkId);
  }

  function handleEdit() {
    // The $effect will handle initializing configText
    topology.isEditing = true;
  }

  function handleSave() {
    topology.isEditing = false;
    topology.pushHistory();
  }
</script>

{#if topology.selectedNode || topology.selectedLink}
  <div class="sidebar-backdrop" onpointerdown={handleClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && handleClose()} aria-label="Close sidebar"></div>
  <aside class="sidebar">
    <header class="sidebar-header">
      <h2>{topology.selectedNode ? topology.selectedNode.label : 'Connection'}</h2>
      <button class="icon-btn" onclick={handleClose} aria-label="Close">
        <X size={20} color="var(--text-primary)" strokeWidth={1.5} />
      </button>
    </header>

    <div class="sidebar-content">
      {#if topology.selectedNode}
        {#if topology.isEditing}
          <div class="form-group">
            <label for="node-label">Name</label>
            <input id="node-label" type="text" bind:value={topology.selectedNode.label} />
          </div>
          <div class="form-group">
            <label for="node-ip">IP</label>
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
          <div class="divider"></div>
          <p class="section-title">Advanced Configuration</p>
          {#if topology.selectedNode.type === 'router'}
            <div class="form-group">
              <label>DHCP Range</label>
              <input type="text" bind:value={topology.selectedNode.details.dhcp} placeholder="e.g. 192.168.1.100-200" />
            </div>
            <div class="form-group">
              <label>Firewall Status</label>
              <select bind:value={topology.selectedNode.details.firewall}>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          {:else if topology.selectedNode.type === 'ap'}
            <div class="form-group">
              <label>SSID Name</label>
              <input type="text" bind:value={topology.selectedNode.details.ssid} placeholder="WiFi Name" />
            </div>
            <div class="form-group">
              <label>VLAN ID</label>
              <input type="text" bind:value={topology.selectedNode.details.vlan} placeholder="e.g. 10" />
            </div>
          {:else if topology.selectedNode.type === 'camera'}
            <div class="form-group">
              <label>Stream Resolution</label>
              <select bind:value={topology.selectedNode.details.resolution}>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div class="form-group">
              <label>DVR Storage IP</label>
              <input type="text" bind:value={topology.selectedNode.details.dvrIp} placeholder="192.168.1.x" />
            </div>
          {:else if topology.selectedNode.type === 'switch'}
            <div class="form-group">
              <label>Active VLANs</label>
              <input type="text" bind:value={topology.selectedNode.details.vlans} placeholder="e.g. 10,20,30" />
            </div>
            <div class="form-group">
              <label>PoE Status</label>
              <select bind:value={topology.selectedNode.details.poe}>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          {:else}
            <div class="form-group">
              <label>Custom Notes</label>
              <textarea rows="3" bind:value={topology.selectedNode.details.notes} placeholder="Additional info..."></textarea>
            </div>
          {/if}
        {:else}
          <div class="info-group">
            <span class="info-label">Type</span>
            <span class="info-value">{topology.selectedNode.type}</span>
          </div>
          <div class="info-group">
            <span class="info-label">IP</span>
            <span class="info-value">{topology.selectedNode.ip}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Status</span>
            <span class="info-value">{topology.selectedNode.status}</span>
          </div>
          <div class="divider"></div>
          {#if !topology.selectedNode.details || typeof topology.selectedNode.details !== 'object' || Object.keys(topology.selectedNode.details).length === 0}
            <p class="text-muted">No additional configuration.</p>
          {:else}
            {#each Object.entries(topology.selectedNode.details) as [key, value]}
              <div class="info-group">
                <span class="info-label">{key}</span>
                <span class="info-value">{value}</span>
              </div>
            {/each}
          {/if}
        {/if}
      {:else if topology.selectedLink}
        {#if topology.isEditing}
          <div class="form-group">
            <label for="link-type">Connection Type</label>
            <select id="link-type" bind:value={topology.selectedLink.type}>
              <option value="ethernet">Ethernet (Solid)</option>
              <option value="fiber">Fiber (Solid)</option>
              <option value="wireless">Wireless (Dashed)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="link-status">Status</label>
            <select id="link-status" bind:value={topology.selectedLink.status}>
              <option value="active">Active</option>
              <option value="warning">Warning</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        {:else}
          <div class="info-group">
            <span class="info-label">Type</span>
            <span class="info-value">{topology.selectedLink.type}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Status</span>
            <span class="info-value">{topology.selectedLink.status}</span>
          </div>
        {/if}
      {/if}
    </div>

    <footer class="sidebar-footer">
      {#if topology.isEditing}
        <button class="btn primary" onclick={handleSave}>Save</button>
      {:else}
        <button class="btn" onclick={handleEdit}>Edit</button>
      {/if}
        <button class="btn" onclick={handleDelete}>Delete</button>
    </footer>
  </aside>
{/if}

<style>
  .sidebar-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 25;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  .sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100dvh;
    background: var(--surface);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 30;
  }

  .sidebar-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sidebar-header h2 {
    font-size: 1rem;
    font-weight: 600;
  }

  .icon-btn {
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 4px;
  }
  .icon-btn:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .sidebar-content {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label, .info-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .form-group input, .form-group select, .form-group textarea {
    padding: 8px 10px;
    font-size: 0.85rem;
  }

  .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
    border-color: var(--border-focus);
  }

  .info-group {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .info-value {
    font-weight: 500;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    text-align: right;
    max-width: 60%;
    word-break: break-all;
    text-transform: capitalize;
  }

  .divider {
    border: 0;
    border-bottom: 1px solid var(--border);
    margin: 8px 0;
  }

  .text-muted {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
  }

  .sidebar-footer .btn {
    flex: 1;
  }

  @media (max-width: 768px) {
    .sidebar {
      top: auto;
      bottom: 0;
      right: 0;
      left: 0;
      width: 100vw;
      height: 55dvh;
      border-left: none;
      border-top: 1px solid var(--border);
      box-shadow: 0 -4px 16px rgba(0,0,0,0.05);
      /* Add padding so the dock menu doesn't block the footer */
      padding-bottom: 80px; 
    }
    .sidebar-content {
      /* Reclaim space from padding if needed, but padding-bottom on the sidebar container is better so the whole sheet extends behind dock */
    }
  }
</style>
