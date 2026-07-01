"use client";

// Dugme za prijavu/odjavu na slot, iz ugla igraca. Tekst i ponasanje zavise
// od trenutnog statusa korisnika (nije prijavljen, prihvacen, na cekanju,
// ceka odobrenje). Poziva server akciju i osvjezi stranicu.

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
        Prijave zatvorene
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
              ? "Skinuti se s liste čekanja?"
              : "Odjaviti se s termina?",
            {
              action: {
                label: "Odjavi me",
                onClick: () =>
                  start(async () => {
                    const res = await withdrawFromSlotAction(slotId);
                    if (res?.error) {
                      toast.error(res.error);
                    } else if (res?.late) {
                      toast.warning("Odjavio si se manje od 2h prije termina", {
                        description: "Pouzdanost je smanjena za 3%.",
                      });
                    } else {
                      toast.success("Odjavljen si s termina");
                    }
                    router.refresh();
                  }),
              },
              cancel: { label: "Odustani", onClick: () => {} },
            }
          );
        }}
      >
        {myStatus === "waitlist"
          ? "Na čekanju - povuci prijavu"
          : myStatus === "pending"
            ? "Čeka potvrdu - povuci prijavu"
            : "Odjavi se"}
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
              description: "Na listi čekanja si. Javljamo ako se mjesto otvori.",
            });
          } else if (res?.status === "pending") {
            toast.success("Prijava poslana", {
              description: "Organizator prvo potvrđuje prijave za takmičarski termin.",
            });
          } else {
            toast.success("Prihvaćen si!", {
              description: "Vidimo se na terenu.",
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
