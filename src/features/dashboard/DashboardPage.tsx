import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWeatherSnapshot } from "../../providers/weather/openMeteoWeather";
import { WeatherPanel, DataSourceBadge } from "../weather/WeatherPanel";
import { WeatherTimeline } from "../weather/WeatherTimeline";
import { ElevationCard } from "../elevation/ElevationCard";
import { SolarCard } from "../solar/SolarCard";
import { NearbyMetarCard } from "../observations/NearbyMetarCard";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { AssessmentCard } from "../assessment/AssessmentCard";
import { OperationWindowCard } from "../assessment/OperationWindowCard";
import { ChecklistCard } from "../checklist/ChecklistCard";
import { AircraftSelector } from "../aircraft/AircraftSelector";
import { InstallPromptCard } from "../pwa/InstallPromptCard";
import { OperationZoneControl } from "./OperationZoneControl";
import { Button } from "../../components/ui/button";
import { MapPin, Plane, Battery, ClipboardCheck } from "lucide-react";
import { useLastCoordinate } from "../../hooks/useLastCoordinate";
import { computeSolarTimes } from "../../providers/solar/suncalcSolar";
import { evaluateFlight } from "../../domain/assessment/evaluator";
import { assessHourlyForecast } from "../../domain/assessment/hourly";
import { findOperationWindow } from "../../domain/assessment/operationWindow";
import { applyAircraftLimits } from "../../domain/assessment/aircraft";
import type { AircraftProfile } from "../../domain/assessment/aircraft";
import type { FlightLimits } from "../../domain/assessment/limits";
import {
  loadActiveAircraft,
  loadFlightLimits,
  loadOperationRadius,
  loadDisplayPreferences,
  saveOperationRadius,
} from "../../storage/settings";
import { fetchNearestObservation } from "../../providers/observations/vatsimObservation";
import { useToast } from "../../components/toast/useToast";
import { detectReconnection } from "../../domain/connectivity";
import { esCL as t } from "../../i18n/es-CL";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import {
  DEFAULT_DISPLAY_PREFERENCES,
  type DisplayPreferences,
} from "../../domain/displayPreferences";
import { createFlightPlan } from "../../storage/repositories/flightPlanRepository";
import {
  captureAssessmentSnapshot,
  captureObservationSnapshot,
  captureWeatherSnapshot,
} from "../../domain/flightPlan/snapshots";

