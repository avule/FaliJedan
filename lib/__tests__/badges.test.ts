// Testovi za bedzeve i pravila otkljucavanja.

import { describe, it, expect } from "vitest";
import { BADGES, BADGE_BY_KEY } from "@/lib/badges";

describe("registar bedzeva", () => {
  it("ima 6 bedzeva", () => {
    expect(BADGES).toHaveLength(6);
  });

  it("svaki kljuc je jedinstven", () => {
    const keys = BADGES.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("svaki bedz ima ime, opis i ikonu", () => {
    for (const b of BADGES) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.desc.length).toBeGreaterThan(0);
      expect(b.icon.length).toBeGreaterThan(0);
    }
  });

  it("BADGE_BY_KEY pronalazi bedz po kljucu", () => {
    expect(BADGE_BY_KEY.debi.name).toBe("Debi");
    expect(BADGE_BY_KEY.top3.icon).toBe("🏆");
  });
});
