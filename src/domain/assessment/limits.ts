export interface FlightLimits {
  windMaxKmh?: number;
  gustMaxKmh?: number;
  precipitationMaxMm?: number;
  visibilityMinMeters?: number;
  temperatureMinC?: number;
  temperatureMaxC?: number;
  windReferenceHeight?: 10 | 100;
}

export const DEFAULT_LIMITS: FlightLimits = {};

export function hasAnyLimit(limits: FlightLimits): boolean {
  return (
    limits.windMaxKmh != null ||
    limits.gustMaxKmh != null ||
    limits.precipitationMaxMm != null ||
    limits.visibilityMinMeters != null ||
    limits.temperatureMinC != null ||
    limits.temperatureMaxC != null
  );
}
