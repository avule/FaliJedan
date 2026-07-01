"use client";

// Traka napretka do sljedeceg nivoa. Puni se od 0 pri montiranju (animacija).

import { useEffect, useState } from "react";

export function XpBar({
  intoLevel,
  toNext,
  pct,
}: {
  intoLevel: number;
  toNext: number;
  pct: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 50);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>XP do sljedećeg nivoa</span>
        <span className="tabular text-foreground">
          {intoLevel} / {toNext}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-primary transition-[width] duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
