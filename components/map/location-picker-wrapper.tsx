"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
      Učitavanje mape...
    </div>
  ),
});

export { LocationPicker };
