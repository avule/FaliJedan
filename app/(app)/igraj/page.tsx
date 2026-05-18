import { createClient } from "@/lib/supabase/server";
import { SlotCard } from "@/components/slots/slot-card";
import { FeedFilters } from "@/components/slots/feed-filters";
import { SlotsMapWrapper } from "@/components/map/slots-map-wrapper";
import { RealtimeRefresh } from "@/components/slots/realtime-refresh";
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

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Default city = player's home city
  const { data: me } = await supabase
    .from("players")
    .select("city_id, city:cities(name)")
    .eq("id", user!.id)
    .maybeSingle<{ city_id: number | null; city: { name: string } | null }>();

  const cityId = searchParams.city
    ? Number(searchParams.city)
    : me?.city_id ?? null;

  // Resolve city name → center coords for the map fallback
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

  // Date window
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
        <p className="text-destructive">Greška: {error.message}</p>
      </main>
    );
  }

  const slotsList = (slots ?? []) as Slot[];

  // Fetch accepted player previews for avatar stack on cards (bulk).
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
    <main className="container py-6">
      <RealtimeRefresh />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            Feed
          </p>
          <h1 className="mt-1 font-display text-4xl uppercase tracking-tight md:text-5xl">
            Slotovi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="tabular text-foreground">{slotsList.length}</span>{" "}
            otvorenih
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle active={searchParams.view === "mapa" ? "mapa" : "list"} />
          <Link href="/novi-slot" className={buttonVariants()}>
            + Novi slot
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-card/40 p-4 backdrop-blur">
        <FeedFilters cities={cities ?? []} defaultCityId={me?.city_id} />
      </div>

      {searchParams.view === "mapa" ? (
        // FULL MAP VIEW
        slotsList.length === 0 ? (
          <EmptyFeed
            cityName={me?.city?.name ?? null}
            sport={searchParams.sport ?? null}
          />
        ) : (
          <div className="h-[calc(100vh-16rem)] min-h-[480px] overflow-hidden rounded-lg border border-border shadow-card">
            <SlotsMapWrapper slots={slotsList} fallbackCenter={mapFallback} />
          </div>
        )
      ) : (
        // LIST VIEW (default) - list + side map on desktop
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
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
            <div className="sticky top-20 h-[420px] overflow-hidden rounded-lg border border-border shadow-card">
              <SlotsMapWrapper slots={slotsList} fallbackCenter={mapFallback} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
