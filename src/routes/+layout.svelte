<script>
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>80211 Topology</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Intuitive and beautiful network topology visualizer for store POS systems" />
</svelte:head>

<main class="app-container">
  {@render children()}
</main>

<style>
  .app-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
