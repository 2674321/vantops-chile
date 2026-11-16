import { useEffect, useRef } from "react";
import { divIcon, icon, latLng, latLngBounds, type Marker as LeafletMarker, type LeafletEvent } from "leaflet";
import { Circle, CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinate } from "../../../domain/coordinate";
import type { MapRadiusZone } from "../../../domain/operationalMap";
import operationCenterUrl from "../../../assets/map/operation-center.svg";

const operationCenterIcon = icon({
  iconUrl: operationCenterUrl,
  iconSize: [36, 36],
  iconAnchor: [18, 31],
  tooltipAnchor: [0, -28],
});

export type MapTool = "explore" | "center" | "measure" | "pin";

interface Props {
  center: Coordinate;
  zones: MapRadiusZone[];
  pins?: Array<{ id: string; name: string; coordinate: Coordinate; color?: string; favorite?: boolean }>;
  selectedZoneId: string | null;
  selectedPinId?: string | null;
  movablePinId?: string | null;
  movableZoneId?: string | null;
  measurement: { a?: Coordinate; b?: Coordinate };
  tool: MapTool;
  fitNonce: number;
  recenterNonce?: number;
  onMapPick: (coordinate: Coordinate) => void;
  onSelectZone: (id: string) => void;
  onSelectPin?: (id: string) => void;
  onMoveZone?: (id: string, coordinate: Coordinate) => void;
  onMovePin?: (id: string, coordinate: Coordinate) => void;
  variant?: "editor" | "preview";
}

function IntentionalRecenter({ center, nonce }: { center: Coordinate; nonce: number }) {
  const map = useMap();
  const centerRef = useRef(center);
  centerRef.current = center;
  useEffect(() => {
    if (nonce === 0) return;
    const next = centerRef.current;
    map.panTo([next.latitude, next.longitude], { animate: false });
  }, [map, nonce]);
  return null;
}

function KeepMapSized() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => map.invalidateSize({ animate: false, pan: false }));
    });
    observer.observe(container);
    return () => { observer.disconnect(); window.cancelAnimationFrame(frame); };
  }, [map]);
  return null;
}

function FitVisibleZones({ zones, nonce }: { zones: MapRadiusZone[]; nonce: number }) {
  const map = useMap();
  const zonesRef = useRef(zones);
  zonesRef.current = zones;
  useEffect(() => {
    if (nonce === 0) return;
    const frame = window.requestAnimationFrame(() => map.whenReady(() => {
      const visible = zonesRef.current.filter((zone) => zone.visible);
      if (visible.length === 0) return;
      map.invalidateSize({ animate: false, pan: false });
      const bounds = latLngBounds([]);
      for (const zone of visible) bounds.extend(latLng(zone.center.latitude, zone.center.longitude).toBounds(zone.radiusMeters * 2));
      map.fitBounds(bounds, { animate: false, padding: [32, 32], maxZoom: 16 });
    }));
    return () => window.cancelAnimationFrame(frame);
  }, [map, nonce]);
  return null;
}

