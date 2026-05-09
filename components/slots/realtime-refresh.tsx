"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to slot changes and triggers router.refresh() on UPDATE/INSERT.
 * RSC re-renders, server fetches fresh data. Simple, no client-side state.
 */
export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("slots-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slots" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
