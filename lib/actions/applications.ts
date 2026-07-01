"use server";

// Akcije igraca nad sopstvenom prijavom: prijavi se na slot i odjavi se. 
// Sve izmjene nad prijavama idu kroz security definer RPC funkcije u bazi
// (apply_to_slot, withdraw_from_slot), nikad direktnim upisom ili izmjenom.
// Razlog: anon kljuc je javan, pa bi igrac inace mogao sam sebe ubaciti kao
// "accepted" preko REST API. RPC drzi kapacitet, ban i redoslijed cekanja
// na jednom mjestu, u transakciji. Akcija samo prevede gresku i posalje mejl.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  notifyApplicationOutcome,
  notifyWaitlistPromoted,
} from "@/lib/email/notify";

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Prijavi se da bi mogao ući u termin.",
  banned: "Trenutno ne možeš slati prijave zbog ranijih izostanaka.",
  slot_not_found: "Ne mogu pronaći ovaj slot.",
  cannot_apply_own: "Ovo je tvoj slot - već si organizator ekipe.",
  slot_closed: "Prijave za ovaj termin su zatvorene.",
  already_applied: "Već si poslao prijavu za ovaj termin.",
  not_applied: "Nema aktivne prijave za ovaj termin.",
};

function translateError(msg: string | undefined): string {
  if (!msg) return "Nešto je zapelo. Pokušaj ponovo za trenutak.";
  // RPC baca kratke kodove (npr. "slot_closed"), ovdje ih pretvaramo u tekst.
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (msg.includes(key)) return ERROR_MESSAGES[key];
  }
  return "Nešto je zapelo s prijavom. Pokušaj ponovo za trenutak.";
}

export async function applyToSlotAction(slotId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("apply_to_slot", {
    p_slot_id: slotId,
  });
  if (error) return { error: translateError(error.message) };

  const status = data as "accepted" | "waitlist" | "pending";

  // Mejl saljemo bez cekanja da ne kocimo odgovor. Preskacemo za "pending"
  // (takmicarski slot ceka rucno odobrenje), tu igrac dobije mejl tek kad ga
  // organizator prihvati ili odbije.
  if (user && status !== "pending") {
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
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("withdraw_from_slot", {
    p_slot_id: slotId,
  });
  if (error) return { error: translateError(error.message) };

  const result = data as {
    late: boolean;
    promoted_player_id: string | null;
  } | null;

  // Neko sa liste cekanja je upao na oslobodjeno mjesto, javi mu.
  if (result?.promoted_player_id) {
    notifyWaitlistPromoted(result.promoted_player_id, slotId).catch(() => {});
  }

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/igraj");
  revalidatePath("/prijave");
  return {
    ok: true,
    late: result?.late ?? false,
  };
}
