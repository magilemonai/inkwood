import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useGameStore } from "../../store";
import { LEVELS } from "../../levels";
import { startAmbient } from "../../audio";
import { shareInkwood } from "../../share";
import { isV2Enabled } from "../../v2";
import GlowSurface from "../GlowSurface";
import type { SceneManifest } from "../../scenes/manifest";
import PlantWord from "./PlantWord";
import s from "../../styles/Outro2.module.css";

/**
 * The Outro — a ~25-second panorama that assembles in first light.
 *
 * The finale ends at dawn ("the forest remembers"), so this does not
 * start in the dark: it starts in the last of the night with a seed of
 * warmth already on the horizon, and the light climbs all the way
 * through. Every place the player woke comes back as a miniature of its
 * own v2 scene, blooming left to right in level order, and then the
 * Great Tree rises in the middle and sends an ink thread out to each of
 * them. The dot row at the top lights in step.
 *
 * Phase 1 (0–3s):   a line of first light draws itself along the horizon.
 * Phase 2 (3–11.8s): the eight places bloom, one every 1.1s, left to right.
 * Phase 3 (12–17s):  the Great Tree grows; its heart takes; roots reach out.
 * Phase 4 (18–22s):  the threads carry light, the dawn crests, text arrives.
 * Then it holds and breathes — every idle motion is SMIL, so the React
 * clock stops once the frame is assembled and nothing re-renders again.
 *
 * Coordinates: viewBox 0 0 400 250, `slice`, so the Glow layer (which
 * maps 400×250 with the same slice math) lines up with the art. Portrait
 * letterboxes the stage at exactly 8/5, so nothing crops there.
 *
 * The quiet zone: x 140–260 below y 160 stays dark and detail-free —
 * that is where the two lines and both buttons sit on desktop.
 */

// ─── TIMING ───────────────────────────────────────────────
const VIGNETTE_START = 3;
const VIGNETTE_DUR = 1.1; // seconds each place takes to bloom
const TREE_START = 12;
const TEXT_AT = 19;
/** The clock stops here: everything has saturated and SMIL carries the
 *  idle life from now on. */
const CLOCK_END = 28;
/** The Glow's own 0–1 clock. */
const GLOW_SPAN = 25;

// ─── SMALL MATH ───────────────────────────────────────────
function sub(t: number, start: number, dur: number): number {
  return Math.min(1, Math.max(0, (t - start) / dur));
}
function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
/** Quantize so the memo'd pieces stop re-rendering the moment they settle. */
function q(v: number): number {
  return Math.round(v * 50) / 50;
}
const r1 = (n: number) => Math.round(n * 10) / 10;
const hsl = (h: number, sat: number, l: number) =>
  `hsl(${r1(h)}, ${r1(sat)}%, ${r1(l)}%)`;

/** Catmull-Rom through hand-placed points → one continuous bezier path.
 *  `close` drops the ends to that y and shuts the shape. */
