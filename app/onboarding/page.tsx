import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  const supabase = createClient();
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
        .select("country_id, city_id, sports, level")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  // Already completed → straight to feed
  if (player?.city_id && player?.sports?.length) {
    redirect("/igraj");
  }

  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <OnboardingWizard
        countries={countries ?? []}
        cities={cities ?? []}
      />
    </main>
  );
}
