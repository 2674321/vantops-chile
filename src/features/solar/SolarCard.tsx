import { useMemo } from "react";
import { computeSolarTimes } from "../../providers/solar/suncalcSolar";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Sunrise, Sunset, Clock } from "lucide-react";

function fmtTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function SolarCard({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const times = useMemo(
    () => computeSolarTimes(new Date(), latitude, longitude),
    [latitude, longitude]
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sunrise className="h-4 w-4 text-amber-400" />
          Sol
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-950/60 p-3">
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Sunrise className="h-3 w-3" /> Amanecer
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-100">
              {fmtTime(times.sunrise)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3">
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Sunset className="h-3 w-3" /> Atardecer
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-100">
              {fmtTime(times.sunset)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3">
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" /> Hora dorada (tarde)
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-100">
              {fmtTime(times.goldenHourStart)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3">
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" /> Duración del día
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-100">
              {fmtDuration(times.dayLengthMinutes)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Cálculo local · SunCalc</p>
      </CardContent>
    </Card>
  );
}
