import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus, MapPin, Plane, Battery, Download } from "lucide-react";
import { listFlights, countFlights, getTotalFlightTime } from "../../storage/repositories/flightRepository";
import { listBatteries } from "../../storage/repositories/batteryRepository";
import type { FlightRecord, BatteryRecord } from "../../domain/logbook/types";
import { formatCoordinate } from "../../domain/coordinate";
import { esCL as t } from "../../i18n/es-CL";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `${day} ${months[d.getMonth()]}`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function statusLabel(status?: string): string {
  switch (status) {
    case "FAVORABLE": return t.logbook.favorable;
    case "CAUTION": return t.logbook.caution;
    case "UNFAVORABLE": return t.logbook.unfavorable;
    default: return t.logbook.noData;
  }
}

function statusColor(status?: string): string {
  switch (status) {
    case "FAVORABLE": return "text-emerald-400";
    case "CAUTION": return "text-amber-400";
    case "UNFAVORABLE": return "text-red-400";
    default: return "text-slate-500";
  }
}

export function LogbookPage() {
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [batteries, setBatteries] = useState<BatteryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [f, count, time, b] = await Promise.all([
        listFlights(50),
        countFlights(),
        getTotalFlightTime(),
        listBatteries(),
      ]);
      setFlights(f);
      setTotalCount(count);
      setTotalTime(time);
      setBatteries(b);
    } finally {
      setLoading(false);
    }
  }

  const mostUsedAircraft = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of flights) {
      if (f.aircraftSnapshot?.name) {
        counts.set(f.aircraftSnapshot.name, (counts.get(f.aircraftSnapshot.name) ?? 0) + 1);
      }
    }
    let max = 0;
    let name = "—";
    for (const [n, c] of counts) {
      if (c > max) { max = c; name = n; }
    }
    return name;
  }, [flights]);

  const grouped = useMemo(() => {
    const groups = new Map<string, FlightRecord[]>();
    for (const f of flights) {
      const key = formatDate(f.startedAt);
      const list = groups.get(key) ?? [];
      list.push(f);
      groups.set(key, list);
    }
    return groups;
  }, [flights]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-400">
          Cargando bitácora…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{t.logbook.title}</h2>
        <Button size="sm" onClick={() => navigate("/bitacora/nuevo")}>
          <Plus className="mr-1 h-4 w-4" />
          {t.logbook.registerFlight}
        </Button>
      </div>

      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-2xl font-bold text-slate-100">{totalCount}</p>
            <p className="text-xs text-slate-400">{t.logbook.totalFlights}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-2xl font-bold text-slate-100">{formatDuration(totalTime)}</p>
            <p className="text-xs text-slate-400">{t.logbook.totalHours}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-sm font-bold text-slate-100 truncate">{mostUsedAircraft}</p>
            <p className="text-xs text-slate-400">{t.logbook.mostUsedAircraft}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate("/bitacora/baterias")}>
          <Battery className="mr-1 h-4 w-4" />
          {t.battery.title} ({batteries.length})
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate("/bitacora/exportar")}>
          <Download className="mr-1 h-4 w-4" />
          {t.export.exportData}
        </Button>
      </div>

      {flights.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Plane className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-400">{t.logbook.noFlights}</p>
            <Button className="mt-3" size="sm" onClick={() => navigate("/bitacora/nuevo")}>
              <Plus className="mr-1 h-4 w-4" />
              {t.logbook.registerFlight}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([date, items]) => (
            <div key={date}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {date}
              </p>
              <div className="space-y-1">
                {items.map((flight) => (
                  <button
                    key={flight.id}
                    type="button"
                    onClick={() => navigate(`/bitacora/${flight.id}`)}
                    className="flex w-full items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2.5 text-left transition-colors hover:bg-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {flight.aircraftSnapshot?.name ?? "Sin aeronave"}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {formatCoordinate(flight.coordinate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-xs text-slate-400">
                        {formatDuration(flight.durationSeconds)}
                      </span>
                      <span className={`text-xs font-medium ${statusColor(flight.assessmentSnapshot?.status)}`}>
                        {statusLabel(flight.assessmentSnapshot?.status)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
