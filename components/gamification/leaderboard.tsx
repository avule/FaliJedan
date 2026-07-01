// Rang lista: poredjani igraci po XP vrijednosti. Prva tri mjesta imaju istaknutu boju
// (1 mint, 2 svijetlo, 3 narandzasto). Klik vodi na javni profil.

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import type { LeaderboardRow } from "@/lib/data/gamification";

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Još nema rezultata. Odigraj meč i skupljaj XP.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {rows.map((r) => (
        <li key={r.playerId}>
          <Link
            href={`/igrac/${r.playerId}`}
            className="flex items-center gap-3 rounded-md border border-border bg-card/50 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-secondary"
          >
            <span
              className={cn(
                "w-6 text-center font-display text-lg tabular",
                r.rank === 1
                  ? "text-primary"
                  : r.rank === 2
                    ? "text-foreground"
                    : r.rank === 3
                      ? "text-accent"
                      : "text-muted-foreground"
              )}
            >
              {r.rank}
            </span>
            <Avatar src={r.avatarUrl} name={r.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.name}</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                LVL {r.level} · {r.title}
              </p>
            </div>
            <span className="font-display text-sm tabular text-primary">
              {r.xp.toLocaleString("sr-RS")} XP
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
