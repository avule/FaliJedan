"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  applyToSlotAction,
  withdrawFromSlotAction,
} from "@/lib/actions/applications";
import type { ApplicationStatus } from "@/types/database";

type Props = {
  slotId: string;
  myStatus: ApplicationStatus | null;
  isOrganizer: boolean;
  isClosed: boolean;
};

export function ApplyButton({ slotId, myStatus, isOrganizer, isClosed }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (isOrganizer) {
    return (
      <Button variant="secondary" disabled>
        Ti si organizator
      </Button>
    );
  }
  if (isClosed) {
    return (
      <Button variant="secondary" disabled>
        Slot zatvoren
      </Button>
    );
  }

  if (myStatus === "accepted" || myStatus === "waitlist" || myStatus === "pending") {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          toast(
            myStatus === "waitlist"
              ? "Skinuti se sa waitliste?"
              : "Odjaviti se sa slota?",
            {
              action: {
                label: "Da, odjavi me",
                onClick: () =>
                  start(async () => {
                    const res = await withdrawFromSlotAction(slotId);
                    if (res?.error) {
                      toast.error(res.error);
                    } else if (res?.late) {
                      toast.warning("Odjavio si se manje od 2h prije meča", {
                        description: "Pouzdanost je smanjena za 3%.",
                      });
                    } else {
                      toast.success("Odjavljen si sa slota");
                    }
                    router.refresh();
                  }),
              },
              cancel: { label: "Otkaži", onClick: () => {} },
            }
          );
        }}
      >
        {myStatus === "waitlist" ? "Na čekanju — odjavi se" : "Odjavi se"}
      </Button>
    );
  }

  return (
    <Button
      disabled={pending}
      onClick={() => {
        start(async () => {
          const res = await applyToSlotAction(slotId);
          if (res?.error) {
            toast.error(res.error);
          } else if (res?.status === "waitlist") {
            toast.warning("Slot je pun", {
              description: "Dodan si na waitlistu — javljamo ako se mjesto otvori.",
            });
          } else {
            toast.success("Prihvaćen si!", {
              description: "Vidimo se na terenu 🏃",
            });
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Slanje..." : "Prijavi se"}
    </Button>
  );
}
