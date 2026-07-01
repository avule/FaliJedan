"use server";

// Zavrsetak onboardinga: prvi put upisuje grad, sportove i nivo igraca,
// pa ga salje na feed. Bez ovih podataka proxy stalno vraca na onboarding.

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const OnboardingSchema = z.object({
  country_id: z.coerce.number().int().positive("Odaberi državu da znamo gdje igraš."),
  city_id: z.coerce.number().int().positive("Odaberi grad da ti pokažemo prave termine."),
  sports: z.array(z.string()).min(1, "Odaberi bar jedan sport koji igraš."),
  level: z.enum(["casual", "mid", "competitive"]),
});

export type OnboardingState = { error?: string } | null;

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Prijavi se da završimo tvoj profil." };

  const sports = formData.getAll("sports").map(String);

  const parsed = OnboardingSchema.safeParse({
    country_id: formData.get("country_id"),
    city_id: formData.get("city_id"),
    sports,
    level: formData.get("level"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Još nešto fali u profilu. Provjeri korake pa pokušaj ponovo." };
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

  if (error) return { error: "Nismo uspjeli završiti profil. Pokušaj ponovo za trenutak." };

  revalidatePath("/", "layout");
  redirect("/igraj");
}
