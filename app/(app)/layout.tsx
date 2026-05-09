import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <AppHeader name={player?.name || user.email || "Igrač"} />
      {children}
    </>
  );
}
