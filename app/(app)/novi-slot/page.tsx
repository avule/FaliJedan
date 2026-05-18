import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateSlotForm } from "./create-slot-form";

export default async function NewSlotPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cities } = await supabase
    .from("cities")
    .select("id, country_id, name")
    .order("name");

  const { data: me } = await supabase
    .from("players")
    .select("city_id")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="container py-6">
      <h1 className="mb-1 text-2xl font-bold">Novi slot</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Objavi kada i gdje igraš - igrači će se prijaviti.
      </p>
      <CreateSlotForm cities={cities ?? []} defaultCityId={me?.city_id ?? null} />
    </main>
  );
}
