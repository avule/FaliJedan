"use server";

// Cuva URL avatara na profilu igraca (sama slika se uploaduje na Storage
// sa klijenta, ovdje samo upisemo putanju u bazu).

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveAvatarUrlAction(url: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prijavi se da možeš mijenjati avatar." };

  const { error } = await supabase
    .from("players")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) return { error: "Nismo uspjeli sačuvati avatar. Pokušaj ponovo za trenutak." };

  revalidatePath("/profil");
  revalidatePath(`/igrac/${user.id}`);
  revalidatePath("/", "layout");
  return { ok: true };
}
