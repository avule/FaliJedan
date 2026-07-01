// Zasticeni layout za ulogovani dio aplikacije.
// Provjerava sesiju, ucitava igraca i prikazuje gornju navigaciju.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { levelFromXp, levelTitle } from "@/lib/gamification";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Podaci za header i bedz nivoa u navigaciji.
  const { data: player } = await supabase
    .from("players")
    .select("name, avatar_url, xp")
    .eq("id", user.id)
    .maybeSingle<{ name: string; avatar_url: string | null; xp: number }>();

  const level = levelFromXp(player?.xp ?? 0).level;

  return (
    <>
      <AppHeader
        name={player?.name || user.email || "Igrač"}
        avatarUrl={player?.avatar_url ?? null}
        level={level}
        title={levelTitle(level)}
      />
      {children}
    </>
  );
}
