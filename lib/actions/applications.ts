"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyApplicationOutcome } from "@/lib/email/notify";

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Nisi prijavljen",
  banned: "Banovan si - ne možeš se prijavljivati",
  slot_not_found: "Slot ne postoji",
  cannot_apply_own: "Ne možeš se prijaviti na svoj slot",
  slot_closed: "Slot je zatvoren",
  already_applied: "Već si prijavljen na ovaj slot",
  not_applied: "Nisi prijavljen na ovaj slot",
};

function translateError(msg: string | undefined): string {
  if (!msg) return "Greška";
  // Postgres raises come as "<code>" or "ERROR: <code>"
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (msg.includes(key)) return ERROR_MESSAGES[key];
  }
  return msg;
}

export async function applyToSlotAction(slotId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("apply_to_slot", {
    p_slot_id: slotId,
  });
  if (error) return { error: translateError(error.message) };

  const status = data as "accepted" | "waitlist";

  // Fire-and-forget email - don't await blocking.
  if (user) {
    notifyApplicationOutcome({
      playerId: user.id,
      slotId,
      status,
    }).catch(() => {});
  }

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/igraj");
  revalidatePath("/prijave");
  return { ok: true, status };
}

export async function withdrawFromSlotAction(slotId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("withdraw_from_slot", {
    p_slot_id: slotId,
  });
  if (error) return { error: translateError(error.message) };

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/igraj");
  revalidatePath("/prijave");
  return {
    ok: true,
    late: (data as { late: boolean })?.late ?? false,
  };
}
