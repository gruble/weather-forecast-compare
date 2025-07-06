import { ref, watch } from "vue";
import { locations } from "./location.store";
import type { Location } from "../models/models";
import type { CompleteForecast } from "../models/complete-forecast";

export const completeForecasts = ref<Record<string, CompleteForecast>>({});
export const isLoading = ref(false);
export const error = ref<string>("");
export const times = ref<string[]>([]);

isLoading.value = true;
error.value = "";
fetchForecasts(locations.value);

async function fetchForecasts(locations: Location[]) {
  isLoading.value = true;
  error.value = "";
  try {
    console.log("Henter værvarsel...");
    for (const location of locations) {
      console.log(`Henter varsel for ${location.name}...`);
      const response = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${location.lat}&lon=${location.lon}`
      );
      const data: CompleteForecast = await response.json();
      completeForecasts.value[location.name] = {
        ...data,
        location,
      };
    }
  } catch (e) {
    error.value = "Failed to fetch weather data: " + e.message;
  } finally {
    isLoading.value = false;
  }
  console.log("Ferdig med å hente værvarsel");
}

watch(
  locations,
  async (locations) => {
    /// Finn alle navn på aktive lokasjoner
    const activeNames = locations.map((loc) => loc.name);

    // Slett varsler for lokasjoner som ikke lenger finnes
    Object.keys(completeForecasts.value).forEach((name) => {
      if (!activeNames.includes(name)) {
        delete completeForecasts.value[name];
      }
    });

    fetchForecasts(locations);
  },
  { deep: true }
);
