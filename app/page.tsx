import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const SPORTS = [
  { key: "football",   emoji: "⚽", label: "Fudbal",   color: "from-sport-football/30" },
  { key: "basketball", emoji: "🏀", label: "Košarka",  color: "from-sport-basketball/30" },
  { key: "tennis",     emoji: "🎾", label: "Tenis",    color: "from-sport-tennis/30" },
  { key: "volleyball", emoji: "🏐", label: "Odbojka",  color: "from-sport-volleyball/30" },
  { key: "padel",      emoji: "🥎", label: "Padel",    color: "from-sport-padel/30" },
];

const STEPS = [
  {
    n: "01",
    title: "Objavi slot",
    text: "Imaš ekipu ali fali ti igrač? Postavi vrijeme, lokaciju i nivo. Sekunda posla.",
  },
  {
    n: "02",
    title: "Igrači se prijavljuju",
    text: "Slobodni igrači u tvom gradu vide slot u feedu i šalju prijavu. Realtime.",
  },
  {
    n: "03",
    title: "Igrate",
    text: "Potvrdi pojave nakon meča. Sistem prati pouzdanost — pravi se igraju, lažnjaci se filtriraju.",
  },
];

export default function LandingPage() {
  return (
    <main className="bg-pitch min-h-screen">
      {/* Top bar */}
      <header className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl uppercase tracking-wider"
        >
          Fali<span className="text-primary text-glow">Jedan</span>
        </Link>
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

      {/* Hero */}
      <section className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Pickup sport · BiH · Srbija · Hrvatska · CG · Mk
          </div>

          <h1
            className="animate-slide-up font-display text-6xl uppercase leading-[0.95] tracking-tight md:text-8xl lg:text-9xl"
            style={{ animationDelay: "100ms" }}
          >
            Fali ti
            <br />
            <span className="text-primary text-glow">jedan?</span>
          </h1>

          <p
            className="mx-auto mt-8 max-w-2xl animate-slide-up text-balance text-lg text-muted-foreground md:text-xl"
            style={{ animationDelay: "200ms" }}
          >
            Platforma gdje rekreativci pronalaze partnere za igru. Objavi slot,
            popuni ekipu, igraj. <span className="text-foreground">Bez klubova. Bez gluposti.</span>
          </p>

          <div
            className="mt-10 flex animate-slide-up flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "px-8")}
            >
              Registruj se besplatno →
            </Link>
            <Link
              href="/igraj"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "px-8"
              )}
            >
              Pogledaj slotove
            </Link>
          </div>

          {/* Floating sport balls */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <span
              className="absolute left-[8%] top-[20%] text-5xl opacity-20 animate-ball-bounce"
              style={{ animationDelay: "0s" }}
            >
              ⚽
            </span>
            <span
              className="absolute right-[10%] top-[35%] text-4xl opacity-20 animate-ball-bounce"
              style={{ animationDelay: "0.4s" }}
            >
              🏀
            </span>
            <span
              className="absolute left-[15%] bottom-[10%] text-3xl opacity-20 animate-ball-bounce"
              style={{ animationDelay: "0.8s" }}
            >
              🎾
            </span>
            <span
              className="absolute right-[18%] bottom-[20%] text-4xl opacity-20 animate-ball-bounce"
              style={{ animationDelay: "1.2s" }}
            >
              🏐
            </span>
          </div>
        </div>
      </section>

      {/* Sports grid */}
      <section className="container py-16">
        <div className="mb-10 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            Sportovi
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-wide md:text-5xl">
            Šta igraš?
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-5">
          {SPORTS.map((s, i) => (
            <div
              key={s.key}
              className={cn(
                "group relative overflow-hidden rounded-lg border border-border bg-gradient-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100",
                  s.color
                )}
              />
              <div className="relative">
                <span className="block text-5xl transition-transform duration-300 group-hover:scale-110">
                  {s.emoji}
                </span>
                <span className="mt-3 block font-display text-lg uppercase tracking-wide">
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <div className="mb-12 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            Kako radi
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-wide md:text-5xl">
            Tri koraka
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="group relative overflow-hidden rounded-lg border border-border bg-gradient-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-card-hover"
              style={{ animationDelay: `${i * 100}ms` }}
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

      {/* Reliability section */}
      <section className="container py-16">
        <div className="mx-auto max-w-4xl rounded-xl border border-border bg-gradient-card p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-accent">
                Sistem pouzdanosti
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase tracking-wide md:text-4xl">
                Igraju samo ozbiljni
              </h2>
              <p className="mt-4 text-muted-foreground">
                Svaki igrač ima score pouzdanosti. Ne pojavi se na meču —
                score pada. Tri puta u 30 dana → flag. Četiri puta → automatski
                ban od 14 dana.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Niko ne voli kad se ekipa raspadne pet minuta prije početka.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="font-display text-9xl text-primary text-glow">
                  100<span className="text-6xl">%</span>
                </div>
                <span className="mt-1 block text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Pouzdan
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-5xl uppercase tracking-tight md:text-6xl">
            Vidimo se na <span className="text-primary text-glow">terenu</span>
          </h2>
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
