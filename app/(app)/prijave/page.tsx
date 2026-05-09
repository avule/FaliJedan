import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sportEmoji, sportLabel, levelLabel } from "@/lib/sports";
import { formatScheduledAt } from "@/lib/utils/format";
import type { Application, Slot } from "@/types/database";

type AppWithSlot = Application & { slot: Slot | null };

const STATUS_LABEL: Record<Application["status"], string> = {
  pending: "Na čekanju",
  accepted: "Prihvaćen",
  rejected: "Odbijen",
  waitlist: "Waitlista",
};

const STATUS_VARIANT: Record<
  Application["status"],
  "default" | "success" | "secondary" | "destructive" | "warning"
> = {
  pending: "secondary",
  accepted: "success",
  rejected: "destructive",
  waitlist: "warning",
};

export default async function MyApplicationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("applications")
    .select(
      "id, slot_id, player_id, status, applied_at, slot:slots(*)"
    )
    .eq("player_id", user.id)
    .order("applied_at", { ascending: false })
    .returns<AppWithSlot[]>();

  const apps = (data ?? []).filter((a) => a.slot);

  const upcoming = apps.filter(
    (a) => a.slot && new Date(a.slot.scheduled_at).getTime() >= Date.now()
  );
  const past = apps.filter(
    (a) => a.slot && new Date(a.slot.scheduled_at).getTime() < Date.now()
  );

  return (
    <main className="container py-6">
      <h1 className="mb-4 text-2xl font-bold">Moje prijave</h1>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nisi se još prijavio na slot.{" "}
            <Link href="/igraj" className="text-primary hover:underline">
              Pogledaj slotove
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                Predstoji ({upcoming.length})
              </h2>
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <ApplicationRow key={a.id} app={a} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                Prošlo ({past.length})
              </h2>
              <div className="space-y-2">
                {past.map((a) => (
                  <ApplicationRow key={a.id} app={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function ApplicationRow({ app }: { app: AppWithSlot }) {
  const slot = app.slot!;
  return (
    <Link href={`/slot/${slot.id}`} className="block">
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{sportEmoji(slot.sport)}</span>
            <div>
              <h3 className="font-medium">{slot.title}</h3>
              <p className="text-xs text-muted-foreground">
                {sportLabel(slot.sport)} · {levelLabel(slot.level)} ·{" "}
                {formatScheduledAt(slot.scheduled_at)}
              </p>
              <p className="text-xs text-muted-foreground">
                📍 {slot.location_name}
              </p>
            </div>
          </div>
          <Badge variant={STATUS_VARIANT[app.status]}>
            {STATUS_LABEL[app.status]}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
