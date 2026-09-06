import { memo } from "react";
import type { SceneProps } from "../../types";
import { sub } from "../util";
import { GlowFilter } from "../../svg/filters";
import { useParticles } from "../../hooks/useParticles";
import ParticleField from "../../components/ParticleField";

// ─── THE FORGOTTEN BRIDGE (Inkwood 2) ───────────────────────────────
//
// The crossing is GONE at p=0: two rims with snapped deck stubs jutting
// over the gorge, a dead lantern post leaning on the left, and a valley
// of cold air running away from us into the dark.
//
// Phrase 1 "stone, recall the crossing" — a real arch builds itself the
// way a real arch is built: voussoirs rise out of the mist from both
// springings inward, each locking with a brief green flash, and the
// KEYSTONE goes last. Then the haunches fill, the roadbed lands, the
// parapet copings drop into place.
//
// Phrase 2 "spirits, walk the old paths" — five hanging lanterns ignite
// left to right, moss returns to the coping, and glowing footprints walk
// the deck from the left rim to the right, one pair at a time.
//
// Two things fix the v1 grade-B failure (illegible stones, empty flat
// chasm), and both are about value rather than detail:
//
// 1. AERIAL PERSPECTIVE IS INVERTED FROM v1. The near cliffs are the
//    darkest thing in the frame — a silhouette frame with a moonlit rim.
//    The gorge behind them gets LIGHTER with distance: three pairs of
//    overlapping spurs running away from us, mist banked between them,
//    a river vanishing to a point. The chasm is now the luminous part.
// 2. The arch therefore reads as a hard three-value object against that
//    light: dark soffit under the ring, lit warm rim on the extrados,
//    and a bright road line arcing across under the parapet.

// ─── ARCH GEOMETRY ──────────────────────────────────────────────────
// A segmental arch: span 164, rise 36. Springing intrados (118,130) and
// (282,130); crown intrados (200,94). The extrados beds into the rock on
// both sides, so the ring emerges from the cliff faces rather than
// floating in front of them.

type P = [number, number];

const CX = 200;
const CY = 205.4;
const R_IN = 111.4;
const R_OUT = 118.4;
const HALF = 0.82725; // 47.4° — half the arc, in radians
const NV = 13; // voussoirs

