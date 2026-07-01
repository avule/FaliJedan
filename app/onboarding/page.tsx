// Onboarding nakon registracije. Ako je korisnik vec popunio grad i sportove,
// preusmjeri ga na feed. U suprotnom prikazi carobnjak u par koraka.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: countries }, { data: cities }, { data: player }] =
    await Promise.all([
      supabase.from("countries").select("id, name, code").order("name"),
      supabase.from("cities").select("id, country_id, name").order("name"),
      supabase
        .from("players")
        .select("name, country_id, city_id, sports, level")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  // Vec popunjeno, pravo na feed.
  if (player?.city_id && player?.sports?.length) {
    redirect("/igraj");
  }

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <OnboardingWizard
        countries={countries ?? []}
        cities={cities ?? []}
        userId={user.id}
        userName={player?.name || user.email || "Igrač"}
      />
    </main>
  );
}
