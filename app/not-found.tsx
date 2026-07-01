// Globalna stranica za nepostojecu rutu.

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
        404
      </p>
      <h1 className="mt-3 font-display text-6xl uppercase tracking-tight md:text-8xl">
        Teren ne postoji
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Stranica koju tražiš je premještena, otkazana ili nikad nije ni
        postojala.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/igraj" className={buttonVariants()}>
          Nazad na slotove
        </Link>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline" })}
        >
          Početna
        </Link>
      </div>
    </main>
  );
}
