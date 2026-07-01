"use client";

// Isto kao realtime za jedan slot, ali za feed. Osluskuje promjene nad svim slotovima
// i osvjezi listu da korisnik vidi nove termine bez rucnog osvjezavanja.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("slots-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slots" },
        (payload) => {
          if (process.env.NODE_ENV === "development") {
            console.log("[realtime:feed] event", payload.eventType);
          }
          router.refresh();
        }
      )
      .subscribe((status) => {
        // U dev konzoli se vidi da li je pretplata prosla (SUBSCRIBED) ili ne.
        if (process.env.NODE_ENV === "development") {
          console.log("[realtime:feed]", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
