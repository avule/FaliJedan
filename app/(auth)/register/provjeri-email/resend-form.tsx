"use client";

// Forma za ponovno slanje linka za potvrdu mejla.

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resendConfirmationAction,
  type ResendState,
} from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Šaljem..." : "Pošalji link ponovo"}
    </Button>
  );
}

export function ResendConfirmForm({ email }: { email: string }) {
  const [value, setValue] = useState(email);
  const [state, action] = useActionState<ResendState, FormData>(
    resendConfirmationAction,
    null
  );

  return (
    <form action={action} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-primary">
          Link poslat - provjeri inbox za par minuta.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
