import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Trash2, Edit, MapPin, Clock, Plane, Cloud, Radio, ClipboardCheck, Battery } from "lucide-react";
import { getFlight, deleteFlight } from "../../storage/repositories/flightRepository";
import { getBattery } from "../../storage/repositories/batteryRepository";
import type { FlightRecord, BatteryRecord } from "../../domain/logbook/types";
import { formatCoordinate } from "../../domain/coordinate";
import { esCL as t } from "../../i18n/es-CL";

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status?: string): string {
  switch (status) {
    case "FAVORABLE": return `🟢 ${t.logbook.favorable}`;
    case "CAUTION": return `🟡 ${t.logbook.caution}`;
    case "UNFAVORABLE": return `🔴 ${t.logbook.unfavorable}`;
    default: return t.logbook.noData;
  }
}

export function FlightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [flight, setFlight] = useState<FlightRecord | null>(null);
  const [battery, setBattery] = useState<BatteryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    getFlight(id).then((f) => {
      setFlight(f ?? null);
      if (f?.batteryId) {
        getBattery(f.batteryId).then((b) => setBattery(b ?? null));
      }
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    await deleteFlight(id);
    navigate("/bitacora");
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-400">Cargando…</CardContent>
      </Card>
    );
  }

  if (!flight) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-400">
          Vuelo no encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/bitacora")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">{t.logbook.flightDetail}</h2>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/bitacora/${id}/editar`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>

      {showDelete && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-3">
          <p className="mb-2 text-sm text-red-300">{t.logbook.deleteConfirm}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowDelete(false)}>
              {t.logbook.deleteCancel}
            </Button>
            <Button size="sm" onClick={handleDelete}>
              {t.logbook.deleteFlight}
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-sky-400" />
            <span className="text-sm font-medium text-slate-200">
              {flight.aircraftSnapshot?.name ?? "Sin aeronave"}
            </span>
            {flight.aircraftSnapshot?.type && (
              <span className="text-xs text-slate-500">({flight.aircraftSnapshot.type})</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="h-4 w-4 text-slate-400" />
            {formatDate(flight.startedAt)}
            {flight.endedAt && ` → ${formatDate(flight.endedAt)}`}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="h-4 w-4 text-slate-400" />
            {formatCoordinate(flight.coordinate)}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="h-4 w-4 text-slate-400" />
            {t.logbook.duration}: {formatDuration(flight.durationSeconds)}
          </div>
        </CardContent>
      </Card>

      {flight.weatherSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="h-4 w-4 text-sky-400" />
              {t.logbook.weatherAtFlight}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {flight.weatherSnapshot.current.temperatureC != null && (
              <div>
                <p className="text-xs text-slate-400">Temperatura</p>
                <p className="text-slate-200">{flight.weatherSnapshot.current.temperatureC}°C</p>
              </div>
            )}
            {flight.weatherSnapshot.current.windSpeedKmh != null && (
              <div>
                <p className="text-xs text-slate-400">Viento</p>
                <p className="text-slate-200">{flight.weatherSnapshot.current.windSpeedKmh} km/h</p>
              </div>
            )}
            {flight.weatherSnapshot.current.windGustsKmh != null && (
              <div>
                <p className="text-xs text-slate-400">Ráfagas</p>
                <p className="text-slate-200">{flight.weatherSnapshot.current.windGustsKmh} km/h</p>
              </div>
            )}
            {flight.weatherSnapshot.current.visibilityM != null && (
              <div>
                <p className="text-xs text-slate-400">Visibilidad</p>
                <p className="text-slate-200">{flight.weatherSnapshot.current.visibilityM} m</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {flight.observationSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4 text-sky-400" />
              {t.logbook.metarAtFlight}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {flight.observationSnapshot.stationIcao && (
              <p className="text-slate-300">
                {flight.observationSnapshot.stationName} ({flight.observationSnapshot.stationIcao})
              </p>
            )}
            {flight.observationSnapshot.rawMetar && (
              <p className="rounded bg-slate-950/60 p-2 font-mono text-xs text-slate-400">
                {flight.observationSnapshot.rawMetar}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {flight.assessmentSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {statusLabel(flight.assessmentSnapshot.status)}
              <span className="text-sm font-normal text-slate-400">{t.logbook.assessmentAtFlight}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {flight.assessmentSnapshot.reasons.map((r, i) => (
              <p key={`${r.code}-${i}`} className="text-slate-300">
                {r.message}
              </p>
            ))}
            {flight.assessmentSnapshot.reasons.length === 0 && (
              <p className="text-slate-500">Sin razones registradas</p>
            )}
          </CardContent>
        </Card>
      )}

      {flight.checklistSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-sky-400" />
              {t.logbook.checklistAtFlight}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            {flight.checklistSnapshot.checkedItems}/{flight.checklistSnapshot.totalItems} completados
          </CardContent>
        </Card>
      )}

      {flight.batteryId && (
        <Card>
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            <Battery className="h-4 w-4 text-sky-400" />
            <span className="text-slate-300">
              {t.logbook.battery}: {battery ? battery.name : t.logbook.batteryNotAvailable}
              {battery && ` (${battery.cycleCount} ${t.battery.cycles})`}
              {flight.batteryStartPct != null && ` (${flight.batteryStartPct}%)`}
              {flight.batteryEndPct != null && ` → ${flight.batteryEndPct}%`}
            </span>
          </CardContent>
        </Card>
      )}

      {flight.notes && (
        <Card>
          <CardContent className="py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.logbook.notes}</p>
            <p className="text-sm text-slate-300">{flight.notes}</p>
          </CardContent>
        </Card>
      )}

      {flight.incidents && flight.incidents.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.logbook.incidents}</p>
            {flight.incidents.map((inc) => (
              <p key={inc.id} className="text-sm text-amber-300">
                {inc.type}{inc.notes ? `: ${inc.notes}` : ""}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
