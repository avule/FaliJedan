// Nizak sloj za slanje mejlova preko Resend servisa. Ovdje su podesavanja
// (klijent, adresa posiljaoca, URL sajta) i jedna sendEmail funkcija.

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Jedan klijent za sve zahtjeve. Ako kljuc fali (lokalni dev), ostaje null
// pa sendEmail samo preskoci slanje umjesto da puca.
export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "FaliJedan <onboarding@resend.dev>";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Salje mejl i nikad ne baca gresku. Mejl je sporedna stvar, ne smije
 * srusiti glavnu radnju korisnika. Sve sto krene naopako ide u konzolu.
 */
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    // Nema API kljuca, npr. lokalni razvoj. Tiho preskoci.
    console.warn("[email] RESEND_API_KEY nije postavljen, preskacem", args.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (error) console.error("[email] send failed:", error, args.subject);
  } catch (e) {
    console.error("[email] unexpected error:", e);
  }
}
