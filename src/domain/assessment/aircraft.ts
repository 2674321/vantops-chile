export interface AircraftProfile {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  windMaxKmh?: number;
  gustMaxKmh?: number;
}

export function applyAircraftLimits(
  base: import("./limits").FlightLimits,
  aircraft?: AircraftProfile
): import("./limits").FlightLimits {
  if (!aircraft) return base;
  return {
    ...base,
    windMaxKmh: base.windMaxKmh ?? aircraft.windMaxKmh,
    gustMaxKmh: base.gustMaxKmh ?? aircraft.gustMaxKmh,
  };
}
