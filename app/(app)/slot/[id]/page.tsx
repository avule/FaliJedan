// Detalj jednog slota, srce aplikacije. Server komponenta koja povuce slot,
// organizatora, prijave i poruke, pa kroz tabove prikaze detalje, igrace,
// (organizatoru) prijave i chat. Sta korisnik vidi i moze zavisi od uloge:
// organizator, prihvacen igrac ili posjetilac.

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { ApplyButton } from "@/components/slots/apply-button";
import { SlotOrganizerActions } from "@/components/slots/slot-organizer-actions";
import { ApplicationActions } from "@/components/slots/application-actions";
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

// Boja sjaja u hero dijelu po sportu. Za "other" nema unosa, pa cn() samo
// preskoci undefined i sjaj se ne prikaze.
const SPORT_GLOW: Record<string, string> = {
  football:   "from-sport-football/20",
  basketball: "from-sport-basketball/20",
  padel:      "from-sport-padel/20",
};

type TabKey = "detalji" | "igraci" | "prijave" | "chat";

export default async function SlotDetailPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: TabKey }>;
  }
) {
  // Next 16: params i searchParams su Promise, pa se cekaju.
  const searchParams = await props.searchParams;
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Slot je osnova cijele stranice. Razdvajamo dva slucaja: ako je upit pukao
  // (Supabase blip, istekao token...) bacamo gresku pa Next da 500 koji se moze
  // osvjeziti - inace bi se trenutni promasaj zakesirao kao trajni 404.
  // notFound() ostaje samo za red kojeg stvarno nema.
  const { data: slot, error: slotErr } = await supabase
    .from("slots")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Slot>();

  if (slotErr) throw slotErr;
  if (!slot) notFound();

  // Organizator za prikaz imena i link na njegov profil.
  const { data: organizer } = await supabase
    .from("players")
    .select("id, name, reliability_score, avatar_url")
    .eq("id", slot.organizer_id)
    .maybeSingle();

  // Sve prijave + osnovni podaci igraca jednim upitom (join na players),
  // da ne radimo poseban upit za svakog igraca.
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, slot_id, player_id, status, applied_at, player:players(id, name, reliability_score, avatar_url)"
    )
    .eq("slot_id", slot.id)
    .order("applied_at", { ascending: true })
    .returns<ApplicationWithPlayer[]>();

  // Ko je trenutni korisnik u odnosu na ovaj slot. Od ovih zastavica zavisi
  // sta se prikazuje: koja dugmad, koji tabovi, da li chat.
  const apps = applications ?? [];
  const myApp = apps.find((a) => a.player_id === user.id) ?? null;
  const isOrganizer = slot.organizer_id === user.id;
  const isAccepted = myApp?.status === "accepted";
  const canSeeChat = isOrganizer || isAccepted; // chat vide samo ucesnici
  const isClosed = slot.status === "cancelled" || slot.status === "done";

  // Podjela prijava i racun slobodnih mjesta, za badge i meter u herou.
  const accepted = apps.filter((a) => a.status === "accepted");
  const waitlist = apps.filter((a) => a.status === "waitlist");
  const remaining = slot.total_spots - slot.filled_spots;
  const isFull = remaining <= 0 || slot.status === "full";
  const isUrgent = !isFull && remaining === 1; // fali jos samo jedan
  const fillPct = Math.min(100, (slot.filled_spots / slot.total_spots) * 100);

  // Poruke povlacimo samo ako korisnik smije da vidi chat, da ne trosimo
  // upit bez potrebe.
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

  // Mapa id -> ime, da chat zna ciju poruku da prikaze uz koje ime.
  const participants: Record<string, string> = {};
  if (organizer) participants[organizer.id] = organizer.name || "Organizator";
  for (const a of apps) {
    if (a.player) participants[a.player.id] = a.player.name || "Igrač";
  }

  const activeTab: TabKey = searchParams.tab ?? "detalji";

  // Sastavi listu tabova (Prijave vidi samo organizator).
  const tabs = [
    { key: "detalji", label: "Detalji" },
    {
      key: "igraci",
      label: "Igrači",
      count: accepted.length,
    },
    ...(isOrganizer
      ? [{ key: "prijave", label: "Prijave", count: apps.length }]
      : []),
    ...(canSeeChat ? [{ key: "chat", label: "Chat" }] : []),
  ];

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
      <div className="relative mb-6 overflow-hidden rounded-xl border border-border bg-gradient-card p-6 shadow-card md:p-8">
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
                  {sportLabel(slot.sport, slot.custom_sport)} ·{" "}
                  {levelLabel(slot.level)}
                </p>
                <h1 className="mt-1 font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
                  {slot.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Status badge: otkazan/zavrsen/pun imaju prednost, pa tek onda
                  koliko jos fali (urgent ako fali samo jedan). */}
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
            <Stat
              label="Lokacija"
              value={
                // Vodi na Google Maps sa tacnim koordinatama pina koje je
                // organizator postavio pri kreiranju slota.
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${slot.lat},${slot.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {slot.location_name}
                  <span aria-hidden className="text-xs">↗</span>
                </a>
              }
            />
            <Stat
              label="Vrijeme"
              value={formatScheduledAt(slot.scheduled_at)}
            />
            <Stat
              label="Slobodno"
              value={
                <span className="font-display tabular text-2xl">
                  {Math.max(0, slot.total_spots - slot.filled_spots)}
                  <span className="text-muted-foreground">
                    /{slot.total_spots}
                  </span>
                </span>
              }
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
                  "-"
                )
              }
            />
          </div>

          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-primary transition-all duration-700 ease-out"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>

          <div className="mt-6">
            {/* Organizator vidi svoje akcije (izmijeni/otkazi), svi ostali
                dugme za prijavu ili odjavu. */}
            {isOrganizer ? (
              <SlotOrganizerActions slotId={slot.id} isClosed={isClosed} />
            ) : (
              <ApplyButton
                slotId={slot.id}
                myStatus={myApp?.status ?? null}
                isOrganizer={isOrganizer}
                isClosed={isClosed}
              />
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs tabs={tabs} basePath={`/slot/${slot.id}`} className="mb-6" />

      {/* TAB CONTENT - prikazuje se samo aktivni tab. Prijave i chat su i ovdje
          jos jednom zasticeni ulogom (isOrganizer / canSeeChat), ne oslanjamo se
          samo na to sto je tab skriven. */}
      {activeTab === "detalji" && <DetailsTab description={slot.description} />}

      {activeTab === "igraci" && (
        <PlayersTab accepted={accepted} waitlist={waitlist} />
      )}

      {activeTab === "prijave" && isOrganizer && (
        <ApplicationsTab apps={apps} slotId={slot.id} isClosed={isClosed} />
      )}

      {activeTab === "chat" && canSeeChat && (
        <ChatTab
          slotId={slot.id}
          meId={user.id}
          initial={chatMessages}
          participants={participants}
        />
      )}
    </main>
  );
}

