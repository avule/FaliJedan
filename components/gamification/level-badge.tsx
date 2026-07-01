// Pljosnati bedz sa nivoom i nazivom, npr. "LVL 7 · STREET BALLER".
// Cist prikaz, koristi postojecu primarnu boju teme.

import { cn } from "@/lib/utils/cn";

export function LevelBadge({
  level,
  title,
  className,
}: {
  level: number;
  title: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/15 px-2.5 py-1 font-display text-xs uppercase tracking-wider text-primary",
        className
      )}
    >
      <span className="opacity-70">LVL {level}</span>
      <span aria-hidden>·</span>
      <span>{title}</span>
    </span>
  );
}
