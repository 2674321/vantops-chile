import { useQuery } from "@tanstack/react-query";
import { Crosshair } from "lucide-react";
import { useState } from "react";
import { DataSourceBadge } from "../../components/DataSourceBadge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { formatCoordinate, isValidCoordinate, type Coordinate } from "../../domain/coordinate";
import {
  getCurrentCoordinate,
  loadLastLocation,
  saveLastLocation,
} from "../location/geolocation";
import { fetchWeatherSnapshot } from "../weather/weather.service";
import { WeatherPanel } from "../weather/WeatherPanel";
import { esCL as t } from "../../i18n/es-CL";

type GeoErrorKey = "geoDenied" | "geoUnavailable" | "geoTimeout";

const GEO_ERROR_MAP: Record<string, GeoErrorKey> = {
  GEOLOCATION_DENIED: "geoDenied",
  GEOLOCATION_UNAVAILABLE: "geoUnavailable",
  GEOLOCATION_TIMEOUT: "geoTimeout",
};

function WeatherSection({ coordinate }: { coordinate: Coordinate }) {
  const key = `${coordinate.latitude.toFixed(4)},${coordinate.longitude.toFixed(4)}`;
  const query = useQuery({
    queryKey: ["weather", key],
    queryFn: () => fetchWeatherSnapshot(coordinate),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Condiciones actuales</CardTitle>
        <DataSourceBadge
          status={query.isError ? "ERROR" : (query.data?.status ?? "ERROR")}
          fetchedAtIso={query.data?.fetchedAtIso}
          onRetry={() => query.refetch()}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-400">{formatCoordinate(coordinate)}</p>
        {query.isPending && <p className="text-sm text-slate-400">Consultando fuente…</p>}
        {query.isError && (
          <p role="alert" className="text-sm text-bad">
            {t.weather.errorMessage}
          </p>
        )}
        {query.data && <WeatherPanel snapshot={query.data} />}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [coordinate, setCoordinate] = useState<Coordinate | null>(() => loadLastLocation());
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  function handleUseLocation() {
    setGeoMessage(null);
    setLocating(true);
    getCurrentCoordinate()
      .then((coord) => {
        saveLastLocation(coord);
        setCoordinate(coord);
      })
      .catch((error: unknown) => {
        const code = error instanceof Error ? error.message : "";
        const key = GEO_ERROR_MAP[code] ?? "geoUnavailable";
        setGeoMessage(t.dashboard[key]);
      })
      .finally(() => setLocating(false));
  }

  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const latRaw = manualLat.trim();
    const lonRaw = manualLon.trim();
    // campos vacíos: no hacer nada (evita error falso)
    if (!latRaw && !lonRaw) return;
    const lat = Number.parseFloat(latRaw.replace(",", "."));
    const lon = Number.parseFloat(lonRaw.replace(",", "."));
    if (!isValidCoordinate(lat, lon)) {
      setManualError(t.dashboard.invalidCoords);
      return;
    }
    setManualError(null);
    const coord = { latitude: lat, longitude: lon };
    saveLastLocation(coord);
    setCoordinate(coord);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t.appName}</h1>
        <p className="text-sm text-slate-400">{t.tagline}</p>
      </header>

      <Button size="lg" className="w-full" onClick={handleUseLocation} disabled={locating}>
        <Crosshair aria-hidden className="h-5 w-5" />
        {locating ? t.dashboard.locating : t.dashboard.useMyLocation}
      </Button>

      {geoMessage && (
        <p role="alert" className="text-center text-sm text-warn">
          {geoMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.manualTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleManualSubmit}>
            <input
              className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-sky-500"
              inputMode="decimal"
              placeholder="-29.9070"
              aria-label="Latitud"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
            />
            <input
              className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-sky-500"
              inputMode="decimal"
              placeholder="-71.2500"
              aria-label="Longitud"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
            />
            <Button type="submit" variant="outline">
              {t.dashboard.showWeather}
            </Button>
          </form>
          {manualError && (
            <p role="alert" className="mt-2 text-sm text-bad">
              {manualError}
            </p>
          )}
        </CardContent>
      </Card>

      {coordinate && (
        <>
          <p className="text-xs text-slate-500">
            {t.dashboard.lastUsed} {formatCoordinate(coordinate)}
          </p>
          <WeatherSection coordinate={coordinate} />
        </>
      )}
    </div>
  );
}
