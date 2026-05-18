"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { saveAvatarUrlAction } from "@/lib/actions/avatar";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  userId: string;
  name: string;
  initialUrl: string | null;
};

export function AvatarUpload({ userId, name, initialUrl }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow reselect of same file
    if (!file) return;

    if (!ACCEPT.includes(file.type)) {
      toast.error("Samo JPG, PNG ili WebP slike");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Maksimalna veličina je 4 MB");
      return;
    }

    start(async () => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) {
        toast.error(`Upload greška: ${upErr.message}`);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const res = await saveAvatarUrlAction(publicUrl);
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      setUrl(publicUrl);
      toast.success("Avatar ažuriran");
      router.refresh();
    });
  }

  async function onRemove() {
    start(async () => {
      const res = await saveAvatarUrlAction(null);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setUrl(null);
      toast.success("Avatar uklonjen");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={url} name={name} size="xl" highlight />

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          onChange={onPick}
          className="hidden"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Slanje..." : url ? "Promijeni" : "Postavi avatar"}
          </Button>
          {url && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={onRemove}
            >
              Ukloni
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ili WebP · max 4 MB
        </p>
      </div>
    </div>
  );
}
