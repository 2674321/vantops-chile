import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Crosshair, Expand, Eye, EyeOff, LocateFixed, MapPin, Plus, Ruler, Save, Shrink, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { formatCoordinate, parseCoordinateFields, type Coordinate } from "../../../domain/coordinate";
import { formatRadius, MAX_RADIUS_METERS, MIN_RADIUS_METERS } from "../../../domain/operationZone";
import { MAP_ZONE_COLORS, MAX_ZONES_PER_MAP, haversineDistanceMeters, initialBearingDegrees, parseStrictRadiusMeters, zoneMetrics, type MapRadiusZone, type SavedOperationalMap } from "../../../domain/operationalMap";
import { createLocalId } from "../../../lib/id";
import { LocationSearch } from "../../dashboard/LocationSearch";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { loadDisplayPreferences, loadLastCoordinate } from "../../../storage/settings";
import { listPlaces } from "../../../storage/repositories/placeRepository";
import { listFlightPlans } from "../../../storage/repositories/flightPlanRepository";
import { deleteOperationalMap, duplicateOperationalMap, listOperationalMaps, saveOperationalMap } from "../../../storage/repositories/operationalMapRepository";
import { useToast } from "../../../components/toast/useToast";
import { esCL as t } from "../../../i18n/es-CL";
import type { SavedPlace } from "../../../domain/logbook/types";
import type { FlightPlan } from "../../../domain/flightPlan/types";
import type { MapTool } from "./OperationalMapCanvas";

const OperationalMapCanvas = lazy(() => import("./OperationalMapCanvas"));
const DEFAULT_CENTER: Coordinate = { latitude: -33.4489, longitude: -70.6693 };

function emptyMap(center: Coordinate): SavedOperationalMap {
  const now = new Date().toISOString();
  return { id: createLocalId(), schemaVersion: 1, name: "Mapa de operaciones", initialView: { center, zoom: 12 }, zones: [], createdAt: now, updatedAt: now };
}

const fieldClass = "h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-sky-500";

