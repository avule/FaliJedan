"use client";

// Klijentska forma za registraciju novog igraca.
// Server akcija pravi nalog i po potrebi salje korisnika na potvrdu mejla.

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type AuthState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Kreiranje naloga..." : "Registruj se"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    registerAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Ime i prezime</Label>
        <Input id="name" name="name" required minLength={2} maxLength={60} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Lozinka</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <p className="text-xs text-muted-foreground">Minimum 6 znakova</p>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
