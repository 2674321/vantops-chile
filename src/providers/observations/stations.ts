export interface StationDef {
  icao: string;
  name: string;
  lat: number;
  lon: number;
}

export const CHILEAN_STATIONS: StationDef[] = [
  { icao: "SCER", name: "Arica", lat: -18.35, lon: -70.33 },
  { icao: "SCDA", name: "Iquique", lat: -20.53, lon: -70.18 },
  { icao: "SCFA", name: "Antofagasta", lat: -23.44, lon: -70.45 },
  { icao: "SCSE", name: "La Serena", lat: -29.91, lon: -71.2 },
  { icao: "SCEL", name: "Santiago", lat: -33.39, lon: -70.79 },
  { icao: "SCIE", name: "Concepción", lat: -36.77, lon: -73.06 },
  { icao: "SCTC", name: "Temuco", lat: -38.76, lon: -72.64 },
  { icao: "SCTE", name: "Puerto Montt", lat: -41.44, lon: -73.09 },
  { icao: "SCBA", name: "Balmaceda", lat: -45.92, lon: -71.85 },
  { icao: "SCCI", name: "Punta Arenas", lat: -53.0, lon: -70.85 },
  { icao: "SCIP", name: "Rapa Nui", lat: -27.16, lon: -109.43 },
];

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestStation(
  lat: number,
  lon: number
): { station: StationDef; distanceKm: number } {
  let best = CHILEAN_STATIONS[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const s of CHILEAN_STATIONS) {
    const d = haversineKm(lat, lon, s.lat, s.lon);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return { station: best, distanceKm: Math.round(bestDist) };
}
