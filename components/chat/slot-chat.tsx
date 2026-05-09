"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { SlotChatMessage } from "@/types/database";

type Message = SlotChatMessage & { sender?: { name: string } | null };

type Props = {
  slotId: string;
  meId: string;
  initial: Message[];
  participants: Record<string, string>; // player_id -> name
};

export function SlotChat({ slotId, meId, initial, participants }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = useRef(createClient()).current;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Broadcast channel — bypasses RLS, peer-to-peer between subscribed clients.
  // RSC fetches initial messages on first load; live updates ride this channel.
  useEffect(() => {
    const channel = supabase.channel(`slot-chat-${slotId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "msg" }, (payload) => {
        const m = payload.payload as SlotChatMessage;
        setMessages((prev) =>
          prev.some((x) => x.id === m.id) ? prev : [...prev, m]
        );
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [slotId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);

    const { data, error } = await supabase
      .from("slot_chat")
      .insert({ slot_id: slotId, sender_id: meId, content })
      .select("*")
      .single();

    if (error) {
      toast.error(error.message);
      setSending(false);
      return;
    }

    if (data) {
      // Local insert + broadcast to other subscribers.
      setMessages((prev) =>
        prev.some((x) => x.id === data.id) ? prev : [...prev, data]
      );
      setText("");
      channelRef.current?.send({
        type: "broadcast",
        event: "msg",
        payload: data,
      });
    }
    setSending(false);
  }

  return (
    <div className="flex h-[480px] flex-col overflow-hidden rounded-lg border border-border bg-gradient-card shadow-card">
      <div className="border-b border-border/60 px-4 py-2.5">
        <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
          Chat
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <span className="text-3xl opacity-50">💬</span>
            <p className="mt-2">Još nema poruka. Pozdravi ekipu 👋</p>
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === meId;
          const name = participants[m.sender_id] ?? (mine ? "Ti" : "Igrač");
          const prev = messages[i - 1];
          const showAvatar = !prev || prev.sender_id !== m.sender_id;
          const initial = (name || "?").charAt(0).toUpperCase();

          return (
            <div
              key={m.id}
              className={cn(
                "flex animate-fade-in items-end gap-2",
                mine ? "justify-end" : "justify-start"
              )}
            >
              {!mine &&
                (showAvatar ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-muted text-xs font-bold">
                    {initial}
                  </div>
                ) : (
                  <div className="w-7 shrink-0" />
                ))}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-snug",
                  mine
                    ? "rounded-br-sm bg-gradient-primary text-primary-foreground shadow-glow"
                    : "rounded-bl-sm bg-secondary text-secondary-foreground"
                )}
              >
                {!mine && showAvatar && (
                  <div className="mb-0.5 text-[11px] font-semibold opacity-70">
                    {name}
                  </div>
                )}
                <div className="break-words">{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={send}
        className="flex gap-2 border-t border-border/60 bg-background/40 p-3"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napiši poruku..."
          maxLength={2000}
          className="bg-background"
        />
        <Button type="submit" disabled={!text.trim() || sending} size="default">
          Pošalji
        </Button>
      </form>
    </div>
  );
}
