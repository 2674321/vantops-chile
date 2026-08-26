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

export function AssessmentCard({ snapshot: _snapshot, assessment }: AssessmentCardProps) {

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
