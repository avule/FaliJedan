"use client";

// Interaktivna mapa za biranje lokacije novog slota.
// Klik na mapu vraca koordinate u formu.

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  // React Leaflet hook hvata klik i salje lat lng nazad roditelju.
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

type Props = {
  lat: number | null;
  lng: number | null;
  center: [number, number];
  onPick: (lat: number, lng: number) => void;
};

export default function LocationPicker({ lat, lng, center, onPick }: Props) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      {lat !== null && lng !== null && (
        <Marker position={[lat, lng]} icon={pinIcon} />
      )}
    </MapContainer>
  );
}
