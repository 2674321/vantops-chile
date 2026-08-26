export type AircraftType =
  | "MULTIROTOR"
  | "FIXED_WING"
  | "VTOL"
  | "HELICOPTER"
  | "OTHER";

export interface AircraftProfile {
  id: string;
  name: string;
  type?: AircraftType;
  manufacturer?: string;
  model?: string;
  windMaxKmh?: number;
  gustMaxKmh?: number;
}

export const AIRCRAFT_TYPE_LABELS: Record<AircraftType, string> = {
  MULTIROTOR: "Multirrotor",
  FIXED_WING: "Ala fija",
  VTOL: "VTOL",
  HELICOPTER: "Helicóptero",
  OTHER: "Otro",
};

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
