// Cista logika gejmifikacije: XP nagrade, kriva levela, nazivi nivoa.
//
// VAZNO: ovo mora da se poklapa sa SQL funkcijom level_from_xp u migraciji
// 0009. Ako mijenjas krivu, mijenjaj na oba mjesta. Pouzdanost se NE racuna
// ovdje jer je izvor istine players.reliability_score iz baze.

// Koliko XP poena koja akcija donosi. Mora se poklapati sa award_xp pozivima u 0009.
export const XP_AWARDS = {
  match_played: 100, // igrac potvrdjen da se pojavio
  match_organized: 60, // tvoj slot je zavrsen
  slot_filled: 40, // tvoj slot se popunio do kraja
  first_sport: 50, // prvi mec u novom sportu
  streak_bonus: 50, // na svaki peti mec u nizu
} as const;

export type XpEventType = keyof typeof XP_AWARDS;

// Nazivi tipova za prikaz istorije. Drzi se uz XP_AWARDS da se ne razidju.
export const XP_LABELS: Record<XpEventType, string> = {
  match_played: "Odigran meč",
  match_organized: "Organizovan meč",
  slot_filled: "Slot popunjen",
  first_sport: "Prvi meč u sportu",
  streak_bonus: "Bonus za niz",
};

// Naziv tipa, sa rezervom za nepoznat tip (npr. stari dogadjaj).
export const xpLabel = (type: string): string =>
  (XP_LABELS as Record<string, string>)[type] ?? "XP";

// XP potreban da se predje SA datog levela na sljedeci.
// Nivo 1 na 2 je 500, nivo 2 na 3 je 750, nivo 7 na 8 je 2000.
export const levelReq = (level: number): number => 500 + (level - 1) * 250;

export type LevelInfo = {
  level: number; // trenutni level
  intoLevel: number; // XP skupljen unutar trenutnog levela
  toNext: number; // XP potreban za sljedeci level
  pct: number; // napredak ka sljedecem levelu, od 0 do 100
};

// Razlozi ukupan XP na level + napredak. Cista funkcija, lako se testira.
export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  let rem = Math.max(0, Math.floor(totalXp));
  while (rem >= levelReq(level)) {
    rem -= levelReq(level);
    level += 1;
  }
  const toNext = levelReq(level);
  return {
    level,
    intoLevel: rem,
    toNext,
    pct: Math.round((rem / toNext) * 100),
  };
}

// Naziv nivoa po levelu. Indeksira se sa min(level, zadnji) da visoki leveli
// ne pucaju izvan niza.
export const LEVEL_TITLES = [
  "Početnik",
  "Početnik",
  "Redovni igrač",
  "Redovni igrač",
  "Igrač iz kraja",
  "Igrač iz kraja",
  "Street Baller",
  "Street Baller",
  "Veteran",
  "Veteran",
  "Legenda terena",
  "Legenda terena",
  "Maestro",
] as const;

export const levelTitle = (level: number): string =>
  LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1];
