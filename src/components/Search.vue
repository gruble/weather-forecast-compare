<!-- Tilbyr søk på stedsnavn i Norge og å lagre de som favoritt-steder -->
<template>
  <div style="position: relative;">
    <nve-input
      v-model="query"
      @input="onSearch"
      @keydown.down.prevent="moveSelection(1)"
      @keydown.up.prevent="moveSelection(-1)"
      @keydown.enter.prevent="selectHighlighted"
      placeholder="Søk etter sted..."
      type="text"
      ref="searchInput"
    />
    <div
      v-if="results.length"
      class="search-overlay"
    >
      <ul>
        <li
          v-for="(loc, idx) in results"
          :key="loc.name"
          :class="{ highlighted: idx === highlightedIndex }"
          @click="selectLocation(loc)"
        >
          {{ loc.name }}
          <span v-if="loc.kommune || loc.fylke">
            ({{ [loc.kommune, loc.fylke].filter(Boolean).join(", ") }})
          </span>
        </li>
      </ul>
    </div>
    <div v-if="loading">Søker...</div>
    <div v-if="error" style="color: red">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { addLocation, searchLocations, locations } from "../stores/location.store";
import type { Location } from "../models/models";
import 'nve-designsystem/components/nve-input/nve-input.component.js';

const query = ref("");
const results = ref<Location[]>([]);
const loading = ref(false);
const error = ref("");
const selected = ref<Location | null>(null);
const highlightedIndex = ref(-1);

let searchTimeout: number | undefined;

function onSearch() {
  error.value = "";
  results.value = [];
  highlightedIndex.value = -1;
  if (searchTimeout) clearTimeout(searchTimeout);
  if (query.value.length < 2) return;

  loading.value = true;
  searchTimeout = window.setTimeout(async () => {
    try {
      results.value = await searchLocations(query.value + "*");
    } catch (e) {
      error.value = "Kunne ikke hente stedsnavn";
    } finally {
      loading.value = false;
    }
  }, 400);
}

function moveSelection(dir: number) {
  if (!results.value.length) return;
  highlightedIndex.value += dir;
  if (highlightedIndex.value < 0) highlightedIndex.value = results.value.length - 1;
  if (highlightedIndex.value >= results.value.length) highlightedIndex.value = 0;
}

function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < results.value.length) {
    selectLocation(results.value[highlightedIndex.value]);
  }
}

function selectLocation(loc: Location) {
  selected.value = loc;
  results.value = [];
  query.value = "";
  addLocation(loc);
  highlightedIndex.value = -1;
}
</script>

<style scoped>
.search-overlay {
  position: absolute;
  top: 2.5em;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  z-index: 10;
  max-height: 250px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.search-overlay ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.search-overlay li {
  padding: 8px 12px;
  cursor: pointer;
}
.search-overlay li:hover {
  background: #f0f0f0;
}
.highlighted {
  background: #e0e0e0;
}
</style>