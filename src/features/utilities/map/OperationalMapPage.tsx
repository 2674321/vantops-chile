import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Crosshair, Expand, Eye, EyeOff, LocateFixed, MapPinned, MapPin, Plus, Ruler, Shrink, Star, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { formatCoordinate, parseCoordinateFields, type Coordinate } from "../../../domain/coordinate";
import { formatRadius, MAX_RADIUS_METERS, MIN_RADIUS_METERS } from "../../../domain/operationZone";
import { MAP_ZONE_COLORS, MAX_ZONES_PER_MAP, haversineDistanceMeters, initialBearingDegrees, isValidSavedOperationalMap, parseStrictRadiusMeters, zoneMetrics, type MapRadiusZone, type SavedOperationalMap } from "../../../domain/operationalMap";
import { createLocalId } from "../../../lib/id";
import { LocationSearch } from "../../dashboard/LocationSearch";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { loadDisplayPreferences, loadLastCoordinate } from "../../../storage/settings";
import { listFlightPlans } from "../../../storage/repositories/flightPlanRepository";
import { deleteOperationalMap, duplicateOperationalMap, listOperationalMaps, saveOperationalMap } from "../../../storage/repositories/operationalMapRepository";
import { useToast } from "../../../components/toast/useToast";
import { esCL as t } from "../../../i18n/es-CL";
import type { SavedPlace } from "../../../domain/logbook/types";
import type { FlightPlan } from "../../../domain/flightPlan/types";
import type { MapTool } from "./OperationalMapCanvas";
import { AutosaveController, type AutosaveView } from "../../../lib/autosave/AutosaveController";
import { AutosaveStatus } from "../../../components/autosave/AutosaveStatus";
import { addSavedPin, loadSavedPins, migrateInlineMapPins, moveSavedPin, removeSavedPin, updateSavedPin } from "./pinActions";
import { buildLocationSelection, type LocationSource } from "../../../domain/locationSelection";
import { setActiveLocation } from "../../../storage/activeLocationRepository";
import { destinationForPick, parseMapPickIntent } from "../../../domain/mapPickIntent";

const OperationalMapCanvas = lazy(() => import("./OperationalMapCanvas"));
const DEFAULT_CENTER: Coordinate = { latitude: -33.4489, longitude: -70.6693 };

function emptyMap(center: Coordinate): SavedOperationalMap {
  const now = new Date().toISOString();
  return { id: createLocalId(), schemaVersion: 1, name: "Mapa de operaciones", initialView: { center, zoom: 12 }, zones: [], pins: [], createdAt: now, updatedAt: now };
}

const fieldClass = "h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-sky-500";

