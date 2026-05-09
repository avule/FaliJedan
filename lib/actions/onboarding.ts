"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const OnboardingSchema = z.object({
  country_id: z.coerce.number().int().positive(),
  city_id: z.coerce.number().int().positive(),
  sports: z.array(z.string()).min(1, "Odaberi bar jedan sport"),
  level: z.enum(["casual", "mid", "competitive"]),
});

export type OnboardingState = { error?: string } | null;

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nisi prijavljen" };

  const sports = formData.getAll("sports").map(String);

  const parsed = OnboardingSchema.safeParse({
    country_id: formData.get("country_id"),
    city_id: formData.get("city_id"),
    sports,
    level: formData.get("level"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Neispravni podaci" };
  }

  const { error } = await supabase
    .from("players")
    .update({
      country_id: parsed.data.country_id,
      city_id: parsed.data.city_id,
      sports: parsed.data.sports,
      level: parsed.data.level,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/igraj");
}
