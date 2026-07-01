// HTML sabloni za sve mejlove koje aplikacija salje (prihvacen, na cekanju,
// slot pun, podsjetnik, otkazan, izbacen, upozorenje za nedolazak, ban).
// Svaki vraca { subject, html }. Zajednicki ram daje wrap().

import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import { SITE_URL } from "./resend";

const wrap = (title: string, body: string) => `
<!doctype html>
<html lang="sr">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f5;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:8px;padding:32px;color:#111;">
    <h1 style="font-size:20px;margin:0 0 16px 0;">
      <span style="color:#16a34a;">FaliJedan</span>
    </h1>
    ${body}
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
    <p style="font-size:12px;color:#6b7280;margin:0">
      Ovaj email je poslan automatski. Ne odgovaraj na ovu adresu.
    </p>
  </div>
</body>
</html>
`;

const slotLink = (slotId: string) => `${SITE_URL}/slot/${slotId}`;

const niceDate = (iso: string) =>
  format(new Date(iso), "EEEE, d. MMMM yyyy. 'u' HH:mm", { locale: srLatn });

export function applicationAcceptedEmail(args: {
  playerName: string;
  slotTitle: string;
  scheduledAt: string;
  locationName: string;
  slotId: string;
}) {
  return {
    subject: `Prihvaćen si na "${args.slotTitle}"`,
    html: wrap(
      "Prijava prihvaćena",
      `
      <p>Zdravo ${args.playerName},</p>
      <p>Tvoja prijava na slot <strong>${args.slotTitle}</strong> je <strong style="color:#16a34a;">prihvaćena</strong>.</p>
      <p>Lokacija: ${args.locationName}<br>Vrijeme: ${niceDate(args.scheduledAt)}</p>
      <p style="margin-top:24px;">
        <a href="${slotLink(args.slotId)}" style="background:#16a34a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Otvori slot</a>
      </p>
    `
    ),
  };
}

export function applicationWaitlistedEmail(args: {
  playerName: string;
  slotTitle: string;
  slotId: string;
}) {
  return {
    subject: `Na listi čekanja za "${args.slotTitle}"`,
    html: wrap(
      "Na listi čekanja",
      `
      <p>Zdravo ${args.playerName},</p>
      <p>Slot <strong>${args.slotTitle}</strong> je trenutno popunjen, ali si na <strong>listi čekanja</strong>. Ako se neko odjavi, javljamo ti odmah.</p>
      <p style="margin-top:24px;">
        <a href="${slotLink(args.slotId)}" style="background:#16a34a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Otvori slot</a>
      </p>
    `
    ),
  };
}

export function slotFullEmail(args: {
  organizerName: string;
  slotTitle: string;
  slotId: string;
}) {
  return {
    subject: `Slot "${args.slotTitle}" je popunjen`,
    html: wrap(
      "Slot popunjen",
      `
      <p>Zdravo ${args.organizerName},</p>
      <p>Tvoj slot <strong>${args.slotTitle}</strong> je popunjen. Ekipa je kompletna.</p>
      <p style="margin-top:24px;">
        <a href="${slotLink(args.slotId)}" style="background:#16a34a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Pogledaj slot</a>
      </p>
    `
    ),
  };
}

export function reminder24hEmail(args: {
  playerName: string;
  slotTitle: string;
  scheduledAt: string;
  locationName: string;
  slotId: string;
}) {
  return {
    subject: `Sutra igraš: ${args.slotTitle}`,
    html: wrap(
      "Podsjetnik",
      `
      <p>Zdravo ${args.playerName},</p>
      <p>Podsjećamo te da sutra imaš zakazan slot:</p>
      <p><strong>${args.slotTitle}</strong><br>Lokacija: ${args.locationName}<br>Vrijeme: ${niceDate(args.scheduledAt)}</p>
      <p>Ako iz nekog razloga ne možeš doći, odjavi se <strong>najmanje 2h prije</strong> kako ne bi izgubio na pouzdanosti.</p>
      <p style="margin-top:24px;">
        <a href="${slotLink(args.slotId)}" style="background:#16a34a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Otvori slot</a>
      </p>
    `
    ),
  };
}

export function noShowWarningEmail(args: {
  playerName: string;
  slotTitle: string;
  noShowCount: number;
  reliabilityScore: number;
}) {
  return {
    subject: "Nisi se pojavio na meču",
    html: wrap(
      "Upozorenje",
      `
      <p>Zdravo ${args.playerName},</p>
      <p>Organizator slota <strong>${args.slotTitle}</strong> je označio da se nisi pojavio.</p>
      <p>Tvoja pouzdanost je sad <strong>${args.reliabilityScore}%</strong> (${args.noShowCount}× ne-pojavljivanje u zadnjih 30 dana).</p>
      <p>Ako se ovo ponovi 4 puta u 30 dana, automatski dobijaš <strong>14-dnevni ban</strong> sa platforme.</p>
    `
    ),
  };
}

export function banEmail(args: {
  playerName: string;
  endsAt: string;
}) {
  return {
    subject: "Privremeno blokiran nalog",
    html: wrap(
      "Ban",
      `
      <p>Zdravo ${args.playerName},</p>
      <p>Zbog 4+ ne-pojavljivanja u zadnjih 30 dana, tvoj nalog je <strong>privremeno blokiran</strong> do <strong>${niceDate(args.endsAt)}</strong>.</p>
      <p>Tokom bana ne možeš se prijavljivati na slotove. Nakon isteka, pouzdanost se postepeno vraća kroz dolazak na mečeve.</p>
    `
    ),
  };
}

export function slotCancelledEmail(args: {
  playerName: string;
  slotTitle: string;
  scheduledAt: string;
}) {
  return {
    subject: `Otkazan termin: "${args.slotTitle}"`,
    html: wrap(
      "Termin otkazan",
      `
      <p>Zdravo ${args.playerName},</p>
      <p>Organizator je <strong style="color:#dc2626;">otkazao</strong> slot <strong>${args.slotTitle}</strong> koji je bio zakazan za ${niceDate(args.scheduledAt)}.</p>
      <p>Tvoja pouzdanost nije pogođena. Pogledaj druge slotove i nađi novu igru.</p>
      <p style="margin-top:24px;">
        <a href="${SITE_URL}/igraj" style="background:#16a34a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Vidi slotove</a>
      </p>
    `
    ),
  };
}

export function kickedEmail(args: {
  playerName: string;
  slotTitle: string;
}) {
  return {
    subject: `Uklonjen si sa "${args.slotTitle}"`,
    html: wrap(
      "Uklonjen",
      `
      <p>Zdravo ${args.playerName},</p>
      <p>Organizator te je uklonio sa slota <strong>${args.slotTitle}</strong>.</p>
      <p>Možeš pogledati druge slotove i prijaviti se.</p>
      <p style="margin-top:24px;">
        <a href="${SITE_URL}/igraj" style="background:#16a34a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Vidi slotove</a>
      </p>
    `
    ),
  };
}
