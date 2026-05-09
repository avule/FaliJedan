import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: player }, { data: countries }, { data: cities }] =
    await Promise.all([
      supabase
        .from("players")
        .select("name, country_id, city_id, sports, level")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("countries").select("id, name, code").order("name"),
      supabase.from("cities").select("id, country_id, name").order("name"),
    ]);

  return (
    <main className="container max-w-2xl py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moj profil</h1>
        <Link
          href={`/igrac/${user.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Vidi javni profil →
        </Link>
      </div>

      <ProfileForm
        initial={{
          name: player?.name ?? "",
          country_id: player?.country_id ?? null,
          city_id: player?.city_id ?? null,
          sports: (player?.sports ?? []) as string[],
          level: (player?.level ?? "casual") as "casual" | "mid" | "competitive",
        }}
        countries={countries ?? []}
        cities={cities ?? []}
      />
    </main>
  );
}
