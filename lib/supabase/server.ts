// Dvije vrste Supabase klijenta za server. createClient postuje sesiju i RLS
// (koristi se u akcijama i stranicama), createServiceClient preskace RLS i
// sluzi samo za pozadinske poslove (cron, slanje mejlova).

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Klijent vezan za sesiju ulogovanog korisnika (cita kolacice zahtjeva).
// Ovo koristimo svuda gdje treba postovati RLS pravila baze.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server komponenta ne smije pisati kolacice, to radi proxy.
          }
        },
      },
    }
  );
}

// Klijent sa service role kljucem koji preskace RLS.
// Samo za server (cron, slanje mejlova), nikad ne smije do browsera.
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