function MapInteraction({ tool, onPick }: { tool: MapTool; onPick: (coordinate: Coordinate) => void }) {
  useMapEvents({
    click(event) {
      if (tool !== "explore") onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

export default function OperationalMapCanvas(props: Props) {
  const { center, zones, pins = [], selectedZoneId, selectedPinId = null, movablePinId = null, movableZoneId = null, measurement, tool, fitNonce, recenterNonce = 0, onMapPick, onSelectZone, onSelectPin, onMoveZone, onMovePin, variant = "editor" } = props;
  const selectedVisibleZone = zones.find((zone) => zone.id === selectedZoneId && zone.visible);
  return (
    <div className={variant === "preview" ? "relative z-0 h-[320px] overflow-hidden rounded-xl border border-slate-700 sm:h-[390px]" : "relative z-0 h-[55dvh] min-h-[390px] overflow-hidden rounded-xl border border-slate-700 lg:h-[calc(100dvh-13rem)] lg:min-h-[540px]"}>
      <MapContainer center={[center.latitude, center.longitude]} zoom={12} scrollWheelZoom className="h-full w-full" style={{ background: "#020617" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" className="brightness-75 contrast-125" />
        <KeepMapSized />
        <IntentionalRecenter center={center} nonce={recenterNonce} />
        <FitVisibleZones zones={zones} nonce={fitNonce} />
        <MapInteraction tool={tool} onPick={onMapPick} />
        {zones.filter((zone) => zone.visible).map((zone) => (
          <Circle key={zone.id} center={[zone.center.latitude, zone.center.longitude]} radius={zone.radiusMeters} pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: zone.fillOpacity, weight: selectedZoneId === zone.id ? 4 : 2 }} eventHandlers={{ click: () => onSelectZone(zone.id) }}>
            <Tooltip>{zone.name} · {Math.round(zone.radiusMeters)} m</Tooltip>
          </Circle>
        ))}
        {selectedVisibleZone && <Marker position={[selectedVisibleZone.center.latitude, selectedVisibleZone.center.longitude]} icon={operationCenterIcon} alt="Centro de operación seleccionado" draggable={variant === "editor" && movableZoneId === selectedVisibleZone.id && Boolean(onMoveZone)} eventHandlers={{ dragend: (event: LeafletEvent) => { const next = (event.target as LeafletMarker).getLatLng(); onMoveZone?.(selectedVisibleZone.id, { latitude: next.lat, longitude: next.lng }); } }}><Tooltip>{selectedVisibleZone.name}{movableZoneId === selectedVisibleZone.id ? " · arrastra para mover" : ""}</Tooltip></Marker>}
        {pins.map((pin) => {
          const selected = pin.id === selectedPinId;
          const color = pin.color ?? (pin.favorite ? "#f59e0b" : "#38bdf8");
          const pinIcon = divIcon({ className: "", html: `<span aria-hidden="true" style="display:block;width:${selected ? 22 : 18}px;height:${selected ? 22 : 18}px;border-radius:999px 999px 999px 3px;transform:rotate(-45deg);background:${color};border:3px solid ${selected ? "#fff" : "#0f172a"};box-shadow:0 2px 8px #02061799"></span>`, iconSize: [selected ? 22 : 18, selected ? 22 : 18], iconAnchor: [selected ? 11 : 9, selected ? 20 : 16] });
          return <Marker key={pin.id} position={[pin.coordinate.latitude, pin.coordinate.longitude]} icon={pinIcon} alt={`Pin ${pin.name}`} draggable={variant === "editor" && movablePinId === pin.id && Boolean(onMovePin)} eventHandlers={{ click: () => onSelectPin?.(pin.id), dragend: (event: LeafletEvent) => { const next = (event.target as LeafletMarker).getLatLng(); onMovePin?.(pin.id, { latitude: next.lat, longitude: next.lng }); } }}><Tooltip>{pin.name}{pin.favorite ? " · Favorito" : ""}{movablePinId === pin.id ? " · arrastra para mover" : ""}</Tooltip></Marker>;
        })}
        {measurement.a && <CircleMarker center={[measurement.a.latitude, measurement.a.longitude]} radius={7} pathOptions={{ color: "#f59e0b", fillOpacity: 0.8 }}><Tooltip permanent>A</Tooltip></CircleMarker>}
        {measurement.b && <CircleMarker center={[measurement.b.latitude, measurement.b.longitude]} radius={7} pathOptions={{ color: "#22c55e", fillOpacity: 0.8 }}><Tooltip permanent>B</Tooltip></CircleMarker>}
        {measurement.a && measurement.b && <Polyline positions={[[measurement.a.latitude, measurement.a.longitude], [measurement.b.latitude, measurement.b.longitude]]} pathOptions={{ color: "#f8fafc", dashArray: "8 6" }} />}
      </MapContainer>
      <div className="pointer-events-none absolute right-3 top-3 z-[500] max-w-[calc(100%-5rem)] rounded-lg bg-slate-950/90 px-3 py-2 text-xs text-slate-200 shadow">
        {variant === "preview" ? "Vista previa de solo lectura" : tool === "explore" ? "Arrastra el mapa o el marcador seleccionado" : tool === "center" ? "Toca el mapa para elegir centro" : tool === "pin" ? "Toca el mapa para añadir un pin" : "Toca para definir A y B"}
      </div>
    </div>
  );
}
