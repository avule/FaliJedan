import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-1 font-display text-xs uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary border border-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground border border-border",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/30",
        outline: "border border-border text-foreground",
        success:
          "bg-primary/15 text-primary border border-primary/30 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.1)]",
        warning:
          "bg-accent/15 text-accent border border-accent/30",
        urgent:
          "bg-gradient-accent text-accent-foreground border border-accent animate-pulse-accent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
