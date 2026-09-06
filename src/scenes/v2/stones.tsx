import { memo } from "react";
import { sub } from "../util";
import type { SceneProps } from "../../types";
import { GlowFilter } from "../../svg/filters";

// ─── THE SPIRIT STONES (Inkwood 2) ────────────────────────
// Seven standing stones in a perspective arc on a misty moor.
//
//   "stand tall again, guardians of old"  (p 0 – 0.5)
//        each stone slides up out of the earth, clipped at its own
//        base line, and locks with a brief settle-flare.
//   "remember what was promised"          (p 0.5 – 1)
//        the carved runes take light, the ley lines draw between the
//        stones, and then — the signature beat — a pulse of light
//        RUNS along every line, inward toward the center stone. The
//        win text calls them conduits; now you can see it.
//
// Kept from v1 (the light manifest in manifests/stones.ts is tuned to
// them): the seven stone positions, the eight ley connections, the
// seven rune glyphs and their centers (s.y + 0.39·h), the carved-rune
// displacement filter, the terrain paths, the accent #88a8c8.
//
// Changed: stones are irregular chipped silhouettes with a shadow
// side, a lit rim, weathering lines and lichen (they were trapezoids);
// they rise by translation under a base-line mask instead of scaling,
// so they keep their proportions all the way up; the runes now wait
// for phrase 2 (in v1 they lit during phrase 1, out of step with both
// the prompt and the manifest); the aurora is a curtain of wavering
// ribbons instead of a rounded rectangle; the ritual circle is
// hand-inscribed and carries a ring of ground runes; grass sways.

// ─── SMALL GEOMETRY HELPERS ───────────────────────────────

interface Pt { x: number; y: number; s?: boolean }

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Catmull-Rom-ish smoothing through points. A point marked `s` (sharp)
 *  pins its own control handle, so chips and notches stay as corners
 *  while the weathered stretches between them stay curved. */
function curveThrough(pts: Pt[], closed: boolean, f = 0.17): string {
  const n = pts.length;
  const at = (i: number) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${r2(pts[0].x)} ${r2(pts[0].y)}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1x = p1.s ? p1.x : p1.x + (p2.x - p0.x) * f;
    const c1y = p1.s ? p1.y : p1.y + (p2.y - p0.y) * f;
    const c2x = p2.s ? p2.x : p2.x - (p3.x - p1.x) * f;
    const c2y = p2.s ? p2.y : p2.y - (p3.y - p1.y) * f;
    d += ` C${r2(c1x)} ${r2(c1y)}, ${r2(c2x)} ${r2(c2y)}, ${r2(p2.x)} ${r2(p2.y)}`;
  }
  return closed ? d + " Z" : d;
}

/** A closed ring with hand-wobbled radius — used for the inscribed
 *  ritual circle, lichen patches and base rubble. Nothing here is a
 *  drawn `circle`; the wobble is what keeps it from reading as clip art. */
function wobbleRing(cx: number, cy: number, rx: number, ry: number, n: number, wob: number, seed: number): string {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + Math.sin(a * 3 + seed) * wob + Math.sin(a * 5 + seed * 2.3) * wob * 0.55;
    pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k });
  }
  return curveThrough(pts, true);
}

/** One tapered blade of moor grass — a closed path, never a stroked line. */
function blade(x: number, y: number, h: number, dx: number, w = 0.7): string {
  return `M${r2(x - w)} ${r2(y)} Q${r2(x - w * 0.5)} ${r2(y - h * 0.55)} ${r2(x + dx)} ${r2(y - h)} Q${r2(x + w * 0.6)} ${r2(y - h * 0.5)} ${r2(x + w)} ${r2(y)} Z`;
}

// ─── HAND-CRAFTED TERRAIN ─────────────────────────────────
// The far ridge is v1's rolling moor raised into a broad swell that
// crests under the center stone. v1's stones stood with their base
// line above the horizon, so they read as floating; every base now
// lands on drawn ground. Positions are untouched — the land moved.

const RIDGE = `
  M0 176 C22 172, 44 170, 66 166
  C86 162, 98 156, 116 150
  C132 145, 146 139, 168 136
  C186 133.5, 200 133, 216 135
  C232 137, 244 141, 258 142
  C272 143, 286 147, 300 152
  C316 158, 330 164, 348 168
  C368 172, 386 174, 400 175`;

const HILLS_FAR = `${RIDGE} L400 250 L0 250 Z`;

/** Two faint contours down the swell's face — old sheep paths, or the
 *  grain of the heather. They keep the mound from reading as a slab. */
const CONTOURS = [
  "M14 186 C52 181, 88 172, 128 164 C168 156, 206 152, 248 155 C288 158, 330 168, 372 178",
  "M4 196 C46 192, 96 184, 146 176 C196 168, 240 166, 286 170 C328 174, 366 182, 398 190",
];

const HILLS_MID = `
  M0 178 C25 174, 50 180, 75 176
  C100 172, 120 178, 145 174
  C170 170, 190 176, 215 172
  C240 168, 260 174, 285 170
  C310 166, 335 172, 360 168
  C385 164, 395 170, 400 168
  L400 250 L0 250 Z`;

const GROUND = `
  M0 195 C20 192, 45 198, 70 194
  C95 190, 115 196, 140 192
  C165 188, 185 194, 210 190
  C235 186, 255 192, 280 188
  C305 184, 325 190, 350 186
  C375 182, 390 188, 400 185
  L400 250 L0 250 Z`;

// ─── THE STONES ───────────────────────────────────────────
// Positions, sizes, leans and rise delays are v1's exactly.

interface Stone { x: number; y: number; w: number; h: number; lean: number; delay: number }

