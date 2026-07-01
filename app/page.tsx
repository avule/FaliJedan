// Pocetna (landing) za neulogovane. Redizajn: tamno + volt limeta, hero sa
// lebdecim karticama, ticker traka, reveal animacije i panel gejmifikacije.
// Ako je korisnik vec prijavljen, salje ga pravo na feed.

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/server";
import { getTopPlayers } from "@/lib/data/gamification";
import { Leaderboard } from "@/components/gamification/leaderboard";
import { CountUp } from "@/components/ui/count-up";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { RealtimeRefresh } from "@/components/slots/realtime-refresh";

const SPORTS = [
  { key: "football",   emoji: "⚽", label: "Fudbal" },
  { key: "basketball", emoji: "🏀", label: "Košarka" },
  { key: "padel",      emoji: "🥎", label: "Padel" },
  { key: "other",      emoji: "🏃", label: "Drugo" },
];

const STEPS = [
  {
    n: "01",
    title: "Objavi slot",
    text: "Imaš ekipu, fali igrač. Postavi vrijeme, lokaciju i nivo. 60 sekundi.",
  },
  {
    n: "02",
    title: "Igrači se prijavljuju",
    text: "Slobodni igrači u tvom gradu vide slot u feedu. Klik i prijava.",
  },
  {
    n: "03",
    title: "Igrate",
    text: "Potvrdi ko je došao, a FaliJedan čuva fer ekipu.",
  },
];

const FEATURES = [
  {
    title: "Popunjavanje uživo",
    text: "Slotovi se ažuriraju u realnom vremenu, vidiš slobodna mjesta bez osvježavanja stranice.",
  },
  {
    title: "Pouzdanost na prvom mjestu",
    text: "Svaki igrač ima ocjenu pouzdanosti. Ko se ne pojavi bez najave, gubi pouzdanost. Fer igrači ostaju u prednosti.",
  },
  {
    title: "Skupljaj XP i levele",
    text: "Svaki odigran meč nosi XP, diže ti nivo i otključava bedževe. Penji se na gradskoj rang listi.",
  },
  {
    title: "Fair play zajednica",
    text: "Organizator vidi pouzdanost igrača prije nego što ga prihvati. Ekipa na koju možeš da računaš.",
  },
];

const TICKER = [
  "Beograd", "Fudbal", "Sarajevo", "Padel", "Zagreb", "Košarka",
  "Novi Sad", "Odbojka", "Podgorica", "Tenis",
];

export const revalidate = 300;

