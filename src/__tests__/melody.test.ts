import { describe, it, expect } from "vitest";
import { planMelody, degreeToFreq, ACT_SCALES } from "../melody";
import { LEVELS, getActIndex } from "../levels";

/** Every phrase a player can ever meet: canonical + full pools. */
function allPhrases(): { phrase: string; actIndex: number }[] {
  const out: { phrase: string; actIndex: number }[] = [];
  LEVELS.forEach((level, lvl) => {
    const actIndex = getActIndex(lvl);
    level.prompts.forEach((p) => out.push({ phrase: p, actIndex }));
    level.promptPool?.forEach((slot) =>
      slot.forEach((p) => out.push({ phrase: p, actIndex })),
    );
  });
  return out;
}

const SOUNDING = /[a-z0-9]/i;

describe("planMelody", () => {
  it("is deterministic — same phrase, same tune, forever", () => {
    for (const { phrase, actIndex } of allPhrases()) {
      expect(planMelody(phrase, actIndex)).toEqual(planMelody(phrase, actIndex));
    }
  });

  it("produces one note entry per character, index-aligned with typing", () => {
    for (const { phrase, actIndex } of allPhrases()) {
      expect(planMelody(phrase, actIndex).notes).toHaveLength(phrase.length);
    }
  });

  it("sounds every letter and silences spaces/punctuation", () => {
    for (const { phrase, actIndex } of allPhrases()) {
      const plan = planMelody(phrase, actIndex);
      plan.notes.forEach((note, i) => {
        if (SOUNDING.test(phrase[i])) {
          expect(note.freq).toBeGreaterThan(0);
          expect(note.degree).not.toBeNull();
        } else {
          expect(note.freq).toBeNull();
        }
      });
    }
  });

  it("marks exactly one word-end per word, each with a bloom", () => {
    for (const { phrase, actIndex } of allPhrases()) {
      const plan = planMelody(phrase, actIndex);
      const wordCount = phrase.split(/[^a-z0-9]+/i).filter(Boolean).length;
      const wordEnds = plan.notes.filter((n) => n.isWordEnd);
      expect(wordEnds).toHaveLength(wordCount);
      wordEnds.forEach((n) => expect(n.bloomFreq).toBeGreaterThan(0));
    }
  });

  it("resolves the final letter to the tonic — the spell completes", () => {
    for (const { phrase, actIndex } of allPhrases()) {
      const plan = planMelody(phrase, actIndex);
      const lastSounding = [...plan.notes].reverse().find((n) => n.freq !== null);
      expect(lastSounding?.degree).toBe(0);
      expect(lastSounding?.freq).toBeCloseTo(plan.tonic, 5);
    }
  });

  it("keeps every note in a warm register (no shrill highs, no sub rumble)", () => {
    for (const { phrase, actIndex } of allPhrases()) {
      const plan = planMelody(phrase, actIndex);
      plan.notes.forEach((note) => {
        if (note.freq !== null) {
          expect(note.freq).toBeGreaterThanOrEqual(80);
          expect(note.freq).toBeLessThanOrEqual(1600);
        }
      });
      plan.resolution.forEach((f) => {
        expect(f).toBeGreaterThanOrEqual(80);
        expect(f).toBeLessThanOrEqual(1600);
      });
    }
  });

  it("rises to a climax above the opening — the arch shape holds", () => {
    for (const { phrase, actIndex } of allPhrases()) {
      const plan = planMelody(phrase, actIndex);
      const degrees = plan.notes
        .map((n) => n.degree)
        .filter((d): d is number => d !== null);
      const peak = Math.max(...degrees);
      expect(peak).toBeGreaterThanOrEqual(5);
      expect(peak).toBeLessThanOrEqual(9);
    }
  });
});

describe("degreeToFreq", () => {
  it("maps degree 0 to the tonic and degree 5 to the octave", () => {
    for (const scale of ACT_SCALES) {
      expect(degreeToFreq(0, scale)).toBeCloseTo(scale.tonic, 5);
      expect(degreeToFreq(5, scale)).toBeCloseTo(scale.tonic * 2, 5);
    }
  });
});