const STONES: Stone[] = [
  { x: 200, y: 85,  w: 22, h: 58, lean: 0,   delay: 0 },
  { x: 138, y: 100, w: 20, h: 48, lean: -3,  delay: 0.08 },
  { x: 262, y: 98,  w: 21, h: 50, lean: 2,   delay: 0.15 },
  { x: 88,  y: 125, w: 18, h: 42, lean: -5,  delay: 0.22 },
  { x: 312, y: 122, w: 19, h: 44, lean: 4,   delay: 0.28 },
  { x: 62,  y: 158, w: 16, h: 35, lean: -4,  delay: 0.34 },
  { x: 338, y: 155, w: 17, h: 37, lean: 3,   delay: 0.4 },
];

/** A stone silhouette in unit space: u across (-1 = left edge,
 *  +1 = right edge), v down (0 = crown, 1 = base). `1` in the third
 *  slot marks a sharp corner — a chip, a fracture, a shoulder. The
 *  ring runs clockwise from the crown's high point. */
type Vert = [number, number] | [number, number, 1];

interface StoneForm {
  ring: Vert[];
  /** Index of the bottom-right vertex — where the shadow spine meets the base. */
  split: number;
  /** Spine from just under the crown down to the base center; splits
   *  the face into a lit side and a shadowed side. */
  spine: [number, number][];
  /** Weathering lines: [v, u-start, u-end, bow]. */
  grain: [number, number, number, number][];
  /** Lichen: [u, v, rx, ry, seed]. */
  lichen: [number, number, number, number, number][];
}

const FORMS: StoneForm[] = [
  // 0 — the center stone. Tall, imposing, a broken shoulder on the right.
  {
    ring: [
      [0.16, 0], [0.58, 0.06, 1], [0.76, 0.19], [0.58, 0.3, 1], [0.9, 0.4, 1],
      [0.95, 0.62], [0.82, 0.79], [0.99, 0.94, 1], [0.55, 1],
      [-0.62, 1], [-0.93, 0.9, 1], [-0.79, 0.66], [-0.97, 0.47, 1], [-0.71, 0.33],
      [-0.86, 0.16, 1], [-0.36, 0.03, 1],
    ],
    split: 8,
    spine: [[0.12, 0.22], [-0.02, 0.52], [0.13, 0.78], [0.02, 1]],
    grain: [[0.22, -0.7, 0.6, 1.2], [0.46, -0.85, 0.8, -1], [0.68, -0.75, 0.85, 1.4], [0.86, -0.8, 0.9, -0.8]],
    lichen: [[-0.45, 0.58, 3.2, 4.2, 1.3], [0.5, 0.24, 2.1, 2.6, 2.7]],
  },
  // 1 — left of center. Leans, crown sheared off at an angle.
  {
    ring: [
      [-0.1, 0], [0.42, 0.1, 1], [0.68, 0.26], [0.55, 0.4, 1], [0.83, 0.52, 1],
      [0.9, 0.74], [0.99, 0.95, 1], [0.5, 1],
      [-0.66, 1], [-0.95, 0.88, 1], [-0.83, 0.62], [-0.98, 0.4, 1], [-0.74, 0.2],
      [-0.72, 0.06, 1],
    ],
    split: 7,
    spine: [[-0.06, 0.24], [0.08, 0.54], [-0.04, 0.8], [0.0, 1]],
    grain: [[0.3, -0.75, 0.55, -1.1], [0.55, -0.8, 0.7, 1.2], [0.78, -0.85, 0.8, -1]],
    lichen: [[0.42, 0.66, 2.6, 3.4, 0.7]],
  },
  // 2 — right of center. Blockier, deep notch bitten out of the left.
  {
    ring: [
      [0.06, 0], [0.5, 0.04, 1], [0.72, 0.2], [0.88, 0.44], [0.76, 0.62, 1],
      [0.93, 0.8], [0.86, 0.97, 1], [0.48, 1],
      [-0.6, 1], [-0.9, 0.84, 1], [-0.72, 0.68], [-0.98, 0.52, 1], [-0.82, 0.34],
      [-0.55, 0.26, 1], [-0.8, 0.12, 1], [-0.4, 0.02],
    ],
    split: 7,
    spine: [[0.05, 0.24], [-0.06, 0.5], [0.06, 0.76], [-0.02, 1]],
    grain: [[0.2, -0.6, 0.65, 1], [0.44, -0.9, 0.8, -1.2], [0.72, -0.85, 0.85, 1.1], [0.9, -0.7, 0.75, -0.8]],
    lichen: [[-0.4, 0.78, 2.8, 3.2, 2.1], [0.55, 0.35, 1.8, 2.4, 3.4]],
  },
  // 3 — far left. Narrow, tapering, chipped right shoulder.
  {
    ring: [
      [0.0, 0], [0.46, 0.08, 1], [0.62, 0.24], [0.44, 0.36, 1], [0.8, 0.5, 1],
      [0.88, 0.76], [0.96, 0.96, 1], [0.45, 1],
      [-0.62, 1], [-0.94, 0.86, 1], [-0.78, 0.58], [-0.92, 0.34, 1], [-0.6, 0.12, 1],
    ],
    split: 7,
    spine: [[0.04, 0.26], [-0.08, 0.56], [0.06, 0.82], [-0.02, 1]],
    grain: [[0.32, -0.7, 0.55, -1], [0.62, -0.8, 0.75, 1.1], [0.85, -0.75, 0.8, -0.9]],
    lichen: [],
  },
  // 4 — far right. Blunt, wide-footed, a shallow scar near the crown.
  {
    ring: [
      [0.14, 0], [0.6, 0.08, 1], [0.8, 0.3], [0.68, 0.44, 1], [0.92, 0.62, 1],
      [0.86, 0.82], [0.98, 0.97, 1], [0.52, 1],
      [-0.66, 1], [-0.98, 0.9, 1], [-0.84, 0.64], [-0.95, 0.42, 1], [-0.7, 0.22],
      [-0.5, 0.04, 1],
    ],
    split: 7,
    spine: [[0.08, 0.26], [-0.04, 0.56], [0.1, 0.8], [0.0, 1]],
    grain: [[0.26, -0.7, 0.65, 1.1], [0.52, -0.85, 0.75, -1], [0.8, -0.8, 0.85, 1]],
    lichen: [[-0.42, 0.5, 2.4, 3, 1.9]],
  },
  // 5 — nearest left. Stubby, crown broken clean off on the slant.
  {
    ring: [
      [-0.2, 0], [0.34, 0.12, 1], [0.66, 0.3], [0.55, 0.46, 1], [0.86, 0.66, 1],
      [0.94, 0.95, 1], [0.46, 1],
      [-0.64, 1], [-0.96, 0.84, 1], [-0.8, 0.56], [-0.94, 0.32, 1], [-0.7, 0.1, 1],
    ],
    split: 6,
    spine: [[-0.08, 0.3], [0.06, 0.6], [-0.06, 0.84], [0.0, 1]],
    grain: [[0.36, -0.75, 0.6, -1], [0.68, -0.8, 0.8, 1]],
    lichen: [],
  },
  // 6 — nearest right. Stubby with a big bite out of the left flank.
  {
    ring: [
      [0.1, 0], [0.52, 0.1, 1], [0.74, 0.32], [0.6, 0.5, 1], [0.9, 0.7, 1],
      [0.92, 0.96, 1], [0.44, 1],
      [-0.6, 1], [-0.9, 0.86, 1], [-0.58, 0.66, 1], [-0.95, 0.46, 1], [-0.76, 0.24],
      [-0.5, 0.06, 1],
    ],
    split: 6,
    spine: [[0.04, 0.3], [-0.08, 0.6], [0.06, 0.84], [-0.02, 1]],
    grain: [[0.3, -0.6, 0.7, 1], [0.62, -0.8, 0.8, -1.1]],
    lichen: [[0.5, 0.6, 2, 2.4, 0.4]],
  },
];

