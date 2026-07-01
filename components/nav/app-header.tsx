"use client";

// Glavna navigacija u ulogovanom dijelu aplikacije.
// Oznacava aktivnu rutu i prikazuje profil, nivo i odjavu.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/igraj", label: "Igraj" },
  { href: "/novi-slot", label: "Novi slot" },
  { href: "/moji-slotovi", label: "Moji slotovi" },
  { href: "/prijave", label: "Prijave" },
];

export function AppHeader({
  name,
  avatarUrl,
  level,
  title,
}: {
  name: string;
  avatarUrl?: string | null;
  level?: number;
  title?: string;
}) {
  const pathname = usePathname();
  // Aktivna stavka ostaje upaljena i na podstranicama.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/igraj"
          className="font-display text-2xl uppercase tracking-wider transition-colors hover:text-primary"
        >
          Fali<span className="text-primary">Jedan</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive(item.href)}
              className={cn(
                "nav-underline rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/profil"
            className="hidden items-center gap-2.5 text-sm transition-opacity hover:opacity-80 sm:flex"
          >
            <Avatar src={avatarUrl} name={name} size="sm" highlight={!avatarUrl} />
            <span className="hidden leading-tight md:block">
              <span className="block font-medium text-foreground">{name}</span>
              {level !== undefined && title && (
                <span className="block font-display text-[11px] uppercase tracking-wider text-primary">
                  LVL {level} · {title}
                </span>
              )}
            </span>
          </Link>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit">
              Odjava
            </Button>
          </form>
        </div>
      </div>

      {/* Navigacija na telefonu */}
      <nav className="container scrollbar-thin flex items-center gap-1 overflow-x-auto pb-2 md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-active={isActive(item.href)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors",
              isActive(item.href)
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/profil"
          data-active={isActive("/profil")}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors",
            isActive("/profil")
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-secondary"
          )}
        >
          Profil
        </Link>
      </nav>
    </header>
  );
}
