"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyKicked, notifyNoShowAndBan } from "@/lib/email/notify";

const ERR: Record<string, string> = {
  not_authenticated: "Nisi prijavljen",
  not_organizer: "Nisi organizator ovog slota",
  slot_not_found: "Slot ne postoji",
  application_not_found: "Prijava ne postoji",
};
function tx(msg: string | undefined) {
  if (!msg) return "Greška";
  for (const k of Object.keys(ERR)) if (msg.includes(k)) return ERR[k];
  return msg;
}

export async function kickFromSlotAction(applicationId: string, slotId: string) {
  const supabase = createClient();

  // Fetch player_id before delete so we can notify them.
  const { data: app } = await supabase
    .from("applications")
    .select("player_id")
    .eq("id", applicationId)
    .maybeSingle();

  const { error } = await supabase.rpc("kick_from_slot", {
    p_application_id: applicationId,
  });
  if (error) return { error: tx(error.message) };

  if (app?.player_id) {
    notifyKicked(app.player_id, slotId).catch(() => {});
  }

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/moji-slotovi");
  revalidatePath("/igraj");
  return { ok: true };
}

export async function confirmAppearancesAction(
  slotId: string,
  entries: { player_id: string; showed_up: boolean }[]
) {
  const supabase = createClient();
  const { error } = await supabase.rpc("confirm_appearances", {
    p_slot_id: slotId,
    p_entries: entries,
  });
  if (error) return { error: tx(error.message) };

  // Notify no-show players (warning + ban if applicable)
  const noShowIds = entries.filter((e) => !e.showed_up).map((e) => e.player_id);
  if (noShowIds.length > 0) {
    notifyNoShowAndBan(noShowIds, slotId).catch(() => {});
  }

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/moji-slotovi");
  return { ok: true };
}

export async function cancelSlotAction(slotId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nisi prijavljen" };

  const { error } = await supabase
    .from("slots")
    .update({ status: "cancelled" })
    .eq("id", slotId)
    .eq("organizer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/moji-slotovi");
  revalidatePath("/igraj");
  return { ok: true };
}
