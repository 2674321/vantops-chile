import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { evaluateFlight } from "../../domain/assessment/evaluator";
import type { FlightAssessment, AssessmentStatus } from "../../domain/assessment/types";
import type { WeatherSnapshot } from "../../domain/weather";
import { loadFlightLimits } from "../../storage/settings";

const STATUS_CONFIG: Record<
  AssessmentStatus,
  { icon: string; color: string; label: string }
> = {
  FAVORABLE: { icon: "🟢", color: "text-emerald-400", label: "Condiciones favorables" },
  CAUTION: { icon: "🟡", color: "text-amber-400", label: "Revisión necesaria" },
  UNFAVORABLE: { icon: "🔴", color: "text-red-400", label: "Condiciones desfavorables" },
  NO_DATA: { icon: "⚫", color: "text-slate-400", label: "Sin datos de evaluación" },
};

function severityColor(severity: string): string {
  if (severity === "critical") return "text-red-400";
  if (severity === "warning") return "text-amber-400";
  return "text-slate-300";
}

export function AssessmentCard({ snapshot }: { snapshot: WeatherSnapshot }) {
  const [limits, setLimits] = useState(loadFlightLimits);

  useEffect(() => {
    setLimits(loadFlightLimits());
  }, []);

  const assessment: FlightAssessment = evaluateFlight({
    windSpeedKmh: snapshot.current.windSpeedKmh,
    gustKmh: snapshot.current.windGustsKmh,
    windSpeed100mKmh: snapshot.current.windSpeed100mKmh,
    windDirectionDeg: snapshot.current.windDirectionDeg,
    temperatureC: snapshot.current.temperatureC,
    precipitationMm: snapshot.current.precipitationMm,
    visibilityM: snapshot.current.visibilityM,
    humidityPct: snapshot.current.humidityPct,
    cloudCoverPct: snapshot.current.cloudCoverPct,
    windMaxKmh: limits.windMaxKmh,
    gustMaxKmh: limits.gustMaxKmh,
    precipitationMaxMm: limits.precipitationMaxMm,
    visibilityMinMeters: limits.visibilityMinMeters,
    temperatureMinC: limits.temperatureMinC,
    temperatureMaxC: limits.temperatureMaxC,
  });

  const cfg = STATUS_CONFIG[assessment.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span aria-hidden>{cfg.icon}</span>
          <span className={cfg.color}>Evaluación de vuelo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={`text-lg font-semibold ${cfg.color}`}>{cfg.label}</p>

        {assessment.status === "NO_DATA" && (
          <p className="text-sm text-slate-400">
            Configura tus parámetros de vuelo (límites de viento, ráfagas, etc.) para recibir una evaluación.
          </p>
        )}

        <div className="space-y-1">
          {assessment.reasons
            .filter((r) => r.severity !== "info")
            .map((r) => (
              <p key={r.code} className={`text-sm ${severityColor(r.severity)}`}>
                {r.message}
              </p>
            ))}
        </div>

        {assessment.status === "FAVORABLE" && (
          <div className="space-y-1">
            {assessment.reasons
              .filter((r) => r.severity === "info")
              .map((r) => (
                <p key={r.code} className="text-sm text-slate-300">
                  {r.message}
                </p>
              ))}
          </div>
        )}

        {assessment.missingData.length > 0 && (
          <p className="text-xs text-amber-400">
            Datos faltantes: {assessment.missingData.join(", ")}
          </p>
        )}

        <p className="text-xs text-slate-500">
          Evaluado:{" "}
          {new Date(assessment.evaluatedAt).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          ·{" "}
          <span className="italic">
            VantOPS es una herramienta de apoyo a la planificación. No sustituye la normativa vigente,
            las publicaciones aeronáuticas, permisos, autorizaciones ni las instrucciones de las autoridades
            competentes.
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
