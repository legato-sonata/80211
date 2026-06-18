<script>
  import { setTopology } from '$lib/context.js';
  import Canvas from '$lib/Canvas.svelte';
  import NodeSidebar from '$lib/NodeSidebar.svelte';
  import Toolbar from '$lib/Toolbar.svelte';
  import ActionSidebar from '$lib/ActionSidebar.svelte';

  const topology = setTopology();
</script>

<div class="workspace">
  <Canvas />
  <ActionSidebar />
  <Toolbar />
  <NodeSidebar />
</div>

<style>
  .workspace {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    overflow: hidden;
  }
</style>
