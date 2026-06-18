import { getContext, setContext } from 'svelte';
import { TopologyState } from './TopologyState.svelte.js';

const KEY = Symbol('topology');

export function setTopology() {
  const state = new TopologyState();
  setContext(KEY, state);
  return state;
}

export function getTopology() {
  return getContext(KEY);
}
