<script>
  import { getTopology } from './context.js';
  import X from '@lucide/svelte/icons/x';
  import Ticket from '@lucide/svelte/icons/ticket';

  const topology = getTopology();

  function handleClose() {
    topology.isTicketsOpen = false;
  }
</script>

{#if topology.isTicketsOpen}
  <div class="sidebar-backdrop" onpointerdown={handleClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && handleClose()} aria-label="Close tickets"></div>
  <aside class="sidebar">
    <header class="sidebar-header">
      <div class="title">
        <Ticket size={20} color="var(--text-primary)" strokeWidth={1.5} />
        <h2>Support Tickets</h2>
      </div>
      <button class="icon-btn" onclick={handleClose} aria-label="Close">
        <X size={20} color="var(--text-primary)" strokeWidth={1.5} />
      </button>
    </header>

    <div class="sidebar-content">
      {#if topology.tickets && topology.tickets.length > 0}
        {#each topology.tickets as ticket (ticket.id)}
          {@const node = topology.nodes.find(n => n.id === ticket.nodeId)}
          <div class="ticket-card">
            <div class="ticket-header">
              <span class="ticket-title"><span class="status-dot {ticket.priority}"></span>{ticket.title}</span>
              <span class="ticket-status">{ticket.status}</span>
            </div>
            <div class="ticket-meta">
              <span>NODE: {node ? node.label : 'UNKNOWN'}</span>
              <span>PRIORITY: {ticket.priority.toUpperCase()}</span>
            </div>
            <div class="ticket-actions">
              <button class="btn" onclick={() => { topology.selectNode(ticket.nodeId); handleClose(); }}>VIEW NODE</button>
              <button class="btn primary" onclick={() => {
                topology.tickets = topology.tickets.filter(t => t.id !== ticket.id);
                topology.pushHistory();
              }}>RESOLVE</button>
            </div>
          </div>
        {/each}
      {:else}
        <div class="empty-state">
          <p>No active support tickets.</p>
          <p class="text-muted">All systems operational.</p>
        </div>
      {/if}
    </div>
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
    background: rgba(0, 0, 0, 0.2);
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 320px;
    height: 100dvh;
    background: #fff;
    border-right: 1px solid #000;
    display: flex;
    flex-direction: column;
    z-index: 30;
    color: #000;
    font-family: monospace;
  }

  .sidebar-header {
    padding: 12px 16px;
    border-bottom: 1px solid #000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title h2 {
    font-size: 0.9rem;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0;
    letter-spacing: 0.5px;
  }

  .icon-btn {
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    cursor: pointer;
    color: #000;
  }
  .icon-btn:hover {
    background: #000;
    color: #fff;
  }

  .sidebar-content {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ticket-card {
    border: 1px solid #000;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #fff;
    position: relative;
  }

  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
  }
  .status-dot.high { background: #555; }
  .status-dot.medium { background: #999; }
  .status-dot.low { background: #ccc; }
  
  /* User allowed low profile color for conditions */
  .status-dot.high { background: #cc0000; }
  .status-dot.medium { background: #cc8800; }
  .status-dot.low { background: #0066cc; }

  .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .ticket-title {
    font-size: 0.85rem;
    font-weight: bold;
  }

  .ticket-status {
    font-size: 0.65rem;
    font-weight: bold;
    text-transform: uppercase;
    border: 1px solid #000;
    padding: 1px 4px;
  }

  .ticket-meta {
    font-size: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ticket-actions {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }

  .btn {
    padding: 4px 8px;
    border: 1px solid #000;
    background: #fff;
    color: #000;
    font-size: 0.75rem;
    font-family: monospace;
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
    flex: 1;
  }

  .btn:hover {
    background: #eee;
  }

  .btn.primary {
    background: #000;
    color: #fff;
  }

  .btn.primary:hover {
    background: #333;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    border: 1px dashed #000;
  }

  .empty-state p {
    margin: 4px 0;
    font-weight: bold;
    font-size: 0.85rem;
  }

  .empty-state .text-muted {
    font-size: 0.75rem;
    color: #666;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 85vw;
    }
  }
</style>
