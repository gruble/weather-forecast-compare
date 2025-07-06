export interface Forecast {
  time: Date;
  precipitation: number;
  temperature: number;
  symbol_code: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_max: number;
  precipitation_min: number;
  probability_of_precipitation: number;
}

export interface Location {
  name: string;
  lat: number;
  lon: number;
  kommune?: string;
  fylke?: string;
}
