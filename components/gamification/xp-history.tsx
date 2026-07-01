// Lista zadnjih dodjela XP-a na profilu. Privatna: prikazuje se samo na
// sopstvenom profilu (RLS na xp_events dozvoljava citanje samo svojih).

import { xpLabel } from "@/lib/gamification";
import { formatRelative } from "@/lib/utils/format";
import type { XpHistoryRow } from "@/lib/data/gamification";

export function XpHistory({ rows }: { rows: XpHistoryRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Još nema XP događaja. Odigraj meč pa se vrati. 💪
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-center justify-between gap-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{xpLabel(row.type)}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {formatRelative(row.createdAt)}
            </p>
          </div>
          <span className="shrink-0 tabular text-sm font-semibold text-primary">
            +{row.amount} XP
          </span>
        </li>
      ))}
    </ul>
  );
}
