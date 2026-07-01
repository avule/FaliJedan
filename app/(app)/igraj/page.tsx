// Glavni feed otvorenih slotova. Server komponenta: cita filtere iz URL
// (grad, sport, nivo, vrijeme), povuce slotove iz baze i prikaze ih kao listu
// ili na mapi. Filter grada se podrazumijeva na domaci grad igraca.

import { createClient } from "@/lib/supabase/server";
import { SlotCard } from "@/components/slots/slot-card";
import { FeedFilters } from "@/components/slots/feed-filters";
import { SlotsMapWrapper } from "@/components/map/slots-map-wrapper";
import { RealtimeRefresh } from "@/components/slots/realtime-refresh";
import { FeedAutoRefresh } from "@/components/slots/feed-auto-refresh";
import { ViewToggle } from "@/components/slots/view-toggle";
import { EmptyFeed } from "@/components/slots/empty-feed";
import { buttonVariants } from "@/components/ui/button";
import { CITY_CENTERS } from "@/lib/cities";
import Link from "next/link";
import { addDays, endOfDay, startOfDay } from "date-fns";
import type { Slot } from "@/types/database";

type SearchParams = {
  city?: string;
  sport?: string;
  level?: string;
  when?: "today" | "tomorrow" | "week";
  view?: "mapa" | "list";
};

export default async function FeedPage(
  props: {
    searchParams: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Podrazumijevani grad je domaci grad igraca.
  const { data: me } = await supabase
    .from("players")
    .select("city_id, city:cities(name)")
    .eq("id", user!.id)
    .maybeSingle<{ city_id: number | null; city: { name: string } | null }>();

  const cityId = searchParams.city
    ? Number(searchParams.city)
    : me?.city_id ?? null;

  // Iz imena grada nadji koordinate centra, da mapa ima gdje da se centrira.
  let mapFallback: [number, number] | undefined;
  if (cityId) {
    const { data: city } = await supabase
      .from("cities")
      .select("name")
      .eq("id", cityId)
      .maybeSingle();
    if (city?.name && CITY_CENTERS[city.name]) {
      mapFallback = CITY_CENTERS[city.name];
    }
  }

  // Vremenski raspon prema izabranom filteru (danas, sutra, ova sedmica).
  const now = new Date();
  let from = now.toISOString();
  let to: string | null = null;
  if (searchParams.when === "today") {
    to = endOfDay(now).toISOString();
  } else if (searchParams.when === "tomorrow") {
    from = startOfDay(addDays(now, 1)).toISOString();
    to = endOfDay(addDays(now, 1)).toISOString();
  } else if (searchParams.when === "week") {
    to = endOfDay(addDays(now, 7)).toISOString();
  }

  let query = supabase
    .from("slots")
    .select("*")
    .in("status", ["open", "full"])
    .gte("scheduled_at", from)
    .order("scheduled_at", { ascending: true })
    .limit(60);

  if (cityId) query = query.eq("city_id", cityId);
  if (searchParams.sport) query = query.eq("sport", searchParams.sport);
  if (searchParams.level) query = query.eq("level", searchParams.level);
  if (to) query = query.lte("scheduled_at", to);

  const [{ data: slots, error }, { data: cities }] = await Promise.all([
    query,
    supabase.from("cities").select("id, country_id, name").order("name"),
  ]);

  if (error) {
    return (
      <main className="container py-8">
        <p className="text-destructive">
          Nismo uspjeli učitati slotove. Osvježi stranicu ili pokušaj ponovo za trenutak.
        </p>
      </main>
    );
  }

  const slotsList = (slots ?? []) as Slot[];

  // Jednim upitom povuci prihvacene igrace za sve slotove, za stack avatara
  // na karticama. Bolje nego upit po kartici.
  const slotIds = slotsList.map((s) => s.id);
  const acceptedBySlot = new Map<
    string,
    { id: string; name: string | null; avatar_url: string | null }[]
  >();
  if (slotIds.length > 0) {
    const { data: previewApps } = await supabase
      .from("applications")
      .select("slot_id, player:players(id, name, avatar_url)")
      .in("slot_id", slotIds)
      .eq("status", "accepted")
      .returns<
        {
          slot_id: string;
          player: { id: string; name: string | null; avatar_url: string | null } | null;
        }[]
      >();
    for (const a of previewApps ?? []) {
      if (!a.player) continue;
      const list = acceptedBySlot.get(a.slot_id) ?? [];
      list.push(a.player);
      acceptedBySlot.set(a.slot_id, list);
    }
  }

  return (
    <main className="mx-auto max-w-[1320px] px-6 py-8 md:px-10">
      <RealtimeRefresh />
      {/* najblizi slot je prvi (sortirano rastuce), osvjezi kad mu prodje vrijeme */}
      <FeedAutoRefresh nextExpiry={slotsList[0]?.scheduled_at ?? null} />
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.4em] text-primary">
            Feed
          </p>
          <h1 className="mt-2 font-display text-5xl uppercase leading-[0.9] tracking-tight md:text-6xl">
            Slotovi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="tabular font-semibold text-foreground">
              {slotsList.length}
            </span>{" "}
            otvorenih u tvojoj blizini
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle active={searchParams.view === "mapa" ? "mapa" : "list"} />
          <Link href="/novi-slot" className={buttonVariants()}>
            + Novi slot
          </Link>
        </div>
      </div>
      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <FeedFilters cities={cities ?? []} defaultCityId={me?.city_id} />
      </div>
      {searchParams.view === "mapa" ? (
        // Prikaz cijele mape
        (slotsList.length === 0 ? (<EmptyFeed
          cityName={me?.city?.name ?? null}
          sport={searchParams.sport ?? null}
        />) : (<div className="h-[calc(100vh-16rem)] min-h-[480px] overflow-hidden rounded-lg border border-border shadow-card">
          <SlotsMapWrapper slots={slotsList} fallbackCenter={mapFallback} />
        </div>))
      ) : (
        // Prikaz liste (podrazumijevano), uz mapu sa strane na desktopu
        (<div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-3.5">
            {slotsList.length === 0 ? (
              <EmptyFeed
                cityName={me?.city?.name ?? null}
                sport={searchParams.sport ?? null}
              />
            ) : (
              slotsList.map((s, i) => (
                <div
                  key={s.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(i * 50, 600)}ms` }}
                >
                  <SlotCard
                    slot={s}
                    acceptedPreview={acceptedBySlot.get(s.id) ?? []}
                  />
                </div>
              ))
            )}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-20 h-[560px] overflow-hidden rounded-[18px] border border-border shadow-card">
              <SlotsMapWrapper slots={slotsList} fallbackCenter={mapFallback} />
            </div>
          </div>
        </div>)
      )}
    </main>
  );
}
