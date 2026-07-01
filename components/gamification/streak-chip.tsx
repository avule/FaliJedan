// Mali cip sa trenutnim nizom dolazaka. Ne prikazuje se ako je niz 0.

import { cn } from "@/lib/utils/cn";

export function StreakChip({
  streak,
  className,
}: {
  streak: number;
  className?: string;
}) {
  if (streak <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent",
        className
      )}
    >
      🔥 {streak} u nizu
    </span>
  );
}
