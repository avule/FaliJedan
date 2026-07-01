"use client";

// Supabase klijent za browser. Koristi se u klijentskim komponentama,
// npr. za chat uzivo i upload avatara.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
