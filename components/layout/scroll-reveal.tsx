"use client";

// Posmatra sve reveal elemente i dodaje aktivnu klasu kad udju u vidno
// polje, pa se blago pojave odozdo. Jednom otkriveno ostaje vidljivo.

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (els.length === 0) return;

    // Ako korisnik trazi manje animacija, odmah sve prikazi.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
