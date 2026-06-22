<script>
  import { getTopology } from './context.js';
  import X from '@lucide/svelte/icons/x';
  import Server from '@lucide/svelte/icons/server';
  import Router from '@lucide/svelte/icons/router';
  import MonitorSmartphone from '@lucide/svelte/icons/monitor-smartphone';
  import Wifi from '@lucide/svelte/icons/wifi';
  import CreditCard from '@lucide/svelte/icons/credit-card';
  import PrinterIcon from '@lucide/svelte/icons/printer';
  import Monitor from '@lucide/svelte/icons/monitor';
  import HardDrive from '@lucide/svelte/icons/hard-drive';
  import Camera from '@lucide/svelte/icons/camera';
  import Network from '@lucide/svelte/icons/network';

  const topology = getTopology();

  const iconMap = {
    server: Server,
    router: Router,
    switch: Network,
    ap: Wifi,
    computer: Monitor,
    pos: CreditCard,
    printer: PrinterIcon,
    storage: HardDrive,
    camera: Camera,
    mobile: MonitorSmartphone
  };

  function getIcon(type) {
    return iconMap[type] || Monitor;
  }

  let connectedPeers = $derived.by(() => {
    if (!topology.selectedNode) return [];
    const nodeId = topology.selectedNode.id;
    const links = topology.links.filter(l => l.source === nodeId || l.target === nodeId);
    return links.slice(0, 3).map(link => {
      const isSource = link.source === nodeId;
      const peerId = isSource ? link.target : link.source;
      const peer = topology.nodes.find(n => n.id === peerId);
      return { peer, link, isSource };
    });
  });

  let showMacWarning = $state(false);
  let macWarningTimeout;

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

  let isComposing = false;

  function enforceMacFormat(e) {
    const original = e.target.value;
    let val = original.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    
    // Check if an invalid character (not hex and not colon) was just typed
    if (original.length > val.length && /[^a-fA-F0-9:]/i.test(original)) {
      showMacWarning = true;
      clearTimeout(macWarningTimeout);
      macWarningTimeout = setTimeout(() => showMacWarning = false, 2500);
    }

    let formatted = '';
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 2 === 0 && i < 12) formatted += ':';
      formatted += val[i];
    }
    
    formatted = formatted.substring(0, 17);

    e.target.value = formatted;
    topology.selectedNode.details.serial = formatted;
  }

  function formatMacAddress(e) {
    if (!isComposing) enforceMacFormat(e);
  }

  function handleMacCompositionEnd(e) {
    isComposing = false;
    enforceMacFormat(e);
  }

  function enforceIpFormat(e, field) {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    val = val.replace(/\.+/g, '.'); // collapse multiple dots
    if (val.startsWith('.')) val = val.substring(1);
    
    let parts = val.split('.');
    
    // Auto-split blocks longer than 3 digits (e.g. typing 192168 quickly)
    let newParts = [];
    for (let i = 0; i < parts.length; i++) {
      let p = parts[i];
      if (p === '') {
        newParts.push('');
        continue;
      }
      while (p.length > 3) {
        newParts.push(p.substring(0, 3));
        p = p.substring(3);
      }
      newParts.push(p);
    }
    parts = newParts;

    if (parts.length > 4) parts = parts.slice(0, 4);
    
    val = parts.map(p => {
      if (p === '') return p;
      let num = parseInt(p, 10);
      if (num > 255) return '255';
      return p; 
    }).join('.');

    // Auto-dot feature
    const prevVal = topology.selectedNode[field] || '';
    if (e.target.value.length > prevVal.length) {
      const finalParts = val.split('.');
      if (finalParts.length > 0 && finalParts.length < 4) {
        const lastPart = finalParts[finalParts.length - 1];
        if (lastPart.length === 3) {
          val += '.';
        }
      }
    }

    // ALWAYS update DOM to strip invalid chars instantly
    e.target.value = val;
    topology.selectedNode[field] = val;
  }

  function formatIpAddress(e, field) {
    if (!isComposing) enforceIpFormat(e, field);
  }

  function handleIpCompositionEnd(e, field) {
    isComposing = false;
    enforceIpFormat(e, field);
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
        {#if connectedPeers.length > 0}
          <div class="connections-preview">
            <p class="section-title">Direct Connections</p>
            <div class="connections-list">
              {#each connectedPeers as {peer, link}}
                <div class="connection-item">
                  <div class="node-icon peer" class:offline={peer?.status === 'offline'} title={peer?.label || 'Unknown'}>
                    <svelte:component this={getIcon(peer?.type)} size={16} />
                  </div>
                  <div class="cable-view" class:offline={link.status === 'offline'}>
                    <div class="cable-line"></div>
                    <span class="cable-text">{link.type} • {link.status}</span>
                  </div>
                  <div class="node-icon target" class:offline={topology.selectedNode.status === 'offline'} title={topology.selectedNode.label}>
                    <svelte:component this={getIcon(topology.selectedNode.type)} size={16} />
                  </div>
                </div>
              {/each}
            </div>
            {#if topology.links.filter(l => l.source === topology.selectedNode.id || l.target === topology.selectedNode.id).length > 3}
              <div class="helper-text text-muted" style="text-align: center; margin-top: 8px;">+ {topology.links.filter(l => l.source === topology.selectedNode.id || l.target === topology.selectedNode.id).length - 3} more connections</div>
            {/if}
          </div>
          <div class="divider"></div>
        {/if}

        {#if topology.isEditing}
          <p class="section-title">Asset Information</p>
          <div class="form-group">
            <label for="node-label">Label</label>
            <input id="node-label" type="text" bind:value={topology.selectedNode.label} />
          </div>
          <div class="form-group">
            <label for="node-vendor">Vendor / Model</label>
            <input id="node-vendor" type="text" bind:value={topology.selectedNode.vendor} placeholder="e.g. Cisco Catalyst 9300" />
          </div>
          <div class="form-group">
            <label for="node-serial">Serial / MAC Address</label>
            <input id="node-serial" class={showMacWarning ? 'input-error' : ''} type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value={topology.selectedNode.details.serial || ''} oncompositionstart={() => isComposing = true} oncompositionend={handleMacCompositionEnd} oninput={formatMacAddress} placeholder="e.g. 00:1A:2B:3C:4D:5E" maxlength="17" />
            {#if showMacWarning}
              <span class="helper-text error-text">Only Hexadecimal (0-9, A-F) allowed!</span>
            {/if}
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
            <label for="node-allocation">IP Allocation</label>
            <select id="node-allocation" bind:value={topology.selectedNode.ipAllocation}>
              <option value="static">Static IP</option>
              <option value="dhcp">DHCP (Auto)</option>
            </select>
          </div>
          {#if topology.selectedNode.ipAllocation !== 'dhcp'}
            <div class="form-group">
              <label for="node-ip">IP Address</label>
              <input id="node-ip" type="text" inputmode="decimal" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value={topology.selectedNode.ip} oncompositionstart={() => isComposing = true} oncompositionend={(e) => handleIpCompositionEnd(e, 'ip')} oninput={(e) => formatIpAddress(e, 'ip')} placeholder="192.168.1.x" />
            </div>
            <div class="form-group">
              <label for="node-subnet">Subnet Mask</label>
              <input id="node-subnet" type="text" inputmode="decimal" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value={topology.selectedNode.subnet} oncompositionstart={() => isComposing = true} oncompositionend={(e) => handleIpCompositionEnd(e, 'subnet')} oninput={(e) => formatIpAddress(e, 'subnet')} placeholder="255.255.255.0" />
            </div>
            <div class="form-group">
              <label for="node-gateway">Default Gateway</label>
              <input id="node-gateway" type="text" inputmode="decimal" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value={topology.selectedNode.gateway} oncompositionstart={() => isComposing = true} oncompositionend={(e) => handleIpCompositionEnd(e, 'gateway')} oninput={(e) => formatIpAddress(e, 'gateway')} placeholder="192.168.1.1" />
            </div>
          {/if}
          {#if topology.selectedNode.ipAllocation === 'dhcp'}
            <div class="info-group" style="margin-bottom: 8px;">
              <span class="info-label">IP Address</span>
              <span class="info-value text-muted">{topology.selectedNode.ip === 'Auto' ? 'Auto Assigned' : topology.selectedNode.ip === 'Disconnected' ? 'Disconnected' : `${topology.selectedNode.ip} (DHCP)`}</span>
            </div>
          {/if}
          <div class="form-group">
            <label for="node-power">Power State</label>
            <select id="node-power" bind:value={topology.selectedNode.power}>
              <option value={true}>ON</option>
              <option value={false}>OFF</option>
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
              <label for="node-domain">Domain Name</label>
              <input id="node-domain" type="text" bind:value={topology.selectedNode.details.domain} placeholder="e.g. srv.company.com" />
            </div>
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
          {#if topology.selectedNode.vendor}
            <div class="info-group">
              <span class="info-label">Vendor/Model</span>
              <span class="info-value">{topology.selectedNode.vendor}</span>
            </div>
          {/if}
          <div class="info-group">
            <span class="info-label">Allocation</span>
            <span class="info-value">{topology.selectedNode.ipAllocation === 'dhcp' ? 'DHCP' : 'Static'}</span>
          </div>
          {#if topology.selectedNode.ipAllocation !== 'dhcp'}
            <div class="info-group">
              <span class="info-label">IP Address</span>
              <span class="info-value">{topology.selectedNode.ip}</span>
            </div>
            <div class="info-group">
              <span class="info-label">Subnet Mask</span>
              <span class="info-value">{topology.selectedNode.subnet || '-'}</span>
            </div>
            <div class="info-group">
              <span class="info-label">Default Gateway</span>
              <span class="info-value">{topology.selectedNode.gateway || '-'}</span>
            </div>
          {:else}
            <div class="info-group">
              <span class="info-label">IP Address</span>
              <span class="info-value text-muted">{topology.selectedNode.ip === 'Auto' ? 'Auto Assigned' : topology.selectedNode.ip === 'Disconnected' ? 'Disconnected' : `${topology.selectedNode.ip} (DHCP)`}</span>
            </div>
          {/if}
          <div class="info-group">
            <span class="info-label">Power</span>
            <span class="info-value">{topology.selectedNode.power === false ? 'OFF' : 'ON'}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Network Status</span>
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
        <div class="footer-actions">
          {#if topology.selectedNode}
            <button class="btn terminal-btn" onclick={() => topology.isTerminalOpen = true} aria-label="Open Terminal">
              <Terminal size={16} strokeWidth={2} />
              CLI
            </button>
          {/if}
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

  .helper-text {
    font-size: 0.7rem;
    margin-top: -2px;
    animation: fadeIn 0.2s ease-out;
  }

  .error-text {
    color: #ef4444;
    font-weight: 500;
  }

  .input-error {
    border-color: #ef4444 !important;
    background-color: #fef2f2;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .connections-preview {
    margin-bottom: 20px;
  }

  .connections-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .connection-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--surface-hover);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .node-icon.offline {
    color: var(--text-secondary);
    opacity: 0.5;
  }

  .cable-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    margin: 0 12px;
  }

  .cable-line {
    width: 100%;
    border-top: 2px solid var(--primary);
    margin-bottom: 4px;
  }

  .cable-view.offline .cable-line {
    border-top: 2px dashed #ef4444;
  }

  .cable-text {
    font-size: 0.65rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .footer-actions {
    display: flex;
    gap: 8px;
  }

  .sidebar-footer .btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .terminal-btn {
    color: #000;
    background: #fff;
    border: 1px solid #000;
    font-weight: 600;
  }

  .terminal-btn:hover {
    background: #f0f0f0;
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
      padding: 16px 20px;
    }
  }
</style>
