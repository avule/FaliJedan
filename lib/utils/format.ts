// Pomocne funkcije za prikaz datuma na srpskom: "Danas u 18:00", "Sutra u..."
// i relativno vrijeme ("prije 2 sata"). Sve ide preko date fns.

import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export function formatScheduledAt(iso: string): string {
  const date = new Date(iso);
  const time = format(date, "HH:mm");
  if (isToday(date)) return `Danas u ${time}`;
  if (isTomorrow(date)) return `Sutra u ${time}`;
  return format(date, "dd.MM. 'u' HH:mm");
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}