function ridge(pts: [number, number][], dy = 0, close?: number): string {
  const p = pts.map(([x, y]) => [x, y + dy] as [number, number]);
  let d = `M${r1(p[0][0])} ${r1(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    d += ` C${r1(b[0] + (c[0] - a[0]) / 6)} ${r1(b[1] + (c[1] - a[1]) / 6)},`;
    d += ` ${r1(c[0] - (e[0] - b[0]) / 6)} ${r1(c[1] - (e[1] - b[1]) / 6)},`;
    d += ` ${r1(c[0])} ${r1(c[1])}`;
  }
  if (close !== undefined) {
    d += ` L${r1(p[p.length - 1][0])} ${close} L${r1(p[0][0])} ${close} Z`;
  }
  return d;
}

// ─── THE PLACES ───────────────────────────────────────────
// Monotonic in x so the assembly reads left to right with the dot row,
// but alternating in depth so the panorama has three planes instead of
// a row of icons. `y` is the ground the place stands on.
interface Place {
  name: string;
  color: string;
  x: number;
  y: number;
}
const VIGNETTES: Place[] = [
  { name: "Garden", color: "#6bbf6b", x: 44, y: 164 }, // near meadow
  { name: "Cottage", color: "#e89a30", x: 98, y: 147 }, // mid hills
  { name: "Stars", color: "#9090f8", x: 118, y: 136 }, // sky; anchored on the far ridge
  { name: "Well", color: "#50b8b8", x: 156, y: 151 }, // mid hills
  { name: "Bridge", color: "#7aaa6a", x: 252, y: 161 }, // near, over its own notch
  { name: "Library", color: "#c088b0", x: 306, y: 143 }, // a cavern mouth in the far bluff
  { name: "Stones", color: "#88a8c8", x: 336, y: 152 }, // mid hills
  { name: "Sanctum", color: "#d0b870", x: 376, y: 166 }, // near grove, closing the frame
];

const bloomOf = (t: number, i: number) =>
  easeOut(sub(t, VIGNETTE_START + i * VIGNETTE_DUR, VIGNETTE_DUR));

// ─── TERRAIN ──────────────────────────────────────────────
// Three depths, each drawn three times (lit crest, body, base shadow) so
// every mass has tone instead of being one flat fill.
const FAR_PTS: [number, number][] = [
  [-6, 133], [26, 129], [58, 125], [86, 127], [112, 132],
  [140, 128], [168, 123], [196, 121], [224, 124], [252, 120],
  [280, 125], [308, 130], [336, 126], [368, 128], [406, 133],
];
const MID_PTS: [number, number][] = [
  [-6, 151], [28, 147], [56, 145], [84, 146], [112, 149],
  [140, 152], [166, 150], [196, 148], [224, 150], [252, 153],
  [280, 149], [308, 144], [336, 148], [366, 152], [406, 149],
];
const NEAR_PTS: [number, number][] = [
  [-6, 174], [30, 169], [62, 166], [92, 168], [122, 165],
  [156, 162], [188, 160], [220, 161], [252, 163], [286, 161],
  [318, 160], [352, 163], [406, 169],
];
const BANK_PTS: [number, number][] = [
  [-6, 204], [40, 198], [86, 202], [130, 197], [176, 200],
  [222, 196], [268, 201], [314, 197], [360, 202], [406, 198],
];

/** Undergrowth on the near bank — the ground the reader stands on gets
 *  a couple of shapes so the bottom of the frame is not a dead slab.
 *  Kept to the edges: the last words sit in the middle. */
const UNDERGROWTH: [number, number, number, number][] = [
  // x, y, scale, flip
  [16, 206, 0.5, 1], [44, 210, 0.62, -1], [74, 204, 0.44, 1],
  [340, 205, 0.5, -1], [372, 210, 0.6, 1], [308, 208, 0.42, -1],
  [120, 214, 0.4, 1], [286, 215, 0.38, -1],
];

/** Old sheep paths across the mid swell — they keep it from reading as
 *  a slab, the way the Stones scene's contours do. */
const CONTOURS = [
  "M8 160 C56 155, 104 152, 152 155 C200 158, 248 161, 296 156 C332 152, 366 155, 396 159",
  "M4 170 C48 167, 92 163, 140 165 C190 167, 236 171, 284 167 C324 164, 362 166, 398 170",
];

/** Mist banked between the depths — long shallow lenses, drifting. */
const MIST = [
  { d: "M-30 141 C10 136, 60 134, 108 137 C150 140, 186 142, 224 140 C262 138, 300 135, 342 138 C368 140, 388 142, 410 141 C384 147, 340 149, 292 148 C240 147, 190 145, 140 146 C90 147, 24 146, -30 141 Z", y: 0, dur: 71, amp: 9, o: 0.055 },
  { d: "M-30 158 C20 153, 76 151, 128 154 C176 157, 218 159, 262 157 C304 155, 348 153, 410 156 C376 163, 320 165, 264 164 C204 163, 148 161, 96 162 C48 163, 6 162, -30 158 Z", y: 0, dur: 94, amp: -7, o: 0.04 },
  { d: "M-30 129 C20 125, 74 123, 126 125 C178 127, 232 128, 284 126 C330 124, 372 123, 410 125 C376 131, 322 133, 266 132 C206 131, 150 130, 96 131 C46 132, 4 132, -30 129 Z", y: 0, dur: 118, amp: 12, o: 0.05 },
];

/** Grass along the near crest — tapered closed blades, never strokes. */
const BLADE = "M0 0 C0.5 -2.4, 1.1 -4.6, 2.1 -6.8 C1.4 -4.4, 1 -2.2, 0.9 0 Z";
const TUFTS: [number, number, number, number][] = [
  // x, y, scale, flip
  [16, 173, 1.1, 1], [21, 174, 0.8, -1], [58, 167, 1, -1], [63, 168, 1.2, 1],
  [104, 168, 0.9, 1], [109, 169, 1.1, -1], [140, 164, 1, 1], [176, 162, 0.9, -1],
  [300, 161, 1, 1], [305, 162, 1.2, -1], [332, 160, 0.9, -1], [366, 164, 1.1, 1],
  [372, 165, 0.8, -1], [26, 175, 1, 1], [96, 169, 1, -1], [292, 162, 0.9, 1],
];

// ─── FOLIAGE ──────────────────────────────────────────────
// Six hand-drawn lobed clump silhouettes, centred on the origin. The
// crown of the Great Tree and the Garden's little tree are both built
// from these, placed at varied scale and flip across three tone bands,
// so the overlaps do the shading instead of concentric copies. (Same
// language as the v2 Great Tree; carried here so the outro's crown is
// unmistakably the same tree.)
const CLUMPS = [
  `M-31 0 C-33 -7, -28 -12, -22 -12 C-19 -17, -13 -19, -8 -16
   C-4 -21, 3 -21, 7 -16 C12 -20, 19 -18, 21 -12
   C28 -13, 33 -8, 31 -2 C34 3, 30 8, 24 8
   C21 13, 14 14, 10 10 C6 14, -1 14, -5 10
   C-10 13, -17 12, -19 7 C-26 8, -32 5, -31 0 Z`,
  `M-24 4 C-27 -2, -25 -9, -19 -12 C-18 -18, -11 -21, -6 -18
   C-2 -23, 6 -22, 9 -17 C15 -19, 21 -14, 20 -8
   C25 -5, 26 2, 21 6 C21 12, 14 16, 9 13
   C5 18, -3 18, -7 13 C-13 15, -19 11, -18 5
   C-22 6, -24 6, -24 4 Z`,
  `M-34 -2 C-36 -8, -30 -13, -24 -11 C-20 -16, -12 -17, -8 -13
   C-3 -17, 5 -16, 8 -11 C14 -14, 22 -11, 23 -5
   C30 -5, 34 1, 30 6 C28 12, 20 14, 15 11
   C10 15, 2 15, -2 11 C-8 14, -16 12, -18 6
   C-25 8, -33 4, -34 -2 Z`,
  `M-19 1 C-21 -4, -18 -10, -12 -10 C-10 -14, -4 -16, -1 -12
   C3 -16, 10 -14, 11 -8 C16 -7, 18 -2, 15 3
   C15 8, 9 11, 4 9 C0 12, -6 11, -9 7
   C-15 8, -19 5, -19 1 Z`,
  `M-28 3 C-31 -3, -28 -10, -21 -11 C-19 -16, -12 -18, -7 -15
   C-5 -20, 3 -21, 7 -16 C13 -18, 20 -15, 20 -9
   C27 -8, 30 -2, 26 3 C27 9, 20 13, 15 10
   C12 15, 4 16, 0 11 C-5 15, -13 13, -14 8
   C-21 10, -27 8, -28 3 Z`,
  `M-36 1 C-38 -5, -33 -10, -27 -9 C-24 -14, -17 -16, -12 -12
   C-7 -17, 1 -17, 5 -12 C11 -16, 19 -14, 21 -8
   C28 -9, 35 -5, 34 1 C36 7, 29 11, 23 9
   C19 13, 11 14, 7 10 C2 14, -6 13, -9 9
   C-16 12, -25 10, -28 5 C-33 6, -36 5, -36 1 Z`,
];

// ─── THE GREAT TREE ───────────────────────────────────────
const FORK_X = 200;
const FORK_Y = 104;
const TREE_BASE_Y = 162;

/** Trunk and its three limbs as ONE closed forking path: up the left
 *  flank, out the left limb and back, up the centre and back, out the
 *  right limb and back, down the right flank. Narrow enough to be a
 *  tree rather than a tower — the crown is what carries the mass. */
const TRUNK = `
  M174 ${TREE_BASE_Y}
  C182 153, 186.5 143, 188.5 130
  C190 120, 189.5 112, 190.5 105
  C191.5 101, 193 98, 194.5 95
  C191 89, 187 83, 182 77
  C179.5 74, 177 71.5, 174.5 69
  L172.5 72.5
  C175.5 75, 178 77.5, 180.5 81
  C184 86, 188 92, 191 98
  C192.5 91, 194 84, 195.5 76
  C196.5 70, 197.5 64, 198 58
  L203 58
  C203.5 64, 204.5 70, 205.5 77
  C207 85, 208.5 92, 210 99
  C212.5 94, 216 88, 220 82
  C222.5 78.5, 225 75.5, 227.5 73
  L229.5 76.5
  C226.5 79, 224 82, 221.5 85.5
  C218.5 92, 214 99, 211.5 106
  C212.5 113, 212.5 121, 213 130
  C214.5 143, 218 153, 225 ${TREE_BASE_Y}
  Z`;

/** Bark grain — a few ridges that follow the trunk's own taper. */
const BARK = [
  "M184 156 C187 146, 189 134, 190 122 C190.5 114, 190.5 108, 191 102",
  "M195 158 C195.6 148, 195.8 138, 196 128",
  "M207 158 C208 147, 208.6 135, 208.8 124 C208.8 115, 208.6 108, 208.4 102",
  "M215 154 C216 145, 216.6 136, 216.6 128",
  "M180 152 C183 143, 185.6 134, 187 126",
];

/** The hollow — the heart of the tree. Irregular, never an oval. */
const HOLLOW = `
  M200 118
  C197 120, 195.5 123.5, 196 127
  C196.4 130, 195 133, 195.4 136
  C195.8 139, 197.6 141.5, 200.4 142
  C203.2 142.4, 205.4 140.6, 206.2 137.8
  C207 135, 205.9 132.2, 206.3 129
  C206.7 125.8, 204.6 121.7, 202.1 119.9
  C201.4 119.3, 200.7 118, 200 118 Z`;
/** The near lip, where the light inside falls on torn wood. */
const HOLLOW_LIP = `
  M195.4 136 C195.8 139, 197.6 141.5, 200.4 142
  C203.2 142.4, 205.4 140.6, 206.2 137.8
  L204.4 136.8 C203.7 139.2, 202 140.5, 200 140.3
  C197.9 140.1, 196.6 138.9, 196.4 137 Z`;

/** Buttress roots hugging the ground on both sides. Short: at panorama
 *  scale a long root reads as a rope dropped on the grass. */
const BUTTRESS = [
  "M180 153 C175 157, 169 160, 163 162.4 C160 163.6, 157 164.4, 154 165 L154.6 168 C158 167.4, 161.6 166.4, 165 165 C171 162.6, 177 159, 182 156 Z",
  "M219 153 C224 157, 230 160, 236 162.4 C239 163.6, 242 164.4, 245 165 L244.4 168 C241 167.4, 237.4 166.4, 234 165 C228 162.6, 222 159, 217 156 Z",
];

interface Leaf {
  x: number;
  y: number;
  s: number;
  f: 1 | -1;
  shape: number;
  tone: 0 | 1 | 2;
}
/** The crown: shade clumps low and outside, body clumps filling, lit
 *  clumps riding the top edge where the dawn finds them. */
/** Thirty-four clumps across three tone bands. Twenty read as a row of
 *  separate puffs; this many, at this spread of scales, overlap into one
 *  mass with a broken edge — which is what a crown looks like. */
const CROWN: Leaf[] = [
  // shade — the underside, hanging lower and sitting down over the fork
  { x: 140, y: 90, s: 0.22, f: 1, shape: 3, tone: 0 },
  { x: 146, y: 94, s: 0.34, f: -1, shape: 4, tone: 0 },
  { x: 160, y: 88, s: 0.42, f: 1, shape: 2, tone: 0 },
  { x: 178, y: 84, s: 0.46, f: -1, shape: 5, tone: 0 },
  { x: 200, y: 82, s: 0.48, f: 1, shape: 0, tone: 0 },
  { x: 222, y: 83, s: 0.46, f: -1, shape: 2, tone: 0 },
  { x: 242, y: 87, s: 0.42, f: 1, shape: 5, tone: 0 },
  { x: 256, y: 94, s: 0.34, f: -1, shape: 4, tone: 0 },
  { x: 262, y: 90, s: 0.22, f: 1, shape: 3, tone: 0 },
  { x: 168, y: 98, s: 0.28, f: 1, shape: 1, tone: 0 },
  { x: 232, y: 99, s: 0.28, f: -1, shape: 3, tone: 0 },
  { x: 204, y: 100, s: 0.3, f: 1, shape: 4, tone: 0 },
  // body — the belly of the crown
  { x: 150, y: 82, s: 0.34, f: 1, shape: 1, tone: 1 },
  { x: 166, y: 74, s: 0.44, f: -1, shape: 3, tone: 1 },
  { x: 184, y: 68, s: 0.5, f: 1, shape: 5, tone: 1 },
  { x: 204, y: 66, s: 0.52, f: -1, shape: 0, tone: 1 },
  { x: 224, y: 69, s: 0.5, f: 1, shape: 2, tone: 1 },
  { x: 242, y: 76, s: 0.44, f: -1, shape: 5, tone: 1 },
  { x: 256, y: 84, s: 0.34, f: 1, shape: 1, tone: 1 },
  { x: 176, y: 82, s: 0.3, f: -1, shape: 4, tone: 1 },
  { x: 228, y: 84, s: 0.3, f: 1, shape: 3, tone: 1 },
  { x: 198, y: 78, s: 0.32, f: -1, shape: 2, tone: 1 },
  // lit — the top edge, and where first light lands
  { x: 152, y: 74, s: 0.26, f: -1, shape: 3, tone: 2 },
  { x: 164, y: 66, s: 0.34, f: 1, shape: 4, tone: 2 },
  { x: 180, y: 58, s: 0.42, f: -1, shape: 1, tone: 2 },
  { x: 200, y: 54, s: 0.46, f: 1, shape: 5, tone: 2 },
  { x: 220, y: 57, s: 0.44, f: -1, shape: 0, tone: 2 },
  { x: 238, y: 64, s: 0.38, f: 1, shape: 2, tone: 2 },
  { x: 250, y: 72, s: 0.28, f: -1, shape: 4, tone: 2 },
  { x: 190, y: 62, s: 0.3, f: 1, shape: 3, tone: 2 },
  { x: 212, y: 62, s: 0.3, f: -1, shape: 1, tone: 2 },
  { x: 172, y: 50, s: 0.2, f: 1, shape: 3, tone: 2 },
  { x: 200, y: 46, s: 0.24, f: -1, shape: 4, tone: 2 },
  { x: 228, y: 50, s: 0.2, f: 1, shape: 1, tone: 2 },
];

/** One light for every scribe who went into the heart — the level
 *  accents, drifting inside the hollow. */
const SCRIBES: { x: number; y: number; r: number; c: string; dur: number }[] = [
  { x: 199, y: 122, r: 0.6, c: "#8ac98a", dur: 11 },
  { x: 203, y: 126, r: 0.5, c: "#eeb262", dur: 9 },
  { x: 199, y: 130, r: 0.55, c: "#a6a6f6", dur: 13 },
  { x: 203, y: 134, r: 0.45, c: "#76c8c8", dur: 10 },
  { x: 200, y: 137, r: 0.6, c: "#96bd8c", dur: 12 },
  { x: 203, y: 121, r: 0.45, c: "#cfa4c2", dur: 8.5 },
  { x: 200, y: 127, r: 0.5, c: "#a2bcd6", dur: 14 },
  { x: 202, y: 139, r: 0.5, c: "#dcc98c", dur: 9.5 },
];

/** Glints among the leaves once the heart is lit. */
const GLINTS: [number, number, number][] = [
  [160, 84, 3.4], [180, 68, 4.2], [200, 58, 3.1], [216, 64, 4.6],
  [234, 76, 3.7], [250, 88, 4.1], [170, 74, 3.9], [208, 78, 4.4],
  [228, 84, 3.3], [190, 78, 5.0], [246, 80, 3.6], [152, 90, 4.8],
];

// ─── THE INK THREADS ──────────────────────────────────────
// A hair-thin gold line over a soft halo, drawn out from the tree's base
// to each place along the ground it crosses. Normalised with
// pathLength="1", so one dash schedule fits every length.
const THREADS: string[] = [
  "M200 159 C168 168, 128 172, 94 171 C76 170.5, 58 168, 44 165",
  "M200 159 C176 160, 152 156, 132 151 C120 148.5, 108 147, 98 148",
  // out along the ground, then lifting away into the sky on a long arc
  "M200 159 C180 160, 158 154, 140 146 C132 142, 124 139, 118 137 C110 124, 102 106, 96 86 C93 75, 91 64, 90 56",
  "M200 159 C192 160, 182 157, 172 154 C166 152.5, 161 152, 156 152",
  "M200 159 C212 163, 226 164, 238 163 C243 162.5, 248 162, 252 161",
  "M200 159 C224 161, 250 156, 272 150 C284 146.5, 296 144, 306 144",
  "M200 159 C230 166, 262 165, 292 160 C310 157, 326 154, 336 153",
  "M200 159 C238 170, 286 176, 326 175 C346 174.5, 364 170, 372 167",
];

// ─── SKY ──────────────────────────────────────────────────
/** Elongated dawn clouds — asymmetric lenses, never mirrored. */
const CLOUDS = [
  { d: "M-24 88 C14 82, 58 80, 100 83 C132 85, 158 88, 186 87 C154 93, 108 95, 62 94 C26 93, -2 91, -24 88 Z", dur: 96, amp: 14 },
  { d: "M232 68 C266 63, 306 61, 344 64 C370 66, 392 68, 414 67 C388 73, 344 75, 300 74 C266 73, 246 71, 232 68 Z", dur: 124, amp: -11 },
  { d: "M40 108 C74 104, 112 103, 148 105 C122 110, 82 112, 48 111 C42 110.5, 40 109.5, 40 108 Z", dur: 78, amp: 9 },
  { d: "M266 98 C298 94, 336 93, 372 95 C348 100, 306 102, 274 101 C268 100.8, 266 99.5, 266 98 Z", dur: 106, amp: -13 },
  { d: "M118 74 C144 70, 176 69, 206 71 C182 76, 148 77, 124 76 C119 75.8, 118 75, 118 74 Z", dur: 88, amp: 10 },
];

/** Night stars, washing out as the dawn climbs. `t` marks the third
 *  that twinkle. */
const NIGHT_STARS: [number, number, number, number][] = [
  // x, y, r, twinkle period (0 = steady)
  [22, 22, 0.7, 3.4], [46, 46, 0.5, 0], [68, 16, 0.6, 4.2], [88, 68, 0.45, 0],
  [136, 24, 0.65, 3.8], [150, 62, 0.5, 0], [166, 18, 0.55, 0], [186, 34, 0.6, 4.6],
  [212, 20, 0.5, 0], [232, 44, 0.55, 3.2], [254, 26, 0.6, 0], [272, 58, 0.45, 0],
  [286, 18, 0.65, 4.4], [304, 44, 0.5, 0], [322, 70, 0.55, 0], [338, 22, 0.6, 3.6],
  [362, 52, 0.5, 0], [380, 30, 0.6, 4.8], [392, 74, 0.45, 0], [12, 62, 0.5, 0],
  [58, 92, 0.4, 0], [246, 82, 0.45, 3.9], [356, 88, 0.4, 0], [104, 12, 0.5, 0],
  [318, 12, 0.55, 0], [200, 10, 0.45, 0], [76, 40, 0.4, 4.1], [296, 32, 0.45, 0],
];

/** The player's own constellation — the figure they named, kept in the
 *  sky where the crown does not reach. */
const CONSTELLATION: [number, number, number][] = [
  // x, y, radius
  [80, 56, 0.9], [90, 46, 1.1], [100, 38, 1.5], [111, 30, 1.3],
  [104, 54, 1.0], [115, 45, 0.9], [96, 26, 0.8],
];
const CONST_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 5], [2, 6], [1, 4],
];

/** The moon: one closed lune, not two stacked circles. */
const MOON = `
  M348 24 C355 25, 361 31, 361 39 C361 47, 355 53, 347 54
  C352 49, 355 44, 355 38.5 C355 33, 352 28, 348 24 Z`;

// ─── VIGNETTE SHAPES ──────────────────────────────────────
/** A five-lobed blossom, the Garden's flower at panorama scale. */
const BLOSSOM = `
  M0 -2.5 C1.2 -3.3, 2.6 -2.5, 2.5 -1.1
  C3.7 -0.7, 3.9 0.8, 2.7 1.5
  C3.1 2.8, 1.9 3.7, 0.7 3
  C0 4, -1.5 3.9, -1.9 2.7
  C-3.2 2.8, -4.1 1.5, -3.4 0.3
  C-4.3 -0.7, -3.7 -2.2, -2.4 -2.4
  C-2.2 -3.7, -0.8 -3.9, 0 -2.5 Z`;

/** A layered fir — the Sanctum's elder trees at panorama scale. */
const FIR = `
  M0 -23 C1.6 -19.5, 3.2 -16.8, 4.8 -14.6 L2.6 -14.6
  C4.2 -11.4, 6.1 -8.6, 7.9 -6.2 L4.7 -6.2
  C6.9 -3, 9.3 -0.4, 11.6 2.2 L3 2.2 L2.2 6 L-2.2 6 L-3 2.2 L-11.6 2.2
  C-9.3 -0.4, -6.9 -3, -4.7 -6.2 L-7.9 -6.2
  C-6.1 -8.6, -4.2 -11.4, -2.6 -14.6 L-4.8 -14.6
  C-3.2 -16.8, -1.6 -19.5, 0 -23 Z`;

/** The Cottage: walls, a sagging roof with overhang, a chimney. */
const COT_WALL = `
  M-11 10.5 C-11.4 5.5, -11.3 0.5, -11 -4.5
  C-5 -5, 5 -5.1, 11 -4.7 C11.3 0.3, 11.2 5.3, 11 10.5
  C4 10.9, -5 10.9, -11 10.5 Z`;
const COT_ROOF = `
  M-14 -4 C-9.5 -8.6, -4.8 -13.2, 0 -18
  C4.8 -13.2, 9.5 -8.6, 14 -4
  C9 -2.9, -9 -2.9, -14 -4 Z`;
const COT_CHIMNEY = "M4.4 -12.2 L8.4 -12.2 L8.1 -20.4 L4.9 -20.6 Z";
/** Three asymmetric wisps — never mirrored. */
const COT_SMOKE = [
  "M6.4 -21 C5.2 -24.4, 7.8 -26.6, 6.9 -30",
  "M6.6 -22 C8.2 -25.8, 5.4 -28.6, 6.4 -32.8",
  "M6.5 -20.5 C4.9 -23, 8.4 -25.2, 7.3 -27.8",
];

/** The Well: a stone ring, two posts, a shingled pyramid roof. */
const WELL_RING = `
  M-9 5.4 C-9.6 2, -9.4 -1.6, -8.8 -4.6
  C-5.6 -6, -1.6 -6.6, 0.4 -6.5 C3.2 -6.4, 6.6 -5.8, 8.8 -4.6
  C9.5 -1.4, 9.6 2.2, 9 5.4 C5.6 6.8, -5.4 6.9, -9 5.4 Z`;
const WELL_MOUTH = `
  M-8.6 -4.4 C-5.4 -5.9, -1.4 -6.5, 0.5 -6.4
  C3.3 -6.3, 6.5 -5.7, 8.6 -4.4
  C6.4 -3, 3.2 -2.4, 0.4 -2.5 C-1.6 -2.6, -5.4 -3, -8.6 -4.4 Z`;
const WELL_ROOF = `
  M-12.6 -16 C-8.4 -19.2, -4.2 -22.4, 0 -25.8
  C4.2 -22.4, 8.4 -19.2, 12.6 -16
  C7.6 -14.6, -7.6 -14.6, -12.6 -16 Z`;

/** The Bridge: a gorge cut into the near ground, a segmental arch ring,
 *  a cambered deck. The gorge is a notch in the meadow, not two
 *  free-standing pillars — the shoulders run out under the grass. */
const BR_GORGE = `
  M-13.4 3 C-12.2 -3.6, -6.6 -7.6, 0 -7.6 C6.6 -7.6, 12.2 -3.6, 13.4 3 Z`;
/** A thread of water under the arch, catching the first light. */
const BR_RIVER = "M-8.6 1.6 C-4.6 0.4, 4.6 0.4, 8.6 1.6 C4.6 2.8, -4.6 2.8, -8.6 1.6 Z";
/** The lip of the gorge, catching the light on both shoulders. */
/** The grass verge running up to each abutment. */
const BR_LIP_L = `
  M-44 5.4 C-37 3, -29 1.6, -22 1.4 C-21 1.4, -20 1.4, -19.4 1.4
  L-19 4.4 C-24 4.4, -30 5.2, -36 6.6 C-39 7.3, -41.6 8.1, -43.4 8.8 Z`;
const BR_LIP_R = `
  M19.4 1.4 C20.4 1.4, 21.6 1.4, 23 1.5 C30 1.9, 37.4 3.4, 44 5.6
  L43 9 C37 6.9, 30 5.3, 24 4.7 C21.8 4.5, 20.2 4.4, 19 4.4 Z`;
const BR_ARCH = `
  M-19 3 C-17.4 -6, -9.6 -11.4, 0 -11.4 C9.6 -11.4, 17.4 -6, 19 3
  L13.4 3 C12.2 -3.6, 6.6 -7.6, 0 -7.6 C-6.6 -7.6, -12.2 -3.6, -13.4 3 Z`;
const BR_DECK = `
  M-24 -8.6 C-13 -13.4, 13 -13.4, 24 -8.6
  L24 -4.6 C13 -9.4, -13 -9.4, -24 -4.6 Z`;
/** Voussoir joints on the arch ring. */
const BR_JOINTS = [-0.78, -0.42, 0, 0.42, 0.78];

/** The Library: a bluff of rock with a lit mouth in it. The crest is
 *  broken twice so it reads as rock and not as a burial mound. */
const LIB_BLUFF = `
  M-22 5 C-21.2 -0.4, -19.8 -5.2, -17.6 -9.6
  C-16 -12.8, -13.8 -15.6, -11 -17.6
  C-10.4 -17, -10 -16.6, -9.6 -16.2
  C-7.4 -18.6, -4.2 -20.4, -0.6 -21.4 C1.8 -22, 4.2 -22, 6.4 -21.4
  C6.8 -21.8, 7.1 -22.1, 7.4 -22.4 C10 -20.4, 12.4 -17.6, 14.4 -13.8
  C16.6 -9.2, 18.4 -3.4, 19.4 3
  C19.6 4, 19.8 4.6, 20 5 C13 6.4, -14 6.4, -22 5 Z`;
/** The lit face — the flank turned toward the dawn behind the tree. */
const LIB_FACE = `
  M-22 5 C-21.2 -0.4, -19.8 -5.2, -17.6 -9.6
  C-16 -12.8, -13.8 -15.6, -11 -17.6
  C-10.4 -17, -10 -16.6, -9.6 -16.2
  C-8.4 -17.4, -7.2 -18.4, -5.8 -19.2
  C-8.6 -14.4, -11 -9.6, -12.8 -4.4 C-13.9 -1.2, -14.6 1.8, -15 5
  C-18 5.3, -20.4 5.2, -22 5 Z`;
const LIB_MOUTH = `
  M-6.6 4.4 C-6.8 -0.6, -5.4 -4.6, -2.8 -6.6
  C-0.6 -8.2, 2 -8.1, 4.1 -6.4 C6.5 -4.4, 7.6 -0.5, 7.4 4.4
  C3 5.1, -2.6 5.1, -6.6 4.4 Z`;
/** A small open book, the way the Library's do it. */
const LIB_BOOK = `
  M0 0 C-1.4 -1.5, -3.4 -2.1, -5 -1.9 L-5 1.4 C-3.4 1.2, -1.4 1.6, 0 2.6
  C1.4 1.6, 3.4 1.2, 5 1.4 L5 -1.9 C3.4 -2.1, 1.4 -1.5, 0 0 Z`;

/** Standing stones in unit space: u across, v down from the crown. */
const STONE_FORMS: string[] = [
  "M-0.44 -1 L0.5 -0.9 L0.72 -0.32 L0.5 0.18 L0.78 0.62 L0.62 1 L-0.6 1 L-0.76 0.5 L-0.5 0.02 L-0.72 -0.4 Z",
  "M-0.2 -1 L0.6 -0.78 L0.76 -0.1 L0.52 0.4 L0.7 1 L-0.56 1 L-0.72 0.42 L-0.48 -0.16 L-0.66 -0.66 Z",
  "M-0.52 -1 L0.36 -0.94 L0.68 -0.36 L0.46 0.26 L0.66 1 L-0.64 1 L-0.74 0.36 L-0.44 -0.24 L-0.68 -0.62 Z",
];
/** x offset, base y offset, half-width, height, form, flip. Seven stones
 *  set in a shallow ring so the circle reads in perspective. */
const STONE_RING: [number, number, number, number, number, number][] = [
  [-16, 2, 3.0, 10, 0, 1],
  [-10, -2.4, 2.8, 12.5, 1, -1],
  [-2, -4.2, 3.3, 14.5, 2, 1],
  [7, -3.6, 2.9, 13.5, 0, -1],
  [15, -0.8, 3.0, 11, 1, 1],
  [9, 3.4, 2.7, 9.5, 2, -1],
  [-7, 3.8, 2.8, 9, 0, 1],
];

/** A spirit: translucent teardrop with an inner pearl, as the Sanctum
 *  draws them. */
const TEARDROP = `
  M0 -4.4 C-1.4 -3.5, -2.3 -1.8, -2.2 0
  C-2 2.2, -1 3.5, 0 3.5 C1 3.5, 2 2.2, 2.2 0
  C2.3 -1.8, 1.4 -3.5, 0 -4.4 Z`;

// ─── THE GLOW MANIFEST ────────────────────────────────────
// Progress here is the outro's own clock over GLOW_SPAN seconds, so a
// place's light arrives exactly when its miniature blooms. Tuning law
// from the Cottage: whole-frame lights at or below 0.06, local halos
// 0.3–0.4 at radius 35–50, haze at or below 0.05.
const bloomP = (p: number, i: number) =>
  sub(p, (VIGNETTE_START + i * VIGNETTE_DUR) / GLOW_SPAN, VIGNETTE_DUR / GLOW_SPAN);

const outroManifest: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const dawn = sub(p, 2 / GLOW_SPAN, 20 / GLOW_SPAN);
    const heart = sub(p, 13 / GLOW_SPAN, 4 / GLOW_SPAN);
    const crown = sub(p, 15 / GLOW_SPAN, 3 / GLOW_SPAN);
    const radiance = sub(p, 18 / GLOW_SPAN, 4 / GLOW_SPAN);
    return [
      // First light behind the ridge — the one light that touches
      // everything, and the reason it stays this low.
      { x: 200, y: 138, radius: 210, intensity: 0.028 + 0.03 * dawn + 0.012 * radiance, color: [1.0, 0.7, 0.42], flicker: 0 },
      // The hollow. The only fire in the frame.
      { x: 200, y: 124, radius: 34, intensity: 0.4 * heart, color: [1.0, 0.76, 0.42], flicker: 0.06, core: 0.7 },
      // What the heart throws up into the leaves.
      { x: 200, y: 62, radius: 62, intensity: 0.09 * crown, color: [1.0, 0.86, 0.58], flicker: 0.03 },
      // The Garden's dawn-lit crown.
      { x: 44, y: 140, radius: 26, intensity: 0.11 * bloomP(p, 0), color: [0.78, 0.92, 0.62], flicker: 0 },
      // The Cottage window.
      { x: 98, y: 141, radius: 26, intensity: 0.34 * bloomP(p, 1), color: [1.0, 0.62, 0.24], flicker: 0.09, core: 0.6 },
      // The brightest star of the figure they named.
      { x: 100, y: 38, radius: 14, intensity: 0.26 * bloomP(p, 2), color: [0.78, 0.8, 1.0], flicker: 0.08, core: 0.7 },
      // Water back in the well.
      { x: 156, y: 146, radius: 20, intensity: 0.3 * bloomP(p, 3), color: [0.34, 0.86, 0.86], flicker: 0.05, core: 0.5 },
      // The bridge lanterns, one shared halo.
      { x: 252, y: 149, radius: 20, intensity: 0.28 * bloomP(p, 4), color: [1.0, 0.74, 0.36], flicker: 0.13, core: 0.5 },
      // Gold pouring out of the cavern mouth.
      { x: 306, y: 145, radius: 24, intensity: 0.3 * bloomP(p, 5), color: [1.0, 0.8, 0.5], flicker: 0.04, core: 0.5 },
      // Light travelling the stone ring.
      { x: 336, y: 146, radius: 20, intensity: 0.15 * bloomP(p, 6), color: [0.66, 0.78, 0.96], flicker: 0.05 },
      // The Sanctum's moon pool.
      { x: 376, y: 166, radius: 22, intensity: 0.22 * bloomP(p, 7), color: [0.86, 0.88, 0.78], flicker: 0.03, yScale: 2.2 },
    ];
  },
  // Valley air between the depths. Low on purpose: air, not fog.
  haze: (p) => ({
    top: 112,
    bottom: 176,
    density: 0.034 * (0.3 + 0.7 * sub(p, 2 / GLOW_SPAN, 14 / GLOW_SPAN)),
    color: [0.62, 0.68, 0.78],
  }),
  motes: (p) => {
    const m = sub(p, 12 / GLOW_SPAN, 8 / GLOW_SPAN);
    if (m <= 0) return null;
    return {
      x: 30, y: 96, width: 340, height: 76,
      count: 20, size: 0.95, color: [1.0, 0.9, 0.68], speed: 0.7, alpha: m * 0.8,
    };
  },
};

// ─── PIECES ───────────────────────────────────────────────

/** Sky, clouds, stars, moon, dawn — everything above the ridge. */
const Sky = memo(function Sky({ d, hz }: { d: number; hz: number }) {
  const starFade = 1 - smooth(Math.min(1, d * 1.15));
  return (
    <g>
      <rect x="0" y="0" width="400" height="250" fill="url(#oSky)" />

      {/* night stars, washing out as the light comes up */}
      {starFade > 0.01 && (
        <g fill="#dfe4f4">
          {NIGHT_STARS.map(([x, y, r, tw], i) => (
            <circle key={i} cx={x} cy={y} r={r} opacity={starFade * (0.3 + (i % 4) * 0.11)}>
              {tw > 0 && (
                <animate attributeName="opacity"
                  values={`${(starFade * 0.14).toFixed(3)};${(starFade * 0.5).toFixed(3)};${(starFade * 0.14).toFixed(3)}`}
                  dur={`${tw}s`} repeatCount="indefinite" />
              )}
            </circle>
          ))}
        </g>
      )}

      {/* the moon, paling */}
      <g opacity={0.16 + 0.5 * (1 - smooth(Math.min(1, d * 0.9)))}>
        <circle cx="354" cy="39" r="16" fill="url(#oMoonHalo)" />
        <path d={MOON} fill="#e8ecf6" opacity="0.9" />
      </g>

      {/* first light behind the ridge, and a low band of it running the
          whole width so the dawn belongs to the valley, not just the tree */}
      <rect x="0" y="96" width="400" height="52" fill="url(#oDawnBar)" opacity={0.25 + 0.75 * d} />
      <ellipse cx="200" cy="140" rx={230} ry={78} fill="url(#oDawn)" opacity={0.28 + 0.72 * d} />

      {/* clouds — thin strata, a touch of warmth caught underneath.
          Kept close to the sky's own value: a bright cloud at this scale
          reads as a lozenge, not as air. */}
      <g>
        {CLOUDS.map((c, i) => (
          <g key={i}>
            <animateTransform attributeName="transform" type="translate"
              values={`0 0; ${c.amp} 0; 0 0`} dur={`${c.dur}s`} repeatCount="indefinite" />
            <path d={c.d} fill={hsl(288 - d * 24, 18 + d * 10, 15 + d * 7)} opacity={0.2 + d * 0.14} />
            <path d={c.d} fill={hsl(24, 44, 34)} opacity={d * 0.11} transform="translate(0 1.2)" />
          </g>
        ))}
      </g>

      {/* phase 1 — the horizon draws itself as a line of first light */}
      {hz > 0 && hz < 1 && (
        <g opacity={1 - hz * 0.4}>
          <path d={ridge(FAR_PTS, -1.4)} fill="none" stroke="#f0c489" strokeWidth="0.7"
            pathLength="1" strokeDasharray="1" strokeDashoffset={1 - easeOut(hz)}
            opacity={0.5} />
        </g>
      )}
    </g>
  );
});

/** Three depths, mist banked between them. Each mass is filled with a
 *  vertical gradient rather than three stacked offset copies: an offset
 *  copy gives every band a uniform stripe of piping along its crest,
 *  which reads as neon rather than as light falling on a hill. The
 *  gradient carries the same three tones (lit crest, body, base) with a
 *  soft edge between them. */
const Terrain = memo(function Terrain({ d, hz }: { d: number; hz: number }) {
  const rise = smooth(Math.min(1, hz / 0.45));
  if (rise <= 0) return null;
  return (
    <g opacity={rise}>
      {/* far ridge — a backlit silhouette; the dawn catches only its edge */}
      <path d={ridge(FAR_PTS, 0, 250)} fill="url(#gFar)" />
      <path d={ridge(FAR_PTS, 0)} fill="none" stroke={hsl(30, 40, 30 + d * 16)}
        strokeWidth="0.5" opacity={0.14 + d * 0.24} />

      {/* mist between far and mid */}
      <g>
        {MIST.slice(2).map((m, i) => (
          <g key={i}>
            <animateTransform attributeName="transform" type="translate"
              values={`0 0; ${m.amp} 0; 0 0`} dur={`${m.dur}s`} repeatCount="indefinite" />
            <path d={m.d} fill="#b6c6d4" opacity={m.o * (0.4 + d * 0.6)} />
          </g>
        ))}
      </g>

      {/* mid hills */}
      <path d={ridge(MID_PTS, 0, 250)} fill="url(#gMid)" />
      <g stroke={hsl(104, 20, 20)} strokeWidth="0.45" fill="none" opacity={0.1 + d * 0.1}>
        {CONTOURS.map((c, i) => <path key={i} d={c} />)}
      </g>

      {/* mist between mid and near */}
      <g>
        {MIST.slice(0, 2).map((m, i) => (
          <g key={i}>
            <animateTransform attributeName="transform" type="translate"
              values={`0 0; ${m.amp} 0; 0 0`} dur={`${m.dur}s`} repeatCount="indefinite" />
            <path d={m.d} fill="#a8bcc8" opacity={m.o * (0.4 + d * 0.6)} />
          </g>
        ))}
      </g>

      {/* near meadow */}
      <path d={ridge(NEAR_PTS, 0, 250)} fill="url(#gNear)" />

      {/* grass along the near crest */}
      <g fill={hsl(100 - d * 8, 20 + d * 8, 13 + d * 5)} opacity={0.45 + d * 0.2}>
        {TUFTS.map(([x, y, sc, f], i) => (
          <path key={i} d={BLADE} transform={`translate(${x} ${y}) scale(${sc * f} ${sc})`} />
        ))}
      </g>

      {/* the near bank — the ground the reader stands on, with enough
          undergrowth at the edges that it is not a dead slab */}
      <path d={ridge(BANK_PTS, 0, 250)} fill="url(#gBank)" />
      <g fill={hsl(164, 14, 3.4 + d * 1.2)}>
        {UNDERGROWTH.map(([x, y, sc, f], i) => (
          <path key={i} d={CLUMPS[i % 6]}
            transform={`translate(${x} ${y}) scale(${sc * f} ${sc * 0.7})`} />
        ))}
      </g>
    </g>
  );
});

// ── the eight places ──────────────────────────────────────

const Garden = memo(function Garden({ p }: { p: number }) {
  if (p <= 0) return null;
  const g = 0.15 + 0.85 * smooth(p);
  const bx = 44, by = 164;
  return (
    <g>
      <ellipse cx={bx} cy={by - 4} rx={34 * p} ry={14 * p} fill="url(#vh0)" />
      {/* a forking trunk, one tapered path */}
      <path
        d={`M${bx - 3.4} ${by + 1} C${bx - 3} ${by - 8}, ${bx - 2.6} ${by - 14}, ${bx - 2.4} ${by - 19}
            C${bx - 5.4} ${by - 24}, ${bx - 8.6} ${by - 27.4}, ${bx - 11.6} ${by - 30}
            L${bx - 10.2} ${by - 31.8} C${bx - 7.2} ${by - 29}, ${bx - 4} ${by - 25.6}, ${bx - 1.6} ${by - 22}
            C${bx - 0.8} ${by - 26.4}, ${bx + 0.4} ${by - 30.6}, ${bx + 2.2} ${by - 34.6}
            L${bx + 4} ${by - 33.6} C${bx + 2.4} ${by - 29.4}, ${bx + 1.4} ${by - 25}, ${bx + 1.2} ${by - 20.4}
            C${bx + 1.8} ${by - 14}, ${bx + 2.6} ${by - 7}, ${bx + 3.6} ${by + 1} Z`}
        fill={hsl(26, 16, 7)} opacity={p}
      />
      {/* crown, from the same clump language as the Great Tree */}
      <g transform={`translate(${bx} ${by - 24}) scale(${g})`}>
        <animateTransform attributeName="transform" type="rotate"
          values="-0.7 0 24; 0.7 0 24; -0.7 0 24" dur="11s" repeatCount="indefinite"
          additive="sum" />
        {[
          { x: -12, y: -3, s: 0.24, f: -1 as const, sh: 4, tone: 0 },
          { x: 10, y: -2, s: 0.23, f: 1 as const, sh: 2, tone: 0 },
          { x: -1, y: -6, s: 0.28, f: -1 as const, sh: 0, tone: 0 },
          { x: -8, y: -11, s: 0.22, f: 1 as const, sh: 5, tone: 1 },
          { x: 7, y: -10, s: 0.21, f: -1 as const, sh: 1, tone: 1 },
          { x: -1, y: -16, s: 0.2, f: 1 as const, sh: 3, tone: 2 },
          { x: 10, y: -14, s: 0.15, f: -1 as const, sh: 4, tone: 2 },
        ].map((c, i) => {
          const t = sub(p, 0.25 + i * 0.08, 0.4);
          if (t <= 0) return null;
          return (
            <path key={i} d={CLUMPS[c.sh]}
              fill={hsl([152, 140, 128][c.tone], [17, 23, 27][c.tone], [5, 9.5, 15][c.tone])}
              opacity={0.78 + t * 0.22}
              transform={`translate(${c.x} ${c.y}) scale(${(c.s * c.f * t).toFixed(3)} ${(c.s * t).toFixed(3)})`} />
          );
        })}
      </g>
      {/* the flowers they bloomed */}
      {[[-19, -1], [-13, 1.5], [14, 0], [21, 2], [-24, 2.5]].map(([dx, dy], i) => {
        const t = sub(p, 0.5 + i * 0.08, 0.32);
        if (t <= 0) return null;
        const cx = bx + dx, cy = by + dy;
        return (
          <g key={i} opacity={t}>
            <path d={`M${cx} ${cy} C${cx + 0.3} ${cy - 2}, ${cx - 0.2} ${cy - 3.4}, ${cx} ${cy - 5}`}
              stroke={hsl(120, 22, 14)} strokeWidth="0.4" fill="none" />
            <g transform={`translate(${cx} ${cy - 5.6}) scale(${(0.62 * t).toFixed(3)})`}>
              <animateTransform attributeName="transform" type="rotate"
                values="-5 0 5.6; 5 0 5.6; -5 0 5.6" dur={`${5 + i}s`} repeatCount="indefinite"
                additive="sum" />
              <path d={BLOSSOM} fill={["#c8708c", "#d8b064", "#a878c0", "#c8708c", "#d8b064"][i]} opacity="0.8" />
              <circle cx="0" cy="0" r="0.7" fill="#f0dc90" opacity="0.9" />
            </g>
          </g>
        );
      })}
    </g>
  );
});

const Cottage = memo(function Cottage({ p }: { p: number }) {
  if (p <= 0) return null;
  const bx = 98, by = 147;
  const lit = sub(p, 0.35, 0.5);
  return (
    <g transform={`translate(${bx} ${by - 10.5})`}>
      <ellipse cx="0" cy="10" rx={22 * p} ry={9 * p} fill="url(#vh1)" />
      <g opacity={p} transform={`scale(${(0.6 + 0.4 * smooth(p)).toFixed(3)})`}>
        <path d={COT_CHIMNEY} fill={hsl(18, 14, 9)} />
        <path d={COT_WALL} fill={hsl(24, 13, 10)} />
        {/* the sunlit gable face and the shadowed one */}
        <path d="M-11 10.5 C-11.4 5.5, -11.3 0.5, -11 -4.5 C-8.4 -4.7, -5.6 -4.9, -3 -4.9 L-3 10.7 C-6.4 10.8, -9 10.7, -11 10.5 Z"
          fill={hsl(20, 12, 7)} />
        <path d={COT_ROOF} fill={hsl(14, 16, 13)} />
        <path d="M-14 -4 C-9.5 -8.6, -4.8 -13.2, 0 -18 C1 -17, 1.8 -16.2, 2.6 -15.4 C-1.4 -11.4, -5.6 -7.4, -9.6 -3.6 C-11.6 -3.7, -13.2 -3.8, -14 -4 Z"
          fill={hsl(30, 22, 19)} opacity="0.55" />
        {/* the window they lit */}
        {lit > 0 && (
          <g opacity={lit}>
            <ellipse cx="1.4" cy="2.4" rx="9" ry="7" fill="url(#cotGlow)" />
            <path d="M-2.6 6 C-2.8 3.2, -2.8 0.4, -2.6 -2.2 C-0.6 -2.5, 3.4 -2.5, 5.4 -2.2 C5.6 0.4, 5.6 3.2, 5.4 6 C3.4 6.3, -0.6 6.3, -2.6 6 Z"
              fill="#f0a83e" opacity="0.9" />
            <path d="M1.4 -2.4 L1.4 6.2 M-2.7 1.9 L5.5 1.9" stroke={hsl(20, 22, 9)} strokeWidth="0.55" />
            <circle cx="1.4" cy="2" r="1.6" fill="#ffe4a8" opacity="0.55" />
          </g>
        )}
        {/* chimney smoke — three wisps, none of them mirrored */}
        {p > 0.7 && (
          <g stroke="#9aa0a4" strokeWidth="0.4" fill="none" opacity={(p - 0.7) * 1.6}>
            {COT_SMOKE.map((d, i) => (
              <path key={i} d={d} opacity={0.5 - i * 0.13}>
                <animateTransform attributeName="transform" type="translate"
                  values={`0 0; ${1.4 + i * 0.5} -2.2; 0 0`} dur={`${7 + i * 2.5}s`} repeatCount="indefinite" />
              </path>
            ))}
          </g>
        )}
      </g>
    </g>
  );
});

const Stars = memo(function Stars({ p }: { p: number }) {
  if (p <= 0) return null;
  return (
    <g>
      {/* the lines they drew */}
      <g stroke="#c2c8f0" strokeWidth="0.4" fill="none" opacity={sub(p, 0.35, 0.5) * 0.5}>
        {CONST_EDGES.map(([a, b], i) => (
          <line key={i} x1={CONSTELLATION[a][0]} y1={CONSTELLATION[a][1]}
            x2={CONSTELLATION[b][0]} y2={CONSTELLATION[b][1]}
            pathLength="1" strokeDasharray="1" strokeDashoffset={1 - sub(p, 0.35 + i * 0.06, 0.4)} />
        ))}
      </g>
      {CONSTELLATION.map(([x, y, r], i) => {
        const t = sub(p, i * 0.09, 0.3);
        if (t <= 0) return null;
        return (
          <g key={i} opacity={t}>
            <circle cx={x} cy={y} r={r * 4} fill="url(#starHalo)" opacity="0.5" />
            <circle cx={x} cy={y} r={r} fill="#f2f4ff">
              <animate attributeName="opacity" values="0.65;1;0.65"
                dur={`${3 + (i % 3) * 1.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </g>
  );
});

