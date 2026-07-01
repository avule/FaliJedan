// Prazno stanje feeda kad nema slotova za izabrane filtere.
// Nudi reset filtera ili kreiranje prvog slota.

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { sportEmoji, sportLabel } from "@/lib/sports";

type Props = {
  cityName?: string | null;
  // Aktivni sport odredjuje glavnu ikonicu.
  sport?: string | null;
};

export function EmptyFeed({ cityName, sport }: Props) {
  const sportName = sport ? sportLabel(sport).toLowerCase() : null;

  return (
    <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-card p-10 md:p-16">
      {/* Meki sjaj u pozadini */}
      <div className="pointer-events-none absolute inset-0 bg-stadium-glow opacity-80" />

      {/* Lebdece ikonice sportova */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="absolute left-[8%] top-[18%] text-7xl opacity-[0.06] animate-ball-bounce"
          style={{ animationDelay: "0s" }}
          aria-hidden
        >
          ⚽
        </span>
        <span
          className="absolute right-[10%] top-[28%] text-6xl opacity-[0.06] animate-ball-bounce"
          style={{ animationDelay: "0.4s" }}
          aria-hidden
        >
          🏀
        </span>
        <span
          className="absolute left-[14%] bottom-[14%] text-5xl opacity-[0.05] animate-ball-bounce"
          style={{ animationDelay: "0.8s" }}
          aria-hidden
        >
          🎾
        </span>
        <span
          className="absolute right-[12%] bottom-[20%] text-6xl opacity-[0.05] animate-ball-bounce"
          style={{ animationDelay: "1.2s" }}
          aria-hidden
        >
          🏐
        </span>
      </div>

      {/* Dijagonalne linije kao na dresu */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, hsl(var(--primary)) 0, hsl(var(--primary)) 1px, transparent 1px, transparent 14px)",
        }}
      />

      <div className="relative mx-auto max-w-md text-center">
        {sport && (
          <div
            key={sport}
            className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary/80 text-5xl animate-ball-bounce backdrop-blur"
          >
            {sportEmoji(sport)}
          </div>
        )}

        <h2 className="font-display text-3xl uppercase tracking-tight md:text-4xl">
          Teren je <span className="text-primary text-glow">prazan</span>
        </h2>

        <p className="mt-3 text-sm text-muted-foreground">
          {sportName && cityName
            ? `Trenutno nema otvorenih ${sportName} slotova u gradu ${cityName}.`
            : sportName
              ? `Trenutno nema otvorenih ${sportName} slotova.`
              : cityName
                ? `Trenutno nema otvorenih slotova u gradu ${cityName} po ovim filterima.`
                : "Trenutno nema otvorenih slotova po ovim filterima."}{" "}
          Objavi prvi termin, možda baš neko čeka da se ekipa skupi.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/novi-slot" className={cn(buttonVariants(), "px-6")}>
            + Objavi prvi slot
          </Link>
          <Link
            href="/igraj"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Resetuj filtere
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          💡 Savjet: probaj drugi grad ili šire vrijeme (7 dana)
        </p>
      </div>
    </div>
  );
}
