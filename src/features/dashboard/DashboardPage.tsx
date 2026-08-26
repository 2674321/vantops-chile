import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWeatherSnapshot } from "../../providers/weather/openMeteoWeather";
import { WeatherPanel, DataSourceBadge } from "../weather/WeatherPanel";
import MapPicker from "../map/LocationMap";
import { ElevationCard } from "../elevation/ElevationCard";
import { SolarCard } from "../solar/SolarCard";
import { NearbyMetarCard } from "../observations/NearbyMetarCard";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { AssessmentCard } from "../assessment/AssessmentCard";
import { ChecklistCard } from "../checklist/ChecklistCard";
import { Button } from "../../components/ui/button";
import { MapPin, Navigation, MapIcon } from "lucide-react";
import { useLastCoordinate } from "../../hooks/useLastCoordinate";
import { useMemo } from "react";
import { computeSolarTimes } from "../../providers/solar/suncalcSolar";
import { evaluateFlight } from "../../domain/assessment/evaluator";
import { loadFlightLimits } from "../../storage/settings";
import { esCL as t } from "../../i18n/es-CL";

export default function DashboardPage() {
  const { coordinate, saveCoordinate } = useLastCoordinate();
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const queryClient = useQueryClient();

  const weatherQuery = useQuery({
    queryKey: ["weather", coordinate?.latitude, coordinate?.longitude],
    queryFn: () =>
      fetchWeatherSnapshot(coordinate?.latitude ?? 0, coordinate?.longitude ?? 0),
    enabled: coordinate !== null,
    staleTime: 5 * 60_000,
    retry: 2,
  });

  const solarTimes = useMemo(
    () =>
      coordinate
        ? computeSolarTimes(new Date(), coordinate.latitude, coordinate.longitude)
        : null,
    [coordinate]
  );

  const assessment = useMemo(() => {
    if (!weatherQuery.data) return null;
    const limits = loadFlightLimits();
    return evaluateFlight({
      windSpeedKmh: weatherQuery.data.current.windSpeedKmh,
      gustKmh: weatherQuery.data.current.windGustsKmh,
      windSpeed100mKmh: weatherQuery.data.current.windSpeed100mKmh,
      windDirectionDeg: weatherQuery.data.current.windDirectionDeg,
      temperatureC: weatherQuery.data.current.temperatureC,
      precipitationMm: weatherQuery.data.current.precipitationMm,
      visibilityM: weatherQuery.data.current.visibilityM,
      humidityPct: weatherQuery.data.current.humidityPct,
      cloudCoverPct: weatherQuery.data.current.cloudCoverPct,
      windMaxKmh: limits.windMaxKmh,
      gustMaxKmh: limits.gustMaxKmh,
      precipitationMaxMm: limits.precipitationMaxMm,
      visibilityMinMeters: limits.visibilityMinMeters,
      temperatureMinC: limits.temperatureMinC,
      temperatureMaxC: limits.temperatureMaxC,
    });
  }, [weatherQuery.data]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Number.parseFloat(manualLat);
    const lon = Number.parseFloat(manualLon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;
    saveCoordinate({ latitude: lat, longitude: lon });
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveCoordinate({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {},
      { timeout: 10_000, maximumAge: 60_000 }
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-7 px-5 py-10 sm:px-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.appName}
        </h1>
        <p className="text-base text-slate-400">{t.tagline}</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleGeolocation} className="h-12 text-base">
          <Navigation className="mr-2 h-4 w-4" />
          {t.dashboard.useMyLocation}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-sky-400" />
            Coordenadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coordinate && (
            <p className="mb-3 text-sm text-slate-300">
              {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
            </p>
          )}
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={handleManualSubmit}
          >
            <input
              className="h-11 min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base outline-none focus:border-sky-500"
              inputMode="decimal"
              placeholder="-29.9070"
              aria-label="Latitud"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
            />
            <input
              className="h-11 min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base outline-none focus:border-sky-500"
              inputMode="decimal"
              placeholder="-71.2500"
              aria-label="Longitud"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full sm:col-span-2"
            >
              {t.dashboard.showWeather}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!coordinate && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MapIcon className="h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-400">
              Usa tu ubicación o ingresa coordenadas para ver el mapa y el clima.
            </p>
          </CardContent>
        </Card>
      )}

      {coordinate && (
        <section className="space-y-6">
          <MapPicker
            coordinate={coordinate}
            onPick={saveCoordinate}
          />

          {weatherQuery.isLoading && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-slate-400">
                Consultando Open-Meteo…
              </CardContent>
            </Card>
          )}

          {weatherQuery.error && (
            <Card>
              <CardContent className="space-y-2 py-6 text-center">
                <p className="text-sm text-red-400">
                  Sin datos meteorológicos
                </p>
                <p className="text-xs text-slate-500">
                  {(weatherQuery.error as Error).message}
                </p>
              </CardContent>
            </Card>
          )}

          {weatherQuery.data && (
            <Card>
              <CardContent className="space-y-3 py-5">
                <WeatherPanel
                  snapshot={weatherQuery.data}
                  onRefresh={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["weather"],
                    })
                  }
                />
                <DataSourceBadge
                  meta={weatherQuery.data.meta}
                  onRetry={() => weatherQuery.refetch()}
                />
              </CardContent>
            </Card>
          )}

          <ElevationCard
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
          />
          <SolarCard
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
          />
          <NearbyMetarCard
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
          />

          {weatherQuery.data && assessment && (
            <AssessmentCard snapshot={weatherQuery.data} assessment={assessment} />
          )}

          <ChecklistCard
            weather={weatherQuery.data ?? null}
            solar={solarTimes}
            assessment={assessment}
          />
        </section>
      )}

      <footer className="text-center text-xs text-slate-600">
        {t.footer.attributions}
      </footer>
    </div>
  );
}
