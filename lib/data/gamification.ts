// Citanje podataka gejmifikacije za server komponente. Drzimo se obrasca cijele
// aplikacije: stranice zovu ove funkcije direktno, bez zasebnih REST ruta.
// Pisanje (XP, bedzevi) ide kroz RPC u bazi, ovdje je samo citanje.

import { createClient } from "@/lib/supabase/server";
import { levelFromXp, levelTitle } from "@/lib/gamification";
import { BADGES, type BadgeKey } from "@/lib/badges";

export type ProfileGamification = {
  xp: number;
  level: number;
  title: string;
  intoLevel: number;
  toNext: number;
  pct: number;
  reliability: number;
  streak: number;
  bestStreak: number;
  attended: number;
  organized: number;
  noShows: number;
  badges: { key: BadgeKey; name: string; desc: string; icon: string; earned: boolean }[];
};

// Sve brojace i bedzeve jednog igraca, spremno za prikaz na profilu.
export async function getProfileGamification(
  playerId: string
): Promise<ProfileGamification | null> {
  const supabase = await createClient();

  const [{ data: p }, { data: earned }] = await Promise.all([
    supabase
      .from("players")
      .select(
        "xp, streak, best_streak, attended, organized, reliability_score, no_show_count_30d"
      )
      .eq("id", playerId)
      .maybeSingle<{
        xp: number;
        streak: number;
        best_streak: number;
        attended: number;
        organized: number;
        reliability_score: number;
        no_show_count_30d: number;
      }>(),
    supabase
      .from("user_badges")
      .select("badge_key")
      .eq("player_id", playerId)
      .returns<{ badge_key: string }[]>(),
  ]);

  if (!p) return null;

  const lvl = levelFromXp(p.xp);
  const earnedKeys = new Set((earned ?? []).map((b) => b.badge_key));

  return {
    xp: p.xp,
    level: lvl.level,
    title: levelTitle(lvl.level),
    intoLevel: lvl.intoLevel,
    toNext: lvl.toNext,
    pct: lvl.pct,
    reliability: p.reliability_score,
    streak: p.streak,
    bestStreak: p.best_streak,
    attended: p.attended,
    organized: p.organized,
    noShows: p.no_show_count_30d,
    badges: BADGES.map((b) => ({ ...b, earned: earnedKeys.has(b.key) })),
  };
}

export type XpHistoryRow = {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
};

// Istorija dodijeljenog XP-a za jednog igraca, najnovije prvo. RLS dozvoljava
// citanje samo svojih dogadjaja (vidi 0011), pa za tudji profil vraca prazno.
export async function getXpHistory(
  playerId: string,
  limit = 20
): Promise<XpHistoryRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("xp_events")
    .select("id, type, amount, created_at")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      { id: string; type: string; amount: number; created_at: string }[]
    >();

  return (data ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    createdAt: e.created_at,
  }));
}

export type LeaderboardRow = {
  rank: number;
  playerId: string;
  name: string;
  title: string;
  level: number;
  xp: number;
  avatarUrl: string | null;
};

// Pretvara redove igraca u rang listu sa pozicijama. Level i naziv se racunaju
// iz xp vrijednosti, ne cuvaju se u bazi.
function toRows(
  data: { id: string; name: string; xp: number; avatar_url: string | null }[]
): LeaderboardRow[] {
  return data.map((row, i) => {
    const lvl = levelFromXp(row.xp).level;
    return {
      rank: i + 1,
      playerId: row.id,
      name: row.name || "Igrač",
      title: levelTitle(lvl),
      level: lvl,
      xp: row.xp,
      avatarUrl: row.avatar_url,
    };
  });
}

// Rang lista jednog grada, poredjana po XP vrijednosti. Rang se racuna u letu.
export async function getLeaderboard(
  cityId: number | null,
  limit = 20
): Promise<LeaderboardRow[]> {
  if (!cityId) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("players")
    .select("id, name, xp, avatar_url")
    .eq("city_id", cityId)
    .gt("xp", 0)
    .order("xp", { ascending: false })
    .limit(limit)
    .returns<
      { id: string; name: string; xp: number; avatar_url: string | null }[]
    >();

  return toRows(data ?? []);
}

// Globalni top igraca (bez filtera grada). Za rang listu na landingu, gdje
// posjetilac nije ulogovan pa nema svoj grad.
export async function getTopPlayers(limit = 10): Promise<LeaderboardRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("players")
    .select("id, name, xp, avatar_url")
    .gt("xp", 0)
    .order("xp", { ascending: false })
    .limit(limit)
    .returns<
      { id: string; name: string; xp: number; avatar_url: string | null }[]
    >();

  return toRows(data ?? []);
}
