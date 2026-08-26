import type { ReactNode } from "react";
import type { WeatherSnapshot } from "./weather.types";

function weatherCodeEmoji(code: number | null): string {
  if (code === null) return "❓";
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

function localTime(isoLocal: string | null): string {
  return isoLocal ? isoLocal.slice(11, 16) : "—";
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export function WeatherPanel({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { current, sun } = snapshot;
  const windDir =
    current.windDirectionDeg === null ? null : (
      <span
        aria-hidden
        className="inline-block text-ok"
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
          {current.temperatureC === null ? "—" : `${Math.round(current.temperatureC)}°C`}
        </p>
      </div>

      {snapshot.status === "PARTIAL" && (
        <output className="block rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
          Algunos datos no están disponibles en este momento. Evalúa con cautela.
        </output>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="Viento 10 m"
          value={
            current.windSpeedKmh === null ? (
              "—"
            ) : (
              <>
                {current.windSpeedKmh} km/h
                {windDir && <span className="ml-1 inline-block">{windDir}</span>}
              </>
            )
          }
        />
        <Metric label="Ráfagas" value={current.windGustsKmh === null ? "—" : `${current.windGustsKmh} km/h`} />
        <Metric label="Viento 100 m (crucero)" value={snapshot.windSpeed100mKmh === null ? "—" : `${snapshot.windSpeed100mKmh} km/h`} />
        <Metric label="Precipitación" value={current.precipitationMm === null ? "—" : `${current.precipitationMm} mm`} />
        <Metric label="Humedad" value={current.humidityPct === null ? "—" : `${current.humidityPct}%`} />
        <Metric label="Sensación térmica" value={current.apparentTemperatureC === null ? "—" : `${Math.round(current.apparentTemperatureC)}°C`} />
        <Metric label="Amanecer" value={localTime(sun.sunriseLocal)} />
        <Metric label="Atardecer" value={localTime(sun.sunsetLocal)} />
      </div>

      <footer className="text-xs text-slate-500">Datos: Open-Meteo · Licencia CC BY 4.0</footer>
    </section>
  );
}
