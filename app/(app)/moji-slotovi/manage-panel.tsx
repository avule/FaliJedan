"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  kickFromSlotAction,
  confirmAppearancesAction,
  cancelSlotAction,
} from "@/lib/actions/organizer";
import type { Application, Player } from "@/types/database";

type AppWithPlayer = Application & {
  player: Pick<Player, "id" | "name" | "reliability_score" | "no_show_count_30d"> | null;
};

type Props = {
  slotId: string;
  accepted: AppWithPlayer[];
  waitlist: AppWithPlayer[];
  canConfirm: boolean;
  isCancelled: boolean;
  isDone: boolean;
};

export function ManageSlotPanel({
  slotId,
  accepted,
  waitlist,
  canConfirm,
  isCancelled,
  isDone,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showedUp, setShowedUp] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const a of accepted) init[a.player_id] = true; // default: yes
    return init;
  });

  function reliabilityBadge(score: number) {
    if (score >= 85) return <Badge variant="success">{score}%</Badge>;
    if (score >= 60) return <Badge variant="warning">{score}%</Badge>;
    return <Badge variant="destructive">{score}%</Badge>;
  }

  function kick(appId: string) {
    toast("Izbaciti igrača sa slota?", {
      action: {
        label: "Izbaci",
        onClick: () =>
          start(async () => {
            const res = await kickFromSlotAction(appId, slotId);
            if (res?.error) toast.error(res.error);
            else toast.success("Igrač uklonjen");
            router.refresh();
          }),
      },
      cancel: { label: "Otkaži", onClick: () => {} },
    });
  }

  function cancel() {
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

  function confirm_() {
    toast("Potvrditi pojave?", {
      description: "Finalizuje slot i okida pouzdanost/ban logiku.",
      action: {
        label: "Potvrdi",
        onClick: () =>
          start(async () => {
            const entries = accepted.map((a) => ({
              player_id: a.player_id,
              showed_up: !!showedUp[a.player_id],
            }));
            const res = await confirmAppearancesAction(slotId, entries);
            if (res?.error) toast.error(res.error);
            else toast.success("Pojave potvrđene");
            router.refresh();
          }),
      },
      cancel: { label: "Otkaži", onClick: () => {} },
    });
  }

  if (isCancelled) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Slot otkazan - nema više akcija.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {accepted.length === 0 && waitlist.length === 0 ? (
        <p className="text-sm text-muted-foreground">Još nema prijava.</p>
      ) : (
        <>
          {accepted.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Prihvaćeni ({accepted.length})
              </h3>
              <ul className="space-y-2">
                {accepted.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      {canConfirm && !isDone && (
                        <Checkbox
                          checked={!!showedUp[a.player_id]}
                          onChange={(e) =>
                            setShowedUp((prev) => ({
                              ...prev,
                              [a.player_id]: e.target.checked,
                            }))
                          }
                          title="Pojavio se?"
                        />
                      )}
                      <span>{a.player?.name ?? "Igrač"}</span>
                      {a.player &&
                        reliabilityBadge(a.player.reliability_score)}
                      {a.player && a.player.no_show_count_30d >= 2 && (
                        <Badge variant="warning">
                          {a.player.no_show_count_30d}× ne-pojav. (30d)
                        </Badge>
                      )}
                    </div>
                    {!isDone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => kick(a.id)}
                      >
                        Izbaci
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {waitlist.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Na čekanju ({waitlist.length})
              </h3>
              <ul className="space-y-2">
                {waitlist.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{a.player?.name ?? "Igrač"}</span>
                      {a.player &&
                        reliabilityBadge(a.player.reliability_score)}
                    </div>
                    {!isDone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => kick(a.id)}
                      >
                        Ukloni
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {canConfirm && (
          <Button onClick={confirm_} disabled={pending || accepted.length === 0}>
            Potvrdi pojave
          </Button>
        )}
        {!isDone && (
          <Button variant="outline" onClick={cancel} disabled={pending}>
            Otkaži slot
          </Button>
        )}
      </div>
    </div>
  );
}
