// Testovi za level krivu, XP nagrade i nazive nivoa.

import { describe, it, expect } from "vitest";
import {
  XP_AWARDS,
  levelReq,
  levelFromXp,
  levelTitle,
  LEVEL_TITLES,
} from "@/lib/gamification";

describe("XP_AWARDS", () => {
  it("ima ocekivane vrijednosti", () => {
    expect(XP_AWARDS.match_played).toBe(100);
    expect(XP_AWARDS.match_organized).toBe(60);
    expect(XP_AWARDS.slot_filled).toBe(40);
    expect(XP_AWARDS.first_sport).toBe(50);
    expect(XP_AWARDS.streak_bonus).toBe(50);
  });
});

describe("levelReq", () => {
  it("L1->2 = 500, raste za 250 po levelu", () => {
    expect(levelReq(1)).toBe(500);
    expect(levelReq(2)).toBe(750);
    expect(levelReq(7)).toBe(2000);
  });
});

describe("levelFromXp", () => {
  it("0 XP je level 1, nista skupljeno", () => {
    expect(levelFromXp(0)).toEqual({
      level: 1,
      intoLevel: 0,
      toNext: 500,
      pct: 0,
    });
  });

  it("tacno 500 XP prelazi na level 2", () => {
    expect(levelFromXp(500)).toEqual({
      level: 2,
      intoLevel: 0,
      toNext: 750,
      pct: 0,
    });
  });

  it("6750 XP je tacno pocetak levela 7", () => {
    // zbir levelReq(1..6) = 500+750+1000+1250+1500+1750 = 6750
    expect(levelFromXp(6750)).toMatchObject({ level: 7, intoLevel: 0 });
  });

  it("racuna napredak unutar levela", () => {
    const info = levelFromXp(6750 + 1840);
    expect(info.level).toBe(7);
    expect(info.intoLevel).toBe(1840);
    expect(info.toNext).toBe(2000);
    expect(info.pct).toBe(92);
  });

  it("negativan ili nevalidan XP ne pada ispod levela 1", () => {
    expect(levelFromXp(-100).level).toBe(1);
  });
});

describe("levelTitle", () => {
  it("level 1 je Pocetnik", () => {
    expect(levelTitle(1)).toBe("Početnik");
  });

  it("level 7 je Street Baller", () => {
    expect(levelTitle(7)).toBe("Street Baller");
  });

  it("visoki leveli se ogranicavaju na zadnji naziv (Maestro)", () => {
    expect(levelTitle(99)).toBe(LEVEL_TITLES[LEVEL_TITLES.length - 1]);
    expect(levelTitle(99)).toBe("Maestro");
  });
});
