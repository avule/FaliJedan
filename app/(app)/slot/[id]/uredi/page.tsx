// Server stranica za uredjivanje postojeceg slota.
// Prije prikaza provjerava da slot postoji i da je korisnik organizator.

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EditSlotForm } from "./edit-slot-form";
import type { Slot } from "@/types/database";

export default async function EditSlotPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: slot, error: slotErr } = await supabase
    .from("slots")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Slot>();

  if (slotErr) throw slotErr; // blip -> osvjeziva greska, ne trajni 404
  if (!slot) notFound();
  if (slot.organizer_id !== user.id) {
    redirect(`/slot/${slot.id}`);
  }
  if (slot.status === "cancelled" || slot.status === "done") {
    redirect(`/slot/${slot.id}`);
  }

  return (
    <main className="container max-w-2xl py-6">
      <div className="mb-4">
        <Link
          href={`/slot/${slot.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden>←</span> Nazad na slot
        </Link>
      </div>

      <div className="mb-6">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
          Organizator
        </p>
        <h1 className="mt-1 font-display text-4xl uppercase tracking-tight md:text-5xl">
          Uredi slot
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sport, grad i lokacija na mapi se ne mogu mijenjati - otkaži i napravi
          novi slot ako ti to treba.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <EditSlotForm slot={slot} />
        </CardContent>
      </Card>
    </main>
  );
}
