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
          <div class="ticket-card {ticket.priority}">
            <div class="ticket-header">
              <span class="ticket-title">{ticket.title}</span>
              <span class="ticket-status">{ticket.status}</span>
            </div>
            <div class="ticket-meta">
              <span>Node: {node ? node.label : 'Unknown'}</span>
              <span>Priority: {ticket.priority}</span>
            </div>
            <div class="ticket-actions">
              <button class="btn btn-small" onclick={() => { topology.selectNode(ticket.nodeId); handleClose(); }}>View Node</button>
              <button class="btn btn-small primary" onclick={() => {
                topology.tickets = topology.tickets.filter(t => t.id !== ticket.id);
                topology.pushHistory();
              }}>Resolve</button>
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
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 320px;
    height: 100dvh;
    background: var(--surface);
    border-right: 1px solid var(--border);
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

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .icon-btn {
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 4px;
    cursor: pointer;
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

  .ticket-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(255, 255, 255, 0.5);
  }

  .ticket-card.high { border-left: 4px solid #ef4444; }
  .ticket-card.medium { border-left: 4px solid #f59e0b; }
  .ticket-card.low { border-left: 4px solid #3b82f6; }

  .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .ticket-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .ticket-status {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    background: #e2e8f0;
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-secondary);
  }

  .ticket-meta {
    font-size: 0.75rem;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ticket-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .btn {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    flex: 1;
  }

  .btn.primary {
    background: var(--text-primary);
    color: var(--surface);
    border-color: var(--text-primary);
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
  }

  .empty-state p {
    margin: 4px 0;
    font-weight: 500;
    color: var(--text-primary);
  }

  .empty-state .text-muted {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 85vw;
    }
  }
</style>