export function OperationalMapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQueryRef = useRef({ mapId: searchParams.get("mapId"), zoneId: searchParams.get("zoneId"), mode: searchParams.get("mode"), pickFor: parseMapPickIntent(searchParams.get("pickFor")), panel: searchParams.get("panel") });
  const toast = useToast();
  const online = useOnlineStatus();
  const [maps, setMaps] = useState<SavedOperationalMap[]>([]);
  const [draft, setDraft] = useState(() => emptyMap(DEFAULT_CENTER));
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [lat, setLat] = useState(String(DEFAULT_CENTER.latitude));
  const [lon, setLon] = useState(String(DEFAULT_CENTER.longitude));
  const [selectionSource, setSelectionSource] = useState<LocationSource>("legacy-last-coordinate");
  const [selectionLabel, setSelectionLabel] = useState<string | undefined>();
  const [selectionAccuracy, setSelectionAccuracy] = useState<number | undefined>();
  const [tool, setTool] = useState<MapTool>("explore");
  const [measurement, setMeasurement] = useState<{ a?: Coordinate; b?: Coordinate }>({});
  const [fitNonce, setFitNonce] = useState(0);
  const [recenterNonce, setRecenterNonce] = useState(0);
  const [customRadius, setCustomRadius] = useState("750");
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [plans, setPlans] = useState<FlightPlan[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [movablePinId, setMovablePinId] = useState<string | null>(null);
  const [movableZoneId, setMovableZoneId] = useState<string | null>(null);
  const [pinSearch, setPinSearch] = useState("");
  const [newPinName, setNewPinName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expertMode, setExpertMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const autosave = useMemo(() => new AutosaveController<SavedOperationalMap>(async (value) => { await saveOperationalMap(value); setMaps(await listOperationalMaps()); }, (value) => isValidSavedOperationalMap(value) ? null : "El mapa necesita un nombre y datos válidos.", 550), []);
  const [saveState, setSaveState] = useState<AutosaveView>(autosave.snapshot);

  useEffect(() => { const unsubscribe = autosave.subscribe(setSaveState); return () => { unsubscribe(); autosave.stopTimers(); }; }, [autosave]);

  useEffect(() => { void (async () => {
    try {
      const [rawMaps, storedPlans, last, preferences] = await Promise.all([listOperationalMaps(), listFlightPlans(), loadLastCoordinate(), loadDisplayPreferences()]);
      const storedMaps: SavedOperationalMap[] = [];
      for (const map of rawMaps) storedMaps.push(await migrateInlineMapPins(map));
      const storedPlaces = await loadSavedPins();
      setMaps(storedMaps); setPlaces(storedPlaces); setPlans(storedPlans); setExpertMode(preferences.expertMode);
      const requestedMap = storedMaps.find((map) => map.id === initialQueryRef.current.mapId);
      const initial = requestedMap ?? storedMaps[0];
      if (initial) openMap(initial, initialQueryRef.current.zoneId); else if (last) applyCenter(last);
      if (initialQueryRef.current.mode === "measure") setTool("measure");
    } catch {
      setError("No fue posible abrir el almacenamiento local. El borrador seguirá disponible mientras esta pantalla permanezca abierta.");
    } finally {
      setLoading(false);
    }
  })(); }, []);

  const selectedZone = draft.zones.find((zone) => zone.id === selectedZoneId) ?? null;
  const selectedPin = places.find((pin) => pin.id === selectedPinId) ?? null;
  const filteredPlaces = useMemo(() => { const query = pinSearch.trim().toLocaleLowerCase("es-CL"); return [...places].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || a.name.localeCompare(b.name, "es-CL")).filter((pin) => !query || `${pin.name} ${pin.notes ?? ""}`.toLocaleLowerCase("es-CL").includes(query)); }, [pinSearch, places]);
  const dirty = saveState.revision !== saveState.persistedRevision;
  const measurementResult = useMemo(() => measurement.a && measurement.b ? { distance: haversineDistanceMeters(measurement.a, measurement.b), bearing: initialBearingDegrees(measurement.a, measurement.b) } : null, [measurement]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { window.removeEventListener("beforeunload", beforeUnload); };
  }, [dirty]);

  function applyCenter(next: Coordinate, shouldRecenter = true) { setCenter(next); setLat(String(next.latitude)); setLon(String(next.longitude)); if (shouldRecenter) setRecenterNonce((value) => value + 1); }
  function openMap(map: SavedOperationalMap, requestedZoneId?: string | null) { const copy = structuredClone(map); copy.pins ??= []; copy.pinnedPlaceIds ??= []; setDraft(copy); autosave.resetFromStorage(copy); const selected = copy.zones.find((zone) => zone.id === requestedZoneId) ?? copy.zones[0]; const next = selected?.center ?? copy.initialView?.center ?? DEFAULT_CENTER; applyCenter(next); setSelectedZoneId(selected?.id ?? null); setSelectedPinId(null); setError(null); }
  function mutate(mutator: (map: SavedOperationalMap) => SavedOperationalMap) { setDraft((current) => { const next = { ...mutator(current), updatedAt: new Date().toISOString() }; autosave.stage(next); return next; }); }
  async function leave(target: string) { if (await autosave.flush()) navigate(target); else setError("No se pudo guardar el mapa antes de salir. Reintenta o exporta el borrador."); }
  async function switchMap(map: SavedOperationalMap) { if (!await autosave.flush()) { setError("No se pudo guardar el mapa actual; no se abrió otro."); return; } openMap(map); }
  function updateZone(id: string, changes: Partial<MapRadiusZone>) { mutate((map) => ({ ...map, zones: map.zones.map((zone) => zone.id === id ? { ...zone, ...changes } : zone) })); }

  function pickOnMap(point: Coordinate) {
    if (tool === "center") { applyCenter(point, false); if (selectedZoneId) updateZone(selectedZoneId, { center: point }); setTool("explore"); return; }
    if (tool === "pin") { void addPin(point); setTool("explore"); return; }
    if (tool === "measure") setMeasurement((current) => !current.a || current.b ? { a: point } : { ...current, b: point });
  }

  function addZone(radiusMeters = 500) {
    if (draft.zones.length >= MAX_ZONES_PER_MAP) { setError(`Máximo ${MAX_ZONES_PER_MAP} zonas por mapa.`); return; }
    const id = createLocalId();
    const zone: MapRadiusZone = { id, name: `Radio ${formatRadius(radiusMeters)}`, center, radiusMeters, color: MAP_ZONE_COLORS[draft.zones.length % MAP_ZONE_COLORS.length], visible: true, fillOpacity: 0.12 };
    mutate((map) => ({ ...map, zones: [...map.zones, zone] })); setSelectedZoneId(id); setError(null);
  }

  function addCustomZone() {
    const parsed = parseStrictRadiusMeters(customRadius);
    if (parsed === null) { setError(`Radio válido entre ${MIN_RADIUS_METERS} y ${MAX_RADIUS_METERS} m.`); return; }
    addZone(parsed);
  }

  async function addPin(coordinate = center) {
    try { const pin = await addSavedPin({ name: newPinName.trim() || `Pin ${places.length + 1}`, coordinate }); setPlaces((current) => [...current, pin]); mutate((map) => ({ ...map, pinnedPlaceIds: [...new Set([...(map.pinnedPlaceIds ?? []), pin.id])] })); setSelectedPinId(pin.id); setSelectedZoneId(null); setNewPinName(""); setError(null); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo guardar el pin."); }
  }

  function moveZone(id: string, coordinate: Coordinate) { updateZone(id, { center: coordinate }); applyCenter(coordinate, false); }
  async function movePin(id: string, coordinate: Coordinate) { const previous = places.find((pin) => pin.id === id); if (!previous) return; setPlaces((current) => current.map((pin) => pin.id === id ? { ...pin, coordinate } : pin)); try { const updated = await moveSavedPin(id, coordinate); setPlaces((current) => current.map((pin) => pin.id === id ? updated : pin)); applyCenter(coordinate, false); setMovablePinId(null); } catch { setPlaces((current) => current.map((pin) => pin.id === id ? previous : pin)); setError("No se pudo mover el pin; se restauró la posición guardada."); } }
  async function removePin(id: string) { if (!window.confirm("¿Eliminar este pin guardado?")) return; try { await removeSavedPin(id); setPlaces((current) => current.filter((pin) => pin.id !== id)); mutate((map) => ({ ...map, pinnedPlaceIds: (map.pinnedPlaceIds ?? []).filter((pinId) => pinId !== id) })); setSelectedPinId(null); } catch { setError("No se pudo eliminar el pin."); } }

  function duplicateZone(zone: MapRadiusZone) { const copy = { ...zone, id: createLocalId(), name: `${zone.name} (copia)` }; mutate((map) => ({ ...map, zones: [...map.zones, copy] })); setSelectedZoneId(copy.id); }
  function removeZone(id: string) { if (!window.confirm("¿Eliminar este radio del mapa?")) return; mutate((map) => ({ ...map, zones: map.zones.filter((zone) => zone.id !== id) })); setSelectedZoneId(null); }

  async function save(): Promise<boolean> { const ok = await autosave.flush(); if (!ok) setError(autosave.snapshot.message ?? "No se pudo guardar el mapa."); return ok; }

  async function duplicateMap() { if (!await autosave.flush()) return; try { const copy = await duplicateOperationalMap(draft); setMaps(await listOperationalMaps()); openMap(copy); toast.success("Mapa duplicado."); } catch { setError("No se pudo duplicar el mapa en este dispositivo."); } }
  async function deleteMap() { if (!maps.some((map) => map.id === draft.id) || !window.confirm("¿Eliminar el mapa completo? Esta acción no elimina planes históricos ni pines guardados.")) return; autosave.stopTimers(); await deleteOperationalMap(draft.id); const next = await listOperationalMaps(); setMaps(next); if (next[0]) openMap(next[0]); else { const fresh = emptyMap(center); setDraft(fresh); autosave.stage(fresh); setSelectedZoneId(null); } }

  async function useZoneInPlan() {
    if (!selectedZone) return;
    if (!await save()) return;
    await setActiveLocation(buildLocationSelection(selectedZone.center, "map-click", { label: selectedZone.name, mapId: draft.id, zoneId: selectedZone.id }));
    navigate(`/operacion/nueva?mapId=${encodeURIComponent(draft.id)}&zoneId=${encodeURIComponent(selectedZone.id)}&returnTo=${encodeURIComponent("/utilidades/mapa")}`);
  }

  function applyManual() { const parsed = parseCoordinateFields(lat, lon); if (!parsed.ok) { setError("Ingresa coordenadas WGS84 válidas; no se reemplazarán por 0,0."); return; } applyCenter(parsed.coordinate); setSelectionSource("manual-coordinate"); setSelectionLabel(undefined); setSelectionAccuracy(undefined); setError(null); }
  function useLocation() { if (!navigator.geolocation) { setError("Geolocalización no disponible. Usa coordenadas o búsqueda."); return; } navigator.geolocation.getCurrentPosition((position) => { applyCenter({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setSelectionSource("gps-consented"); setSelectionLabel("Ubicación GPS autorizada"); setSelectionAccuracy(position.coords.accuracy || undefined); setError(position.coords.accuracy ? `Precisión informada por el dispositivo: ±${Math.round(position.coords.accuracy)} m.` : null); }, (geoError) => { setError(geoError.code === 1 ? "Permiso denegado. Puedes usar coordenadas, lugares o búsqueda." : geoError.code === 3 ? "Tiempo agotado al obtener ubicación." : "No fue posible obtener la ubicación."); }, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }); }
  async function useSelection(destination?: "plan-new" | "flight-new" | "dashboard") { if (!await autosave.flush()) { setError("No se pudo conservar el mapa antes de continuar."); return; } try { const selected = selectedPin ? { source: "saved-place" as const, label: selectedPin.name, placeId: selectedPin.id } : { source: selectionSource, label: selectionLabel }; await setActiveLocation(buildLocationSelection(center, selected.source, { label: selected.label, placeId: "placeId" in selected ? selected.placeId : undefined, mapId: draft.id, zoneId: selectedZone?.id, accuracyMeters: selectionAccuracy })); const target = destinationForPick(destination ?? initialQueryRef.current.pickFor); if (target) navigate(target); else toast.success("Ubicación disponible para Inicio, Mi operación y Bitácora."); } catch { setError("No se pudo guardar la ubicación seleccionada."); } }
  async function copyCoordinates() { try { await navigator.clipboard.writeText(formatCoordinate(center)); toast.success("Coordenadas copiadas."); } catch { setError("No fue posible copiar. Selecciona el texto manualmente."); } }
  async function pasteCoordinates() { try { const text = await navigator.clipboard.readText(); const parts = text.split(/[;,\s]+/).filter(Boolean); if (parts.length < 2) throw new Error(); setLat(parts[0]); setLon(parts[1]); const parsed = parseCoordinateFields(parts[0], parts[1]); if (!parsed.ok) throw new Error(); applyCenter(parsed.coordinate); } catch { setError("El portapapeles no contiene latitud y longitud válidas."); } }
  async function copyDraftJson() { try { await navigator.clipboard.writeText(JSON.stringify(draft, null, 2)); toast.success("Borrador copiado como JSON."); } catch { setError("No fue posible copiar el borrador. Mantén esta pantalla abierta y vuelve a intentar."); } }

  if (loading) return <output className="flex min-h-[60dvh] items-center justify-center text-sm text-slate-400">Cargando mapas locales…</output>;

  const content = (
    <div className={expanded ? "fixed inset-0 z-[1000] overflow-y-auto bg-slate-950 p-3 sm:p-5" : "relative left-1/2 w-[calc(100vw-2rem)] max-w-[1400px] -translate-x-1/2 space-y-4 sm:w-[calc(100vw-3rem)]"}>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => expanded ? setExpanded(false) : void leave("/utilidades")} aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="min-w-0 flex-1"><h1 className="text-base font-semibold leading-tight text-slate-100 sm:text-lg">Mapa de operaciones</h1><AutosaveStatus state={saveState} onRetry={() => void autosave.retry()} /></div>
        <Button size="sm" variant="outline" aria-label={expanded ? "Salir de mapa expandido" : "Expandir mapa"} onClick={() => setExpanded((value) => !value)}>{expanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}<span className="hidden sm:inline">{expanded ? "Salir" : "Expandir"}</span></Button>
        <Button size="sm" variant="outline" onClick={() => void save()}>Guardar ahora</Button>
      </div>
      {!online && <output className="block rounded-lg border border-amber-800/50 bg-amber-950/30 p-2 text-xs text-amber-200">Sin conexión: los radios y mapas locales siguen disponibles; los mosaicos y la búsqueda pueden no cargar.</output>}
      <details className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
        <summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">Radios de planificación, no autorizaciones · Ver aviso</summary>
        <p className="mt-2">{t.utilities.disclaimer}</p>
      </details>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={tool === "explore" ? "default" : "outline"} onClick={() => setTool("explore")}>Explorar</Button>
            <Button size="sm" variant={tool === "center" ? "default" : "outline"} onClick={() => setTool("center")}><Crosshair className="h-4 w-4" />Elegir centro</Button>
            <Button size="sm" variant={tool === "measure" ? "default" : "outline"} onClick={() => setTool("measure")}><Ruler className="h-4 w-4" />Medir</Button>
            <Button size="sm" variant={tool === "pin" ? "default" : "outline"} onClick={() => setTool("pin")}><MapPin className="h-4 w-4" />Poner pin</Button>
            <Button size="sm" variant="outline" onClick={() => setFitNonce((value) => value + 1)}>Ajustar zonas</Button>
          </div>
          <Suspense fallback={<div className="flex h-[55dvh] items-center justify-center rounded-xl border border-slate-800 text-sm text-slate-500">Cargando mapa…</div>}><OperationalMapCanvas center={center} zones={draft.zones} pins={places} selectedZoneId={selectedZoneId} selectedPinId={selectedPinId} movablePinId={movablePinId} movableZoneId={movableZoneId} measurement={measurement} tool={tool} fitNonce={fitNonce} recenterNonce={recenterNonce} onMapPick={pickOnMap} onSelectZone={(id) => { setSelectedZoneId(id); setSelectedPinId(null); setMovablePinId(null); }} onSelectPin={(id) => { setSelectedPinId(id); setSelectedZoneId(null); setMovableZoneId(null); }} onMoveZone={moveZone} onMovePin={movePin} /></Suspense>
          {measurementResult && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm"><span>Distancia aproximada: <strong>{formatRadius(measurementResult.distance)}</strong> · rumbo inicial {measurementResult.bearing.toFixed(0)}°</span><Button size="sm" variant="outline" onClick={() => setMeasurement({})}>Limpiar</Button></div>}
        </div>
        <aside className="min-w-0 space-y-3">
          <Card><CardHeader><CardTitle>Mapa local</CardTitle></CardHeader><CardContent className="space-y-2">
            <input aria-label="Nombre del mapa" value={draft.name} maxLength={120} onChange={(event) => mutate((map) => ({ ...map, name: event.target.value }))} className={fieldClass} />
            <select aria-label="Abrir mapa guardado" value={maps.some((map) => map.id === draft.id) ? draft.id : ""} onChange={(event) => { const map = maps.find((item) => item.id === event.target.value); if (map) void switchMap(map); }} className={fieldClass}><option value="">Mapa nuevo</option>{maps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}</select>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { void (async () => { if (!await autosave.flush()) return; const fresh = emptyMap(center); setDraft(fresh); autosave.stage(fresh); setSelectedZoneId(null); setSelectedPinId(null); setMeasurement({}); })(); }}>Nuevo</Button><Button size="sm" variant="outline" onClick={duplicateMap}>Duplicar</Button><Button size="sm" variant="ghost" onClick={deleteMap}><Trash2 className="h-4 w-4" />Eliminar</Button></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Ubicación y centro</CardTitle></CardHeader><CardContent className="space-y-3">
            <LocationSearch onSelect={(coordinate, label) => { applyCenter(coordinate); setSelectionSource("nominatim-result"); setSelectionLabel(label); setSelectionAccuracy(undefined); }} />
            <p className="-mt-2 text-xs text-slate-400">Escribir no mueve el mapa. Selecciona un resultado o usa “Centrar” para actualizar el punto.</p>
            <div className="grid grid-cols-2 gap-2"><input aria-label="Latitud WGS84" inputMode="decimal" value={lat} onChange={(event) => setLat(event.target.value)} className={fieldClass} /><input aria-label="Longitud WGS84" inputMode="decimal" value={lon} onChange={(event) => setLon(event.target.value)} className={fieldClass} /></div>
            <p className="text-[11px] text-slate-500">WGS84 / EPSG:4326 · punto seleccionado: {formatCoordinate(center)}</p>
            <div className="flex flex-wrap gap-2"><Button size="sm" onClick={applyManual}>Centrar</Button><Button size="sm" variant="outline" onClick={useLocation}><LocateFixed className="h-4 w-4" />Mi ubicación</Button><Button size="sm" variant="outline" onClick={copyCoordinates}><Copy className="h-4 w-4" />Copiar</Button><Button size="sm" variant="outline" onClick={pasteCoordinates}>Pegar</Button></div>
            {(places.length > 0 || plans.length > 0) && <select aria-label="Iniciar desde lugar o preparación" defaultValue="" className={fieldClass} onChange={(event) => { const [kind, id] = event.target.value.split(":"); const item = kind === "place" ? places.find((place) => place.id === id) : plans.find((plan) => plan.id === id); if (item) { const coordinate = kind === "place" ? (item as SavedPlace).coordinate : (item as FlightPlan).location; applyCenter(coordinate); if (kind === "place") { setSelectedPinId(id); setSelectionSource("saved-place"); setSelectionLabel((item as SavedPlace).name); } } }}><option value="">Iniciar desde…</option>{places.map((place) => <option key={place.id} value={`place:${place.id}`}>Pin: {place.name}</option>)}{plans.map((plan) => <option key={plan.id} value={`plan:${plan.id}`}>Preparación: {plan.locationLabel ?? plan.id.slice(0, 8)}</option>)}</select>}
            <div className="grid gap-2 sm:grid-cols-2"><Button onClick={() => void useSelection("plan-new")}>Usar en Mi operación</Button><Button variant="outline" onClick={() => void useSelection("flight-new")}>Usar en Bitácora</Button></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center justify-between">Radios <Button size="sm" onClick={() => addZone()}><Plus className="h-4 w-4" />Añadir radio</Button></CardTitle></CardHeader><CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1">{[100, 250, 500, 1000, 2000].map((radius) => <Button key={radius} size="sm" variant="outline" onClick={() => addZone(radius)}>{formatRadius(radius)}</Button>)}</div>
            <div className="flex gap-2"><input aria-label="Radio personalizado en metros" inputMode="decimal" value={customRadius} onChange={(event) => setCustomRadius(event.target.value)} className={fieldClass} /><Button size="sm" variant="outline" onClick={addCustomZone}>Añadir radio personalizado</Button></div>
            {draft.zones.length === 0 && <p className="py-3 text-sm text-slate-500">Aún no hay radios. Elige un centro y añade el primero.</p>}
            {draft.zones.map((zone) => <button type="button" key={zone.id} onClick={() => { setSelectedZoneId(zone.id); setSelectedPinId(null); applyCenter(zone.center); }} className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm ${selectedZoneId === zone.id ? "border-sky-500 bg-sky-950/30" : "border-slate-800 bg-slate-950"}`}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.color }} /><span className="min-w-0 flex-1 truncate">{zone.name}</span><span className="text-xs text-slate-500">{formatRadius(zone.radiusMeters)}</span>{zone.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>)}
          </CardContent></Card>
          {selectedZone && <Card><CardHeader><CardTitle>Editar radio</CardTitle></CardHeader><CardContent className="space-y-3">
            <label className="block text-xs text-slate-400">Nombre<input value={selectedZone.name} maxLength={120} onChange={(event) => updateZone(selectedZone.id, { name: event.target.value })} className={`${fieldClass} mt-1`} /></label>
            <label className="block text-xs text-slate-400">Radio en metros<input key={selectedZone.id} aria-label="Radio en metros" defaultValue={String(selectedZone.radiusMeters)} inputMode="decimal" onBlur={(event) => { const parsed = parseStrictRadiusMeters(event.target.value); if (parsed === null) { setError(`Radio válido entre ${MIN_RADIUS_METERS} y ${MAX_RADIUS_METERS} m.`); event.currentTarget.value = String(selectedZone.radiusMeters); return; } setError(null); updateZone(selectedZone.id, { radiusMeters: parsed }); }} className={`${fieldClass} mt-1`} /></label>
            <div className="flex flex-wrap gap-2" aria-label="Color del radio">{MAP_ZONE_COLORS.map((color) => <button type="button" key={color} aria-label={`Color ${color}`} onClick={() => updateZone(selectedZone.id, { color })} className={`h-9 w-9 rounded-full border-2 ${selectedZone.color === color ? "border-white" : "border-slate-700"}`} style={{ backgroundColor: color }} />)}</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedZone.visible} onChange={(event) => updateZone(selectedZone.id, { visible: event.target.checked })} />Visible</label>
            <p className="text-xs text-sky-300">Activa “Mover radio” antes de arrastrar para evitar cambios accidentales.</p>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant={movableZoneId === selectedZone.id ? "default" : "outline"} onClick={() => setMovableZoneId((current) => current === selectedZone.id ? null : selectedZone.id)}><MapPin className="h-4 w-4" />Mover radio</Button><Button size="sm" variant="outline" onClick={() => setTool("center")}>Elegir centro</Button><Button size="sm" variant="outline" onClick={() => duplicateZone(selectedZone)}>Duplicar</Button><Button size="sm" variant="ghost" onClick={() => removeZone(selectedZone.id)}><Trash2 className="h-4 w-4" />Eliminar</Button></div>
            {(() => { const metrics = zoneMetrics(selectedZone.radiusMeters); return <div className="rounded-lg bg-slate-950 p-3 text-xs text-slate-400"><p>Centro: {formatCoordinate(selectedZone.center)}</p><p>Diámetro: {formatRadius(metrics.diameterMeters)}</p><p>Área geométrica: {metrics.areaSquareMeters >= 1_000_000 ? `${(metrics.areaSquareMeters / 1_000_000).toFixed(3)} km²` : `${Math.round(metrics.areaSquareMeters).toLocaleString("es-CL")} m²`}</p><p>Perímetro: {formatRadius(metrics.perimeterMeters)}</p>{expertMode && <p>Geometría calculada localmente; círculo Leaflet en metros.</p>}</div>; })()}
            <Button className="w-full" onClick={useZoneInPlan}>Usar en nueva preparación</Button>
          </CardContent></Card>}
          <Card><CardHeader><CardTitle className="flex items-center justify-between">Pines guardados <Button size="sm" variant="outline" onClick={() => void addPin()}><MapPinned className="h-4 w-4" />Añadir pin</Button></CardTitle></CardHeader><CardContent className="space-y-2">
            <input aria-label="Nombre del nuevo pin" value={newPinName} onChange={(event) => setNewPinName(event.target.value)} placeholder="Nombre del nuevo pin" className={fieldClass} />
            <input aria-label="Buscar pines" type="search" value={pinSearch} onChange={(event) => setPinSearch(event.target.value)} placeholder="Buscar por nombre o nota" className={fieldClass} />
            {places.length === 0 && <p className="py-2 text-sm text-slate-500">Marca despegue, obstáculos, acceso u otros puntos de interés.</p>}
            {filteredPlaces.map((pin) => <button type="button" key={pin.id} onClick={() => { setSelectedPinId(pin.id); setSelectedZoneId(null); setSelectionSource("saved-place"); setSelectionLabel(pin.name); applyCenter(pin.coordinate); }} className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm ${selectedPinId === pin.id ? "border-sky-500 bg-sky-950/30" : "border-slate-800 bg-slate-950"}`}><MapPin className={`h-4 w-4 ${pin.favorite ? "text-amber-400" : "text-sky-400"}`} /><span className="min-w-0 flex-1 truncate">{pin.name}</span>{pin.favorite && <Star className="h-3 w-3 fill-current text-amber-400" />}<span className="text-[11px] text-slate-500">{formatCoordinate(pin.coordinate)}</span></button>)}
          </CardContent></Card>
          {selectedPin && <Card><CardHeader><CardTitle>Editar pin</CardTitle></CardHeader><CardContent className="space-y-3">
            <label className="block text-xs text-slate-400">Nombre<input value={selectedPin.name} maxLength={120} onChange={(event) => setPlaces((current) => current.map((pin) => pin.id === selectedPin.id ? { ...pin, name: event.target.value } : pin))} onBlur={(event) => void updateSavedPin(selectedPin.id, { name: event.target.value }).then((updated) => setPlaces((current) => current.map((pin) => pin.id === updated.id ? updated : pin))).catch(() => setError("No se pudo actualizar el nombre."))} className={`${fieldClass} mt-1`} /></label>
            <label className="block text-xs text-slate-400">Nota<textarea value={selectedPin.notes ?? ""} maxLength={1000} onChange={(event) => setPlaces((current) => current.map((pin) => pin.id === selectedPin.id ? { ...pin, notes: event.target.value } : pin))} onBlur={(event) => void updateSavedPin(selectedPin.id, { notes: event.target.value }).catch(() => setError("No se pudo actualizar la nota."))} className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(selectedPin.favorite)} onChange={(event) => { const favorite = event.target.checked; setPlaces((current) => current.map((pin) => pin.id === selectedPin.id ? { ...pin, favorite } : pin)); void updateSavedPin(selectedPin.id, { favorite }).catch(() => setError("No se pudo actualizar el favorito.")); }} />Favorito</label>
            <p className="text-xs text-sky-300">Activa “Mover pin” antes de arrastrar.</p>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant={movablePinId === selectedPin.id ? "default" : "outline"} onClick={() => setMovablePinId((current) => current === selectedPin.id ? null : selectedPin.id)}>Mover pin</Button><Button size="sm" variant="outline" onClick={() => void useSelection()}>Usar ubicación</Button><Button size="sm" variant="ghost" onClick={() => void removePin(selectedPin.id)}><Trash2 className="h-4 w-4" />Eliminar pin</Button></div>
          </CardContent></Card>}
          {error && <div role="alert" className="space-y-2 rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300"><p>{error}</p><Button size="sm" variant="outline" onClick={copyDraftJson}>Copiar borrador JSON</Button></div>}
        </aside>
      </div>
    </div>
  );
  return content;
}
