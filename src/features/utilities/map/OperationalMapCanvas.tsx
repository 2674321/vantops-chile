import { useEffect, useRef } from "react";
import { icon, latLng, latLngBounds } from "leaflet";
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

export type MapTool = "explore" | "center" | "measure";

interface Props {
  center: Coordinate;
  zones: MapRadiusZone[];
  selectedZoneId: string | null;
  measurement: { a?: Coordinate; b?: Coordinate };
  tool: MapTool;
  fitNonce: number;
  onMapPick: (coordinate: Coordinate) => void;
  onSelectZone: (id: string) => void;
  variant?: "editor" | "preview";
}

function IntentionalRecenter({ center }: { center: Coordinate }) {
  const map = useMap();
  useEffect(() => { map.setView([center.latitude, center.longitude], map.getZoom(), { animate: false }); }, [center, map]);
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
  const { center, zones, selectedZoneId, measurement, tool, fitNonce, onMapPick, onSelectZone, variant = "editor" } = props;
  const selectedVisibleZone = zones.find((zone) => zone.id === selectedZoneId && zone.visible);
  return (
    <div className={variant === "preview" ? "relative z-0 h-[320px] overflow-hidden rounded-xl border border-slate-700 sm:h-[390px]" : "relative z-0 h-[55dvh] min-h-[390px] overflow-hidden rounded-xl border border-slate-700 lg:h-[calc(100dvh-13rem)] lg:min-h-[540px]"}>
      <MapContainer center={[center.latitude, center.longitude]} zoom={12} scrollWheelZoom className="h-full w-full" style={{ background: "#020617" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" className="brightness-75 contrast-125" />
        <KeepMapSized />
        <IntentionalRecenter center={center} />
        <FitVisibleZones zones={zones} nonce={fitNonce} />
        <MapInteraction tool={tool} onPick={onMapPick} />
        {zones.filter((zone) => zone.visible).map((zone) => (
          <Circle key={zone.id} center={[zone.center.latitude, zone.center.longitude]} radius={zone.radiusMeters} pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: zone.fillOpacity, weight: selectedZoneId === zone.id ? 4 : 2 }} eventHandlers={{ click: () => onSelectZone(zone.id) }}>
            <Tooltip>{zone.name} · {Math.round(zone.radiusMeters)} m</Tooltip>
          </Circle>
        ))}
        {selectedVisibleZone && <Marker position={[selectedVisibleZone.center.latitude, selectedVisibleZone.center.longitude]} icon={operationCenterIcon} alt="Centro de operación seleccionado"><Tooltip>{selectedVisibleZone.name} · centro de planificación</Tooltip></Marker>}
        {measurement.a && <CircleMarker center={[measurement.a.latitude, measurement.a.longitude]} radius={7} pathOptions={{ color: "#f59e0b", fillOpacity: 0.8 }}><Tooltip permanent>A</Tooltip></CircleMarker>}
        {measurement.b && <CircleMarker center={[measurement.b.latitude, measurement.b.longitude]} radius={7} pathOptions={{ color: "#22c55e", fillOpacity: 0.8 }}><Tooltip permanent>B</Tooltip></CircleMarker>}
        {measurement.a && measurement.b && <Polyline positions={[[measurement.a.latitude, measurement.a.longitude], [measurement.b.latitude, measurement.b.longitude]]} pathOptions={{ color: "#f8fafc", dashArray: "8 6" }} />}
      </MapContainer>
      <div className="pointer-events-none absolute right-3 top-3 z-[500] max-w-[calc(100%-5rem)] rounded-lg bg-slate-950/90 px-3 py-2 text-xs text-slate-200 shadow">
        {variant === "preview" ? "Vista previa de solo lectura" : tool === "explore" ? "Arrastra para explorar" : tool === "center" ? "Toca el mapa para elegir centro" : "Toca para definir A y B"}
      </div>
    </div>
  );
}
