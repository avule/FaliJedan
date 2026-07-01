// Register stranica prikazuje formu za novi nalog.
// Nakon registracije korisnik ide na potvrdu mejla ili onboarding.

import { RegisterForm } from "./register-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell active="registracija">
      <RegisterForm />
    </AuthShell>
  );
}
