"use client";

// Forma za izmjenu postojeceg slota. Slicna formi za kreiranje, ali popunjena
// trenutnim podacima i bez izbora sporta. Broj mjesta se ne moze spustiti ispod
// vec prijavljenih igraca, to provjerava i server akcija.

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { LEVELS } from "@/lib/sports";
import { updateSlotAction, type UpdateSlotState } from "@/lib/actions/slots";
import type { Slot } from "@/types/database";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Snimanje..." : "Sačuvaj izmjene"}
    </Button>
  );
}

export function EditSlotForm({ slot }: { slot: Slot }) {
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState<Date | null>(
    new Date(slot.scheduled_at)
  );

  const [state, formAction] = useActionState<UpdateSlotState, FormData>(
    async (prev, fd) => {
      const res = await updateSlotAction(slot.id, prev, fd);
      if (res?.ok) {
        toast.success("Izmjene sačuvane");
        router.push(`/slot/${slot.id}`);
      } else if (res?.error) {
        toast.error(res.error);
      }
      return res;
    },
    null
  );

  const scheduledIso = scheduledAt ? scheduledAt.toISOString() : "";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="title">Naslov</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={3}
          maxLength={100}
          defaultValue={slot.title}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="level">Nivo</Label>
        <Select
          id="level"
          name="level"
          required
          defaultValue={slot.level}
        >
          {LEVELS.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Datum i vrijeme</Label>
        <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
        <input type="hidden" name="scheduled_at" value={scheduledIso} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_spots">Koliko igrača ti fali?</Label>
        <Input
          id="total_spots"
          name="total_spots"
          type="number"
          min={Math.max(1, slot.filled_spots)}
          max={20}
          defaultValue={slot.total_spots}
          required
        />
        <p className="text-xs text-muted-foreground">
          Trenutno prijavljeno:{" "}
          <span className="tabular text-foreground">{slot.filled_spots}</span> -
          broj mjesta ne može ići ispod toga
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_name">Lokacija (naziv)</Label>
        <Input
          id="location_name"
          name="location_name"
          required
          minLength={2}
          maxLength={150}
          defaultValue={slot.location_name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Opis (opciono)</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={500}
          defaultValue={slot.description ?? ""}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
