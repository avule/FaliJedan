"use server";

// Akcije za slotove koje pisu sam organizator: kreiranje novog termina i
// izmjena postojeceg. Izmjene provjeravaju vlasnistvo i status slota.

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
  title: z.string().min(3, "Naziv slota treba imati bar 3 znaka. Daj ekipi mrvu konteksta.").max(100, "Naziv je malo predug - skrati ga na 100 znakova."),
  description: z.string().max(500, "Opis je malo predug - skrati ga na 500 znakova.").optional().or(z.literal("")),
  location_name: z.string().min(2, "Upiši naziv lokacije, da ekipa zna gdje dolazi.").max(150, "Lokacija je malo preduga - skrati je na 150 znakova."),
  scheduled_at: z.string().min(1, "Odaberi datum i vrijeme termina."),
  total_spots: z.coerce.number().int("Broj mjesta treba biti cijeli broj.").min(1, "Dodaj bar jedno slobodno mjesto.").max(20, "Maksimalno možeš dodati 20 mjesta."),
  level: LevelEnum,
});

export type UpdateSlotState = { error?: string; ok?: boolean } | null;

const CreateSlotSchema = z
  .object({
    sport: SportEnum,
    custom_sport: z.string().max(50, "Naziv sporta je malo predug - skrati ga na 50 znakova.").optional().or(z.literal("")),
    title: z.string().min(3, "Naziv slota treba imati bar 3 znaka. Daj ekipi mrvu konteksta.").max(100, "Naziv je malo predug - skrati ga na 100 znakova."),
    description: z.string().max(500, "Opis je malo predug - skrati ga na 500 znakova.").optional().or(z.literal("")),
    location_name: z.string().min(2, "Upiši naziv lokacije, da ekipa zna gdje dolazi.").max(150, "Lokacija je malo preduga - skrati je na 150 znakova."),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    city_id: z.coerce.number().int().positive("Odaberi grad za ovaj termin."),
    scheduled_at: z.string().min(1, "Odaberi datum i vrijeme termina."),
    total_spots: z.coerce.number().int("Broj mjesta treba biti cijeli broj.").min(1, "Dodaj bar jedno slobodno mjesto.").max(20, "Maksimalno možeš dodati 20 mjesta."),
    level: LevelEnum,
  })
  .refine((d) => !(d.lat === 0 && d.lng === 0), {
    message: "Klikni na mapu i postavi pin za lokaciju.",
    path: ["lat"],
  })
  .refine(
    (d) =>
      d.sport !== "other" ||
      (d.custom_sport && d.custom_sport.trim().length >= 2),
    {
      message: "Upiši koji je sport u pitanju.",
      path: ["custom_sport"],
    }
  );

export type CreateSlotState = { error?: string; fieldErrors?: Record<string, string> } | null;

export async function createSlotAction(
  _prev: CreateSlotState,
  formData: FormData
): Promise<CreateSlotState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prijavi se da možeš objaviti slot." };

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
      error: parsed.error.errors[0]?.message ?? "Provjeri podatke pa pokušaj ponovo.",
    };
  }

  // Termin ne moze biti u proslosti.
  if (new Date(parsed.data.scheduled_at).getTime() < Date.now()) {
    return { error: "Izaberi vrijeme koje još nije prošlo." };
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

  if (error) return { error: "Nismo uspjeli objaviti slot. Pokušaj ponovo za trenutak." };

  revalidatePath("/igraj");
  redirect(`/slot/${slot.id}`);
}

export async function updateSlotAction(
  slotId: string,
  _prev: UpdateSlotState,
  formData: FormData
): Promise<UpdateSlotState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prijavi se da možeš uređivati slot." };

  const parsed = UpdateSlotSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    location_name: formData.get("location_name"),
    scheduled_at: formData.get("scheduled_at"),
    total_spots: formData.get("total_spots"),
    level: formData.get("level"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Provjeri podatke pa pokušaj ponovo." };
  }

  if (new Date(parsed.data.scheduled_at).getTime() < Date.now()) {
    return { error: "Izaberi vrijeme koje još nije prošlo." };
  }

  const { data: slot, error: fetchErr } = await supabase
    .from("slots")
    .select("organizer_id, filled_spots, status")
    .eq("id", slotId)
    .maybeSingle<{ organizer_id: string; filled_spots: number; status: string }>();

  if (fetchErr || !slot) return { error: "Ne mogu pronaći ovaj slot." };
  if (slot.organizer_id !== user.id) return { error: "Samo organizator može uređivati ovaj slot." };
  if (slot.status === "cancelled" || slot.status === "done") {
    return { error: "Ovaj slot je već zatvoren, pa ga više ne možeš mijenjati." };
  }
  // Ne dozvoli spustanje broja mjesta ispod vec prijavljenih igraca.
  if (parsed.data.total_spots < slot.filled_spots) {
    return {
      error: `Već je prijavljeno ${slot.filled_spots} igrača, pa broj mjesta ne može ići ispod toga.`,
    };
  }

  // Status prati odnos ukupnih i popunjenih mjesta.
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

  if (error) return { error: "Nismo uspjeli sačuvati izmjene. Pokušaj ponovo za trenutak." };

  revalidatePath("/igraj");
  revalidatePath("/moji-slotovi");
  revalidatePath(`/slot/${slotId}`);
  return { ok: true };
}
