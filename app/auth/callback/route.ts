// Supabase callback poslije potvrde mejla ili magic link prijave.
// Kod iz URL a mijenja za sesiju i salje korisnika dalje.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Odredisna ruta za potvrdu mejla / magic link iz Supabase.
 *
 * Mejl sadrzi link na <sajt>/auth/callback?code=XYZ&next=/onboarding.
 * Ovdje kod razmijenimo za sesiju (server klijent postavi kolacice) pa
 * preusmjerimo na trazeno odrediste (za nove naloge to je /onboarding).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/onboarding";

  if (!code) {
    // Nema code parametra, znaci link je neispravan ili je korisnik dosao direktno.
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=confirm_failed`, url)
    );
  }

  return NextResponse.redirect(new URL(next, url));
}