export function OperationalMapPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const online = useOnlineStatus();
  const [maps, setMaps] = useState<SavedOperationalMap[]>([]);
  const [draft, setDraft] = useState(() => emptyMap(DEFAULT_CENTER));
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [lat, setLat] = useState(String(DEFAULT_CENTER.latitude));
  const [lon, setLon] = useState(String(DEFAULT_CENTER.longitude));
  const [tool, setTool] = useState<MapTool>("explore");
  const [measurement, setMeasurement] = useState<{ a?: Coordinate; b?: Coordinate }>({});
  const [fitNonce, setFitNonce] = useState(0);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [plans, setPlans] = useState<FlightPlan[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expertMode, setExpertMode] = useState(false);

  useEffect(() => { void (async () => {
    const [storedMaps, storedPlaces, storedPlans, last, preferences] = await Promise.all([listOperationalMaps(), listPlaces(), listFlightPlans(), loadLastCoordinate(), loadDisplayPreferences()]);
    setMaps(storedMaps); setPlaces(storedPlaces); setPlans(storedPlans); setExpertMode(preferences.expertMode);
    if (storedMaps[0]) openMap(storedMaps[0]); else if (last) applyCenter(last);
  })(); }, []);

  const selectedZone = draft.zones.find((zone) => zone.id === selectedZoneId) ?? null;
  const dirty = JSON.stringify(draft) !== savedSnapshot;
  const measurementResult = useMemo(() => measurement.a && measurement.b ? { distance: haversineDistanceMeters(measurement.a, measurement.b), bearing: initialBearingDegrees(measurement.a, measurement.b) } : null, [measurement]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const protectInternalLink = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (target?.getAttribute("href")?.includes("#/") && !window.confirm("Hay cambios sin guardar en el mapa. ¿Salir y descartarlos?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", protectInternalLink, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", protectInternalLink, true); };
  }, [dirty]);

  function applyCenter(next: Coordinate) { setCenter(next); setLat(String(next.latitude)); setLon(String(next.longitude)); }
  function openMap(map: SavedOperationalMap) { const copy = structuredClone(map); setDraft(copy); setSavedSnapshot(JSON.stringify(copy)); const next = copy.initialView?.center ?? copy.zones[0]?.center ?? DEFAULT_CENTER; applyCenter(next); setSelectedZoneId(copy.zones[0]?.id ?? null); setError(null); }
  function mutate(mutator: (map: SavedOperationalMap) => SavedOperationalMap) { setDraft((current) => ({ ...mutator(current), updatedAt: new Date().toISOString() })); }
  function leave(target: string) { if (!dirty || window.confirm("Hay cambios sin guardar en el mapa. ¿Salir y descartarlos?")) navigate(target); }
  function updateZone(id: string, changes: Partial<MapRadiusZone>) { mutate((map) => ({ ...map, zones: map.zones.map((zone) => zone.id === id ? { ...zone, ...changes } : zone) })); }

  function pickOnMap(point: Coordinate) {
    applyCenter(point);
    if (tool === "center") { if (selectedZoneId) updateZone(selectedZoneId, { center: point }); setTool("explore"); return; }
    if (tool === "measure") setMeasurement((current) => !current.a || current.b ? { a: point } : { ...current, b: point });
  }

  function addZone(radiusMeters = 500) {
    if (draft.zones.length >= MAX_ZONES_PER_MAP) { setError(`Máximo ${MAX_ZONES_PER_MAP} zonas por mapa.`); return; }
    const id = createLocalId();
    const zone: MapRadiusZone = { id, name: `Radio ${formatRadius(radiusMeters)}`, center, radiusMeters, color: MAP_ZONE_COLORS[draft.zones.length % MAP_ZONE_COLORS.length], visible: true, fillOpacity: 0.12 };
    mutate((map) => ({ ...map, zones: [...map.zones, zone] })); setSelectedZoneId(id); setError(null);
  }

  function duplicateZone(zone: MapRadiusZone) { const copy = { ...zone, id: createLocalId(), name: `${zone.name} (copia)` }; mutate((map) => ({ ...map, zones: [...map.zones, copy] })); setSelectedZoneId(copy.id); }
  function removeZone(id: string) { if (!window.confirm("¿Eliminar este radio del mapa?")) return; mutate((map) => ({ ...map, zones: map.zones.filter((zone) => zone.id !== id) })); setSelectedZoneId(null); }

  async function save() {
    setSaving(true); setError(null);
    try { await saveOperationalMap(draft); const refreshed = await listOperationalMaps(); setMaps(refreshed); setSavedSnapshot(JSON.stringify(draft)); toast.success("Mapa guardado localmente."); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo guardar el mapa."); }
    finally { setSaving(false); }
  }

  async function duplicateMap() { try { const copy = await duplicateOperationalMap(draft); setMaps(await listOperationalMaps()); openMap(copy); toast.success("Mapa duplicado."); } catch { setError("Guarda el mapa antes de duplicarlo."); } }
  async function deleteMap() { if (!maps.some((map) => map.id === draft.id) || !window.confirm("¿Eliminar el mapa completo? Esta acción no elimina planes históricos.")) return; await deleteOperationalMap(draft.id); const next = await listOperationalMaps(); setMaps(next); if (next[0]) openMap(next[0]); else { const fresh = emptyMap(center); setDraft(fresh); setSavedSnapshot(""); } }

  function applyManual() { const parsed = parseCoordinateFields(lat, lon); if (!parsed.ok) { setError("Ingresa coordenadas WGS84 válidas; no se reemplazarán por 0,0."); return; } applyCenter(parsed.coordinate); setError(null); }
  function useLocation() { if (!navigator.geolocation) { setError("Geolocalización no disponible. Usa coordenadas o búsqueda."); return; } navigator.geolocation.getCurrentPosition((position) => { applyCenter({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setError(position.coords.accuracy ? `Precisión informada por el dispositivo: ±${Math.round(position.coords.accuracy)} m.` : null); }, (geoError) => { setError(geoError.code === geoError.PERMISSION_DENIED ? "Permiso denegado. Puedes usar coordenadas, lugares o búsqueda." : geoError.code === geoError.TIMEOUT ? "Tiempo agotado al obtener ubicación." : "No fue posible obtener la ubicación."); }, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }); }
  async function copyCoordinates() { try { await navigator.clipboard.writeText(formatCoordinate(center)); toast.success("Coordenadas copiadas."); } catch { setError("No fue posible copiar. Selecciona el texto manualmente."); } }
  async function pasteCoordinates() { try { const text = await navigator.clipboard.readText(); const parts = text.split(/[;,\s]+/).filter(Boolean); if (parts.length < 2) throw new Error(); setLat(parts[0]); setLon(parts[1]); const parsed = parseCoordinateFields(parts[0], parts[1]); if (!parsed.ok) throw new Error(); applyCenter(parsed.coordinate); } catch { setError("El portapapeles no contiene latitud y longitud válidas."); } }

  const content = (
    <div className={expanded ? "fixed inset-0 z-[1000] overflow-y-auto bg-slate-950 p-3 sm:p-5" : "relative left-1/2 w-[calc(100vw-2rem)] max-w-[1400px] -translate-x-1/2 space-y-4 sm:w-[calc(100vw-3rem)]"}>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => expanded ? setExpanded(false) : leave("/utilidades")} aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-semibold text-slate-100">Mapa de operaciones</h1><p className="text-xs text-slate-500">{dirty ? "Cambios sin guardar" : "Guardado"}</p></div>
        <Button size="sm" variant="outline" aria-label={expanded ? "Salir de mapa expandido" : "Expandir mapa"} onClick={() => setExpanded((value) => !value)}>{expanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}<span className="hidden sm:inline">{expanded ? "Salir" : "Expandir"}</span></Button>
        <Button size="sm" aria-label="Guardar mapa" onClick={save} disabled={saving}><Save className="h-4 w-4" /><span className="hidden sm:inline">{saving ? "Guardando…" : "Guardar"}</span></Button>
      </div>
      {!online && <output className="block rounded-lg border border-amber-800/50 bg-amber-950/30 p-2 text-xs text-amber-200">Sin conexión: los radios y mapas locales siguen disponibles; los mosaicos y la búsqueda pueden no cargar.</output>}
      <p className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-200">{t.utilities.disclaimer}</p>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={tool === "explore" ? "default" : "outline"} onClick={() => setTool("explore")}>Explorar</Button>
            <Button size="sm" variant={tool === "center" ? "default" : "outline"} onClick={() => setTool("center")}><Crosshair className="h-4 w-4" />Elegir centro</Button>
            <Button size="sm" variant={tool === "measure" ? "default" : "outline"} onClick={() => setTool("measure")}><Ruler className="h-4 w-4" />Medir</Button>
            <Button size="sm" variant="outline" onClick={() => setFitNonce((value) => value + 1)}>Ajustar zonas</Button>
          </div>
          <Suspense fallback={<div className="flex h-[55dvh] items-center justify-center rounded-xl border border-slate-800 text-sm text-slate-500">Cargando mapa…</div>}><OperationalMapCanvas center={center} zones={draft.zones} selectedZoneId={selectedZoneId} measurement={measurement} tool={tool} fitNonce={fitNonce} onMapPick={pickOnMap} onSelectZone={setSelectedZoneId} /></Suspense>
          {measurementResult && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm"><span>Distancia aproximada: <strong>{formatRadius(measurementResult.distance)}</strong> · rumbo inicial {measurementResult.bearing.toFixed(0)}°</span><Button size="sm" variant="outline" onClick={() => setMeasurement({})}>Limpiar</Button></div>}
        </div>
        <aside className="min-w-0 space-y-3">
          <Card><CardHeader><CardTitle>Mapa local</CardTitle></CardHeader><CardContent className="space-y-2">
            <input aria-label="Nombre del mapa" value={draft.name} maxLength={120} onChange={(event) => mutate((map) => ({ ...map, name: event.target.value }))} className={fieldClass} />
            <select aria-label="Abrir mapa guardado" value={maps.some((map) => map.id === draft.id) ? draft.id : ""} onChange={(event) => { const map = maps.find((item) => item.id === event.target.value); if (map) openMap(map); }} className={fieldClass}><option value="">Mapa nuevo sin guardar</option>{maps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}</select>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { const fresh = emptyMap(center); setDraft(fresh); setSavedSnapshot(""); setSelectedZoneId(null); }}>Nuevo</Button><Button size="sm" variant="outline" onClick={duplicateMap}>Duplicar</Button><Button size="sm" variant="ghost" onClick={deleteMap}><Trash2 className="h-4 w-4" />Eliminar</Button></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Ubicación y centro</CardTitle></CardHeader><CardContent className="space-y-3">
            <LocationSearch onSelect={applyCenter} />
            <div className="grid grid-cols-2 gap-2"><input aria-label="Latitud WGS84" inputMode="decimal" value={lat} onChange={(event) => setLat(event.target.value)} className={fieldClass} /><input aria-label="Longitud WGS84" inputMode="decimal" value={lon} onChange={(event) => setLon(event.target.value)} className={fieldClass} /></div>
            <p className="text-[11px] text-slate-500">WGS84 / EPSG:4326 · punto seleccionado: {formatCoordinate(center)}</p>
            <div className="flex flex-wrap gap-2"><Button size="sm" onClick={applyManual}>Centrar</Button><Button size="sm" variant="outline" onClick={useLocation}><LocateFixed className="h-4 w-4" />Mi ubicación</Button><Button size="sm" variant="outline" onClick={copyCoordinates}><Copy className="h-4 w-4" />Copiar</Button><Button size="sm" variant="outline" onClick={pasteCoordinates}>Pegar</Button></div>
            {(places.length > 0 || plans.length > 0) && <select aria-label="Iniciar desde lugar o preparación" defaultValue="" className={fieldClass} onChange={(event) => { const [kind, id] = event.target.value.split(":"); const item = kind === "place" ? places.find((place) => place.id === id) : plans.find((plan) => plan.id === id); if (item) applyCenter(kind === "place" ? (item as SavedPlace).coordinate : (item as FlightPlan).location); }}><option value="">Iniciar desde…</option>{places.map((place) => <option key={place.id} value={`place:${place.id}`}>Lugar: {place.name}</option>)}{plans.map((plan) => <option key={plan.id} value={`plan:${plan.id}`}>Preparación: {plan.locationLabel ?? plan.id.slice(0, 8)}</option>)}</select>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center justify-between">Radios <Button size="sm" onClick={() => addZone()}><Plus className="h-4 w-4" />Añadir</Button></CardTitle></CardHeader><CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1">{[100, 250, 500, 1000, 2000].map((radius) => <Button key={radius} size="sm" variant="outline" onClick={() => addZone(radius)}>{formatRadius(radius)}</Button>)}</div>
            {draft.zones.length === 0 && <p className="py-3 text-sm text-slate-500">Aún no hay radios. Elige un centro y añade el primero.</p>}
            {draft.zones.map((zone) => <button type="button" key={zone.id} onClick={() => { setSelectedZoneId(zone.id); applyCenter(zone.center); }} className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm ${selectedZoneId === zone.id ? "border-sky-500 bg-sky-950/30" : "border-slate-800 bg-slate-950"}`}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.color }} /><span className="min-w-0 flex-1 truncate">{zone.name}</span><span className="text-xs text-slate-500">{formatRadius(zone.radiusMeters)}</span>{zone.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>)}
          </CardContent></Card>
          {selectedZone && <Card><CardHeader><CardTitle>Editar radio</CardTitle></CardHeader><CardContent className="space-y-3">
            <label className="block text-xs text-slate-400">Nombre<input value={selectedZone.name} maxLength={120} onChange={(event) => updateZone(selectedZone.id, { name: event.target.value })} className={`${fieldClass} mt-1`} /></label>
            <label className="block text-xs text-slate-400">Radio en metros<input key={selectedZone.id} aria-label="Radio en metros" defaultValue={String(selectedZone.radiusMeters)} inputMode="decimal" onBlur={(event) => { const parsed = parseStrictRadiusMeters(event.target.value); if (parsed === null) { setError(`Radio válido entre ${MIN_RADIUS_METERS} y ${MAX_RADIUS_METERS} m.`); event.currentTarget.value = String(selectedZone.radiusMeters); return; } setError(null); updateZone(selectedZone.id, { radiusMeters: parsed }); }} className={`${fieldClass} mt-1`} /></label>
            <div className="flex flex-wrap gap-2" aria-label="Color del radio">{MAP_ZONE_COLORS.map((color) => <button type="button" key={color} aria-label={`Color ${color}`} onClick={() => updateZone(selectedZone.id, { color })} className={`h-9 w-9 rounded-full border-2 ${selectedZone.color === color ? "border-white" : "border-slate-700"}`} style={{ backgroundColor: color }} />)}</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedZone.visible} onChange={(event) => updateZone(selectedZone.id, { visible: event.target.checked })} />Visible</label>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setTool("center")}><MapPin className="h-4 w-4" />Cambiar centro</Button><Button size="sm" variant="outline" onClick={() => duplicateZone(selectedZone)}>Duplicar</Button><Button size="sm" variant="ghost" onClick={() => removeZone(selectedZone.id)}><Trash2 className="h-4 w-4" />Eliminar</Button></div>
            {(() => { const metrics = zoneMetrics(selectedZone.radiusMeters); return <div className="rounded-lg bg-slate-950 p-3 text-xs text-slate-400"><p>Centro: {formatCoordinate(selectedZone.center)}</p><p>Diámetro: {formatRadius(metrics.diameterMeters)}</p><p>Área geométrica: {metrics.areaSquareMeters >= 1_000_000 ? `${(metrics.areaSquareMeters / 1_000_000).toFixed(3)} km²` : `${Math.round(metrics.areaSquareMeters).toLocaleString("es-CL")} m²`}</p><p>Perímetro: {formatRadius(metrics.perimeterMeters)}</p>{expertMode && <p>Geometría calculada localmente; círculo Leaflet en metros.</p>}</div>; })()}
            <Button className="w-full" onClick={() => leave(`/operacion/nueva?mapId=${encodeURIComponent(draft.id)}&zoneId=${encodeURIComponent(selectedZone.id)}&returnTo=${encodeURIComponent("/utilidades/mapa")}`)}>Usar en nueva preparación</Button>
          </CardContent></Card>}
          {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
        </aside>
      </div>
    </div>
  );
  return content;
}
