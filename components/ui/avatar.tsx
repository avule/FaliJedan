import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
};

const SIZE_CLASS: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-3xl",
};

type Props = {
  src?: string | null;
  name?: string | null;
  size?: Size;
  className?: string;
  /** When true, applies a primary gradient + glow (used for "me" header). */
  highlight?: boolean;
};

export function Avatar({
  src,
  name,
  size = "md",
  className,
  highlight,
}: Props) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const px = SIZE_PX[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold uppercase",
        SIZE_CLASS[size],
        highlight
          ? "bg-gradient-primary text-primary-foreground shadow-glow"
          : "bg-gradient-to-br from-secondary to-muted text-foreground",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name || ""}
          width={px}
          height={px}
          sizes={`${px}px`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  );
}
