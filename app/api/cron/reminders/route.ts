// Cron ruta za podsjetnike igracima dan prije termina.
// Koristi service klijent jer radi bez ulogovanog korisnika.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { reminder24hEmail } from "@/lib/email/templates";

/**
 * Vercel cron, vrti se svakog sata (vidi vercel.json).
 * Salje podsjetnik 24h unaprijed svakom prihvacenom igracu za slotove koji
 * pocinju za 23 do 25 sati.
 *
 * Zastita: trazi CRON_SECRET. Ako nije postavljen, ruta je zakljucana (403).
 * Bez duplih mejlova: poslije svakog slanja upisemo applications.reminder_sent_at,
 * a upit izbacuje takve, pa ponovljeni cron nikad ne salje dva puta.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: "cron_secret_not_configured" },
      { status: 403 }
    );
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();

  // Prozor od 23 do 25h hvata sve termine "za otprilike sutra u ovo doba",
  // a posto cron ide svakog sata, svaki slot upadne tacno jednom.
  const now = Date.now();
  const from = new Date(now + 23 * 3600 * 1000).toISOString();
  const to = new Date(now + 25 * 3600 * 1000).toISOString();

  const { data: slots, error } = await admin
    .from("slots")
    .select("id, title, scheduled_at, location_name, status")
    .in("status", ["open", "full"])
    .gte("scheduled_at", from)
    .lte("scheduled_at", to);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const slot of slots ?? []) {
    // Uzmi samo prijave kojima podsjetnik jos nije poslat.
    const { data: apps } = await admin
      .from("applications")
      .select("id, player_id, reminder_sent_at, player:players(name)")
      .eq("slot_id", slot.id)
      .eq("status", "accepted")
      .is("reminder_sent_at", null)
      .returns<
        {
          id: string;
          player_id: string;
          reminder_sent_at: string | null;
          player: { name: string } | null;
        }[]
      >();

    for (const a of apps ?? []) {
      const { data: u } = await admin.auth.admin.getUserById(a.player_id);
      const email = u?.user?.email;
      if (!email) {
        skipped++;
        continue;
      }

      const m = reminder24hEmail({
        playerName: a.player?.name || "Igrač",
        slotTitle: slot.title,
        scheduledAt: slot.scheduled_at,
        locationName: slot.location_name,
        slotId: slot.id,
      });
      await sendEmail({ to: email, ...m });

      // Upisi vrijeme slanja da ponovni cron ne posalje isti podsjetnik opet.
      await admin
        .from("applications")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", a.id);

      sent++;
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    slots: slots?.length ?? 0,
  });
}
