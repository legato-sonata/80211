<script>
  class State {
    items = $state([{ id: 1, name: 'Main' }]);
    selectedId = $state(1);
    get selectedItem() { return this.items.find(i => i.id === this.selectedId); }
  }
  const state = new State();
</script>

<input type="text" bind:value={state.selectedItem.name} />
