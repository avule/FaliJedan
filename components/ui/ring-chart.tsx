"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number; // 0..100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
};

export function RingChart({
  value,
  size = 160,
  strokeWidth = 12,
  label,
  sublabel,
}: Props) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 50);
    return () => clearTimeout(t);
  }, [value]);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (animated / 100) * c;

  // Color shifts with score
  const color =
    value >= 85
      ? "hsl(var(--primary))"
      : value >= 60
        ? "hsl(var(--accent))"
        : "hsl(var(--destructive))";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display text-4xl tabular leading-none"
          style={{ color }}
        >
          {Math.round(animated)}
          <span className="text-2xl">%</span>
        </span>
        {label && (
          <span className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
