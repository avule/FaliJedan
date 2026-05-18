"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Select } from "@/components/ui/select";
import { SPORTS_FOR_SLOT, LEVELS } from "@/lib/sports";
import { cn } from "@/lib/utils/cn";
import type { City } from "@/types/database";

type Props = { cities: City[]; defaultCityId?: number | null };

const WHEN_OPTIONS = [
  { key: "today", label: "Danas" },
  { key: "tomorrow", label: "Sutra" },
  { key: "week", label: "7 dana" },
];

export function FeedFilters({ cities, defaultCityId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sport = searchParams.get("sport") ?? "";
  const level = searchParams.get("level") ?? "";
  const when = searchParams.get("when") ?? "";
  const activeAdvanced = !!level || !!when;
  const [showAdvanced, setShowAdvanced] = useState(activeAdvanced);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearAll = () => {
    router.replace(pathname);
    setShowAdvanced(false);
  };

  const activeCount =
    (sport ? 1 : 0) + (level ? 1 : 0) + (when ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* TOP ROW: city + sport icons + advanced toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={searchParams.get("city") ?? defaultCityId?.toString() ?? ""}
          onChange={(e) => setParam("city", e.target.value)}
          className="h-9 w-auto min-w-[140px] text-sm"
        >
          <option value="">Svi gradovi</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <div className="h-6 w-px bg-border" />

        {/* Sport icon-only pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setParam("sport", "")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              !sport
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            Svi
          </button>
          {SPORTS_FOR_SLOT.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setParam("sport", sport === s.key ? "" : s.key)}
              title={s.label}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full text-base transition-all",
                sport === s.key
                  ? "bg-primary/15 ring-2 ring-primary shadow-glow scale-110"
                  : "hover:bg-secondary opacity-60 hover:opacity-100"
              )}
            >
              {s.emoji}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Očisti
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-secondary",
              showAdvanced && "border-primary/40 text-primary"
            )}
          >
            <span aria-hidden>⚙</span> Više filtera
            {activeAdvanced && (
              <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] tabular text-primary-foreground">
                {(level ? 1 : 0) + (when ? 1 : 0)}
              </span>
            )}
            <span
              className={cn(
                "transition-transform",
                showAdvanced && "rotate-180"
              )}
              aria-hidden
            >
              ▾
            </span>
          </button>
        </div>
      </div>

      {/* ADVANCED ROW (collapsible) */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-md border border-border bg-card/40 p-3 animate-fade-in">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
              Nivo
            </span>
            <Pill active={level === ""} onClick={() => setParam("level", "")}>
              Sve
            </Pill>
            {LEVELS.map((l) => (
              <Pill
                key={l.key}
                active={level === l.key}
                onClick={() =>
                  setParam("level", level === l.key ? "" : l.key)
                }
              >
                {l.label}
              </Pill>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
              Kada
            </span>
            <Pill active={when === ""} onClick={() => setParam("when", "")}>
              Bilo kad
            </Pill>
            {WHEN_OPTIONS.map((w) => (
              <Pill
                key={w.key}
                active={when === w.key}
                onClick={() => setParam("when", when === w.key ? "" : w.key)}
              >
                {w.label}
              </Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}
