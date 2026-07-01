// Stranica za pravljenje novog slota. Server dio samo povuce drzave i gradove
// (uredjene zeljenim redoslijedom), a sve ostalo radi forma na klijentu.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateSlotForm } from "./create-slot-form";

export default async function NewSlotPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: cities }, { data: countriesRaw }, { data: me }] =
    await Promise.all([
      supabase.from("cities").select("id, country_id, name").order("name"),
      supabase.from("countries").select("id, name, code").order("name"),
      supabase
        .from("players")
        .select("city_id")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  // Zeljeni redoslijed drzava. Sve sto nije navedeno ide na kraj, po abecedi.
  const COUNTRY_ORDER = ["RS", "BA", "HR", "ME", "MK"];
  const rank = (code: string) => {
    const i = COUNTRY_ORDER.indexOf(code);
    return i === -1 ? COUNTRY_ORDER.length : i;
  };
  const countries = [...(countriesRaw ?? [])].sort(
    (a, b) => rank(a.code) - rank(b.code)
  );

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-8 md:px-10">
      <Link
        href="/igraj"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden>←</span> Nazad na feed
      </Link>
      <p className="mt-4 font-display text-xs uppercase tracking-[0.4em] text-primary">
        Organizator
      </p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-[0.9] tracking-tight md:text-6xl">
        Novi slot
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Postavi meč za 60 sekundi, fali ti samo par detalja.
      </p>

      <div className="mt-8">
        <CreateSlotForm
          cities={cities ?? []}
          countries={countries}
          defaultCityId={me?.city_id ?? null}
        />
      </div>
    </main>
  );
}