export default function DashboardPage() {
  const { coordinate } = useLastCoordinate();
  const [aircraft, setAircraft] = useState<AircraftProfile | null>(null);
  const [flightLimits, setFlightLimits] = useState<FlightLimits>({});
  const [operationRadius, setOperationRadius] = useState<number | null>(null);
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreferences>(DEFAULT_DISPLAY_PREFERENCES);
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const toast = useToast();
  const previousOnlineRef = useRef<boolean | null>(null);
  const navigate = useNavigate();
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    loadActiveAircraft().then(setAircraft);
    loadFlightLimits().then(setFlightLimits);
    loadOperationRadius().then(setOperationRadius);
    loadDisplayPreferences().then(setDisplayPreferences);
  }, []);

  const handleRadiusChange = useCallback(
    async (radiusMeters: number) => {
      const previousRadius = operationRadius;
      setOperationRadius(radiusMeters);
      try {
        await saveOperationRadius(radiusMeters);
      } catch {
        setOperationRadius(previousRadius ?? null);
        toast.error(t.feedback.radiusSaveError);
      }
    },
    [operationRadius, toast],
  );

  useEffect(() => {
    if (detectReconnection(previousOnlineRef.current, online)) {
      toast.info(t.offline.restored);
    }
    previousOnlineRef.current = online;
  }, [online, toast]);

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

  const effectiveLimits = useMemo(
    () => applyAircraftLimits(flightLimits, aircraft ?? undefined),
    [flightLimits, aircraft]
  );

  const assessment = useMemo(() => {
    if (!weatherQuery.data) return null;
    const useWind100m = effectiveLimits.windReferenceHeight === 100;
    return evaluateFlight({
      windSpeedKmh: useWind100m
        ? weatherQuery.data.current.windSpeed100mKmh
        : weatherQuery.data.current.windSpeedKmh,
      gustKmh: weatherQuery.data.current.windGustsKmh,
      windSpeed100mKmh: weatherQuery.data.current.windSpeed100mKmh,
      windDirectionDeg: weatherQuery.data.current.windDirectionDeg,
      temperatureC: weatherQuery.data.current.temperatureC,
      precipitationMm: weatherQuery.data.current.precipitationMm,
      visibilityM: weatherQuery.data.current.visibilityM,
      humidityPct: weatherQuery.data.current.humidityPct,
      cloudCoverPct: weatherQuery.data.current.cloudCoverPct,
      windMaxKmh: effectiveLimits.windMaxKmh,
      gustMaxKmh: effectiveLimits.gustMaxKmh,
      precipitationMaxMm: effectiveLimits.precipitationMaxMm,
      visibilityMinMeters: effectiveLimits.visibilityMinMeters,
      temperatureMinC: effectiveLimits.temperatureMinC,
      temperatureMaxC: effectiveLimits.temperatureMaxC,
      sourceStatus: weatherQuery.data.meta.status,
    });
  }, [weatherQuery.data, effectiveLimits]);

  const hourlyAssessments = useMemo(
    () =>
      assessHourlyForecast(
        weatherQuery.data?.hourly ?? [],
        effectiveLimits,
        weatherQuery.data?.meta.status
      ),
    [weatherQuery.data, effectiveLimits]
  );

  const operationWindow = useMemo(
    () =>
      findOperationWindow(weatherQuery.data?.hourly ?? [], effectiveLimits, {
        sourceStatus: weatherQuery.data?.meta.status,
      }),
    [weatherQuery.data, effectiveLimits]
  );

  const handleSavePlan = useCallback(async () => {
    if (!coordinate || savingPlan) return;
    setSavingPlan(true);
    const capturedAt = new Date().toISOString();
    try {
      await createFlightPlan({
        location: coordinate,
        radiusMeters: operationRadius ?? undefined,
        aircraftId: aircraft?.id,
        aircraftSnapshot: aircraft
          ? {
              id: aircraft.id,
              name: aircraft.name,
              type: aircraft.type,
              manufacturer: aircraft.manufacturer,
              model: aircraft.model,
            }
          : undefined,
        flightLimitsSnapshot: { ...effectiveLimits },
        weatherSnapshot: weatherQuery.data
          ? captureWeatherSnapshot(weatherQuery.data, capturedAt)
          : undefined,
        observationSnapshot: metarQuery.data
          ? captureObservationSnapshot(metarQuery.data, capturedAt)
          : undefined,
        assessmentSnapshot:
          assessment && weatherQuery.data
            ? captureAssessmentSnapshot(assessment, effectiveLimits, capturedAt)
            : undefined,
        status: "DRAFT",
      });
      toast.success(
        weatherQuery.data
          ? "Preparación guardada con una copia de los datos consultados."
          : "Preparación offline guardada; la evaluación queda sin verificar."
      );
      navigate("/operacion");
    } catch {
      toast.error("No se pudo guardar la preparación en este dispositivo.");
    } finally {
      setSavingPlan(false);
    }
  }, [
    coordinate,
    savingPlan,
    operationRadius,
    aircraft,
    effectiveLimits,
    weatherQuery.data,
    metarQuery.data,
    assessment,
    toast,
    navigate,
  ]);

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

      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Condiciones
        </h1>
        <p className="text-base text-slate-400">Meteorología, evaluación y checklist del punto activo del mapa.</p>
      </header>

      <InstallPromptCard />

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-sky-400" />
            Punto activo del mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-300">{coordinate ? `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}` : "Aún no has confirmado un punto operacional."}</p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/?panel=ubicacion")}>Cambiar punto en el mapa</Button>
        </CardContent>
      </Card>

      {coordinate && (
        <section className="space-y-6">
          <OperationZoneControl
            radiusMeters={operationRadius}
            onChange={handleRadiusChange}
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
                  preferences={displayPreferences}
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

          {weatherQuery.data && (
            <Card>
              <CardContent className="py-5">
                <WeatherTimeline
                  hours={weatherQuery.data.hourly}
                  assessments={hourlyAssessments}
                  preferences={displayPreferences}
                />
              </CardContent>
            </Card>
          )}

          {weatherQuery.data && (
            <OperationWindowCard
              window={operationWindow}
              onGoSettings={() => navigate("/ajustes")}
            />
          )}

          <ElevationCard
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
            preferences={displayPreferences}
          />
          <SolarCard
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
            utcOffsetSeconds={weatherQuery.data?.utcOffsetSeconds}
          />
          <NearbyMetarCard
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
            preferences={displayPreferences}
          />

          {weatherQuery.data && assessment && (
            <AssessmentCard
              snapshot={weatherQuery.data}
              assessment={assessment}
              expertMode={displayPreferences.expertMode}
            />
          )}

          <Card>
            <CardContent className="space-y-2 py-4">
              <Button className="w-full" onClick={handleSavePlan} disabled={savingPlan}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                {savingPlan ? "Guardando preparación…" : "Guardar preparación actual"}
              </Button>
              <p className="text-xs text-slate-500">
                Guarda una copia local de ubicación, aeronave, límites y datos disponibles. Si estás offline, el plan queda explícitamente sin evaluación verificable.
              </p>
            </CardContent>
          </Card>

          <ChecklistCard
            key={`location-${coordinate.latitude.toFixed(5)}-${coordinate.longitude.toFixed(5)}`}
            weather={weatherQuery.data ?? null}
            solar={solarTimes}
            assessment={assessment}
            aircraft={aircraft}
            stationIcao={stationIcao}
            storageScope={`location-${coordinate.latitude.toFixed(5)}-${coordinate.longitude.toFixed(5)}`}
          />
        </section>
      )}

      <footer className="text-center text-xs text-slate-600">
        {t.footer.attributions}
      </footer>
    </div>
  );
}
