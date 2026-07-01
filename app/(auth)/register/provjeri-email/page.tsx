// Stranica koja korisniku kaze da provjeri inbox poslije registracije.

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ResendConfirmForm } from "./resend-form";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="container max-w-md py-12">
      <div className="mb-6 text-center">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
          Skoro gotovo
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
          Provjeri email
        </h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <p>
            Poslali smo ti link na{" "}
            <span className="font-medium text-foreground">
              {email || "tvoj email"}
            </span>
            . Klikni link da potvrdiš nalog i otvoriš FaliJedan.
          </p>
          <p className="text-muted-foreground">
            Nije stigao? Provjeri spam folder. Ili pošalji ponovo:
          </p>

          <ResendConfirmForm email={email ?? ""} />

          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            Već si potvrdio?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Prijavi se
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
