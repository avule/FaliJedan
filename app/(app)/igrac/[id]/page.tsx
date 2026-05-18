import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { RingChart } from "@/components/ui/ring-chart";
import { CountUp } from "@/components/ui/count-up";
import { sportEmoji, sportLabel, levelLabel } from "@/lib/sports";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Player, Slot, Appearance, NoShowLog } from "@/types/database";

type ActivityItem =
  | { kind: "showed"; at: string; slot: Slot }
  | { kind: "no_show"; at: string; slot: Slot }
  | { kind: "late_cancel"; at: string; slot: Slot };

export default async function PlayerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*, city:cities(name), country:countries(name)")
    .eq("id", params.id)
    .maybeSingle<
      Player & {
        city: { name: string } | null;
        country: { name: string } | null;
      }
    >();

  if (!player) notFound();

  const [
    acceptedRes,
    showedRes,
    appearancesRes,
    noShowLogRes,
    totalAppsRes,
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("player_id", player.id)
      .eq("status", "accepted"),
    supabase
      .from("appearances")
      .select("slot_id", { count: "exact", head: true })
      .eq("player_id", player.id)
      .eq("showed_up", true),
    supabase
      .from("appearances")
      .select("slot_id, showed_up, confirmed_at, slot:slots(*)")
      .eq("player_id", player.id)
      .order("confirmed_at", { ascending: false })
      .limit(8)
      .returns<(Appearance & { slot: Slot | null })[]>(),
    supabase
      .from("no_show_log")
      .select("slot_id, type, created_at, slot:slots(*)")
      .eq("player_id", player.id)
      .eq("type", "late_cancel")
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<(NoShowLog & { slot: Slot | null })[]>(),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("player_id", player.id),
  ]);

  const acceptedCount = acceptedRes.count ?? 0;
  const showedCount = showedRes.count ?? 0;
  const totalApps = totalAppsRes.count ?? 0;
  const acceptRate =
    totalApps > 0 ? Math.round((acceptedCount / totalApps) * 100) : 0;
  const isBanned =
    !!player.ban_until && new Date(player.ban_until).getTime() > Date.now();

  // Merge appearances + late_cancels into a single activity feed
  const activity: ActivityItem[] = [
    ...(appearancesRes.data ?? [])
      .filter((a): a is Appearance & { slot: Slot } => !!a.slot)
      .map<ActivityItem>((a) => ({
        kind: a.showed_up ? "showed" : "no_show",
        at: a.confirmed_at,
        slot: a.slot,
      })),
    ...(noShowLogRes.data ?? [])
      .filter((n): n is NoShowLog & { slot: Slot } => !!n.slot)
      .map<ActivityItem>((n) => ({
        kind: "late_cancel",
        at: n.created_at,
        slot: n.slot,
      })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6);

  return (
    <main className="container max-w-5xl py-6">
      {/* HEADER STRIP */}
      <div className="relative mb-6 overflow-hidden rounded-xl border border-border bg-gradient-card p-6 shadow-card md:p-8">
        <div className="bg-stripes absolute inset-0 opacity-50" />
        <div className="relative flex flex-wrap items-center gap-6">
          <Avatar
            src={player.avatar_url}
            name={player.name}
            size="xl"
            highlight={!player.avatar_url}
            className="!rounded-2xl"
          />
          <div className="flex-1">
            <h1 className="font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
              {player.name || "Igrač"}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {player.city?.name && player.country?.name ? (
                <>
                  <span aria-hidden>📍</span>
                  {player.city.name}, {player.country.name}
                </>
              ) : (
                "-"
              )}
              {player.level && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-foreground">
                    {levelLabel(player.level)} level
                  </span>
                </>
              )}
            </p>
            {player.sports.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {player.sports.map((s) => (
                  <Badge key={s} variant="secondary">
                    {sportEmoji(s)} {sportLabel(s)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {isBanned && <Badge variant="destructive">Banovan</Badge>}
        </div>
      </div>

      {/* MAIN GRID: ring (left) + stats + activity (right) */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <RingChart
              value={player.reliability_score}
              label="Pouzdanost"
              sublabel={
                player.no_show_count_30d > 0
                  ? `${player.no_show_count_30d}× ne-pojav. (30d)`
                  : "Bez incidenata (30d)"
              }
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Odigranih mečeva"
              value={<CountUp value={showedCount} />}
              accent
            />
            <StatCard
              label="Prijave"
              value={
                <>
                  <CountUp value={acceptRate} />%
                </>
              }
            />
            <StatCard
              label="Ne-pojav. (30d)"
              value={<CountUp value={player.no_show_count_30d} />}
              danger={player.no_show_count_30d >= 2}
            />
            <StatCard
              label="Reliability"
              value={
                <>
                  <CountUp value={player.reliability_score} />%
                </>
              }
            />
          </div>

          {/* Activity feed */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-display text-sm uppercase tracking-wider text-muted-foreground">
                Nedavne aktivnosti
              </h2>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Još nema aktivnosti.
                </p>
              ) : (
                <ul className="space-y-2">
                  {activity.map((a, i) => (
                    <ActivityRow key={i} item={a} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function StatCard({
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
    <Card>
      <CardContent className="pt-6 text-center">
        <p
          className={cn(
            "font-display text-4xl tabular leading-none",
            accent && "text-primary text-glow",
            danger && "text-destructive"
          )}
        >
          {value}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const config = {
    showed: {
      icon: "✓",
      color: "text-primary",
      bg: "bg-primary/15 border-primary/30",
      label: "Odigrao",
    },
    no_show: {
      icon: "✗",
      color: "text-destructive",
      bg: "bg-destructive/15 border-destructive/30",
      label: "Nije se pojavio",
    },
    late_cancel: {
      icon: "⏱",
      color: "text-accent",
      bg: "bg-accent/15 border-accent/30",
      label: "Kasna odjava",
    },
  }[item.kind];

  return (
    <li>
      <Link
        href={`/slot/${item.slot.id}`}
        className="flex items-center gap-3 rounded-md border border-border bg-card/50 p-3 transition-colors hover:border-primary/40 hover:bg-secondary"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-display text-lg",
            config.bg,
            config.color
          )}
        >
          {config.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {sportEmoji(item.slot.sport)} {item.slot.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {config.label} · {formatRelative(item.at)}
          </p>
        </div>
      </Link>
    </li>
  );
}
