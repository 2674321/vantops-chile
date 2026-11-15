import { useEffect } from "react";
import { circle as leafletCircle, latLngBounds } from "leaflet";
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinate } from "../../../domain/coordinate";
import type { MapRadiusZone } from "../../../domain/operationalMap";

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
}

function IntentionalRecenter({ center }: { center: Coordinate }) {
  const map = useMap();
  useEffect(() => { map.setView([center.latitude, center.longitude], map.getZoom(), { animate: false }); }, [center, map]);
  return null;
}

function FitVisibleZones({ zones, nonce }: { zones: MapRadiusZone[]; nonce: number }) {
  const map = useMap();
  useEffect(() => {
    if (nonce === 0) return;
    const visible = zones.filter((zone) => zone.visible);
    if (visible.length === 0) return;
    const bounds = latLngBounds([]);
    for (const zone of visible) bounds.extend(leafletCircle([zone.center.latitude, zone.center.longitude], { radius: zone.radiusMeters }).getBounds());
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
  }, [map, nonce, zones]);
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
  const { center, zones, selectedZoneId, measurement, tool, fitNonce, onMapPick, onSelectZone } = props;
  return (
    <div className="relative z-0 h-[55dvh] min-h-[390px] overflow-hidden rounded-xl border border-slate-700 lg:h-[calc(100dvh-13rem)] lg:min-h-[540px]">
      <MapContainer center={[center.latitude, center.longitude]} zoom={12} scrollWheelZoom className="h-full w-full" style={{ background: "#020617" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" className="brightness-75 contrast-125" />
        <IntentionalRecenter center={center} />
        <FitVisibleZones zones={zones} nonce={fitNonce} />
        <MapInteraction tool={tool} onPick={onMapPick} />
        {zones.filter((zone) => zone.visible).map((zone) => (
          <Circle key={zone.id} center={[zone.center.latitude, zone.center.longitude]} radius={zone.radiusMeters} pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: zone.fillOpacity, weight: selectedZoneId === zone.id ? 4 : 2 }} eventHandlers={{ click: () => onSelectZone(zone.id) }}>
            <Tooltip>{zone.name} · {Math.round(zone.radiusMeters)} m</Tooltip>
          </Circle>
        ))}
        {measurement.a && <CircleMarker center={[measurement.a.latitude, measurement.a.longitude]} radius={7} pathOptions={{ color: "#f59e0b", fillOpacity: 0.8 }}><Tooltip permanent>A</Tooltip></CircleMarker>}
        {measurement.b && <CircleMarker center={[measurement.b.latitude, measurement.b.longitude]} radius={7} pathOptions={{ color: "#22c55e", fillOpacity: 0.8 }}><Tooltip permanent>B</Tooltip></CircleMarker>}
        {measurement.a && measurement.b && <Polyline positions={[[measurement.a.latitude, measurement.a.longitude], [measurement.b.latitude, measurement.b.longitude]]} pathOptions={{ color: "#f8fafc", dashArray: "8 6" }} />}
      </MapContainer>
      <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-slate-950/90 px-3 py-2 text-xs text-slate-200 shadow">
        {tool === "explore" ? "Arrastra para explorar" : tool === "center" ? "Toca el mapa para elegir centro" : "Toca para definir A y B"}
      </div>
    </div>
  );
}
