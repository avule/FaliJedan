import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplyButton } from "@/components/slots/apply-button";
import { SlotRealtime } from "@/components/slots/slot-realtime";
import { SlotChat } from "@/components/chat/slot-chat";
import { sportEmoji, sportLabel, levelLabel } from "@/lib/sports";
import { formatScheduledAt } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type {
  Slot,
  Application,
  Player,
  SlotChatMessage,
} from "@/types/database";

type ApplicationWithPlayer = Application & {
  player: Pick<Player, "id" | "name" | "reliability_score" | "avatar_url"> | null;
};

const SPORT_GLOW: Record<string, string> = {
  football:   "from-sport-football/20",
  basketball: "from-sport-basketball/20",
  tennis:     "from-sport-tennis/20",
  volleyball: "from-sport-volleyball/20",
  padel:      "from-sport-padel/20",
};

export default async function SlotDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: slot } = await supabase
    .from("slots")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Slot>();

  if (!slot) notFound();

  const { data: organizer } = await supabase
    .from("players")
    .select("id, name, reliability_score, avatar_url")
    .eq("id", slot.organizer_id)
    .maybeSingle();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, slot_id, player_id, status, applied_at, player:players(id, name, reliability_score, avatar_url)"
    )
    .eq("slot_id", slot.id)
    .order("applied_at", { ascending: true })
    .returns<ApplicationWithPlayer[]>();

  const apps = applications ?? [];
  const myApp = apps.find((a) => a.player_id === user.id) ?? null;
  const isOrganizer = slot.organizer_id === user.id;
  const isAccepted = myApp?.status === "accepted";
  const canSeeChat = isOrganizer || isAccepted;
  const isClosed = slot.status === "cancelled" || slot.status === "done";

  const accepted = apps.filter((a) => a.status === "accepted");
  const waitlist = apps.filter((a) => a.status === "waitlist");
  const remaining = slot.total_spots - slot.filled_spots;
  const isFull = remaining <= 0 || slot.status === "full";
  const isUrgent = !isFull && remaining === 1;
  const fillPct = Math.min(100, (slot.filled_spots / slot.total_spots) * 100);

  let chatMessages: SlotChatMessage[] = [];
  if (canSeeChat) {
    const { data } = await supabase
      .from("slot_chat")
      .select("*")
      .eq("slot_id", slot.id)
      .order("created_at", { ascending: true })
      .limit(200);
    chatMessages = data ?? [];
  }

  const participants: Record<string, string> = {};
  if (organizer) participants[organizer.id] = organizer.name || "Organizator";
  for (const a of apps) {
    if (a.player) participants[a.player.id] = a.player.name || "Igrač";
  }

  return (
    <main className="container py-6">
      <SlotRealtime slotId={slot.id} />

      <div className="mb-4">
        <Link
          href="/igraj"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden>←</span> Nazad na slotove
        </Link>
      </div>

      {/* HERO */}
      <div
        className={cn(
          "relative mb-6 overflow-hidden rounded-xl border border-border bg-gradient-card p-6 shadow-card md:p-8"
        )}
      >
        {/* sport gradient overlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-70",
            SPORT_GLOW[slot.sport]
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 text-[280px] leading-none opacity-[0.07]"
        >
          {sportEmoji(slot.sport)}
        </div>

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-4xl shadow-card">
                {sportEmoji(slot.sport)}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {sportLabel(slot.sport)} · {levelLabel(slot.level)}
                </p>
                <h1 className="mt-1 font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
                  {slot.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {slot.status === "cancelled" ? (
                <Badge variant="destructive">Otkazan</Badge>
              ) : slot.status === "done" ? (
                <Badge variant="secondary">Završen</Badge>
              ) : isFull ? (
                <Badge variant="secondary">Popunjen</Badge>
              ) : isUrgent ? (
                <Badge variant="urgent">Fali 1!</Badge>
              ) : (
                <Badge variant="success">Fali {remaining}</Badge>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Lokacija" value={slot.location_name} icon="📍" />
            <Stat
              label="Vrijeme"
              value={formatScheduledAt(slot.scheduled_at)}
              icon="🕒"
            />
            <Stat
              label="Slobodno"
              value={
                <span className="font-display tabular text-2xl">
                  {Math.max(0, slot.total_spots - slot.filled_spots)}
                  <span className="text-muted-foreground">/{slot.total_spots}</span>
                </span>
              }
              icon="👥"
            />
            <Stat
              label="Organizator"
              value={
                organizer ? (
                  <Link
                    href={`/igrac/${organizer.id}`}
                    className="text-primary hover:underline"
                  >
                    {organizer.name || "Igrač"}
                  </Link>
                ) : (
                  "—"
                )
              }
              icon="🧑"
            />
          </div>

          {/* Fill bar */}
          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-primary transition-all duration-700 ease-out"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>

          {slot.description && (
            <p className="mt-6 whitespace-pre-wrap text-sm text-muted-foreground">
              {slot.description}
            </p>
          )}

          <div className="mt-6">
            <ApplyButton
              slotId={slot.id}
              myStatus={myApp?.status ?? null}
              isOrganizer={isOrganizer}
              isClosed={isClosed}
            />
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-lg uppercase tracking-wider">
                Prihvaćeni igrači{" "}
                <span className="text-muted-foreground">({accepted.length})</span>
              </h2>
              {accepted.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Još niko nije prihvaćen.
                </p>
              ) : (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {accepted.map((a) => (
                    <PlayerRow key={a.id} app={a} />
                  ))}
                </ul>
              )}

              {waitlist.length > 0 && (
                <>
                  <h2 className="mt-8 font-display text-lg uppercase tracking-wider">
                    Na čekanju{" "}
                    <span className="text-muted-foreground">
                      ({waitlist.length})
                    </span>
                  </h2>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {waitlist.map((a) => (
                      <PlayerRow key={a.id} app={a} muted />
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {canSeeChat ? (
            <SlotChat
              slotId={slot.id}
              meId={user.id}
              initial={chatMessages}
              participants={participants}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              <span className="block text-3xl opacity-50">🔒</span>
              <p className="mt-2">Chat je dostupan samo prihvaćenim igračima.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
        <span aria-hidden>{icon}</span> {label}
      </p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function PlayerRow({
  app,
  muted,
}: {
  app: ApplicationWithPlayer;
  muted?: boolean;
}) {
  const initial = (app.player?.name || "?").charAt(0).toUpperCase();
  const score = app.player?.reliability_score ?? 100;
  return (
    <li>
      <Link
        href={`/igrac/${app.player_id}`}
        className={cn(
          "flex items-center gap-3 rounded-md border border-border bg-card/50 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-secondary",
          muted && "opacity-70"
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-muted text-xs font-bold">
          {initial}
        </span>
        <span className="flex-1 truncate">{app.player?.name || "Igrač"}</span>
        <span
          className={cn(
            "tabular text-xs font-medium",
            score >= 85
              ? "text-primary"
              : score >= 60
                ? "text-accent"
                : "text-destructive"
          )}
        >
          {score}%
        </span>
      </Link>
    </li>
  );
}
