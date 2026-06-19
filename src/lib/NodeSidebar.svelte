<script>
  import { getTopology } from './context.js';
  import X from '@lucide/svelte/icons/x';
  import Ticket from '@lucide/svelte/icons/ticket';

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

  function openTicket() {
    const node = topology.selectedNode;
    const subject = encodeURIComponent(`IT Support Ticket: ${node.label} (${node.type.toUpperCase()})`);
    const body = encodeURIComponent(`Device: ${node.label}\nIP Address: ${node.ip}\nSerial/MAC: ${node.details.serial || '-'}\nStatus: ${node.status.toUpperCase()}\n\nPlease describe the issue below:\n`);
    window.open(`mailto:it.support@amorbakery.com?subject=${subject}&body=${body}`);
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
          <p class="section-title">Asset Information</p>
          <div class="form-group">
            <label for="node-label">Name</label>
            <input id="node-label" type="text" bind:value={topology.selectedNode.label} />
          </div>
          <div class="form-group">
            <label for="node-serial">Serial / MAC Address</label>
            <input id="node-serial" type="text" bind:value={topology.selectedNode.details.serial} placeholder="e.g. 00:1A:2B:3C:4D" />
          </div>
          <div class="form-group">
            <label for="node-purchase-date">Purchase Date</label>
            <input id="node-purchase-date" type="date" bind:value={topology.selectedNode.details.purchaseDate} />
          </div>
          <div class="form-group">
            <label for="node-last-maintenance">Last Maintenance</label>
            <input id="node-last-maintenance" type="date" bind:value={topology.selectedNode.details.lastMaintenance} />
          </div>
          <div class="divider"></div>
          <p class="section-title">Network Configuration</p>
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
              <label for="node-dhcp">DHCP Range</label>
              <input id="node-dhcp" type="text" bind:value={topology.selectedNode.details.dhcp} placeholder="e.g. 192.168.1.100-200" />
            </div>
            <div class="form-group">
              <label for="node-firewall">Firewall Status</label>
              <select id="node-firewall" bind:value={topology.selectedNode.details.firewall}>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          {:else if topology.selectedNode.type === 'ap'}
            <div class="form-group">
              <label for="node-ssid">SSID Name</label>
              <input id="node-ssid" type="text" bind:value={topology.selectedNode.details.ssid} placeholder="WiFi Name" />
            </div>
            <div class="form-group">
              <label for="node-vlan">VLAN ID</label>
              <input id="node-vlan" type="text" bind:value={topology.selectedNode.details.vlan} placeholder="e.g. 10" />
            </div>
          {:else if topology.selectedNode.type === 'camera'}
            <div class="form-group">
              <label for="node-resolution">Stream Resolution</label>
              <select id="node-resolution" bind:value={topology.selectedNode.details.resolution}>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div class="form-group">
              <label for="node-dvr">DVR Storage IP</label>
              <input id="node-dvr" type="text" bind:value={topology.selectedNode.details.dvrIp} placeholder="192.168.1.x" />
            </div>
          {:else if topology.selectedNode.type === 'switch'}
            <div class="form-group">
              <label for="node-vlans">Active VLANs</label>
              <input id="node-vlans" type="text" bind:value={topology.selectedNode.details.vlans} placeholder="e.g. 10,20,30" />
            </div>
            <div class="form-group">
              <label for="node-poe">PoE Status</label>
              <select id="node-poe" bind:value={topology.selectedNode.details.poe}>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          {:else if topology.selectedNode.type === 'server'}
            <div class="form-group">
              <label for="node-os">Operating System</label>
              <input id="node-os" type="text" bind:value={topology.selectedNode.details.os} placeholder="e.g. Ubuntu 22.04" />
            </div>
            <div class="form-group">
              <label for="node-storage">Storage Capacity</label>
              <input id="node-storage" type="text" bind:value={topology.selectedNode.details.storage} placeholder="e.g. 4TB RAID 1" />
            </div>
            <div class="form-group">
              <label for="node-ram">RAM</label>
              <input id="node-ram" type="text" bind:value={topology.selectedNode.details.ram} placeholder="e.g. 64GB" />
            </div>
          {:else if topology.selectedNode.type === 'computer'}
            <div class="form-group">
              <label for="node-user">Assigned User</label>
              <input id="node-user" type="text" bind:value={topology.selectedNode.details.user} placeholder="Employee Name" />
            </div>
            <div class="form-group">
              <label for="node-dept">Department</label>
              <input id="node-dept" type="text" bind:value={topology.selectedNode.details.department} placeholder="e.g. Finance" />
            </div>
            <div class="form-group">
              <label for="node-os">Operating System</label>
              <input id="node-os" type="text" bind:value={topology.selectedNode.details.os} placeholder="e.g. Windows 11" />
            </div>
          {:else}
            <div class="form-group">
              <label for="node-notes">Custom Notes</label>
              <textarea id="node-notes" rows="3" bind:value={topology.selectedNode.details.notes} placeholder="Additional info..."></textarea>
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
        <button class="btn" onclick={() => topology.isEditing = false}>Cancel</button>
        <button class="btn primary" onclick={handleSave}>Save</button>
      {:else}
        {#if topology.selectedNode}
          <button class="btn ticket-btn" onclick={openTicket} aria-label="Open Ticket">
            <Ticket size={16} strokeWidth={2} />
            Ticket
          </button>
        {/if}
        <div class="footer-actions">
          <button class="btn" onclick={handleDelete}>Delete</button>
          <button class="btn primary" onclick={handleEdit}>Edit</button>
        </div>
      {/if}
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

  .section-title {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 -8px 0;
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
    justify-content: space-between;
    align-items: center;
  }

  .footer-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .sidebar-footer .btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ticket-btn {
    color: #4f46e5;
    background: #eef2ff;
    border-color: #c7d2fe;
    font-weight: 600;
  }

  .ticket-btn:hover {
    background: #e0e7ff;
  }

  @media (max-width: 768px) {
    .sidebar {
      top: auto;
      bottom: 48px;
      right: 0;
      left: 0;
      width: 100vw;
      height: 55dvh;
      border-left: none;
      border-top: 1px solid var(--border);
      box-shadow: 0 -4px 16px rgba(0,0,0,0.05);
    }
    .sidebar-content {
      padding-bottom: 80px;
    }
    .sidebar-footer {
      padding-right: 88px; /* Prevent FAB from overlapping buttons */
    }
  }
</style>