/** Which flank of each stone lies in shadow: the side turned away from
 *  the ring's center, because the light that matters here rises out of
 *  the ritual circle. */
const SHADOW_LEFT = STONES.map((s) => s.x <= 200);

// Precomputed stone art. The silhouette never changes shape — the rise
// is a translation under a mask — so all of this is built once at module
// load and the render only moves it.
interface StoneArt {
  body: string; shade: string; rim: string;
  grain: string[]; fracture: string[]; lichen: string[]; rubble: string[];
  /** The socket it was pulled out of: a lip of turned turf and the dark
   *  hollow inside it. Both are drawn from p=0, so the dormant moor is
   *  seven empty sockets in an arc rather than nothing at all. */
  lip: string; pit: string;
  /** Contact shadow where the stone meets the ground. */
  contact: string;
}

const STONE_ART: StoneArt[] = STONES.map((s, i) => {
  const form = FORMS[i];
  const hw = s.w / 2;
  const px = (u: number, v: number) => s.x + s.lean * (1 - v) + hw * u;
  const py = (v: number) => s.y + s.h * v;
  const map = (vt: Vert): Pt => ({ x: px(vt[0], vt[1]), y: py(vt[1]), s: vt[2] === 1 });

  const ring = form.ring.map(map);
  const spine: Pt[] = form.spine.map(([u, v]) => ({ x: px(u, v), y: py(v) }));
  const body = curveThrough(ring, true);

  // Shadowed flank: crown → spine → base → back up the outer edge.
  const leftFace: Pt[] = [ring[0], ...spine, ...ring.slice(form.split + 1)];
  const rightFace: Pt[] = [...ring.slice(0, form.split + 1), ...spine.slice().reverse()];
  const shade = curveThrough(SHADOW_LEFT[i] ? leftFace : rightFace, true);

  // Lit rim: the top few segments of the lit flank, stroked only.
  const litSide = SHADOW_LEFT[i]
    ? ring.slice(0, Math.min(4, form.split))
    : ring.slice(form.split + 1, form.split + 5).reverse();
  const rim = curveThrough([ring[0], ...litSide.filter((p) => p !== ring[0])], false);

  const grain = form.grain.map(([v, u1, u2, bow]) => {
    const x1 = px(u1, v), x2 = px(u2, v), y = py(v);
    return `M${r2(x1)} ${r2(y)} Q${r2((x1 + x2) / 2)} ${r2(y + bow)} ${r2(x2)} ${r2(y)}`;
  });

  // One or two near-vertical fractures — the way standing stones split
  // along the grain. Clipped to the silhouette when drawn.
  const fracture = [i % 2 === 0 ? 0.44 : -0.46].map((uOff, k) =>
    curveThrough([0.1, 0.34, 0.6, 0.88].map((v, j) => ({
      x: px(uOff + Math.sin(j * 2.1 + k * 1.7) * 0.09, v),
      y: py(v),
    })), false));

  const lichen = form.lichen.map(([u, v, rx, ry, seed]) =>
    wobbleRing(px(u, v), py(v), rx, ry, 9, 0.28, seed));

  const baseY = s.y + s.h;
  const rubble = [
    wobbleRing(s.x - hw * 0.95, baseY - 0.4, 2.6, 1.5, 8, 0.3, i + 0.5),
    wobbleRing(s.x + hw * 0.85, baseY - 0.2, 2.1, 1.2, 8, 0.3, i + 2.2),
    wobbleRing(s.x + hw * 0.05, baseY + 0.6, 1.6, 0.9, 7, 0.3, i + 4.1),
  ];

  const lip = wobbleRing(s.x + s.lean * 0.2, baseY + 0.5, hw * 1.75, 3.2, 13, 0.2, i + 6.3);
  const pit = wobbleRing(s.x, baseY - 0.5, hw * 1.05, 2.0, 12, 0.24, i + 8.1);
  const contact = wobbleRing(s.x, baseY - 0.4, hw * 1.15, 1.5, 11, 0.2, i + 9.7);

  return { body, shade, rim, grain, fracture, lichen, rubble, lip, pit, contact };
});

