// Split kartica za auth (redizajn): lijevo brend panel sa volt sjajem i
// statistikom, desno tabovi Prijava/Registracija + forma (children). Tabovi su
// linkovi na /login i /register, pa rute i server akcije ostaju iste.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/utils/cn";

export async function AuthShell({
  active,
  children,
}: {
  active: "prijava" | "registracija";
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [{ count: playerCount }, { count: openSlotCount }] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }),
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "full"]),
  ]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-24 md:px-10">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-[1320px] px-6 py-6 md:px-10">
          <Link
            href="/"
            className="font-display text-2xl uppercase tracking-wide"
          >
            Fali<span className="text-primary">Jedan</span>
          </Link>
        </div>
      </header>

      <div className="grid w-full max-w-[940px] overflow-hidden rounded-[24px] border border-border bg-gradient-card shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)] md:grid-cols-2">
        {/* LIJEVO: brend panel */}
        <div
          className="relative hidden min-h-[480px] flex-col justify-between overflow-hidden p-12 md:flex"
          style={{
            background:
              "linear-gradient(150deg, hsl(155 40% 9%), hsl(160 30% 7%))",
          }}
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_65%)]" />
          <p className="relative font-display text-xs uppercase tracking-[0.4em] text-primary">
            Pickup sport
          </p>
          <div className="relative">
            <h2 className="font-display text-5xl uppercase leading-[0.9]">
              Uđi u
              <br />
              <span className="text-primary text-glow">igru</span>
            </h2>
            <p className="mt-4 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
              Nađi meč u svom gradu, popuni slot i zaigraj. Tvoj nivo, tvoj
              termin, tvoja ekipa.
            </p>
          </div>
          <div className="relative grid max-w-[260px] grid-cols-3 gap-5">
            <Stat value={<CountUp value={playerCount ?? 0} />} label="Igrača" />
            <Stat value={<CountUp value={openSlotCount ?? 0} />} label="Slotova" />
            <Stat value="100%" label="Fer" accent />
          </div>
        </div>

        {/* DESNO: tabovi + forma */}
        <div className="p-8 md:p-12">
          <div className="mb-7 flex rounded-[11px] border border-border bg-secondary/60 p-1">
            <TabLink href="/login" label="Prijava" active={active === "prijava"} />
            <TabLink
              href="/register"
              label="Registracija"
              active={active === "registracija"}
            />
          </div>

          {children}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Nastavkom prihvataš uslove korišćenja i fair play pravila.
          </p>
        </div>
      </div>
    </main>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "font-display text-2xl tabular leading-none",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex-1 rounded-lg py-2.5 text-center font-display text-sm uppercase tracking-wider transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}
