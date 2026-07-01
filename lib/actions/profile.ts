"use server";

// Izmjena profila ulogovanog igraca: ime, drzava, grad, sportovi i nivo.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ProfileSchema = z.object({
  name: z.string().min(2, "Ime treba imati bar 2 znaka.").max(60, "Ime je malo predugo - skrati ga na 60 znakova."),
  country_id: z.coerce.number().int().positive("Odaberi državu."),
  city_id: z.coerce.number().int().positive("Odaberi grad."),
  sports: z.array(z.string()).min(1, "Odaberi bar jedan sport koji igraš."),
  level: z.enum(["casual", "mid", "competitive"]),
});

export type ProfileState = { error?: string; ok?: boolean } | null;

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prijavi se da možeš urediti profil." };

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    country_id: formData.get("country_id"),
    city_id: formData.get("city_id"),
    sports: formData.getAll("sports").map(String),
    level: formData.get("level"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Provjeri profil pa pokušaj ponovo." };
  }

  const { error } = await supabase
    .from("players")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return { error: "Nismo uspjeli sačuvati profil. Pokušaj ponovo za trenutak." };

  revalidatePath("/profil");
  revalidatePath(`/igrac/${user.id}`);
  return { ok: true };
}
