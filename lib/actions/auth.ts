"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const RegisterSchema = z.object({
  name: z.string().min(2, "Ime mora imati bar 2 znaka").max(60),
  email: z.string().email("Neispravan email"),
  password: z.string().min(6, "Lozinka mora imati bar 6 znakova"),
});

const LoginSchema = z.object({
  email: z.string().email("Neispravan email"),
  password: z.string().min(1, "Unesi lozinku"),
});

export type AuthState = { error?: string } | null;

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
    return { error: parsed.error.errors[0]?.message ?? "Neispravni podaci" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo:
        process.env.NEXT_PUBLIC_SITE_URL?.concat("/onboarding") ?? undefined,
    },
  });

  if (error) {
    return { error: error.message };
  }

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
    return { error: parsed.error.errors[0]?.message ?? "Neispravni podaci" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Pogrešan email ili lozinka" };
  }

  const next = (formData.get("next") as string) || "/igraj";
  redirect(next);
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  // Clear onboarding cookie so next user starts fresh
  cookies().delete("fj_onboarded");
  redirect("/");
}
