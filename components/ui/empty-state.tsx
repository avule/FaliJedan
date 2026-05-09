import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  emoji?: string;
  title: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
};

export function EmptyState({
  emoji = "🏟",
  title,
  description,
  ctaHref,
  ctaLabel,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-dashed border-border bg-gradient-card px-6 py-16 text-center",
        className
      )}
    >
      <div className="bg-stripes absolute inset-0 opacity-50" />
      <div className="relative">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-4xl animate-ball-bounce">
          {emoji}
        </div>
        <h3 className="font-display text-xl uppercase tracking-wider">{title}</h3>
        {description && (
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {ctaHref && ctaLabel && (
          <Link href={ctaHref} className={cn(buttonVariants(), "mt-6")}>
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