// Ley connections — v1's eight. The pulse always runs from `to` to
// `from`, which walks inward along the chain toward the center stone.
const LEY_LINES = [
  { from: 0, to: 1, delay: 0.5 },
  { from: 0, to: 2, delay: 0.54 },
  { from: 1, to: 3, delay: 0.58 },
  { from: 2, to: 4, delay: 0.62 },
  { from: 3, to: 5, delay: 0.66 },
  { from: 4, to: 6, delay: 0.7 },
  { from: 5, to: 6, delay: 0.75 },
  { from: 1, to: 2, delay: 0.78 },
];

/** Where a ley line meets a stone: just under the crown, and never
 *  below y=170 on the near stones (the typing overlay lives there). */
const leyY = (s: Stone) => s.y + Math.min(15, s.h * 0.28);

// Rune glyphs — v1's exactly, and their centers still land on the
// manifest's RUNES coordinates (s.x, s.y + 0.39·h).
const RUNE_SHAPES = [
  "M0-5 L0 5 M-3-2 L3-2",
  "M-3-5 L0 0 L3-5 M0 0 L0 5",
  "M-3-4 L3-4 L3 4 L-3 4",
  "M0-5 L3 0 L0 5 L-3 0 Z",
  "M-3-5 L3 5 M3-5 L-3 5",
  "M-2-5 L-2 5 M2-5 L2 5 M-4 0 L4 0",
  "M0-5 L4 0 L0 5 M0-5 L-4 0 L0 5",
];

// ─── THE RITUAL CIRCLE ────────────────────────────────────

const CIRCLE_CY = 158;
const RITUAL_RING = wobbleRing(200, CIRCLE_CY, 118, 17, 22, 0.012, 1.7);
/** The inner ring the ground runes are inscribed along — a hairline, so
 *  the glyphs read as a ring rather than as scatter. */
const RUNE_RING_LINE = wobbleRing(200, CIRCLE_CY - 2, 93, 12.5, 20, 0.014, 3.1);
const RUNE_RING = Array.from({ length: 10 }).map((_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.3;
  return {
    x: 200 + Math.cos(a) * 93,
    y: CIRCLE_CY - 2 + Math.sin(a) * 12.5,
    shape: RUNE_SHAPES[i % RUNE_SHAPES.length],
    order: i / 10,
  };
});

// ─── THE AURORA CURTAIN ───────────────────────────────────
// Long wavering ribbons, not a wash: each is a band whose top and
// bottom edges ripple, filled with a vertical gradient that dies out
// before it reaches the hills. Two `d` variants per ribbon (identical
// command structure, different phase) morph into each other on SMIL.

function ribbon(x0: number, x1: number, topY: number, height: number, amp: number, phase: number): string {
  const n = 11;
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    // The band closes to nothing at both ends. Without this taper the
    // ribbon has square ends and the curtain reads as a rectangle —
    // which is the one thing the brief says it must never be.
    const hem = Math.pow(Math.sin(Math.PI * t), 0.65);
    const wave = Math.sin(t * 5.2 + phase) * amp + Math.sin(t * 11 + phase * 1.6) * amp * 0.35;
    top.push({ x, y: topY + wave });
    bottom.push({
      x,
      y: topY + wave + height * hem
        + (Math.sin(t * 4.1 + phase * 1.3) * amp * 1.4 + Math.sin(t * 9 + phase) * amp * 0.4) * hem,
    });
  }
  const down = curveThrough(top, false);
  const back = curveThrough(bottom.slice().reverse(), false).replace(/^M/, "L");
  return `${down} ${back} Z`;
}

const CURTAINS = [
  { x0: 46, x1: 352, top: 8, h: 34, amp: 6, a: 0.4, b: 2.8, grad: "auroraA", peak: 0.14, dur: "23s" },
  { x0: 96, x1: 388, top: 22, h: 22, amp: 5, a: 1.9, b: 4.6, grad: "auroraB", peak: 0.1, dur: "31s" },
  { x0: 20, x1: 288, top: 3, h: 16, amp: 4, a: 3.4, b: 0.9, grad: "auroraC", peak: 0.07, dur: "27s" },
].map((c) => ({ ...c, dA: ribbon(c.x0, c.x1, c.top, c.h, c.amp, c.a), dB: ribbon(c.x0, c.x1, c.top, c.h, c.amp, c.b) }));

/** Vertical striations hanging inside the curtain. Aurora light falls in
 *  rays; without them the ribbons read as fog. Tapered slivers, each on
 *  its own slow clock. */
const RAYS = [78, 112, 143, 176, 205, 238, 268, 302].map((x, i) => {
  const top = 7 + ((i * 5) % 9);
  const len = 26 + ((i * 7) % 17);
  const w = 1.6 + (i % 3) * 0.6;
  return {
    d: `M${x - w} ${top} Q${x - w * 0.35} ${top + len * 0.55} ${x + (i % 2 ? 1.6 : -1.6)} ${top + len} Q${x + w * 0.35} ${top + len * 0.5} ${x + w} ${top} Z`,
    dur: `${9 + (i % 5) * 2.6}s`,
    begin: `-${(i * 1.3).toFixed(1)}s`,
    peak: 0.07 + (i % 3) * 0.022,
  };
});

