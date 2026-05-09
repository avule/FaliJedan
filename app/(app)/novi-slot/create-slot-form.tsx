"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { LocationPicker } from "@/components/map/location-picker-wrapper";
import { SPORTS, LEVELS } from "@/lib/sports";
import {
  createSlotAction,
  type CreateSlotState,
} from "@/lib/actions/slots";
import type { City } from "@/types/database";

const CITY_CENTERS: Record<number, [number, number]> = {
  // Will fall back to Sarajevo if city center not in this map.
};

const FALLBACK_CENTER: [number, number] = [43.85, 18.4]; // Sarajevo

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Objavljivanje..." : "Objavi slot"}
    </Button>
  );
}

type Props = { cities: City[]; defaultCityId: number | null };

export function CreateSlotForm({ cities, defaultCityId }: Props) {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(defaultCityId);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [state, formAction] = useFormState<CreateSlotState, FormData>(
    createSlotAction,
    null
  );

  const center =
    (cityId !== null && CITY_CENTERS[cityId]) || FALLBACK_CENTER;

  // Send datetime as ISO string (preserves timezone for the server).
  const scheduledIso = scheduledAt ? scheduledAt.toISOString() : "";

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Naslov</Label>
            <Input
              id="title"
              name="title"
              placeholder="Fudbal Skenderija — fali nam jedan"
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              <Select id="sport" name="sport" required defaultValue="football">
                {SPORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.emoji} {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Nivo</Label>
              <Select id="level" name="level" required defaultValue="casual">
                {LEVELS.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Datum i vrijeme</Label>
            <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
            <input type="hidden" name="scheduled_at" value={scheduledIso} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_spots">Koliko igrača ti fali?</Label>
            <Input
              id="total_spots"
              name="total_spots"
              type="number"
              min={1}
              max={20}
              defaultValue={1}
              required
            />
            <p className="text-xs text-muted-foreground">
              Broj slobodnih mjesta u ekipi
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city_id">Grad</Label>
            <Select
              id="city_id"
              name="city_id"
              required
              value={cityId ?? ""}
              onChange={(e) => setCityId(Number(e.target.value))}
            >
              <option value="">Odaberi grad...</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_name">Lokacija (naziv)</Label>
            <Input
              id="location_name"
              name="location_name"
              placeholder="SRC Skenderija, teren br. 3"
              required
              minLength={2}
              maxLength={150}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis (opciono)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Dolazimo svaki ponedjeljak, fini bal, ručnik+voda obavezno..."
              maxLength={500}
            />
          </div>

          <input type="hidden" name="lat" value={lat ?? ""} />
          <input type="hidden" name="lng" value={lng ?? ""} />

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {lat === null && (
              <p className="text-xs text-accent">
                Postavi pin na mapi prije slanja
              </p>
            )}
            <SubmitButton disabled={lat === null} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <span aria-hidden>📍</span>
            Lokacija na mapi
            <span className="text-destructive">*</span>
          </Label>
          {lat !== null && lng !== null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 font-display text-[10px] uppercase tracking-wider text-primary">
              <span aria-hidden>✓</span> Postavljena
            </span>
          )}
        </div>

        <div
          className={`relative h-[400px] overflow-hidden rounded-lg border-2 transition-colors lg:h-[calc(100%-2.5rem)] ${
            lat === null
              ? "border-accent/60 animate-pulse-accent"
              : "border-primary/40"
          }`}
        >
          <LocationPicker
            lat={lat}
            lng={lng}
            center={center}
            onPick={(la, ln) => {
              setLat(la);
              setLng(ln);
            }}
          />

          {/* Overlay banner — hides once user picks a location */}
          {lat === null && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center p-3">
              <div className="rounded-md border border-accent/60 bg-card/95 px-4 py-2 shadow-glow-accent backdrop-blur animate-fade-in">
                <p className="font-display text-sm uppercase tracking-wider text-accent">
                  👆 Klikni na mapu da postaviš pin
                </p>
              </div>
            </div>
          )}
        </div>

        {lat !== null && lng !== null && (
          <p className="text-xs text-muted-foreground tabular">
            {lat.toFixed(5)}, {lng.toFixed(5)} · klik na mapu pomjera pin
          </p>
        )}
      </div>
    </form>
  );
}
