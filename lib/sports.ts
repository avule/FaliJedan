import type { SportKey, Level } from "@/types/database";

// Main sports — shown in onboarding, profile, landing.
export const SPORTS: { key: SportKey; label: string; emoji: string; color: string }[] = [
  { key: "football",   label: "Fudbal",   emoji: "⚽", color: "bg-sport-football" },
  { key: "basketball", label: "Košarka",  emoji: "🏀", color: "bg-sport-basketball" },
  { key: "padel",      label: "Padel",    emoji: "🥎", color: "bg-sport-padel" },
];

// All choosable sports for slot creation — adds "Drugo" option.
export const SPORTS_FOR_SLOT: typeof SPORTS = [
  ...SPORTS,
  { key: "other", label: "Drugo", emoji: "🏃", color: "bg-secondary" },
];

export const LEVELS: { key: Level; label: string; description: string }[] = [
  { key: "casual",      label: "Rekreativno",  description: "Igram iz zabave, nije bitan rezultat" },
  { key: "mid",         label: "Srednje",      description: "Znam šta radim, igram redovno" },
  { key: "competitive", label: "Takmičarski",  description: "Treniram, igram jako" },
];

/**
 * Resolve a sport's display label. For "other" slots, pass the slot's
 * custom_sport as the fallback to show the user-typed name.
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
