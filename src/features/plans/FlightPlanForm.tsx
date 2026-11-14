import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { OPERATION_TYPE_LABELS, type OperationType } from "../../domain/logbook/types";
import type { FlightPlanStatus } from "../../domain/flightPlan/types";
import { parseCoordinateFields } from "../../domain/coordinate";
import { loadActiveAircraft, loadFlightLimits, loadLastCoordinate } from "../../storage/settings";
import {
  createFlightPlan,
  getFlightPlan,
  updateFlightPlan,
} from "../../storage/repositories/flightPlanRepository";
import { useToast } from "../../components/toast/useToast";

export function FlightPlanForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [label, setLabel] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");
  const [operationType, setOperationType] = useState<OperationType>("OTHER");
  const [status, setStatus] = useState<FlightPlanStatus>("DRAFT");
  const [notes, setNotes] = useState("");
  const [postponedReason, setPostponedReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (id) {
        const plan = await getFlightPlan(id);
        if (!plan) {
          setError("Plan no encontrado.");
          setLoading(false);
          return;
        }
        setLat(String(plan.location.latitude));
        setLon(String(plan.location.longitude));
        setLabel(plan.locationLabel ?? "");
        setScheduledStartAt(plan.scheduledStartAt?.slice(0, 16) ?? "");
        setScheduledEndAt(plan.scheduledEndAt?.slice(0, 16) ?? "");
        setOperationType(plan.operationType ?? "OTHER");
        setStatus(plan.status);
        setNotes(plan.operatorNotes ?? "");
        setPostponedReason(plan.postponedReason ?? "");
      } else {
        const coordinate = await loadLastCoordinate();
        if (coordinate) {
          setLat(String(coordinate.latitude));
          setLon(String(coordinate.longitude));
        }
      }
      setLoading(false);
    })();
  }, [id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const coordinate = parseCoordinateFields(lat, lon);
    if (!coordinate.ok) {
      setError("Ingresa coordenadas válidas para guardar la preparación.");
      return;
    }
    if (scheduledStartAt && scheduledEndAt && new Date(scheduledEndAt) < new Date(scheduledStartAt)) {
      setError("El término previsto no puede ser anterior al inicio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const common = {
        location: coordinate.coordinate,
        locationLabel: label.trim() || undefined,
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : undefined,
        scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : undefined,
        operationType,
        status,
        operatorNotes: notes.trim() || undefined,
        postponedReason: status === "POSTPONED" ? postponedReason.trim() || undefined : undefined,
      };
      if (id) {
        await updateFlightPlan(id, common);
      } else {
        const [aircraft, limits] = await Promise.all([loadActiveAircraft(), loadFlightLimits()]);
        await createFlightPlan({
          ...common,
          aircraftId: aircraft?.id,
          aircraftSnapshot: aircraft
            ? {
                id: aircraft.id,
                name: aircraft.name,
                type: aircraft.type,
                manufacturer: aircraft.manufacturer,
                model: aircraft.model,
              }
            : undefined,
          flightLimitsSnapshot: limits,
        });
      }
      toast.success(id ? "Preparación actualizada." : "Preparación guardada localmente.");
      navigate("/operacion");
    } catch {
      setError("No se pudo guardar la preparación en este dispositivo.");
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/operacion")} aria-label="Volver a mis operaciones">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">{id ? "Reanudar preparación" : "Nueva preparación"}</h2>
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <label htmlFor="plan-label" className="mb-1 block text-xs text-slate-400">Lugar de operación</label>
              <input id="plan-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nombre opcional" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="plan-lat" className="mb-1 block text-xs text-slate-400">Latitud</label><input id="plan-lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" /></div>
              <div><label htmlFor="plan-lon" className="mb-1 block text-xs text-slate-400">Longitud</label><input id="plan-lon" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="plan-start" className="mb-1 block text-xs text-slate-400">Inicio previsto</label><input id="plan-start" type="datetime-local" value={scheduledStartAt} onChange={(e) => setScheduledStartAt(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" /></div>
              <div><label htmlFor="plan-end" className="mb-1 block text-xs text-slate-400">Término previsto</label><input id="plan-end" type="datetime-local" value={scheduledEndAt} onChange={(e) => setScheduledEndAt(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" /></div>
            </div>
            <div><label htmlFor="plan-operation" className="mb-1 block text-xs text-slate-400">Tipo de operación</label><select id="plan-operation" value={operationType} onChange={(e) => setOperationType(e.target.value as OperationType)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">{Object.entries(OPERATION_TYPE_LABELS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div>
            <div><label htmlFor="plan-status" className="mb-1 block text-xs text-slate-400">Estado del plan</label><select id="plan-status" value={status} onChange={(e) => setStatus(e.target.value as FlightPlanStatus)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"><option value="DRAFT">Borrador</option><option value="REVIEWED">Revisado por el usuario</option><option value="POSTPONED">Pospuesto</option></select></div>
            {status === "POSTPONED" && <div><label htmlFor="plan-reason" className="mb-1 block text-xs text-slate-400">Motivo opcional</label><input id="plan-reason" value={postponedReason} onChange={(e) => setPostponedReason(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" /></div>}
            <div><label htmlFor="plan-notes" className="mb-1 block text-xs text-slate-400">Notas</label><textarea id="plan-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" /></div>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          </CardContent>
        </Card>
        <p className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-200">“Revisado” significa que tú revisaste la preparación. No constituye aprobación ni autorización de la DGAC.</p>
        <Button type="submit" disabled={saving} className="w-full"><Save className="mr-2 h-4 w-4" />{saving ? "Guardando…" : "Guardar preparación"}</Button>
      </form>
    </div>
  );
}