const Well = memo(function Well({ p }: { p: number }) {
  if (p <= 0) return null;
  const bx = 156, by = 151;
  const water = sub(p, 0.45, 0.5);
  return (
    <g transform={`translate(${bx} ${by - 6})`}>
      <ellipse cx="0" cy="6" rx={20 * p} ry={8 * p} fill="url(#vh3)" />
      <g opacity={p} transform={`scale(${(0.6 + 0.4 * smooth(p)).toFixed(3)})`}>
        {/* posts, then the shingled pyramid roof sitting on them */}
        <path d="M-7.8 -4 L-5.4 -4 L-5 -13.2 L-7.6 -13.2 Z" fill={hsl(26, 16, 11)} />
        <path d="M5.4 -4 L7.8 -4 L7.6 -13.2 L5 -13.2 Z" fill={hsl(26, 16, 7)} />
        <path d={WELL_ROOF} fill={hsl(20, 14, 11)} transform="translate(0 2.6)" />
        <path d="M-12.6 -13.4 C-8.4 -16.6, -4.2 -19.8, 0 -23.2 C0.8 -22.6, 1.6 -21.9, 2.4 -21.3 C-1.6 -18.4, -5.6 -15.4, -9.6 -12.8 C-11 -12.9, -12 -13.1, -12.6 -13.4 Z"
          fill={hsl(30, 22, 18)} opacity="0.5" />
        {/* the ring */}
        <path d={WELL_RING} fill={hsl(190, 8, 15)} />
        <path d="M-9 5.4 C-9.6 2, -9.4 -1.6, -8.8 -4.6 C-6.8 -5.4, -4.6 -5.9, -2.8 -6.2 L-2.8 6.4 C-5.6 6.3, -7.8 6, -9 5.4 Z"
          fill={hsl(190, 8, 10)} />
        <path d="M-9.3 0.4 C-5 -0.4, 4.4 -0.4, 9.2 0.4" stroke={hsl(190, 8, 8)} strokeWidth="0.4" fill="none" />
        <path d={WELL_MOUTH} fill={hsl(200, 14, 5)} />
        {/* water back in it */}
        {water > 0 && (
          <g opacity={water}>
            <path d={WELL_MOUTH} fill="#3fa8a8" opacity="0.5">
              <animate attributeName="opacity" values="0.35;0.6;0.35" dur="6s" repeatCount="indefinite" />
            </path>
            <ellipse cx="0" cy="-4.4" rx="4" ry="0.7" fill="#c8f4f4" opacity="0.5" />
            <ellipse cx="0" cy="-4.4" rx="9" ry="4.5" fill="url(#wellGlow)" opacity="0.8" />
          </g>
        )}
        {/* the bucket, on its rope */}
        <path d="M0 -13 C1.4 -11.6, 1 -11, 0.6 -9.6" stroke={hsl(34, 22, 22)} strokeWidth="0.35" fill="none" opacity="0.7" />
        <path d="M-1.6 -9.4 L1.8 -9.4 L1.4 -6.4 L-1.2 -6.4 Z" fill={hsl(30, 24, 18)} opacity="0.85" />
      </g>
    </g>
  );
});

