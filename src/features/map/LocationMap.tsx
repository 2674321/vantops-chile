import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinate } from "../../domain/coordinate";

interface MapPickerProps {
  coordinate: Coordinate;
  onPick: (c: Coordinate) => void;
}

function Recenter({ coordinate }: { coordinate: Coordinate }) {
  const map = useMap();
  useEffect(() => {
    map.setView([coordinate.latitude, coordinate.longitude], map.getZoom());
  }, [coordinate.latitude, coordinate.longitude, map]);
  return null;
}

export default function MapPicker({ coordinate, onPick }: MapPickerProps) {
  return (
    <div className="relative z-0 overflow-hidden rounded-xl border border-slate-800">
      <style>{".leaflet-container{width:100%;height:100%;background:#020617}"}</style>
      <MapContainer
        center={[coordinate.latitude, coordinate.longitude]}
        zoom={11}
        scrollWheelZoom
        className="h-72 w-full sm:h-80"
        style={{ background: "#020617" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="brightness-75 contrast-125"
        />
        <Recenter coordinate={coordinate} />
        <CircleMarker
          center={[coordinate.latitude, coordinate.longitude]}
          radius={10}
          pathOptions={{
            color: "#38bdf8",
            fillColor: "#38bdf8",
            fillOpacity: 0.3,
            weight: 2,
          }}
          eventHandlers={{
            click: () => onPick(coordinate),
          }}
        />
        <MapClickHandler onPick={onPick} />
      </MapContainer>
    </div>
  );
}

function MapClickHandler({
  onPick,
}: {
  onPick: (c: Coordinate) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: { latlng: { lat: number; lng: number } }) =>
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onPick]);
  return null;
}
