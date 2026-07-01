"use client";

// feed filtrira slotove na scheduled_at >= sad, ali server se ne renderuje sam
// kad vrijeme prodje. ovo zakaze refresh tacno kad prvom (najblizem) slotu
// istekne termin, pa nestane sa feeda bez rucnog osvjezavanja.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function FeedAutoRefresh({ nextExpiry }: { nextExpiry: string | null }) {
  const router = useRouter();

  useEffect(() => {
    if (!nextExpiry) return;
    const ms = new Date(nextExpiry).getTime() - Date.now();
    // vec proslo, osvjezi odmah
    if (ms <= 0) {
      router.refresh();
      return;
    }
    // +1s da budemo sigurno iza termina; clamp na ~1 dan zbog setTimeout limita
    const delay = Math.min(ms + 1000, 24 * 60 * 60 * 1000);
    const t = setTimeout(() => router.refresh(), delay);
    return () => clearTimeout(t);
  }, [nextExpiry, router]);

  return null;
}
