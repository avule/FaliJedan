"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { srLatn } from "date-fns/locale";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils/cn";

export function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={srLatn}
      weekStartsOn={1}
      showOutsideDays={false}
      className={cn("rdp-fj", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        caption_label: "text-sm font-semibold capitalize",
        nav: "flex items-center gap-1",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-secondary",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-secondary",
        weekday: "text-xs text-muted-foreground font-medium w-9 text-center",
        day_button:
          "h-9 w-9 p-0 text-sm rounded-md hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "ring-1 ring-primary",
        outside: "text-muted-foreground opacity-40",
        disabled: "opacity-30 pointer-events-none",
        ...classNames,
      }}
      {...props}
    />
  );
}
