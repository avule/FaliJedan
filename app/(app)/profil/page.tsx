// Moj profil: pouzdanost (ring), nivo i XP, statistike, bedzevi, gradska rang
// lista i forma za izmjenu. Pouzdanost, XP i bedzevi dolaze iz baze.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { RingChart } from "@/components/ui/ring-chart";
import { CountUp } from "@/components/ui/count-up";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { RealtimeRefresh } from "@/components/slots/realtime-refresh";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StreakChip } from "@/components/gamification/streak-chip";
import { XpBar } from "@/components/gamification/xp-bar";
import { BadgeShelf } from "@/components/gamification/badge-shelf";
import { Leaderboard } from "@/components/gamification/leaderboard";
import { XpHistory } from "@/components/gamification/xp-history";
import {
  getProfileGamification,
  getLeaderboard,
  getXpHistory,
} from "@/lib/data/gamification";
import { ProfileForm } from "./profile-form";
import { cn } from "@/lib/utils/cn";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: player }, { data: countries }, { data: cities }, game, xpHistory] =
    await Promise.all([
      supabase
        .from("players")
        .select(
          "name, country_id, city_id, sports, level, avatar_url, city:cities(name)"
        )
        .eq("id", user.id)
        .maybeSingle<{
          name: string;
          country_id: number | null;
          city_id: number | null;
          sports: string[];
          level: "casual" | "mid" | "competitive" | null;
          avatar_url: string | null;
          city: { name: string } | null;
        }>(),
      supabase.from("countries").select("id, name, code").order("name"),
      supabase.from("cities").select("id, country_id, name").order("name"),
      getProfileGamification(user.id),
      getXpHistory(user.id, 20),
    ]);

  const leaderboard = await getLeaderboard(player?.city_id ?? null, 10);

  const score = game?.reliability ?? 100;
  const noShow30 = game?.noShows ?? 0;

  return (
    <main className="container max-w-3xl py-6">
      {/* xp/nivo/bedzevi se mijenjaju na slot promjene (potvrda pojava, popunjen
          slot), pa slusamo slots i osvjezavamo profil zivo */}
      <RealtimeRefresh />
      <div className="mb-6">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
          Profil
        </p>
        <h1 className="mt-1 font-display text-4xl uppercase tracking-tight md:text-5xl">
          {player?.name || "Moj profil"}
        </h1>
        {game && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LevelBadge level={game.level} title={game.title} />
            <StreakChip streak={game.streak} />
          </div>
        )}
      </div>

      {/* Stats summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-[200px_1fr] sm:items-center">
            <div className="flex justify-center">
              <RingChart
                value={score}
                label="Pouzdanost"
                sublabel={
                  noShow30 > 0
                    ? `${noShow30} izostanaka (30d)`
                    : "Bez incidenata"
                }
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat
                  label="Odigrano"
                  value={<CountUp value={game?.attended ?? 0} />}
                  accent
                />
                <MiniStat
                  label="Organizovao"
                  value={<CountUp value={game?.organized ?? 0} />}
                />
                <MiniStat
                  label="Izostanci"
                  value={<CountUp value={noShow30} />}
                  danger={noShow30 >= 2}
                />
              </div>
              {game && (
                <XpBar
                  intoLevel={game.intoLevel}
                  toNext={game.toNext}
                  pct={game.pct}
                />
              )}
              <Link
                href={`/igrac/${user.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Vidi javni profil i istoriju →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bedzevi */}
      {game && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="mb-4 font-display text-sm uppercase tracking-wider text-muted-foreground">
              Bedževi
            </h2>
            <BadgeShelf badges={game.badges} />
          </CardContent>
        </Card>
      )}

      {/* Istorija XP-a (privatno, samo moj profil) */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-4 font-display text-sm uppercase tracking-wider text-muted-foreground">
            Istorija XP-a
          </h2>
          <XpHistory rows={xpHistory} />
        </CardContent>
      </Card>

      {/* Rang lista grada */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-4 font-display text-sm uppercase tracking-wider text-muted-foreground">
            Rang lista{player?.city?.name ? ` · ${player.city.name}` : ""}
          </h2>
          <Leaderboard rows={leaderboard} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="mb-4 font-display text-sm uppercase tracking-wider text-muted-foreground">
            Avatar
          </h2>
          <AvatarUpload
            userId={user.id}
            name={player?.name || user.email || "Igrač"}
            initialUrl={player?.avatar_url ?? null}
          />
        </CardContent>
      </Card>

      <ProfileForm
        initial={{
          name: player?.name ?? "",
          country_id: player?.country_id ?? null,
          city_id: player?.city_id ?? null,
          sports: (player?.sports ?? []) as string[],
          level: (player?.level ?? "casual") as "casual" | "mid" | "competitive",
        }}
        countries={countries ?? []}
        cities={cities ?? []}
      />
    </main>
  );
}

function MiniStat({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-card/50 px-3 py-3 text-center">
      <p
        className={cn(
          "font-display text-3xl tabular leading-none",
          accent && "text-primary",
          danger && "text-destructive"
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
