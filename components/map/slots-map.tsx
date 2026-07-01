"use client";

// Mapa slotova u feedu i na stranama sa listama.
// Racuna centar po markerima, a svaki pin dobija boju prema sportu.

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { formatScheduledAt } from "@/lib/utils/format";
import { BALKAN_CENTER, BALKAN_ZOOM, CITY_ZOOM } from "@/lib/cities";
import type { Slot } from "@/types/database";

// Ikone pina obojene po sportu, crtane u divu (bez slika kao zavisnosti).
function buildIcon(sport: string) {
  const colors: Record<string, string> = {
    football: "#16a34a",
    basketball: "#ea580c",
    padel: "#db2777",
  };
  const bg = colors[sport] ?? "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${sportEmoji(
      sport
    )}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

type Props = {
  slots: Slot[];
  // Rezervni centar kad nema slotova, najcesce domaci grad korisnika.
  fallbackCenter?: [number, number];
};

export default function SlotsMap({ slots, fallbackCenter }: Props) {
  const { center, zoom } = useMemo(() => {
    // Ako ima slotova, mapa se centrira na njihov prosjek.
    if (slots.length > 0) {
      const lat = slots.reduce((s, x) => s + x.lat, 0) / slots.length;
      const lng = slots.reduce((s, x) => s + x.lng, 0) / slots.length;
      return { center: [lat, lng] as [number, number], zoom: CITY_ZOOM };
    }
    if (fallbackCenter) {
      return { center: fallbackCenter, zoom: CITY_ZOOM };
    }
    return { center: BALKAN_CENTER, zoom: BALKAN_ZOOM };
  }, [slots, fallbackCenter]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {slots.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={buildIcon(s.sport)}>
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">
                {sportEmoji(s.sport)} {s.title}
              </div>
              <div className="text-xs text-gray-600">
                {sportLabel(s.sport, s.custom_sport)} · {s.location_name}
              </div>
              <div className="text-xs text-gray-600">
                {formatScheduledAt(s.scheduled_at)}
              </div>
              <div className="text-xs">
                Fali {Math.max(0, s.total_spots - s.filled_spots)} igrač/a
              </div>
              <Link
                href={`/slot/${s.id}`}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Pogledaj slot →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
