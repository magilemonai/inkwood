import { memo } from "react";
import type { SceneProps } from "../../types";
import { sub } from "../util";
import { GlowFilter } from "../../svg/filters";

/**
 * The Dry Well — Inkwood 2 redraw.
 *
 * The cross-section stays; it was the first genuine "wow" in this
 * project. What changes is everything holding it up. v1 built the
 * wellhead out of five rectangles, banded the earth flatly, and hid
 * the water so well that at 99% you could barely find it.
 *
 * THE IDEA: the water is the light source. At p=0 the earth below the
 * cut is nearly black — a dry shaft, a bucket sitting on the floor,
 * strata you can only just feel. "deep water, remember your name"
 * wakes the aquifer bedded in the rock, water gathers at the shaft
 * floor, and its glow climbs the fitted stones — the reveal isn't a
 * curtain lifting, it's the player's own words lighting the
 * underground. "rise and carry the old songs home" brings the column
 * to the mouth, submerges the carved runes course by course, and
 * floats the bucket up on it.
 *
 * Water is kept luminous but never saturated (fill lightness caps
 * around 14%): the brightness lives in the surface line, the caustics
 * and the Glow manifest, never in the fill. The swimming-pool failure
 * is a solved problem and stays solved.
 *
 * Runes are Ogham-style — a stem with tally strokes, the same language
 * as the game's own mark. An earlier pass drew them with arms and
 * bowls and they read as capital A and R; letterforms are the enemy.
 */

// ─── GEOMETRY HELPERS ──────────────────────────────────────

/** Closed Catmull-Rom loop → cubic beziers. Used for every stone so
 *  no block is a rectangle and no two share a silhouette. */
