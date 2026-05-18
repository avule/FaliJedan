"use client";

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
      description: "Igrači se više neće moći prijavljivati.",
      action: {
        label: "Da, otkaži",
        onClick: () =>
          start(async () => {
            const res = await cancelSlotAction(slotId);
            if (res?.error) toast.error(res.error);
            else toast.success("Slot otkazan");
            router.refresh();
          }),
      },
      cancel: { label: "Nazad", onClick: () => {} },
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
      <Button variant="ghost" onClick={onCancel} disabled={pending}>
        Otkaži slot
      </Button>
    </div>
  );
}
