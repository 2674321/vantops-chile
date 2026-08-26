import { useQuery } from "@tanstack/react-query";
import { fetchNearestObservation } from "../../providers/observations/noaaObservation";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { DataSourceBadge, windDirectionLabel } from "../weather/WeatherPanel";
import { Radio } from "lucide-react";
import { minutesSince } from "../../domain/sourceMeta";

export function NearbyMetarCard({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["metar", latitude, longitude],
    queryFn: () => fetchNearestObservation(latitude, longitude),
    staleTime: 30 * 60_000,
    retry: 1,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4 text-sky-400" />
          Observación METAR cercana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-slate-400">Consultando NOAA…</p>
        )}
        {error && (
          <p className="text-sm text-red-400">
            Sin datos de observación ({(error as Error).message})
          </p>
        )}
        {data && !data.observation && (
          <p className="text-sm text-amber-400">
            {data.meta.error ?? "Sin METAR reciente"}
          </p>
        )}
        {data?.observation && (
          <>
            <p className="text-xs text-slate-400">
              {data.stationName} ({data.stationIcao})
              {data.distanceKm != null ? ` · ~${data.distanceKm} km` : ""}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {data.observation.windKmh != null && (
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Viento</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">
                    {data.observation.windKmh} km/h{" "}
                    {data.observation.windDirDeg != null
                      ? windDirectionLabel(data.observation.windDirDeg)
                      : "VRB"}
                  </p>
                  {data.observation.gustKmh != null && (
                    <p className="text-xs text-amber-400">
                      Ráfaga {data.observation.gustKmh} km/h
                    </p>
                  )}
                </div>
              )}
              <div className="rounded-lg bg-slate-950/60 p-3">
                <p className="text-xs text-slate-400">Visibilidad</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {data.observation.visibilityLabel}
                </p>
              </div>
              {data.observation.tempC != null && (
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Temperatura</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">
                    {data.observation.tempC}°C
                  </p>
                </div>
              )}
              {data.observation.qnhHpa != null && (
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">QNH</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">
                    {data.observation.qnhHpa} hPa
                  </p>
                </div>
              )}
              {data.observation.clouds.length > 0 && (
                <div className="col-span-2 rounded-lg bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Nubosidad</p>
                  <p className="mt-1 text-sm text-slate-100">
                    {data.observation.clouds
                      .map((c) => `${c.cover} ${c.feet} ft`)
                      .join(" · ")}
                  </p>
                </div>
              )}
              {data.observation.phenomena.length > 0 && (
                <div className="col-span-2 rounded-lg bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Fenómenos</p>
                  <p className="mt-1 text-sm text-amber-300">
                    {data.observation.phenomena.join(", ")}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {data.observation.observedAtLocal
                ? `Obs: ${data.observation.observedAtLocal} local`
                : ""}
              {data.observation.observedAtISO
                ? ` (${data.observation.observedAtISO.slice(11, 16)} UTC)`
                : ""}
              {data.observation.observedAtISO
                ? ` · hace ${minutesSince(data.observation.observedAtISO)} min`
                : ""}
            </p>
          </>
        )}
        {data && <DataSourceBadge meta={data.meta} />}
      </CardContent>
    </Card>
  );
}
