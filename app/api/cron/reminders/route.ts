import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { reminder24hEmail } from "@/lib/email/templates";

/**
 * Vercel cron - runs hourly (see vercel.json).
 * Sends 24h reminder to every accepted player for slots starting in 23-25h.
 *
 * Auth: requires CRON_SECRET env var. If unset, route is locked down (403).
 * Idempotency: applications.reminder_sent_at is set after each send;
 * the query filters those out so a duplicate cron run never re-sends.
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
    // Only fetch applications that haven't been reminded yet
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

      // Mark sent so a re-run doesn't double-send
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
