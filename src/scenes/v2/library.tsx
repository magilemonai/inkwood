import { memo } from "react";
import type { SceneProps } from "../../types";
import { sub } from "../util";
import { useParticles } from "../../hooks/useParticles";
import ParticleField from "../../components/ParticleField";

// ─── THE WHISPERING LIBRARY (Inkwood 2) ──────────────────────────────
// A hall cut into the rock, shelved wall to wall, receding to a single
// vanishing point. At rest the only light is a cold thread falling
// through a crack in the vault onto a shut tome — every book a voice
// that stopped mid-sentence, unreadable in the dark.
//
// Phrase 1 "open, sleeping pages": the cover lifts, swings, and burns
// away into light; the spread opens; the tome becomes the room's only
// lamp and the spines nearest it recover their colour.
//
// Phrase 2 "rise, every voice, and speak as one": books lift out of
// their slots (leaving real gaps behind them), pages fluttering; three
// soft voice-threads rise from the spread and braid into one under the
// vault; the ceiling crystals answer; ink-marks climb like embers.
//
// Two rules carry the frame. Depth: three planes (near frame, receding
// banks, rear apse), the near plane nearly black so the corners never
// come up. Temperature: every surface crossfades in RGB from cold slate
// to lamp-warm as the tome's light reaches it — the Cottage's blue-to-
// amber shift, aimed down a corridor instead of across a room.

// ─── PERSPECTIVE FRAME ───────────────────────────────────────────────

const VP = { x: 200, y: 110 };   // one-point vanishing point
const FAR_L = 130;               // rear wall left edge
const FAR_R = 270;               // rear wall right edge
const REAR_TOP = 72;
const REAR_BOT = 159;

/** Deterministic pseudo-random in [0,1). Stable across renders. */
function rnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** How much of the tome's light reaches a point (1 at the lectern, 0 at
 *  the frame edges). This is the scene's own light model — the Glow
 *  layer paints the halos, this decides which spines have colour. */
function illum(x: number, y: number): number {
  const d = Math.hypot(x - 200, (y - 122) * 1.15);
  return Math.max(0, 1 - d / 178);
}

// ─── PALETTE ─────────────────────────────────────────────────────────
// Every surface is a cold→warm pair crossfaded in RGB. HSL hue rotation
// from slate blue to lamplight runs through green or magenta; RGB does
// not, and the Cottage proved the temperature shift is the strongest
// tool in the kit.

type Pair = [number[], number[]];

const rgbMix = (pair: Pair, t: number): string => {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const [a, b] = pair;
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
};

const P = {
  vault: [[10, 10, 17], [17, 15, 17]] as Pair,
  airTop: [[12, 12, 19], [19, 17, 19]] as Pair,
  airBot: [[15, 14, 22], [27, 22, 20]] as Pair,
  wallNear: [[10, 10, 17], [16, 14, 16]] as Pair,
  wallFar: [[25, 24, 37], [72, 52, 34]] as Pair,
  nicheNear: [[7, 7, 12], [11, 10, 12]] as Pair,
  nicheFar: [[16, 16, 27], [44, 32, 23]] as Pair,
  ledgeNear: [[15, 15, 23], [25, 22, 21]] as Pair,
  ledgeFar: [[36, 35, 52], [124, 93, 56]] as Pair,
  rear: [[21, 20, 33], [56, 41, 28]] as Pair,
  apse: [[16, 16, 27], [42, 32, 24]] as Pair,
  floorFar: [[23, 22, 34], [62, 45, 30]] as Pair,
  floorNear: [[9, 9, 15], [15, 13, 14]] as Pair,
  stone: [[40, 39, 56], [136, 102, 62]] as Pair,
  stoneDim: [[21, 21, 32], [52, 39, 27]] as Pair,
  carve: [[42, 41, 58], [168, 126, 74]] as Pair,
};

interface Shelf {
  side: -1 | 1;
  nearX: number;
  farX: number;
  yNear: number;
  yFar: number;
  seed: number;
}

function shelf(side: -1 | 1, yNear: number, seed: number): Shelf {
  const nearX = side < 0 ? 0 : 400;
  const farX = side < 0 ? FAR_L : FAR_R;
  const yFar = yNear + (VP.y - yNear) * (Math.abs(farX - nearX) / Math.abs(VP.x - nearX));
  return { side, nearX, farX, yNear, yFar, seed };
}

const SHELVES: Shelf[] = [
  shelf(-1, 44, 3), shelf(-1, 99, 11), shelf(-1, 153, 19),
  shelf(1, 50, 27), shelf(1, 104, 35), shelf(1, 157, 43),
];

// ─── BOOKS ───────────────────────────────────────────────────────────
// Every book is a shaped path: a bowed spine, a head that is flat or
// barely domed (a dome on every book reads as a row of headstones), a
// swelling fore-edge, a sunken label band, and a separate page-block on
// the side that faces the tome. Never a rect.

const SPINE_HUES = [354, 24, 40, 96, 172, 216, 288, 8];
const BOOK_BREAK = 0.60;   // beyond this perspective scale, the row merges

interface Book {
  x: number;      // left edge in viewBox units
  y: number;      // baseline, on the ledge
  w: number;
  h: number;
  s: number;      // perspective scale, 1 near -> BOOK_BREAK far
  dome: number;   // head curvature, mostly 0
  lean: number;   // degrees
  hue: number;
  sat: number;
  side: -1 | 1;
  lit: number;    // tome light reaching this book
  rise: number;   // -1 stays on the shelf, else index into FLIGHTS
}

interface FarRow {
  d: string;
  ticks: string[];
  lit: number;
}

/** Where each risen book flies to, and how it flutters there. */
const FLIGHTS = [
  { x: 108, y: 62, tilt: -13, delay: 0.52, dur: 0.20, flut: 3.1, sc: 0.98 },
  { x: 152, y: 36, tilt: 9, delay: 0.60, dur: 0.20, flut: 2.6, sc: 0.86 },
  { x: 86, y: 106, tilt: 15, delay: 0.70, dur: 0.18, flut: 3.5, sc: 1.04 },
  { x: 258, y: 42, tilt: 11, delay: 0.56, dur: 0.20, flut: 2.9, sc: 0.88 },
  { x: 300, y: 72, tilt: -9, delay: 0.65, dur: 0.19, flut: 3.7, sc: 1.0 },
  { x: 322, y: 108, tilt: -15, delay: 0.76, dur: 0.18, flut: 2.8, sc: 1.06 },
];

const FLIGHT_PICKS: number[][] = [[0.55], [0.3], [0.42], [0.6], [0.34], [0.48]];

const BOOKS: Book[] = [];
const FAR_ROWS: FarRow[] = [];

(() => {
  let flight = 0;
  SHELVES.forEach((sh, si) => {
    const dir = sh.side < 0 ? 1 : -1;
    const span = Math.abs(sh.farX - sh.nearX);
    const depth = Math.abs(VP.x - sh.nearX);
    const row: Book[] = [];
    let cursor = sh.nearX + dir * (1 + rnd(sh.seed) * 2.5);
    let i = 0;
    for (;;) {
      const dist = Math.abs(cursor - sh.nearX);
      const s = 1 - dist / depth;
      if (s < BOOK_BREAK) break;
      const wr = rnd(sh.seed + i * 3.1);
      const hr = rnd(sh.seed + i * 5.7);
      const w = (7 + wr * 6.4) * s;
      // Height and width are anti-correlated: the fat ones are short
      // ledgers, the thin ones are tall folios. Uniform books read as
      // dominoes.
      const h = (17 + (1 - wr) * 12 + hr * 14) * s;
      const y = sh.yNear + (sh.yFar - sh.yNear) * (dist / span);
      const leanRoll = rnd(sh.seed + i * 9.3);
      const x = dir > 0 ? cursor : cursor - w;
      row.push({
        x, y, w, h, s,
        dome: rnd(sh.seed + i * 6.1) > 0.72 ? 0.5 + rnd(sh.seed + i) * 0.9 : 0,
        lean: leanRoll > 0.87 ? (leanRoll - 0.62) * 26 : (leanRoll - 0.5) * 2.2,
        hue: SPINE_HUES[Math.floor(rnd(sh.seed + i * 2.3) * SPINE_HUES.length)],
        sat: 26 + rnd(sh.seed + i * 4.4) * 30,
        side: sh.side,
        lit: illum(x + w / 2, y - h / 2),
        rise: -1,
      });
      cursor += dir * (w + 0.5 * s);
      i++;
    }
    // One slot per bank stands empty already — a voice that left long ago.
    const gapAt = Math.floor(row.length * (0.2 + rnd(sh.seed * 5) * 0.5));
    if (row[gapAt]) row.splice(gapAt, 1);
    // The books that will rise on phrase 2, leaving their gaps behind.
    FLIGHT_PICKS[si].forEach((f) => {
      const k = Math.min(row.length - 1, Math.max(0, Math.round(row.length * f)));
      if (row[k] && flight < FLIGHTS.length) row[k].rise = flight++;
    });
    BOOKS.push(...row);

    // The far half of every bank: one packed mass of spines with a
    // ragged top and a few divisions. Individual books that small are
    // noise, not detail.
    const steps = 8;
    const top: string[] = [];
    const ticks: string[] = [];
    for (let k = 0; k <= steps; k++) {
      const xx = cursor + (sh.farX - cursor) * (k / steps);
      const dist = Math.abs(xx - sh.nearX);
      const s = 1 - dist / depth;
      const yy = sh.yNear + (sh.yFar - sh.yNear) * (dist / span);
      const hh = (22 + rnd(sh.seed * 3.3 + k * 1.7) * 14) * s;
      top.push(`${xx.toFixed(1)} ${(yy - hh).toFixed(1)}`);
      if (k > 0 && k < steps) {
        ticks.push(`M${xx.toFixed(1)} ${(yy - hh * 0.94).toFixed(1)} L${xx.toFixed(1)} ${yy.toFixed(1)}`);
      }
    }
    const yStart = sh.yNear + (sh.yFar - sh.yNear) * (Math.abs(cursor - sh.nearX) / span);
    FAR_ROWS.push({
      d: `M${cursor.toFixed(1)} ${yStart.toFixed(1)} L${top.join(" L")} L${sh.farX} ${sh.yFar.toFixed(1)} Z`,
      ticks,
      lit: illum((cursor + sh.farX) / 2, (yStart + sh.yFar) / 2 - 8),
    });
  });
})();

