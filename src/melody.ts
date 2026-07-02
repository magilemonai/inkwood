/**
 * Melody planner — the Music of Typing.
 *
 * Every phrase is an incantation with a fixed tune. The tune derives
 * deterministically from the phrase text itself (same phrase → same
 * melody, forever) inside the act's harmonic world.
 *
 * Musical design:
 * - Each act sings in a pentatonic scale rooted on its ambient pad's
 *   tonic, in just intonation, so melody notes lock with the synth pads
 *   instead of beating against them.
 * - The melody SKELETON is one target tone per word, shaped in an
 *   arch: start low, climax ~70% of the way through, settle on the
 *   tonic at the final word. The word-end notes are the phrase's
 *   memorable tune.
 * - Letters inside a word are passing tones that walk stepwise toward
 *   the word's target, arriving exactly on its last letter. A fast
 *   typist plays runs; a slow typist plays rubato; the skeleton holds.
 * - Spaces and punctuation are silent — the breath between sung words.
 * - The final letter of the phrase always sounds the tonic: completing
 *   the spell resolves it.
 *
 * All tuning knobs a composer would reach for live in ACT_SCALES and
 * the shape constants below.
 */

export interface ActScale {
  name: string;
  /** Tonic in Hz — an octave shift of the act pad root (audio.ts
   *  ACT_AMBIENTS) so melody and pad share a fundamental. */
  tonic: number;
  /** Just-intonation ratios for one octave of the pentatonic. */
  ratios: number[];
}

export const ACT_SCALES: ActScale[] = [
  // Act I — Awakening. Innocent, open. Pad root C3 → melody tonic C4.
  { name: "C major pentatonic", tonic: 261.63, ratios: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3] },
  // Act II — Discovery. Shadowed, curious. Pad root E2 → melody tonic E3.
  { name: "E minor pentatonic", tonic: 164.81, ratios: [1, 6 / 5, 4 / 3, 3 / 2, 9 / 5] },
  // Act III — The Nexus. Bright, ceremonial. Pad root D3 → melody tonic D4.
  { name: "D major pentatonic", tonic: 293.66, ratios: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3] },
  // Act IV — Restoration. Homecoming warmth. Pad root G2 → melody tonic G3.
  { name: "G major pentatonic", tonic: 196.0, ratios: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3] },
];

/** Highest reachable scale degree (0 = tonic). 9 keeps the melody
 *  inside two warm octaves — never shrill. */
const MAX_DEGREE = 9;
/** Climax tone range: degree 5–7 (the octave and just above). */
const CLIMAX_MIN = 5;
const CLIMAX_SPAN = 3;
/** Where in the phrase the climax word sits (fraction of word count). */
const CLIMAX_POSITION = 0.7;

export interface MelodyNote {
  /** Hz, or null for silent characters (spaces, punctuation). */
  freq: number | null;
  /** Scale degree (0 = tonic). Kept for tests and dev tuning. */
  degree: number | null;
  /** True on the last letter of each word — triggers the low bloom. */
  isWordEnd: boolean;
  /** Low pad tone under word-end notes: tonic an octave down, or the
   *  fifth below tonic under the climax word for dominant color. */
  bloomFreq: number | null;
}

export interface MelodyPlan {
  /** One entry per character of the phrase, index-aligned with typing. */
  notes: MelodyNote[];
  tonic: number;
  /** Freqs for the completion pad: low tonic, tonic, fifth. */
  resolution: number[];
}

// ── Deterministic seed helpers (same PRNG family as levels.ts) ──

/** FNV-1a — stable, fast string hash for melody seeding. */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function degreeToFreq(degree: number, scale: ActScale): number {
  const d = Math.max(0, Math.min(MAX_DEGREE, degree));
  const octave = Math.floor(d / scale.ratios.length);
  const idx = d % scale.ratios.length;
  return scale.tonic * Math.pow(2, octave) * scale.ratios[idx];
}

// ── Skeleton: one target degree per word ──

function buildSkeleton(
  wordCount: number,
  rand: () => number,
): { degrees: number[]; climaxIdx: number } {
  if (wordCount === 0) return { degrees: [], climaxIdx: -1 };
  if (wordCount === 1) return { degrees: [0], climaxIdx: -1 };

  const start = rand() < 0.5 ? 0 : 2;
  const climaxDeg = CLIMAX_MIN + Math.floor(rand() * CLIMAX_SPAN);
  const climaxIdx = Math.max(
    0,
    Math.min(wordCount - 2, Math.round((wordCount - 1) * CLIMAX_POSITION)),
  );

  const degrees = new Array<number>(wordCount).fill(-1);
  degrees[0] = start;
  degrees[climaxIdx] = climaxDeg;
  degrees[wordCount - 1] = 0;

  fillSegment(degrees, 0, climaxIdx, rand);
  fillSegment(degrees, climaxIdx, wordCount - 1, rand);
  return { degrees, climaxIdx };
}

