// Spaja Tailwind klase i pametno rjesava sukobe izmedju slicnih klasa.
// Standardni shadcn helper, koristi se skoro u svakoj komponenti.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