/** Deterministic wear — the same stone gets the same chips every render. */
function rnd(i: number, salt: number): number {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function polar(r: number, a: number): P {
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
}

/** Midpoint of an edge, pushed off the straight line: a weathered face. */
function ctrl(a: P, b: P, k: number): P {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [(a[0] + b[0]) / 2 - (dy / len) * k, (a[1] + b[1]) / 2 + (dx / len) * k];
}

const n2 = (v: number) => v.toFixed(2);
const pt = (q: P) => `${n2(q[0])} ${n2(q[1])}`;

// Voussoirs are not identical: the mason cut them by eye, so the ring is
// divided into thirteen unequal wedges.
const WIDTHS = Array.from({ length: NV }, (_, i) => 0.82 + rnd(i, 21) * 0.4);
const WSUM = WIDTHS.reduce((a, b) => a + b, 0);
const ANGLES: number[] = [];
{
  let acc = -HALF;
  for (let i = 0; i < NV; i++) {
    ANGLES.push(acc);
    acc += (WIDTHS[i] / WSUM) * HALF * 2;
  }
  ANGLES.push(HALF);
}

interface Stone {
  d: string;
  rim: string;
  soffit: string;
  cx: number;
  cy: number;
  delay: number;
  dur: number;
  tone: number;
  lit: number; // 0–1: how much lantern light this stone's face catches
  key: boolean;
}

const VOUSSOIRS: Stone[] = Array.from({ length: NV }, (_, i) => {
  const a0 = ANGLES[i] + 0.005;
  const a1 = ANGLES[i + 1] - 0.005;
  const w = (n: number) => (rnd(i, n) - 0.5) * 1.8;
  const p1 = polar(R_IN + w(1), a0);
  const p2 = polar(R_IN + w(2), a1);
  const p3 = polar(R_OUT + w(3), a1);
  const p4 = polar(R_OUT + w(4), a0);
  const c12 = ctrl(p1, p2, (rnd(i, 5) - 0.5) * 1.3);
  const c23 = ctrl(p2, p3, (rnd(i, 6) - 0.5) * 1.3);
  const c34 = ctrl(p3, p4, (rnd(i, 7) - 0.5) * 1.3);
  const c41 = ctrl(p4, p1, (rnd(i, 8) - 0.5) * 1.3);
  const dc = Math.abs(i - 6);
  const isKey = dc === 0;
  const mid = polar((R_IN + R_OUT) / 2, (a0 + a1) / 2);
  return {
    d: `M${pt(p1)} Q${pt(c12)} ${pt(p2)} Q${pt(c23)} ${pt(p3)} Q${pt(c34)} ${pt(p4)} Q${pt(c41)} ${pt(p1)} Z`,
    rim: `M${pt(p3)} Q${pt(c34)} ${pt(p4)}`,
    soffit: `M${pt(p1)} Q${pt(c12)} ${pt(p2)}`,
    cx: mid[0],
    cy: mid[1],
    // Springings first, keystone last — the way an arch is actually closed.
    delay: isKey ? 0.32 : 0.02 + (6 - dc) * 0.04 + (i < 6 ? 0.006 : 0),
    dur: isKey ? 0.11 : 0.09,
    tone: (rnd(i, 9) - 0.5) * 6,
    lit: 1 - dc / 7.5,
    key: isKey,
  };
});

// ─── DECK ───────────────────────────────────────────────────────────
// A humpbacked roadbed. The near edge is a parabola (exactly the
// quadratic below); the far edge sits 4.6 above it, and the sliver
// between them is the road surface the spirits walk on.

const deckNearY = (x: number) => {
  const t = (x - 200) / 94;
  return 82 + t * t * 15.8;
};
const deckFarY = (x: number) => deckNearY(x) - 7.2;

const DECK_FASCIA = "M104 98.6 Q200 65.4 296 98.6 L296 104.4 Q200 71.2 104 104.4 Z";
const ROAD = "M104 91.4 Q200 58.2 296 91.4 L296 98.6 Q200 65.4 104 98.6 Z";
const ROAD_EDGE = "M104 91.4 Q200 58.2 296 91.4";
const DECK_KERB = "M104 98.6 Q200 65.4 296 98.6";

// Coursing on the fascia so the roadbed reads as masonry, not a plank.
const FASCIA_JOINTS = [
  "M118 100.9 L118 106.4",
  "M141 96.7 L141 102.2",
  "M166 93.1 L166 98.6",
  "M191 90.9 L191 96.4",
  "M215 91 L215 96.5",
  "M240 93.4 L240 98.9",
  "M264 97.1 L264 102.6",
  "M282 100.3 L282 105.8",
];

// Haunch masonry between the extrados and the underside of the deck.
const SPANDREL_L =
  "M112.85 101.4 Q156.4 87.8 200 87.8 C181 87.8, 159 92.6, 133.15 107.9 " +
  "C126 112.4, 118 119, 112.85 125.5 Z";
const SPANDREL_R =
  "M287.15 101.4 Q243.6 87.8 200 87.8 C219.4 88, 241.6 93, 266.85 107.9 " +
  "C274.4 112.8, 282.2 119.3, 287.15 125.5 Z";

const SPANDREL_JOINTS = [
  "M115.6 112.5 C127 106.8, 141 101.2, 157 97.3",
  "M119 120 C131 114.4, 146 108.4, 163 104.3",
  "M284.4 112.5 C273 106.8, 259 101.2, 243 97.3",
  "M281 120 C269 114.4, 254 108.4, 237 104.3",
];

interface Coping {
  d: string;
  x: number;
  delay: number;
  tone: number;
}

const PARAPET: Coping[] = Array.from({ length: 13 }, (_, k) => {
  const x0 = 118 + k * 12.62;
  const x1 = x0 + 12.2;
  const broken = k === 3 || k === 9;
  const h = broken ? 3 + rnd(k, 2) * 0.9 : 5.6 + rnd(k, 1) * 1.7;
  const y0 = deckFarY(x0);
  const y1 = deckFarY(x1);
  const wob = (rnd(k, 3) - 0.5) * 1.4;
  return {
    d:
      `M${n2(x0)} ${n2(y0)} L${n2(x1)} ${n2(y1)} ` +
      `L${n2(x1)} ${n2(y1 - h * 0.86)} ` +
      `Q${n2((x0 + x1) / 2)} ${n2((y0 + y1) / 2 - h - wob)} ${n2(x0)} ${n2(y0 - h)} Z`,
    x: (x0 + x1) / 2,
    delay: 0.43 + k * 0.005,
    tone: (rnd(k, 4) - 0.5) * 5,
  };
});

// ─── THE GORGE ──────────────────────────────────────────────────────
// Three pairs of overlapping spurs running away from the viewer, each
// pair lighter and hazier than the one in front of it, converging on a
// river that vanishes to a point. This is where the air lives.

interface Spur {
  fill: string;
  ridge: string;
}

// Each spur is a ridge running away from the viewer. Irregular tops, and
// a thin moonlit edge along each so they read as rock, not folded paper.
const SPURS_FAR: Spur[] = [
  {
    fill: "M40 250 L40 122 C50 117, 58 120, 66 117 C76 113, 84 118, 94 123 C104 128, 112 131, 122 136 C134 142, 144 145, 156 151 C170 158, 184 161, 202 165 L202 250 Z",
    ridge: "M40 122 C50 117, 58 120, 66 117 C76 113, 84 118, 94 123 C104 128, 112 131, 122 136 C134 142, 144 145, 156 151 C170 158, 184 161, 202 165",
  },
  {
    fill: "M360 250 L360 116 C350 112, 342 116, 332 113 C322 110, 314 116, 304 121 C294 126, 286 130, 276 135 C264 141, 252 146, 240 152 C226 159, 214 162, 198 165 L198 250 Z",
    ridge: "M360 116 C350 112, 342 116, 332 113 C322 110, 314 116, 304 121 C294 126, 286 130, 276 135 C264 141, 252 146, 240 152 C226 159, 214 162, 198 165",
  },
];

const SPURS_MID: Spur[] = [
  {
    fill: "M62 250 L62 140 C72 136, 80 139, 90 137 C100 135, 108 141, 118 147 C128 153, 136 157, 146 163 C158 170, 168 174, 180 179 C190 183, 196 185, 204 187 L204 250 Z",
    ridge: "M62 140 C72 136, 80 139, 90 137 C100 135, 108 141, 118 147 C128 153, 136 157, 146 163 C158 170, 168 174, 180 179 C190 183, 196 185, 204 187",
  },
  {
    fill: "M338 250 L338 134 C328 130, 320 134, 310 132 C300 130, 292 136, 282 142 C272 148, 264 153, 254 159 C242 166, 232 171, 220 176 C210 180, 202 183, 196 186 L196 250 Z",
    ridge: "M338 134 C328 130, 320 134, 310 132 C300 130, 292 136, 282 142 C272 148, 264 153, 254 159 C242 166, 232 171, 220 176 C210 180, 202 183, 196 186",
  },
];

const SPURS_NEAR: Spur[] = [
  {
    fill: "M84 250 L84 158 C94 154, 102 158, 112 157 C122 156, 130 163, 140 170 C150 177, 158 183, 168 190 C178 197, 188 203, 198 209 L198 250 Z",
    ridge: "M84 158 C94 154, 102 158, 112 157 C122 156, 130 163, 140 170 C150 177, 158 183, 168 190 C178 197, 188 203, 198 209",
  },
  {
    fill: "M316 250 L316 152 C306 148, 298 152, 288 151 C278 150, 270 157, 260 164 C250 171, 242 177, 232 184 C222 191, 212 198, 202 205 L202 250 Z",
    ridge: "M316 152 C306 148, 298 152, 288 151 C278 150, 270 157, 260 164 C250 171, 242 177, 232 184 C222 191, 212 198, 202 205",
  },
];

// The river: a thin sinuous thread meandering out of the head of the
// valley, not a beam. Narrow and low-contrast on purpose — this is water
// half a mile below in the dark.
const RIVER =
  "M204.6 165 C201 171, 195 176, 190 183 C185 190, 182 197, 184 206 " +
  "C186 216, 190 226, 188 237 C187 243, 185 247, 184 250 " +
  "L207 250 C208 244, 209 236, 208 227 C207 217, 202 209, 201 200 " +
  "C200 192, 203 185, 208 178 C211.6 173, 210 168.6, 208.8 164.6 " +
  "C207.6 163.4, 205.8 163.6, 204.6 165 Z";

const RIVER_GLINTS = [
  "M191 187 C193.6 185.6, 197 185.2, 200 185.8",
  "M185 202 C188.6 200.6, 194 200.4, 199 201.6",
  "M187 224 C191.6 222.4, 198 222.4, 204 224",
];

// A waterfall thread off the left near spur, tapering into the dark.
const FALL =
  "M138 166 C139.6 172, 139 178, 140.2 184 C141 188.6, 140.6 192, 141.4 195.6";

// Hand-drawn mist banks, drifting, one between each pair of spurs.
const WISPS = [
  { d: "M56 128 C90 121, 128 128, 166 133 C186 136, 216 136, 244 132 C280 127, 316 120, 348 126 C314 141, 272 148, 226 149 C176 150, 110 143, 56 128 Z", dur: "53s", dx: 12, o: 0.16 },
  { d: "M72 150 C104 144, 138 151, 172 156 C190 159, 214 159, 238 155 C270 150, 302 143, 330 149 C300 163, 262 170, 220 171 C174 172, 120 164, 72 150 Z", dur: "43s", dx: -10, o: 0.14 },
  { d: "M92 180 C120 174, 150 181, 178 187 C192 190, 210 190, 228 186 C254 180, 280 174, 306 180 C280 194, 248 202, 212 203 C172 204, 132 194, 92 180 Z", dur: "61s", dx: 9, o: 0.12 },
  { d: "M108 108 C136 103, 168 108, 198 111 C224 114, 250 111, 276 107 C258 118, 232 124, 200 124 C166 124, 132 118, 108 108 Z", dur: "71s", dx: -7, o: 0.11 },
];

// One wisp in FRONT of the springings, for depth.
const WISP_NEAR =
  "M104 136 C132 130, 158 135, 182 133 C168 144, 140 148, 104 136 Z";

// ─── CLIFFS ─────────────────────────────────────────────────────────
// The near frame: the darkest masses in the picture, with a moonlit rim.
// The lips overhang a little, so the arch appears to come out from under
// the rock rather than being pasted onto it.

const CLIFF_L =
  "M0 250 L0 88 C10 90, 18 96, 28 95 C38 94, 44 89, 54 90.5 " +
  "C64 92, 70 97, 80 97 C90 97, 98 94, 106 95.5 C112 96.6, 115 97.8, 117 99 " +
  "C116.6 104, 116.2 111, 115.8 117 C115.6 121, 115.5 124, 115.5 127 " +
  "C115.8 133, 116.2 139, 117 145 C119 155, 122 166, 126 178 " +
  "C132 198, 139 224, 146 250 Z";

const CLIFF_R =
  "M400 250 L400 92 C390 95, 382 101, 372 100 C362 99, 356 94, 346 95.5 " +
  "C336 97, 330 102, 320 102 C310 102, 302 99, 294 98.5 C288 97.6, 285 96.6, 283 97 " +
  "C283.4 103, 283.8 110, 284.2 117 C284.4 122, 284.5 125, 284.5 127 " +
  "C284.2 133, 283.8 139, 283 145 C281 155, 278 166, 274 178 " +
  "C268 198, 261 224, 254 250 Z";

const RIM_L =
  "M0 88 C10 90, 18 96, 28 95 C38 94, 44 89, 54 90.5 " +
  "C64 92, 70 97, 80 97 C90 97, 98 94, 106 95.5 C112 96.6, 115 97.8, 117 99";
const RIM_R =
  "M400 92 C390 95, 382 101, 372 100 C362 99, 356 94, 346 95.5 " +
  "C336 97, 330 102, 320 102 C310 102, 302 99, 294 98.5 C288 97.6, 285 96.6, 283 97";

// Rock shelves stepping down each face, each with a moonlit top edge.
// This is what turns the framing masses from flat wallpaper into cliff.
interface Shelf {
  fill: string;
  lip: string;
  tone: number;
}

const SHELVES_L: Shelf[] = [
  {
    fill: "M0 250 L0 117 C13 112, 25 120, 39 118 C51 116.4, 61 119, 73 120.4 C85 122, 95 119.6, 105 122 C110 123.2, 113 124.4, 114 126 L114 250 Z",
    lip: "M0 117 C13 112, 25 120, 39 118 C51 116.4, 61 119, 73 120.4 C85 122, 95 119.6, 105 122 C110 123.2, 113 124.4, 114 126",
    tone: 8,
  },
  {
    fill: "M0 250 L0 153 C12 148, 25 157, 39 154 C51 151.4, 61 155, 73 156.6 C85 158.2, 95 155.6, 105 159 C110 160.6, 114 162.6, 117 166 L117 250 Z",
    lip: "M0 153 C12 148, 25 157, 39 154 C51 151.4, 61 155, 73 156.6 C85 158.2, 95 155.6, 105 159 C110 160.6, 114 162.6, 117 166",
    tone: 5.8,
  },
  {
    fill: "M0 250 L0 194 C12 189, 27 198, 41 195 C55 192, 67 196, 81 198.4 C95 201, 107 199.4, 119 203 C124.6 204.8, 128 206.6, 131 209 L131 250 Z",
    lip: "M0 194 C12 189, 27 198, 41 195 C55 192, 67 196, 81 198.4 C95 201, 107 199.4, 119 203 C124.6 204.8, 128 206.6, 131 209",
    tone: 3.8,
  },
];

const SHELVES_R: Shelf[] = [
  {
    fill: "M400 250 L400 122 C387 117, 375 126, 361 123 C349 120.4, 339 124, 327 125.6 C315 127.2, 305 124.6, 295 127.4 C290 128.8, 287 130, 286 131.6 L286 250 Z",
    lip: "M400 122 C387 117, 375 126, 361 123 C349 120.4, 339 124, 327 125.6 C315 127.2, 305 124.6, 295 127.4 C290 128.8, 287 130, 286 131.6",
    tone: 8.6,
  },
  {
    fill: "M400 250 L400 159 C388 154, 375 163, 361 160 C349 157.4, 339 161, 327 162.6 C315 164.2, 305 162, 295 165.4 C289 167.4, 284 169, 280 172 L280 250 Z",
    lip: "M400 159 C388 154, 375 163, 361 160 C349 157.4, 339 161, 327 162.6 C315 164.2, 305 162, 295 165.4 C289 167.4, 284 169, 280 172",
    tone: 6.2,
  },
  {
    fill: "M400 250 L400 198 C388 193, 373 202, 359 199 C345 196, 333 200, 319 202.4 C305 205, 293 203.4, 281 207 C275.4 208.8, 272.6 210.4, 270 212 L270 250 Z",
    lip: "M400 198 C388 193, 373 202, 359 199 C345 196, 333 200, 319 202.4 C305 205, 293 203.4, 281 207 C275.4 208.8, 272.6 210.4, 270 212",
    tone: 4,
  },
];

// Splits in the rock, and scree caught on the shelves. Irregular and
// scattered, so the faces have something to look at up close.
const CRACKS = [
  "M20 112 C24 119, 21 124, 26 131 C29 136, 26 141, 30 148",
  "M86 126 C90 133, 87 139, 91 145",
  "M46 168 C50 176, 47 182, 52 190 C55 195, 53 199, 56 205",
  "M340 130 C336 137, 339 143, 334 150 C331 155, 334 160, 330 167",
  "M366 118 C362 125, 365 130, 361 137",
  "M310 178 C306 186, 309 192, 304 200",
];

const ROCKS = [
  "M-4.4 1.4 C-4 0.2, -3.8 -0.8, -3.2 -1.6 C-2.4 -2.6, -1.6 -3, -0.6 -3.2 " +
    "C1 -3.4, 2 -3, 2.4 -2.4 C3.4 -1.8, 4.2 -1, 4.4 -0.2 C4.6 0.6, 4.2 1.2, 3.6 1.4 " +
    "C2 1.9, -0.6 2.1, -4.4 1.4 Z",
  "M-3.8 1.6 C-4.6 0.6, -4.2 -0.6, -3.4 -1.4 C-2.2 -2.6, -0.8 -3.4, 0.6 -3.4 " +
    "C2 -3.4, 3.2 -2.6, 3.8 -1.6 C4.4 -0.6, 4.4 0.6, 3.4 1.2 C2.2 2, -2.8 2.4, -3.8 1.6 Z",
  "M-3.2 1.8 C-4.2 1, -4.2 -0.2, -3.4 -1.2 C-2.4 -2.4, -1 -3.2, 0.4 -3.2 " +
    "C2 -3.2, 3.4 -2.2, 3.8 -1 C4.2 0.2, 3.6 1.4, 2.4 1.8 C1 2.2, -2.2 2.4, -3.2 1.8 Z",
];

const SCREE = [
  { x: 84, y: 131, s: 1.9, r: -6, k: 0 },
  { x: 94, y: 134.5, s: 0.7, r: 13, k: 1 },
  { x: 40, y: 176, s: 1.5, r: 4, k: 1 },
  { x: 50, y: 179, s: 0.55, r: -9, k: 2 },
  { x: 100, y: 210, s: 1.15, r: 6, k: 2 },
  { x: 318, y: 137, s: 1.7, r: 7, k: 2 },
  { x: 308, y: 140.5, s: 0.6, r: -14, k: 0 },
  { x: 302, y: 173, s: 1.25, r: -5, k: 1 },
  { x: 366, y: 212, s: 1.05, r: 9, k: 0 },
];

// Headlands: the nearest rock in the picture, jutting into the frame on
// both sides. They break the rim's horizontal and stack a third depth in
// front of the cliffs.
const HEADLAND_L =
  "M0 250 L0 106 C4 99, 9 91, 16 86 C24 80.4, 34 80, 42 84 " +
  "C48 87, 52 92, 54 98 C55.6 103, 56 109, 56.4 116 L56.4 250 Z";
const HEADLAND_L_LIP =
  "M0 106 C4 99, 9 91, 16 86 C24 80.4, 34 80, 42 84 C48 87, 52 92, 54 98";
const HEADLAND_R =
  "M400 250 L400 110 C396 104, 391 97, 384 93 C376 88.4, 368 89, 362 93 " +
  "C357 96.4, 354 101, 352 107 C350.6 111, 350 116, 349.6 122 L349.6 250 Z";
const HEADLAND_R_LIP =
  "M400 110 C396 104, 391 97, 384 93 C376 88.4, 368 89, 362 93 C357 96.4, 354 101, 352 107";

// Two thin cloud bands, low in the sky, catching the moon.
const CLOUDS = [
  "M22 58 C60 53, 96 57, 132 55 C160 53.6, 186 56, 208 54 C176 62, 130 66, 88 65 C58 64.4, 34 62, 22 58 Z",
  "M232 40 C264 36, 292 39, 322 37 C344 35.6, 366 37, 384 35 C358 43, 322 47, 288 46 C262 45.4, 244 43, 232 40 Z",
];

// Boulders on the rims — the horizon is not a ruled line.
const BOULDER_L =
  "M34 95 C35 90.5, 39 87.6, 44 87.4 C49.5 87.2, 53.5 89.6, 54.4 93 " +
  "C55 95.4, 53.6 96.6, 50 96.4 C45 96.2, 38 96.6, 34 95 Z";
const BOULDER_R =
  "M356 96 C357.4 91.8, 361.6 89.2, 366.4 89.6 C371 90, 374 92.6, 374.4 96.2 " +
  "C374.6 98.4, 372.6 99.2, 369 99 C364 98.8, 359.4 98, 356 96 Z";
const BOULDER_L2 =
  "M90 98 C90.6 95.2, 93.4 93.4, 96.4 93.6 C99.6 93.8, 101.6 95.4, 101.8 97.6 " +
  "C102 99, 100.4 99.4, 98 99.4 C94.6 99.4, 91.6 99.2, 90 98 Z";

// ─── CLIFF-TOP LIFE ─────────────────────────────────────────────────

const CONIFER =
  "M0 0 C-1.2 -2, -2.6 -3.6, -1.8 -4.2 C-2.6 -6, -3.4 -7.6, -2.4 -8.2 " +
  "C-3 -10, -3.4 -11.6, -2.2 -12.4 C-2.6 -14.4, -2.4 -16.6, -1.2 -18 " +
  "C-0.6 -19.4, -0.2 -20.6, 0 -21.6 C0.3 -20.4, 0.8 -19.2, 1.4 -18 " +
  "C2.6 -16.2, 2.8 -14.2, 2.4 -12.2 C3.6 -11.4, 3.2 -9.8, 2.6 -8 " +
  "C3.6 -7.4, 2.8 -5.8, 2 -4 C2.8 -3.4, 1.4 -1.8, 0.2 0 Z";

const CONIFERS = [
  { x: 26, y: 81.5, s: 0.85 },
  { x: 42, y: 85, s: 0.58 },
  { x: 64, y: 94, s: 1.05 },
  { x: 336, y: 100, s: 0.98 },
  { x: 372, y: 90.5, s: 0.78 },
  { x: 390, y: 96, s: 0.52 },
];

const FERNS = [
  { x: 82, y: 97, h: 6.6, delay: 0.55, dur: "6.5s" },
  { x: 100, y: 95.4, h: 5.2, delay: 0.62, dur: "8s" },
  { x: 112, y: 96.8, h: 4.2, delay: 0.7, dur: "7.2s" },
  { x: 289, y: 98, h: 5.8, delay: 0.58, dur: "7.6s" },
  { x: 306, y: 99.4, h: 4.6, delay: 0.66, dur: "9s" },
];

// ─── BRIDGE FURNITURE ───────────────────────────────────────────────

const LANTERNS = [136, 168, 200, 232, 264].map((x, i) => ({
  x,
  base: deckFarY(x),
  delay: 0.52 + i * 0.05,
  sway: i % 2 ? "6.4s" : "8.1s",
}));

const FOOTS = [116, 136, 156, 175, 193, 212, 231, 250, 269, 287].map((x, i) => ({
  x,
  y: deckNearY(x) - 1.2 + (i % 2 ? 1 : -0.4),
  delay: 0.6 + i * 0.034,
  flip: i % 2 === 1,
}));

// A bare foot: heel, arch, ball, and four toes. Sized so it still reads
// as a footprint and not a smudge of lichen at 400 units wide.
const FOOT =
  "M0.2 1 C-0.5 -0.3, 0.4 -1.7, 1.9 -1.9 C3.1 -2.05, 4 -1.5, 4.4 -0.6 " +
  "C4.8 0.3, 4.3 1.4, 3.2 1.9 C2 2.4, 0.8 2, 0.2 1 Z " +
  "M5 -1.9 C5.7 -2.5, 6.8 -2.3, 7 -1.3 C7.2 -0.3, 6.4 0.3, 5.6 0 " +
  "C4.9 -0.3, 4.6 -1.4, 5 -1.9 Z " +
  "M7.5 -2.6 C8 -3.1, 8.8 -2.9, 8.9 -2.2 C9 -1.5, 8.4 -1.1, 7.9 -1.4 " +
  "C7.5 -1.6, 7.2 -2.3, 7.5 -2.6 Z";

const MOSS = [
  { x: 132, d: 0.72 },
  { x: 158, d: 0.78 },
  { x: 186, d: 0.83 },
  { x: 214, d: 0.87 },
  { x: 243, d: 0.9 },
  { x: 268, d: 0.93 },
];

// Snapped deck stubs — the only evidence a crossing was ever here.
const STUB_L =
  "M102 99.4 C109 97.7, 117 96, 127 94.2 L129.2 96.9 L127.3 99.2 L129.7 101.5 " +
  "L126.9 103.5 L128.3 105.7 C122 106.5, 115 106.3, 109 106.5 " +
  "C106 106.5, 104 106.7, 102 106.1 Z";
const STUB_R =
  "M298 97.6 C291 96, 283 94.3, 273 92.6 L270.8 95.3 L272.7 97.6 L270.3 99.9 " +
  "L273.1 101.9 L271.7 104.1 C278 104.9, 285 104.7, 291 104.9 " +
  "C294 104.9, 296 105.1, 298 104.5 Z";
const STUB_JOINTS = [
  "M110 96.9 L110 106.4",
  "M119 95.3 L119 106.4",
  "M290 95.2 L290 104.8",
  "M281 93.6 L281 104.8",
];

// The dead lantern post on the left rim — leaning, hook empty.
const DEAD_POST =
  "M79 96.6 C78 90.2, 80.6 84.2, 80.2 78.8 C82 77, 84.6 76.8, 86 77.8 " +
  "C86.6 78.4, 86.4 79.6, 85.4 79.8 C84 80, 82.6 79.4, 82 78.6";

const STARS = [
  { x: 42, y: 32, r: 0.75, o: 0.5, tw: "5.5s" },
  { x: 88, y: 20, r: 0.55, o: 0.36 },
  { x: 133, y: 39, r: 0.6, o: 0.3 },
  { x: 176, y: 23, r: 0.85, o: 0.46, tw: "7.2s" },
  { x: 219, y: 36, r: 0.5, o: 0.28 },
  { x: 258, y: 18, r: 0.7, o: 0.42 },
  { x: 296, y: 42, r: 0.55, o: 0.3, tw: "6.1s" },
  { x: 356, y: 26, r: 0.65, o: 0.38 },
  { x: 384, y: 52, r: 0.5, o: 0.26 },
  { x: 22, y: 60, r: 0.5, o: 0.24 },
  { x: 246, y: 56, r: 0.45, o: 0.22 },
  { x: 62, y: 46, r: 0.5, o: 0.26 },
];

// ─── COLOUR ─────────────────────────────────────────────────────────

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// Stone, not timber: the warm end is a warm GREY, and the lanterns in
// the Glow layer supply the actual colour temperature.
const STONE_COLD: RGB = [54, 60, 69];
const STONE_WARM: RGB = [82, 78, 71];
const RIMLIGHT_COLD: RGB = [110, 122, 136];
const RIMLIGHT_WARM: RGB = [166, 152, 124];
const ROAD_COLD: RGB = [78, 86, 96];
const ROAD_WARM: RGB = [112, 106, 95];
const FASCIA_COLD: RGB = [40, 45, 52];
const FASCIA_WARM: RGB = [66, 63, 57];

const MIST_CONFIG = {
  count: 15,
  bounds: { x: 118, y: 112, width: 164, height: 62 },
  colors: ["#9db2c2", "#adc0cd", "#8ea3b4"],
  sizeRange: [0.4, 1.4] as [number, number],
  speedRange: [1, 4] as [number, number],
  driftX: 2,
  driftY: -5,
  lifeRange: [5, 11] as [number, number],
};

/** Mist particles in their own memo'd component: `useParticles` notifies
 *  ~12×/s, and called from the scene body it would reconcile every cliff,
 *  voussoir and lantern at that rate. Down here only the mist re-renders. */
const Mist = memo(function Mist({ alpha }: { alpha: number }) {
  const mist = useParticles(MIST_CONFIG, true);
  return <ParticleField particles={mist} opacity={alpha} />;
});

function BridgeScene({ progress: p }: SceneProps) {

  const warmth = sub(p, 0.5, 0.34); // phrase 2 — the lanterns bring colour back

  const rimlight = mix(RIMLIGHT_COLD, RIMLIGHT_WARM, warmth);
  const road = mix(ROAD_COLD, ROAD_WARM, warmth);
  const joint = `hsl(212, 13%, ${7 + p * 3}%)`;

  return (
    <svg
      viewBox="0 0 400 250"
      overflow="hidden"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <GlowFilter id="brSpark" radius={4} color="#8fc47a" opacity={0.55} />

        <linearGradient id="brSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(226, 32%, ${5 + p * 2.5}%)`} />
          <stop offset="42%" stopColor={`hsl(214, 26%, ${9.5 + p * 3.5}%)`} />
          <stop offset="100%" stopColor={`hsl(201, 23%, ${16 + p * 4}%)`} />
        </linearGradient>

        {/* Every mass in the frame gets a top-lit / bottom-shaded read. */}
        <linearGradient id="brShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="brCliff" x1="0.2" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor={`hsl(206, 12%, ${10 + p * 2}%)`} />
          <stop offset="45%" stopColor={`hsl(212, 14%, ${5.5 + p * 1.2}%)`} />
          <stop offset="100%" stopColor="hsl(217, 16%, 2.5%)" />
        </linearGradient>

        <linearGradient id="brRiver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(196, ${12 + p * 8}%, ${19 + p * 7}%)`} />
          <stop offset="100%" stopColor={`hsl(202, ${10 + p * 5}%, ${8 + p * 3}%)`} />
        </linearGradient>

        <radialGradient id="brMoon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#cfe0f0" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#9fb6cc" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#8098b0" stopOpacity="0" />
        </radialGradient>
        <mask id="brMoonMask">
          <circle cx="332" cy="31" r="6.6" fill="#fff" />
          <circle cx="334.9" cy="28.8" r="6.1" fill="#000" />
        </mask>

        <radialGradient id="brLantern" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffd58a" stopOpacity="0.4" />
          <stop offset="40%" stopColor="#e8a850" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#d09040" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="brLock" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#c6efab" stopOpacity="0.92" />
          <stop offset="45%" stopColor="#7aaa6a" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#5c8a52" stopOpacity="0" />
        </radialGradient>

      </defs>

      {/* ── SKY ── */}
      <rect x="0" y="0" width="400" height="250" fill="url(#brSky)" />

      {STARS.map((s, i) => (
        <circle key={`st${i}`} cx={s.x} cy={s.y} r={s.r} fill="#dce8f4" opacity={s.o * (0.6 + p * 0.4)}>
          {s.tw && (
            <animate attributeName="opacity" values={`${s.o * 0.4};${s.o};${s.o * 0.4}`} dur={s.tw} repeatCount="indefinite" />
          )}
        </circle>
      ))}

      {CLOUDS.map((d, i) => (
        <path key={`cl${i}`} d={d} fill={`hsl(210, 20%, ${20 + p * 5}%)`} opacity={0.09 - i * 0.02}>
          <animateTransform attributeName="transform" type="translate" values={`0 0; ${i ? -9 : 11} 0; 0 0`} dur={i ? "97s" : "83s"} repeatCount="indefinite" />
        </path>
      ))}

      {/* ── MOON — the cool key light for everything above the mist ── */}
      <circle cx="332" cy="31" r="26" fill="url(#brMoon)" />
      <circle cx="332" cy="31" r="6.6" fill="#e4eef8" opacity={0.6 + p * 0.16} mask="url(#brMoonMask)" />

      {/* ── THE GORGE — spurs receding, each pair lighter than the last ── */}
      {SPURS_FAR.map((sp, i) => (
        <g key={`gf${i}`}>
          <path d={sp.fill} fill={`hsl(${203 + i * 2}, 17%, ${(i ? 14 : 15) + p * 4}%)`} />
          <path d={sp.ridge} fill="none" stroke={`hsl(200, 20%, ${23 + p * 5}%)`} strokeWidth="0.8" opacity="0.55" />
        </g>
      ))}
      <path d={WISPS[3].d} fill={`hsl(200, 21%, ${32 + p * 5}%)`} opacity={WISPS[3].o}>
        <animateTransform attributeName="transform" type="translate" values={`0 0; ${WISPS[3].dx} 1.4; 0 0`} dur={WISPS[3].dur} repeatCount="indefinite" />
      </path>
      <path d={WISPS[0].d} fill={`hsl(200, 21%, ${33 + p * 5}%)`} opacity={WISPS[0].o}>
        <animateTransform attributeName="transform" type="translate" values={`0 0; ${WISPS[0].dx} -1.6; 0 0`} dur={WISPS[0].dur} repeatCount="indefinite" />
      </path>

      {SPURS_MID.map((sp, i) => (
        <g key={`gm${i}`}>
          <path d={sp.fill} fill={`hsl(${207 + i * 2}, 15%, ${(i ? 11.5 : 10.5) + p * 3}%)`} />
          <path d={sp.ridge} fill="none" stroke={`hsl(200, 18%, ${19 + p * 4}%)`} strokeWidth="0.7" opacity="0.5" />
        </g>
      ))}
      <path d={WISPS[1].d} fill={`hsl(200, 20%, ${31 + p * 5}%)`} opacity={WISPS[1].o}>
        <animateTransform attributeName="transform" type="translate" values={`0 0; ${WISPS[1].dx} 1.6; 0 0`} dur={WISPS[1].dur} repeatCount="indefinite" />
      </path>

      {/* The river, meandering out of the head of the valley. Drawn
          between the mid and near spurs so the near rock crosses it. */}
      <path d={RIVER} fill="url(#brRiver)" opacity={0.52 + p * 0.24} />
      {RIVER_GLINTS.map((d, i) => (
        <path key={`gl${i}`} d={d} fill="none" stroke="#cfe6f0" strokeWidth={0.45 + i * 0.12} strokeLinecap="round" opacity={(0.1 + p * 0.16) * (1 - i * 0.15)}>
          <animate
            attributeName="opacity"
            values={`${0.04 + p * 0.06};${0.13 + p * 0.2};${0.04 + p * 0.06}`}
            dur={`${7 + i * 2.5}s`}
            repeatCount="indefinite"
          />
        </path>
      ))}

      {SPURS_NEAR.map((sp, i) => (
        <g key={`gn${i}`}>
          <path d={sp.fill} fill={`hsl(${211 + i * 2}, 14%, ${(i ? 7.8 : 7) + p * 2}%)`} />
          <path d={sp.ridge} fill="none" stroke={`hsl(200, 15%, ${14 + p * 3}%)`} strokeWidth="0.6" opacity="0.45" />
        </g>
      ))}
      <path d={FALL} fill="none" stroke="#b6cbd8" strokeWidth="0.9" strokeLinecap="round" opacity={0.09 + p * 0.13} />

      <path d={WISPS[2].d} fill={`hsl(200, 19%, ${29 + p * 5}%)`} opacity={WISPS[2].o}>
        <animateTransform attributeName="transform" type="translate" values={`0 0; ${WISPS[2].dx} -1.4; 0 0`} dur={WISPS[2].dur} repeatCount="indefinite" />
      </path>

      {/* ── NEAR CLIFFS — the dark frame, moonlit only along the rim ── */}
      <path d={CLIFF_L} fill="url(#brCliff)" />
      <path d={CLIFF_R} fill="url(#brCliff)" />

      {[...SHELVES_L, ...SHELVES_R].map((sh, i) => (
        <g key={`sh${i}`}>
          <path d={sh.fill} fill={`hsl(${i < 3 ? 208 : 210}, 12%, ${sh.tone + p * 2}%)`} />
          <path
            d={sh.lip}
            fill="none"
            stroke={`hsl(203, 14%, ${16 + p * 5}%)`}
            strokeWidth={0.75}
            strokeDasharray={i % 2 ? "22 11 38 7 15 26" : "31 8 17 13 44 9"}
            opacity={0.5}
          />
        </g>
      ))}
      {CRACKS.map((d, i) => (
        <path key={`ck${i}`} d={d} fill="none" stroke="hsl(216, 18%, 2.5%)" strokeWidth={i % 2 ? 0.55 : 0.8} opacity="0.5" strokeLinecap="round" />
      ))}
      {SCREE.map((r, i) => (
        <g key={`sc${i}`} transform={`translate(${r.x}, ${r.y}) rotate(${r.r}) scale(${r.s})`}>
          <path d={ROCKS[r.k]} fill={`hsl(207, 11%, ${7.5 + p * 1.8}%)`} />
          <path d={ROCKS[r.k]} fill="url(#brShade)" opacity="0.7" />
        </g>
      ))}
      <path d={RIM_L} fill="none" stroke={`hsl(202, 15%, ${25 + p * 6}%)`} strokeWidth="0.9" opacity="0.8" />
      <path d={RIM_R} fill="none" stroke={`hsl(202, 15%, ${26 + p * 6}%)`} strokeWidth="0.9" opacity="0.8" />

      {[
        { fill: HEADLAND_L, lip: HEADLAND_L_LIP },
        { fill: HEADLAND_R, lip: HEADLAND_R_LIP },
      ].map((h, i) => (
        <g key={`hl${i}`}>
          <path d={h.fill} fill={`hsl(214, 14%, ${3.6 + p * 1.2}%)`} />
          <path d={h.lip} fill="none" stroke={`hsl(202, 15%, ${21 + p * 5}%)`} strokeWidth="0.9" opacity="0.75" />
        </g>
      ))}

      {[BOULDER_L, BOULDER_L2, BOULDER_R].map((d, i) => (
        <g key={`bd${i}`}>
          <path d={d} fill={`hsl(206, 11%, ${10 + p * 2.5}%)`} />
          <path d={d} fill="url(#brShade)" />
        </g>
      ))}

      {/* ── CLIFF-TOP TREELINE ── */}
      {CONIFERS.map((c, i) => (
        <path
          key={`cf${i}`}
          d={CONIFER}
          transform={`translate(${c.x}, ${c.y}) scale(${c.s})`}
          fill={`hsl(${i < 3 ? 168 : 176}, 13%, ${6 + p * 2}%)`}
        />
      ))}

      {/* ── FERNS — life returns to the rims in phrase 2 ── */}
      {FERNS.map((v, i) => {
        const vp = sub(p, v.delay, 0.16);
        if (vp <= 0) return null;
        return (
          <g key={`fn${i}`} opacity={vp * 0.78}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values={`-2 ${v.x} ${v.y}; 2 ${v.x} ${v.y}; -2 ${v.x} ${v.y}`}
              dur={v.dur}
              repeatCount="indefinite"
            />
            {[-2.4, -0.4, 1.8].map((dx, j) => (
              <path
                key={j}
                d={`M${v.x + dx} ${v.y} C${v.x + dx * 1.9} ${v.y - v.h * vp * 0.45}, ${v.x + dx * 2.4} ${v.y - v.h * vp * 0.78}, ${v.x + dx * 2.1} ${v.y - (v.h + j) * vp}`}
                fill="none"
                stroke={`hsl(${126 + j * 8}, ${20 + warmth * 14}%, ${16 + warmth * 8}%)`}
                strokeWidth="0.85"
                strokeLinecap="round"
              />
            ))}
          </g>
        );
      })}

      {/* ── SNAPPED DECK STUBS — something WAS here ── */}
      {[STUB_L, STUB_R].map((d, i) => (
        <g key={`sb${i}`}>
          <path d={d} fill={`hsl(208, 10%, ${9.5 + p * 2.5}%)`} />
          <path d={d} fill="url(#brShade)" />
          <path d={d} fill="none" stroke={joint} strokeWidth="0.5" opacity="0.9" />
        </g>
      ))}
      {STUB_JOINTS.map((d, i) => (
        <path key={`sj2${i}`} d={d} stroke={joint} strokeWidth="0.45" opacity="0.7" />
      ))}

      {/* ── THE DEAD LANTERN POST — nobody has lit it in a long time ── */}
      <path d={DEAD_POST} fill="none" stroke={`hsl(28, 8%, ${15 + p * 4}%)`} strokeWidth="1" strokeLinecap="round" opacity="0.9" />

      {/* ── HAUNCH MASONRY ── */}
      {[
        { d: SPANDREL_L, delay: 0.24 },
        { d: SPANDREL_R, delay: 0.265 },
      ].map((s, i) => {
        const sp = sub(p, s.delay, 0.1);
        if (sp <= 0) return null;
        const lift = (1 - sp) * (1 - sp) * 40;
        return (
          <g key={`sp${i}`} transform={`translate(0, ${lift.toFixed(2)})`} opacity={Math.min(1, sp * 1.5)}>
            <path d={s.d} fill={mix(STONE_COLD, STONE_WARM, warmth * 0.62)} />
            <path d={s.d} fill="url(#brShade)" />
            <path d={s.d} fill="none" stroke={joint} strokeWidth="0.5" opacity="0.7" />
          </g>
        );
      })}
      {sub(p, 0.3, 0.12) > 0 &&
        SPANDREL_JOINTS.map((d, i) => (
          <path key={`sj${i}`} d={d} fill="none" stroke={joint} strokeWidth="0.5" opacity={sub(p, 0.3, 0.12) * 0.8} />
        ))}

      {/* ── THE ARCH — voussoirs rise from the mist, keystone last ── */}
      {VOUSSOIRS.map((s, i) => {
        const sp = sub(p, s.delay, s.dur);
        if (sp <= 0) return null;
        const ease = 1 - (1 - sp) * (1 - sp) * (1 - sp);
        const lift = (1 - ease) * (s.key ? 34 : 52);
        const lock = sp > 0.68 ? 1 - (sp - 0.68) / 0.32 : 0;
        const a = Math.min(1, sp * 1.6);
        return (
          <g key={`v${i}`} transform={`translate(0, ${lift.toFixed(2)})`}>
            {lock > 0.02 && (
              <circle
                cx={s.cx}
                cy={s.cy}
                r={s.key ? 20 : 10}
                fill="url(#brLock)"
                opacity={lock * (s.key ? 0.8 : 0.42)}
                filter={s.key ? "url(#brSpark)" : undefined}
              />
            )}
            <path
              d={s.d}
              fill={mix(
                [STONE_COLD[0] + s.tone, STONE_COLD[1] + s.tone, STONE_COLD[2] + s.tone],
                [STONE_WARM[0] + s.tone, STONE_WARM[1] + s.tone, STONE_WARM[2] + s.tone],
                warmth * (0.3 + 0.7 * s.lit),
              )}
              opacity={a}
            />
            <path d={s.d} fill="url(#brShade)" opacity={a} />
            {/* Warm lit rim on the extrados, dark soffit below: the ring
                reads as one solid object rather than a row of tiles. */}
            <path d={s.rim} fill="none" stroke={rimlight} strokeWidth="0.8" opacity={a * 0.3 * (0.4 + s.lit * 0.6) * (1 + warmth)} />
            <path d={s.soffit} fill="none" stroke={`hsl(213, 15%, ${4 + p * 2}%)`} strokeWidth="1" opacity={a * 0.9} />
          </g>
        );
      })}

      {/* ── ROADBED ── */}
      {sub(p, 0.4, 0.07) > 0 &&
        (() => {
          const dp = sub(p, 0.4, 0.07);
          const lift = (1 - dp) * (1 - dp) * 26;
          const a = Math.min(1, dp * 1.6);
          return (
            <g transform={`translate(0, ${lift.toFixed(2)})`} opacity={a}>
              <path d={DECK_FASCIA} fill={mix(FASCIA_COLD, FASCIA_WARM, warmth * 0.75)} />
              <path d={DECK_FASCIA} fill="url(#brShade)" />
              {FASCIA_JOINTS.map((d, i) => (
                <path key={`fj${i}`} d={d} stroke={joint} strokeWidth="0.5" opacity="0.65" />
              ))}
              <path d={ROAD} fill={road} />
              <path d={ROAD_EDGE} fill="none" stroke={rimlight} strokeWidth="0.7" opacity="0.65" />
              <path d={DECK_KERB} fill="none" stroke={joint} strokeWidth="0.5" opacity="0.75" />
            </g>
          );
        })()}

      {/* ── PARAPET COPING ── */}
      {PARAPET.map((c, i) => {
        const cp = sub(p, c.delay, 0.06);
        if (cp <= 0) return null;
        const lift = (1 - cp) * (1 - cp) * 18;
        const a = Math.min(1, cp * 1.7);
        return (
          <g key={`pc${i}`} transform={`translate(0, ${lift.toFixed(2)})`} opacity={a}>
            <path
              d={c.d}
              fill={mix(
                [STONE_COLD[0] + c.tone, STONE_COLD[1] + c.tone, STONE_COLD[2] + c.tone],
                [STONE_WARM[0] + c.tone, STONE_WARM[1] + c.tone, STONE_WARM[2] + c.tone],
                warmth,
              )}
            />
            <path d={c.d} fill="url(#brShade)" />
            <path d={c.d} fill="none" stroke={joint} strokeWidth="0.45" opacity="0.85" />
          </g>
        );
      })}

      {/* ── MOSS on the coping — "footprints in the moss" ── */}
      {MOSS.map((m, i) => {
        const mp = sub(p, m.d, 0.09);
        if (mp <= 0) return null;
        const y = deckFarY(m.x) + 0.4;
        return (
          <path
            key={`ms${i}`}
            d={`M${m.x - 3.2} ${y - 0.5} C${m.x - 2.1} ${y - 2.7}, ${m.x - 0.5} ${y - 1.9}, ${m.x + 0.3} ${y - 3.1} C${m.x + 1.6} ${y - 1.7}, ${m.x + 3} ${y - 2.5}, ${m.x + 3.5} ${y - 0.3} C${m.x + 0.9} ${y + 0.4}, ${m.x - 1.8} ${y + 0.4}, ${m.x - 3.2} ${y - 0.5} Z`}
            fill={`hsl(${106 + i * 4}, ${18 + warmth * 8}%, ${12 + warmth * 5}%)`}
            opacity={mp * 0.85}
          />
        );
      })}

      {/* ── SPIRIT LANTERNS ── */}
      {LANTERNS.map((l, i) => {
        const lp = sub(p, l.delay, 0.07);
        if (lp <= 0) return null;
        const hx = l.x - 5.2;
        const hy = l.base - 13.4;
        return (
          <g key={`ln${i}`} opacity={Math.min(1, lp * 1.4)}>
            <path
              d={`M${l.x} ${l.base} C${l.x - 0.7} ${l.base - 5}, ${l.x + 0.5} ${l.base - 9}, ${l.x} ${l.base - 12.6} C${l.x - 1.6} ${l.base - 14.3}, ${l.x - 4} ${l.base - 14.5} ${hx} ${hy}`}
              fill="none"
              stroke={`hsl(30, 9%, ${17 + warmth * 8}%)`}
              strokeWidth="1.05"
              strokeLinecap="round"
            />
            <g transform={`translate(${hx}, ${hy})`}>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-1.4 0 0; 1.4 0 0; -1.4 0 0"
                dur={l.sway}
                repeatCount="indefinite"
                additive="sum"
              />
              <circle cx="0" cy="4" r="12" fill="url(#brLantern)" opacity={lp} />
              <path d="M-2.4 1.4 C-1.6 0.2, 1.6 0.2, 2.4 1.4 C1.4 1.9, -1.4 1.9, -2.4 1.4 Z" fill={`hsl(32, 13%, ${25 + warmth * 8}%)`} />
              <path d="M-2 1.8 C-2.4 3.4, -2.2 5.2, -1.4 6.2 C-0.4 6.9, 0.4 6.9, 1.4 6.2 C2.2 5.2, 2.4 3.4, 2 1.8 Z" fill="#33261a" />
              <path d="M-1.4 2.3 C-1.7 3.5, -1.6 5, -1 5.7 C-0.3 6.2, 0.3 6.2, 1 5.7 C1.6 5, 1.7 3.5, 1.4 2.3 Z" fill="#e8b060" opacity="0.85" />
              <circle cx="0" cy="4.1" r="1.35" fill="#ffe4a4">
                <animate attributeName="opacity" values="0.72;1;0.8;1;0.72" dur="2.9s" repeatCount="indefinite" />
              </circle>
              <path d="M-1.5 6.2 C-0.5 7, 0.5 7, 1.5 6.2 C1.2 7.3, -1.2 7.3, -1.5 6.2 Z" fill={`hsl(30, 11%, ${20 + warmth * 6}%)`} />
            </g>
          </g>
        );
      })}

      {/* ── SPIRIT FOOTPRINTS — left to right, one pair at a time ── */}
      {FOOTS.map((ft, i) => {
        const bloom = sub(p, ft.delay, 0.028);
        if (bloom <= 0) return null;
        const age = sub(p, ft.delay + 0.028, 0.09);
        const alpha = 1 - age * 0.55; // blooms bright, settles to a residue
        return (
          <g key={`ft${i}`} opacity={bloom * alpha}>
            <path
              d={FOOT}
              transform={`translate(${ft.x}, ${ft.y}) rotate(${ft.flip ? -10 : 8}) scale(0.78)`}
              fill="#7fc768"
              opacity={0.7 + (1 - age) * 0.3}
            />
            <path
              d={FOOT}
              transform={`translate(${ft.x}, ${ft.y}) rotate(${ft.flip ? -10 : 8}) scale(0.5)`}
              fill="#d8f7c6"
              opacity={0.35 + (1 - age) * 0.5}
            />
          </g>
        );
      })}

      {/* ── NEAR MIST + PARTICLES — air in front of the springing ── */}
      <path d={WISP_NEAR} fill={`hsl(200, 18%, ${28 + p * 4}%)`} opacity={0.075}>
        <animateTransform attributeName="transform" type="translate" values="0 0; 16 -2; 0 0" dur="37s" repeatCount="indefinite" />
      </path>
      <Mist alpha={0.18 - warmth * 0.05} />
    </svg>
  );
}

export default memo(BridgeScene);
