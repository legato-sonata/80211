<script>
  import { getTopology } from './context.js';
  import X from '@lucide/svelte/icons/x';
  import Download from '@lucide/svelte/icons/download';

  const topology = getTopology();

  function generateFilename(suffix, ext) {
    const slug = (topology.name || 'topology').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const hms = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    return `${slug}_${suffix}_${ymd}_${hms}.${ext}`;
  }

  function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  function exportCSV() {
    let csv = "ID,Type,Label,IP Address,Status,Serial/MAC,Purchase Date,Last Maintenance\n";
    topology.nodes.forEach(n => {
      csv += `"${n.id}","${n.type.toUpperCase()}","${n.label}","${n.ip}","${n.status.toUpperCase()}","${n.details.serial || ''}","${n.details.purchaseDate || ''}","${n.details.lastMaintenance || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, generateFilename('report', 'csv'));
    URL.revokeObjectURL(url);
  }
</script>

{#if topology.isReportOpen}
  <div class="report-modal">
    <header class="report-header">
      <div class="header-titles">
        <h2>IT Asset & Status Report</h2>
        <p class="subtitle">Live Network Overview</p>
      </div>
      <button class="icon-btn" onclick={() => topology.isReportOpen = false} aria-label="Close Report">
        <X size={24} color="var(--text-primary)" strokeWidth={1.5} />
      </button>
    </header>

    <div class="report-content">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Serial / MAC</th>
              <th>Purchase Date</th>
              <th>Maintenance</th>
            </tr>
          </thead>
          <tbody>
            {#each topology.nodes as node}
              <tr>
                <td class="col-type">{node.type.toUpperCase()}</td>
                <td class="col-label">{node.label}</td>
                <td class="col-ip">{node.ip}</td>
                <td class="col-status">
                  <span class="status-badge {node.status}">{node.status.toUpperCase()}</span>
                </td>
                <td class="col-serial">{node.details.serial || '-'}</td>
                <td class="col-date">{node.details.purchaseDate || '-'}</td>
                <td class="col-date">{node.details.lastMaintenance || '-'}</td>
              </tr>
            {/each}
            {#if topology.nodes.length === 0}
              <tr>
                <td colspan="7" class="empty-state">No devices found in the network.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <footer class="report-footer">
      <button class="btn primary" onclick={exportCSV}>
        <Download size={18} strokeWidth={2} />
        Export CSV
      </button>
    </footer>
  </div>
{/if}

<style>
  .report-modal {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-color);
  }

  .header-titles h2 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
  }

  .subtitle {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 2px 0 0 0;
  }

  .icon-btn {
    border: none;
    background: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    background: rgba(0,0,0,0.05);
  }

  .report-content {
    flex: 1;
    overflow: hidden; /* we scroll the table container */
    background: var(--bg-color);
  }

  .table-container {
    height: 100%;
    overflow: auto;
    padding: 0 16px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
    background: var(--surface);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
    font-size: 0.85rem;
  }

  th {
    background: #f4f4f5;
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.75rem;
    text-transform: uppercase;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  td {
    color: var(--text-primary);
  }

  tr:last-child td {
    border-bottom: none;
  }

  .col-type {
    font-weight: 600;
    font-size: 0.75rem;
  }

  .col-ip, .col-serial, .col-date {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .status-badge.online {
    background: #eef2ff;
    color: #4f46e5;
  }

  .status-badge.warning {
    background: #fffbeb;
    color: #d97706;
  }

  .status-badge.offline {
    background: #fef2f2;
    color: #dc2626;
  }

  .empty-state {
    text-align: center;
    padding: 40px !important;
    color: var(--text-secondary);
    font-style: italic;
  }

  .report-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
  }

  .btn.primary {
    background: var(--text-primary);
    color: var(--surface);
    border: none;
  }

  @media (max-width: 768px) {
    th, td {
      padding: 10px 12px;
      white-space: nowrap; /* keep things legible by forcing scroll */
    }
  }
</style>
