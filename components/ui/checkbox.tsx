"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> & {
  size?: "sm" | "md" | "lg";
};

export const Checkbox = React.forwardRef<HTMLInputElement, Props>(
  ({ className, size = "md", checked, ...props }, ref) => {
    const dim =
      size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          dim,
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 cursor-pointer appearance-none opacity-0"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-md border border-border bg-card transition-all duration-200",
            "peer-hover:border-primary/60",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
            "peer-checked:border-primary peer-checked:bg-gradient-primary peer-checked:shadow-glow",
            "peer-disabled:opacity-50"
          )}
        />
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "pointer-events-none relative scale-50 text-primary-foreground opacity-0 transition-all duration-200",
            "peer-checked:scale-100 peer-checked:opacity-100",
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"
          )}
        >
          <polyline points="5 13 10 18 19 7" />
        </svg>
      </span>
    );
  }
);
Checkbox.displayName = "Checkbox";
