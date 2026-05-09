"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { SPORTS, LEVELS } from "@/lib/sports";
import {
  updateProfileAction,
  type ProfileState,
} from "@/lib/actions/profile";
import type { Country, City, SportKey, Level } from "@/types/database";

type Initial = {
  name: string;
  country_id: number | null;
  city_id: number | null;
  sports: string[];
  level: Level;
};

type Props = { initial: Initial; countries: Country[]; cities: City[] };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Spremam..." : "Sačuvaj"}
    </Button>
  );
}

export function ProfileForm({ initial, countries, cities }: Props) {
  const [countryId, setCountryId] = useState<number | null>(initial.country_id);
  const [cityId, setCityId] = useState<number | null>(initial.city_id);
  const [sports, setSports] = useState<string[]>(initial.sports);
  const [level, setLevel] = useState<Level>(initial.level);
  const [state, formAction] = useFormState<ProfileState, FormData>(
    updateProfileAction,
    null
  );

  const filteredCities = useMemo(
    () => cities.filter((c) => c.country_id === countryId),
    [cities, countryId]
  );

  const toggleSport = (s: SportKey) =>
    setSports((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Ime</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initial.name}
              required
              minLength={2}
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country_id">Država</Label>
              <Select
                id="country_id"
                name="country_id"
                value={countryId ?? ""}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setCountryId(v || null);
                  setCityId(null);
                }}
                required
              >
                <option value="">Odaberi...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city_id">Grad</Label>
              <Select
                id="city_id"
                name="city_id"
                value={cityId ?? ""}
                onChange={(e) => setCityId(Number(e.target.value) || null)}
                required
                disabled={!countryId}
              >
                <option value="">Odaberi...</option>
                {filteredCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Sportovi</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {SPORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSport(s.key)}
                  className={cn(
                    "flex flex-col items-center rounded-md border border-border p-3 transition-colors",
                    sports.includes(s.key)
                      ? "border-primary bg-primary/10"
                      : "hover:bg-secondary"
                  )}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="mt-1 text-xs">{s.label}</span>
                </button>
              ))}
            </div>
            {sports.map((s) => (
              <input key={s} type="hidden" name="sports" value={s} />
            ))}
          </div>

          <div>
            <Label>Nivo</Label>
            <div className="mt-2 grid gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(l.key)}
                  className={cn(
                    "rounded-md border border-border p-3 text-left transition-colors",
                    level === l.key
                      ? "border-primary bg-primary/10"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="font-medium">{l.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.description}
                  </div>
                </button>
              ))}
            </div>
            <input type="hidden" name="level" value={level} />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.ok && <p className="text-sm text-primary">Sačuvano ✓</p>}

          <div className="flex justify-end pt-2">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