/** A book seen spine-out: bowed sides, a head that is flat unless it
 *  earns a dome, a fore-edge that swells. */
function spinePath(w: number, h: number, dome: number): string {
  return `M0 0 C${-w * 0.04} ${-h * 0.35}, ${-w * 0.03} ${-h * 0.72}, ${w * 0.06} ${-h * 0.985}`
    + ` C${w * 0.3} ${-h - dome}, ${w * 0.7} ${-h - dome * 0.82}, ${w * 0.94} ${-h * 0.985}`
    + ` C${w * 1.02} ${-h * 0.62}, ${w * 1.01} ${-h * 0.3}, ${w * 0.96} 0 Z`;
}

/** The block of page edges beside the spine, on the side facing the tome. */
function pagePath(w: number, h: number): string {
  const pw = w * 0.32;
  return `M${w * 0.94} ${-h * 0.95} C${w * 1.01} ${-h * 0.6}, ${w * 1.0} ${-h * 0.28}, ${w * 0.95} ${-h * 0.03}`
    + ` L${w * 0.95 + pw} ${-h * 0.07} C${w * 0.99 + pw} ${-h * 0.3}, ${w * 1.0 + pw} ${-h * 0.6}, ${w * 0.93 + pw} ${-h * 0.9} Z`;
}

/** The sunken label band across a spine — the strongest "book" cue at
 *  this scale, and the thing that stops a row reading as headstones. */
function labelPath(w: number, h: number): string {
  return `M${w * 0.12} ${-h * 0.7} C${w * 0.4} ${-h * 0.72}, ${w * 0.64} ${-h * 0.72}, ${w * 0.88} ${-h * 0.69}`
    + ` L${w * 0.88} ${-h * 0.55} C${w * 0.64} ${-h * 0.58}, ${w * 0.4} ${-h * 0.58}, ${w * 0.12} ${-h * 0.56} Z`;
}

// ─── VAULT, WALLS, FLOOR ─────────────────────────────────────────────
// Rough rock, not a box: every perspective edge wanders off the line.

const VAULT = `M0 0 L400 0 L400 9
  C382 17, 373 27, 357 33 C345 38, 351 45, 337 48
  C319 52, 307 59, 297 63 C287 67, 279 69, 270 ${REAR_TOP}
  C252 69, 236 74, 218 71 C210 70, 206 73, 196 72
  C180 70, 156 75, ${FAR_L} ${REAR_TOP}
  C121 68, 113 66, 103 62 C93 58, 81 51, 63 47
  C49 44, 55 37, 43 32 C27 26, 17 16, 0 9 Z`;

const WALL_L = `M0 9 C17 16, 27 26, 43 32 C55 37, 49 44, 63 47
  C81 51, 93 58, 103 62 C113 66, 121 68, ${FAR_L} ${REAR_TOP}
  L${FAR_L} ${REAR_BOT}
  C112 168, 91 183, 69 199 C47 215, 24 233, 0 250 Z`;

const WALL_R = `M400 9 C383 16, 373 27, 357 33 C345 38, 351 45, 337 48
  C319 52, 307 59, 297 63 C287 67, 279 69, ${FAR_R} ${REAR_TOP}
  L${FAR_R} ${REAR_BOT}
  C289 169, 310 184, 332 200 C354 216, 377 234, 400 250 Z`;

const FLOOR = `M0 250 C24 233, 47 215, 69 199 C91 183, 112 168, ${FAR_L} ${REAR_BOT}
  C160 162, 240 162, ${FAR_R} ${REAR_BOT} C289 169, 310 184, 332 200 C354 216, 377 234, 400 250 Z`;

const REAR = `M${FAR_L} ${REAR_TOP} C156 75, 180 70, 196 72 C206 73, 210 70, 218 71
  C236 74, 252 69, ${FAR_R} ${REAR_TOP}
  C272 100, 271 131, ${FAR_R} ${REAR_BOT} C240 162, 160 162, ${FAR_L} ${REAR_BOT}
  C129 131, 128 100, ${FAR_L} ${REAR_TOP} Z`;

/** The apse the lectern stands in — a carved arch, deeper and darker. */
const APSE = `M160 ${REAR_BOT} C159 138, 159 118, 161 105
  C164 89, 178 79, 200 77 C222 79, 236 89, 239 105
  C241 118, 241 138, 240 ${REAR_BOT} Z`;

/** The crack in the vault — the one cold light in a dormant library. */
const CRACK = `M192 0 L196 7 L193 13 L198 19 L203 15 L201 8 L207 2 L204 0 Z`;
const SHAFT = `M191 0 L206 0 C214 44, 220 96, 223 141 L174 143 C179 96, 185 44, 191 0 Z`;

/** Shallow arched recesses flanking the apse, so the back wall is a
 *  wall of books rather than a lit panel. */
const REAR_SHELVES = [
  { x0: 132, x1: 157, y: 104, seed: 4 }, { x0: 132, x1: 157, y: 132, seed: 12 },
  { x0: 243, x1: 268, y: 100, seed: 23 }, { x0: 243, x1: 268, y: 128, seed: 31 },
];

/** A run of little spines across a rear recess, ragged and uneven. */
function tinyRow(x0: number, x1: number, y: number, seed: number): string {
  let d = `M${x0 + 1} ${y - 0.4}`;
  let x = x0 + 1;
  let k = 0;
  while (x < x1 - 2.5) {
    const w = 1.4 + rnd(seed + k * 2.7) * 2.2;
    const h = 5.5 + rnd(seed + k * 5.1) * 3.4;
    d += ` L${x.toFixed(1)} ${(y - h).toFixed(1)} L${(x + w).toFixed(1)} ${(y - h + (rnd(seed + k) - 0.5) * 1.2).toFixed(1)} L${(x + w).toFixed(1)} ${(y - 0.5).toFixed(1)}`;
    x += w + 0.35;
    k++;
  }
  return d + ` L${x.toFixed(1)} ${(y - 0.5).toFixed(1)} Z`;
}

// ─── CRYSTALS ────────────────────────────────────────────────────────

interface Cluster { x: number; y: number; n: number; scale: number; seed: number }

const CLUSTERS: Cluster[] = [
  { x: 78, y: 22, n: 4, scale: 1.0, seed: 2 },
  { x: 150, y: 12, n: 3, scale: 0.74, seed: 9 },
  { x: 256, y: 11, n: 3, scale: 0.8, seed: 5 },
  { x: 322, y: 26, n: 4, scale: 1.02, seed: 13 },
];

/** One shard hanging from the vault, base at the origin, growing along
 *  +y. Long, narrow and slightly bent — quartz, not a tooth. */
function shardPath(len: number, wid: number, seed: number): string {
  const w = wid * (0.7 + rnd(seed) * 0.5);
  const bend = (rnd(seed + 4) - 0.5) * 1.6;
  return `M${-w} 0 C${-w * 0.9 + bend} ${len * 0.36}, ${-w * 0.5 + bend} ${len * 0.66}, ${-w * 0.12 + bend * 1.3} ${len}`
    + ` C${w * 0.22 + bend * 1.2} ${len * 0.72}, ${w * 0.6 + bend * 0.6} ${len * 0.4}, ${w * 0.88} ${len * 0.1} Z`;
}

// ─── INK MARKS ───────────────────────────────────────────────────────
// Half-written strokes, not glyph clip-art. They read as handwriting
// coming off the page, which is what a library of voices should shed.

const MARKS = [
  "M0 0 C1.4-2.2, 3.2-3.6, 4.8-3.2",
  "M0-1 C1.8-3.6, 3.6-1.2, 5.4-3.2",
  "M0 0 C0.8-2.8, 2.8-3.8, 4.2-2.6 M1.6-1.8 L3.6-2",
  "M0-2 C1.6-4.2, 3.6-3, 3.6-1 C3.6 0.6, 1.8 0.6, 1.4-0.8",
  "M0-0.4 C1-2.6, 2.4-4, 3.8-4.2 M1.4-2.6 C2.4-1.6, 3.4-1.2, 4.4-1.4",
  "M0-3.2 C1.4-1.4, 3.2-1.4, 4.6-3.2 M4.6-3.2 L4.4-0.6",
];

