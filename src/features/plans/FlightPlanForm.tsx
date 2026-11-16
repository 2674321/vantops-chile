import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { OPERATION_TYPE_LABELS, type OperationType } from "../../domain/logbook/types";
import type { FlightPlanStatus } from "../../domain/flightPlan/types";
import { parseCoordinateFields } from "../../domain/coordinate";
import { loadActiveAircraft, loadFlightLimits } from "../../storage/settings";
import {
  createFlightPlan,
  getFlightPlan,
  updateFlightPlan,
} from "../../storage/repositories/flightPlanRepository";
import { useToast } from "../../components/toast/useToast";
import { getOperationalMap } from "../../storage/repositories/operationalMapRepository";
import { validateRadiusMeters } from "../../domain/operationZone";
import { loadActiveLocation } from "../../storage/activeLocationRepository";
import { mapPickerPath } from "../../domain/mapPickIntent";
import { usePersistentFormDraft } from "../../hooks/usePersistentFormDraft";
import { AutosaveStatus } from "../../components/autosave/AutosaveStatus";
import { isoToLocalDatetimeInput, localDatetimeInputToIso } from "../../lib/datetimeLocal";

export function FlightPlanForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [label, setLabel] = useState("");
  const [radiusMeters, setRadiusMeters] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");
  const [operationType, setOperationType] = useState<OperationType>("OTHER");
  const [status, setStatus] = useState<FlightPlanStatus>("DRAFT");
  const [notes, setNotes] = useState("");
  const [postponedReason, setPostponedReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = usePersistentFormDraft({
    id: id ? `flight-plan-edit-${id}` : "flight-plan-new",
    kind: "flight-plan",
    enabled: !loading,
    payload: { lat, lon, label, radiusMeters, scheduledStartAt, scheduledEndAt, operationType, status, notes, postponedReason },
    onRestore: (payload) => {
      if (typeof payload.lat === "string") setLat(payload.lat);
      if (typeof payload.lon === "string") setLon(payload.lon);
      if (typeof payload.label === "string") setLabel(payload.label);
      if (typeof payload.radiusMeters === "string") setRadiusMeters(payload.radiusMeters);
      if (typeof payload.scheduledStartAt === "string") setScheduledStartAt(payload.scheduledStartAt);
      if (typeof payload.scheduledEndAt === "string") setScheduledEndAt(payload.scheduledEndAt);
      if (typeof payload.operationType === "string") setOperationType(payload.operationType as OperationType);
      if (typeof payload.status === "string") setStatus(payload.status as FlightPlanStatus);
      if (typeof payload.notes === "string") setNotes(payload.notes);
      if (typeof payload.postponedReason === "string") setPostponedReason(payload.postponedReason);
    },
  });

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
        setRadiusMeters(plan.radiusMeters ? String(plan.radiusMeters) : "");
        setScheduledStartAt(plan.scheduledStartAt ? isoToLocalDatetimeInput(plan.scheduledStartAt) : "");
        setScheduledEndAt(plan.scheduledEndAt ? isoToLocalDatetimeInput(plan.scheduledEndAt) : "");
        setOperationType(plan.operationType ?? "OTHER");
        setStatus(plan.status);
        setNotes(plan.operatorNotes ?? "");
        setPostponedReason(plan.postponedReason ?? "");
      } else {
        const selection = await loadActiveLocation();
        if (selection) {
          setLat(String(selection.coordinate.latitude));
          setLon(String(selection.coordinate.longitude));
          setLabel(selection.label ?? "");
        }
      }
      const mapId = searchParams.get("mapId");
      const zoneId = searchParams.get("zoneId");
      if (mapId && zoneId) {
        const sourceMap = await getOperationalMap(mapId);
        const zone = sourceMap?.zones.find((item) => item.id === zoneId);
        if (sourceMap && zone) {
          const replace = !id || window.confirm("¿Reemplazar la ubicación y el radio de esta preparación con una copia de la zona seleccionada?");
          if (replace) {
            setLat(String(zone.center.latitude));
            setLon(String(zone.center.longitude));
            setRadiusMeters(String(zone.radiusMeters));
            setLabel(`${zone.name} · ${sourceMap.name}`);
          }
        }
      }
      setLoading(false);
    })();
  }, [id, searchParams]);

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
    const parsedRadius = radiusMeters.trim() === "" ? undefined : Number(radiusMeters);
    if (parsedRadius !== undefined && !validateRadiusMeters(parsedRadius).ok) {
      setError("Ingresa un radio válido entre 50 m y 50 km.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const common = {
        location: coordinate.coordinate,
        locationLabel: label.trim() || undefined,
        radiusMeters: parsedRadius,
        scheduledStartAt: scheduledStartAt ? localDatetimeInputToIso(scheduledStartAt) : undefined,
        scheduledEndAt: scheduledEndAt ? localDatetimeInputToIso(scheduledEndAt) : undefined,
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
      await draft.discard();
      toast.success(id ? "Preparación actualizada." : "Preparación guardada localmente.");
      navigate(searchParams.get("returnTo") || "/operacion");
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
        <AutosaveStatus state={draft.status} onRetry={() => void draft.flush()} />
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
            <div>
              <label htmlFor="plan-radius" className="mb-1 block text-xs text-slate-400">Radio de planificación (metros, opcional)</label>
              <input id="plan-radius" inputMode="decimal" value={radiusMeters} onChange={(e) => setRadiusMeters(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" />
              <p className="mt-1 text-[11px] text-slate-500">Es una copia para esta preparación; cambios posteriores al mapa no se sincronizan.</p>
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
        <Button type="button" variant="outline" className="w-full" onClick={() => navigate(mapPickerPath("plan-new"))}>Cambiar desde Mapa operativo</Button>
        <Button type="submit" disabled={saving} className="w-full"><Save className="mr-2 h-4 w-4" />{saving ? "Guardando…" : "Guardar preparación"}</Button>
      </form>
    </div>
  );
}
