import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWeatherSnapshot } from "../../providers/weather/openMeteoWeather";
import { WeatherPanel, DataSourceBadge } from "../weather/WeatherPanel";
import { ElevationCard } from "../elevation/ElevationCard";
import { SolarCard } from "../solar/SolarCard";
import { NearbyMetarCard } from "../observations/NearbyMetarCard";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { AssessmentCard } from "../assessment/AssessmentCard";
import { ChecklistCard } from "../checklist/ChecklistCard";
import { AircraftSelector } from "../aircraft/AircraftSelector";
import { Button } from "../../components/ui/button";
import { MapPin, Navigation, MapIcon, Plane, Battery, Settings2, AlertTriangle } from "lucide-react";
import { useLastCoordinate } from "../../hooks/useLastCoordinate";
import { computeSolarTimes } from "../../providers/solar/suncalcSolar";
import { evaluateFlight } from "../../domain/assessment/evaluator";
import { applyAircraftLimits } from "../../domain/assessment/aircraft";
import type { AircraftProfile } from "../../domain/assessment/aircraft";
import type { FlightLimits } from "../../domain/assessment/limits";
import { loadActiveAircraft, loadFlightLimits } from "../../storage/settings";
import { fetchNearestObservation } from "../../providers/observations/vatsimObservation";
import { searchLocation } from "../../providers/geocoding/nominatimGeocoding";
import type { GeocodingResult } from "../../providers/geocoding/nominatimGeocoding";
import { NOMINATIM_ATTRIBUTION } from "../../providers/geocoding/nominatimGeocoding";
import { esCL as t } from "../../i18n/es-CL";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

const MapPicker = lazy(() => import("../map/LocationMap"));