/** Marks of speech rising off the spread and the risen books. */
const EMBERS = [
  { x: 186, y: 128, ey: 44, drift: -14, g: 0, delay: 0.56, sc: 0.9 },
  { x: 208, y: 124, ey: 34, drift: 8, g: 2, delay: 0.61, sc: 0.8 },
  { x: 216, y: 132, ey: 56, drift: 14, g: 4, delay: 0.66, sc: 0.95 },
  { x: 192, y: 126, ey: 28, drift: -6, g: 1, delay: 0.71, sc: 0.75 },
  { x: 176, y: 132, ey: 64, drift: -22, g: 3, delay: 0.76, sc: 1.0 },
  { x: 224, y: 132, ey: 60, drift: 22, g: 5, delay: 0.81, sc: 0.98 },
  { x: 200, y: 122, ey: 24, drift: 3, g: 0, delay: 0.87, sc: 0.7 },
  { x: 190, y: 134, ey: 50, drift: -18, g: 5, delay: 0.93, sc: 0.86 },
];

/** Carved marks on the rear wall, around the apse. The walls kept a copy. */
const CARVED = [
  { x: 146, y: 92, g: 1 }, { x: 148, y: 118, g: 4 }, { x: 152, y: 143, g: 0 },
  { x: 246, y: 88, g: 2 }, { x: 250, y: 114, g: 5 }, { x: 245, y: 141, g: 3 },
];

// Books that never made it back to a shelf. Weighted left — the room
// should not read as its own mirror image.
const FALLEN = [
  { x: 160, y: 163, w: 16, h: 3.6, rot: -4 },
  { x: 166, y: 159.4, w: 13, h: 3, rot: 3 },
  { x: 163.5, y: 156.4, w: 10, h: 2.6, rot: -6 },
  { x: 118, y: 176, w: 26, h: 5.4, rot: 4 },
  { x: 123, y: 170.8, w: 21, h: 4.6, rot: -3 },
  { x: 234, y: 163.6, w: 15, h: 3.4, rot: 5 },
];

const DUST_CONFIG = {
  count: 18,
  bounds: { x: 130, y: 26, width: 140, height: 116 },
  colors: ["#e8d0a8", "#d8b890", "#e0c8b0", "#c8a0b8"],
  sizeRange: [0.3, 0.8] as [number, number],
  speedRange: [1, 3] as [number, number],
  driftX: 0.4,
  driftY: -2.4,
  lifeRange: [5, 10] as [number, number],
};

const ease = (t: number) => t * t * (3 - 2 * t);

// ─── THE TOME'S GEOMETRY ─────────────────────────────────────────────
// One hinge line, x = 200, shared by every part of the book: the spine,
// the front board, the page block, every leaf that crosses the gutter.
// A sheet is written once as a function of how far it reaches from that
// line and which side of it that is, so the shut block, the two halves
// of the finished spread and the leaves turning between them are all
// literally the same sheet at different angles. Nothing in the opening
// fades in or out — the same two boards and one stack of paper are on
// screen from the first frame to the last, seen from a turning angle.

const HINGE = 200;
const PAGE_W = 31;      // a page's reach from the spine
const BOARD_W = 33;     // the boards' reach — they overhang the paper

/** One leaf: `w` units of reach, `s` = +1 right of the spine / −1 left.
 *  `lift` bows the free edge up, for a leaf caught mid-turn. */
function leafFace(w: number, s: number, lift = 0): string {
  const X = (u: number) => (HINGE + s * u).toFixed(2);
  const Y = (y: number, k: number) => (y - lift * k).toFixed(2);
  return `M200 ${Y(101.4, 0)}
    C${X(w * 0.24)} ${Y(100.3, 0.5)}, ${X(w * 0.54)} ${Y(99.8, 0.9)}, ${X(w * 0.76)} ${Y(100.3, 1)}
    C${X(w * 0.88)} ${Y(100.6, 0.98)}, ${X(w * 0.97)} ${Y(101.2, 0.92)}, ${X(w * 1.02)} ${Y(102.5, 0.86)}
    C${X(w * 1.06)} ${Y(111.4, 0.6)}, ${X(w * 1.07)} ${Y(127.0, 0.34)}, ${X(w * 1.03)} ${Y(138.2, 0.2)}
    C${X(w * 0.97)} ${Y(140.4, 0.18)}, ${X(w * 0.86)} ${Y(141.5, 0.15)}, ${X(w * 0.73)} ${Y(141.9, 0.12)}
    C${X(w * 0.5)} ${Y(142.5, 0.08)}, ${X(w * 0.22)} ${Y(142.4, 0.04)}, 200 ${Y(141.7, 0)} Z`;
}

/** The leaf-edges stacked under a page — `d` units of paper. */
function leafStack(w: number, s: number, d: number): string {
  const X = (u: number) => (HINGE + s * u).toFixed(2);
  const D = (y: number) => (y + d).toFixed(2);
  return `M200 141.7 C${X(w * 0.22)} 142.4, ${X(w * 0.5)} 142.5, ${X(w * 0.73)} 141.9
    C${X(w * 0.86)} 141.5, ${X(w * 0.97)} 140.4, ${X(w * 1.03)} 138.2
    L${X(w * 1.03)} ${D(138.2)} C${X(w * 0.97)} ${D(140.4)}, ${X(w * 0.86)} ${D(141.5)}, ${X(w * 0.73)} ${D(141.9)}
    C${X(w * 0.5)} ${D(142.5)}, ${X(w * 0.22)} ${D(142.4)}, 200 ${D(141.7)} Z`;
}

/** The fore-edge striations that say "many leaves, not one card". */
function foreEdge(w: number, s: number): string[] {
  const X = (u: number) => (HINGE + s * u).toFixed(2);
  return [0, 1, 2, 3, 4].map((k) => {
    const y = 105 + k * 7.4;
    return `M${X(w * 0.955)} ${y} C${X(w * 0.99)} ${(y + 0.7).toFixed(1)}, ${X(w * 1.015)} ${(y + 1.5).toFixed(1)}, ${X(w * 1.025)} ${(y + 2.7).toFixed(1)}`;
  });
}

/** The front board, hand-drawn once with a dead-straight hinge edge so
 *  the cosine scale about x = 200 is a true rotation about the spine. */
const BOARD_FRONT = `M200 98.2
  C205.6 97.2, 212.4 96.7, 219.2 96.8
  C223.8 96.9, 227.8 97.4, 231.0 98.6
  C231.9 104.8, 232.4 112.4, 233.0 123.0
  C232.4 133.6, 231.9 140.8, 231.0 146.0
  C227.8 147.2, 223.8 147.7, 219.2 147.8
  C212.4 147.9, 205.6 147.4, 200 146.4 Z`;

/** The back board, a shade wider — the rim you see round the paper. */
const BOARD_BACK = `M199.0 97.4
  C205.2 96.3, 212.6 95.8, 219.8 95.9
  C224.6 96.0, 228.8 96.6, 232.2 97.9
  C233.1 104.4, 233.6 112.4, 233.8 123.2
  C233.6 134.2, 233.1 141.6, 232.2 147.0
  C228.8 148.3, 224.6 148.9, 219.8 149.0
  C212.6 149.1, 205.2 148.6, 199.0 147.5 Z`;

/** The rounded back of the book, standing on the hinge line. It never
 *  moves. Everything else turns around it, which is what keeps the
 *  swinging board reading as attached rather than flying off. */
const SPINE_BACK = `M200.6 97.9
  C198.6 97.6, 196.9 98.7, 196.5 100.8
  C195.9 111.4, 195.9 135.0, 196.5 145.0
  C196.9 147.1, 198.6 148.1, 200.6 147.8
  C199.7 131.4, 199.7 114.4, 200.6 97.9 Z`;

/** Leaves crossing the gutter, one after another. Each turns on the
 *  same hinge as the board did — the motion the player just watched,
 *  repeated small four times, so the parting is the same idea again. */
const LEAVES = [
  { s: 0.262, d: 0.100 },
  { s: 0.302, d: 0.100 },
  { s: 0.342, d: 0.100 },
  { s: 0.380, d: 0.095 },
];

/**
 * The dust lives in its own memo'd component on purpose. `useParticles`
 * notifies about twelve times a second; called from the scene body it
 * would reconcile every shelf, book and shard at that rate, which is
 * exactly the main-thread budget the Glow layer's FPS probe is
 * measuring. Down here only the dust re-renders.
 */
const Dust = memo(function Dust({ active, alpha }: { active: boolean; alpha: number }) {
  const particles = useParticles(DUST_CONFIG, active);
  return <ParticleField particles={particles} opacity={alpha} />;
});