export default async function LandingPage() {
  const supabase = await createClient();
  const [{ count: playerCount }, { count: openSlotCount }, topPlayers] =
    await Promise.all([
      supabase.from("players").select("id", { count: "exact", head: true }),
      supabase
        .from("slots")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "full"])
        .gte("scheduled_at", new Date().toISOString()),
      getTopPlayers(8),
    ]);

  return (
    <main className="relative z-10 overflow-x-hidden">
      <ScrollReveal />
      {/* xp leaderboard se mijenja na slot promjene (npr. potvrda pojava), pa
          slusamo slots i osvjezavamo */}
      <RealtimeRefresh />

      {/* HEADER */}
      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="font-display text-2xl uppercase tracking-wide">
          Fali<span className="text-primary">Jedan</span>
        </Link>
        <nav className="flex items-center gap-5 md:gap-8">
          <a href="#kako-radi" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
            Kako radi
          </a>
          <a href="#sportovi" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
            Sportovi
          </a>
          <a href="#rang" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
            Rang lista
          </a>
          <Link href="/login" className="text-sm font-semibold text-foreground">
            Prijava
          </Link>
          <Link
            href="/register"
            className="rounded-[10px] bg-primary px-5 py-2.5 font-display text-sm uppercase tracking-wider text-primary-foreground"
          >
            Registracija
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-[1320px] items-center gap-14 px-6 py-12 md:px-10 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))] animate-glow" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              Pickup sport · BiH · Srbija · Hrvatska · CG · Mk
            </span>
          </div>

          <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-tight md:text-8xl">
            Fali vam
            <br />
            <span className="text-primary text-glow">jedan</span> igrač?
          </h1>

          <p className="mt-7 max-w-md text-lg text-muted-foreground">
            Nađi ga za{" "}
            <span className="font-semibold text-foreground">2 minuta</span>.
            FaliJedan povezuje rekreativne sportiste u tvojoj blizini, kreiraj
            slot ili uskoči u meč i zaigraj.
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link
              href="/igraj"
              className="rounded-xl bg-primary px-7 py-4 font-display text-base uppercase tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Pronađi meč →
            </Link>
            <Link
              href="/novi-slot"
              className="rounded-xl border border-white/15 px-7 py-4 font-display text-base uppercase tracking-wide text-foreground transition-colors hover:border-primary/40"
            >
              Kreiraj slot
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3.5">
            <div className="flex -space-x-3">
              {["A", "M", "S", "T"].map((c) => (
                <span
                  key={c}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-secondary to-muted font-display text-sm text-primary"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular">
                <CountUp value={playerCount ?? 0} />
              </span>{" "}
              igrača
              {(openSlotCount ?? 0) > 0 && (
                <>
                  {" "}·{" "}
                  <span className="font-semibold text-foreground tabular">
                    <CountUp value={openSlotCount ?? 0} />
                  </span>{" "}
                  aktivnih slotova
                </>
              )}
            </p>
          </div>
        </div>

        {/* LIVE SLOT STACK (skriveno na mobilnom) */}
        <div className="relative mx-auto hidden w-full max-w-md lg:block">
          <div className="relative flex flex-col gap-3.5">
            <div className="flex flex-wrap justify-end gap-2">
              <LivePill pulse text="Slotovi se pune uživo" />
              <LivePill icon="🏀" text="Košarka večeras · 2 mjesta" />
            </div>

            <div className="animate-float">
              <PreviewSlotCard
                emoji="⚽"
                meta="Fudbal · Srednje"
                title="Mali fudbal · petak"
                location="Sportski centar"
                time="Danas · 20:00"
                filled={8}
                total={10}
                pct={80}
              />
            </div>
            <div className="ml-9">
              <PreviewSlotCard
                emoji="🥎"
                meta="Padel · Rekreativno"
                title="Padel parovi"
                location="Padel centar"
                time="Sutra · 18:00"
                filled={3}
                total={4}
                pct={75}
                urgent
              />
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="relative overflow-hidden border-y border-border/60 bg-white/[0.012] py-4">
        <div className="flex w-max animate-marquee gap-12 font-display text-lg uppercase tracking-wider text-muted-foreground/60">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-12" aria-hidden={copy === 1}>
              {TICKER.map((t, i) => (
                <span key={`${copy}-${i}`} className="flex items-center gap-12">
                  {t}
                  <span className="text-primary">●</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* SPORTOVI */}
      <section id="sportovi" className="mx-auto max-w-[1320px] px-6 py-24 md:px-10">
        <div data-reveal className="mb-12 text-center">
          <p className="font-display text-xs uppercase tracking-[0.4em] text-primary">
            Sportovi
          </p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-tight md:text-6xl">
            Šta igraš?
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SPORTS.map((s, i) => (
            <Link
              key={s.key}
              href={`/igraj?sport=${s.key}`}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="group relative overflow-hidden rounded-[18px] border border-border bg-gradient-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40"
            >
              <span className="pointer-events-none absolute -right-5 -top-7 text-[120px] leading-none opacity-[0.06]">
                {s.emoji}
              </span>
              <span className="block text-4xl">{s.emoji}</span>
              <span className="mt-5 block font-display text-2xl uppercase tracking-wide">
                {s.label}
              </span>
              <span className="mt-5 block font-display text-xs uppercase tracking-wider text-primary">
                Vidi slotove →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* TRI KORAKA */}
      <section id="kako-radi" className="mx-auto max-w-[1320px] px-6 py-20 md:px-10">
        <div data-reveal className="mb-12 text-center">
          <p className="font-display text-xs uppercase tracking-[0.4em] text-primary">
            Kako radi
          </p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-tight md:text-6xl">
            Tri koraka
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="rounded-[20px] border border-border bg-gradient-card p-8"
            >
              <span
                className="block font-display text-[88px] leading-[0.8] text-transparent"
                style={{ WebkitTextStroke: "1.5px hsl(var(--primary) / 0.28)" }}
              >
                {s.n}
              </span>
              <h3 className="mt-6 font-display text-2xl uppercase tracking-wide">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* GEJMIFIKACIJA / RANG */}
      <section id="rang" className="mx-auto max-w-[1320px] px-6 py-20 md:px-10">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[26px] border border-primary/20 bg-gradient-card p-8 md:p-14"
        >
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.16),transparent_65%)]" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.4em] text-primary">
                Gejmifikacija
              </p>
              <h2 className="mt-3 font-display text-4xl uppercase tracking-tight md:text-5xl">
                Svaki meč ti <span className="text-primary">diže level</span>
              </h2>
              <p className="mt-5 max-w-md text-muted-foreground">
                Pojavi se, igraj fer, popni se. Skupljaj XP, čuvaj niz i
                otključavaj bedževe. Tvoja pouzdanost je tvoj rejting,
                organizatori prvo biraju igrače na koje mogu da računaju.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {["🔥 Niz dolazaka", "🛡️ 100% pouzdan", "🏆 Gradska rang lista"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-border bg-secondary px-3.5 py-2 text-sm font-medium text-muted-foreground"
                    >
                      {chip}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <p className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-primary/70">
                Top igrači
              </p>
              <Leaderboard rows={topPlayers} />
            </div>
          </div>
        </div>
      </section>

      {/* ZAŠTO */}
      <section id="zasto" className="mx-auto max-w-[1320px] px-6 py-20 md:px-10">
        <div data-reveal className="mb-12 text-center">
          <p className="font-display text-xs uppercase tracking-[0.4em] text-accent">
            Zašto FaliJedan
          </p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-tight md:text-6xl">
            Pravljen za rekreativce
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="rounded-[18px] border border-border bg-gradient-card p-6"
            >
              <span className="font-display text-xs uppercase tracking-[0.3em] text-primary/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-display text-lg uppercase tracking-wide">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 data-reveal className="font-display text-5xl uppercase tracking-tight md:text-7xl">
          Vidimo se na <span className="text-primary text-glow">terenu</span>
        </h2>
        <p data-reveal className="mt-4 text-muted-foreground">
          Registracija je besplatna i traje manje od minute.
        </p>
        <div data-reveal className="mt-8">
          <Link
            href="/register"
            className="inline-block rounded-xl bg-primary px-10 py-4 font-display text-base uppercase tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Krenimo →
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-[1320px] border-t border-border/60 px-6 py-8 text-center text-sm text-muted-foreground md:px-10">
        FaliJedan © {new Date().getFullYear()} · Pickup sport platforma
      </footer>
    </main>
  );
}

/* Pomocne komponente */

function LivePill({
  icon,
  text,
  pulse,
}: {
  icon?: string;
  text: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs">
      {pulse ? (
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-glow" />
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      <span className="font-medium text-muted-foreground">{text}</span>
    </div>
  );
}

function PreviewSlotCard({
  emoji,
  meta,
  title,
  location,
  time,
  filled,
  total,
  pct,
  urgent,
}: {
  emoji: string;
  meta: string;
  title: string;
  location: string;
  time: string;
  filled: number;
  total: number;
  pct: number;
  urgent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border bg-gradient-card p-5 shadow-card",
        urgent ? "border-accent/20" : "border-border"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-xl">
            {emoji}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {meta}
            </p>
            <h3 className="font-display text-lg uppercase tracking-wide">
              {title}
            </h3>
          </div>
        </div>
        <span
          className={cn(
            "rounded-lg px-2.5 py-1.5 font-display text-xs uppercase tracking-wider",
            urgent
              ? "bg-accent/15 text-accent animate-pulse-accent"
              : "bg-primary/15 text-primary"
          )}
        >
          {urgent ? "Fali 1!" : `Fali ${total - filled}`}
        </span>
      </div>
      <div className="mb-2 flex justify-between text-sm text-muted-foreground">
        <span>{location}</span>
        <span>{time}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full",
            urgent ? "bg-gradient-accent" : "bg-gradient-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 text-right font-display text-base tabular">
        {filled}
        <span className="text-muted-foreground">/{total}</span>
      </div>
    </div>
  );
}
