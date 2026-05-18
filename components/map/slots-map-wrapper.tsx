"use client";

import dynamic from "next/dynamic";
import type { Slot } from "@/types/database";

const SlotsMap = dynamic(() => import("./slots-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
      Učitavanje mape...
    </div>
  ),
});

export function SlotsMapWrapper({
  slots,
  fallbackCenter,
}: {
  slots: Slot[];
  fallbackCenter?: [number, number];
}) {
  return <SlotsMap slots={slots} fallbackCenter={fallbackCenter} />;
}