function LibraryScene({ progress: p }: SceneProps) {
  // Phrase 1 — "open, sleeping pages". One motion, five stages a person
  // can name: the clasps let go; the front board hinges on the spine,
  // its width foreshortening with the cosine of the angle; it passes
  // edge-on, a dark sliver standing on the hinge; it comes down on the
  // far side inside-face-up; the leaves cross the gutter one after
  // another into the spread — and only then does the spread take light.
  const claspP = ease(sub(p, 0.006, 0.052));       // the catches let go
  const hingeQ = sub(p, 0.045, 0.275);             // 0 → 1 over p .045–.32
  const coverA = 172 * (0.8 * hingeQ + 0.2 * ease(hingeQ));  // degrees
  const cosA = Math.cos((coverA * Math.PI) / 180); //  1 → 0 → −0.99
  const partP = ease(sub(p, 0.28, 0.17));          // leaves cross the gutter
  // How far the book has been opened, read straight off the hinge: 0
  // shut, ½ edge-on, 1 flat. The light the shut book was holding gets
  // out in proportion — a warmth on the exposed paper, not a lamp yet.
  const wakeP = (1 - cosA) / 2;
  const pageP = ease(sub(p, 0.36, 0.14));   // the spread takes light
  // Phrase 2 — "rise, every voice, and speak as one"
  const voiceP = ease(sub(p, 0.50, 0.34));  // threads climb and braid
  const chorusP = sub(p, 0.58, 0.42);       // crystals answer, marks climb

  // How much tome light is loose in the room.
  const warm = 0.09 * wakeP + 0.29 * pageP + 0.62 * voiceP;
  const t = (pair: Pair, k = 1) => rgbMix(pair, warm * k);

  // The book's own reach left of the hinge: the spine's bulge while it
  // is shut, the swung board once that board is past edge-on, the left
  // page once there is one. Centring the whole footprint on the lectern
  // from that keeps the tome under the shaft the whole way open; the
  // slide is fastest while the board is edge-on and there is least for
  // the eye to hold on to.
  const leftW = PAGE_W * partP;
  const boardReach = BOARD_W * Math.abs(cosA);
  const leftReach = Math.max(3.5, leftW, cosA < 0 ? boardReach : 0);
  const dx = leftReach / 2 - 16.9;
  // Board scale about the hinge. Signed: past 90° the cosine goes
  // negative and lays the same board down on the far side, which is
  // the whole trick. Floored so it is never zero-width — edge-on you
  // should still see the thickness of the board.
  const boardScale = (cosA >= 0 ? 1 : -1) * Math.max(0.05, Math.abs(cosA));
  const outerFace = Math.min(1, Math.max(0, (cosA - 0.05) / 0.16));
  const innerFace = Math.min(1, Math.max(0, (-cosA - 0.05) / 0.16));
  const rayTop = 118 - 84 * voiceP;

  // The paper's own colour. It is dark in a dark room, warms a little
  // as the opening lets the light out, and only becomes ivory once the
  // spread exists to hold it.
  const paper = `hsl(${42 - 6 * voiceP}, ${16 + 10 * wakeP + 28 * pageP}%, ${16 + 10 * wakeP + 44 * pageP + 8 * voiceP}%)`;
  const stackFill = `hsl(36, ${14 + 10 * wakeP + 20 * pageP}%, ${11 + 9 * wakeP + 26 * pageP}%)`;
  const edgeStroke = `hsl(34, 18%, ${10 + 8 * wakeP + 22 * pageP}%)`;
  const inkStroke = `hsl(${30 - 4 * voiceP}, ${22 + 14 * voiceP}%, ${26 + 8 * voiceP}%)`;

  /** One half of the book: its stack, its face, its fore-edge, its
   *  crease and its writing. The shut block and both halves of the
   *  finished spread are this same call at different widths. */
  const page = (w: number, s: number, d: number, key: string) => {
    const X = (u: number) => (200 + s * u).toFixed(2);
    return (
      <g key={key}>
        <path d={leafStack(w, s, d)} fill={stackFill} />
        <path d={leafFace(w, s)} fill={paper} />
        {/* the page turns down into the gutter — without this the two
            halves are flat cards and the book has no thickness */}
        <path d={leafFace(w, s)} fill={`url(#v2libGutter${s > 0 ? "R" : "L"})`} />
        <g stroke={edgeStroke} strokeWidth={0.55} fill="none" opacity={0.85}>
          {foreEdge(w, s).map((fe, k) => <path key={k} d={fe} />)}
        </g>
        {/* a shallow crease down the outer third — the paper has a
            surface without a turned corner stuck on it */}
        {w > 10 && (
          <path d={`M${X(w - 5.5)} 103.2 C${X(w - 4.2)} 112, ${X(w - 4.6)} 126, ${X(w - 3.4)} 137.6`}
            fill="none" stroke={`hsl(38, ${14 + 18 * pageP}%, ${26 + 26 * pageP}%)`}
            strokeWidth={0.45} opacity={0.5} />
        )}
        {w > 12 && [0, 1, 2, 3, 4, 5, 6].map((k) => {
          const yy = 106.4 + k * 4.5;
          const len = (w - 7) * (k === 6 ? 0.55 : 0.82 + 0.14 * rnd(k + s));
          return (
            <path key={k} d={`M${X(4.4)} ${yy} C${X(4.4 + len * 0.4)} ${yy - 0.7}, ${X(4.4 + len * 0.7)} ${yy - 0.5}, ${X(4.4 + len)} ${yy + 0.4}`}
              fill="none" stroke={inkStroke} strokeWidth={0.45 + 0.2 * voiceP}
              opacity={(0.22 + 0.54 * pageP) * Math.min(1, (w - 10) / 8)} />
          );
        })}
        {/* the previous scribe's seal, on the last page they reached */}
        {s === 1 && pageP > 0.02 && (
          <path d="M221.4 131.6 C223.2 131.0, 224.8 132.0, 224.7 133.5 C224.6 135.0, 222.9 135.8, 221.6 135.1 C220.3 134.5, 220.2 132.1, 221.4 131.6 Z"
            fill={`hsl(8, ${20 + 14 * pageP}%, ${20 + 10 * pageP}%)`} opacity={0.5 * pageP} />
        )}
      </g>
    );
  };

  /** The front board, scaled about the hinge by the cosine of its
   *  angle. Past 90° the cosine goes negative, which lays the same
   *  board down on the far side and turns it over — so the outside
   *  face crossfades to the pastedown at exactly the moment the board
   *  is edge-on and neither face is really visible anyway. */
  const frontBoard = (
    <g transform={`translate(200 0) scale(${boardScale.toFixed(4)} 1) translate(-200 0)`}>
      <path d={BOARD_FRONT} fill={`hsl(${16 + 8 * p}, ${18 + 12 * p}%, ${8.5 + 8 * p}%)`} />
      {/* the outside: tooled border, the scribes' stave, corner bosses */}
      {outerFace > 0.01 && (
        <g opacity={outerFace}>
          <path d="M205.4 103.6 C211.4 102.5, 219.6 102.3, 226.6 103.4
                   C228.9 103.8, 229.7 105.0, 229.9 107.4
                   C230.2 116.0, 230.2 129.6, 229.9 137.2
                   C229.7 139.6, 228.9 140.7, 226.6 141.1
                   C219.6 142.2, 211.4 142.0, 205.4 140.9
                   C204.5 132.2, 204.5 112.2, 205.4 103.6 Z"
            fill="none" stroke={`hsl(42, ${24 + 26 * p}%, ${24 + 26 * p}%)`} strokeWidth={0.55} opacity={0.55} />
          <g stroke={`hsl(44, ${30 + 26 * p}%, ${28 + 24 * p}%)`} strokeWidth={0.75} strokeLinecap="round" fill="none" opacity={0.8}>
            <path d="M217.4 112.4 C217.0 118.4, 217.0 126.0, 217.4 131.8" />
            <path d="M217.4 116.0 L221.6 115.0 M217.4 121.4 L221.8 120.6 M217.4 126.8 L221.4 126.2
                     M217.2 118.6 L213.6 117.8 M217.2 124.2 L213.4 123.6" />
          </g>
          {[[206.8, 105.2], [225.4, 105.2], [206.8, 136.6], [225.4, 136.6]].map(([bx, by], k) => (
            <path key={k} d={`M${bx} ${by} C${bx + 2.4} ${by - 0.6}, ${bx + 3.4} ${by + 0.6}, ${bx + 2.8} ${by + 2.4} L${bx + 0.6} ${by + 2} Z`}
              fill={`hsl(40, 24%, ${20 + 18 * p}%)`} opacity={0.55} />
          ))}
          {/* the seam of light the shut book was holding, showing at the
              fore-edge the moment the catches let go */}
          <path d="M231.0 99.4 C231.9 105.4, 232.4 113.2, 233.0 123.0 C232.4 133.4, 231.9 140.6, 231.0 145.2"
            fill="none" stroke="#ffd79a" strokeWidth={0.7} strokeLinecap="round"
            opacity={0.55 * claspP * Math.max(0, 1 - 2.6 * wakeP)} />
        </g>
      )}
      {/* the inside: pastedown, gutter shadow, and the plate the last
          scribe wrote their name on */}
      {innerFace > 0.01 && (
        <g opacity={innerFace}>
          {/* The pastedown is deliberately much darker than the paper.
              An open board that matches the pages just reads as a third
              page, which is how the left half stopped saying "cover". */}
          <path d="M204.6 101.6 C211 100.6, 221.8 100.4, 228.6 101.4
                   C229.5 111.8, 229.8 133.0, 228.6 142.4
                   C221.8 143.4, 211 143.2, 204.6 142.2
                   C203.8 129.0, 203.8 115.0, 204.6 101.6 Z"
            fill={`hsl(32, ${13 + 10 * pageP}%, ${8.5 + 3 * wakeP + 14 * pageP}%)`} />
          <path d="M204.6 101.6 C207.4 101.2, 210.4 100.9, 213.4 100.8
                   C212.6 115.0, 212.6 129.0, 213.4 143.0
                   C210.4 142.9, 207.4 142.6, 204.6 142.2
                   C203.8 129.0, 203.8 115.0, 204.6 101.6 Z"
            fill="#080604" opacity={0.5} />
          <g opacity={0.4 + 0.35 * pageP}>
            <path d="M216.6 113.4 C220.2 112.9, 224.8 112.9, 227.4 113.5
                     C227.9 117.2, 227.9 122.4, 227.4 125.8
                     C224.8 126.4, 220.2 126.4, 216.6 125.9
                     C216.1 122.2, 216.1 117.0, 216.6 113.4 Z"
              fill="none" stroke={`hsl(40, 22%, ${20 + 22 * pageP}%)`} strokeWidth={0.45} />
            {[116.8, 119.8, 122.8].map((yy, k) => (
              <path key={yy} d={`M218.4 ${yy} C220.6 ${yy - 0.4}, 223.6 ${yy - 0.3}, ${k === 2 ? 224.4 : 225.6} ${yy + 0.3}`}
                fill="none" stroke={`hsl(34, 20%, ${19 + 20 * pageP}%)`} strokeWidth={0.4} opacity={0.7} />
            ))}
          </g>
        </g>
      )}
      {/* the free edge catching the shaft as the board turns through it */}
      <path d="M231.0 99.4 C231.9 105.4, 232.4 113.2, 233.0 123.0 C232.4 133.4, 231.9 140.6, 231.0 145.2"
        fill="none" stroke="#c8bfae" strokeWidth={0.5} strokeLinecap="round"
        opacity={0.34 * (1 - Math.abs(Math.abs(cosA) * 2 - 1))} />
    </g>
  );

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* No SVG filters anywhere in this scene on purpose. A full-frame
            gaussian on the tome cost more per repaint than every other
            path put together and pushed the Glow layer's FPS probe under
            its cutoff; radial gradients carry the halos instead. */}
        <linearGradient id="v2libAir" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t(P.airTop)} />
          <stop offset="100%" stopColor={t(P.airBot)} />
        </linearGradient>

        {/* Near end dark, far end lit — the light model baked into the
            architecture so the frame corners never come up. */}
        <linearGradient id="v2libWallL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={t(P.wallNear)} />
          <stop offset="62%" stopColor={t(P.wallNear, 0.5)} />
          <stop offset="100%" stopColor={t(P.wallFar)} />
        </linearGradient>
        <linearGradient id="v2libWallR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={t(P.wallNear)} />
          <stop offset="62%" stopColor={t(P.wallNear, 0.5)} />
          <stop offset="100%" stopColor={t(P.wallFar)} />
        </linearGradient>
        <linearGradient id="v2libNicheL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={t(P.nicheNear)} />
          <stop offset="100%" stopColor={t(P.nicheFar)} />
        </linearGradient>
        <linearGradient id="v2libNicheR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={t(P.nicheNear)} />
          <stop offset="100%" stopColor={t(P.nicheFar)} />
        </linearGradient>
        <linearGradient id="v2libLedgeL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={t(P.ledgeNear)} />
          <stop offset="100%" stopColor={t(P.ledgeFar)} />
        </linearGradient>
        <linearGradient id="v2libLedgeR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={t(P.ledgeNear)} />
          <stop offset="100%" stopColor={t(P.ledgeFar)} />
        </linearGradient>
        <linearGradient id="v2libFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t(P.floorFar)} />
          <stop offset="46%" stopColor={t(P.floorNear, 0.7)} />
          <stop offset="100%" stopColor={t(P.floorNear)} />
        </linearGradient>

        {/* The cold thread through the crack — the dormant light. */}
        <linearGradient id="v2libShaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8c4e8" stopOpacity={0.15} />
          <stop offset="60%" stopColor="#8aa8d8" stopOpacity={0.065} />
          <stop offset="100%" stopColor="#7c9acc" stopOpacity={0} />
        </linearGradient>

        {/* Voice threads: brightest at the spread, gone by the vault. */}
        <linearGradient id="v2libRay" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity={0.36} />
          <stop offset="45%" stopColor="#ffc890" stopOpacity={0.17} />
          <stop offset="100%" stopColor="#ffe0b8" stopOpacity={0} />
        </linearGradient>

        <radialGradient id="v2libBraid" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff0d0" stopOpacity={0.40 * voiceP} />
          <stop offset="45%" stopColor="#ffd090" stopOpacity={0.15 * voiceP} />
          <stop offset="100%" stopColor="#ffc880" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="v2libTomeHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffdca8" stopOpacity={0.06 * wakeP + 0.30 * pageP + 0.16 * voiceP} />
          <stop offset="50%" stopColor="#ffbc70" stopOpacity={0.02 * wakeP + 0.10 * pageP + 0.08 * voiceP} />
          <stop offset="100%" stopColor="#ffb060" stopOpacity={0} />
        </radialGradient>

        {/* A page turns into the gutter, so it is darkest at the spine
            and opens toward its fore-edge. Two gradients rather than
            one because the left half's spine is on its right. */}
        <linearGradient id="v2libGutterR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#150e06" stopOpacity={0.42} />
          <stop offset="26%" stopColor="#150e06" stopOpacity={0.13} />
          <stop offset="62%" stopColor="#150e06" stopOpacity={0} />
          <stop offset="100%" stopColor="#150e06" stopOpacity={0.10} />
        </linearGradient>
        <linearGradient id="v2libGutterL" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#150e06" stopOpacity={0.42} />
          <stop offset="26%" stopColor="#150e06" stopOpacity={0.13} />
          <stop offset="62%" stopColor="#150e06" stopOpacity={0} />
          <stop offset="100%" stopColor="#150e06" stopOpacity={0.10} />
        </linearGradient>

        <radialGradient id="v2libBookHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd7a0" stopOpacity={0.24} />
          <stop offset="100%" stopColor="#ffc080" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="v2libCrystalHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c7a6e4" stopOpacity={0.13 * chorusP} />
          <stop offset="100%" stopColor="#a878e0" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── AIR ── */}
      <rect width="400" height="250" fill="url(#v2libAir)" />

      {/* ── REAR WALL + APSE ── */}
      <path d={REAR} fill={t(P.rear)} />
      {/* Shallow rear shelves flanking the apse. */}
      {REAR_SHELVES.map((r, i) => {
        const w = 0.14 + 0.86 * illum((r.x0 + r.x1) / 2, r.y - 5) * warm;
        const mid = (r.x0 + r.x1) / 2;
        return (
          <g key={`rs${i}`}>
            {/* a shallow recess, softly arched — not a mouse hole */}
            <path d={`M${r.x0} ${r.y} L${r.x0} ${r.y - 8.6} C${r.x0 + 4} ${r.y - 11.4}, ${mid} ${r.y - 12}, ${mid + 5} ${r.y - 11.6}
                      C${r.x1 - 2} ${r.y - 11.2}, ${r.x1} ${r.y - 10}, ${r.x1} ${r.y - 8} L${r.x1} ${r.y - 1} Z`}
              fill={t(P.nicheFar, 0.55)} />
            <path d={tinyRow(r.x0, r.x1, r.y, r.seed)}
              fill={`hsl(${30 + 8 * w}, ${10 + 30 * w}%, ${9 + 26 * w}%)`} />
            <path d={`M${r.x0 - 1} ${r.y} C${mid} ${r.y + 0.6}, ${mid} ${r.y - 0.4}, ${r.x1 + 1} ${r.y - 1}
                      L${r.x1 + 1} ${r.y + 0.8} C${mid} ${r.y + 1.4}, ${mid} ${r.y + 2.2}, ${r.x0 - 1} ${r.y + 2} Z`}
              fill={t(P.ledgeFar, 0.7)} />
          </g>
        );
      })}
      {/* Pilasters on the room corners — they break the seam where the
          rear wall meets the banks, which otherwise reads as a panel. */}
      {[FAR_L, FAR_R].map((x, i) => (
        <path key={`pl${i}`}
          d={`M${x - 3.4} ${REAR_TOP + 1} C${x - 2.6} ${REAR_TOP + 30}, ${x - 2.8} ${REAR_TOP + 60}, ${x - 3.6} ${REAR_BOT}
             L${x + 3.6} ${REAR_BOT} C${x + 2.8} ${REAR_TOP + 60}, ${x + 2.6} ${REAR_TOP + 30}, ${x + 3.4} ${REAR_TOP + 1} Z`}
          fill={t(P.stoneDim, 0.9)} opacity={0.85} />
      ))}
      <path d={APSE} fill={t(P.apse)} />
      <path d={APSE} fill="none" stroke={t(P.stone, 0.9)} strokeWidth={0.9} opacity={0.22 + 0.24 * warm} />
      {/* Carved marks — the walls kept a copy of every word. */}
      {CARVED.map((c, i) => (
        <path key={`cv${i}`} d={MARKS[c.g]} fill="none" stroke={t(P.carve)}
          strokeWidth={0.7} strokeLinecap="round" opacity={0.3 + 0.5 * chorusP}
          transform={`translate(${c.x}, ${c.y}) scale(1.05)`} />
      ))}

      {/* ── VAULT ── */}
      <path d={VAULT} fill={t(P.vault)} />
      {/* Ribs running back to the vanishing point. */}
      {[[0, 6], [80, 0], [320, 0], [400, 6]].map(([x0, dy], i) => (
        <path key={`rib${i}`}
          d={`M${x0} ${dy} C${(x0 + VP.x * 1.4) / 2.4} ${20 + i * 2}, ${(x0 + VP.x * 1.1) / 2.1} ${44 + i}, ${x0 < 200 ? FAR_L + 8 * i : FAR_R - 8 * (3 - i)} ${REAR_TOP - 1}`}
          fill="none" stroke={t(P.stone, 0.5)} strokeWidth={0.7} opacity={0.16 + 0.12 * warm} />
      ))}
      {/* The crack, and the cold thread falling through it. */}
      <path d={CRACK} fill="#9db8dc" opacity={0.30 - 0.20 * warm} />
      <path d={SHAFT} fill="url(#v2libShaft)" opacity={0.9 - 0.76 * pageP} />

      {/* ── SIDE WALLS ── */}
      <path d={WALL_L} fill="url(#v2libWallL)" />
      <path d={WALL_R} fill="url(#v2libWallR)" />
      {/* Rock strata — this room was cut, not built. */}
      {[30, 70, 118, 156].map((y, i) => (
        <g key={`st${i}`} opacity={0.13 + 0.12 * warm}>
          <path d={`M0 ${y + 6} C34 ${y + 2}, 68 ${y - 1}, ${FAR_L - 4} ${y * 0.34 + 66}`}
            fill="none" stroke={t(P.stone, 0.6)} strokeWidth={0.55} />
          <path d={`M400 ${y + 10} C366 ${y + 5}, 332 ${y + 2}, ${FAR_R + 4} ${y * 0.34 + 68}`}
            fill="none" stroke={t(P.stone, 0.6)} strokeWidth={0.55} />
        </g>
      ))}

      {/* ── SHELF NICHES (recessed) ── */}
      {SHELVES.map((sh, i) => {
        const hNear = 46, hFar = 46 * 0.35;
        return (
          <path key={`ni${i}`}
            d={`M${sh.nearX} ${sh.yNear} L${sh.farX} ${sh.yFar} L${sh.farX} ${sh.yFar - hFar} L${sh.nearX} ${sh.yNear - hNear} Z`}
            fill={sh.side < 0 ? "url(#v2libNicheL)" : "url(#v2libNicheR)"} />
        );
      })}

      {/* ── FAR ROWS — packed spines, too distant to count ── */}
      {FAR_ROWS.map((r, i) => {
        const w = 0.11 + 0.89 * r.lit * warm;
        return (
          <g key={`fr${i}`}>
            <path d={r.d} fill={`hsl(${28 + 8 * w}, ${9 + 30 * w}%, ${6 + 20 * w}%)`} />
            {r.ticks.map((tk, k) => (
              <path key={k} d={tk} fill="none" stroke={`hsl(40, ${10 + 24 * w}%, ${3 + 15 * w}%)`} strokeWidth={0.4} opacity={0.55} />
            ))}
          </g>
        );
      })}

      {/* ── BOOKS ── */}
      {BOOKS.map((b, i) => {
        const gone = b.rise >= 0 && sub(p, FLIGHTS[b.rise].delay, 0.04) > 0;
        if (gone) return null;
        const w = 0.13 + 0.87 * b.lit * warm;
        const spine = `hsl(${b.hue}, ${6 + b.sat * w}%, ${5.6 + 1.4 * (1 - b.s) + 22 * w}%)`;
        const pages = `hsl(${42 - 4 * w}, ${12 + 26 * w}%, ${9.5 + 44 * w}%)`;
        const flip = b.side < 0 ? 1 : -1;
        return (
          <g key={`bk${i}`} transform={`translate(${b.x + (flip < 0 ? b.w : 0)}, ${b.y}) scale(${flip}, 1) rotate(${b.lean * flip})`}>
            <path d={spinePath(b.w, b.h, b.dome)} fill={spine} />
            <path d={pagePath(b.w, b.h)} fill={pages} />
            {b.h > 13 && (
              <path d={labelPath(b.w, b.h)}
                fill={`hsl(${40 + 4 * w}, ${10 + 34 * w}%, ${4 + 30 * w}%)`} opacity={0.75} />
            )}
          </g>
        );
      })}

      {/* A pile someone left lying flat on the left bank, so the two
          walls are not each other's mirror. */}
      {[0, 1, 2].map((k) => {
        const w = 0.13 + 0.87 * illum(74, 92) * warm;
        return (
          <path key={`pile${k}`}
            d={`M${62 - k * 1.6} ${96 - k * 4.6} C${70 - k} ${94.4 - k * 4.6}, ${82 + k} ${94 - k * 4.6}, ${92 + k * 1.4} ${95.4 - k * 4.6}
               C${92 + k * 1.4} ${99 - k * 4.6}, ${92 + k * 1.4} ${99.4 - k * 4.6}, ${91 + k * 1.4} ${100 - k * 4.6}
               C${82 + k} ${99 - k * 4.6}, ${70 - k} ${99.4 - k * 4.6}, ${62 - k * 1.6} ${100.6 - k * 4.6} Z`}
            fill={`hsl(${16 + 20 * k + 10 * w}, ${10 + 28 * w}%, ${6 + 18 * w}%)`} />
        );
      })}

      {/* ── LEDGES (front lip, over the book bases) ── */}
      {SHELVES.map((sh, i) => (
        <path key={`ld${i}`}
          d={`M${sh.nearX} ${sh.yNear} C${sh.nearX + (sh.farX - sh.nearX) * 0.45} ${sh.yNear + (sh.yFar - sh.yNear) * 0.45 + 0.9}, ${sh.nearX + (sh.farX - sh.nearX) * 0.75} ${sh.yNear + (sh.yFar - sh.yNear) * 0.75 + 0.6}, ${sh.farX} ${sh.yFar}
             L${sh.farX} ${sh.yFar + 1.6} C${sh.nearX + (sh.farX - sh.nearX) * 0.75} ${sh.yNear + (sh.yFar - sh.yNear) * 0.75 + 3.2}, ${sh.nearX + (sh.farX - sh.nearX) * 0.45} ${sh.yNear + (sh.yFar - sh.yNear) * 0.45 + 4.2}, ${sh.nearX} ${sh.yNear + 6} Z`}
          fill={sh.side < 0 ? "url(#v2libLedgeL)" : "url(#v2libLedgeR)"} />
      ))}

      {/* ── LADDER against the right bank ── */}
      <g opacity={0.75}>
        {[0, 1].map((k) => (
          <path key={`lr${k}`}
            d={`M${334 - k * 15} 196 C${330 - k * 14} 170, ${318 - k * 12} 140, ${300 - k * 10} 104
               L${302.6 - k * 10} 103.4 C${320.6 - k * 12} 139.6, ${332.6 - k * 14} 169.6, ${336.6 - k * 15} 195.6 Z`}
            fill={t(P.stoneDim, 0.8)} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const tt = 0.1 + k * 0.155;
          const x1 = 334 - tt * 34, y1 = 196 - tt * 92;
          const x2 = 319 - tt * 34, y2 = 193 - tt * 90;
          return (
            <path key={`rg${k}`} d={`M${x1} ${y1} L${x2} ${y2} L${x2} ${y2 + 1.4} L${x1} ${y1 + 1.6} Z`}
              fill={t(P.stoneDim, 0.7)} />
          );
        })}
      </g>

      {/* ── FLOOR ── */}
      <path d={FLOOR} fill="url(#v2libFloor)" />
      {[0.22, 0.45, 0.7].map((k, i) => {
        const yL = REAR_BOT + (250 - REAR_BOT) * k;
        const xL = FAR_L - FAR_L * k;
        return (
          <path key={`fs${i}`} d={`M${xL} ${yL} C140 ${REAR_BOT + (yL - REAR_BOT) * 0.35}, 260 ${REAR_BOT + (yL - REAR_BOT) * 0.35}, ${400 - xL} ${yL}`}
            fill="none" stroke={t(P.stone, 0.45)} strokeWidth={0.5} opacity={0.16 + 0.12 * warm} />
        );
      })}
      {FALLEN.map((f, i) => {
        const w = 0.14 + 0.86 * illum(f.x, f.y) * warm;
        return (
          <g key={`fa${i}`} transform={`translate(${f.x}, ${f.y}) rotate(${f.rot})`}>
            <path d={`M0 0 C${f.w * 0.3} ${-1.1}, ${f.w * 0.7} ${-1.2}, ${f.w} 0 C${f.w * 0.72} ${f.h}, ${f.w * 0.3} ${f.h}, 0 ${f.h * 0.9} Z`}
              fill={`hsl(${18 + 14 * w}, ${10 + 30 * w}%, ${6 + 18 * w}%)`} />
            <path d={`M${f.w * 0.06} ${f.h * 0.2} C${f.w * 0.4} ${f.h * 0.05}, ${f.w * 0.7} ${f.h * 0.05}, ${f.w * 0.96} ${f.h * 0.24}`}
              fill="none" stroke={`hsl(42, ${14 + 30 * w}%, ${8 + 46 * w}%)`} strokeWidth={0.7} opacity={0.65} />
          </g>
        );
      })}

      {/* ── CRYSTALS ── */}
      {CLUSTERS.map((c, ci) => {
        const lit = 0.07 + 0.93 * chorusP;
        return (
          <g key={`cl${ci}`}>
            {chorusP > 0.02 && (
              <ellipse cx={c.x} cy={c.y + 13 * c.scale} rx={24 * c.scale} ry={20 * c.scale} fill="url(#v2libCrystalHalo)" />
            )}
            {/* the rock they grow out of */}
            <path d={`M${c.x - 13 * c.scale} ${c.y - 4} C${c.x - 7 * c.scale} ${c.y + 3}, ${c.x} ${c.y + 4.5}, ${c.x + 6 * c.scale} ${c.y + 2.6}
                      C${c.x + 11 * c.scale} ${c.y + 1}, ${c.x + 13 * c.scale} ${c.y - 2}, ${c.x + 13 * c.scale} ${c.y - 5} Z`}
              fill={t(P.vault, 0.6)} />
            {Array.from({ length: c.n }, (_, k) => {
              const len = (13 + rnd(c.seed + k) * 20) * c.scale;
              const wid = (0.95 + rnd(c.seed + k * 3) * 0.75) * c.scale;
              const dx = (k - (c.n - 1) / 2) * 7 * c.scale + (rnd(c.seed + k * 7) - 0.5) * 2.6;
              const ang = (k - (c.n - 1) / 2) * 11 + (rnd(c.seed + k * 5) - 0.5) * 9;
              const grow = sub(p, 0.06 + k * 0.03, 0.3);
              return (
                <g key={k} transform={`translate(${(c.x + dx).toFixed(2)}, ${c.y}) rotate(${ang.toFixed(1)}) scale(1, ${(0.55 + 0.45 * grow).toFixed(3)})`}>
                  <path d={shardPath(len, wid, c.seed + k)}
                    fill={`hsl(${262 + 10 * lit}, ${9 + 14 * lit}%, ${10 + 13 * lit}%)`} />
                  {/* the tip is the only part that really catches it */}
                  <path d={`M${-wid * 0.5} ${len * 0.52} C${-wid * 0.2} ${len * 0.74}, ${-wid * 0.1} ${len * 0.88}, 0 ${len}
                            C${wid * 0.3} ${len * 0.76}, ${wid * 0.45} ${len * 0.62}, ${wid * 0.5} ${len * 0.46} Z`}
                    fill={`hsl(272, ${12 + 22 * lit}%, ${15 + 26 * lit}%)`} opacity={0.45 + 0.25 * chorusP} />
                  {chorusP > 0.05 && k === 0 && ci % 2 === 0 && (
                    <path d={shardPath(len, wid, c.seed + k)} fill="#c4a2e6" opacity={0}>
                      <animate attributeName="opacity" values={`0;${(0.14 * chorusP).toFixed(3)};0`} dur={`${3.2 + ci * 0.5}s`}
                        begin={`-${(ci * 0.9).toFixed(2)}s`} repeatCount="indefinite" />
                    </path>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* ── LECTERN — a carved stand, one continuous stem into a foot ── */}
      {/* contact shadow, so it stands on the floor instead of over it */}
      <path d="M176 178 C185 175.2, 215 175.2, 224 178 C215 180.8, 185 180.8, 176 178 Z"
        fill={t(P.nicheNear, 0.4)} opacity={0.3 + 0.2 * warm} />
      <path d="M186 150.4 C184 156, 182.6 161, 183.6 165.4 C181 168.6, 177.6 171.6, 176 177
               L224 177 C222.4 171.6, 219 168.6, 216.4 165.4 C217.4 161, 216 156, 214 150.4
               C206 152, 194 152, 186 150.4 Z"
        fill={t(P.stoneDim)} />
      <path d="M196.6 151.4 C194.8 157, 194 162, 194.8 166.4 C192.6 169.6, 190.6 172.6, 189.6 177
               L183 177 C184.6 171.6, 188 168.6, 190.6 165.4 C189.6 161, 191 156, 193 150.9 Z"
        fill={t(P.stone, 0.55)} opacity={0.5} />
      {/* the slab, with a front lip and a book rest */}
      <path d="M170 143.6 C184 140.6, 216 140.6, 230 143.6 C231.4 146, 232 148.4, 231.6 150.6
               C216 153.4, 184 153.4, 168.4 150.6 C168 148.4, 168.6 146, 170 143.6 Z"
        fill={t(P.stone)} />
      <path d="M170 143.6 C184 140.6, 216 140.6, 230 143.6 C216 146, 184 146, 170 143.6 Z"
        fill={t(P.carve, 0.85)} opacity={0.6} />

      {/* ── THE TOME ──────────────────────────────────────────────────
          The whole of phrase 1 is one object turning. The two boards,
          the spine and the stack of paper are all on screen from frame
          zero; the only thing that changes is the angle of the front
          board and, after it, of four leaves. Read the frames: shut →
          catches loose → board foreshortening → edge-on → coming down
          inside-face-up → leaves crossing → spread → light. */}
      <g transform={`translate(${dx.toFixed(2)} 0)`}>
        {/* Halo under everything: the light the shut book was holding,
            then the room's only lamp. */}
        {(wakeP > 0.01 || pageP > 0) && (
          <ellipse cx="201" cy="121"
            rx={40 + 24 * pageP + 26 * voiceP} ry={31 + 20 * pageP + 20 * voiceP}
            fill="url(#v2libTomeHalo)" />
        )}

        {/* it stands on the slab rather than floating over it */}
        <path d={`M${(200 - leftReach - 1.4).toFixed(1)} 147.2
                  C${(200 - leftReach * 0.4).toFixed(1)} 150.0, 224 150.0, 235.2 147.2
                  C224 145.0, ${(200 - leftReach * 0.4).toFixed(1)} 145.0, ${(200 - leftReach - 1.4).toFixed(1)} 147.2 Z`}
          fill="#000" opacity={0.26} />

        {/* the back board */}
        <path d={BOARD_BACK} fill={`hsl(${13 + 8 * p}, ${18 + 10 * p}%, ${6 + 6 * p}%)`} />

        {/* The front board, once it is past edge-on: it has come down on
            the far side and the left page settles on top of it. */}
        {cosA < 0 && frontBoard}

        {/* The rounded back of the book. It never moves — the board and
            the leaves turn around it, and because it stays put nothing
            reads as coming off. */}
        <path d={SPINE_BACK} fill={`hsl(${13 + 8 * p}, ${20 + 12 * p}%, ${7 + 7 * p}%)`} />
        {[110, 136].map((y) => (
          <path key={y} d={`M196.4 ${y} C197.6 ${y - 0.5}, 199.2 ${y - 0.7}, 200.5 ${y - 0.8}
                            L200.5 ${y + 1.4} C199.2 ${y + 1.5}, 197.6 ${y + 1.7}, 196.4 ${y + 2.2} Z`}
            fill={`hsl(38, ${20 + 22 * p}%, ${14 + 20 * p}%)`} opacity={0.5} />
        ))}

        {/* The page block. This is not a separate object that dissolves
            into a spread — it IS the right half of the spread, present
            from the first frame, hidden under the board until the board
            turns off it. */}
        {page(PAGE_W, 1, 3.6 - 1.7 * partP, "rp")}

        {/* The front board while it still lies over the block. */}
        {cosA >= 0 && frontBoard}

        {/* The catches. They let go first — the one beat that says the
            book was shut on purpose, and the reason frame 5% is not the
            same picture as frame 0%. */}
        {[110.5, 135].map((y0) => (
          <g key={y0} transform={`rotate(${(94 * claspP).toFixed(1)} 233.2 ${y0})`} opacity={1 - 0.5 * partP}>
            <path d={`M232.8 ${y0 - 2.5} C233.9 ${y0 - 1.5}, 233.9 ${y0 + 1.5}, 232.8 ${y0 + 2.5}
                      C230.2 ${y0 + 2.9}, 226.8 ${y0 + 2.4}, 225.0 ${y0 + 1.4}
                      C224.0 ${y0 + 0.8}, 224.0 ${y0 - 0.8}, 225.0 ${y0 - 1.4}
                      C226.8 ${y0 - 2.4}, 230.2 ${y0 - 2.9}, 232.8 ${y0 - 2.5} Z`}
              fill={`hsl(38, ${24 + 14 * p}%, ${16 + 14 * p}%)`} />
            <path d={`M225.9 ${y0 - 1.0} C227.3 ${y0 - 1.4}, 228.2 ${y0 - 0.4}, 227.8 ${y0 + 0.6}
                      C227.4 ${y0 + 1.4}, 226.1 ${y0 + 1.4}, 225.5 ${y0 + 0.6}
                      C225.1 ${y0 + 0.0}, 225.2 ${y0 - 0.8}, 225.9 ${y0 - 1.0} Z`}
              fill={`hsl(44, ${34 + 18 * p}%, ${30 + 20 * p}%)`} opacity={0.85} />
          </g>
        ))}

        {/* The left page, built out of the leaves that crossed. */}
        {leftW > 0.6 && page(leftW, -1, 0.5 + 1.4 * partP, "lp")}

        {/* Leaves crossing the gutter — the board's own motion again,
            four times small, so the parting is the same idea repeated
            rather than a new one. */}
        {LEAVES.map((L, i) => {
          const q = ease(sub(p, L.s, L.d));
          if (q <= 0.015 || q >= 0.985) return null;
          const ang = Math.PI * q;
          const c = Math.cos(ang);
          const s = c >= 0 ? 1 : -1;
          const w = Math.max(1.6, PAGE_W * Math.abs(c));
          // The bow is scaled by how much of the leaf is facing us, so
          // a leaf standing dead upright is a sliver at the gutter and
          // not a thorn sticking out of the top of the book.
          const d = leafFace(w, s, 3.4 * Math.sin(ang) * (0.3 + 0.7 * Math.abs(c)));
          return (
            <g key={`lf${i}`}>
              <path d={d} fill={paper} />
              <path d={d} fill={`url(#v2libGutter${s > 0 ? "R" : "L"})`} />
              <path d={d} fill="#ffe7b8" opacity={(0.07 + 0.18 * Math.sin(ang)) * (0.4 + 0.6 * pageP)} />
            </g>
          );
        })}

        {/* the gutter, which only exists once there are two halves */}
        {partP > 0.02 && (
          <path d="M200 101.8 C198.5 112, 198.5 130, 200 140.2 C201.5 130, 201.5 112, 200 101.8 Z"
            fill={`hsl(30, ${14 + 16 * pageP}%, ${9 + 14 * pageP}%)`} opacity={partP} />
        )}
      </g>

      {/* ── VOICE THREADS — three, soft, braiding into one ── */}
      {voiceP > 0.02 && (
        <g>
          {[-1, 0, 1].map((i) => {
            const bx = 200 + i * 12;
            const by = 122;
            const midX = 200 + i * 20;
            const w0 = 3.4, w1 = 6.4;
            // The three do not meet at a point — they thicken into one
            // soft column near the vault. A point would read as a beam.
            const wide = `M${bx - w0 - 3} ${by} C${midX - w1 - 4} ${by - 30}, ${200 - 10 + i * 3} ${by - 62}, 195.4 ${rayTop}
                          L204.6 ${rayTop} C${200 + 10 + i * 3} ${by - 62}, ${midX + w1 + 4} ${by - 30}, ${bx + w0 + 3} ${by} Z`;
            const core = `M${bx - w0} ${by} C${midX - w1} ${by - 30}, ${200 - 5 + i * 2} ${by - 62}, 197.6 ${rayTop}
                          L202.4 ${rayTop} C${200 + 5 + i * 2} ${by - 62}, ${midX + w1} ${by - 30}, ${bx + w0} ${by} Z`;
            return (
              <g key={`ry${i}`}>
                <path d={wide} fill="url(#v2libRay)" opacity={0.4 * voiceP} />
                <path d={core} fill="url(#v2libRay)" opacity={0.75 * voiceP} />
              </g>
            );
          })}
          <ellipse cx="200" cy={rayTop + 4} rx={30 * voiceP} ry={26 * voiceP} fill="url(#v2libBraid)" />
        </g>
      )}

      {/* ── RISEN BOOKS — the chorus, out of their slots and fluttering ──
           Fold at the top, pages falling away either side, covers under
           them: an open book from below, not a moth. */}
      {BOOKS.map((b, i) => {
        if (b.rise < 0) return null;
        const f = FLIGHTS[b.rise];
        const rp = ease(sub(p, f.delay, f.dur));
        if (rp <= 0) return null;
        const x0 = b.x + b.w / 2, y0 = b.y - b.h / 2;
        const x = x0 + (f.x - x0) * rp;
        const y = y0 + (f.y - y0) * rp - 12 * Math.sin(Math.PI * rp);
        const sc = (0.45 + 0.55 * rp) * f.sc;
        const tilt = f.tilt * rp;
        const cover = `hsl(${b.hue}, ${24 + 18 * chorusP}%, ${11 + 10 * chorusP}%)`;
        return (
          <g key={`rb${i}`} transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)})`} opacity={Math.min(1, rp * 2.2)}>
            <g>
              <g transform={`rotate(${tilt.toFixed(2)}) scale(${sc.toFixed(3)})`}>
                <ellipse cx="0" cy="0" rx={17 * rp} ry={12 * rp} fill="url(#v2libBookHalo)" opacity={0.5 + 0.5 * chorusP} />
                {/* Covers: dark strips under each page's outer half, so
                    the thing has a board and a fore-edge and cannot read
                    as one continuous crescent. */}
                <path d="M-2.6 1 C-6 1.6, -9.4 2.6, -12.8 4.2 L-12.4 6.4 C-9 4.8, -5.6 3.8, -2.4 3.2 Z" fill={cover} />
                <path d="M2.6 1 C6.1 1.6, 9.6 2.6, 13 4.2 L12.6 6.4 C9.2 4.8, 5.7 3.8, 2.4 3.2 Z" fill={cover} />
                {/* Pages: two flat planes with squared fore-edges, held
                    open at a deep angle off the fold. */}
                <g>
                  {/* Flutter lives on half the flock. Every SMIL timeline
                      repaints the whole SVG, and the Glow layer's FPS
                      probe is sharing this thread. */}
                  {b.rise % 2 === 0 && (
                    <animateTransform attributeName="transform" type="rotate"
                      values="0 0 -6; -5 0 -6; 0 0 -6" dur={`${f.flut}s`} begin={`-${(b.rise * 0.4).toFixed(2)}s`} repeatCount="indefinite" />
                  )}
                  <path d="M-1 -6.2 C-4.6 -4.8, -8.4 -3.4, -12.2 -1.6 C-12.1 0, -11.9 1.6, -11.6 3
                           C-8.1 1.9, -4.6 1.2, -1 0.8 Z"
                    fill={`hsl(42, ${26 + 22 * chorusP}%, ${56 + 22 * chorusP}%)`} />
                  <path d="M-2.4 -4.6 C-5.6 -3.4, -8.8 -2.2, -11.8 -0.6" fill="none"
                    stroke={`hsl(34, 24%, ${34 + 16 * chorusP}%)`} strokeWidth={0.35} opacity={0.5} />
                  <path d="M-12.2 -1.6 C-11.6 -1.3, -11.4 0.6, -11.6 3" fill="none"
                    stroke={`hsl(34, 22%, ${28 + 14 * chorusP}%)`} strokeWidth={0.5} opacity={0.7} />
                </g>
                <g>
                  {b.rise % 2 === 0 && (
                    <animateTransform attributeName="transform" type="rotate"
                      values="0 0 -6; 4.6 0 -6; 0 0 -6" dur={`${(f.flut * 1.22).toFixed(2)}s`} begin={`-${(b.rise * 0.7).toFixed(2)}s`} repeatCount="indefinite" />
                  )}
                  <path d="M1 -6.2 C4.7 -4.8, 8.6 -3.4, 12.4 -1.6 C12.3 0, 12.1 1.6, 11.8 3
                           C8.2 1.9, 4.7 1.2, 1 0.8 Z"
                    fill={`hsl(44, ${24 + 22 * chorusP}%, ${58 + 22 * chorusP}%)`} />
                  <path d="M2.4 -4.6 C5.7 -3.4, 8.9 -2.2, 12 -0.6" fill="none"
                    stroke={`hsl(34, 24%, ${36 + 16 * chorusP}%)`} strokeWidth={0.35} opacity={0.5} />
                  <path d="M12.4 -1.6 C11.8 -1.3, 11.6 0.6, 11.8 3" fill="none"
                    stroke={`hsl(34, 22%, ${30 + 14 * chorusP}%)`} strokeWidth={0.5} opacity={0.7} />
                </g>
                {/* the spine, standing proud of the fold */}
                <path d="M-1.5 -7.2 C-0.5 -8, 0.6 -8, 1.5 -7.2 C1.4 -4.6, 1.2 -2, 1 0.6
                         L-1 0.6 C-1.2 -2, -1.4 -4.6, -1.5 -7.2 Z"
                  fill={`hsl(${b.hue}, ${26 + 16 * chorusP}%, ${14 + 12 * chorusP}%)`} />
              </g>
            </g>
          </g>
        );
      })}

      {/* ── INK-MARKS rising ── */}
      {EMBERS.map((e, i) => {
        const ep = sub(p, e.delay, 0.13);
        if (ep <= 0) return null;
        const y = e.y + (e.ey - e.y) * ep;
        const x = e.x + e.drift * ep;
        const fade = Math.min(1, ep * 3.5) * (ep > 0.78 ? 1 - (ep - 0.78) / 0.22 : 1);
        return (
          <g key={`em${i}`} transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${(e.sc * (0.8 + 0.5 * ep)).toFixed(3)})`} opacity={fade * 0.6}>
            {/* No SMIL here: the marks already travel and fade with
                progress, and the scene's idle-motion budget is spent on
                the page flutter and the crystals. Measured — past about
                eight live timelines the Glow layer's FPS probe trips and
                the whole light layer switches itself off. */}
            <path d={MARKS[e.g]} fill="none" stroke="#ffd8a0" strokeWidth={0.8} strokeLinecap="round" />
          </g>
        );
      })}

      {/* ── DUST in the light ── */}
      {p > 0.12 && <Dust active alpha={0.1 + 0.16 * warm} />}
    </svg>
  );
}

export default memo(LibraryScene);
