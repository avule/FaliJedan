import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/server";

const SPORTS = [
  { key: "football",   emoji: "⚽", label: "Fudbal" },
  { key: "basketball", emoji: "🏀", label: "Košarka" },
  { key: "padel",      emoji: "🥎", label: "Padel" },
  { key: "other",      emoji: "🏃", label: "Drugo" },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-time popunjavanje",
    text: "Slotovi se ažuriraju u realnom vremenu - ne kasni za drugima.",
  },
  {
    icon: "🛡",
    title: "Pouzdanost na prvom mjestu",
    text: "Svaki igrač ima score. Ne pojavi se → score pada. 4× → automatski ban.",
  },
  {
    icon: "🏃",
    title: "Samo rekreativci sport",
    text: "Bez klubova, bez liga. Pickup mečevi za one koji vole da se kreću.",
  },
  {
    icon: "🤝",
    title: "Fair play zajednica",
    text: "Organizator vidi reliability prije nego što prihvati. Niko ne priprema haos.",
  },
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
    text: "Slobodni igrači u tvom gradu vide slot u feedu. Klik → prijava.",
  },
  {
    n: "03",
    title: "Igrate",
    text: "Potvrdi pojave nakon meča. Sistem prati pouzdanost - pravi se igraju.",
  },
];

export const revalidate = 300;

