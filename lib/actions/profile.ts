"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ProfileSchema = z.object({
  name: z.string().min(2).max(60),
  country_id: z.coerce.number().int().positive(),
  city_id: z.coerce.number().int().positive(),
  sports: z.array(z.string()).min(1, "Odaberi bar jedan sport"),
  level: z.enum(["casual", "mid", "competitive"]),
});

export type ProfileState = { error?: string; ok?: boolean } | null;

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nisi prijavljen" };

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    country_id: formData.get("country_id"),
    city_id: formData.get("city_id"),
    sports: formData.getAll("sports").map(String),
    level: formData.get("level"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Neispravni podaci" };
  }

  const { error } = await supabase
    .from("players")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profil");
  revalidatePath(`/igrac/${user.id}`);
  return { ok: true };
}
