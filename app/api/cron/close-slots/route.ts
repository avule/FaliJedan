// Cron ruta koja automatski zatvara stare slotove.
// Ne dira pouzdanost igraca, samo status slota.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Vercel cron, vrti se svakog sata (vidi vercel.json).
 * Sam zatvara slotove kojima je termin presao prije vise od 4h a nisu zavrseni.
 *
 * Zasto 4h: organizatoru ostavljamo prozor poslije pocetka da potvrdi ko se
 * pojavio (to vec samo postavlja status na 'done' i racuna pouzdanost). Samo
 * slotove koji su i poslije tog roka jos 'open'/'full' ovdje silom zatvaramo.
 * Pojave se ne biljeze, pa niciju pouzdanost ne diramo.
 *
 * Zastita: trazi CRON_SECRET. Ako nije postavljen, ruta je zakljucana (403).
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
  // Granica: sve sto je pocelo prije vise od 4 sata.
  const cutoff = new Date(Date.now() - 4 * 3600 * 1000).toISOString();

  const { data, error } = await admin
    .from("slots")
    .update({ status: "done" })
    .in("status", ["open", "full"])
    .lt("scheduled_at", cutoff)
    .select("id");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, closed: data?.length ?? 0 });
}
