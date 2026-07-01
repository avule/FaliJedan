"use server";

/**
 * Pomocne funkcije tipa "posalji obavjestenje X".
 * Svaka sama povuce sto joj treba iz baze (service klijent), sklopi
 * template i posalje preko Resend bez cekanja.
 *
 * Sve gutaju greske. Mejl nikad ne smije srusiti korisnikovu radnju.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "./resend";
import {
  applicationAcceptedEmail,
  applicationWaitlistedEmail,
  banEmail,
  kickedEmail,
  noShowWarningEmail,
  slotCancelledEmail,
  slotFullEmail,
} from "./templates";

async function getEmailFor(playerId: string): Promise<string | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("players")
    .select("id")
    .eq("id", playerId)
    .maybeSingle();
  if (!data) return null;
  // Email zivi u auth.users, a tu se dolazi samo service role kljucem.
  const { data: u } = await admin.auth.admin.getUserById(playerId);
  return u?.user?.email ?? null;
}

export async function notifyApplicationOutcome(args: {
  playerId: string;
  slotId: string;
  status: "accepted" | "waitlist";
}) {
  try {
    const admin = createServiceClient();
    const [{ data: slot }, { data: player }, email] = await Promise.all([
      admin
        .from("slots")
        .select("id, title, scheduled_at, location_name, organizer_id, filled_spots, total_spots")
        .eq("id", args.slotId)
        .maybeSingle(),
      admin
        .from("players")
        .select("name")
        .eq("id", args.playerId)
        .maybeSingle(),
      getEmailFor(args.playerId),
    ]);
    if (!slot || !player || !email) return;

    if (args.status === "accepted") {
      const m = applicationAcceptedEmail({
        playerName: player.name || "Igrač",
        slotTitle: slot.title,
        scheduledAt: slot.scheduled_at,
        locationName: slot.location_name,
        slotId: slot.id,
      });
      await sendEmail({ to: email, ...m });
    } else {
      const m = applicationWaitlistedEmail({
        playerName: player.name || "Igrač",
        slotTitle: slot.title,
        slotId: slot.id,
      });
      await sendEmail({ to: email, ...m });
    }

    // Ako je ova prijava upravo popunila slot, javi i organizatoru.
    if (
      args.status === "accepted" &&
      slot.filled_spots >= slot.total_spots
    ) {
      const orgEmail = await getEmailFor(slot.organizer_id);
      const { data: organizer } = await admin
        .from("players")
        .select("name")
        .eq("id", slot.organizer_id)
        .maybeSingle();
      if (orgEmail && organizer) {
        const m = slotFullEmail({
          organizerName: organizer.name || "Organizator",
          slotTitle: slot.title,
          slotId: slot.id,
        });
        await sendEmail({ to: orgEmail, ...m });
      }
    }
  } catch (e) {
    console.error("[notify.application]", e);
  }
}

/**
 * Igrac sa liste cekanja je promovisan u prihvacenog (neko ispred se odjavio).
 * Salje samo "uletio si" mejl. Bez javljanja da je slot pun, jer broj
 * popunjenih mjesta se nije promijenio (jedan izasao, jedan usao).
 */
export async function notifyWaitlistPromoted(playerId: string, slotId: string) {
  try {
    const admin = createServiceClient();
    const [{ data: slot }, { data: player }, email] = await Promise.all([
      admin
        .from("slots")
        .select("id, title, scheduled_at, location_name")
        .eq("id", slotId)
        .maybeSingle(),
      admin.from("players").select("name").eq("id", playerId).maybeSingle(),
      getEmailFor(playerId),
    ]);
    if (!slot || !player || !email) return;

    const m = applicationAcceptedEmail({
      playerName: player.name || "Igrač",
      slotTitle: slot.title,
      scheduledAt: slot.scheduled_at,
      locationName: slot.location_name,
      slotId: slot.id,
    });
    await sendEmail({ to: email, ...m });
  } catch (e) {
    console.error("[notify.promoted]", e);
  }
}

export async function notifyKicked(playerId: string, slotId: string) {
  try {
    const admin = createServiceClient();
    const [{ data: slot }, { data: player }, email] = await Promise.all([
      admin.from("slots").select("title").eq("id", slotId).maybeSingle(),
      admin.from("players").select("name").eq("id", playerId).maybeSingle(),
      getEmailFor(playerId),
    ]);
    if (!slot || !player || !email) return;
    const m = kickedEmail({
      playerName: player.name || "Igrač",
      slotTitle: slot.title,
    });
    await sendEmail({ to: email, ...m });
  } catch (e) {
    console.error("[notify.kicked]", e);
  }
}

/**
 * Organizator je otkazao slot. Javi svakom prihvacenom igracu da niko ne
 * dodje na utakmicu koje nema. Zovi tek POSLE potvrde da je otkaz upisan.
 */
export async function notifySlotCancelled(slotId: string) {
  try {
    const admin = createServiceClient();
    const [{ data: slot }, { data: apps }] = await Promise.all([
      admin
        .from("slots")
        .select("title, scheduled_at")
        .eq("id", slotId)
        .maybeSingle(),
      admin
        .from("applications")
        .select("player_id")
        .eq("slot_id", slotId)
        .eq("status", "accepted"),
    ]);
    if (!slot || !apps || apps.length === 0) return;

    for (const a of apps) {
      const [{ data: player }, email] = await Promise.all([
        admin
          .from("players")
          .select("name")
          .eq("id", a.player_id)
          .maybeSingle(),
        getEmailFor(a.player_id),
      ]);
      if (!email) continue;

      const m = slotCancelledEmail({
        playerName: player?.name || "Igrač",
        slotTitle: slot.title,
        scheduledAt: slot.scheduled_at,
      });
      await sendEmail({ to: email, ...m });
    }
  } catch (e) {
    console.error("[notify.cancelled]", e);
  }
}

export async function notifyNoShowAndBan(playerIds: string[], slotId: string) {
  try {
    const admin = createServiceClient();
    const { data: slot } = await admin
      .from("slots")
      .select("title")
      .eq("id", slotId)
      .maybeSingle();
    if (!slot) return;

    for (const pid of playerIds) {
      const [{ data: player }, email] = await Promise.all([
        admin
          .from("players")
          .select("name, no_show_count_30d, reliability_score, ban_until")
          .eq("id", pid)
          .maybeSingle(),
        getEmailFor(pid),
      ]);
      if (!player || !email) continue;

      const warn = noShowWarningEmail({
        playerName: player.name || "Igrač",
        slotTitle: slot.title,
        noShowCount: player.no_show_count_30d,
        reliabilityScore: player.reliability_score,
      });
      await sendEmail({ to: email, ...warn });

      if (player.ban_until && new Date(player.ban_until).getTime() > Date.now()) {
        const ban = banEmail({
          playerName: player.name || "Igrač",
          endsAt: player.ban_until,
        });
        await sendEmail({ to: email, ...ban });
      }
    }
  } catch (e) {
    console.error("[notify.noshow]", e);
  }
}