/* Pomocne komponente */

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function DetailsTab({ description }: { description: string | null }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="font-display text-lg uppercase tracking-wider">
          O slotu
        </h2>
        {description ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {description}
          </p>
        ) : (
          <p className="mt-3 text-sm italic text-muted-foreground">
            Organizator nije dodao opis.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Tab "Igraci": prihvaceni i lista cekanja. Samo prikaz, bez akcija.
function PlayersTab({
  accepted,
  waitlist,
}: {
  accepted: ApplicationWithPlayer[];
  waitlist: ApplicationWithPlayer[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <h2 className="font-display text-lg uppercase tracking-wider">
            Prihvaćeni{" "}
            <span className="text-muted-foreground">({accepted.length})</span>
          </h2>
          {accepted.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Još niko nije prihvaćen.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {accepted.map((a) => (
                <PlayerRow key={a.id} app={a} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-display text-lg uppercase tracking-wider">
            Lista čekanja{" "}
            <span className="text-muted-foreground">({waitlist.length})</span>
          </h2>
          {waitlist.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nema igrača na listi čekanja.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {waitlist.map((a) => (
                <PlayerRow key={a.id} app={a} muted />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Tab "Prijave" (vidi samo organizator): sve prijave sa akcijama za upravljanje
// (odobri/odbij za pending, izbaci za ostale). Akcije nestaju ako je slot zatvoren.
function ApplicationsTab({
  apps,
  slotId,
  isClosed,
}: {
  apps: ApplicationWithPlayer[];
  slotId: string;
  isClosed: boolean;
}) {
  if (apps.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Još nema prijava.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4 font-display text-lg uppercase tracking-wider">
          Sve prijave{" "}
          <span className="text-muted-foreground">({apps.length})</span>
        </h2>
        <ul className="grid gap-2">
          {apps.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 p-3"
            >
              <Link
                href={`/igrac/${a.player_id}`}
                className="flex flex-1 items-center gap-3 hover:opacity-80"
              >
                <Avatar
                  src={a.player?.avatar_url}
                  name={a.player?.name}
                  size="md"
                />
                <span className="flex-1 truncate text-sm font-medium">
                  {a.player?.name || "Igrač"}
                </span>
                <span
                  className={cn(
                    "tabular text-xs font-medium",
                    (a.player?.reliability_score ?? 100) >= 85
                      ? "text-primary"
                      : (a.player?.reliability_score ?? 100) >= 60
                        ? "text-accent"
                        : "text-destructive"
                  )}
                >
                  {a.player?.reliability_score ?? 100}%
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <StatusPill status={a.status} />
                {!isClosed && (
                  <ApplicationActions
                    applicationId={a.id}
                    slotId={slotId}
                    status={a.status}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Obojeni labeli statusa prijave (prihvacen, lista cekanja, na cekanju, odbijen).
function StatusPill({ status }: { status: Application["status"] }) {
  const map: Record<
    Application["status"],
    { label: string; className: string }
  > = {
    accepted: {
      label: "Prihvaćen",
      className: "bg-primary/15 text-primary border-primary/30",
    },
    waitlist: {
      label: "Lista čekanja",
      className: "bg-accent/15 text-accent border-accent/30",
    },
    pending: {
      label: "Na čekanju",
      className: "bg-secondary text-muted-foreground border-border",
    },
    rejected: {
      label: "Odbijen",
      className: "bg-destructive/15 text-destructive border-destructive/30",
    },
  };
  const v = map[status];
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 font-display text-[10px] uppercase tracking-wider",
        v.className
      )}
    >
      {v.label}
    </span>
  );
}

function ChatTab({
  slotId,
  meId,
  initial,
  participants,
}: {
  slotId: string;
  meId: string;
  initial: SlotChatMessage[];
  participants: Record<string, string>;
}) {
  return (
    <SlotChat
      slotId={slotId}
      meId={meId}
      initial={initial}
      participants={participants}
    />
  );
}

// Jedan igrac u listi: avatar, ime i pouzdanost. Boja procenta ide po ocjeni
// (zeleno visoko, narandzasto srednje, crveno nisko). "muted" prigasi red za
// listu cekanja.
function PlayerRow({
  app,
  muted,
}: {
  app: ApplicationWithPlayer;
  muted?: boolean;
}) {
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
        <Avatar
          src={app.player?.avatar_url}
          name={app.player?.name}
          size="sm"
        />
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