/** Fill interior words between two anchors: linear interpolation with
 *  gentle seeded jitter, never repeating the previous word's tone. */
function fillSegment(degrees: number[], ia: number, ib: number, rand: () => number) {
  for (let i = ia + 1; i < ib; i++) {
    const t = (i - ia) / (ib - ia);
    let deg = Math.round(degrees[ia] + (degrees[ib] - degrees[ia]) * t);
    if (rand() < 0.4) deg += rand() < 0.5 ? 1 : -1;
    deg = Math.max(0, Math.min(MAX_DEGREE, deg));
    if (deg === degrees[i - 1]) deg = deg < MAX_DEGREE ? deg + 1 : deg - 1;
    degrees[i] = deg;
  }
}

// ── Passing tones: walk a word's letters toward its target ──

/** Generate L degrees walking from `from` toward `target`, landing on
 *  `target` exactly at the last letter. Mostly stepwise (±1), with
 *  seeded ornaments — holds, leaps of a third, leaning notes — when
 *  there's slack. Repeated tones are welcome; incantations recite. */
function walkWord(from: number, target: number, L: number, rand: () => number): number[] {
  const out: number[] = [];
  let cur = from;
  for (let i = 0; i < L; i++) {
    const after = L - 1 - i;
    if (after === 0) {
      out.push(target);
      break;
    }
    const remaining = target - cur;
    const dir = Math.sign(remaining) || (rand() < 0.5 ? 1 : -1);
    const slack = 2 * after - Math.abs(remaining);

    let prefs: number[];
    if (remaining === 0) {
      // Circle the target with neighbor turns until it's time to land.
      prefs = rand() < 0.5 ? [1, -1, 0] : [-1, 1, 0];
    } else if (slack >= 2 && rand() < 0.3) {
      // Ornament: hold or lean away before continuing the walk.
      prefs = rand() < 0.5 ? [0, -dir, dir] : [-dir, 0, dir];
    } else if (rand() < 0.2) {
      // Occasional leap of a third, then keep walking.
      prefs = [dir * 2, dir, 0];
    } else {
      prefs = [dir, dir * 2, 0];
    }

    const step =
      prefs.find(
        (st) =>
          Math.abs(remaining - st) <= 2 * after &&
          cur + st >= 0 &&
          cur + st <= MAX_DEGREE,
      ) ?? Math.max(-2, Math.min(2, remaining));
    cur += step;
    out.push(cur);
  }
  return out;
}

// ── Public planner ──

const SOUNDING = /[a-z0-9]/i;

export function planMelody(phrase: string, actIndex: number): MelodyPlan {
  const scale = ACT_SCALES[actIndex] ?? ACT_SCALES[0];
  const rand = mulberry32(hashString(phrase));

  // Segment into words: maximal runs of letters/digits. Punctuation
  // attached to a word ("now,") stays silent; the word ends on its
  // last letter.
  const words: number[][] = [];
  let current: number[] | null = null;
  for (let i = 0; i < phrase.length; i++) {
    if (SOUNDING.test(phrase[i])) {
      if (!current) {
        current = [];
        words.push(current);
      }
      current.push(i);
    } else {
      current = null;
    }
  }

  const { degrees: skeleton, climaxIdx } = buildSkeleton(words.length, rand);

  const notes: MelodyNote[] = Array.from({ length: phrase.length }, () => ({
    freq: null,
    degree: null,
    isWordEnd: false,
    bloomFreq: null,
  }));

  let prev = 0; // the phrase opens from the tonic
  words.forEach((letterIdxs, wi) => {
    const walk = walkWord(prev, skeleton[wi], letterIdxs.length, rand);
    letterIdxs.forEach((charIdx, li) => {
      const deg = walk[li];
      const isWordEnd = li === letterIdxs.length - 1;
      notes[charIdx] = {
        freq: degreeToFreq(deg, scale),
        degree: deg,
        isWordEnd,
        bloomFreq: isWordEnd
          ? wi === climaxIdx
            ? scale.tonic * 0.75 // fifth below tonic — dominant color at the climax
            : scale.tonic / 2 // grounding low tonic heartbeat
          : null,
      };
    });
    prev = skeleton[wi];
  });

  return {
    notes,
    tonic: scale.tonic,
    resolution: [scale.tonic / 2, scale.tonic, scale.tonic * 1.5],
  };
}
