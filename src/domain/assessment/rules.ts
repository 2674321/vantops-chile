import type {
  FlightAssessmentInput,
  AssessmentReason,
} from "./types";

export function evaluateWind(
  input: FlightAssessmentInput
): AssessmentReason | null {
  if (input.windMaxKmh == null) return null;
  if (input.windSpeedKmh == null) {
    return {
      code: "WIND_MISSING",
      severity: "warning",
      message: "Sin datos de viento para evaluar",
      source: "Open-Meteo",
    };
  }
  if (input.windSpeedKmh > input.windMaxKmh) {
    return {
      code: "WIND_EXCEEDED",
      severity: "critical",
      message: `Viento ${input.windSpeedKmh} km/h sobre el límite configurado (${input.windMaxKmh} km/h)`,
      source: "Open-Meteo",
    };
  }
  if (input.windSpeedKmh > input.windMaxKmh * 0.8) {
    return {
      code: "WIND_NEAR_LIMIT",
      severity: "warning",
      message: `Viento ${input.windSpeedKmh} km/h cercano al límite (${input.windMaxKmh} km/h)`,
      source: "Open-Meteo",
    };
  }
  return {
    code: "WIND_OK",
    severity: "info",
    message: `Viento ${input.windSpeedKmh} km/h bajo el límite (${input.windMaxKmh} km/h)`,
    source: "Open-Meteo",
  };
}

export function evaluateGust(
  input: FlightAssessmentInput
): AssessmentReason | null {
  if (input.gustMaxKmh == null) return null;
  if (input.gustKmh == null) {
    return {
      code: "GUST_MISSING",
      severity: "info",
      message: "Sin datos de ráfagas para evaluar",
      source: "Open-Meteo",
    };
  }
  if (input.gustKmh > input.gustMaxKmh) {
    return {
      code: "GUST_EXCEEDED",
      severity: "critical",
      message: `Ráfagas ${input.gustKmh} km/h sobre el límite (${input.gustMaxKmh} km/h)`,
      source: "Open-Meteo",
    };
  }
  if (input.gustKmh > input.gustMaxKmh * 0.8) {
    return {
      code: "GUST_NEAR_LIMIT",
      severity: "warning",
      message: `Ráfagas ${input.gustKmh} km/h cercanas al límite (${input.gustMaxKmh} km/h)`,
      source: "Open-Meteo",
    };
  }
  return {
    code: "GUST_OK",
    severity: "info",
    message: `Ráfagas ${input.gustKmh} km/h bajo el límite (${input.gustMaxKmh} km/h)`,
    source: "Open-Meteo",
  };
}

export function evaluatePrecipitation(
  input: FlightAssessmentInput
): AssessmentReason | null {
  if (input.precipitationMaxMm == null) return null;
  if (input.precipitationMm == null) {
    return {
      code: "PRECIP_MISSING",
      severity: "warning",
      message: "Sin datos de precipitación para evaluar",
      source: "Open-Meteo",
    };
  }
  if (input.precipitationMm > input.precipitationMaxMm) {
    return {
      code: "PRECIP_EXCEEDED",
      severity: "critical",
      message: `Precipitación ${input.precipitationMm} mm sobre el máximo (${input.precipitationMaxMm} mm)`,
      source: "Open-Meteo",
    };
  }
  return {
    code: "PRECIP_OK",
    severity: "info",
    message: `Precipitación ${input.precipitationMm} mm dentro del límite`,
    source: "Open-Meteo",
  };
}

export function evaluateVisibility(
  input: FlightAssessmentInput
): AssessmentReason | null {
  if (input.visibilityMinMeters == null) return null;
  if (input.visibilityM == null) {
    return {
      code: "VIS_MISSING",
      severity: "warning",
      message: "Sin datos de visibilidad para evaluar",
      source: "Open-Meteo",
    };
  }
  if (input.visibilityM < input.visibilityMinMeters) {
    return {
      code: "VIS_BELOW_MIN",
      severity: "critical",
      message: `Visibilidad ${input.visibilityM} m por debajo del mínimo (${input.visibilityMinMeters} m)`,
      source: "Open-Meteo",
    };
  }
  return {
    code: "VIS_OK",
    severity: "info",
    message: `Visibilidad ${input.visibilityM} m suficiente`,
    source: "Open-Meteo",
  };
}

export function evaluateTemperature(
  input: FlightAssessmentInput
): AssessmentReason | null {
  if (input.temperatureC == null) return null;
  if (input.temperatureMinC != null && input.temperatureC < input.temperatureMinC) {
    return {
      code: "TEMP_BELOW_MIN",
      severity: "critical",
      message: `Temperatura ${input.temperatureC}°C bajo el mínimo (${input.temperatureMinC}°C)`,
      source: "Open-Meteo",
    };
  }
  if (input.temperatureMaxC != null && input.temperatureC > input.temperatureMaxC) {
    return {
      code: "TEMP_ABOVE_MAX",
      severity: "critical",
      message: `Temperatura ${input.temperatureC}°C sobre el máximo (${input.temperatureMaxC}°C)`,
      source: "Open-Meteo",
    };
  }
  const parts: string[] = [];
  if (input.temperatureMinC != null) parts.push(`mín ${input.temperatureMinC}°C`);
  if (input.temperatureMaxC != null) parts.push(`máx ${input.temperatureMaxC}°C`);
  return {
    code: "TEMP_OK",
    severity: "info",
    message: `Temperatura ${input.temperatureC}°C${parts.length ? ` (${parts.join(", ")})` : ""}`,
    source: "Open-Meteo",
  };
}

export function evaluateWind100m(
  input: FlightAssessmentInput
): AssessmentReason | null {
  if (input.windSpeed100mKmh == null) {
    return {
      code: "WIND100M_MISSING",
      severity: "info",
      message: "Sin datos de viento a 100 m",
      source: "Open-Meteo",
    };
  }
  return {
    code: "WIND100M_INFO",
    severity: "info",
    message: `Viento a 100 m: ${input.windSpeed100mKmh} km/h (referencia crucero)`,
    source: "Open-Meteo",
  };
}
