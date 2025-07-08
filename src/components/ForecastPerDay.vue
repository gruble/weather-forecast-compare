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
          <th>Kl. 8-20</th>
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
            <a :href="getUrl(forecast)" target="_blank">{{ locationName }}</a>
          </td>
          <td v-for="date in days" :key="date" class="timeline-cell">
              <img class="weather-icon"
                v-if="get06ZEntry(forecast, date)?.data.next_12_hours?.summary.symbol_code"
                :src="`/assets/icons/${get06ZEntry(forecast, date)?.data.next_12_hours?.summary.symbol_code}.svg`"
                :alt="get06ZEntry(forecast, date)?.data.next_12_hours?.summary.symbol_code"
              />
              <div v-if="showTempAndPrecipitation" class="temp-and-precipitation">
                <span>{{ getTemperature(forecast, date)}}</span>
                <span>{{ getPrecipitation(forecast, date)}}</span>
              </div>
            
          </td>
          <td>
            <nve-button @click="removeLocation(locationName)" size="small" variant="text">
              <nve-icon name="delete"></nve-icon>
            </nve-button>
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
    <nve-checkbox :checked="showTempAndPrecipitation" @sl-change="toggleTempAndPrecipitation()">
      Vis temperatur og nedbør
    </nve-checkbox>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { completeForecasts } from "../stores/forecast.store";
import { removeLocation, removeAllLocations, addPremiumLocations, allPremiumAdded } from "../stores/location.store";
import type { CompleteForecast } from "../models/complete-forecast";
import 'nve-designsystem/components/nve-button/nve-button.component.js';
import 'nve-designsystem/components/nve-icon/nve-icon.component.js';
import 'nve-designsystem/components/nve-checkbox/nve-checkbox.component.js';

const showTempAndPrecipitation = ref(false);
showTempAndPrecipitation.value = JSON.parse(localStorage.getItem("showTempAndPrecipitation") || "false");

function toggleTempAndPrecipitation() {
  showTempAndPrecipitation.value = !showTempAndPrecipitation.value;
  localStorage.setItem("showTempAndPrecipitation", JSON.stringify(showTempAndPrecipitation.value));
}

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

function get12ZEntry(forecast: CompleteForecast, date: string) {
  return forecast.properties.timeseries.find(
    (entry) => entry.time === `${date}T12:00:00Z`
  );
}

function getMin(numbers: (number|undefined)[]): number|undefined { 
  const validNumbers = numbers.filter(n => n !== undefined);
  if (validNumbers.length === 0) return undefined;
  return Math.min(...validNumbers as number[]);
}

function getMax(numbers: (number|undefined)[]): number|undefined { 
  const validNumbers = numbers.filter(n => n !== undefined);
  if (validNumbers.length === 0) return undefined;
  return Math.max(...validNumbers as number[]);
}

function getTemperature(forecast: CompleteForecast, date: string): string {
  const prognosis06to12 = get06ZEntry(forecast, date)?.data.next_6_hours?.details;
  const prognosis12to18 = get12ZEntry(forecast, date)?.data.next_6_hours?.details;
  const minTemp = getMin([prognosis06to12?.air_temperature_min, prognosis12to18?.air_temperature_min]);
  const maxTemp = getMax([prognosis06to12?.air_temperature_max, prognosis12to18?.air_temperature_max]);
  return formatNumbers(minTemp, maxTemp, "°C");
}

function getPrecipitation(forecast: CompleteForecast, date: string): string {
  const prognosis06to12 = get06ZEntry(forecast, date)?.data.next_6_hours?.details;
  const prognosis12to18 = get12ZEntry(forecast, date)?.data.next_6_hours?.details;
  const minPrecipitation = getMin([prognosis06to12?.precipitation_amount_min, prognosis12to18?.precipitation_amount_min]);
  const maxPrecipitation = getMax([prognosis06to12?.precipitation_amount_max, prognosis12to18?.precipitation_amount_max]);
  return formatNumbers(minPrecipitation, maxPrecipitation, "mm");
}

function formatNumbers(value1: number | undefined, value2: number | undefined, unit: string): string {
  const formatted1 = formatNumber(value1);
  const formatted2 = formatNumber(value2);
  if (formatted1 == formatted2) {
    return `${formatted1}${unit}`;
  }
  return `${formatted1}-${formatted2}${unit}`;
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || isNaN(value)) {
    return "?";
  }
  return value.toFixed(0);
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
.timeline-table {
  overflow-x: auto;
  max-height: 86vh;
}
table {
  border-collapse: collapse;
  width: 100%;
}
th, td {
  font: var(--body-medium);
  border: 1px solid #ddd;
  padding: 1px 2px;
  text-align: center;
}
thead th {
  position: sticky;
  top: 0;
  background: white; /* eller ønsket bakgrunnsfarge */
  z-index: 2;
}
th:first-child,
td:first-child,
.location-col {
  min-width: 50px;
  max-width: 80px; 
  word-break: break-word;
  text-align: left;
}
.toolbar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.new-location {
  background: lightgreen;
  transition: background 0.5s;
}
@media screen and (min-width: 500px) {
  .temp-and-precipitation {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-size: x-small;
  }
}
@media screen and (max-width: 499px) {
  .temp-and-precipitation {
    display: none;
  }
  nve-checkbox {
    display: none;
  }
}
.weather-icon {
  /* width: 1.5rem;
  height: 1.5rem; */
    display: block;
  margin-left: auto;
  margin-right: auto;
  max-height: 3rem;
}
nve-button {
  min-width: 2rem;
  min-height: 2rem;
}
</style>