// ─── GRASS ────────────────────────────────────────────────

const TUFTS = [
  { x: 25, y: 196 }, { x: 55, y: 193 }, { x: 90, y: 198 },
  { x: 130, y: 194 }, { x: 170, y: 190 }, { x: 210, y: 192 },
  { x: 250, y: 188 }, { x: 290, y: 190 }, { x: 320, y: 186 },
  { x: 360, y: 188 }, { x: 390, y: 185 },
  { x: 40, y: 205 }, { x: 115, y: 202 }, { x: 200, y: 200 },
  { x: 275, y: 198 }, { x: 345, y: 196 },
].map((g, i) => ({
  ...g,
  blades: [
    { d: blade(g.x - 2.4, g.y, 5.5 + (i % 3), -1.6, 0.6), tone: 0 },
    { d: blade(g.x, g.y, 7.5 + (i % 4) * 0.8, 0.9, 0.7), tone: 1 },
    { d: blade(g.x + 2.6, g.y, 4.6 + (i % 2) * 1.4, 1.8, 0.55), tone: 2 },
  ],
  dur: `${(5.4 + (i % 5) * 0.9).toFixed(1)}s`,
  begin: `-${(i * 0.53).toFixed(2)}s`,
  amp: 1.1 + (i % 3) * 0.35,
}));

// Heather patches — irregular, low, hand-wobbled (v1 used ellipses).
const HEATHER = [
  { d: wobbleRing(50, 198, 26, 4, 12, 0.22, 0.4), h: 300, s: 15 },
  { d: wobbleRing(160, 195, 31, 5, 12, 0.22, 1.6), h: 280, s: 12 },
  { d: wobbleRing(280, 196, 23, 4, 12, 0.22, 2.9), h: 320, s: 14 },
  { d: wobbleRing(370, 192, 19, 3.4, 11, 0.22, 3.7), h: 290, s: 10 },
  { d: wobbleRing(110, 202, 21, 3.4, 11, 0.22, 4.5), h: 310, s: 12 },
  { d: wobbleRing(330, 200, 25, 4, 12, 0.22, 5.3), h: 270, s: 15 },
];

// Small cairns at the ring's edge — stacked pebbles, each a wobbled path.
const CAIRNS = [
  { x: 168, y: 192 }, { x: 232, y: 190 }, { x: 115, y: 200 }, { x: 285, y: 198 },
].map((c, i) => ({
  stack: [
    wobbleRing(c.x, c.y, 3.2, 2.4, 9, 0.26, i + 0.3),
    wobbleRing(c.x - 1, c.y - 4, 2.7, 2.1, 9, 0.26, i + 1.9),
    wobbleRing(c.x + 0.5, c.y - 7.2, 2.1, 1.7, 8, 0.26, i + 3.4),
  ],
}));

// Low mist, hugging the foot of the swell where the manifest's haze
// band also sits. Asymmetric lengths so it never reads as ruled lines.
const MIST = [
  { d: "M0 182 C36 178, 78 185, 128 181 C176 177, 214 184, 262 180 C300 177, 342 183, 400 179", w: 5, o: 0.04 },
  { d: "M22 194 C70 190, 118 197, 176 193 C232 189, 278 196, 336 192 C366 190, 386 194, 400 193", w: 3.4, o: 0.035 },
  { d: "M0 205 C58 201, 112 208, 172 204 C226 200, 268 206, 320 203", w: 2.2, o: 0.028 },
];

const WISPS = [
  { x: 100, y: 170, delay: 0.4, r: 2, dur: "13s", dx: 7, dy: -5 },
  { x: 300, y: 165, delay: 0.5, r: 1.8, dur: "17s", dx: -6, dy: -4 },
  { x: 200, y: 176, delay: 0.6, r: 2.2, dur: "15s", dx: 5, dy: -6 },
];

// ─── SCENE ────────────────────────────────────────────────

