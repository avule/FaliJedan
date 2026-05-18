"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SportEnum = z.enum([
  "football",
  "basketball",
  "padel",
  "other",
]);
const LevelEnum = z.enum(["casual", "mid", "competitive"]);

const UpdateSlotSchema = z.object({
  title: z.string().min(3, "Naslov mora imati bar 3 znaka").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  location_name: z.string().min(2, "Unesi lokaciju").max(150),
  scheduled_at: z.string().min(1, "Odaberi datum i vrijeme"),
  total_spots: z.coerce.number().int().min(1).max(20),
  level: LevelEnum,
});

export type UpdateSlotState = { error?: string; ok?: boolean } | null;

const CreateSlotSchema = z
  .object({
    sport: SportEnum,
    custom_sport: z.string().max(50).optional().or(z.literal("")),
    title: z.string().min(3, "Naslov mora imati bar 3 znaka").max(100),
    description: z.string().max(500).optional().or(z.literal("")),
    location_name: z.string().min(2, "Unesi lokaciju").max(150),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    city_id: z.coerce.number().int().positive(),
    scheduled_at: z.string().min(1, "Odaberi datum i vrijeme"),
    total_spots: z.coerce.number().int().min(1).max(20),
    level: LevelEnum,
  })
  .refine((d) => !(d.lat === 0 && d.lng === 0), {
    message: "Postavi pin na mapi",
    path: ["lat"],
  })
  .refine(
    (d) =>
      d.sport !== "other" ||
      (d.custom_sport && d.custom_sport.trim().length >= 2),
    {
      message: "Unesi naziv sporta",
      path: ["custom_sport"],
    }
  );

export type CreateSlotState = { error?: string; fieldErrors?: Record<string, string> } | null;

export async function createSlotAction(
  _prev: CreateSlotState,
  formData: FormData
): Promise<CreateSlotState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nisi prijavljen" };

  const parsed = CreateSlotSchema.safeParse({
    sport: formData.get("sport"),
    custom_sport: formData.get("custom_sport") ?? "",
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    location_name: formData.get("location_name"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    city_id: formData.get("city_id"),
    scheduled_at: formData.get("scheduled_at"),
    total_spots: formData.get("total_spots"),
    level: formData.get("level"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Neispravni podaci",
    };
  }

  // Future-only
  if (new Date(parsed.data.scheduled_at).getTime() < Date.now()) {
    return { error: "Termin mora biti u budućnosti" };
  }

  const { data: slot, error } = await supabase
    .from("slots")
    .insert({
      organizer_id: user.id,
      sport: parsed.data.sport,
      custom_sport:
        parsed.data.sport === "other"
          ? parsed.data.custom_sport!.trim()
          : null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      location_name: parsed.data.location_name,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      city_id: parsed.data.city_id,
      scheduled_at: parsed.data.scheduled_at,
      total_spots: parsed.data.total_spots,
      level: parsed.data.level,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/igraj");
  redirect(`/slot/${slot.id}`);
}

export async function updateSlotAction(
  slotId: string,
  _prev: UpdateSlotState,
  formData: FormData
): Promise<UpdateSlotState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nisi prijavljen" };

  const parsed = UpdateSlotSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    location_name: formData.get("location_name"),
    scheduled_at: formData.get("scheduled_at"),
    total_spots: formData.get("total_spots"),
    level: formData.get("level"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Neispravni podaci" };
  }

  if (new Date(parsed.data.scheduled_at).getTime() < Date.now()) {
    return { error: "Termin mora biti u budućnosti" };
  }

  const { data: slot, error: fetchErr } = await supabase
    .from("slots")
    .select("organizer_id, filled_spots, status")
    .eq("id", slotId)
    .maybeSingle<{ organizer_id: string; filled_spots: number; status: string }>();

  if (fetchErr || !slot) return { error: "Slot ne postoji" };
  if (slot.organizer_id !== user.id) return { error: "Nisi organizator ovog slota" };
  if (slot.status === "cancelled" || slot.status === "done") {
    return { error: "Slot je zatvoren - ne može se mijenjati" };
  }
  if (parsed.data.total_spots < slot.filled_spots) {
    return {
      error: `Već je prijavljeno ${slot.filled_spots} igrača - ne možeš spustiti ispod toga`,
    };
  }

  // status follows total_spots vs filled_spots
  const newStatus =
    parsed.data.total_spots <= slot.filled_spots ? "full" : "open";

  const { error } = await supabase
    .from("slots")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      location_name: parsed.data.location_name,
      scheduled_at: parsed.data.scheduled_at,
      total_spots: parsed.data.total_spots,
      level: parsed.data.level,
      status: newStatus,
    })
    .eq("id", slotId)
    .eq("organizer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/igraj");
  revalidatePath("/moji-slotovi");
  revalidatePath(`/slot/${slotId}`);
  return { ok: true };
}

