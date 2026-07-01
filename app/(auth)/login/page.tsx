// Login stranica je server omotac oko klijentske forme.
// Forma obavlja samu prijavu kroz server akciju.

import { LoginForm } from "./login-form";
import { AuthShell } from "@/components/auth/auth-shell";

const URL_ERRORS: Record<string, string> = {
  missing_code: "Link za potvrdu je neispravan.",
  confirm_failed: "Link je istekao ili je već iskorišten. Pošalji ponovo.",
};

export default async function LoginPage(
  props: {
    searchParams: Promise<{ next?: string; error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const initialError = searchParams.error
    ? URL_ERRORS[searchParams.error] ?? null
    : null;
  return (
    <AuthShell active="prijava">
      <LoginForm
        next={searchParams.next}
        initialError={initialError ?? undefined}
      />
    </AuthShell>
  );
}
