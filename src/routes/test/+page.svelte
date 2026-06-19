<script>
  class State {
    items = $state([{ id: 1, name: 'Main' }]);
    selectedId = $state(1);
    get selectedItem() { return this.items.find(i => i.id === this.selectedId); }
  }
  const appState = new State();
</script>

<input type="text" bind:value={appState.selectedItem.name} />
