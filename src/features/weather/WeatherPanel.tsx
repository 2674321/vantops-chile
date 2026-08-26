import type { ReactNode } from "react";
import type { WeatherSnapshot } from "../../domain/weather";
import type { DataSourceMeta } from "../../domain/sourceMeta";
import { RefreshCw } from "lucide-react";

export function weatherCodeEmoji(code: number): string {
  if (code === 0) return "☀";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫";
  if (code <= 67) return "🌧";
  if (code <= 77) return "❄";
  if (code <= 82) return "🌦";
  if (code <= 86) return "❄";
  return "⛈";
}

export function windDirectionLabel(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export function DataSourceBadge({
  meta,
  onRetry,
}: {
  meta: DataSourceMeta;
  onRetry?: () => void;
}) {
  const ageMs = Date.now() - new Date(meta.receivedAt).getTime();
  const ageMin = Math.max(0, Math.round(ageMs / 60_000));
  const isStale = meta.status === "stale" || ageMin > 30;
  const color =
    meta.status === "error"
      ? "text-red-400"
      : isStale
        ? "text-amber-400"
        : "text-emerald-400";
  const label =
    meta.status === "error"
      ? "Error"
      : meta.status === "no-data"
        ? "Sin datos"
        : isStale
          ? `Antiguo hace ${ageMin} min`
          : `Actualizado hace ${ageMin} min`;
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
      <span className={`inline-block h-2 w-2 rounded-full ${color.replace("text-", "bg-")}`} />
      <span>{label} · Fuente: {meta.source}</span>
      {onRetry && meta.status === "error" && (
        <button type="button" onClick={onRetry} className="ml-auto text-sky-400 hover:text-sky-300">
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function WeatherPanel({
  snapshot,
  onRefresh,
}: {
  snapshot: WeatherSnapshot;
  onRefresh?: () => void;
}) {
  const { current } = snapshot;
  const windDir =
    current.windDirectionDeg === null ? null : (
      <span
        aria-hidden
        className="inline-block text-sky-400"
        style={{ transform: `rotate(${current.windDirectionDeg}deg)` }}
      >
        ↑
      </span>
    );
  return (
    <section aria-label="Condiciones actuales" className="space-y-4">
      <div className="flex items-baseline gap-4">
        <span aria-hidden className="text-6xl sm:text-7xl">
          {weatherCodeEmoji(current.weatherCode)}
        </span>
        <p className="text-5xl font-bold sm:text-6xl">
          {current.temperatureC === null
            ? "—"
            : `${Math.round(current.temperatureC)}°C`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="Viento 10 m"
          value={
            current.windSpeedKmh === null
              ? "—"
              : `${current.windSpeedKmh} km/h`
          }
        />
        {windDir && (
          <Metric
            label="Dirección"
            value={
              <>
                {windDirectionLabel(current.windDirectionDeg ?? 0)}{" "}
                {windDir}
              </>
            }
          />
        )}
        <Metric
          label="Ráfagas"
          value={
            current.windGustsKmh === null
              ? "—"
              : `${current.windGustsKmh} km/h`
          }
        />
        <Metric
          label="Viento 100 m"
          value={
            current.windSpeed100mKmh === null
              ? "—"
              : `${current.windSpeed100mKmh} km/h`
          }
        />
        <Metric
          label="Precipitación"
          value={
            current.precipitationMm === null
              ? "—"
              : `${current.precipitationMm} mm`
          }
        />
        <Metric
          label="Humedad"
          value={
            current.humidityPct === null
              ? "—"
              : `${current.humidityPct}%`
          }
        />
        <Metric
          label="Visibilidad"
          value={
            current.visibilityM === null
              ? "—"
              : current.visibilityM >= 10_000
                ? "≥10 km"
                : `${current.visibilityM} m`
          }
        />
        <Metric
          label="Nubosidad"
          value={
            current.cloudCoverPct === null
              ? "—"
              : `${current.cloudCoverPct}%`
          }
        />
      </div>

      <footer className="flex items-center justify-between text-xs text-slate-500">
        <span>Datos: Open-Meteo · Licencia CC BY 4.0</span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-sky-400 hover:text-sky-300"
            aria-label="Actualizar clima"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
      </footer>
    </section>
  );
}
