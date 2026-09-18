import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createFlight, getFlight, updateFlight } from "../../storage/repositories/flightRepository";
import { listBatteries, markBatteryUsed } from "../../storage/repositories/batteryRepository";
import type { FlightRecord, BatteryRecord, OperationType, FlightIncident, FlightIncidentType } from "../../domain/logbook/types";
import { OPERATION_TYPE_LABELS, INCIDENT_TYPE_LABELS } from "../../domain/logbook/types";
import { parseCoordinateFields } from "../../domain/coordinate";
import {
  validateFlightTimes,
  computeDurationSeconds,
  parseBatteryPercent,
} from "../../domain/logbook/validation";
import { coordinateInputMessage } from "../../lib/coordinateMessages";
import { useToast } from "../../components/toast/useToast";
import { esCL as t } from "../../i18n/es-CL";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface FormErrors {
  latitude?: string;
  longitude?: string;
  times?: string;
  battery?: string;
}

export function FlightForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);

  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [endedAt, setEndedAt] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [batteryId, setBatteryId] = useState("");
  const [batteryStartPct, setBatteryStartPct] = useState("");
  const [batteryEndPct, setBatteryEndPct] = useState("");
  const [operationType, setOperationType] = useState<OperationType>("OTHER");
  const [notes, setNotes] = useState("");
  const [incidents, setIncidents] = useState<FlightIncident[]>([]);
  const [batteries, setBatteries] = useState<BatteryRecord[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    listBatteries().then(setBatteries);
    if (id) {
      getFlight(id).then((f) => {
        if (f) {
          setStartedAt(f.startedAt.slice(0, 16));
          setEndedAt(f.endedAt?.slice(0, 16) ?? "");
          setLat(String(f.coordinate.latitude));
          setLon(String(f.coordinate.longitude));
          setBatteryId(f.batteryId ?? "");
          setBatteryStartPct(f.batteryStartPct != null ? String(f.batteryStartPct) : "");
          setBatteryEndPct(f.batteryEndPct != null ? String(f.batteryEndPct) : "");
          setOperationType(f.operationType ?? "OTHER");
          setNotes(f.notes ?? "");
          setIncidents(f.incidents ?? []);
        }
        setLoading(false);
      });
    }
  }, [id]);

  function clearError(key: keyof FormErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const coordinateResult = parseCoordinateFields(lat, lon);
    const timeResult = validateFlightTimes(startedAt, endedAt);
    const startPctResult = parseBatteryPercent(batteryStartPct);
    const endPctResult = parseBatteryPercent(batteryEndPct);

    const nextErrors: FormErrors = {};
    if (!coordinateResult.ok) {
      if (coordinateResult.errors.latitude) {
        nextErrors.latitude = coordinateInputMessage("latitude", coordinateResult.errors.latitude);
      }
      if (coordinateResult.errors.longitude) {
        nextErrors.longitude = coordinateInputMessage("longitude", coordinateResult.errors.longitude);
      }
    }
    if (!timeResult.ok) {
      nextErrors.times =
        timeResult.error === "end-before-start"
          ? t.feedback.timeEndBeforeStart
          : timeResult.error === "invalid-end"
            ? t.feedback.timeInvalidEnd
            : t.feedback.timeInvalidStart;
    }
    if (batteryId) {
      const batteryError = !startPctResult.ok
        ? startPctResult.error
        : !endPctResult.ok
          ? endPctResult.error
          : null;
      if (batteryError) {
        nextErrors.battery =
          batteryError === "out-of-range"
            ? t.feedback.batteryPctOutOfRange
            : t.feedback.batteryPctNotNumber;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !coordinateResult.ok || !timeResult.ok) return;
    if (!startPctResult.ok || !endPctResult.ok) return;

    const startIso = new Date(startedAt).toISOString();
    const endIso = endedAt ? new Date(endedAt).toISOString() : undefined;
    const durationSeconds = endIso ? computeDurationSeconds(startedAt, endedAt) : undefined;

    const data: Partial<FlightRecord> = {
      startedAt: startIso,
      endedAt: endIso,
      durationSeconds,
      coordinate: coordinateResult.coordinate,
      batteryId: batteryId || undefined,
      batteryStartPct: batteryId ? startPctResult.value : undefined,
      batteryEndPct: batteryId ? endPctResult.value : undefined,
      operationType,
      notes: notes || undefined,
      incidents: incidents.length > 0 ? incidents : undefined,
    };

    setSaving(true);
    try {
      let flightId = id;
      if (isEdit && id) {
        await updateFlight(id, data);
        toast.success(t.feedback.flightUpdated);
      } else {
        const flight = await createFlight(data);
        flightId = flight.id;
        toast.success(t.feedback.flightCreated);
      }

      if (batteryId) {
        try {
          await markBatteryUsed(batteryId);
        } catch {
          toast.warning(t.feedback.batteryUsageWarning);
        }
      }

      navigate(`/bitacora/${flightId}`);
    } catch {
      toast.error(t.feedback.flightSaveError);
      setSaving(false);
    }
  }

  function addIncident() {
    setIncidents((prev) => [
      ...prev,
      { id: generateId(), type: "OTHER" as FlightIncidentType, notes: "" },
    ]);
  }

  function updateIncident(idx: number, changes: Partial<FlightIncident>) {
    setIncidents((prev) => prev.map((inc, i) => (i === idx ? { ...inc, ...changes } : inc)));
  }

  function removeIncident(idx: number) {
    setIncidents((prev) => prev.filter((_, i) => i !== idx));
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-400">Cargando…</CardContent>
      </Card>
    );
  }

  const invalidClass = "border-red-700";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">
          {isEdit ? t.logbook.editFlight : t.logbook.registerFlight}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <label htmlFor="startedAt" className="mb-1 block text-xs text-slate-400">{t.logbook.startDateTime}</label>
              <input
                id="startedAt"
                type="datetime-local"
                value={startedAt}
                onChange={(e) => {
                  setStartedAt(e.target.value);
                  clearError("times");
                }}
                aria-invalid={Boolean(errors.times)}
                aria-describedby={errors.times ? "flight-times-error" : undefined}
                className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.times ? invalidClass : "border-slate-700"}`}
              />
            </div>
            <div>
              <label htmlFor="endedAt" className="mb-1 block text-xs text-slate-400">{t.logbook.endDateTime}</label>
              <input
                id="endedAt"
                type="datetime-local"
                value={endedAt}
                onChange={(e) => {
                  setEndedAt(e.target.value);
                  clearError("times");
                }}
                aria-invalid={Boolean(errors.times)}
                aria-describedby={errors.times ? "flight-times-error" : undefined}
                className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.times ? invalidClass : "border-slate-700"}`}
              />
            </div>
            {errors.times && (
              <p id="flight-times-error" role="alert" className="text-sm text-red-400">
                {errors.times}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="lat" className="mb-1 block text-xs text-slate-400">{t.dashboard.latitude}</label>
                <input
                  id="lat"
                  type="text"
                  inputMode="decimal"
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
                    clearError("latitude");
                  }}
                  placeholder="-33.4521"
                  aria-invalid={Boolean(errors.latitude)}
                  aria-describedby={errors.latitude ? "flight-latitude-error" : undefined}
                  className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.latitude ? invalidClass : "border-slate-700"}`}
                />
                {errors.latitude && (
                  <p id="flight-latitude-error" role="alert" className="mt-1 text-xs text-red-400">
                    {errors.latitude}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lon" className="mb-1 block text-xs text-slate-400">{t.dashboard.longitude}</label>
                <input
                  id="lon"
                  type="text"
                  inputMode="decimal"
                  value={lon}
                  onChange={(e) => {
                    setLon(e.target.value);
                    clearError("longitude");
                  }}
                  placeholder="-70.6536"
                  aria-invalid={Boolean(errors.longitude)}
                  aria-describedby={errors.longitude ? "flight-longitude-error" : undefined}
                  className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.longitude ? invalidClass : "border-slate-700"}`}
                />
                {errors.longitude && (
                  <p id="flight-longitude-error" role="alert" className="mt-1 text-xs text-red-400">
                    {errors.longitude}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <label htmlFor="operationType" className="mb-1 block text-xs text-slate-400">{t.logbook.operationType}</label>
              <select
                id="operationType"
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as OperationType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              >
                {Object.entries(OPERATION_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="batteryId" className="mb-1 block text-xs text-slate-400">{t.logbook.batteryOptional}</label>
              <select
                id="batteryId"
                value={batteryId}
                onChange={(e) => {
                  setBatteryId(e.target.value);
                  clearError("battery");
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              >
                <option value="">{t.logbook.noBattery}</option>
                {batteries.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.cycleCount} ciclos)</option>
                ))}
              </select>
            </div>

            {batteryId && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="batteryStartPct" className="mb-1 block text-xs text-slate-400">% Inicio</label>
                  <input
                    id="batteryStartPct"
                    type="text"
                    inputMode="numeric"
                    value={batteryStartPct}
                    onChange={(e) => {
                      setBatteryStartPct(e.target.value);
                      clearError("battery");
                    }}
                    aria-invalid={Boolean(errors.battery)}
                    aria-describedby={errors.battery ? "flight-battery-error" : undefined}
                    className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.battery ? invalidClass : "border-slate-700"}`}
                  />
                </div>
                <div>
                  <label htmlFor="batteryEndPct" className="mb-1 block text-xs text-slate-400">% Fin</label>
                  <input
                    id="batteryEndPct"
                    type="text"
                    inputMode="numeric"
                    value={batteryEndPct}
                    onChange={(e) => {
                      setBatteryEndPct(e.target.value);
                      clearError("battery");
                    }}
                    aria-invalid={Boolean(errors.battery)}
                    aria-describedby={errors.battery ? "flight-battery-error" : undefined}
                    className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.battery ? invalidClass : "border-slate-700"}`}
                  />
                </div>
                {errors.battery && (
                  <p id="flight-battery-error" role="alert" className="col-span-2 text-xs text-red-400">
                    {errors.battery}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <label htmlFor="notes" className="mb-1 block text-xs text-slate-400">{t.logbook.notes}</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-slate-400">{t.logbook.incidents}</p>
                <Button type="button" size="sm" variant="ghost" onClick={addIncident}>
                  + {t.logbook.addIncident}
                </Button>
              </div>
              {incidents.map((inc, idx) => (
                <div key={inc.id} className="mb-2 flex gap-2">
                  <select
                    value={inc.type}
                    onChange={(e) => updateIncident(idx, { type: e.target.value as FlightIncidentType })}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                    aria-label={t.logbook.incidents}
                  >
                    {Object.entries(INCIDENT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={inc.notes ?? ""}
                    onChange={(e) => updateIncident(idx, { notes: e.target.value })}
                    placeholder="Notas…"
                    aria-label="Notas de la incidencia"
                    className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeIncident(idx)}
                    aria-label="Quitar incidencia"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? t.feedback.saving : t.logbook.saveFlight}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
            {t.logbook.discardChanges}
          </Button>
        </div>
      </form>
    </div>
  );
}
