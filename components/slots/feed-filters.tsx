"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/select";
import { SPORTS, LEVELS } from "@/lib/sports";
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

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const sport = searchParams.get("sport") ?? "";
  const level = searchParams.get("level") ?? "";
  const when = searchParams.get("when") ?? "";

  return (
    <div className="space-y-3">
      {/* City: select stays — too many cities for pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Grad
        </span>
        <Select
          value={searchParams.get("city") ?? defaultCityId?.toString() ?? ""}
          onChange={(e) => setParam("city", e.target.value)}
          className="w-auto min-w-[160px]"
        >
          <option value="">Svi gradovi</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Sport pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
          Sport
        </span>
        <Pill active={sport === ""} onClick={() => setParam("sport", "")}>
          Sve
        </Pill>
        {SPORTS.map((s) => (
          <Pill
            key={s.key}
            active={sport === s.key}
            onClick={() => setParam("sport", sport === s.key ? "" : s.key)}
          >
            <span className="text-base">{s.emoji}</span>
            {s.label}
          </Pill>
        ))}
      </div>

      {/* Level + When pills, side by side */}
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
            Nivo
          </span>
          <Pill active={level === ""} onClick={() => setParam("level", "")}>
            Sve
          </Pill>
          {LEVELS.map((l) => (
            <Pill
              key={l.key}
              active={level === l.key}
              onClick={() => setParam("level", level === l.key ? "" : l.key)}
            >
              {l.label}
            </Pill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary/15 text-primary shadow-glow"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}
