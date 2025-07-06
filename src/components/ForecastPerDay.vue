<!-- Viser grovt værvarsel for neste 8 dager for aktuelle lokasjoner -->
<template>
  <div class="timeline-table">
    <table>
      <colgroup>
        <col class="location-col" />
        <col v-for="date in days" :key="date" />
      </colgroup>
      <thead>
        <tr>
          <th>Prognose kl. 8-20</th>
          <th v-for="date in days" :key="date">{{ formatDay(date) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="([locationName, forecast]) in sortedLocations"
          :key="locationName"
          :class="{ 'new-location': newLocations.includes(locationName) }"
        >
          <td>
            <nve-button @click="removeLocation(locationName)" size="small" variant="text">
              <nve-icon name="delete"></nve-icon>
            </nve-button>
            <a :href="getUrl(forecast)" target="_blank">{{ locationName }}</a>
          </td>
          <td v-for="date in days" :key="date" class="timeline-cell">
            <div v-if="get06ZEntry(forecast, date)">
              <img
                v-if="get06ZEntry(forecast, date)?.data.next_12_hours?.summary.symbol_code"
                :src="`assets/icons/${get06ZEntry(forecast, date)?.data.next_12_hours?.summary.symbol_code}.svg`"
                :alt="get06ZEntry(forecast, date)?.data.next_12_hours?.summary.symbol_code"
                width="40"
                height="40"
              />
              <div v-else>-</div>
            </div>
            <div v-else>-</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="toolbar">
    <nve-button :disabled="sortedLocations.length == 0" @click="removeAllLocations()">
      Fjern alle 
      <nve-icon slot="prefix" name="delete"></nve-icon>
    </nve-button>
    <nve-button :disabled="allPremiumAdded" @click="addPremiumLocations()">
      Legg til predefinerte steder 
      <nve-icon slot="prefix" name="Favorite"></nve-icon>
    </nve-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { completeForecasts } from "../stores/forecast.store";
import { removeLocation, removeAllLocations, addPremiumLocations, allPremiumAdded } from "../stores/location.store";
import type { CompleteForecast } from "../models/complete-forecast";
import 'nve-designsystem/components/nve-button/nve-button.component.js';
import 'nve-designsystem/components/nve-icon/nve-icon.component.js';

// Finn alle unike datoer med 06:00Z-prognose
const days = computed(() => {
  const allDates = new Set<string>();
  for (const forecast of Object.values(completeForecasts.value)) {
    forecast.properties.timeseries.forEach((entry) => {
      if (
        entry.time.endsWith("T06:00:00Z") &&
        entry.data.next_12_hours
      ) {
        allDates.add(entry.time.slice(0, 10));
      }
    });
  }
  return Array.from(allDates).sort();
});

const getUrl = (forecast: CompleteForecast) => {
  return `https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/${forecast.geometry.coordinates[1]},${forecast.geometry.coordinates[0]}`;
};

// Sorter lokasjoner på breddegrad (lat)
const sortedLocations = computed(() =>
  Object.entries(completeForecasts.value)
    .sort(([, a], [, b]) => {
      // Finn breddegrad fra geojson/geometri eller properties
      const latA = a.geometry?.coordinates?.[1] ?? 0;
      const latB = b.geometry?.coordinates?.[1] ?? 0;
      return latB - latA; // Nord til sør (høyest først)
    })
);

const newLocations = ref<string[]>([]);

// Lytt på endringer i completeForecasts og marker nye lokasjoner
watch(
  () => Object.keys(completeForecasts.value),
  (newKeys, oldKeys) => {
    const added = newKeys.filter(k => !oldKeys.includes(k));
    for (const name of added) {
      newLocations.value.push(name);
      setTimeout(() => {
        newLocations.value = newLocations.value.filter(n => n !== name);
      }, 5000); // Marker i 2 sekunder
    }
  }
);

function get06ZEntry(forecast: CompleteForecast, date: string) {
  return forecast.properties.timeseries.find(
    (entry) => entry.time === `${date}T06:00:00Z`
  );
}

function formatDay(date: string) {
  const d = new Date(date);
  const weekday = d.toLocaleDateString("nb-NO", { weekday: "short" });
  const day = d.getDate().toString();
  const month = (d.getMonth() + 1).toString();
  return `${weekday.replace(".", "")} ${day}/${month}`;
}
</script>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
  overflow-x: auto;
  /* table-layout: auto; */
}
th, td {
  font: var(--body-small);
  border: 1px solid #ddd;
  padding: 4px 8px;
  text-align: center;
}
th:first-child,
td:first-child,
.location-col {
  width: 1%;
  min-width: 60px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
.toolbar {
  display: flex;
  gap: 0.5rem;
}
.new-location {
  background: lightgreen;
  transition: background 0.5s;
}
</style>