// Polica bedzeva. Otkljucani su puni, zakljucani prigaseni (opacity 45%).
// Spisak dolazi iz lib/badges.ts spojen sa otkljucanim kljucevima iz baze.

import { cn } from "@/lib/utils/cn";

type BadgeView = {
  key: string;
  name: string;
  desc: string;
  icon: string;
  earned: boolean;
};

export function BadgeShelf({ badges }: { badges: BadgeView[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {badges.map((b) => (
        <div
          key={b.key}
          className={cn(
            "flex items-center gap-3 rounded-md border p-3 transition-opacity",
            b.earned
              ? "border-primary/30 bg-card/50"
              : "border-border bg-card/30 opacity-45"
          )}
        >
          <span className="text-2xl" aria-hidden>
            {b.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm uppercase tracking-wide">
              {b.name}
            </p>
            <p className="text-[11px] leading-tight text-muted-foreground">
              {b.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
