import type { FlightLimits } from "../assessment/limits";
import type { FlightAssessment } from "../assessment/types";
import type {
  AssessmentSnapshotRecord,
  ObservationSnapshotRecord,
  WeatherSnapshotRecord,
} from "../logbook/types";
import type { ObservationSnapshot } from "../observation";
import type { WeatherSnapshot } from "../weather";

export function captureWeatherSnapshot(
  snapshot: WeatherSnapshot,
  capturedAt = new Date().toISOString()
): WeatherSnapshotRecord {
  return {
    current: { ...snapshot.current },
    capturedAt,
    source: snapshot.meta.source,
    dataTime: snapshot.meta.dataTime,
    sourceStatus: snapshot.meta.status,
  };
}

export function captureObservationSnapshot(
  snapshot: ObservationSnapshot,
  capturedAt = new Date().toISOString()
): ObservationSnapshotRecord {
  const observation = snapshot.observation;
  return {
    stationIcao: snapshot.stationIcao,
    stationName: snapshot.stationName,
    observedAt: observation?.observedAtISO,
    rawMetar: observation?.raw,
    windKmh: observation?.windKmh,
    windDirDeg: observation?.windDirDeg,
    gustKmh: observation?.gustKmh,
    visibilityM: observation?.visibilityM,
    visibilityLabel: observation?.visibilityLabel,
    tempC: observation?.tempC,
    qnhHpa: observation?.qnhHpa,
    clouds: observation?.clouds,
    phenomena: observation?.phenomena,
    distanceKm: snapshot.distanceKm,
    capturedAt,
    source: snapshot.meta.source,
    sourceStatus: snapshot.meta.status,
  };
}

export function captureAssessmentSnapshot(
  assessment: FlightAssessment,
  limits: FlightLimits,
  capturedAt = new Date().toISOString()
): AssessmentSnapshotRecord {
  return {
    status: assessment.status,
    reasons: assessment.reasons.map((reason) => ({ ...reason })),
    evaluatedAt: assessment.evaluatedAt,
    missingData: [...assessment.missingData],
    blockingMissingData: assessment.blockingMissingData
      ? [...assessment.blockingMissingData]
      : undefined,
    informationalMissingData: assessment.informationalMissingData
      ? [...assessment.informationalMissingData]
      : undefined,
    isComplete: assessment.isComplete,
    flightLimitsSnapshot: { ...limits },
    capturedAt,
  };
}
