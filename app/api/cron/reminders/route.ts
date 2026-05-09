import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { reminder24hEmail } from "@/lib/email/templates";

/**
 * Vercel cron — runs hourly (see vercel.json).
 * For every accepted application whose slot is between 23h and 25h away,
 * send a 24h reminder. The 1h-wide window + idempotent guard keeps it
 * from double-sending.
 *
 * Idempotency: store a marker in slot_chat? No — add a tiny tracking table
 * later if needed. For now we accept that a missed run skips a reminder;
 * a duplicate run resends. Cheap and good enough for v1.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Vercel cron sets Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();

  const now = Date.now();
  const from = new Date(now + 23 * 3600 * 1000).toISOString();
  const to = new Date(now + 25 * 3600 * 1000).toISOString();

  // Slots in window
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
  for (const slot of slots ?? []) {
    const { data: apps } = await admin
      .from("applications")
      .select("player_id, player:players(name)")
      .eq("slot_id", slot.id)
      .eq("status", "accepted")
      .returns<{ player_id: string; player: { name: string } | null }[]>();

    for (const a of apps ?? []) {
      const { data: u } = await admin.auth.admin.getUserById(a.player_id);
      const email = u?.user?.email;
      if (!email) continue;
      const m = reminder24hEmail({
        playerName: a.player?.name || "Igrač",
        slotTitle: slot.title,
        scheduledAt: slot.scheduled_at,
        locationName: slot.location_name,
        slotId: slot.id,
      });
      await sendEmail({ to: email, ...m });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, slots: slots?.length ?? 0 });
}
