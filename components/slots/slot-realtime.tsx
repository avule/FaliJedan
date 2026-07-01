"use client";

// Slusa promjene na jednom slotu uzivo preko Supabase realtime kanala.
// Kad se promijeni slot ili prijava, osvjezi detalj slota.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SlotRealtime({ slotId }: { slotId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`slot-${slotId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `slot_id=eq.${slotId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "slots",
          filter: `id=eq.${slotId}`,
        },
        () => router.refresh()
      )
      .subscribe((status) => {
        // U dev konzoli se vidi da li je pretplata prosla.
        if (process.env.NODE_ENV === "development") {
          console.log("[realtime:slot]", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slotId, router]);

  return null;
}
