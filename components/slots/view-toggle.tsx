"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type View = "list" | "mapa";

export function ViewToggle({ active }: { active: View }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(v: View) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "list") params.delete("view");
    else params.set("view", v);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-md border border-border bg-card/50 p-0.5">
      {(["list", "mapa"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => set(v)}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-display uppercase tracking-wider transition-colors",
            active === v
              ? "bg-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {v === "list" ? "📋 Lista" : "🗺 Mapa"}
        </button>
      ))}
    </div>
  );
}