function StonesScene({ progress: p }: SceneProps) {
  const skyH = 220;
  const skyS = 10 + p * 8;
  const skyL = 5.6 + p * 6.6;
  const groundH = 35 - p * 5;
  const groundS = 7 + p * 5;
  const groundL = 6.5 + p * 3.2;

  const auroraP = sub(p, 0.68, 0.25);
  const circleP = sub(p, 0.65, 0.2);

  const stoneMid = `hsl(220, ${7 + p * 3}%, ${15 + p * 4.5}%)`;
  const stoneShade = `hsl(224, ${9 + p * 3}%, ${9.5 + p * 3}%)`;
  const stoneRim = `hsl(214, ${10 + p * 6}%, ${26 + p * 10}%)`;

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="runeGlow" radius={5} color="#88a8c8" opacity={0.6} />
        <GlowFilter id="leyGlow" radius={3} color="#88a8c8" opacity={0.5} />
        {/* Carved-rune roughening: turbulence + displacement gives the
             vector-perfect rune strokes a hand-chiseled wobble so they
             read as weathered carvings rather than computer glyphs. */}
        <filter id="runeCarved" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.7" />
        </filter>

        <linearGradient id="stonesSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${skyH}, ${skyS}%, ${skyL + 4}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH - 5}, ${skyS + 3}%, ${skyL}%)`} />
        </linearGradient>

        {/* Curtain gradients — bright along the top edge, gone before
             the hills. A curtain has a hem; a wash does not. */}
        <linearGradient id="auroraA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fe6c8" stopOpacity={0.15} />
          <stop offset="22%" stopColor="#6fd0b0" stopOpacity={1} />
          <stop offset="100%" stopColor="#4f8fc0" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="auroraB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fd8e0" stopOpacity={0.2} />
          <stop offset="30%" stopColor="#79c4d8" stopOpacity={1} />
          <stop offset="100%" stopColor="#5f88c0" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="auroraC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b6e8d0" stopOpacity={0.1} />
          <stop offset="35%" stopColor="#7fd8b8" stopOpacity={1} />
          <stop offset="100%" stopColor="#6aa0c8" stopOpacity={0} />
        </linearGradient>

        {/* The swell has form: crest catches the sky, the flank falls away. */}
        <linearGradient id="swell" gradientUnits="userSpaceOnUse" x1="0" y1="130" x2="0" y2="206">
          <stop offset="0%" stopColor={`hsl(${skyH - 4}, ${Math.max(4, skyS - 3)}%, ${skyL + 3.4}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH - 2}, ${skyS}%, ${skyL - 0.8}%)`} />
        </linearGradient>

        {/* Wisps need a soft edge; a flat-opacity disc reads as a plate. */}
        <radialGradient id="wispHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a8c8e8" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#88a8c8" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="stonesGlow" cx="50%" cy="45%" r="40%">
          <stop offset="0%" stopColor="#88a8c8" stopOpacity={p * 0.09} />
          <stop offset="100%" stopColor="#88a8c8" stopOpacity={0} />
        </radialGradient>

        {/* One mask per stone: everything below its own base line is
             still underground and must not be drawn. */}
        {STONES.map((s, i) => (
          <clipPath key={`sm${i}`} id={`stoneMask${i}`}>
            <rect x={s.x - 40} y={0} width={80} height={s.y + s.h} />
          </clipPath>
        ))}
        {/* And one per silhouette, so weathering and lichen stay on the rock. */}
        {STONE_ART.map((a, i) => (
          <clipPath key={`sb${i}`} id={`stoneBody${i}`}>
            <path d={a.body} />
          </clipPath>
        ))}
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="250" fill="url(#stonesSky)" />

      {/* ── AURORA CURTAIN ──
           Three long ribbons wavering on their own slow clocks. Never a
           wash: the frame's corners stay navy. */}
      {auroraP > 0 && (
        <g opacity={auroraP}>
          {RAYS.map((r, i) => (
            <path key={`ray${i}`} d={r.d} fill="url(#auroraA)" opacity={r.peak}>
              <animate attributeName="opacity"
                values={`${r.peak * 0.15};${r.peak};${r.peak * 0.35};${r.peak * 0.15}`}
                dur={r.dur} begin={r.begin} repeatCount="indefinite" />
            </path>
          ))}
          {CURTAINS.map((c, i) => (
            <path key={`cur${i}`} d={c.dA} fill={`url(#${c.grad})`} opacity={c.peak}>
              <animate attributeName="d" values={`${c.dA};${c.dB};${c.dA}`} dur={c.dur}
                repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1"
                keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin={`-${i * 3.5}s`} />
              <animate attributeName="opacity"
                values={`${c.peak * 0.45};${c.peak};${c.peak * 0.6};${c.peak * 0.45}`}
                dur={`${11 + i * 4}s`} repeatCount="indefinite" begin={`-${i * 2.3}s`} />
            </path>
          ))}
        </g>
      )}

      {/* ── THE SWELL — the moor rises to hold the circle ── */}
      <path d={HILLS_FAR} fill="url(#swell)" />
      <path d={RIDGE} fill="none"
        stroke={`hsl(${skyH - 10}, ${skyS}%, ${skyL + 5}%)`} strokeWidth="0.8" opacity="0.22" />
      {CONTOURS.map((d, i) => (
        <path key={`ct${i}`} d={d} fill="none"
          stroke={`hsl(${skyH - 6}, ${skyS}%, ${skyL + 3}%)`}
          strokeWidth={0.6} opacity={0.12 - i * 0.03} />
      ))}

      {/* ── MID BAND ── */}
      <path d={HILLS_MID} fill={`hsl(${skyH - 8}, ${skyS}%, ${skyL - 0.4}%)`} />

      {/* ── FOREGROUND MOOR ── */}
      <path d={GROUND} fill={`hsl(${groundH}, ${groundS}%, ${groundL}%)`} />
      <rect x="0" y="200" width="400" height="50" fill={`hsl(${groundH}, ${groundS}%, ${groundL - 1}%)`} />

      {/* ── HEATHER ── */}
      {HEATHER.map((h, i) => (
        <path key={`moss${i}`} d={h.d}
          fill={`hsl(${h.h}, ${h.s + p * 8}%, ${groundL + 1}%)`}
          opacity={0.15 + p * 0.15} />
      ))}

      {/* ── THE SOCKETS ──
           Seven hollows in an arc, the turf around each one still turned.
           At p=0 this is the whole picture: something stood here. */}
      {STONE_ART.map((a, i) => (
        <g key={`sock${i}`} opacity={0.85 - sub(p, STONES[i].delay, 0.2) * 0.25}>
          <path d={a.lip} fill={`hsl(${groundH + 14}, ${groundS}%, ${groundL + 2.5}%)`} opacity={0.3} />
          <path d={a.pit} fill={`hsl(224, 11%, ${Math.max(3, skyL - 1.6)}%)`} opacity={0.6} />
        </g>
      ))}

      {/* ── CENTRAL BASIN GLOW ── */}
      <ellipse cx="200" cy="155" rx="140" ry="60" fill="url(#stonesGlow)" />

      {/* ── RITUAL CIRCLE — inscribed by hand, with a ring of ground runes ── */}
      {circleP > 0 && (
        <g opacity={circleP}>
          <path d={RITUAL_RING} fill="none" stroke="#88a8c8" strokeWidth="0.8"
            opacity="0.32" strokeDasharray="6 8" />
          <path d={RUNE_RING_LINE} fill="none" stroke="#88a8c8" strokeWidth="0.4"
            opacity={sub(p, 0.7, 0.16) * 0.18} />
          {RUNE_RING.map((g, i) => {
            const gp = sub(p, 0.7 + g.order * 0.14, 0.14);
            return gp > 0 ? (
              <g key={`gr${i}`} transform={`translate(${r2(g.x)}, ${r2(g.y)}) scale(0.48, 0.3)`}
                opacity={gp * 0.36}>
                <path d={g.shape} fill="none" stroke="#9fc0e0" strokeWidth="2.6"
                  strokeLinecap="round" filter="url(#runeCarved)" />
              </g>
            ) : null;
          })}
        </g>
      )}

      {/* ── GRASS — tapered blades, swaying on their own clocks ── */}
      {TUFTS.map((t, i) => {
        const gp = 0.35 + p * 0.65;
        return (
          <g key={`tuft${i}`} opacity={gp * 0.55}>
            <g>
              <animateTransform attributeName="transform" type="rotate"
                values={`${-t.amp} ${t.x} ${t.y};${t.amp} ${t.x} ${t.y};${-t.amp} ${t.x} ${t.y}`}
                dur={t.dur} begin={t.begin} repeatCount="indefinite"
                calcMode="spline" keyTimes="0;0.5;1"
                keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
              {t.blades.map((b, j) => (
                <path key={j} d={b.d}
                  fill={`hsl(${28 + b.tone * 4 + (i % 3) * 3}, ${11 + b.tone * 2 + p * 8}%, ${9 + b.tone * 1.5 + p * 5}%)`} />
              ))}
            </g>
          </g>
        );
      })}

      {/* ── LEY LINES ── the promise, drawn ── */}
      {LEY_LINES.map((l, i) => {
        const lp = sub(p, l.delay, 0.12);
        if (lp <= 0) return null;
        const s1 = STONES[l.from], s2 = STONES[l.to];
        const y1 = leyY(s1), y2 = leyY(s2);
        const len = Math.hypot(s2.x - s1.x, y2 - y1);
        return (
          <g key={`ley${i}`}>
            <line x1={s1.x} y1={y1} x2={s2.x} y2={y2}
              stroke="#88a8c8" strokeWidth="1.5" strokeLinecap="round"
              strokeDasharray={len} strokeDashoffset={len * (1 - lp)}
              opacity={lp * 0.4} filter="url(#leyGlow)" />
            <line x1={s1.x} y1={y1} x2={s2.x} y2={y2}
              stroke="#b0c8e0" strokeWidth="0.5" strokeLinecap="round"
              strokeDasharray={len} strokeDashoffset={len * (1 - lp)}
              opacity={lp * 0.2} />
          </g>
        );
      })}

      {/* ── THE SIGNATURE BEAT: light travels the ley lines ──
           Once a line has finished drawing, a short dash of light runs
           along it from the outer stone inward toward the center. A
           2.9s flight, staggered 0.34s apart and started in the past
           (negative begin) so the ring is already breathing the moment
           the last line completes — no dead wait, and every screenshot
           catches pulses mid-flight. */}
      {LEY_LINES.map((l, i) => {
        const lp = sub(p, l.delay, 0.12);
        if (lp < 1) return null;
        const s1 = STONES[l.from], s2 = STONES[l.to];
        const y1 = leyY(s1), y2 = leyY(s2);
        const len = Math.hypot(s2.x - s1.x, y2 - y1);
        const dash = 9;
        const pattern = `${dash} ${len + dash}`;
        const strength = sub(p, l.delay + 0.12, 0.1);
        return (
          <g key={`pulse${i}`} opacity={strength}>
            {/* halo */}
            <line x1={s2.x} y1={y2} x2={s1.x} y2={y1}
              stroke="#88c8e8" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={pattern} opacity={0.26} filter="url(#leyGlow)">
              <animate attributeName="stroke-dashoffset" from={dash} to={-len}
                dur="2.9s" begin={`-${(i * 0.34).toFixed(2)}s`} repeatCount="indefinite" />
            </line>
            {/* the bright head */}
            <line x1={s2.x} y1={y2} x2={s1.x} y2={y1}
              stroke="#e2f2ff" strokeWidth="1.15" strokeLinecap="round"
              strokeDasharray={pattern} opacity={0.8}>
              <animate attributeName="stroke-dashoffset" from={dash} to={-len}
                dur="2.9s" begin={`-${(i * 0.34).toFixed(2)}s`} repeatCount="indefinite" />
            </line>
          </g>
        );
      })}

      {/* ── STANDING STONES ── */}
      {STONES.map((s, i) => {
        const sp = sub(p, s.delay, 0.2);
        if (sp <= 0) return null;
        const art = STONE_ART[i];
        // The stone slides up out of the earth, keeping its proportions,
        // and the mask hides whatever is still below its base line.
        const lift = (1 - sp) * (s.h + 4);
        // A brief flare as it seats itself — the Bridge's "lock" beat.
        const settle = sp > 0.72 ? Math.sin(sub(sp, 0.72, 0.28) * Math.PI) : 0;
        const runeP = sub(p, 0.5 + i * 0.03, 0.15);

        return (
          <g key={`stone${i}`}>
            <g clipPath={`url(#stoneMask${i})`}>
              <g transform={lift > 0.01 ? `translate(0, ${r2(lift)})` : undefined}>
                <path d={art.body} fill={stoneMid} />
                <path d={art.shade} fill={stoneShade} opacity={0.66} />
                <g clipPath={`url(#stoneBody${i})`}>
                  {art.grain.map((g, j) => (
                    <path key={`g${j}`} d={g} fill="none"
                      stroke={`hsl(220, 5%, ${24 + p * 6}%)`} strokeWidth="0.5"
                      opacity={0.17} />
                  ))}
                  {art.fracture.map((d, j) => (
                    <path key={`fr${j}`} d={d} fill="none"
                      stroke={`hsl(224, 8%, ${8 + p * 3}%)`} strokeWidth="0.55"
                      opacity={0.32} />
                  ))}
                  {art.lichen.map((d, j) => (
                    <path key={`li${j}`} d={d}
                      fill={`hsl(${88 + j * 14}, ${14 + p * 6}%, ${21 + p * 5}%)`}
                      opacity={0.13 + p * 0.05} />
                  ))}
                </g>
                <path d={art.rim} fill="none" stroke={stoneRim} strokeWidth="0.9"
                  strokeLinecap="round" opacity={0.34 + settle * 0.5} />
              </g>
            </g>

            {/* Where it meets the ground: a dark seam, then the rubble
                 it pushed up on its way out. Without these the stone
                 hovers, which is exactly how v1 read. */}
            <path d={art.contact} fill={`hsl(226, 14%, ${Math.max(2.5, skyL - 3)}%)`}
              opacity={0.45 * sp} />
            {sp > 0.55 && art.rubble.map((d, j) => (
              <path key={`rb${j}`} d={d} fill={`hsl(222, 8%, ${13 + p * 4}%)`}
                opacity={sub(sp, 0.55, 0.35) * 0.8} />
            ))}

            {/* Rune — phrase 2 lights it, in step with the manifest */}
            {runeP > 0 && (
              <g opacity={runeP} filter="url(#runeGlow)"
                transform={`translate(${s.x}, ${r2(s.y + s.h * 0.39)})`}>
                <g filter="url(#runeCarved)">
                  <path d={RUNE_SHAPES[i]} fill="none"
                    stroke="#88a8c8" strokeWidth="1.4" strokeLinecap="round">
                    <animate attributeName="stroke-opacity"
                      values="0.78;1;0.86;1;0.78" dur={`${6 + i * 0.7}s`}
                      begin={`-${(i * 0.9).toFixed(1)}s`} repeatCount="indefinite" />
                  </path>
                </g>
              </g>
            )}
          </g>
        );
      })}

      {/* ── CAIRNS ── */}
      {CAIRNS.map((c, i) => (
        <g key={`cairn${i}`} opacity={0.3 + p * 0.3}>
          {c.stack.map((d, j) => (
            <path key={j} d={d} fill={`hsl(220, ${6 + j}%, ${14 + j + p * 3}%)`} />
          ))}
        </g>
      ))}

      {/* ── SPIRIT WISPS — drifting on their own clocks ── */}
      {WISPS.map((w, i) => {
        const wp = sub(p, w.delay, 0.15);
        if (wp <= 0) return null;
        return (
          <g key={`wisp${i}`}>
            <animateTransform attributeName="transform" type="translate"
              values={`0 0;${w.dx} ${w.dy};${-w.dx * 0.6} ${w.dy * 0.4};0 0`}
              dur={w.dur} begin={`-${i * 2.7}s`} repeatCount="indefinite"
              calcMode="spline" keyTimes="0;0.34;0.7;1"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
            <circle cx={w.x} cy={w.y} r={w.r * 3.4} fill="url(#wispHalo)" opacity={wp * 0.3} />
            <circle cx={w.x} cy={w.y} r={w.r} fill="#b0c8e0" opacity={wp * 0.26}>
              <animate attributeName="opacity"
                values={`${wp * 0.14};${wp * 0.3};${wp * 0.18};${wp * 0.14}`}
                dur={`${7 + i * 2}s`} repeatCount="indefinite" begin={`-${i * 1.4}s`} />
            </circle>
          </g>
        );
      })}

      {/* ── LOW MIST ── */}
      {MIST.map((m, i) => (
        <path key={`mist${i}`} d={m.d} fill="none" stroke="#8898a8"
          strokeWidth={m.w} strokeLinecap="round"
          opacity={m.o * (1.15 - p * 0.45)} />
      ))}

      {/* ── COMPLETION RING — the promise, kept ── */}
      {p > 0.9 && (
        <path d={wobbleRing(200, 155, 40 + 60 * sub(p, 0.9, 0.1), 12 + 20 * sub(p, 0.9, 0.1), 20, 0.02, 2.4)}
          fill="none" stroke="#a8ccec" strokeWidth="1.2"
          opacity={(1 - sub(p, 0.9, 0.1)) * 0.35} />
      )}

      {/* ── ATMOSPHERIC SPECKS ── */}
      {Array.from({ length: 14 }).map((_, i) => {
        const px = (i * 61 + 17) % 392 + 4;
        const baseY = (i * 71 + 29) % 150 + 34;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 5;
        const rise = p * 18 * ((i % 4) / 4);
        const size = 0.4 + (i % 3) * 0.2;
        const op = (0.06 + (i % 3) * 0.04) * (0.3 + p * 0.7);
        return (
          <circle key={`sp${i}`} cx={px + drift} cy={baseY - rise} r={size}
            fill={i % 3 === 0 ? "#a0b8d8" : "#88a8c8"} opacity={op} />
        );
      })}
    </svg>
  );
}

export default memo(StonesScene);