export default async function LandingPage() {
  const supabase = createClient();
  const [{ count: playerCount }, { count: openSlotCount }] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }),
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "full"])
      .gte("scheduled_at", new Date().toISOString()),
  ]);

  return (
    <main className="bg-pitch min-h-screen">
      {/* TOP NAV */}
      <header className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl uppercase tracking-wider"
        >
          Fali<span className="text-primary">Jedan</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#kako-radi"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Kako radi
          </a>
          <a
            href="#sportovi"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sportovi
          </a>
          <a
            href="#zasto"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Zašto FaliJedan
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Prijava
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Registracija
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="container relative py-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* LEFT: copy */}
          <div className="relative">
            <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Pickup sport · BiH · Srbija · Hrvatska · CG · Mk
            </div>

            <h1
              className="animate-slide-up font-display text-5xl uppercase leading-[0.95] tracking-tight md:text-7xl lg:text-[5.5rem]"
              style={{ animationDelay: "100ms" }}
            >
              Nedostaje vam
              <br />
              <span className="text-primary text-glow">jedan igrač?</span>
            </h1>

            <p
              className="mt-6 animate-slide-up text-balance text-lg text-muted-foreground md:text-xl"
              style={{ animationDelay: "200ms" }}
            >
              Nađi ga za <span className="font-semibold text-foreground">2 minute</span>.
              FaliJedan povezuje rekreativne sportiste u tvojoj blizini -
              kreiraj slot ili se priključi nekom meču i zaigraj.
            </p>

            <div
              className="mt-8 flex animate-slide-up flex-wrap items-center gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/igraj"
                className={cn(buttonVariants({ size: "lg" }), "px-8")}
              >
                Pronađi meč →
              </Link>
              <Link
                href="/novi-slot"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "px-8"
                )}
              >
                Kreiraj slot
              </Link>
            </div>

            <div
              className="mt-8 flex animate-fade-in items-center gap-3 text-xs text-muted-foreground"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex -space-x-2">
                {["A", "M", "S", "T"].map((c, i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-secondary to-muted text-[10px] font-bold"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <span>
                <span className="font-semibold text-foreground tabular">
                  {playerCount ?? 0}
                </span>{" "}
                igrača ·{" "}
                <span className="font-semibold text-foreground tabular">
                  {openSlotCount ?? 0}
                </span>{" "}
                aktivnih slotova
              </span>
            </div>
          </div>

          {/* RIGHT: visual preview - hidden on small screens, clean stack on lg+ */}
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            {/* Background glow */}
            <div className="pointer-events-none absolute -inset-12 bg-stadium-glow" />

            {/* Floating live badges - top */}
            <div
              className="relative mb-4 flex flex-wrap justify-end gap-2 animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <LivePill icon="🟢" text="+18 novih igrača danas" />
              <LivePill icon="🏀" text="Košarka večeras · 2 mjesta" />
            </div>

            {/* Card stack - main + tilted second */}
            <div className="relative">
              <div
                className="relative animate-slide-up"
                style={{ animationDelay: "300ms" }}
              >
                <PreviewSlotCard
                  emoji="⚽"
                  sport="Fudbal · Mid"
                  title="Mali fudbal - petak"
                  location="Sportski centar"
                  time="Danas u 20:00"
                  filled={8}
                  total={10}
                  pct={80}
                />
              </div>
              <div
                className="relative -mt-2 ml-12 rotate-[2deg] animate-slide-up"
                style={{ animationDelay: "500ms" }}
              >
                <PreviewSlotCard
                  emoji="🎾"
                  sport="Tenis · Casual"
                  title="Doubles meč"
                  location="Tenis klub"
                  time="Sutra u 18:00"
                  filled={3}
                  total={4}
                  pct={75}
                  urgent
                />
              </div>
            </div>

            {/* Floating live badge - bottom */}
            <div
              className="relative mt-4 flex justify-start animate-fade-in"
              style={{ animationDelay: "700ms" }}
            >
              <LivePill icon="🥎" text="Padel · 1 mjesto" />
            </div>
          </div>
        </div>
      </section>

      {/* SPORTS */}
      <section id="sportovi" className="container py-16">
        <div className="mb-10 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            Sportovi
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-wide md:text-5xl">
            Šta igraš?
          </h2>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
          {SPORTS.map((s) => (
            <div
              key={s.key}
              className="group relative overflow-hidden rounded-lg border border-border bg-gradient-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <span className="block text-5xl transition-transform duration-300 group-hover:scale-110">
                {s.emoji}
              </span>
              <span className="mt-3 block font-display text-lg uppercase tracking-wide">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="kako-radi" className="container py-20">
        <div className="mb-12 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            Kako radi
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-wide md:text-5xl">
            Tri koraka
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="group relative overflow-hidden rounded-lg border border-border bg-gradient-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-card-hover"
            >
              <span className="font-display text-7xl leading-none text-primary/20 transition-colors group-hover:text-primary/40">
                {s.n}
              </span>
              <h3 className="mt-3 font-display text-xl uppercase tracking-wide">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY (feature strip) */}
      <section id="zasto" className="container py-20">
        <div className="mb-12 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-accent">
            Zašto FaliJedan
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-wide md:text-5xl">
            Pravljen za rekreativce
          </h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-lg border border-border bg-gradient-card p-6 transition-all hover:border-primary/40"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-2xl">
                {f.icon}
              </div>
              <h3 className="font-display text-base uppercase tracking-wide">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-5xl uppercase tracking-tight md:text-6xl">
            Vidimo se na <span className="text-primary text-glow">terenu</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Registracija je besplatna. Bez kartica, bez gluposti.
          </p>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "mt-8 px-10")}
          >
            Krenimo →
          </Link>
        </div>
      </section>

      <footer className="container border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        FaliJedan © {new Date().getFullYear()} · Pickup sport platforma
      </footer>
    </main>
  );
}

/* ---------- helpers ---------- */

function LivePill({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs shadow-card backdrop-blur">
      <span className="text-sm">{icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}

function PreviewSlotCard({
  emoji,
  sport,
  title,
  location,
  time,
  filled,
  total,
  pct,
  urgent,
}: {
  emoji: string;
  sport: string;
  title: string;
  location: string;
  time: string;
  filled: number;
  total: number;
  pct: number;
  urgent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-gradient-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-xl">
            {emoji}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {sport}
            </p>
            <h3 className="font-display text-sm uppercase tracking-wide leading-tight">
              {title}
            </h3>
          </div>
        </div>
        <div
          className={cn(
            "rounded-md border px-2 py-0.5 font-display text-[10px] uppercase tracking-wider",
            urgent
              ? "border-accent/40 bg-accent/15 text-accent animate-pulse-accent"
              : "border-primary/30 bg-primary/15 text-primary"
          )}
        >
          {urgent ? "Fali 1!" : `Fali ${total - filled}`}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
        <span>📍 {location}</span>
        <span className="text-right tabular">{time}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-gradient-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-display text-sm tabular">
          {filled}<span className="text-muted-foreground">/{total}</span>
        </span>
      </div>
    </div>
  );
}
