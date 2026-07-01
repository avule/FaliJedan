// Centralno mjesto za sportove i nivoe igre: nazivi, emoji i boje, plus male
// pomocne funkcije za prikaz. Da se nazivi ne kucaju razbacano po komponentama.

import type { SportKey, Level } from "@/types/database";

// Glavni sportovi, prikazuju se u onboardingu, profilu i na pocetnoj.
export const SPORTS: { key: SportKey; label: string; emoji: string; color: string }[] = [
  { key: "football",   label: "Fudbal",   emoji: "⚽", color: "bg-sport-football" },
  { key: "basketball", label: "Košarka",  emoji: "🏀", color: "bg-sport-basketball" },
  { key: "padel",      label: "Padel",    emoji: "🥎", color: "bg-sport-padel" },
];

// Svi sportovi za izradu slota, dodaje opciju "Drugo".
export const SPORTS_FOR_SLOT: typeof SPORTS = [
  ...SPORTS,
  { key: "other", label: "Drugo", emoji: "🏃", color: "bg-secondary" },
];

export const LEVELS: { key: Level; label: string; description: string }[] = [
  { key: "casual",      label: "Rekreativno",  description: "Igram opušteno, rezultat nije najvažniji" },
  { key: "mid",         label: "Srednje",      description: "Igram redovno i držim tempo" },
  { key: "competitive", label: "Takmičarski",  description: "Volim jači ritam i ozbiljniju igru" },
];

/**
 * Vraca naziv sporta za prikaz. Za slotove tipa "other" proslijedi
 * custom_sport da se prikaze naziv koji je korisnik sam ukucao.
 */
export function sportLabel(key: string, customSport?: string | null): string {
  if (key === "other" && customSport) return customSport;
  return SPORTS_FOR_SLOT.find((s) => s.key === key)?.label ?? key;
}

export function sportEmoji(key: string): string {
  return SPORTS_FOR_SLOT.find((s) => s.key === key)?.emoji ?? "🏃";
}

export function levelLabel(key: string): string {
  return LEVELS.find((l) => l.key === key)?.label ?? key;
}
