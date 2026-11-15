import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import type { Coordinate } from "../../../domain/coordinate";
import type { SavedOperationalMap } from "../../../domain/operationalMap";
import { formatRadius } from "../../../domain/operationZone";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { listOperationalMaps } from "../../../storage/repositories/operationalMapRepository";
import { esCL as t } from "../../../i18n/es-CL";
import noRadiiIllustration from "../../../assets/states/no-radii.svg";

const OperationalMapCanvas = lazy(() => import("./OperationalMapCanvas"));
const PREVIEW_CENTER: Coordinate = { latitude: -33.4489, longitude: -70.6693 };

export function MapHomePreview() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const [expanded, setExpanded] = useState(false);
  const [maps, setMaps] = useState<SavedOperationalMap[]>([]);
  const [selectedMapId, setSelectedMapId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let active = true;
    void listOperationalMaps()
      .then((stored) => {
        if (!active) return;
        setMaps(stored);
        setSelectedMapId((current) => current || stored[0]?.id || "");
        setSelectedZoneId((current) => current || stored[0]?.zones[0]?.id || null);
      })
      .catch(() => { if (active) setStorageError(true); });
    return () => { active = false; };
  }, []);

  const selectedMap = useMemo(() => maps.find((map) => map.id === selectedMapId) ?? maps[0], [maps, selectedMapId]);
  const selectedZone = selectedMap?.zones.find((zone) => zone.id === selectedZoneId) ?? selectedMap?.zones[0] ?? null;
  const center = selectedZone?.center ?? selectedMap?.initialView?.center ?? PREVIEW_CENTER;

  function openFullMap() {
    const params = new URLSearchParams();
    if (selectedMap) params.set("mapId", selectedMap.id);
    if (selectedZone) params.set("zoneId", selectedZone.id);
    navigate(`/utilidades/mapa${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <Card className="overflow-hidden border-sky-700/70 bg-gradient-to-br from-sky-950/40 via-slate-950 to-slate-950 shadow-lg shadow-sky-950/20">
      <CardContent className="space-y-4 py-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-sky-500/15 p-2.5 text-sky-300"><MapIcon className="h-6 w-6" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 className="mt-1 text-xl font-semibold text-slate-100">Mapa de operaciones</h2>
            <p className="mt-1 text-sm text-slate-300">Elige ubicación, crea radios personalizados, mueve zonas, añade pines y mide distancias.</p>
            {!storageError && <p className="mt-2 text-xs font-medium text-slate-400">{maps.length === 0 ? "Sin mapas guardados todavía" : `${maps.length} ${maps.length === 1 ? "mapa guardado" : "mapas guardados"} en este dispositivo`}</p>}
            {storageError && <p role="alert" className="mt-2 text-xs text-red-300">No fue posible leer los mapas locales. Puedes abrir el editor y reintentar sin perder el resto de Inicio.</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" aria-expanded={expanded} aria-controls="home-operational-map-preview" onClick={() => setExpanded((value) => !value)} className="flex-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{expanded ? "Contraer mapa" : "Desplegar mapa"}
          </Button>
          <Button type="button" onClick={openFullMap} className="flex-1"><ExternalLink className="h-4 w-4" />Abrir mapa completo</Button>
        </div>
        {expanded && (
          <section id="home-operational-map-preview" aria-label="Vista previa del mapa de operaciones" className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              {maps.length > 0 && (
                <select aria-label="Mapa guardado para vista previa" value={selectedMap?.id ?? ""} onChange={(event) => { const map = maps.find((item) => item.id === event.target.value); setSelectedMapId(event.target.value); setSelectedZoneId(map?.zones[0]?.id ?? null); }} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200">
                  {maps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}
                </select>
              )}
              <Button type="button" size="sm" variant="outline" onClick={openFullMap}>Editar radios en pantalla completa</Button>
            </div>
            <Suspense fallback={<div className="flex h-[320px] items-center justify-center rounded-xl border border-slate-800 text-sm text-slate-400">Cargando vista del mapa…</div>}>
              <OperationalMapCanvas center={center} zones={selectedMap?.zones ?? []} selectedZoneId={selectedZone?.id ?? null} measurement={{}} tool="explore" fitNonce={selectedMap ? 1 : 0} onMapPick={() => undefined} onSelectZone={setSelectedZoneId} variant="preview" />
            </Suspense>
            {(!selectedMap || selectedMap.zones.length === 0) && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <img src={noRadiiIllustration} width="72" height="72" loading="lazy" alt="" aria-hidden className="h-16 w-16 shrink-0 object-contain" />
                <p className="text-sm text-slate-300">Aún no hay radios en este mapa. Abre el editor para definir el primero.</p>
              </div>
            )}
            {selectedMap && selectedMap.zones.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Radios del mapa guardado">
                {selectedMap.zones.map((zone) => <button key={zone.id} type="button" onClick={() => setSelectedZoneId(zone.id)} className={`rounded-lg border px-3 py-2 text-left text-xs ${selectedZone?.id === zone.id ? "border-sky-500 bg-sky-950/40 text-sky-100" : "border-slate-700 text-slate-300"}`}><span className="font-medium">{zone.name}</span> · {formatRadius(zone.radiusMeters)}</button>)}
              </div>
            )}
            <p className="text-xs text-amber-200">{t.utilities.disclaimer}</p>
            {!online && <p className="text-xs text-amber-300">Sin conexión: tus mapas y cálculos locales siguen disponibles; el fondo cartográfico puede no cargar.</p>}
          </section>
        )}
      </CardContent>
    </Card>
  );
}
