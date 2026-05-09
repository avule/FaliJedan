import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { sportEmoji, sportLabel, levelLabel } from "@/lib/sports";
import { formatScheduledAt } from "@/lib/utils/format";
import { ManageSlotPanel } from "./manage-panel";
import type { Slot, Application, Player } from "@/types/database";

type AppWithPlayer = Application & {
  player: Pick<Player, "id" | "name" | "reliability_score" | "no_show_count_30d"> | null;
};

export default async function MySlotsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: slots } = await supabase
    .from("slots")
    .select("*")
    .eq("organizer_id", user.id)
    .order("scheduled_at", { ascending: false });

  const slotIds = (slots ?? []).map((s) => s.id);
  const { data: apps } = slotIds.length
    ? await supabase
        .from("applications")
        .select(
          "id, slot_id, player_id, status, applied_at, player:players(id, name, reliability_score, no_show_count_30d)"
        )
        .in("slot_id", slotIds)
        .order("applied_at", { ascending: true })
        .returns<AppWithPlayer[]>()
    : { data: [] as AppWithPlayer[] };

  const appsBySlot = new Map<string, AppWithPlayer[]>();
  for (const a of apps ?? []) {
    const list = appsBySlot.get(a.slot_id) ?? [];
    list.push(a);
    appsBySlot.set(a.slot_id, list);
  }

  const slotsList = (slots ?? []) as Slot[];

  return (
    <main className="container py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moji slotovi</h1>
        <Link href="/novi-slot" className={buttonVariants()}>
          + Novi slot
        </Link>
      </div>

      {slotsList.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Još nemaš objavljen slot.{" "}
            <Link href="/novi-slot" className="text-primary hover:underline">
              Objavi prvi
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {slotsList.map((slot) => {
            const slotApps = appsBySlot.get(slot.id) ?? [];
            const accepted = slotApps.filter((a) => a.status === "accepted");
            const waitlist = slotApps.filter((a) => a.status === "waitlist");
            const isPast =
              new Date(slot.scheduled_at).getTime() < Date.now();
            const canConfirm =
              isPast && slot.status !== "done" && slot.status !== "cancelled";

            return (
              <Card key={slot.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{sportEmoji(slot.sport)}</span>
                      <div>
                        <Link
                          href={`/slot/${slot.id}`}
                          className="font-semibold hover:underline"
                        >
                          {slot.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {sportLabel(slot.sport)} · {levelLabel(slot.level)} ·{" "}
                          {formatScheduledAt(slot.scheduled_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          📍 {slot.location_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {slot.status === "cancelled" && (
                        <Badge variant="destructive">Otkazan</Badge>
                      )}
                      {slot.status === "done" && (
                        <Badge variant="secondary">Završen</Badge>
                      )}
                      {slot.status === "full" && <Badge>Popunjen</Badge>}
                      {slot.status === "open" && (
                        <Badge variant="success">
                          Fali {slot.total_spots - slot.filled_spots}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {slot.filled_spots}/{slot.total_spots}
                      </span>
                    </div>
                  </div>

                  <ManageSlotPanel
                    slotId={slot.id}
                    accepted={accepted}
                    waitlist={waitlist}
                    canConfirm={canConfirm}
                    isCancelled={slot.status === "cancelled"}
                    isDone={slot.status === "done"}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
