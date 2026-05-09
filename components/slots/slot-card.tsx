import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { sportEmoji, sportLabel, levelLabel } from "@/lib/sports";
import { formatScheduledAt } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Slot } from "@/types/database";

type Props = {
  slot: Slot & { city?: { name: string } | null };
};

const SPORT_GLOW: Record<string, string> = {
  football:   "from-sport-football/20",
  basketball: "from-sport-basketball/20",
  tennis:     "from-sport-tennis/20",
  volleyball: "from-sport-volleyball/20",
  padel:      "from-sport-padel/20",
};

const SPORT_RING: Record<string, string> = {
  football:   "group-hover:shadow-[0_0_32px_-4px_#22f56b66]",
  basketball: "group-hover:shadow-[0_0_32px_-4px_#ff8a3c66]",
  tennis:     "group-hover:shadow-[0_0_32px_-4px_#fbe24a66]",
  volleyball: "group-hover:shadow-[0_0_32px_-4px_#3b82f666]",
  padel:      "group-hover:shadow-[0_0_32px_-4px_#ec489966]",
};

export function SlotCard({ slot }: Props) {
  const remaining = slot.total_spots - slot.filled_spots;
  const isFull = remaining <= 0 || slot.status === "full";
  const isUrgent = !isFull && remaining === 1;
  const fillPct = Math.min(100, (slot.filled_spots / slot.total_spots) * 100);

  return (
    <Link href={`/slot/${slot.id}`} className="group block">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-border bg-gradient-card p-4 shadow-card transition-all duration-300",
          "hover:-translate-y-0.5 hover:border-primary/40",
          SPORT_RING[slot.sport]
        )}
      >
        {/* Sport gradient overlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-60",
            SPORT_GLOW[slot.sport]
          )}
        />

        {/* Watermark sport icon */}
        <div className="pointer-events-none absolute -right-4 -top-4 text-[120px] leading-none opacity-[0.06] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
          {sportEmoji(slot.sport)}
        </div>

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
                {sportEmoji(slot.sport)}
              </div>
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide leading-tight">
                  {slot.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {sportLabel(slot.sport)} · {levelLabel(slot.level)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isFull ? (
                <Badge variant="secondary">Popunjen</Badge>
              ) : isUrgent ? (
                <Badge variant="urgent">Fali 1!</Badge>
              ) : (
                <Badge variant="success">Fali {remaining}</Badge>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span aria-hidden>📍</span> {slot.location_name}
            </span>
            <span className="flex items-center gap-1 tabular">
              <span aria-hidden>🕒</span> {formatScheduledAt(slot.scheduled_at)}
            </span>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Prijavljeno
              </span>
              <span className="font-display text-lg tabular text-foreground">
                {slot.filled_spots}<span className="text-muted-foreground">/{slot.total_spots}</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-primary transition-all duration-500 ease-out"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
