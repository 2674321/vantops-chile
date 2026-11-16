import { useCallback, useEffect, useState } from "react";
import { Archive, Copy, FilePlus2, PlaneTakeoff, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { FLIGHT_PLAN_STATUS_LABELS, type FlightPlan } from "../../domain/flightPlan/types";
import {
  deleteFlightPlan,
  duplicateFlightPlan,
  listFlightPlans,
  updateFlightPlan,
} from "../../storage/repositories/flightPlanRepository";
import { useToast } from "../../components/toast/useToast";
import type { OperationSession } from "../../domain/operations/types";
import { listOperationSessions, loadActiveOperationSession } from "../../storage/repositories/operationSessionRepository";

export function FlightPlansPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [plans, setPlans] = useState<FlightPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sessions, setSessions] = useState<OperationSession[]>([]);
  const [activeSession, setActiveSession] = useState<OperationSession | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextPlans, nextSessions, active] = await Promise.all([listFlightPlans(), listOperationSessions(500), loadActiveOperationSession()]);
      setPlans(nextPlans);
      setSessions(nextSessions);
      setActiveSession(active);
    } catch {
      toast.error("No se pudieron cargar los planes locales.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function duplicate(id: string) {
    try {
      await duplicateFlightPlan(id);
      toast.success("Plan duplicado como borrador.");
      await refresh();
    } catch {
      toast.error("No se pudo duplicar el plan.");
    }
  }

  async function archive(id: string) {
    await updateFlightPlan(id, { status: "ARCHIVED" });
    toast.success("Plan archivado.");
    await refresh();
  }

  async function remove(id: string) {
    try {
      await deleteFlightPlan(id);
      setConfirmDelete(null);
      toast.success("Plan eliminado.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el plan.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Mi operación</h2>
          <p className="text-xs text-slate-400">Preparaciones guardadas solo en este dispositivo.</p>
        </div>
        <Button onClick={() => navigate("/operacion/nueva")}>
          <FilePlus2 className="mr-2 h-4 w-4" /> Nueva
        </Button>
      </div>

      {activeSession && <button type="button" onClick={() => navigate("/?workspace=operation")} className="flex w-full items-center justify-between rounded-lg border border-sky-700 bg-sky-950/30 p-3 text-left"><span><span className="block text-sm font-semibold text-sky-200">Operación en curso</span><span className="text-xs text-slate-400">{activeSession.locationSnapshot.label ?? "Punto del mapa"}</span></span><span className="text-sm text-sky-300">Continuar →</span></button>}

      {loading && <p className="text-sm text-slate-400">Cargando…</p>}
      {!loading && plans.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-400">
            No hay preparaciones guardadas. Puedes crear una incluso sin conexión.
          </CardContent>
        </Card>
      )}

      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle className="flex items-start justify-between gap-2 text-base">
              <span>{plan.locationLabel || `${plan.location.latitude}, ${plan.location.longitude}`}</span>
              <span className="rounded bg-slate-800 px-2 py-1 text-[11px] font-normal text-slate-300">
                {FLIGHT_PLAN_STATUS_LABELS[plan.status]}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-400">
              {plan.scheduledStartAt
                ? `Previsto: ${new Date(plan.scheduledStartAt).toLocaleString("es-CL")}`
                : "Sin horario previsto"}
            </p>
            {plan.linkedFlightId && (
              <p className="text-xs text-emerald-300">Vinculado a un vuelo registrado.</p>
            )}
            {sessions.some((session) => session.planId === plan.id) && <p className="text-xs text-sky-300">{sessions.filter((session) => session.planId === plan.id).length} sesiones · {sessions.filter((session) => session.planId === plan.id).reduce((sum, session) => sum + session.flights.filter((flight) => flight.status === "LANDED").length, 0)} vuelos</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate(`/operacion/${plan.id}`)}>
                Reanudar
              </Button>
              {!plan.linkedFlightId && (
                <Button size="sm" onClick={() => navigate(`/bitacora/nuevo?planId=${plan.id}`)}>
                  <PlaneTakeoff className="mr-1 h-4 w-4" /> Registrar vuelo
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => duplicate(plan.id)} aria-label="Duplicar plan">
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => archive(plan.id)} aria-label="Archivar plan">
                <Archive className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(plan.id)} aria-label="Eliminar plan">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {confirmDelete === plan.id && (
              <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-200">
                <p>¿Eliminar este plan? Los vuelos vinculados nunca se eliminan.</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => remove(plan.id)}>Eliminar</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
