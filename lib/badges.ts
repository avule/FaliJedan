// Registar bedzeva za prikaz. Uslov za sticanje se NE racuna ovdje nego u bazi
// (evaluate_badges u migraciji 0009), da postoji samo jedan izvor istine. UI
// ovaj spisak spaja sa kljucevima iz user_badges da zna sta je otkljucano.

export type BadgeKey =
  | "debi"
  | "streak_10"
  | "reliable_100"
  | "maestro"
  | "organizer_5"
  | "top3";

export type Badge = {
  key: BadgeKey;
  name: string;
  desc: string;
  icon: string;
};

export const BADGES: Badge[] = [
  { key: "debi",         name: "Debi",        desc: "Odigraj prvi meč",                 icon: "⭐" },
  { key: "streak_10",    name: "Niz x10",     desc: "10 mečeva u nizu",                 icon: "🔥" },
  { key: "reliable_100", name: "Pouzdan",     desc: "100% pojavljivanje (min 5 mečeva)", icon: "🛡️" },
  { key: "maestro",      name: "Maestro",     desc: "20+ odigranih mečeva u sportu",    icon: "⚽" },
  { key: "organizer_5",  name: "Organizator", desc: "Kreiraj 5 slotova",                icon: "👑" },
  { key: "top3",         name: "Top 3",       desc: "Uđi u top 3 gradske rang liste",   icon: "🏆" },
];

// Mapa iz kljuca u bedz, za brzo pronalazenje pri prikazu otkljucanih.
export const BADGE_BY_KEY: Record<BadgeKey, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.key, b])
) as Record<BadgeKey, Badge>;
