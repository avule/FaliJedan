"use client";

// Klijentska forma za prijavu.
// Server akcija provjerava email, lozinku i eventualno nepotvrdjen nalog.

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type AuthState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Prijavljivanje..." : "Prijavi se"}
    </Button>
  );
}

export function LoginForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, formAction] = useActionState<AuthState, FormData>(
    loginAction,
    null
  );

  const error = state?.error ?? initialError;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Lozinka</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <div className="space-y-2 text-sm">
          <p className="text-destructive">{error}</p>
          {state?.needsConfirm && (
            <Link
              href={`/register/provjeri-email${email ? `?email=${encodeURIComponent(email)}` : ""}`}
              className="inline-block text-primary hover:underline"
            >
              Pošalji link za potvrdu ponovo →
            </Link>
          )}
        </div>
      )}
      <SubmitButton />
    </form>
  );
}
