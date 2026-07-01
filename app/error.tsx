"use client";

// Globalni ekran za greske koje React uhvati u aplikaciji.

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ispisi u konzolu. Kasnije se moze zakaciti na servis za logovanje.
    console.error(error);
  }, [error]);

  return (
    <main className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-xs uppercase tracking-[0.3em] text-destructive">
        Ups
      </p>
      <h1 className="mt-3 font-display text-5xl uppercase tracking-tight md:text-7xl">
        Nešto je zapelo
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Došlo je do neočekivane greške. Pokušaj ponovo - ako se nastavi, vrati
        se na početnu.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Pokušaj ponovo</Button>
        <Link
          href="/igraj"
          className={buttonVariants({ variant: "outline" })}
        >
          Nazad na slotove
        </Link>
      </div>
    </main>
  );
}
