import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import type { FlightAssessment, AssessmentStatus } from "../../domain/assessment/types";
import type { WeatherSnapshot } from "../../domain/weather";

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

interface AssessmentCardProps {
  snapshot: WeatherSnapshot;
  assessment: FlightAssessment;
}

export function AssessmentCard({ snapshot, assessment }: AssessmentCardProps) {

  const cfg = STATUS_CONFIG[assessment.status];
  const blockingMissingData = assessment.blockingMissingData ?? [];

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

        {assessment.hasConfiguredLimits && !assessment.isComplete && (
          <output className="block rounded-lg border border-amber-700/50 bg-amber-950/30 p-2 text-sm text-amber-200">
            Evaluación incompleta: faltan datos necesarios para comprobar todos tus límites.
          </output>
        )}

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

        {blockingMissingData.length > 0 && (
          <p className="text-xs text-amber-400">
            Datos decisionales faltantes: {blockingMissingData.join(", ")}
          </p>
        )}

        <p className="text-xs text-slate-400">
          Fuente: {snapshot.meta.source} · dato {snapshot.meta.dataTime ?? "sin fecha"} · estado {snapshot.meta.status}
        </p>

        <p className="text-xs text-slate-500">
          Evaluado:{" "}
          {new Date(assessment.evaluatedAt).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          ·{" "}
          <span className="italic">
            Según los parámetros que configuraste y los datos disponibles; no constituye autorización de vuelo.
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
