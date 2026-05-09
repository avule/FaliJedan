"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { SPORTS, LEVELS } from "@/lib/sports";
import {
  completeOnboardingAction,
  type OnboardingState,
} from "@/lib/actions/onboarding";
import type { Country, City, Level, SportKey } from "@/types/database";

type Props = { countries: Country[]; cities: City[] };

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Spremam..." : "Završi"}
    </Button>
  );
}

export function OnboardingWizard({ countries, cities }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [sports, setSports] = useState<SportKey[]>([]);
  const [level, setLevel] = useState<Level>("casual");
  const [state, formAction] = useFormState<OnboardingState, FormData>(
    completeOnboardingAction,
    null
  );

  const filteredCities = useMemo(
    () => cities.filter((c) => c.country_id === countryId),
    [cities, countryId]
  );

  const toggleSport = (s: SportKey) =>
    setSports((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(
              "h-2 w-12 rounded-full transition-colors",
              n <= step ? "bg-primary" : "bg-secondary"
            )}
          />
        ))}
      </div>

      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Korak 1 — Država</CardTitle>
              <CardDescription>Gdje igraš?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                {countries.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCountryId(c.id);
                      setCityId(null);
                    }}
                    className={cn(
                      "rounded-md border border-border p-4 text-left transition-colors",
                      countryId === c.id
                        ? "border-primary bg-primary/10"
                        : "hover:bg-secondary"
                    )}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.code}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(2)} disabled={!countryId}>
                  Dalje
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Korak 2 — Grad</CardTitle>
              <CardDescription>Pronaći ćemo slotove u tvom gradu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredCities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCityId(c.id)}
                    className={cn(
                      "rounded-md border border-border p-3 text-sm transition-colors",
                      cityId === c.id
                        ? "border-primary bg-primary/10"
                        : "hover:bg-secondary"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Nazad
                </Button>
                <Button onClick={() => setStep(3)} disabled={!cityId}>
                  Dalje
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <form action={formAction}>
            <input type="hidden" name="country_id" value={countryId ?? ""} />
            <input type="hidden" name="city_id" value={cityId ?? ""} />
            {sports.map((s) => (
              <input key={s} type="hidden" name="sports" value={s} />
            ))}
            <input type="hidden" name="level" value={level} />

            <CardHeader>
              <CardTitle>Korak 3 — Sportovi i nivo</CardTitle>
              <CardDescription>Šta voliš da igraš?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium">
                  Sportovi (odaberi jedan ili više)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SPORTS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSport(s.key)}
                      className={cn(
                        "flex flex-col items-center rounded-md border border-border p-4 transition-colors",
                        sports.includes(s.key)
                          ? "border-primary bg-primary/10"
                          : "hover:bg-secondary"
                      )}
                    >
                      <span className="text-3xl">{s.emoji}</span>
                      <span className="mt-1 text-sm font-medium">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Nivo igre</p>
                <div className="grid gap-2">
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
              </div>

              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Nazad
                </Button>
                <FinishButton />
              </div>
            </CardContent>
          </form>
        )}
      </Card>
    </div>
  );
}
