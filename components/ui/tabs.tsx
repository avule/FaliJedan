"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Tab = {
  key: string;
  label: string;
  count?: number;
};

type Props = {
  tabs: Tab[];
  /** Search-param key, defaults to "tab" */
  paramKey?: string;
  defaultKey?: string;
  basePath: string; // e.g. "/slot/abc-123"
  className?: string;
};

export function Tabs({
  tabs,
  paramKey = "tab",
  defaultKey,
  basePath,
  className,
}: Props) {
  const searchParams = useSearchParams();
  const activeKey =
    searchParams.get(paramKey) || defaultKey || tabs[0]?.key || "";

  return (
    <div
      className={cn(
        "scrollbar-thin flex gap-1 overflow-x-auto border-b border-border",
        className
      )}
    >
      {tabs.map((t) => {
        const active = activeKey === t.key;
        const params = new URLSearchParams(searchParams.toString());
        if (t.key === (defaultKey || tabs[0].key)) params.delete(paramKey);
        else params.set(paramKey, t.key);
        const href = params.toString()
          ? `${basePath}?${params.toString()}`
          : basePath;

        return (
          <Link
            key={t.key}
            href={href}
            scroll={false}
            className={cn(
              "relative whitespace-nowrap px-4 py-3 text-sm font-medium uppercase tracking-wider transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="font-display">{t.label}</span>
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular",
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {t.count}
              </span>
            )}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