export default function DashboardPage() {
  const { coordinate, saveCoordinate } = useLastCoordinate();
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [aircraft, setAircraft] = useState<AircraftProfile | null>(null);
  const [flightLimits, setFlightLimits] = useState<FlightLimits>({});
  const [geoError, setGeoError] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveAircraft().then(setAircraft);
    loadFlightLimits().then(setFlightLimits);
  }, []);

  useEffect(() => {
    if (online) {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [online]);

  const handleAircraftChange = useCallback((newAircraft: AircraftProfile | null) => {
    setAircraft(newAircraft);
  }, []);

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

  const metarQuery = useQuery({
    queryKey: ["metar-icao", coordinate?.latitude, coordinate?.longitude],
    queryFn: () => fetchNearestObservation(coordinate?.latitude ?? 0, coordinate?.longitude ?? 0),
    enabled: coordinate !== null,
    staleTime: 30 * 60_000,
    retry: 1,
  });

  const stationIcao = metarQuery.data?.stationIcao;

  const assessment = useMemo(() => {
    if (!weatherQuery.data) return null;
    const limits = applyAircraftLimits(flightLimits, aircraft ?? undefined);
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
  }, [weatherQuery.data, aircraft, flightLimits]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    const lat = Number.parseFloat(manualLat);
    const lon = Number.parseFloat(manualLon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setManualError("Ingresa valores numéricos válidos para latitud y longitud.");
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setManualError("Coordenadas inválidas. Revisa los valores ingresados.");
      return;
    }
    saveCoordinate({ latitude: lat, longitude: lon });
  };

  const handleGeolocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocalización no disponible en este dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoError(null);
        saveCoordinate({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Permiso de ubicación rechazado. Puedes ingresar coordenadas manualmente.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError("Ubicación no disponible en este dispositivo.");
        } else if (err.code === err.TIMEOUT) {
          setGeoError("Tiempo agotado al obtener la ubicación. Intenta nuevamente.");
        } else {
          setGeoError("Error desconocido al obtener la ubicación.");
        }
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setSearchResults([]);
    const query = searchQuery.trim();
    if (query === "") {
      setSearchError("Ingresa una dirección, localidad o lugar para buscar.");
      return;
    }
    setSearching(true);
    try {
      const results = await searchLocation(query);
      setSearchResults(results);
      setSearchExecuted(true);
      if (results.length === 0) {
        setSearchError("Sin resultados. Usa coordenadas manuales o el mapa.");
      }
    } catch (err) {
      setSearchError(
        err instanceof Error && err.name === "AbortError"
          ? "La búsqueda tardó demasiado. Revisa tu conexión e intenta nuevamente."
          : "No se pudo buscar la ubicación. Verifica tu conexión."
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-7 px-5 py-10 sm:px-6">
      {!online && (
        <Card>
          <CardContent className="space-y-1 py-3 text-center">
            <p className="text-sm font-medium text-amber-300">{t.offline.offline}</p>
            <p className="text-xs text-slate-400">{t.offline.bannerMessage}</p>
          </CardContent>
        </Card>
      )}

      {showRestored && online && (
        <Card>
          <CardContent className="py-2 text-center">
            <p className="text-xs text-emerald-400">{t.offline.restored}</p>
          </CardContent>
        </Card>
      )}

      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.appName}
        </h1>
        <p className="text-base text-slate-400">{t.tagline}</p>
      </header>

      <AircraftSelector onAircraftChange={handleAircraftChange} />

      <Card>
        <CardContent className="py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones rápidas</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/bitacora/nuevo")} className="flex flex-col items-center gap-1 py-3">
              <Plane className="h-4 w-4" />
              <span className="text-xs">{t.logbook.registerFlight}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/lugares")} className="flex flex-col items-center gap-1 py-3">
              <MapPin className="h-4 w-4" />
              <span className="text-xs">{t.places.title}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/bitacora/baterias")} className="flex flex-col items-center gap-1 py-3">
              <Battery className="h-4 w-4" />
              <span className="text-xs">{t.battery.title}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleGeolocation} className="h-12 text-base">
          <Navigation className="mr-2 h-4 w-4" />
          {t.dashboard.useMyLocation}
        </Button>
        <Button variant="outline" onClick={() => navigate("/ajustes")} className="h-12 text-base">
          <Settings2 className="mr-2 h-4 w-4" />
          Ajustes
        </Button>
      </div>

      {geoError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{geoError}</span>
        </div>
      )}

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
            className="mb-4 space-y-2 rounded-lg border border-slate-700 bg-slate-900/40 p-3"
            onSubmit={handleSearch}
          >
            <label htmlFor="location-search" className="mb-1 block text-xs font-medium text-slate-400">
              Buscar dirección, localidad o lugar
            </label>
            <div className="flex gap-2">
              <input
                id="location-search"
                type="search"
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base outline-none focus:border-sky-500"
                placeholder="Totoralillo, Coquimbo"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError(null);
                }}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={searching}
                className="shrink-0"
              >
                {searching ? "Buscando…" : "Buscar"}
              </Button>
            </div>

            {searchError && (
              <p role="alert" className="text-sm text-amber-300">
                {searchError}
              </p>
            )}

            {searchResults.length > 0 && (
              <ul className="space-y-1" aria-label="Resultados de búsqueda">
                {searchResults.map((result) => (
                  <li key={result.placeId}>
                    <button
                      type="button"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm text-slate-300 hover:border-sky-600 hover:text-sky-300"
                      onClick={() => {
                        saveCoordinate({ latitude: result.latitude, longitude: result.longitude });
                        setSearchQuery("");
                        setSearchResults([]);
                        setSearchExecuted(false);
                      }}
                    >
                      {result.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searchExecuted && searchResults.length === 0 && !searchError && (
              <p className="text-xs text-slate-500">Sin resultados para mostrar.</p>
            )}

            <p className="text-[11px] text-slate-600">{NOMINATIM_ATTRIBUTION}</p>
          </form>

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

          {manualError && (
            <p role="alert" className="text-sm text-red-400">
              {manualError}
            </p>
          )}
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
          <Suspense
            fallback={
              <Card>
                <CardContent className="py-10 text-center text-sm text-slate-400">
                  Cargando mapa…
                </CardContent>
              </Card>
            }
          >
            <MapPicker
              coordinate={coordinate}
              onPick={saveCoordinate}
            />
          </Suspense>

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
            aircraft={aircraft}
            stationIcao={stationIcao}
          />
        </section>
      )}

      <footer className="text-center text-xs text-slate-600">
        {t.footer.attributions}
      </footer>
    </div>
  );
}