const Bridge = memo(function Bridge({ p }: { p: number }) {
  if (p <= 0) return null;
  const bx = 252, by = 161;
  const build = smooth(p);
  const lock = sub(p, 0.55, 0.25) * (1 - sub(p, 0.8, 0.2));
  const lamps = sub(p, 0.65, 0.35);
  return (
    <g transform={`translate(${bx} ${by})`}>
      <ellipse cx="0" cy="-6" rx={26 * p} ry={10 * p} fill="url(#vh4)" />
      {/* the gorge it crosses — a notch cut into the meadow, its
          shoulders running out under the grass on both sides */}
      {/* what you see through the arch: the gorge, and the water in it */}
      <path d={BR_GORGE} fill="url(#gGorge)" opacity={p} />
      <path d={BR_RIVER} fill="#a8ccd4" opacity={p * 0.2} />
      <path d={BR_LIP_L} fill={hsl(98, 20, 15)} opacity={p * 0.85} />
      <path d={BR_LIP_R} fill={hsl(98, 20, 12)} opacity={p * 0.85} />
      {/* the arch, rising from the abutments and locking */}
      <g opacity={p} transform={`translate(0 ${(1 - build) * 7}) scale(1 ${(0.5 + 0.5 * build).toFixed(3)})`}>
        <path d={BR_ARCH} fill={hsl(70, 10, 20)} />
        <path d={BR_ARCH} fill={hsl(60, 12, 27)} opacity="0.5" transform="translate(0 -0.6)" />
        <g stroke={hsl(70, 10, 12)} strokeWidth="0.35" fill="none" opacity="0.7">
          {BR_JOINTS.map((u, i) => {
            const a = Math.PI * (0.5 - u * 0.5);
            return (
              <line key={i}
                x1={Math.cos(a) * 19} y1={3 - Math.sin(a) * 13.6}
                x2={Math.cos(a) * 13.4} y2={3 - Math.sin(a) * 9.8} />
            );
          })}
        </g>
        <path d={BR_DECK} fill={hsl(64, 12, 25)} />
        <path d="M-24 -8.6 C-13 -13.4, 13 -13.4, 24 -8.6 L24 -7.4 C13 -12.2, -13 -12.2, -24 -7.4 Z"
          fill={hsl(56, 16, 34)} opacity="0.7" />
      </g>
      {/* the brief glow as it locks */}
      {lock > 0.01 && <path d={BR_ARCH} fill="#e8e0b8" opacity={lock * 0.3} />}
      {/* lanterns above */}
      {lamps > 0 && [-15, 0, 15].map((dx, i) => {
        const t = sub(lamps, i * 0.2, 0.4);
        if (t <= 0) return null;
        const y = -12.4 + Math.abs(dx) * 0.075;
        return (
          <g key={i} opacity={t}>
            <path d={`M${dx} ${y} L${dx} ${y - 3.4}`} stroke={hsl(60, 12, 22)} strokeWidth="0.4" />
            <circle cx={dx} cy={y - 4.4} r="4" fill="url(#lampGlow)" opacity="0.8" />
            <circle cx={dx} cy={y - 4.4} r="1" fill="#ffdc9a">
              <animate attributeName="opacity" values="0.7;1;0.75;1;0.7"
                dur={`${3.4 + i * 0.9}s`} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </g>
  );
});

const Library = memo(function Library({ p }: { p: number }) {
  if (p <= 0) return null;
  const bx = 306, by = 143;
  const open = sub(p, 0.35, 0.5);
  return (
    <g transform={`translate(${bx} ${by})`}>
      <ellipse cx="0" cy="0" rx={24 * p} ry={10 * p} fill="url(#vh5)" />
      <g opacity={p} transform={`scale(${(0.7 + 0.3 * smooth(p)).toFixed(3)})`}>
        <path d={LIB_BLUFF} fill={hsl(268, 10, 9)} />
        <path d={LIB_FACE} fill={hsl(282, 14, 16)} opacity="0.7" />
        <g stroke={hsl(272, 10, 5)} strokeWidth="0.4" fill="none" opacity="0.5">
          <path d="M-17 -3 C-12 -4.4, -6 -5, 0 -4.8" />
          <path d="M-13 -10 C-8 -11.6, -2 -12.4, 4 -12" />
          <path d="M6 -6 C10 -5.2, 14 -3.6, 17 -1.6" />
        </g>
        {/* the mouth, and what comes out of it */}
        <path d={LIB_MOUTH} fill={hsl(28, 20, 5)} />
        {open > 0 && (
          <g opacity={open}>
            <ellipse cx="0.4" cy="1.4" rx="11" ry="9" fill="url(#libGlow)" />
            <path d={LIB_MOUTH} fill="#e8b866" opacity="0.4" />
            <ellipse cx="0.4" cy="3" rx="4" ry="2.4" fill="#ffe6ae" opacity="0.5" />
          </g>
        )}
      </g>
      {/* two books drifting out of the mouth. Small: at this scale a
          book with plumes reads as a moth, so they are page-pale and
          bare, and the voices are motes instead. */}
      {open > 0.3 && [
        { dx: -12, dy: -28, sc: 0.34, dur: 8 },
        { dx: 10, dy: -33, sc: 0.28, dur: 11 },
      ].map((b, i) => {
        const t = sub(open, 0.3 + i * 0.18, 0.35);
        if (t <= 0) return null;
        return (
          <g key={i} opacity={t * 0.7} transform={`translate(${b.dx} ${b.dy}) scale(${b.sc})`}>
            <animateTransform attributeName="transform" type="translate"
              values={`0 0; ${1.4 - i} -2.4; 0 0`} dur={`${b.dur}s`} repeatCount="indefinite" additive="sum" />
            <path d={LIB_BOOK} fill="#e6dcc0" opacity="0.75" />
          </g>
        );
      })}
      {/* the voices themselves */}
      {open > 0.4 && [[-5, -16, 9], [6, -22, 12], [-1, -30, 15]].map(([dx, dy, dur], i) => (
        <circle key={i} cx={dx} cy={dy} r="0.5" fill="#e8c890" opacity={sub(open, 0.4 + i * 0.12, 0.3) * 0.6}>
          <animateTransform attributeName="transform" type="translate"
            values={`0 0; ${i - 1} -6; 0 0`} dur={`${dur}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
});

const Stones = memo(function Stones({ p }: { p: number }) {
  if (p <= 0) return null;
  const bx = 336, by = 152;
  const ley = sub(p, 0.55, 0.45);
  return (
    <g transform={`translate(${bx} ${by})`}>
      <ellipse cx="0" cy="0" rx={24 * p} ry={9 * p} fill="url(#vh6)" />
      {/* the ring inscribed on the ground */}
      <ellipse cx="0" cy="0.5" rx={17 * p} ry={5.4 * p} fill="none"
        stroke={hsl(206, 16, 20)} strokeWidth="0.35" opacity={p * 0.35} />
      {/* Pale granite, lit on the flank turned toward the tree. At this
          size a dark stone on a dark moor is simply not there, so they
          carry their own value the way weathered stone does at dawn. */}
      {STONE_RING.map(([dx, dy, hw, h, form, flip], i) => {
        const t = smooth(sub(p, i * 0.08, 0.42));
        if (t <= 0) return null;
        const near = dy > 0;
        return (
          <g key={i} transform={`translate(${dx} ${dy}) scale(${hw * flip} ${h * t})`}>
            <path d={STONE_FORMS[form]} transform="translate(0 -1) scale(1 0.5) translate(0 1)"
              fill="url(#gStone)" opacity={near ? 0.95 : 0.8} />
          </g>
        );
      })}
      {/* Light travelling between them. Curved, and only across the back
          of the ring: straight segments all the way round draw a
          wireframe cage over the stones instead of light between them. */}
      {ley > 0 && (
        <g fill="none" opacity={ley * 0.9}>
          {[0, 1, 2, 3].map((i) => {
            const a = STONE_RING[i];
            const b = STONE_RING[i + 1];
            const ax = a[0], ay = a[1] - a[3] * 0.96;
            const bx2 = b[0], by2 = b[1] - b[3] * 0.96;
            const d = `M${ax} ${ay} Q${(ax + bx2) / 2} ${Math.min(ay, by2) - 2.4} ${bx2} ${by2}`;
            const draw = 1 - sub(ley, i * 0.09, 0.4);
            return (
              <g key={i}>
                <animate attributeName="opacity" values="0.4;1;0.4"
                  dur={`${5 + i * 0.9}s`} repeatCount="indefinite" />
                <path d={d} stroke="#8fb0dc" strokeWidth="1.6" opacity="0.09" strokeLinecap="round"
                  pathLength="1" strokeDasharray="1" strokeDashoffset={draw} />
                <path d={d} stroke="#d8e6f8" strokeWidth="0.3" opacity="0.34"
                  pathLength="1" strokeDasharray="1" strokeDashoffset={draw} />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
});

const Sanctum = memo(function Sanctum({ p }: { p: number }) {
  if (p <= 0) return null;
  const bx = 376, by = 166;
  const gather = sub(p, 0.45, 0.5);
  return (
    <g transform={`translate(${bx} ${by})`}>
      <ellipse cx="0" cy="0" rx={26 * p} ry={11 * p} fill="url(#vh7)" />
      {/* moonlight coming down between the elders — a narrow soft wedge.
          Anything wider reads as a pale slab at this scale. */}
      {gather > 0 && (
        <path d="M-1.2 -26 L1.2 -26 L4 0 L-4 0 Z" fill="url(#moonShaft)" opacity={gather * 0.2} />
      )}
      {/* the moon pool */}
      {gather > 0 && (
        <g opacity={gather}>
          <ellipse cx="0" cy="0.6" rx="8" ry="2.6" fill="#c8ccb8" opacity="0.14" />
          <ellipse cx="0" cy="0.4" rx="4.6" ry="1.4" fill="#e8ecd8" opacity="0.2">
            <animate attributeName="opacity" values="0.12;0.26;0.12" dur="9s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )}
      {/* Oak, Alder, Yew, and one more, taking their seats */}
      {[
        { dx: -14, sc: 0.46, tone: 0 },
        { dx: -6, sc: 0.6, tone: 1 },
        { dx: 6, sc: 0.66, tone: 0 },
        { dx: 15, sc: 0.5, tone: 1 },
      ].map((c, i) => {
        const t = smooth(sub(p, i * 0.1, 0.45));
        if (t <= 0) return null;
        return (
          <g key={i} transform={`translate(${c.dx} 0) scale(${c.sc * (i % 2 ? -1 : 1)} ${(c.sc * t).toFixed(3)})`}>
            <animateTransform attributeName="transform" type="rotate"
              values={`-0.5 0 0; 0.5 0 0; -0.5 0 0`} dur={`${12 + i * 2}s`} repeatCount="indefinite" additive="sum" />
            <path d={FIR} fill={hsl(178, 12, c.tone ? 8 : 5.5)} />
          </g>
        );
      })}
      {/* two spirits, come back to sit. Small and unequal — a matched
          pair of bright dots at this size reads as a face in the dark. */}
      {gather > 0.3 && [[-7, -1.5, 0.85], [4, -3.5, 0.65]].map(([dx, dy, sc], i) => {
        const t = sub(gather, 0.3 + i * 0.2, 0.4);
        if (t <= 0) return null;
        return (
          <g key={i} transform={`translate(${dx} ${dy}) scale(${sc})`} opacity={t * 0.8}>
            <animateTransform attributeName="transform" type="translate"
              values="0 0; 0 -1.1; 0 0" dur={`${6 + i * 2.5}s`} repeatCount="indefinite" additive="sum" />
            <ellipse cx="0" cy="0" rx="2.6" ry="3.6" fill="#d8d0a0" opacity="0.1" />
            <path d={TEARDROP} fill="#e0d8ac" opacity="0.18" />
            <circle cx="0" cy="-0.4" r="1" fill="#e8dfae" opacity="0.3" />
            <circle cx="0" cy="-0.4" r="0.45" fill="#fff6dc" opacity="0.6" />
          </g>
        );
      })}
    </g>
  );
});

/** One thread per place: hair-thin gold over a soft halo, drawn out from
 *  the tree's base, then a mote travels it. */
const Threads = memo(function Threads({ spread, flow }: { spread: number; flow: number }) {
  if (spread <= 0) return null;
  return (
    <g>
      {THREADS.map((d, i) => {
        const t = smooth(sub(spread, i * 0.07, 0.55));
        if (t <= 0) return null;
        const arrive = sub(t, 0.86, 0.14);
        const v = VIGNETTES[i];
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="#c8a860" strokeWidth="2.6" opacity={t * 0.07}
              pathLength="1" strokeDasharray="1" strokeDashoffset={1 - t} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#f0dea6" strokeWidth="0.5" opacity={t * 0.5}
              pathLength="1" strokeDasharray="1" strokeDashoffset={1 - t} strokeLinecap="round">
              <animate attributeName="opacity"
                values={`${(t * 0.3).toFixed(3)};${(t * 0.62).toFixed(3)};${(t * 0.3).toFixed(3)}`}
                dur={`${7 + i * 0.9}s`} repeatCount="indefinite" />
            </path>
            {/* it flares where it arrives, then settles */}
            {arrive > 0 && (
              <circle cx={v.x} cy={i === 2 ? 56 : v.y - 2} r={1.4} fill="#fff0c4" opacity={arrive * 0.5}>
                <animate attributeName="opacity" values={`${(arrive * 0.2).toFixed(3)};${(arrive * 0.5).toFixed(3)};${(arrive * 0.2).toFixed(3)}`}
                  dur={`${4 + i * 0.6}s`} repeatCount="indefinite" />
              </circle>
            )}
            {/* the light the tree sends out */}
            {flow > 0 && t > 0.98 && (
              <circle r="0.85" fill="#fff2ca" opacity={flow * 0.75}>
                <animateMotion path={d} dur={`${5.5 + i * 0.85}s`} repeatCount="indefinite" />
                <animate attributeName="opacity"
                  values={`0;${(flow * 0.8).toFixed(2)};${(flow * 0.8).toFixed(2)};0`}
                  dur={`${5.5 + i * 0.85}s`} repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </g>
  );
});

/** The Great Tree: the same clustered crown and the same lit hollow the
 *  player stood under in Act IV, now holding the whole valley. */
const GreatTree = memo(function GreatTree({
  grow, heart, crown, warm,
}: { grow: number; heart: number; crown: number; warm: number }) {
  if (grow <= 0) return null;
  const rise = smooth(Math.min(1, grow / 0.55));
  return (
    <g>
      {/* buttress roots first — they hold the trunk to the ground */}
      <g fill={hsl(28, 14, 5.5 + heart * 2)} opacity={rise}>
        {BUTTRESS.map((d, i) => <path key={i} d={d} />)}
      </g>

      {/* The trunk, growing up out of the ground. The dawn is behind the
          tree, so the wood is filled across its width rather than flat:
          rim-lit on both flanks, darkest through the middle. */}
      <g transform={`translate(${FORK_X} ${TREE_BASE_Y}) scale(${(0.35 + 0.65 * rise).toFixed(3)}) translate(${-FORK_X} ${-TREE_BASE_Y})`}>
        <path d={TRUNK} fill="url(#gTrunk)" />
        <g stroke={hsl(26, 14, 3.5)} strokeWidth="0.55" fill="none" opacity="0.5">
          {BARK.map((d, i) => <path key={i} d={d} />)}
        </g>
      </g>

      {/* the crown — two sway groups, exactly as the Great Tree sways */}
      {[0, 1].map((group) => (
        <g key={group}>
          <animateTransform attributeName="transform" type="rotate"
            values={group === 0
              ? `-0.4 ${FORK_X} ${FORK_Y}; 0.4 ${FORK_X} ${FORK_Y}; -0.4 ${FORK_X} ${FORK_Y}`
              : `0.65 ${FORK_X} ${FORK_Y}; -0.65 ${FORK_X} ${FORK_Y}; 0.65 ${FORK_X} ${FORK_Y}`}
            dur={group === 0 ? "13s" : "9.5s"} repeatCount="indefinite" />
          {CROWN.map((c, i) => {
            if (i % 2 !== group) return null;
            const reach = Math.hypot(c.x - FORK_X, (c.y - FORK_Y) * 0.8) / 76;
            const t = sub(grow, 0.28 + reach * 0.3, 0.42);
            if (t <= 0) return null;
            const g = 0.12 + 0.88 * smooth(t);
            const jitter = ((i * 37) % 5) - 2;
            const w = warm * (c.tone === 0 ? 0.3 : c.tone === 1 ? 0.6 : 1);
            // Wide tone bands, all of them deep: the rest of this
            // panorama sits between 4% and 16% lightness, and a bright
            // green crown in it reads as a sticker.
            const hue = [152, 140, 128][c.tone] - w * 22;
            const sat = [16, 22, 26][c.tone] + crown * 4;
            const lig = [4.5, 9, 14.5][c.tone] + crown * 2.5 + warm * 1.5 + jitter * 0.45;
            return (
              <g key={i} transform={`translate(${FORK_X} ${FORK_Y}) scale(${g.toFixed(3)}) translate(${-FORK_X} ${-FORK_Y})`}>
                <path d={CLUMPS[c.shape]} fill={hsl(hue, sat, lig)} opacity={0.74 + t * 0.26}
                  transform={`translate(${c.x} ${c.y}) scale(${c.s * c.f} ${c.s})`} />
              </g>
            );
          })}
        </g>
      ))}

      {/* the hollow — a black wound until the heart takes */}
      {rise > 0.85 && (
        <>
          <path d={HOLLOW} fill={hsl(200, 12, 3 + heart * 1.5)} />
          {heart > 0 && (
            <g clipPath="url(#heartClip)">
              <ellipse cx="201" cy="130" rx={5 + heart * 2.4} ry={9 + heart * 4} fill="url(#heartCore)"
                opacity={0.4 + heart * 0.36}>
                <animate attributeName="ry" values={`${(9 + heart * 4).toFixed(1)};${(10.4 + heart * 4.5).toFixed(1)};${(9 + heart * 4).toFixed(1)}`}
                  dur="7s" repeatCount="indefinite" />
              </ellipse>
              {SCRIBES.map((sc, i) => {
                const t = sub(heart, 0.1 + i * 0.07, 0.25);
                if (t <= 0) return null;
                return (
                  <g key={i} opacity={t}>
                    <circle cx={sc.x} cy={sc.y} r={sc.r * 2.4} fill={sc.c} opacity="0.14" />
                    <circle cx={sc.x} cy={sc.y} r={sc.r} fill={sc.c} opacity="0.85">
                      <animateTransform attributeName="transform" type="translate"
                        values={`0 0; ${(i % 2 ? 1 : -1) * 1.1} -2.4; 0 0`} dur={`${sc.dur}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })}
            </g>
          )}
          {heart > 0 && <path d={HOLLOW_LIP} fill="#e8b06a" opacity={heart * 0.3} />}
        </>
      )}

      {/* glints among the leaves once the heart is lit */}
      {heart > 0.2 && GLINTS.map(([x, y, dur], i) => {
        const t = sub(heart, 0.2 + (i % 6) * 0.07, 0.25);
        if (t <= 0) return null;
        return (
          <circle key={i} cx={x} cy={y} r={0.55 + (i % 3) * 0.2} fill="#f2e8bc" opacity={t * 0.45}>
            <animate attributeName="opacity" values={`${(t * 0.1).toFixed(3)};${(t * 0.45).toFixed(3)};${(t * 0.1).toFixed(3)}`}
              dur={`${dur}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      {/* what the heart throws on the air around it */}
      {heart > 0 && (
        <ellipse cx="201" cy="130" rx="58" ry="52" fill="url(#heartBleed)" opacity={heart * 0.3} />
      )}
    </g>
  );
});

// ─── THE SCREEN ───────────────────────────────────────────

export default function Outro2() {
  const restart = useGameStore((g) => g.restart);
  const enterWander = useGameStore((g) => g.enterWander);
  const [time, setTime] = useState(0);
  const [showText, setShowText] = useState(false);
  const showTextRef = useRef(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const startRef = useRef(0);

  // Keyboard: space/enter to restart when text is showing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && showTextRef.current) {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [restart]);

  // Start outro ambient audio (Act IV drone). No cleanup — the engine
  // handles transitions to wander/intro on next startAmbient or
  // startIntroDrone call.
  useEffect(() => {
    startAmbient(3, 9);
  }, []);

  // Animation loop. It stops once the panorama has fully assembled:
  // every idle motion in this scene is SMIL, so the frame keeps
  // breathing forever with the React tree completely at rest.
  useEffect(() => {
    const start = performance.now();
    startRef.current = start;
    let frame = 0;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      const elapsed = (now - start) / 1000;
      if (now - lastUpdate > 66) {
        lastUpdate = now;
        setTime(elapsed);
        if (elapsed >= TEXT_AT && !showTextRef.current) {
          showTextRef.current = true;
          setShowText(true);
        }
      }
      if (elapsed < CLOCK_END) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // The Glow's clock: the same 25 seconds, mapped to 0–1. Stable
  // identity so the canvas is never torn down and rebuilt.
  const progressOf = useCallback(() => {
    if (!startRef.current) return 0;
    return Math.min(1, (performance.now() - startRef.current) / 1000 / GLOW_SPAN);
  }, []);

  // Phases
  const horizonDraw = sub(time, 0, 3);
  const dawn = sub(time, 2, 20);
  const treeGrow = sub(time, TREE_START, 5);
  const rootSpread = sub(time, 13, 4);
  const heartTake = sub(time, 13, 4);
  const canopyLight = sub(time, 15, 3);
  const radiance = sub(time, 18, 4);
  const leyFlow = sub(time, 18, 3);

  const qd = q(dawn);

  // Dot opacity per level — each dot fades in as its scene appears in the
  // panorama. Indices 0-7 mirror VIGNETTES (Garden → Sanctum); 8 is Tree;
  // 9 is World.
  const dotOpacity = [
    ...VIGNETTES.map((_, i) => bloomOf(time, i)),
    easeOut(sub(time, TREE_START, 1.5)),
    easeOut(sub(time, 18, 2)),
  ];

  return (
    <div className={s.container}>
      <div className={s.stage}>
        <svg
          viewBox="0 0 400 250"
          className={s.sceneWrap}
          overflow="hidden"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="oSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hsl(252, 30 + qd * 5, 7.5 + qd * 3)} />
              <stop offset="34%" stopColor={hsl(264, 27 + qd * 6, 9.5 + qd * 4)} />
              <stop offset="60%" stopColor={hsl(292 - qd * 16, 21 + qd * 13, 11.5 + qd * 5.5)} />
              <stop offset="80%" stopColor={hsl(346 - qd * 8, 25 + qd * 18, 13 + qd * 7)} />
              <stop offset="93%" stopColor={hsl(24 + qd * 4, 32 + qd * 22, 15 + qd * 9)} />
              <stop offset="100%" stopColor={hsl(32, 36 + qd * 22, 16.5 + qd * 10)} />
            </linearGradient>

            <radialGradient id="oDawn" cx="50%" cy="52%" r="52%">
              <stop offset="0%" stopColor="#f6c27e" stopOpacity={0.1 + qd * 0.24} />
              <stop offset="42%" stopColor="#d98a4e" stopOpacity={0.05 + qd * 0.11} />
              <stop offset="100%" stopColor="#8a4a3a" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="oMoonHalo">
              <stop offset="0%" stopColor="#dfe6f8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#dfe6f8" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="starHalo">
              <stop offset="0%" stopColor="#e6e9ff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#9aa4e8" stopOpacity="0" />
            </radialGradient>

            {VIGNETTES.map((v, i) => (
              <radialGradient key={i} id={`vh${i}`}>
                <stop offset="0%" stopColor={v.color} stopOpacity="0.15" />
                <stop offset="60%" stopColor={v.color} stopOpacity="0.045" />
                <stop offset="100%" stopColor={v.color} stopOpacity="0" />
              </radialGradient>
            ))}

            <radialGradient id="cotGlow">
              <stop offset="0%" stopColor="#f0a83e" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#c07018" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wellGlow">
              <stop offset="0%" stopColor="#6fd8d8" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#2a8a8a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lampGlow">
              <stop offset="0%" stopColor="#ffd68e" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#c98a30" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="libGlow">
              <stop offset="0%" stopColor="#f0c47e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a06a2a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="moonShaft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8ecd8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#e8ecd8" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="heartCore" cx="50%" cy="52%" r="50%">
              <stop offset="0%" stopColor="#ffeec6" stopOpacity="0.85" />
              <stop offset="26%" stopColor="#f3bd6c" stopOpacity="0.6" />
              <stop offset="62%" stopColor="#cf8434" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#6b3a12" stopOpacity="0.08" />
            </radialGradient>
            <radialGradient id="heartBleed">
              <stop offset="0%" stopColor="#eaa858" stopOpacity="0.22" />
              <stop offset="45%" stopColor="#d68f42" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#b8752c" stopOpacity="0" />
            </radialGradient>
            <clipPath id="heartClip"><path d={HOLLOW} /></clipPath>

            {/* Terrain bands. A vertical gradient carries the three
                tones (lit crest → body → base) with a soft edge; an
                offset copy of the ridge gives uniform piping instead. */}
            <linearGradient id="gFar" gradientUnits="userSpaceOnUse" x1="0" y1="118" x2="0" y2="154">
              <stop offset="0%" stopColor={hsl(26, 26 + qd * 14, 15 + qd * 10)} />
              <stop offset="16%" stopColor={hsl(240, 24, 11 + qd * 4)} />
              <stop offset="100%" stopColor={hsl(228, 20, 6.5 + qd * 2.5)} />
            </linearGradient>
            <linearGradient id="gMid" gradientUnits="userSpaceOnUse" x1="0" y1="142" x2="0" y2="184">
              <stop offset="0%" stopColor={hsl(100 - qd * 12, 22 + qd * 10, 16 + qd * 7)} />
              <stop offset="26%" stopColor={hsl(136, 20, 11 + qd * 4)} />
              <stop offset="100%" stopColor={hsl(156, 17, 7 + qd * 2.5)} />
            </linearGradient>
            <linearGradient id="gNear" gradientUnits="userSpaceOnUse" x1="0" y1="158" x2="0" y2="208">
              <stop offset="0%" stopColor={hsl(96 - qd * 8, 22 + qd * 8, 13 + qd * 5)} />
              <stop offset="22%" stopColor={hsl(142, 18, 8.5 + qd * 3)} />
              <stop offset="100%" stopColor={hsl(158, 15, 5.5 + qd * 1.6)} />
            </linearGradient>
            <linearGradient id="gBank" gradientUnits="userSpaceOnUse" x1="0" y1="194" x2="0" y2="250">
              <stop offset="0%" stopColor={hsl(120, 16, 8 + qd * 3)} />
              <stop offset="34%" stopColor={hsl(150, 15, 5 + qd * 1.6)} />
              <stop offset="100%" stopColor={hsl(168, 13, 3 + qd)} />
            </linearGradient>
            <linearGradient id="gGorge" gradientUnits="userSpaceOnUse" x1="0" y1="-8" x2="0" y2="4">
              <stop offset="0%" stopColor={hsl(198, 16, 3)} />
              <stop offset="100%" stopColor={hsl(202, 16, 8)} />
            </linearGradient>
            {/* The trunk is backlit: rim-lit on both flanks, dark through
                the middle, warming as the heart takes. */}
            <linearGradient id="gTrunk" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={hsl(30, 22, 14 + qd * 4)} />
              <stop offset="24%" stopColor={hsl(28, 16, 7)} />
              <stop offset="52%" stopColor={hsl(26, 14, 5)} />
              <stop offset="80%" stopColor={hsl(28, 16, 7.5)} />
              <stop offset="100%" stopColor={hsl(30, 22, 13 + qd * 4)} />
            </linearGradient>
            <linearGradient id="gStone" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0%" stopColor={hsl(210, 10, 34)} />
              <stop offset="38%" stopColor={hsl(212, 9, 21)} />
              <stop offset="100%" stopColor={hsl(216, 12, 8)} />
            </linearGradient>
            <linearGradient id="oDawnBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0925a" stopOpacity="0" />
              <stop offset="70%" stopColor="#f0b070" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#f8c88a" stopOpacity="0.16" />
            </linearGradient>

            <linearGradient id="oScrim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#040807" stopOpacity="0" />
              <stop offset="40%" stopColor="#040807" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#040807" stopOpacity="0.62" />
            </linearGradient>
            {/* A soft column of shade up the middle of the frame. It
                settles the eye on the tree, and it is what the last two
                lines and the planting finale are read against on desktop
                — that block grows upward into the crown once a word is
                planted. */}
            <radialGradient id="oColumn" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#040807" stopOpacity="0.4" />
              <stop offset="55%" stopColor="#040807" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#040807" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="oRadiance" cx="50%" cy="56%" r="56%">
              <stop offset="0%" stopColor="#e8cf94" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#e8cf94" stopOpacity="0" />
            </radialGradient>
          </defs>

          <Sky d={qd} hz={q(horizonDraw)} />
          <Terrain d={qd} hz={q(horizonDraw)} />

          {/* the places, blooming left to right */}
          <Garden p={q(bloomOf(time, 0))} />
          <Cottage p={q(bloomOf(time, 1))} />
          <Stars p={q(bloomOf(time, 2))} />
          <Well p={q(bloomOf(time, 3))} />
          <Library p={q(bloomOf(time, 5))} />
          <Stones p={q(bloomOf(time, 6))} />

          {/* the tree stands behind the near band, in front of the mid */}
          <GreatTree
            grow={q(treeGrow)}
            heart={q(heartTake)}
            crown={q(canopyLight)}
            warm={q(radiance)}
          />

          <Threads spread={q(rootSpread)} flow={q(leyFlow)} />

          {/* near places, in front of the tree's roots */}
          <Bridge p={q(bloomOf(time, 4))} />
          <Sanctum p={q(bloomOf(time, 7))} />

          {/* the whole valley lifts once the threads carry light */}
          {radiance > 0 && (
            <ellipse cx="200" cy="140" rx="220" ry="96" fill="url(#oRadiance)" opacity={q(radiance)} />
          )}

          {/* the near dark, so the last words read on it */}
          <ellipse cx="200" cy="196" rx="190" ry="110" fill="url(#oColumn)" />
          <rect x="0" y="148" width="400" height="102" fill="url(#oScrim)" />
        </svg>

        <GlowSurface manifest={outroManifest} progressOf={progressOf} />
      </div>

      {/* Top dot row — each level's dot fades in as its panorama scene appears. */}
      <div className={s.dotRowTop}>
        {LEVELS.map((l, i) => (
          <div
            key={i}
            className={s.dotTop}
            style={{ background: l.accent, color: l.accent, opacity: dotOpacity[i] * 0.85 }}
          />
        ))}
      </div>

      {/* Text overlay — CSS-staggered fade-ins, no Framer Motion. */}
      {showText && (
        <div className={`${s.textOverlay} ${s.textOverlayFade}`}>
          <p className={`${s.body} ${s.bodyFade}`}>The forest remembers.</p>
          {isV2Enabled() && (
            // Inkwood 2: the answer to the last incantation the player typed
            // ("the forest remembers"). Arrives a breath after the first line.
            <p className={`${s.body} ${s.bodyFade}`} style={{ animationDelay: "2.2s", marginTop: "-0.6rem" }}>
              It remembers you.
            </p>
          )}
          {/* The planting finale: "Leave one word for the next scribe."
              Owned by PlantWord.tsx; keep this mount here, after the two
              lines and before the buttons. */}
          <PlantWord />

          <button
            className={`${s.restartBtn} ${s.restartBtnFade}`}
            onClick={restart}
          >
            Begin Again
          </button>

          <button
            className={`${s.wanderBtn} ${s.wanderBtnFade}`}
            onClick={enterWander}
            aria-label="Replay any level — pick a scene to revisit"
          >
            Replay any level
          </button>

          <button
            className={`${s.shareLink} ${s.shareLinkFade}`}
            onClick={async () => {
              const result = await shareInkwood();
              if (result === "copied" || result === "fallback") {
                setShareLabel("Link copied");
                setTimeout(() => setShareLabel("Share"), 1800);
              }
            }}
            aria-label="Share Inkwood"
          >
            {shareLabel}
          </button>
        </div>
      )}
    </div>
  );
}
