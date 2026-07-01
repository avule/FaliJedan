"use server";

// Akcije koje izvodi organizator nad tudjim prijavama: izbacivanje igraca,
// odobravanje i odbijanje (za takmicarske slotove), potvrda ko se pojavio i
// otkazivanje slota. Sve izmjene idu kroz RPC u bazi, akcija samo prevede
// gresku i posalje odgovarajuci mejl.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  notifyKicked,
  notifyNoShowAndBan,
  notifySlotCancelled,
  notifyWaitlistPromoted,
} from "@/lib/email/notify";

const ERR: Record<string, string> = {
  not_authenticated: "Prijavi se da nastaviš.",
  not_organizer: "Samo organizator može voditi ovaj slot.",
  slot_not_found: "Ne mogu pronaći ovaj slot.",
  application_not_found: "Ne mogu pronaći ovu prijavu.",
  not_pending: "Ova prijava više nije na čekanju.",
  slot_closed: "Ovaj slot je već zatvoren.",
};
function tx(msg: string | undefined) {
  if (!msg) return "Nešto je zapelo. Pokušaj ponovo za trenutak.";
  for (const k of Object.keys(ERR)) if (msg.includes(k)) return ERR[k];
  return "Nešto je zapelo s ovom akcijom. Pokušaj ponovo za trenutak.";
}

export async function kickFromSlotAction(applicationId: string, slotId: string) {
  const supabase = await createClient();

  // Povuci player_id prije izbacivanja da imamo kome da posaljemo mejl.
  const { data: app } = await supabase
    .from("applications")
    .select("player_id")
    .eq("id", applicationId)
    .maybeSingle();

  const { data: promotedId, error } = await supabase.rpc("kick_from_slot", {
    p_application_id: applicationId,
  });
  if (error) return { error: tx(error.message) };

  if (app?.player_id) {
    notifyKicked(app.player_id, slotId).catch(() => {});
  }

  // Ako je izbacivanje prihvacenog oslobodilo mjesto, neko sa cekanja je usao.
  if (promotedId) {
    notifyWaitlistPromoted(promotedId as string, slotId).catch(() => {});
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
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_appearances", {
    p_slot_id: slotId,
    p_entries: entries,
  });
  if (error) return { error: tx(error.message) };

  // Javi onima koji se nisu pojavili (upozorenje, plus ban ako je zasluzen)
  const noShowIds = entries.filter((e) => !e.showed_up).map((e) => e.player_id);
  if (noShowIds.length > 0) {
    notifyNoShowAndBan(noShowIds, slotId).catch(() => {});
  }

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/moji-slotovi");
  return { ok: true };
}

export async function approveApplicationAction(
  applicationId: string,
  slotId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_application", {
    p_application_id: applicationId,
  });
  if (error) return { error: tx(error.message) };

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/moji-slotovi");
  revalidatePath("/igraj");
  return { ok: true, status: data as "accepted" | "waitlist" };
}

export async function rejectApplicationAction(
  applicationId: string,
  slotId: string
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_application", {
    p_application_id: applicationId,
  });
  if (error) return { error: tx(error.message) };

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/moji-slotovi");
  return { ok: true };
}

export async function cancelSlotAction(slotId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prijavi se da nastaviš." };

  // Status filter da se zavrsen ili vec otkazan slot ne moze ponovo otkazati
  // (i igraci dva puta dobiju mejl). select() potvrdjuje da je red stvarno
  // promijenjen, jer nula pogodjenih redova nije greska za Supabase.
  const { data: cancelled, error } = await supabase
    .from("slots")
    .update({ status: "cancelled" })
    .eq("id", slotId)
    .eq("organizer_id", user.id)
    .in("status", ["open", "full"])
    .select("id")
    .maybeSingle();

  if (error) return { error: "Nismo uspjeli otkazati slot. Pokušaj ponovo za trenutak." };
  if (!cancelled) return { error: "Ovaj slot je već zatvoren." };

  // Prihvaceni igraci moraju da saznaju, planirali su da dodju.
  notifySlotCancelled(slotId).catch(() => {});

  revalidatePath(`/slot/${slotId}`);
  revalidatePath("/moji-slotovi");
  revalidatePath("/igraj");
  return { ok: true };
}
