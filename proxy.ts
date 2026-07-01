// Ulazna tacka koja se vrti prije svake rute (Next 16 "proxy", ranije se zvao
// middleware). Sav posao radi updateSession. Matcher ispod iskljucuje statiku
// i slike da se ne trosi bez potrebe.

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
