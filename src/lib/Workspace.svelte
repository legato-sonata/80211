<script>
  import { setTopology } from '$lib/context.js';
  import Canvas from '$lib/Canvas.svelte';
  import NodeSidebar from '$lib/NodeSidebar.svelte';
  import Toolbar from '$lib/Toolbar.svelte';
  import ActionSidebar from '$lib/ActionSidebar.svelte';
  import ReportModal from '$lib/ReportModal.svelte';
  import TerminalModal from '$lib/TerminalModal.svelte';

  import { untrack } from 'svelte';

  let { topology } = $props();
  setTopology(untrack(() => topology));

  $effect(() => {
    topology.validateNetwork();
  });
</script>

<div class="workspace-inner">
  <Canvas />
  {#if !topology.isUIHidden}
    <ActionSidebar />
    <Toolbar />
    <NodeSidebar />
  {/if}
  <ReportModal />
  {#if topology.isTerminalOpen && topology.selectedNode}
    <TerminalModal node={topology.selectedNode} onClose={() => topology.isTerminalOpen = false} />
  {/if}
</div>

<style>
  .workspace-inner {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
