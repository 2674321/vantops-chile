import type {
  FlightAssessmentInput,
  AssessmentReason,
} from "./types";

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function invalidLimit(code: string, label: string): AssessmentReason {
  return {
    code,
    severity: "warning",
    message: `El límite de ${label} no es un número válido`,
    source: "Configuración local",
  };
}

export function evaluateWind(
  input: FlightAssessmentInput
): AssessmentReason | null {
  if (input.windMaxKmh == null) return null;
  if (!isFiniteNumber(input.windMaxKmh)) return invalidLimit("WIND_LIMIT_INVALID", "viento");
  if (!isFiniteNumber(input.windSpeedKmh)) {
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
  if (!isFiniteNumber(input.gustMaxKmh)) return invalidLimit("GUST_LIMIT_INVALID", "ráfagas");
  if (!isFiniteNumber(input.gustKmh)) {
    return {
      code: "GUST_MISSING",
      severity: "warning",
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
  if (!isFiniteNumber(input.precipitationMaxMm)) {
    return invalidLimit("PRECIP_LIMIT_INVALID", "precipitación");
  }
  if (!isFiniteNumber(input.precipitationMm)) {
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
  if (!isFiniteNumber(input.visibilityMinMeters)) {
    return invalidLimit("VIS_LIMIT_INVALID", "visibilidad");
  }
  if (!isFiniteNumber(input.visibilityM)) {
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
  const min = input.temperatureMinC;
  const max = input.temperatureMaxC;
  const hasMin = min != null;
  const hasMax = max != null;
  if (!hasMin && !hasMax) return null;
  if (hasMin && !isFiniteNumber(min)) {
    return invalidLimit("TEMP_MIN_LIMIT_INVALID", "temperatura mínima");
  }
  if (hasMax && !isFiniteNumber(max)) {
    return invalidLimit("TEMP_MAX_LIMIT_INVALID", "temperatura máxima");
  }
  if (!isFiniteNumber(input.temperatureC)) {
    return {
      code: "TEMP_MISSING",
      severity: "warning",
      message: "Sin datos de temperatura para evaluar",
      source: "Open-Meteo",
    };
  }
  if (isFiniteNumber(min) && input.temperatureC < min) {
    return {
      code: "TEMP_BELOW_MIN",
      severity: "critical",
      message: `Temperatura ${input.temperatureC}°C bajo el mínimo (${min}°C)`,
      source: "Open-Meteo",
    };
  }
  if (isFiniteNumber(max) && input.temperatureC > max) {
    return {
      code: "TEMP_ABOVE_MAX",
      severity: "critical",
      message: `Temperatura ${input.temperatureC}°C sobre el máximo (${max}°C)`,
      source: "Open-Meteo",
    };
  }
  const parts: string[] = [];
  if (isFiniteNumber(min)) parts.push(`mín ${min}°C`);
  if (isFiniteNumber(max)) parts.push(`máx ${max}°C`);
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
  if (!isFiniteNumber(input.windSpeed100mKmh)) {
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
