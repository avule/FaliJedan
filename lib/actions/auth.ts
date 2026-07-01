"use server";

// Akcije vezane za nalog: registracija, prijava, odjava i ponovno slanje
// linka za potvrdu mejla. Sve validacije idu kroz zod seme ispod.

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const RegisterSchema = z.object({
  name: z.string().min(2, "Upiši ime od bar 2 znaka. Da znamo ko ulazi u ekipu.").max(60, "Ime je malo predugo - skrati ga na 60 znakova."),
  email: z.string().email("Email ne izgleda ispravno. Provjeri da li fali @ ili domena."),
  password: z.string().min(6, "Lozinka treba imati bar 6 znakova."),
});

const LoginSchema = z.object({
  email: z.string().email("Email ne izgleda ispravno."),
  password: z.string().min(1, "Upiši lozinku da te pustimo u igru."),
});

export type AuthState = { error?: string; needsConfirm?: boolean } | null;
export type ResendState = { error?: string; ok?: boolean } | null;

function callbackUrl(next: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return undefined;
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

function authErrorMessage(message: string) {
  if (/sending confirmation email/i.test(message)) {
    return "Nalog je spreman, ali email za potvrdu trenutno ne može biti poslan. Provjeri Supabase Auth email/SMTP podešavanja pa pokušaj ponovo.";
  }
  return message;
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Provjeri podatke pa pokušaj ponovo." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: callbackUrl("/onboarding"),
    },
  });

  if (error) {
    return { error: authErrorMessage(error.message) };
  }

  // Kad je potvrda mejla ukljucena, signUp vrati korisnika ali BEZ sesije.
  // Salji ga na ekran "provjeri mejl".
  if (!data.session) {
    redirect(`/register/provjeri-email?email=${encodeURIComponent(parsed.data.email)}`);
  }

  // Potvrda iskljucena, imamo sesiju, pravo na onboarding.
  redirect("/onboarding");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Provjeri podatke pa pokušaj ponovo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase vrati "Email not confirmed" kad je potvrda ukljucena a korisnik
    // jos nije kliknuo link. Ovo razdvajamo od pogresne lozinke da mu mozemo
    // ponuditi ponovno slanje linka.
    if (/email not confirmed/i.test(error.message)) {
      return {
        error: "Email nije potvrđen - provjeri inbox ili pošalji link ponovo.",
        needsConfirm: true,
      };
    }
    return { error: "Pogrešan email ili lozinka" };
  }

  // Dozvoli samo interne putanje. "https://zlo.com" ili "//zlo.com" bi ovo
  // pretvorili u open redirect (napadac te odvede na tudji sajt poslije logina).
  const raw = formData.get("next");
  const next =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")
      ? raw
      : "/igraj";
  redirect(next);
}

export async function resendConfirmationAction(
  _prev: ResendState,
  formData: FormData
): Promise<ResendState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Upiši ispravan email da možemo poslati novi link." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: callbackUrl("/onboarding") },
  });

  if (error) return { error: authErrorMessage(error.message) };
  return { ok: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Obrisi onboarding kolacic da sljedeci korisnik krene iz pocetka.
  (await cookies()).delete("fj_onboarded");
  redirect("/");
}
