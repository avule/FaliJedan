import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RingChart } from "@/components/ui/ring-chart";
import { CountUp } from "@/components/ui/count-up";
import { sportEmoji, sportLabel, levelLabel } from "@/lib/sports";
import type { Player } from "@/types/database";

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

  const [acceptedRes, showedRes] = await Promise.all([
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
  ]);

  const acceptedCount = acceptedRes.count ?? 0;
  const showedCount = showedRes.count ?? 0;
  const isBanned =
    !!player.ban_until && new Date(player.ban_until).getTime() > Date.now();

  return (
    <main className="container max-w-4xl py-6">
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-xl border border-border bg-gradient-card p-6 shadow-card md:p-8">
        <div className="bg-stripes absolute inset-0 opacity-50" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-primary text-4xl font-display text-primary-foreground shadow-glow">
            {(player.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
              {player.name || "Igrač"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {player.city?.name && player.country?.name
                ? `${player.city.name}, ${player.country.name}`
                : "—"}
              {player.level && (
                <>
                  {" · "}
                  <span className="text-foreground">
                    {levelLabel(player.level)}
                  </span>
                </>
              )}
            </p>
            {isBanned && (
              <Badge variant="destructive" className="mt-3">
                Banovan
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
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

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="font-display text-5xl text-primary text-glow">
                  <CountUp value={showedCount} />
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Odigranih mečeva
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="font-display text-5xl">
                  <CountUp value={acceptedCount} />
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Prihvaćenih prijava
                </p>
              </CardContent>
            </Card>
          </div>

          {player.sports.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="mb-3 font-display text-sm uppercase tracking-wider text-muted-foreground">
                  Sportovi
                </p>
                <div className="flex flex-wrap gap-2">
                  {player.sports.map((s) => (
                    <Badge key={s} variant="secondary">
                      {sportEmoji(s)} {sportLabel(s)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