function loop(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n];
    const b = pts[i];
    const c = pts[(i + 1) % n];
    const e = pts[(i + 2) % n];
    const c1x = b[0] + (c[0] - a[0]) / 6;
    const c1y = b[1] + (c[1] - a[1]) / 6;
    const c2x = c[0] - (e[0] - b[0]) / 6;
    const c2y = c[1] - (e[1] - b[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

/** A fitted stone block: fourteen points around the perimeter, each
 *  pushed out by a per-seed wobble, then smoothed. Points cluster along
 *  the flat runs so the smoothing only rounds the corners — an earlier
 *  pass used eight points and every block came out a pillow. Positions,
 *  sizes and seeds are hand-placed below; this only weathers them. */
function stonePath(cx: number, cy: number, w: number, h: number, seed: number): string {
  const hw = w / 2;
  const hh = h / 2;
  const amp = Math.min(0.6, w * 0.038);
  const k = (i: number) => Math.sin(seed * 12.9898 + i * 2.399) * amp;
  const across = [-1, -0.68, -0.24, 0.24, 0.68, 1];
  const pts: [number, number][] = [];
  across.forEach((f, i) => pts.push([cx + hw * f + k(i), cy - hh + k(i + 6)]));
  pts.push([cx + hw + k(12), cy + k(13)]);
  [...across].reverse().forEach((f, i) => pts.push([cx + hw * f + k(i + 14), cy + hh + k(i + 20)]));
  pts.push([cx - hw + k(26), cy + k(27)]);
  return loop(pts);
}

/** A single tapered grass blade — a closed path, never a stroked line. */
function blade(x: number, y: number, h: number, lean: number): string {
  return (
    `M${x - 1.1} ${y} C${x - 1} ${y - h * 0.38}, ${x + lean * 0.35} ${y - h * 0.74}, ${x + lean} ${y - h}` +
    ` C${x + lean * 0.5} ${y - h * 0.68}, ${x + 0.9} ${y - h * 0.34}, ${x + 1.1} ${y} Z`
  );
}

/** Ground-line height at x — follows the topsoil cut edge. */
const groundY = (x: number) => 90.5 - 1.7 * Math.sin(x * 0.031 + 0.4);

// ─── LAYOUT CONSTANTS ──────────────────────────────────────

const SHAFT_L = 177;
const SHAFT_R = 223;
const FLOOR = 200;
const TOP_FULL = 103;

// ─── STATIC PATHS (built once — none of this depends on progress) ──

/** Far ridge, then a nearer treeline. Two depths so the horizon has air
 *  behind it instead of one flat band. */
const FAR_RIDGE = `
  M0 84 C22 80, 40 83, 58 79 C76 75, 92 80, 112 77 C132 74, 148 79, 168 76
  C190 73, 214 78, 236 75 C258 72, 276 78, 298 75 C320 72, 340 79, 362 76
  C378 73, 390 78, 400 76 L400 96 L0 96 Z`;

const NEAR_TREES = `
  M0 88 C8 86, 12 78, 18 80 C22 74, 27 79, 30 74 C34 79, 38 75, 42 81
  C46 77, 51 82, 54 78 C58 84, 64 80, 68 86 C74 82, 79 86, 84 83
  C90 88, 97 84, 103 88 C110 84, 116 87, 122 84 C128 88, 134 85, 140 89
  L140 96 L0 96 Z`;

const NEAR_TREES_R = `
  M400 88 C392 86, 388 78, 382 80 C378 74, 373 79, 370 74 C366 79, 362 75, 358 81
  C354 77, 349 82, 346 78 C342 84, 336 80, 332 86 C326 82, 321 86, 316 83
  C310 88, 303 84, 297 88 C290 84, 284 87, 278 84 C272 88, 266 85, 260 89
  L260 96 L400 96 Z`;

/** Earth strata, painted back to front. Each runs from its own irregular
 *  top edge to the bottom of the frame, so only the wavy seam shows.
 *  Tones alternate warm-light / red-dark / grey-light / cool-dark so the
 *  courses separate without anyone having to be bright. */
const BEDROCK = `
  M0 172 C30 168, 62 176, 96 171 C130 166, 162 177, 200 173
  C238 169, 268 178, 304 172 C336 167, 370 176, 400 171 L400 250 L0 250 Z`;

const GRAVEL = `
  M0 140 C28 136, 56 145, 92 139 C128 133, 158 146, 196 141
  C232 136, 266 147, 300 140 C334 134, 368 144, 400 138 L400 250 L0 250 Z`;

const CLAY = `
  M0 112 C26 108, 54 117, 88 111 C124 105, 156 118, 194 113
  C230 108, 264 119, 300 112 C334 106, 370 116, 400 110 L400 250 L0 250 Z`;

const TOPSOIL = `
  M0 90 C30 87, 58 94, 94 89 C130 84, 160 95, 198 91
  C234 87, 268 96, 304 90 C338 85, 370 94, 400 89 L400 250 L0 250 Z`;

const STRATA_SEAMS = [BEDROCK, GRAVEL, CLAY, TOPSOIL];

/** Turf: a ragged moss skin on the cut, thick and thin by turns rather
 *  than a painted-on stripe. */
const TURF = `
  M0 90 C30 87, 58 94, 94 89 C130 84, 160 95, 198 91
  C234 87, 268 96, 304 90 C338 85, 370 94, 400 89
  L400 92.5 C382 96, 368 91, 352 94.5 C338 97.5, 322 92.5, 304 94.5
  C286 96.5, 270 100, 252 97 C236 94.5, 220 97.5, 200 95.5
  C182 93.5, 168 98.5, 152 96.5 C136 94.5, 120 90.5, 104 93.5
  C88 96.5, 74 92, 58 97 C44 101, 28 93, 14 95.5 C8 96.5, 4 94, 0 94.5 Z`;

/** Root threads reaching down through topsoil into clay. Tapered closed
 *  paths with one fork each — never uniform strokes. */
const ROOTS = [
  `M54 91 C56 99, 52 106, 49 114 C47 120, 48 126, 46 132 C45.5 132.3, 45.1 132.1, 44.9 131.6
   C46.2 126, 45.4 120, 47.4 113 C50 105, 53.4 98, 52.2 91 Z`,
  `M50 104 C46 108, 41 110, 36 113 C35.7 113.5, 35.9 114, 36.4 114.1 C41.4 111.2, 46.6 109.2, 50.9 105.4 Z`,
  `M118 92 C121 101, 118 110, 116 119 C114.6 125, 115.6 130, 114 136
   C113.5 136.3, 113 136.1, 112.8 135.6 C114 129, 113 124, 114.6 118
   C116.8 109, 119.4 100, 116.4 92 Z`,
  `M116 112 C121 115, 127 116, 133 118 C133.4 118.4, 133.2 119, 132.7 119.1 C126.6 117.4, 120.6 116.2, 115.6 113.4 Z`,
  `M286 91 C283 99, 286 107, 288 116 C289.6 122, 288.6 127, 290 134
   C290.5 134.3, 291 134.1, 291.2 133.6 C290 127, 291 122, 289.4 116
   C287 107, 284.6 99, 288 91 Z`,
  `M289 106 C294 108, 300 108, 306 109 C306.4 109.4, 306.2 110, 305.7 110.1 C299.6 109.5, 293.6 109, 288.6 107.6 Z`,
  `M348 92 C350 100, 347 108, 345 116 C343.7 121, 344.5 126, 343 131
   C342.5 131.3, 342 131.1, 341.9 130.6 C343 126, 342.2 121, 343.6 115.6
   C345.6 108, 348 100, 346.2 92 Z`,
  `M212 92 C214 99, 211 105, 209 111 C208 114, 208.6 118, 207.4 122
   C207 122.3, 206.5 122.1, 206.4 121.6 C207.4 118, 206.8 114, 208 110
   C210 104, 212.4 99, 210.6 92 Z`,
];

/** Pebbles bedded in the gravel course. */
const PEBBLES = [
  stonePath(38, 152, 9, 5, 1.3),
  stonePath(64, 161, 7, 4.2, 2.7),
  stonePath(96, 149, 11, 5.5, 4.1),
  stonePath(126, 160, 8, 4.6, 5.9),
  stonePath(268, 151, 10, 5.2, 7.3),
  stonePath(300, 162, 7.5, 4.4, 8.8),
  stonePath(334, 148, 9.5, 5, 10.2),
  stonePath(366, 159, 8, 4.6, 11.6),
];

/** The aquifer: not a pond but a saturated seam in the bedrock — a
 *  ragged band of wet rock the water is held in. An earlier pass drew a
 *  smooth lens and it read as a puddle sitting under the ground. */
const AQUIFER = `
  M0 219 C22 214, 40 220, 62 215 C84 210, 104 214, 126 209
  C148 204, 162 207, 178 202 L222 202 C238 207, 254 205, 274 210
  C296 215, 314 211, 336 216 C358 221, 378 216, 400 220
  L400 236 C380 232, 362 238, 340 234 C316 230, 296 236, 272 232
  C248 228, 226 234, 200 231 C174 228, 152 234, 128 230
  C104 226, 84 232, 60 228 C38 224, 20 230, 0 226 Z`;

/** Seeps drawn up out of the aquifer into the shaft throat. Short —
 *  an earlier pass ran these the whole width of the frame and they
 *  read as loose wires laid across the picture. */
const SEEPS = [
  `M146 210 C158 206, 166 203, 178 201`,
  `M254 210 C242 206, 234 203, 222 201`,
  `M160 217 C168 212, 172 206, 180 202`,
  `M240 217 C232 212, 228 206, 220 202`,
];

/** The shaft void — the cut opening, irregular so it isn't a slot. */
const SHAFT_VOID = `
  M175 66 C174 82, 176 98, 175 114 C174 130, 176 146, 175 162
  C174.4 176, 175.6 190, 175 202 L225 202 C224.4 190, 225.6 176, 225 162
  C224 146, 226 130, 225 114 C224 98, 226 82, 225 66 Z`;

/** The far wall of the shaft, seen through the cut. This is what turns
 *  a black slot into a cylinder you can see down. */
const SHAFT_BACK = `
  M179 66 C178.4 84, 179.6 102, 179 120 C178.4 138, 179.6 158, 179 178
  C178.6 190, 179.4 196, 179 201 L221 201 C220.6 196, 221.4 190, 221 178
  C220.4 158, 221.6 138, 221 120 C220.4 102, 221.6 84, 221 66 Z`;

/** Coursing on the far wall — the lining seen from inside. */
const BACK_COURSES = [75, 84, 93, 102, 111, 120, 129, 138, 147, 156, 165, 174, 183, 192].map(
  (y, i) => `M179 ${y + (i % 2) * 0.4} C189 ${y + 1.1}, 202 ${y - 0.8}, 211 ${y + 0.5} C215 ${y + 1}, 218 ${y - 0.3}, 221 ${y + 0.3}`,
);

/** The three courses of the ring's far wall, seen through the open mouth.
 *  Drawn with a lit lip so the mouth reads as stonework rather than a
 *  black square between the two cut stacks. */
const MOUTH_COURSES = [71, 80, 89].map(
  (y, i) =>
    `M180 ${y + (i % 2) * 0.5} C188 ${y + 1.2}, 198 ${y - 0.7}, 206 ${y + 0.4} C212 ${y + 1.1}, 216 ${y - 0.4}, 220 ${y + 0.2}`,
);

/** The wellhead ring, cut down the middle: two stacks of fitted stones
 *  with the shaft mouth open between them. */
const RING = [
  { d: stonePath(170, 68, 21, 6.5, 21.4), tone: 2 },
  { d: stonePath(230, 68, 21, 6.5, 22.9), tone: 2 },
  { d: stonePath(170, 76, 18, 9, 24.3), tone: 1 },
  { d: stonePath(230, 76, 18, 9, 25.8), tone: 0 },
  { d: stonePath(169, 85, 17, 9, 27.2), tone: 0 },
  { d: stonePath(231, 85, 17, 9, 28.7), tone: 1 },
];

/** The shaft lining below the cut — twelve courses a side. Courses
 *  overlap so the joints read as mortar, not as gaps onto the void. */
const LINING_YS = [96, 105, 114, 123, 132, 141, 150, 159, 168, 177, 186, 195];
const LINING = (() => {
  const out: { d: string; y: number; tone: number }[] = [];
  LINING_YS.forEach((y, i) => {
    const w = 17.5 - i * 0.18;
    out.push({ d: stonePath(169 + (i % 3) * 0.5, y, w, 10, 40 + i * 1.7), y, tone: i % 3 });
    out.push({ d: stonePath(231 - (i % 3) * 0.5, y, w, 10, 61 + i * 1.9), y, tone: (i + 2) % 3 });
  });
  return out;
})();

/** Runes carved into the lining, lowest first. They light as the water
 *  reaches them — the stones remembering, not runes drifting past.
 *  Ogham-style: a stem with tally strokes, matching the game's mark. */
const RUNES: { x: number; y: number; g: number }[] = [
  { x: 169, y: 178, g: 0 },
  { x: 231, y: 162, g: 3 },
  { x: 169, y: 146, g: 1 },
  { x: 231, y: 131, g: 4 },
  { x: 169, y: 118, g: 2 },
  { x: 231, y: 107, g: 5 },
];

function runeGlyph(x: number, y: number, g: number): string {
  const stem = `M${x} ${y - 4} L${x} ${y + 4}`;
  const L = (dy: number, n: number) => `M${x} ${y + dy} L${x - n} ${y + dy}`;
  const R = (dy: number, n: number) => `M${x} ${y + dy} L${x + n} ${y + dy}`;
  const X = (dy: number) => `M${x - 2.4} ${y + dy - 1} L${x + 2.4} ${y + dy + 1}`;
  switch (g) {
    case 0: return `${stem} ${L(-2.4, 2.6)} ${L(-0.2, 2.6)} ${L(2, 2.6)}`;
    case 1: return `${stem} ${R(-2.4, 2.6)} ${R(0.4, 2.6)}`;
    case 2: return `${stem} ${X(-2)} ${X(0.4)} ${X(2.8)}`;
    case 3: return `${stem} ${L(-2.2, 2.4)} ${R(-2.2, 2.4)} ${L(1.6, 2.4)} ${R(1.6, 2.4)}`;
    case 4: return `${stem} ${R(-2.8, 2.4)} ${R(-1, 2.4)} ${R(0.8, 2.4)} ${R(2.6, 2.4)}`;
    default: return `${stem} ${X(-1.4)} ${L(2.2, 2.6)}`;
  }
}

/** Roof: a swaybacked ridge and drooping eaves, one closed path. */
const ROOF = `
  M152 44 C160 40.5, 168 36, 176 31 C184 26, 193 20.5, 200 18.4
  C207 20.5, 216 26, 224 31 C232 36, 240 40.5, 248 44
  C240 46.4, 230 47.4, 220 47.6 C207 47.9, 193 47.9, 180 47.6
  C170 47.4, 160 46.4, 152 44 Z`;

/** Shingle courses, scalloped across each slope. */
function shingleCourse(t: number): string {
  const y = 18.4 + 25.6 * t + 0.8;
  const x0 = 200 - 47.5 * t - 1;
  const x1 = 200 + 47.5 * t + 1;
  const n = Math.max(2, Math.round((x1 - x0) / 9));
  const step = (x1 - x0) / n;
  let d = `M${x0.toFixed(1)} ${y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const xa = x0 + step * i;
    d += ` Q${(xa + step / 2).toFixed(1)} ${(y + 1.9).toFixed(1)}, ${(xa + step).toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}
const SHINGLES = [0.34, 0.58, 0.82].map(shingleCourse);

/** Posts — tapered, leaning in a touch, with a grain line each. */
const POST_L = `M171.6 40 C170.8 50, 171 60, 171.4 71 L178.4 71 C178.2 60, 178 50, 177.4 40 Z`;
const POST_R = `M228.4 40 C229.2 50, 229 60, 228.6 71 L221.6 71 C221.8 60, 222 50, 222.6 40 Z`;
const BEAM = `M172 42.4 C184 45.2, 216 45.2, 228 42.4 L228 46.6 C216 49.6, 184 49.6, 172 46.6 Z`;

/** Grass tufts along the cut. */
const TUFTS = [14, 38, 62, 88, 116, 142, 256, 284, 312, 338, 366, 390].map((x, i) => ({
  x,
  y: groundY(x) + 1.2,
  blades: [
    blade(x - 3, groundY(x - 3) + 1.4, 6.5 + (i % 3) * 1.8, -2.8 - (i % 2)),
    blade(x - 0.6, groundY(x) + 1.4, 9.5 + (i % 4) * 1.6, 0.6 + (i % 3) * 0.7),
    blade(x + 2, groundY(x + 2) + 1.4, 7.5 + ((i + 2) % 3) * 1.5, 1.6 + (i % 2)),
    blade(x + 4, groundY(x + 4) + 1.4, 5 + ((i + 1) % 3) * 1.4, 3 + (i % 2)),
  ],
  dur: `${6.5 + (i % 5) * 1.1}s`,
  swing: 1.6 + (i % 3) * 0.5,
}));

const STARS = [
  { x: 34, y: 20, r: 0.8, d: "4.2s" },
  { x: 68, y: 38, r: 0.6, d: "5.6s" },
  { x: 104, y: 16, r: 0.9, d: "6.8s" },
  { x: 128, y: 46, r: 0.55, d: "5.1s" },
  { x: 288, y: 22, r: 0.85, d: "7.3s" },
  { x: 322, y: 42, r: 0.6, d: "4.8s" },
  { x: 358, y: 18, r: 0.75, d: "6.1s" },
  { x: 380, y: 50, r: 0.5, d: "5.4s" },
];

/** Grit — short broken strokes bedded in each stratum for texture. */
const GRIT = Array.from({ length: 40 }, (_, i) => {
  const x = ((i * 61) % 376) + 8;
  const y = 100 + ((i * 47) % 130);
  const w = 3 + ((i * 13) % 7);
  return `M${x} ${y} C${x + w * 0.4} ${y - 0.6}, ${x + w * 0.7} ${y + 0.5}, ${x + w} ${y - 0.2}`;
});

// ─── SCENE ─────────────────────────────────────────────────

function WellScene({ progress: p }: SceneProps) {
  // Phrase 1 "deep water, remember your name": the aquifer wakes, water
  // gathers at the shaft floor, and its glow reveals the strata and the
  // fitted stones.
  const spring = sub(p, 0.03, 0.20);
  const reveal = sub(p, 0.10, 0.32);

  // The column. pow(0.8) instead of an ease-out square so the rise is
  // steady rather than front-loaded — v1 snapped most of the way up
  // during phrase one and had nothing left for phrase two.
  const rise = Math.pow(sub(p, 0.14, 0.86), 0.8);
  const waterTop = FLOOR - rise * (FLOOR - TOP_FULL);

  // Phrase 2 "rise and carry the old songs home".
  const song = sub(p, 0.52, 0.48);

  // The bucket rests on the dry floor, then rides the surface up. The
  // rope pays out slack as it climbs — the lift is the point.
  const bucketRest = 180;
  const bucketY = Math.min(bucketRest, waterTop - 7);
  const slack = bucketRest - bucketY;

  // Palette. Everything below the cut is near-black at p=0 and is lit by
  // the water, not by a global brightener.
  const skyL = 8.5 + p * 6;
  const soil = reveal * 3.6 + rise * 1.4;
  // The lining sits inside the earth's own tonal range on purpose: at
  // p=0 you should barely find it, and the water is what picks it out.
  // Course joints and the wet sheen do the legibility work, not value.
  const stoneL = 8.2 + reveal * 3.6 + rise * 1.8;
  const woodL = 12 + p * 6.5;
  const waterS = 24 + rise * 6;
  const waterL = 7 + rise * 6.5; // caps near 13.5% — luminous, never a pool

  const tone = (t: number) => stoneL + (t - 1) * 1.5;

  return (
    <svg
      viewBox="0 0 400 250"
      overflow="hidden"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <GlowFilter id="wellRuneGlow" radius={2.4} color="#58c4c0" opacity={0.5} />
        <GlowFilter id="wellSpringGlow" radius={6} color="#3ea0a4" opacity={0.35} />

        {/* Chisel wobble so the runes read as weathered carvings rather
            than vector glyphs — the v1 runes were geometrically perfect. */}
        <filter id="wellCarved" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0.6" />
        </filter>

        <linearGradient id="wellSkyV2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(212, 20%, ${skyL + 4.5}%)`} />
          <stop offset="62%" stopColor={`hsl(202, 15%, ${skyL}%)`} />
          <stop offset="100%" stopColor={`hsl(192, 13%, ${skyL + 2}%)`} />
        </linearGradient>

        {/* Depth: the ground gets darker the further from the cut. This
            one gradient does more for the cross-section than any amount
            of extra detail. */}
        <linearGradient id="wellDepth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="34%" stopColor="#03060a" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#02050a" stopOpacity="0.62" />
        </linearGradient>

        <linearGradient id="wellWaterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(186, ${waterS}%, ${waterL + 3}%)`} />
          <stop offset="35%" stopColor={`hsl(188, ${waterS - 3}%, ${waterL}%)`} />
          <stop offset="100%" stopColor={`hsl(194, ${waterS - 9}%, ${Math.max(3, waterL - 4)}%)`} />
        </linearGradient>

        {/* The shaft is round. This edge-darkening ramp, laid over both
            the far wall and the water, is what turns the cut opening
            from a rectangle into a throat you are looking down. */}
        <linearGradient id="wellShaftCyl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#010407" stopOpacity="0.8" />
          <stop offset="26%" stopColor="#010407" stopOpacity="0.12" />
          <stop offset="58%" stopColor="#010407" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#010407" stopOpacity="0.78" />
        </linearGradient>

        <linearGradient id="wellMouthLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ea6b8" stopOpacity="0.12" />
          <stop offset="55%" stopColor="#7d94a6" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#7d94a6" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="wellBackWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(200, 12%, ${5.5 + reveal * 2.5}%)`} />
          <stop offset="55%" stopColor={`hsl(200, 12%, ${3.4 + reveal * 1.8}%)`} />
          <stop offset="100%" stopColor={`hsl(196, 14%, ${4 + reveal * 3.4 + rise * 2}%)`} />
        </linearGradient>

        <clipPath id="wellWaterClip">
          <path
            d={`M${SHAFT_L} ${waterTop} C${SHAFT_L + 7} ${waterTop - 1.2} ${SHAFT_L + 15} ${waterTop + 1.1} 200 ${waterTop}
                C${SHAFT_R - 15} ${waterTop - 1.1} ${SHAFT_R - 7} ${waterTop + 1.2} ${SHAFT_R} ${waterTop}
                L${SHAFT_R} ${FLOOR} L${SHAFT_L} ${FLOOR} Z`}
          />
        </clipPath>
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="97" fill="url(#wellSkyV2)" />

      {/* Stars — circles are correct here; they ARE dots. */}
      <g opacity={0.35 + p * 0.35}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#c8d8e4">
            <animate attributeName="opacity" values="0.35;0.95;0.35" dur={s.d} repeatCount="indefinite" />
          </circle>
        ))}
      </g>

      {/* ── DEPTH: far ridge, then a nearer treeline both sides ── */}
      <path d={FAR_RIDGE} fill={`hsl(200, 12%, ${6 + p * 3}%)`} />
      <path d={NEAR_TREES} fill={`hsl(190, 11%, ${4.5 + p * 2.4}%)`} />
      <path d={NEAR_TREES_R} fill={`hsl(190, 11%, ${4.5 + p * 2.4}%)`} />

      {/* ── EARTH STRATA — painted back to front, only the seams show.
           Alternating warm/cool and light/dark so the courses separate
           at these lightnesses without anyone going bright. ── */}
      <path d={BEDROCK} fill={`hsl(206, 14%, ${5 + soil * 0.6}%)`} />
      <path d={GRAVEL} fill={`hsl(34, 13%, ${9 + soil * 0.9}%)`} />
      <path d={CLAY} fill={`hsl(12, 24%, ${6.4 + soil * 0.85}%)`} />
      <path d={TOPSOIL} fill={`hsl(28, 21%, ${8.9 + soil}%)`} />

      {/* Seam shadow under each course, then the lit lip on top of it. */}
      <g fill="none" opacity={0.5 + reveal * 0.3}>
        {STRATA_SEAMS.map((d, i) => (
          <path key={`sh${i}`} d={d} transform="translate(0 2)" stroke="#000000" strokeOpacity="0.42" strokeWidth="2.2" />
        ))}
        {STRATA_SEAMS.map((d, i) => (
          <path key={`li${i}`} d={d} stroke="#b09070" strokeOpacity={0.1 + reveal * 0.14} strokeWidth="0.8" />
        ))}
      </g>

      {/* Grit texture bedded in the strata */}
      <g fill="none" strokeWidth="0.5" strokeLinecap="round" opacity={0.12 + reveal * 0.18}>
        {GRIT.map((d, i) => (
          <path key={i} d={d} stroke="#a08868" />
        ))}
      </g>

      {/* Roots reaching down through the cut face */}
      <g fill={`hsl(36, ${11 + p * 12}%, ${10 + reveal * 4 + p * 4}%)`} opacity={0.55 + p * 0.35}>
        {ROOTS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Pebbles in the gravel course */}
      <g opacity={0.35 + reveal * 0.45}>
        {PEBBLES.map((d, i) => (
          <path key={i} d={d} fill={`hsl(30, 9%, ${11.5 + soil + (i % 3) * 1.6}%)`} />
        ))}
      </g>

      {/* Depth wash — the ground recedes into dark away from the cut */}
      <path d="M0 88 L400 88 L400 250 L0 250 Z" fill="url(#wellDepth)" />

      {/* ── TURF AND GRASS ON THE CUT ── */}
      <path d={TURF} fill={`hsl(96, ${8 + p * 9}%, ${6.4 + p * 3.4}%)`} />
      <g>
        {TUFTS.map((t, i) => (
          <g key={i} opacity={0.4 + p * 0.45}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values={`0 ${t.x} ${t.y}; ${t.swing} ${t.x} ${t.y}; ${-t.swing * 0.6} ${t.x} ${t.y}; 0 ${t.x} ${t.y}`}
              dur={t.dur}
              repeatCount="indefinite"
            />
            {t.blades.map((d, j) => (
              <path key={j} d={d} fill={`hsl(${96 + j * 7}, ${13 + p * 14}%, ${9 + p * 7 + j * 0.9}%)`} />
            ))}
          </g>
        ))}
      </g>


      {/* ── THE AQUIFER — where the water is held, and where it answers
           first. Below the desktop typing overlay, fully visible on a
           phone; the seeps carry the story up into the shaft either way. */}
      <path d={AQUIFER} fill="url(#wellWaterGrad)" opacity={spring * 0.5} />
      <g fill="none" strokeLinecap="round" opacity={spring * Math.max(0, 0.5 - rise * 0.44)} filter="url(#wellSpringGlow)">
        {SEEPS.map((d, i) => (
          <path key={i} d={d} stroke="#5cbcbc" strokeWidth={i % 2 ? 0.6 : 0.9} />
        ))}
      </g>

      {/* ── THE SHAFT ── */}
      <path d={SHAFT_VOID} fill={`hsl(200, 12%, ${2.4 + reveal * 1.2}%)`} />
      <path d={SHAFT_BACK} fill="url(#wellBackWall)" />
      {/* Coursing on the far wall: the lining seen from the inside. The
          three courses inside the ring mouth carry a lit lip as well as a
          shadow — without them the mouth is a black square between the
          two cut stacks. */}
      <g fill="none" strokeWidth="0.6" opacity={0.4 + reveal * 0.4}>
        {BACK_COURSES.map((d, i) => (
          <path key={i} d={d} stroke="#0d1418" />
        ))}
      </g>
      <g fill="none" strokeWidth="0.7" strokeLinecap="round">
        {MOUTH_COURSES.map((d, i) => (
          <g key={i}>
            <path d={d} stroke="#020406" opacity="0.85" />
            <path d={d} transform="translate(0 -1)" stroke="#5c6d78" opacity={0.14 + p * 0.1} />
          </g>
        ))}
      </g>
      {/* Starlight falling a little way in at the mouth, then dying. Fades
          out at the bottom so it never reads as a lit box in the dark. */}
      <path
        d="M180 66 C188 68.5, 212 68.5, 220 66 C219 76, 217 84, 214 92
           C208 94, 192 94, 186 92 C183 84, 181 76, 180 66 Z"
        fill="url(#wellMouthLight)"
        opacity={0.5 + p * 0.5}
      />
      {/* Round the throat: the walls fall away at the cut edges */}
      <path d={SHAFT_BACK} fill="url(#wellShaftCyl)" />
      {/* Dry floor: cracked silt, drowned once the water arrives */}
      <g opacity={Math.max(0, 1 - rise * 2.2) * 0.55} fill="none" strokeWidth="0.6" strokeLinecap="round">
        <path d="M181 197 C188 195.4, 195 198, 202 196.2 C209 194.6, 215 197, 220 195.6" stroke="hsl(30, 10%, 14%)" />
        <path d="M186 192 C190 193.6, 194 191, 199 192.6" stroke="hsl(30, 10%, 12%)" />
        <path d="M205 193 C209 191.6, 214 193.6, 218 192" stroke="hsl(30, 10%, 12%)" />
      </g>

      {/* ── THE WATER COLUMN ── */}
      {rise > 0.005 && (
        <>
          <path
            d={`M${SHAFT_L} ${waterTop} C${SHAFT_L + 7} ${waterTop - 1.2} ${SHAFT_L + 15} ${waterTop + 1.1} 200 ${waterTop}
                C${SHAFT_R - 15} ${waterTop - 1.1} ${SHAFT_R - 7} ${waterTop + 1.2} ${SHAFT_R} ${waterTop}
                L${SHAFT_R} ${FLOOR} L${SHAFT_L} ${FLOOR} Z`}
            fill="url(#wellWaterGrad)"
            opacity={0.92}
          />

          <g clipPath="url(#wellWaterClip)">
            {/* Caustics — light banding under the surface, sliding slowly.
                Held in a group React only translates, so the SMIL never
                restarts on a keystroke. */}
            <g transform={`translate(0 ${waterTop})`} opacity={0.14 + rise * 0.18}>
              <g fill="none" stroke="#9fe6e0" strokeWidth="0.7" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="-3 0; 3 0; -3 0"
                  dur="9s"
                  repeatCount="indefinite"
                />
                <path d="M179 7 C186 5.6, 193 8.2, 200 6.6 C207 5, 214 7.6, 221 6.2" />
                <path d="M179 15 C187 13.4, 194 16.4, 201 14.6 C208 12.8, 215 15.6, 221 14" opacity="0.7" />
                <path d="M179 25 C186 23.6, 194 26.4, 201 24.6 C208 22.8, 214 25.4, 221 24" opacity="0.5" />
                <path d="M179 37 C187 35.6, 194 38.2, 201 36.6 C208 35, 215 37.4, 221 36" opacity="0.34" />
              </g>
            </g>

            {/* Bubbles rising to the surface. Positioned relative to the
                surface so their SMIL values stay constant. */}
            <g transform={`translate(0 ${waterTop})`} opacity={0.4 + song * 0.5}>
              {[
                { x: 186, d: "5.5s", b: "-0.4s", r: 0.7, from: 52 },
                { x: 196, d: "7.2s", b: "-2.6s", r: 0.5, from: 62 },
                { x: 206, d: "6.1s", b: "-4.1s", r: 0.8, from: 46 },
                { x: 214, d: "8.4s", b: "-1.3s", r: 0.55, from: 70 },
                { x: 191, d: "9.1s", b: "-5.8s", r: 0.45, from: 58 },
              ].map((b, i) => (
                <circle key={i} cx={b.x} cy={b.from} r={b.r} fill="#a8ece6">
                  <animate attributeName="cy" values={`${b.from};3`} dur={b.d} begin={b.b} repeatCount="indefinite" />
                  <animate
                    attributeName="opacity"
                    values="0;0.65;0.65;0"
                    keyTimes="0;0.2;0.8;1"
                    dur={b.d}
                    begin={b.b}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>

            {/* The old songs, carried home: rune sparks lifting through
                the column toward the mouth during phrase two. */}
            <g transform={`translate(0 ${waterTop})`} opacity={song * 0.8}>
              {[
                { x: 189, d: "6.4s", b: "-1.1s", from: 60 },
                { x: 203, d: "7.8s", b: "-3.9s", from: 72 },
                { x: 212, d: "5.9s", b: "-5.2s", from: 50 },
              ].map((m, i) => (
                <g key={i} stroke="#7fe0d8" strokeWidth="0.55" fill="none" strokeLinecap="round">
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`0 0; 0 ${-m.from + 4}`}
                    dur={m.d}
                    begin={m.b}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.75;0.75;0"
                    keyTimes="0;0.18;0.75;1"
                    dur={m.d}
                    begin={m.b}
                    repeatCount="indefinite"
                  />
                  <path d={`M${m.x} ${m.from - 2.2} L${m.x} ${m.from + 2.2} M${m.x} ${m.from - 0.8} L${m.x - 1.8} ${m.from - 0.8} M${m.x} ${m.from + 0.8} L${m.x + 1.8} ${m.from + 0.8}`} />
                </g>
              ))}
            </g>
          </g>

          {/* The same round-throat ramp over the water, so the column is
              held by stone on both sides instead of butting flat into it. */}
          <path
            d={`M${SHAFT_L} ${waterTop} L${SHAFT_R} ${waterTop} L${SHAFT_R} ${FLOOR} L${SHAFT_L} ${FLOOR} Z`}
            fill="url(#wellShaftCyl)"
            opacity="0.85"
          />

          {/* Surface line: a thin wave that breathes. Static geometry in a
              group React only translates. */}
          <g transform={`translate(0 ${waterTop})`}>
            <g fill="none" stroke="#b6f0ea" strokeWidth="0.85" strokeLinecap="round" opacity={0.25 + rise * 0.4}>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 0.9; 0 -0.5; 0 0"
                dur="6.5s"
                repeatCount="indefinite"
              />
              <path d={`M${SHAFT_L + 1} 0 C${SHAFT_L + 8} -1.3 ${SHAFT_L + 16} 1.1 200 0 C${SHAFT_R - 16} -1.1 ${SHAFT_R - 8} 1.3 ${SHAFT_R - 1} 0`} />
            </g>
          </g>
        </>
      )}

      {/* ── SHAFT LINING — fitted stones, three tones. Submerged courses
           take a wet sheen stone by stone; an earlier pass washed the
           whole band and it read as a glowing rectangle. ── */}
      <g>
        {LINING.map((s, i) => {
          const wet = Math.max(0, Math.min(1, (s.y - waterTop) / 7));
          return (
            <g key={i}>
              <path
                d={s.d}
                fill={`hsl(34, ${8 + reveal * 4}%, ${tone(s.tone)}%)`}
                stroke="#04070a"
                strokeWidth="0.4"
                strokeOpacity="0.55"
              />
              {wet > 0 && <path d={s.d} fill="#5fc8c4" opacity={wet * 0.22} />}
            </g>
          );
        })}
      </g>
      {/* Mortar shadow between courses so the lining reads as fitted */}
      <g fill="none" stroke="#05080a" strokeWidth="0.6" opacity="0.5">
        {[101, 110, 119, 128, 137, 146, 155, 164, 173, 182, 191].map((y, i) => (
          <g key={i}>
            <path d={`M160 ${y} C165 ${y + 0.6}, 172 ${y - 0.5}, 178 ${y + 0.3}`} />
            <path d={`M222 ${y + 0.3} C228 ${y - 0.5}, 235 ${y + 0.6}, 240 ${y}`} />
          </g>
        ))}
      </g>

      {/* ── RUNES — carved, dark until the water reaches them ── */}
      <g filter="url(#wellCarved)" strokeLinecap="round" fill="none">
        {RUNES.map((r, i) => {
          const lit = Math.max(0, Math.min(1, (r.y - waterTop) / 9));
          const pulse = 0.82 + 0.18 * Math.sin(p * Math.PI * 5 + i * 1.4);
          const d = runeGlyph(r.x, r.y, r.g);
          return (
            <g key={i}>
              {/* the incision itself, always present in the stone */}
              <path d={d} stroke="#0a0706" strokeWidth="1.2" opacity={0.5 + reveal * 0.35} />
              <path
                d={d}
                transform="translate(0 -0.5)"
                stroke={`hsl(34, 8%, ${stoneL + 4}%)`}
                strokeWidth="0.6"
                opacity={0.25 + reveal * 0.3}
              />
              {lit > 0 && (
                <g filter="url(#wellRuneGlow)" opacity={lit * 0.9 * pulse}>
                  <path d={d} stroke="#7fe4dc" strokeWidth="0.9" />
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Near-field cut faces at the frame edges — one more depth plane */}
      <path
        d="M0 86 C10 92, 6 120, 11 150 C15 178, 8 212, 12 250 L0 250 Z"
        fill="#05070a"
        opacity="0.6"
      />
      <path
        d="M400 86 C390 92, 394 120, 389 150 C385 178, 392 212, 388 250 L400 250 Z"
        fill="#05070a"
        opacity="0.6"
      />

      {/* ── THE WELL RING, CUT IN HALF ── */}
      <g>
        {RING.map((s, i) => (
          <path key={i} d={s.d} fill={`hsl(35, ${9 + p * 4}%, ${12 + p * 5.5 + (s.tone - 1) * 2.2}%)`} />
        ))}
      </g>
      <g fill="none" stroke="#05080a" strokeWidth="0.6" opacity="0.5">
        <path d="M160 72.5 C166 73.4, 172 72, 179 72.8" />
        <path d="M221 72.8 C228 72, 234 73.4, 240 72.5" />
        <path d="M161 81 C167 81.8, 173 80.6, 179 81.4" />
        <path d="M221 81.4 C227 80.6, 233 81.8, 239 81" />
      </g>

      {/* ── FRAME, ROOF, ROPE, BUCKET ── */}
      <path d={POST_L} fill={`hsl(28, ${13 + p * 5}%, ${woodL}%)`} />
      <path d={POST_R} fill={`hsl(28, ${13 + p * 5}%, ${woodL}%)`} />
      <g fill="none" stroke={`hsl(26, 12%, ${woodL - 3.5}%)`} strokeWidth="0.5" opacity="0.8">
        <path d="M174.4 42 C173.8 51, 174 61, 174.4 69" />
        <path d="M225.6 42 C226.2 51, 226 61, 225.6 69" />
      </g>
      <path d={BEAM} fill={`hsl(28, ${13 + p * 5}%, ${woodL + 1.5}%)`} />

      <path d={ROOF} fill={`hsl(24, ${11 + p * 4}%, ${10 + p * 4.5}%)`} />
      <g fill="none" stroke={`hsl(24, 10%, ${13 + p * 5}%)`} strokeWidth="0.55" opacity="0.75">
        {SHINGLES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* Ridge catching the sky */}
      <path
        d="M176 31 C184 26, 193 20.5, 200 18.4 C207 20.5, 216 26, 224 31"
        fill="none"
        stroke={`hsl(30, 14%, ${16 + p * 7}%)`}
        strokeWidth="0.8"
        opacity="0.7"
      />

      {/* Rope — pays out slack as the bucket rides the water up */}
      <path
        d={`M200 47 C${(200 + slack * 0.17).toFixed(1)} ${(47 + (bucketY - 47) * 0.35).toFixed(1)}, ${(200 + slack * 0.21).toFixed(1)} ${(47 + (bucketY - 47) * 0.72).toFixed(1)}, 200 ${bucketY.toFixed(1)}`}
        fill="none"
        stroke={`hsl(40, ${12 + p * 8}%, ${18 + p * 8}%)`}
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* Bucket — staved, hand-drawn, floating once the water finds it */}
      <g>
        <path
          d={`M193.2 ${bucketY} C192.5 ${bucketY + 4}, 193.3 ${bucketY + 9}, 194.6 ${bucketY + 12.2}
              C197 ${bucketY + 13.4}, 203 ${bucketY + 13.4}, 205.4 ${bucketY + 12.2}
              C206.7 ${bucketY + 9}, 207.5 ${bucketY + 4}, 206.8 ${bucketY} Z`}
          fill={`hsl(30, ${13 + p * 7}%, ${13 + p * 6}%)`}
        />
        <path
          d={`M192.4 ${bucketY - 0.4} C196 ${bucketY + 1.4}, 204 ${bucketY + 1.4}, 207.6 ${bucketY - 0.4}
              C204 ${bucketY - 2}, 196 ${bucketY - 2}, 192.4 ${bucketY - 0.4} Z`}
          fill={`hsl(32, ${13 + p * 7}%, ${17 + p * 7}%)`}
        />
        <path
          d={`M194 ${bucketY + 1} C196.5 ${bucketY - 3.6}, 203.5 ${bucketY - 3.6}, 206 ${bucketY + 1}`}
          fill="none"
          stroke={`hsl(35, 10%, ${19 + p * 7}%)`}
          strokeWidth="0.7"
        />
        <g fill="none" stroke="#0a0806" strokeWidth="0.45" opacity="0.7">
          <path d={`M197 ${bucketY + 1} C196.7 ${bucketY + 5}, 196.9 ${bucketY + 9}, 197.2 ${bucketY + 12.6}`} />
          <path d={`M202.8 ${bucketY + 1} C203.1 ${bucketY + 5}, 202.9 ${bucketY + 9}, 202.6 ${bucketY + 12.6}`} />
        </g>
      </g>

      {/* ── MOUTH BREATH — asymmetric wisps lifting off the risen water ── */}
      {waterTop < 140 && (
        <g
          transform={`translate(0 ${(waterTop - 103).toFixed(1)})`}
          fill="none"
          strokeLinecap="round"
          opacity={song * 0.07}
        >
          <path d="M187 101 C184.6 96, 188.4 92, 186.4 87" stroke="#8fd8d4" strokeWidth="0.6">
            <animateTransform attributeName="transform" type="translate" values="0 0; -1.6 -3; 0 0" dur="11s" repeatCount="indefinite" />
          </path>
          <path d="M201 102 C203.4 97, 200 93, 202.4 88 C203.6 85.4, 202 83, 203 80" stroke="#8fd8d4" strokeWidth="0.5" opacity="0.85">
            <animateTransform attributeName="transform" type="translate" values="0 0; 1.4 -4; 0 0" dur="14s" repeatCount="indefinite" />
          </path>
          <path d="M213 101 C210.6 97, 213.4 93.4, 212 90" stroke="#8fd8d4" strokeWidth="0.45" opacity="0.7">
            <animateTransform attributeName="transform" type="translate" values="0 0; 0.9 -2.4; 0 0" dur="9s" repeatCount="indefinite" />
          </path>
        </g>
      )}
    </svg>
  );
}

export default memo(WellScene);
