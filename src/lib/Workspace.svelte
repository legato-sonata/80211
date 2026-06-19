<script>
  import { setTopology } from '$lib/context.js';
  import Canvas from '$lib/Canvas.svelte';
  import NodeSidebar from '$lib/NodeSidebar.svelte';
  import Toolbar from '$lib/Toolbar.svelte';
  import ActionSidebar from '$lib/ActionSidebar.svelte';
  import ReportModal from '$lib/ReportModal.svelte';

  let { topology } = $props();
  setTopology(topology);
</script>

<div class="workspace-inner">
  <Canvas />
  {#if !topology.isUIHidden}
    <ActionSidebar />
    <Toolbar />
    <NodeSidebar />
  {/if}
  <ReportModal />
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
