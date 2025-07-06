import { Location } from "../models/models";
import { computed, ref, Ref, watch } from "vue";

const storedLocations = localStorage.getItem("locations");

export const locations: Ref<Location[]> = ref(
  // henter lokasjoner fra localStorage, eller bruk en tom liste hvis det ikke finnes noen
  storedLocations ? JSON.parse(storedLocations) : []
);

const premiumLocations = [
  { name: "Oslo", lat: 59.9139, lon: 10.7522 },
  { name: "Kristiansand", lat: 58.1467, lon: 7.9956 },
  { name: "Sotra", lat: 60.306, lon: 5.076 },
  { name: "Henningsvær", lat: 68.1553, lon: 14.2085 },
  { name: "Trondheim", lat: 63.4305, lon: 10.3951 },
  { name: "Åndalsnes", lat: 62.5645, lon: 7.6947 },
  { name: "Ålesund", lat: 62.4722, lon: 6.1549 },
  { name: "Stavanger", lat: 58.969, lon: 5.7331 },
  { name: "Sandnessjøen", lat: 66.0217, lon: 12.6316 },
  { name: "Kvaløya", lat: 69.7, lon: 18.65 },
  { name: "Efjorden", lat: 68.1833, lon: 15.8333 },
  { name: "Fjällbacka", lat: 58.5972, lon: 11.2847 },
  { name: "Uskedalen", lat: 59.93, lon: 5.9 },
  { name: "Skagastølstindene", lat: 61.4606, lon: 7.8717 },
  { name: "Sogndal", lat: 61.2296, lon: 7.1006 },
  { name: "Stockholm", lat: 59.3293, lon: 18.0686 },
  { name: "Vänern", lat: 58.85, lon: 13.3167 },
  { name: "Flatanger", lat: 64.4967, lon: 10.9631 },
  { name: "Værlandet", lat: 61.3256, lon: 4.9547 },
];

export const allPremiumAdded = computed(() =>
  premiumLocations.every((prem) =>
    locations.value.some(
      (loc) =>
        loc.name === prem.name && loc.lat === prem.lat && loc.lon === prem.lon
    )
  )
);
export const addPremiumLocations = () => {
  premiumLocations.forEach((loc) => {
    addLocation(loc);
  });
};

export async function searchLocations(query: string): Promise<Location[]> {
  const url = `https://api.kartverket.no/stedsnavn/v1/navn?sok=${encodeURIComponent(
    query
  )}&treffPerSide=20`;
  const response = await fetch(url);
  const data = await response.json();

  return (data.navn || []).map((item: any) => {
    const isKommuneOrFylke =
      item.navneobjekttype === "Kommune" || item.navneobjekttype === "Fylke";
    const kommune = item.kommuner?.[0]?.kommunenavn ?? "";
    const fylke = item.fylker?.[0]?.fylkesnavn ?? "";
    return {
      name: item.skrivemåte,
      lat: item.representasjonspunkt.nord,
      lon: item.representasjonspunkt.øst,
      ...(isKommuneOrFylke
        ? {}
        : {
            kommune,
            ...(kommune && fylke && kommune !== fylke ? { fylke } : {}),
          }),
    };
  });
}

export function addLocation(location: Location) {
  if (!locations.value.some((loc) => loc.name === location.name)) {
    locations.value.push(location);
  } else {
    console.warn(`Location ${location.name} already exists.`);
  }
}

export function removeLocation(locationName: string) {
  const index = locations.value.findIndex((loc) => loc.name === locationName);
  if (index !== -1) {
    locations.value.splice(index, 1);
  }
}

export function removeAllLocations() {
  locations.value = [];
}

watch(
  locations,
  (val) => {
    localStorage.setItem("locations", JSON.stringify(val));
  },
  { deep: true }
);
