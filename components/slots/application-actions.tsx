"use client";

// Dugmad pored svake prijave u tabu "Prijave", iz ugla organizatora: odobri,
// odbij ili izbaci igraca. Koja se dugmad vide zavisi od statusa prijave.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approveApplicationAction,
  rejectApplicationAction,
  kickFromSlotAction,
} from "@/lib/actions/organizer";
import type { ApplicationStatus } from "@/types/database";

type Props = {
  applicationId: string;
  slotId: string;
  status: ApplicationStatus;
};

export function ApplicationActions({ applicationId, slotId, status }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function approve() {
    start(async () => {
      const res = await approveApplicationAction(applicationId, slotId);
      if (res?.error) toast.error(res.error);
      else if (res?.status === "waitlist")
        toast.warning("Termin se u međuvremenu popunio", {
          description: "Igrač je prebačen na listu čekanja.",
        });
      else toast.success("Igrač je prihvaćen");
      router.refresh();
    });
  }

  function reject() {
    toast("Odbiti prijavu?", {
      action: {
        label: "Odbij prijavu",
        onClick: () =>
          start(async () => {
            const res = await rejectApplicationAction(applicationId, slotId);
            if (res?.error) toast.error(res.error);
            else toast.success("Prijava odbijena");
            router.refresh();
          }),
      },
      cancel: { label: "Odustani", onClick: () => {} },
    });
  }

  function kick() {
    toast("Ukloniti igrača?", {
      action: {
        label: "Ukloni igrača",
        onClick: () =>
          start(async () => {
            const res = await kickFromSlotAction(applicationId, slotId);
            if (res?.error) toast.error(res.error);
            else toast.success("Igrač je uklonjen");
            router.refresh();
          }),
      },
      cancel: { label: "Odustani", onClick: () => {} },
    });
  }

  if (status === "pending") {
    return (
      <div className="flex shrink-0 gap-2">
        <Button size="sm" disabled={pending} onClick={approve}>
          Prihvati
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={reject}
        >
          Odbij
        </Button>
      </div>
    );
  }

  if (status === "accepted" || status === "waitlist") {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={kick}
      >
        Izbaci
      </Button>
    );
  }

  return null;
}
