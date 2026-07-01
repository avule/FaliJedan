"use client";

// Forma za pravljenje slota (redizajn). Sport su plocice, nivo kartice, broj
// mjesta cipovi. Desno je mapa za pin, ispod nje LIVE PREVIEW kartica koja se
// mijenja dok unosis, i kartica sa savjetima. Validaciju radi server akcija.

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { LocationPicker } from "@/components/map/location-picker-wrapper";
import { SPORTS_FOR_SLOT, LEVELS } from "@/lib/sports";
import { createSlotAction, type CreateSlotState } from "@/lib/actions/slots";
import { CITY_CENTERS, BALKAN_CENTER } from "@/lib/cities";
import { cn } from "@/lib/utils/cn";
import type { City, Country } from "@/types/database";

const FALI_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-xl bg-primary px-7 py-4 font-display text-base uppercase tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
    >
      {pending ? "Objavljivanje..." : "Objavi slot →"}
    </button>
  );
}

type Props = {
  cities: City[];
  countries: Country[];
  defaultCityId: number | null;
};

export function CreateSlotForm({ cities, countries, defaultCityId }: Props) {
  const citiesByCountry = countries.map((c) => ({
    country: c,
    cities: cities.filter((city) => city.country_id === c.id),
  }));

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(defaultCityId);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [sport, setSport] = useState<string>("football");
  const [level, setLevel] = useState<string>("casual");
  const [fali, setFali] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [customSport, setCustomSport] = useState("");
  const [state, formAction] = useActionState<CreateSlotState, FormData>(
    createSlotAction,
    null
  );

  const cityName = cities.find((c) => c.id === cityId)?.name;
  const center: [number, number] =
    (cityName && CITY_CENTERS[cityName]) || BALKAN_CENTER;
  const scheduledIso = scheduledAt ? scheduledAt.toISOString() : "";

  const sportInfo = SPORTS_FOR_SLOT.find((s) => s.key === sport);
  const levelInfo = LEVELS.find((l) => l.key === level);
  const previewIcon = sportInfo?.emoji ?? "🏃";
  const previewSport =
    sport === "other" && customSport ? customSport : sportInfo?.label ?? "Sport";

  return (
    <form
      action={formAction}
      className="grid gap-6 lg:grid-cols-[1.4fr_.9fr] lg:items-start"
      noValidate
    >
      {/* skrivena polja koja idu serveru */}
      <input type="hidden" name="sport" value={sport} />
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="total_spots" value={fali} />
      <input type="hidden" name="scheduled_at" value={scheduledIso} />
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />

      {/* LIJEVO: forma */}
      <div className="space-y-4">
        {/* Sport */}
        <FieldCard label="Sport">
          <div className="grid grid-cols-4 gap-3">
            {SPORTS_FOR_SLOT.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSport(s.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border bg-secondary/40 p-4 transition-colors",
                  sport === s.key
                    ? "border-primary/50 bg-primary/10"
                    : "border-border hover:border-border/80"
                )}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    sport === s.key ? "text-primary" : "text-foreground"
                  )}
                >
                  {s.label}
                </span>
              </button>
            ))}
          </div>
          {sport === "other" && (
            <div className="mt-4 animate-fade-in">
              <Input
                name="custom_sport"
                value={customSport}
                onChange={(e) => setCustomSport(e.target.value)}
                placeholder="Koji sport? npr. Rukomet, Badminton..."
                required
                minLength={2}
                maxLength={50}
              />
            </div>
          )}
        </FieldCard>

        {/* Naziv + lokacija + termin */}
        <FieldCard label="Naziv slota">
          <Input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="npr. Mali fudbal · petak"
            required
            minLength={3}
            maxLength={100}
          />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Lokacija">
              <Input
                name="location_name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Sportski centar"
                required
                minLength={2}
                maxLength={150}
              />
            </Field>
            <Field label="Grad">
              <Select
                name="city_id"
                required
                value={cityId ?? ""}
                onChange={(e) => setCityId(Number(e.target.value))}
              >
                <option value="" disabled hidden>
                  Odaberi grad...
                </option>
                {citiesByCountry.map(({ country, cities: cityList }) =>
                  cityList.length === 0 ? null : (
                    <optgroup key={country.id} label={country.name}>
                      {cityList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                )}
              </Select>
            </Field>
          </div>
          <div className="mt-5">
            <Field label="Datum i vrijeme">
              <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
            </Field>
          </div>
        </FieldCard>

        {/* Nivo */}
        <FieldCard label="Nivo">
          <div className="flex flex-col gap-2.5">
            {LEVELS.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLevel(l.key)}
                className={cn(
                  "rounded-xl border px-4 py-3.5 text-left transition-colors",
                  level === l.key
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-secondary/30 hover:border-border/80"
                )}
              >
                <div className="text-sm font-semibold text-foreground">
                  {l.label}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {l.description}
                </div>
              </button>
            ))}
          </div>
          {level === "competitive" && (
            <p className="mt-3 text-xs text-accent animate-fade-in">
              Takmičarski - sve prijave čekaju tvoje odobrenje.
            </p>
          )}
        </FieldCard>

        {/* Koliko fali */}
        <FieldCard
          label="Koliko igrača ti fali?"
          hint="Broj slobodnih mjesta u ekipi."
        >
          <div className="flex flex-wrap gap-2.5">
            {FALI_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setFali(n)}
                className={cn(
                  "rounded-[10px] border px-5 py-2.5 font-display text-base transition-colors",
                  fali === n
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-secondary/30 text-foreground hover:border-border/80"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </FieldCard>

        {/* Opis */}
        <FieldCard label="Opis" hint="(opciono)">
          <Textarea
            name="description"
            placeholder="Tempo, pravila, ko nedostaje, nivo terena..."
            maxLength={500}
          />
        </FieldCard>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          {lat === null ? (
            <span className="text-sm font-semibold text-accent">
              Postavi pin na mapi prije slanja.
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Pin postavljen. Spremno za objavu.
            </span>
          )}
          <SubmitButton disabled={lat === null} />
        </div>
      </div>

      {/* DESNO: mapa + live preview + savjeti */}
      <div className="space-y-4 lg:sticky lg:top-20">
        <p className="flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Lokacija na mapi <span className="text-accent">*</span>
        </p>
        <div
          className={cn(
            "relative h-[340px] overflow-hidden rounded-[18px] border transition-colors",
            lat === null ? "border-accent/50" : "border-primary/40"
          )}
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
          {lat === null && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center p-3">
              <div className="rounded-lg bg-accent px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-accent-foreground shadow-glow-accent animate-fade-in">
                Klikni na mapu da postaviš pin
              </div>
            </div>
          )}
        </div>

        {/* LIVE PREVIEW */}
        <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Pregled u feedu
        </p>
        <div className="relative overflow-hidden rounded-[18px] border border-primary/20 bg-gradient-card p-5">
          <span className="pointer-events-none absolute -right-3 -top-8 text-[130px] leading-none opacity-[0.05]">
            {previewIcon}
          </span>
          <div className="relative">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl">
                  {previewIcon}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {previewSport} · {levelInfo?.label ?? "Nivo"}
                  </p>
                  <h3 className="truncate font-display text-xl uppercase tracking-wide">
                    {title || "Naziv slota"}
                  </h3>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/15 px-2.5 py-1.5 font-display text-xs uppercase tracking-wider text-primary">
                Fali {fali}
              </span>
            </div>
            <div className="mb-2.5 flex justify-between text-sm text-muted-foreground">
              <span className="truncate">📍 {locationName || "Tvoja lokacija"}</span>
              <span className="shrink-0">{scheduledAt ? "Tvoj termin" : "Termin"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-0 rounded-full bg-gradient-primary" />
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-xs text-muted-foreground">
                {fali} {fali === 1 ? "slobodno mjesto" : "slobodnih mjesta"}
              </span>
              <span className="font-display text-sm tabular text-primary">
                Fali {fali}
              </span>
            </div>
          </div>
        </div>

        {/* SAVJETI */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3.5 font-display text-xs uppercase tracking-[0.3em] text-primary">
            Savjeti
          </p>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            {[
              "Tačan termin = brže popunjavanje slota.",
              "Realan nivo privlači prave igrače.",
              "Dobar opis pomaže igračima da se brže odluče.",
            ].map((tip) => (
              <li key={tip} className="flex gap-2.5">
                <span className="text-primary">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </form>
  );
}

/* Pomocne komponente */

function FieldCard({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-3.5">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {hint && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
