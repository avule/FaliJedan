"use client";

// Dugmad koja organizator vidi na svom slotu: izmijeni i otkazi termin.
// Otkazivanje trazi potvrdu jer salje mejl svim prihvacenim igracima.

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cancelSlotAction } from "@/lib/actions/organizer";

type Props = {
  slotId: string;
  isClosed: boolean;
};

export function SlotOrganizerActions({ slotId, isClosed }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (isClosed) {
    return (
      <Button variant="secondary" disabled>
        Ti si organizator
      </Button>
    );
  }

  function onCancel() {
    toast("Otkazati slot?", {
      description: "Prijave se zatvaraju, a prihvaćeni igrači dobijaju obavještenje.",
      action: {
        label: "Otkaži slot",
        onClick: () =>
          start(async () => {
            const res = await cancelSlotAction(slotId);
            if (res?.error) toast.error(res.error);
            else toast.success("Slot otkazan");
            router.refresh();
          }),
      },
      cancel: { label: "Odustani", onClick: () => {} },
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/slot/${slotId}/uredi`}
        className={buttonVariants({ variant: "outline" })}
      >
        Uredi slot
      </Link>
      <Button
        variant="ghost"
        onClick={onCancel}
        disabled={pending}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        Otkaži slot
      </Button>
    </div>
  );
}
