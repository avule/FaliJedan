"use client";

import * as React from "react";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: Date | null;
  onChange: (next: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Earliest selectable datetime (inclusive). Defaults to now. */
  min?: Date;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Odaberi datum i vrijeme",
  disabled,
  min,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const minDate = min ?? new Date();

  const hour = value ? value.getHours() : 19;
  const minute = value ? Math.floor(value.getMinutes() / 5) * 5 : 0;

  function pickDate(d: Date | undefined) {
    if (!d) return;
    const next = new Date(d);
    next.setHours(hour, minute, 0, 0);
    onChange(next);
  }

  function pickTime(h: number, m: number) {
    const base = value ?? new Date();
    const next = new Date(base);
    next.setHours(h, m, 0, 0);
    onChange(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal",
            !value && "text-muted-foreground"
          )}
        >
          🗓{" "}
          {value
            ? format(value, "EEEE, d. MMMM yyyy. 'u' HH:mm", { locale: srLatn })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={pickDate}
            disabled={(d) => d < new Date(minDate.toDateString())}
          />
        </div>
        <div className="flex items-center gap-2 border-t border-border p-3">
          <span className="text-sm text-muted-foreground">Vrijeme</span>
          <Select
            value={hour}
            onChange={(e) => pickTime(Number(e.target.value), minute)}
            className="w-20"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, "0")}
              </option>
            ))}
          </Select>
          <span>:</span>
          <Select
            value={minute}
            onChange={(e) => pickTime(hour, Number(e.target.value))}
            className="w-20"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m.toString().padStart(2, "0")}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            size="sm"
            className="ml-auto"
            onClick={() => setOpen(false)}
          >
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
