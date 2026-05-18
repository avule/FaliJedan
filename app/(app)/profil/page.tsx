import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { RingChart } from "@/components/ui/ring-chart";
import { CountUp } from "@/components/ui/count-up";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileForm } from "./profile-form";
import { cn } from "@/lib/utils/cn";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: player },
    { data: countries },
    { data: cities },
    showedRes,
    organizedRes,
  ] = await Promise.all([
    supabase
      .from("players")
      .select(
        "name, country_id, city_id, sports, level, avatar_url, reliability_score, no_show_count_30d"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("countries").select("id, name, code").order("name"),
    supabase.from("cities").select("id, country_id, name").order("name"),
    supabase
      .from("appearances")
      .select("slot_id", { count: "exact", head: true })
      .eq("player_id", user.id)
      .eq("showed_up", true),
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id),
  ]);

  const showedCount = showedRes.count ?? 0;
  const organizedCount = organizedRes.count ?? 0;
  const score = player?.reliability_score ?? 100;
  const noShow30 = player?.no_show_count_30d ?? 0;

  return (
    <main className="container max-w-3xl py-6">
      <div className="mb-6">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
          Profil
        </p>
        <h1 className="mt-1 font-display text-4xl uppercase tracking-tight md:text-5xl">
          {player?.name || "Moj profil"}
        </h1>
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
                    ? `${noShow30}× ne-pojav. (30d)`
                    : "Bez incidenata"
                }
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat
                  label="Odigrano"
                  value={<CountUp value={showedCount} />}
                  accent
                />
                <MiniStat
                  label="Organizovao"
                  value={<CountUp value={organizedCount} />}
                />
                <MiniStat
                  label="Ne-pojav."
                  value={<CountUp value={noShow30} />}
                  danger={noShow30 >= 2}
                />
              </div>
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
          accent && "text-primary text-glow",
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
