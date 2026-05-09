import type { SportKey, Level } from "@/types/database";

export const SPORTS: { key: SportKey; label: string; emoji: string; color: string }[] = [
  { key: "football",   label: "Fudbal",   emoji: "⚽", color: "bg-sport-football" },
  { key: "basketball", label: "Košarka",  emoji: "🏀", color: "bg-sport-basketball" },
  { key: "tennis",     label: "Tenis",    emoji: "🎾", color: "bg-sport-tennis" },
  { key: "volleyball", label: "Odbojka",  emoji: "🏐", color: "bg-sport-volleyball" },
  { key: "padel",      label: "Padel",    emoji: "🥎", color: "bg-sport-padel" },
];

export const LEVELS: { key: Level; label: string; description: string }[] = [
  { key: "casual",      label: "Rekreativno",  description: "Igram iz zabave, nije bitan rezultat" },
  { key: "mid",         label: "Srednje",      description: "Znam šta radim, igram redovno" },
  { key: "competitive", label: "Takmičarski",  description: "Treniram, igram jako" },
];

export function sportLabel(key: string): string {
  return SPORTS.find((s) => s.key === key)?.label ?? key;
}

export function sportEmoji(key: string): string {
  return SPORTS.find((s) => s.key === key)?.emoji ?? "🏃";
}

export function levelLabel(key: string): string {
  return LEVELS.find((l) => l.key === key)?.label ?? key;
}
