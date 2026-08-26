export type AssessmentStatus = "FAVORABLE" | "CAUTION" | "UNFAVORABLE" | "NO_DATA";

export type ReasonSeverity = "info" | "warning" | "critical";

export interface AssessmentReason {
  code: string;
  severity: ReasonSeverity;
  message: string;
  source?: string;
}

export interface FlightAssessmentInput {
  windSpeedKmh: number | null;
  gustKmh: number | null;
  windSpeed100mKmh: number | null;
  windDirectionDeg: number | null;
  temperatureC: number | null;
  precipitationMm: number | null;
  visibilityM: number | null;
  humidityPct: number | null;
  cloudCoverPct: number | null;
  windMaxKmh?: number;
  gustMaxKmh?: number;
  precipitationMaxMm?: number;
  visibilityMinMeters?: number;
  temperatureMinC?: number;
  temperatureMaxC?: number;
}

export interface FlightAssessment {
  status: AssessmentStatus;
  reasons: AssessmentReason[];
  evaluatedAt: string;
  missingData: string[];
}
