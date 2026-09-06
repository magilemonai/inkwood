import { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../../store";
import { startIntroDrone, stopIntroDrone } from "../../audio";
import { useInput } from "../../contexts/InputContext";
import { switchEdition } from "../../v2";
import { shareInkwood } from "../../share";
import GlowSurface from "../GlowSurface";
import type { SceneManifest, RGB } from "../../scenes/manifest";
import s from "../../styles/Intro2.module.css";

/**
 * The Intro — Inkwood 2 redraw.
 *
 * Behaviour is unchanged from the shipped intro: the title and Begin are
 * there from the first frame, and three dormant vignettes (garden →
 * cottage → sky) crossfade behind them on a 24-second loop until the
 * player taps Begin.
 *
 * What's new is the art. The three vignettes are redrawn in the v2 scene
 * language — receding planes in three tones, hand-drawn bezier forms,
 * SMIL idle life, and the Glow mounted over the SVG with its own manifest
 * whose lights follow the cycle (a cold window in the cottage phase, a
 * moon halo in the sky phase, a low warm dawn band always). One new line
 * under the wordmark speaks in the previous scribe's voice.
 *
 * Defended, untouched: the ogham rune logo and the "Inkwood" wordmark;
 * the bordered Begin button; the dormant trees drawn as a filled trunk
 * with STROKED branches and delicate twigs (the filled-silhouette
 * redesign was rejected in v15).
 *
 * Composition note — on desktop the SVG is sliced full-bleed and the
 * title block sits over viewBox x≈165–235, y≈88–165. Every structural
 * read is therefore placed in the left third, the right third, the top
 * band or the bottom band. On portrait the SVG letterboxes at 8:5 and the
 * whole viewBox is visible with the title block below it.
 */

// ─── HELPERS ───────────────────────────────────────────────

type HSL = [number, number, number];

const css = (c: HSL) =>
  `hsl(${(((c[0] % 360) + 360) % 360).toFixed(1)}, ${c[1].toFixed(1)}%, ${c[2].toFixed(1)}%)`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A tapered, bending grass blade — a closed path, never a stroked line. */
function blade(x: number, y: number, h: number, bend: number, w: number): string {
  const tx = x + bend;
  const ty = y - h;
  return `M${x - w} ${y} C${x - w * 0.5} ${y - h * 0.45}, ${tx - w * 0.7} ${y - h * 0.8}, ${tx} ${ty} C${tx + w * 0.28} ${y - h * 0.76}, ${x + w * 0.8} ${y - h * 0.4}, ${x + w} ${y} Z`;
}

/** A latent bud — a tiny closed teardrop at a twig tip. Not a circle:
 *  buds are organic and the house rule keeps primitives off organic
 *  forms, however small. */
function bud(x: number, y: number, r = 0.95): string {
  return `M${x} ${y - r * 1.7} C${x + r} ${y - r * 0.9}, ${x + r * 0.85} ${y + r * 0.5}, ${x} ${y + r} C${x - r * 0.85} ${y + r * 0.5}, ${x - r} ${y - r * 0.9}, ${x} ${y - r * 1.7} Z`;
}

// ─── THE CYCLE ─────────────────────────────────────────────
// Three phases at 8 s each, crossfading with 1.2 s overlap, looping
// forever via modulo time. The Glow manifest reads the same weights, so
// its light is always on the vignette that's actually showing.

const CYCLE_LEN = 24;
const FADE = 1.2;
const LOOP_PHASES = [
  { start: 0, end: 9 },   // dormant garden
  { start: 8, end: 17 },  // dark cottage
  { start: 16, end: 25 }, // night sky (extends past CYCLE_LEN; wrap handled below)
];

function segmentOpacity(t: number, start: number, end: number) {
  if (t < start) return 0;
  if (t < start + FADE) return (t - start) / FADE;
  if (t < end - FADE) return 1;
  if (t < end) return (end - t) / FADE;
  return 0;
}

/** Loop-aware phase weight — sample at t, t ± CYCLE_LEN so the phase that
 *  straddles the wrap point still crossfades cleanly. */
function phaseWeight(idx: number, t: number) {
  const { start, end } = LOOP_PHASES[idx];
  return Math.max(
    segmentOpacity(t, start, end),
    segmentOpacity(t + CYCLE_LEN, start, end),
    segmentOpacity(t - CYCLE_LEN, start, end),
  );
}

/** The firefly's drift, as waypoints on the same 24 s clock the SMIL
 *  animation uses — so the mote and its light in the Glow are the same
 *  object rather than two things that nearly agree. */
const MOTE_PATH: [number, number][] = [
  [64, 150], [96, 132], [128, 145], [162, 122], [196, 138],
  [232, 118], [268, 134], [304, 116], [338, 130], [64, 150],
];
const MOTE_X = MOTE_PATH.map((m) => m[0]).join(";");
const MOTE_Y = MOTE_PATH.map((m) => m[1]).join(";");

/** Where the mote is at cycle progress p (0–1). The last waypoint repeats
 *  the first, and the final leg is the jump home — which is exactly where
 *  the SMIL opacity track has faded the mote out. */
function moteAt(p: number): [number, number] {
  const legs = MOTE_PATH.length - 1;
  const f = Math.min(0.9999, Math.max(0, p)) * legs;
  const i = Math.floor(f);
  const t = f - i;
  const a = MOTE_PATH[i];
  const b = MOTE_PATH[i + 1];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

/** Mote brightness over the cycle — matches the SMIL opacity keyframes so
 *  the light doesn't linger after the mote has gone. */
function moteAlpha(p: number): number {
  const stops = [0, 0.85, 0.7, 0.9, 0.6, 0.85, 0.75, 0.9, 0.5, 0];
  const f = Math.min(0.9999, Math.max(0, p)) * (stops.length - 1);
  const i = Math.floor(f);
  return lerp(stops[i], stops[i + 1], f - i);
}

// ─── THE GLOW MANIFEST ─────────────────────────────────────
// Tuning law (scenes/manifest.ts): whole-frame lights ≤0.05, local halos
// 0.3–0.4 at radius 35–50, haze ≤0.03. The intro is a title card people
// sit on, so it runs at the quiet end of all three.

const DAWN: RGB = [1.0, 0.62, 0.34];
const FIREFLY: RGB = [1.0, 0.80, 0.44];
const MOONLIGHT: RGB = [0.78, 0.83, 1.0];
const COLD_WINDOW: RGB = [0.46, 0.58, 1.0];

const INTRO_MANIFEST: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const t = p * CYCLE_LEN;
    const g = phaseWeight(0, t);
    const c = phaseWeight(1, t);
    const sky = phaseWeight(2, t);
    const [mx, my] = moteAt(p);
    const ma = moteAlpha(p);
    return [
      // Always: the dawn this world is waiting for, banked low and flat
      // behind the horizon. The one light that touches the whole frame.
      { x: 200, y: 220, radius: 210, intensity: 0.038, color: DAWN, flicker: 0, yScale: 3.4 },
      // The firefly — a tiny warm source travelling with its own mote.
      { x: mx, y: my, radius: 7, intensity: 0.30 * ma, color: FIREFLY, flicker: 0.10, core: 0.75 },
      // Garden phase: the sun still under the ridge, right of frame.
      { x: 302, y: 156, radius: 74, intensity: 0.075 * g, color: DAWN, flicker: 0, yScale: 1.7 },
      // Cottage phase: cold moonlight at the window, and its pool on the
      // boards. Nothing in the room is lit yet — that's the whole point.
      { x: 88, y: 84, radius: 48, intensity: 0.20 * c, color: COLD_WINDOW, flicker: 0 },
      { x: 104, y: 216, radius: 46, intensity: 0.065 * c, color: COLD_WINDOW, flicker: 0, yScale: 3 },
      // Sky phase: the moon, low over the treeline.
      { x: 330, y: 126, radius: 44, intensity: 0.26 * sky, color: MOONLIGHT, flicker: 0, core: 0.35 },
    ];
  },
  haze: (p) => {
    const t = p * CYCLE_LEN;
    const g = phaseWeight(0, t);
    const c = phaseWeight(1, t);
    const sky = phaseWeight(2, t);
    const tot = g + c + sky || 1;
    return {
      top: (140 * g + 98 * c + 122 * sky) / tot,
      bottom: (206 * g + 216 * c + 204 * sky) / tot,
      density: (0.028 * g + 0.020 * c + 0.030 * sky) / tot,
      color: [
        (0.74 * g + 0.50 * c + 0.52 * sky) / tot,
        (0.60 * g + 0.58 * c + 0.60 * sky) / tot,
        (0.50 * g + 0.86 * c + 0.94 * sky) / tot,
      ],
    };
  },
  motes: () => ({
    x: 55, y: 55, width: 290, height: 140,
    count: 16, size: 0.9, color: [0.90, 0.86, 0.74], speed: 0.7, alpha: 0.5,
  }),
};

// ─── VIGNETTE 1: THE DORMANT GARDEN ────────────────────────
// The v2 Garden at dormancy: five receding planes under a pre-dawn sky,
// the near tree bare with its buds still shut.

/** Faint stars over the garden — the night this dawn will replace. */
const GARDEN_STARS: [number, number, number, number][] = [
  // x, y, r, twinkle seconds (0 = steady)
  [26, 34, 0.9, 4.6], [58, 20, 1.1, 0], [96, 46, 0.8, 0], [134, 26, 1.0, 5.8],
  [172, 52, 0.8, 0], [206, 22, 1.0, 0], [244, 44, 0.9, 4.2], [278, 18, 1.1, 0],
  [312, 40, 0.8, 0], [346, 24, 1.0, 6.4], [380, 48, 0.9, 0], [72, 68, 0.7, 0],
  [152, 74, 0.7, 5.2], [268, 70, 0.7, 0], [354, 76, 0.8, 0], [12, 58, 0.8, 0],
];

/** The distant broadleaf treeline, lifted from the v2 Garden so the two
 *  read as the same place. Its base tucks under the far hill. */
const TREELINE = `
  M-10 150 C-2 149, 2 140, 10 141 C17 142, 20 147, 26 146
  C32 145, 36 134, 46 136 C54 138, 58 146, 64 145
  C70 144, 73 137, 80 138 C86 139, 90 145, 96 144
  C102 143, 105 131, 115 133 C124 135, 128 144, 135 143
  C141 142, 144 136, 151 137 C157 138, 161 145, 167 144
  C173 143, 176 133, 186 135 C195 137, 199 145, 206 144
  C212 143, 215 138, 222 139 C228 140, 232 146, 238 145
  C244 144, 247 132, 257 134 C266 136, 270 145, 277 144
  C283 143, 286 137, 293 138 C299 139, 303 145, 309 144
  C315 143, 318 134, 328 136 C337 138, 341 145, 348 144
  C354 143, 357 138, 364 139 C370 140, 374 146, 380 145
  C386 144, 389 135, 398 137 C405 138, 408 144, 410 144
  L410 178 L-10 178 Z`;

const CREST_FAR =
  "M-10 150 C18 146, 40 141, 68 143 C92 145, 112 139, 140 138 C164 137, 186 142, 214 141 C238 140, 260 136, 288 138 C312 140, 334 145, 362 143 C382 142, 396 145, 410 144";
const CREST_MID =
  "M-10 163 C14 160, 38 154, 66 156 C88 158, 106 152, 134 151 C156 150, 176 155, 204 154 C228 153, 250 149, 278 151 C302 153, 324 157, 352 155 C374 154, 392 157, 410 156";
const CREST_NEAR =
  "M-10 177 C20 175, 48 168, 80 170 C106 172, 126 166, 158 167 C184 168, 206 164, 236 166 C262 168, 284 163, 314 165 C340 167, 364 171, 392 169 C402 168, 406 170, 410 170";
const CREST_EARTH =
  "M-10 206 C24 203, 56 198, 92 200 C120 202, 144 197, 178 199 C208 201, 232 196, 266 198 C296 200, 322 204, 358 202 C380 201, 398 204, 410 203";

const fillTo = (crest: string) => `${crest} L410 254 L-10 254 Z`;

/** Near tree: one filled, buttressed trunk that keeps rising past the
 *  crotches. Everything above the trunk is STROKED — that division is the
 *  director's ruling, and the limbs leave at three different heights so
 *  the crown never radiates from a single point. */
/** The flare is concentrated in the bottom twenty units and the shaft
 *  above it runs nearly parallel — a trunk that widens all the way from
 *  the crotch to the ground reads as a teepee, which is what the first
 *  pass drew. */
const NEAR_TRUNK = `
  M87 218
  C89 213, 92 209, 93 205
  C94 200, 95 194, 96 187
  C97 176, 98 165, 99 154
  C99.4 145, 99.7 136, 99.9 128
  C100 124, 100 121, 100 118
  L106 118
  C106.1 121, 106.2 124, 106.3 128
  C106.6 136, 107 145, 107.6 154
  C108.4 165, 109.4 176, 110.4 187
  C111.2 194, 112 200, 113 205
  C114.5 209, 117 213, 120 218
  C112 221, 95 221, 87 218 Z`;
const NEAR_ROOTS = [
  "M89 217 C83 216, 77 218, 71 220 C78 221, 84 221, 91 220 Z",
  "M117 217 C123 216, 130 218, 137 221 C129 222, 123 221, 116 220 Z",
  "M101 220 C100 223, 100 225, 101 227 C104 225, 105 222, 104 220 Z",
];
const NEAR_BARK = [
  "M94 208 C95 196, 96 184, 97 172 C97.6 162, 98.2 152, 98.6 143 C98.8 136, 99 130, 99.2 124",
  "M111 210 C110 198, 109 186, 108 174 C107.4 164, 107 154, 106.7 145 C106.5 138, 106.3 131, 106.2 124",
  "M115 214 C114 206, 113 198, 112 190",
  "M92 213 C93 205, 94 197, 95 189",
];

/** [d, strokeWidth] — limbs leave at y≈153, y≈121 and the leader carries
 *  on to y≈66, each with its own sub-branches. */
const NEAR_BRANCHES: [string, number][] = [
  // left limb, off the trunk low
  ["M98 154 C92 147, 84 139, 75 131 C68 125, 61 120, 54 116", 3.4],
  // right limb, off the trunk higher up
  ["M106 122 C112 114, 120 106, 130 99 C137 94, 144 90, 151 87", 3.2],
  // the leader — the trunk carrying on
  ["M103 119 C103 110, 103 100, 102 90 C101 82, 100 74, 99 66", 3.0],
  ["M75 131 C69 128, 61 125, 52 123", 2.2],
  ["M130 99 C136 97, 144 96, 152 96", 2.1],
  ["M54 116 C50 111, 47 106, 44 100", 1.8],
  ["M84 139 C81 132, 79 125, 77 118", 1.7],
  ["M102 90 C98 84, 93 79, 87 75", 1.9],
  ["M102 90 C107 85, 112 81, 118 78", 1.6],
  ["M151 87 C156 82, 160 77, 164 71", 1.7],
  ["M120 106 C122 99, 124 93, 126 86", 1.6],
  ["M99 66 C96 60, 94 55, 93 49", 1.5],
  ["M99 66 C103 61, 107 56, 112 52", 1.5],
];
const NEAR_TWIGS: [string, number][] = [
  ["M54 116 C50 114, 46 113, 42 113", 1.0],
  ["M44 100 C42 96, 41 93, 40 89", 0.9],
  ["M44 100 C47 96, 50 93, 53 90", 0.9],
  ["M52 123 C48 123, 44 124, 40 125", 0.9],
  ["M77 118 C75 114, 74 111, 73 107", 0.9],
  ["M77 118 C80 115, 83 113, 86 111", 0.8],
  ["M87 75 C84 72, 81 70, 78 68", 0.9],
  ["M87 75 C86 71, 86 68, 86 64", 0.8],
  ["M93 49 C92 45, 91 42, 90 38", 0.9],
  ["M93 49 C96 46, 98 43, 100 40", 0.8],
  ["M112 52 C115 49, 118 47, 121 45", 0.9],
  ["M112 52 C112 48, 112 45, 112 41", 0.8],
  ["M118 78 C121 76, 124 74, 128 73", 0.8],
  ["M164 71 C167 68, 170 66, 173 64", 0.9],
  ["M164 71 C163 67, 163 64, 163 60", 0.8],
  ["M152 96 C156 96, 160 96, 164 97", 0.9],
  ["M126 86 C124 82, 123 79, 122 75", 0.8],
  ["M126 86 C129 83, 132 81, 135 79", 0.8],
  ["M151 87 C154 90, 157 92, 160 94", 0.8],
];
const NEAR_BUDS: [number, number][] = [
  [42, 113], [40, 89], [53, 90], [40, 125], [73, 107], [86, 111], [78, 68],
  [86, 64], [90, 38], [100, 40], [121, 45], [112, 41], [128, 73], [173, 64],
  [163, 60], [164, 97], [122, 75], [135, 79], [160, 94],
];

/** Far tree, right of frame — same idiom, thinner, lower contrast. */
const FAR_TRUNK = `
  M325 201
  C326 196, 327 190, 328 182
  C328.6 173, 329.2 164, 329.6 155
  C329.8 150, 330 145, 330 141
  L336 141
  C336.2 145, 336.4 150, 336.6 155
  C337 164, 337.6 173, 338.4 182
  C339 190, 340.4 196, 342 201
  C337 203, 330 203, 325 201 Z`;
const FAR_BRANCHES: [string, number][] = [
  ["M330 144 C326 138, 321 132, 315 126 C311 122, 307 119, 303 116", 2.1],
  ["M336 143 C340 137, 345 131, 351 126 C355 122, 359 119, 363 117", 2.1],
  ["M333 141 C333 134, 333 127, 332 121", 1.7],
  ["M315 126 C311 124, 306 122, 301 121", 1.2],
  ["M351 126 C355 124, 360 123, 365 123", 1.2],
  ["M332 121 C330 117, 328 114, 326 111", 1.0],
  ["M332 121 C335 118, 337 115, 340 112", 1.0],
];
const FAR_TWIGS: [string, number][] = [
  ["M303 116 C300 114, 297 113, 294 113", 0.7],
  ["M363 117 C366 115, 369 114, 372 114", 0.7],
  ["M301 121 C298 121, 296 122, 293 123", 0.7],
  ["M326 111 C325 108, 324 106, 323 104", 0.7],
  ["M340 112 C342 110, 344 108, 346 106", 0.7],
];

/** Dead stems in the bed — clustered near the trees rather than spread
 *  evenly across the frame, which is what made the first pass read as a
 *  row of toothpicks. */
const STEMS: [number, number, number, number][] = [
  // x, ground y, height, bend
  [145, 214, 17, -4], [153, 217, 12, 3], [162, 213, 20, 4],
  [286, 211, 15, 4], [294, 214, 11, -3], [303, 210, 18, -4],
];

/** A small stand of trees, drawn once and set down at several scales: the
 *  hill bands were three empty stripes without them. Grows upward from a
 *  base at the origin. */
const STAND =
  "M-6 0 C-9.4 -0.8, -10.6 -4.6, -7.6 -6.8 C-8.8 -10.8, -3.6 -13.4, -0.4 -11.2 C2.8 -13.8, 8.4 -11.4, 7.4 -7.2 C10.6 -5.2, 9.6 -0.8, 6 0 Z";

/** [x, baseY, scale] — stands on the far and mid hills, then low scrub in
 *  the near bed. */
const FAR_STANDS: [number, number, number][] = [
  [60, 151, 0.85], [72, 152, 0.55], [246, 147, 1.0], [259, 148, 0.7],
  [188, 157, 0.75], [344, 161, 1.05], [356, 162, 0.75], [24, 165, 0.8],
];
const SCRUB: [number, number, number][] = [
  [44, 214, 1.3], [58, 217, 0.9], [204, 211, 1.0], [216, 213, 0.7],
  [262, 216, 1.45], [350, 213, 1.1], [364, 215, 0.8], [130, 219, 0.85],
];

/** Foreground grass — closed tapered blades, swaying on the SMIL clock. */
const GRASS: [number, number, number, number, number][] = [
  // x, y, height, bend, width
  [22, 234, 15, 4, 1.5], [30, 236, 11, -3, 1.3], [38, 233, 17, 3, 1.6],
  [64, 238, 13, -4, 1.4], [72, 235, 18, 4, 1.6], [80, 239, 10, 2, 1.2],
  [148, 236, 14, -4, 1.4], [156, 233, 19, 3, 1.6], [164, 238, 11, -2, 1.3],
  [236, 235, 16, 4, 1.5], [244, 238, 12, -3, 1.3], [252, 234, 18, 3, 1.6],
  [318, 237, 13, -4, 1.4], [326, 234, 17, 4, 1.6], [334, 239, 10, 2, 1.2],
  [372, 236, 15, -3, 1.5], [380, 233, 19, 3, 1.6],
];

/** Cirrus — long tapering slivers. Anything thicker than a couple of
 *  units at this scale reads as a lozenge sitting on the sky, which is
 *  exactly what the first pass here did. */
const CIRRUS: [string, number][] = [
  ["M248 63 C270 60.4, 296 59.6, 320 60.4 C336 61, 350 61.6, 358 62.6 C346 63.2, 326 62.8, 306 62.8 C282 62.8, 262 63.6, 248 63 Z", 0.10],
  ["M274 71 C290 69.4, 310 69, 326 69.6 C336 70, 344 70.4, 348 71 C338 71.4, 324 71.4, 310 71.4 C296 71.4, 282 71.4, 274 71 Z", 0.07],
];

function DormantGarden({ opacity, still }: { opacity: number; still: boolean }) {
  if (opacity <= 0) return null;

  // Pre-dawn, held at the lightness floor: the sky's zenith is the
  // darkest large value in the frame and it still sits at 13% L. The
  // intro has been "too dark" three times; this is the fix holding.
  //
  // The tree, though, must be DARKER than the sky or it stops being a
  // silhouette. Warm wood against a cool pre-dawn sky reads far lighter
  // than its numbers suggest (the v2 Garden learned this the hard way),
  // so the trunk and limbs sit at 8–14% L and let the lit rim do the
  // turning.
  const branchDark = css([26, 10, 9]);
  const branchMid = css([26, 10, 11]);
  const branchLit = css([32, 16, 17]);
  const farBranch = css([226, 12, 13]);

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id="igSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={css([233, 30, 14.5])} />
          <stop offset="34%" stopColor={css([242, 26, 17.5])} />
          <stop offset="58%" stopColor={css([256, 22, 20.5])} />
          <stop offset="80%" stopColor={css([294, 20, 23.5])} />
          <stop offset="100%" stopColor={css([330, 24, 25.5])} />
        </linearGradient>
        {/* The sun still under the ridge — a squashed bloom, not a disc. */}
        <radialGradient id="igPreDawn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2a866" stopOpacity="0.26" />
          <stop offset="46%" stopColor="#c9744e" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#8a4a52" stopOpacity="0" />
        </radialGradient>
        {/* Hills: a warm crest melting into the cool body of each band, so
            the rim is air rather than a drawn contour line. The three
            bands step down 20 → 15 → 11% L so the depth reads. */}
        <linearGradient id="igFar" gradientUnits="userSpaceOnUse" x1="0" y1="136" x2="0" y2="178">
          <stop offset="0%" stopColor={css([32, 18, 26])} />
          <stop offset="26%" stopColor={css([208, 15, 20])} />
          <stop offset="100%" stopColor={css([202, 14, 16])} />
        </linearGradient>
        <linearGradient id="igMid" gradientUnits="userSpaceOnUse" x1="0" y1="149" x2="0" y2="194">
          <stop offset="0%" stopColor={css([26, 15, 20])} />
          <stop offset="24%" stopColor={css([198, 14, 15])} />
          <stop offset="100%" stopColor={css([194, 14, 11])} />
        </linearGradient>
        <linearGradient id="igNear" gradientUnits="userSpaceOnUse" x1="0" y1="163" x2="0" y2="212">
          <stop offset="0%" stopColor={css([24, 13, 16])} />
          <stop offset="22%" stopColor={css([190, 14, 11.5])} />
          <stop offset="100%" stopColor={css([186, 14, 9])} />
        </linearGradient>
        <linearGradient id="igEarth" gradientUnits="userSpaceOnUse" x1="0" y1="196" x2="0" y2="250">
          <stop offset="0%" stopColor={css([30, 18, 16.5])} />
          <stop offset="100%" stopColor={css([26, 15, 11.5])} />
        </linearGradient>
        {/* Valley mist, banked along the crest rather than ruled across
            it — the flat band in the first pass read as a grey stripe. */}
        <linearGradient id="igMist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93a6bc" stopOpacity="0" />
          <stop offset="50%" stopColor="#93a6bc" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#93a6bc" stopOpacity="0" />
        </linearGradient>
        {/* Ground mist behind the near tree, so its dark base separates
            from the dark earth instead of melting into it. */}
        <linearGradient id="igGroundMist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8b4c4" stopOpacity="0" />
          <stop offset="45%" stopColor="#a8b4c4" stopOpacity="0.065" />
          <stop offset="100%" stopColor="#a8b4c4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="igTrunk" gradientUnits="userSpaceOnUse" x1="83" y1="0" x2="124" y2="0">
          <stop offset="0%" stopColor={css([24, 10, 6])} />
          <stop offset="52%" stopColor={css([26, 11, 8])} />
          <stop offset="88%" stopColor={css([32, 20, 15])} />
          <stop offset="100%" stopColor={css([26, 12, 8])} />
        </linearGradient>
      </defs>

      <rect width="400" height="250" fill="url(#igSky)" />

      {/* Stars, a third of them breathing */}
      <g opacity="0.55">
        {GARDEN_STARS.map(([x, y, r, tw], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#d6dcff" opacity={0.5 + (i % 3) * 0.16}>
            {tw > 0 && !still && (
              <animate attributeName="opacity" values="0.28;0.85;0.42;0.75;0.28"
                dur={`${tw}s`} repeatCount="indefinite" />
            )}
          </circle>
        ))}
      </g>

      {/* Cirrus, drifting */}
      <g>
        {CIRRUS.map(([d, op], i) => (
          <path key={i} d={d} fill="#c9b4c8" opacity={op}>
            {!still && (
              <animateTransform attributeName="transform" type="translate"
                values="0 0; 14 -1; 0 0" dur={`${74 + i * 13}s`} repeatCount="indefinite" />
            )}
          </path>
        ))}
      </g>

      {/* The sun still under the ridge, right of frame */}
      <ellipse cx="302" cy="156" rx="118" ry="46" fill="url(#igPreDawn)" />

      {/* PLANE 1 — distant treeline */}
      <path d={TREELINE} fill={css([214, 16, 17])} />
      {/* PLANE 2–4 — three receding hills, mist banked between them */}
      <path d={fillTo(CREST_FAR)} fill="url(#igFar)" />
      <path d={`${CREST_MID} L410 148 L-10 148 Z`} fill="url(#igMist)" transform="translate(0 -6)" />
      <path d={fillTo(CREST_MID)} fill="url(#igMid)" />
      <path d={fillTo(CREST_NEAR)} fill="url(#igNear)" />
      {/* Stands of trees on the far and mid hills — what turns three
          horizontal bands back into three distances */}
      <g>
        {FAR_STANDS.map(([x, y, sc], i) => (
          <path key={`fs${i}`} d={STAND}
            transform={`translate(${x} ${y}) scale(${sc})`}
            fill={css([200, 14, y < 155 ? 13 : 10])} opacity={0.9} />
        ))}
      </g>

      {/* PLANE 5 — the near bed */}
      <path d={fillTo(CREST_EARTH)} fill="url(#igEarth)" />

      {/* Low scrub in the bed */}
      <g fill={css([140, 14, 8])}>
        {SCRUB.map(([x, y, sc], i) => (
          <path key={`sc${i}`} d={STAND} transform={`translate(${x} ${y}) scale(${sc})`}
            opacity={0.85 + (i % 3) * 0.05} />
        ))}
      </g>

      {/* ── FAR TREE (right third) — filled trunk, stroked branches ── */}
      <g strokeLinecap="round" fill="none">
        <path d={FAR_TRUNK} fill={css([226, 12, 11])} stroke="none" />
        {FAR_BRANCHES.map(([d, w], i) => (
          <path key={`fb${i}`} d={d} stroke={farBranch} strokeWidth={w} />
        ))}
        {FAR_TWIGS.map(([d, w], i) => (
          <path key={`ft${i}`} d={d} stroke={css([226, 11, 14])} strokeWidth={w} />
        ))}
      </g>

      {/* Ground mist behind the near tree's base */}
      <path d="M-10 198 C40 193, 90 202, 140 196 C190 190, 240 200, 290 195 C330 191, 370 198, 410 194 L410 224 L-10 224 Z"
        fill="url(#igGroundMist)" />

      {/* ── NEAR TREE (left third) — filled buttressed trunk, STROKED
           branches with delicate twigs, buds still shut ── */}
      <g>
        {NEAR_ROOTS.map((d, i) => (
          <path key={`nr${i}`} d={d} fill={css([24, 10, 7])} />
        ))}
        <path d={NEAR_TRUNK} fill="url(#igTrunk)" />
        <g fill="none" strokeLinecap="round">
          {NEAR_BARK.map((d, i) => (
            <path key={`nk${i}`} d={d} stroke={css([22, 10, 4])} strokeWidth={i > 1 ? 0.8 : 1.1} opacity="0.7" />
          ))}
          {/* Limbs: a dark pass, then a hair-thin lit pass on the dawn
              side, so a stroked branch still turns in the light. */}
          {NEAR_BRANCHES.map(([d, w], i) => (
            <path key={`nb${i}`} d={d} stroke={branchDark} strokeWidth={w} />
          ))}
          {NEAR_BRANCHES.map(([d, w], i) => (
            <path key={`nbl${i}`} d={d} stroke={branchLit} strokeWidth={Math.min(1, w * 0.26)}
              transform="translate(0.8 -0.4)" opacity="0.5" />
          ))}
          {NEAR_TWIGS.map(([d, w], i) => (
            <path key={`nt${i}`} d={d} stroke={branchMid} strokeWidth={w} />
          ))}
        </g>
        <g fill={css([64, 20, 20])}>
          {NEAR_BUDS.map(([x, y], i) => (
            <path key={`bd${i}`} d={bud(x, y, 0.85)} opacity={0.55 + (i % 3) * 0.12}>
              {!still && i % 4 === 0 && (
                <animate attributeName="opacity" values="0.45;0.78;0.45"
                  dur={`${7 + (i % 3) * 2}s`} repeatCount="indefinite" />
              )}
            </path>
          ))}
        </g>
      </g>

      {/* Dead stems with shut buds, swaying */}
      <g>
        {STEMS.map(([x, y, h, bend], i) => (
          <g key={`st${i}`}>
            {!still && (
              <animateTransform attributeName="transform" type="rotate"
                values={`0 ${x} ${y}; ${i % 2 ? 1.1 : -1.1} ${x} ${y}; 0 ${x} ${y}`}
                dur={`${8 + (i % 4)}s`} repeatCount="indefinite" />
            )}
            <path
              d={`M${x} ${y} C${x + bend * 0.4} ${y - h * 0.4}, ${x + bend} ${y - h * 0.75}, ${x + bend * 1.1} ${y - h}`}
              fill="none" stroke={css([30, 13, 13])} strokeWidth="1.2" strokeLinecap="round"
            />
            <path d={bud(x + bend * 1.1, y - h - 1, 1.2)} fill={css([32, 15, 16])} />
          </g>
        ))}
      </g>

      {/* Foreground grass */}
      <g fill={css([118, 14, 11])}>
        {GRASS.map(([x, y, h, bend, w], i) => (
          <path key={`gr${i}`} d={blade(x, y, h, bend, w)}>
            {!still && (
              <animateTransform attributeName="transform" type="rotate"
                values={`0 ${x} ${y}; ${i % 2 ? 2 : -2} ${x} ${y}; 0 ${x} ${y}`}
                dur={`${6.5 + (i % 5) * 0.9}s`} repeatCount="indefinite" />
            )}
          </path>
        ))}
      </g>
    </g>
  );
}

// ─── VIGNETTE 2: THE DARK COTTAGE ──────────────────────────
// The v2 Cottage at p=0. Cold blue, the window dark, the candles unlit,
// the journal closed on the shelf, and no cat — she arrives when the room
// warms. The window sits left and the shelf right and low, so the centre
// column stays plain wall behind the title.

const COT_WINDOW_FRAME = `
  M32 30 C32 27, 34 25, 38 25 L138 25 C142 25, 144 27, 144 30
  L144 138 C144 141, 142 143, 138 143 L38 143 C34 143, 32 141, 32 138 Z`;
const COT_WINDOW_SILL = `
  M26 138 C26 136, 28 134, 32 134 L144 134 C148 134, 150 136, 150 138
  L150 147 C150 149, 148 151, 144 151 L32 151 C28 151, 26 149, 26 147 Z`;
/** The moonlight falling through the window onto the boards. Two soft
 *  quads with feathered corners — the first pass drew one hard-edged
 *  parallelogram and it read as a paper cutout, not as light. */
const COT_MOON_POOL =
  "M50 196 C60 195, 122 195, 132 196 C146 214, 164 236, 176 250 L18 250 C30 234, 42 212, 50 196 Z";
const COT_MOON_POOL_HOT =
  "M60 198 C68 197, 114 197, 122 198 C132 212, 144 232, 152 250 L44 250 C52 232, 54 212, 60 198 Z";

const COT_SHELF =
  "M208 170 C258 168, 322 167, 386 169 L386 175 C322 173, 258 174, 208 176 Z";
const COT_BRACKET_L = "M222 176 L222 192 Q222 194 224 194 L230 194 L222 176 Z";
const COT_BRACKET_R = "M372 175 L372 191 Q372 193 370 193 L364 193 L372 175 Z";

/** The journal, closed and lying flat on the shelf: a low slab of cover
 *  with a pale block of page edges. */
const COT_BOOK_COVER =
  "M240 169.5 L240.6 162 Q256 160.4 272 162 L272.6 169.5 Q256 171 240 169.5 Z";
const COT_BOOK_PAGES =
  "M242.4 168.6 L243 163.6 Q256 162.3 269.4 163.6 L270 168.6 Q256 169.9 242.4 168.6 Z";
const COT_BOOK_BAND = "M254 161 L254 170.4 L258 170.4 L258 161 Z";

/** Unlit candles: tapered wax bodies with a drip or two. No rectangles. */
const CANDLES: [number, number][] = [
  // x centre, height above the shelf
  [296, 32], [330, 40], [364, 27],
];
function candleBody(x: number, h: number): string {
  const top = 169 - h;
  const w = 4.4;
  return `M${x - w} 170
    C${x - w - 0.5} ${170 - h * 0.4}, ${x - w + 0.4} ${170 - h * 0.75}, ${x - w * 0.72} ${top + 1.6}
    C${x - w * 0.6} ${top}, ${x + w * 0.6} ${top}, ${x + w * 0.72} ${top + 1.6}
    C${x + w - 0.4} ${170 - h * 0.75}, ${x + w + 0.5} ${170 - h * 0.4}, ${x + w} 170 Z`;
}
function candleDrip(x: number, h: number): string {
  const top = 169 - h;
  return `M${x - 3.8} ${top + 4} C${x - 5.1} ${top + 9}, ${x - 4.4} ${top + 14}, ${x - 3.2} ${top + 15}
    C${x - 2.4} ${top + 12}, ${x - 2.6} ${top + 7}, ${x - 3.8} ${top + 4} Z`;
}

/** The un-faded patch of wall where something used to hang, and the nail
 *  it hung from. The previous scribe took it with them. Drawn slightly
 *  out of true — a ruled rectangle would read as a rendering artefact
 *  rather than as sun-bleaching around an absent frame. (This replaces a
 *  bundle of hanging herbs, which read as a jellyfish on desktop and a
 *  green smudge at 390px.) */
const COT_GHOST_FRAME =
  "M159 40 C169 39.4, 179 39.5, 189 40.1 C189.5 53, 189.4 66, 188.8 79 C179 79.6, 169 79.5, 159.3 78.9 C158.7 66, 158.7 53, 159 40 Z";

/** Two firs and a star, visible through the dark lower panes — the night
 *  outside, and the first thread to the sky vignette. Clean tapering
 *  flanks; the first pass's wavering step-outs read as bumpy worms. */
const COT_OUTSIDE = [
  "M50.2 131 L50.2 126.4 C46.8 125.8, 45.4 124.4, 46.6 122.6 C47.4 121.4, 48.2 120.2, 48.6 119 C45.8 118.2, 44.8 116.8, 46.4 115 C47.4 113.8, 48.2 112.4, 48.8 111 C46.6 110.2, 46 108.8, 47.4 107 C48.4 105.6, 49 103.4, 49.6 101 C50 99.2, 50.4 97.4, 50.8 95.6 C51.4 97.8, 52 100.4, 52.6 102.6 C53.2 104.6, 54 106.4, 54.6 107.4 C55.6 109, 54.8 110.4, 52.8 111.2 C53.4 112.6, 54.2 114, 55.2 115.2 C56.6 117, 55.6 118.4, 52.8 119.2 C53.2 120.4, 54 121.6, 54.8 122.8 C56 124.6, 54.4 126, 51 126.6 L51 131 Z",
  "M119.4 132 L119.4 128 C116.6 127.5, 115.4 126.3, 116.4 124.8 C117.1 123.8, 117.7 122.8, 118.1 121.8 C115.8 121.1, 115 120, 116.3 118.4 C117.1 117.4, 117.8 116.3, 118.3 115.1 C116.5 114.4, 116 113.2, 117.1 111.7 C118 110.5, 118.5 108.7, 119 106.7 C119.3 105.2, 119.6 103.7, 119.9 102.2 C120.4 104, 120.9 106.2, 121.4 108 C121.9 109.7, 122.5 111.2, 123.1 112 C123.9 113.4, 123.2 114.5, 121.5 115.2 C122 116.3, 122.7 117.5, 123.5 118.5 C124.7 120, 123.8 121.2, 121.5 121.8 C121.9 122.8, 122.5 123.8, 123.2 124.8 C124.2 126.3, 122.9 127.4, 120.1 127.9 L120.1 132 Z",
];

function DormantCottage({ opacity, still }: { opacity: number; still: boolean }) {
  if (opacity <= 0) return null;

  // Cold blue at the lightness floor. The v2 Cottage opens near 7% L
  // because the typing overlay and the candles carry the frame; a title
  // card has neither, so the whole room is lifted.
  const wall = css([224, 16, 16]);
  const wallUpper = css([222, 15, 19]);
  const wainscot = css([220, 14, 13]);
  const wood = css([26, 12, 22]);
  const woodDark = css([24, 11, 16]);

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id="icWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallUpper} />
          <stop offset="70%" stopColor={wall} />
          <stop offset="100%" stopColor={css([222, 15, 14])} />
        </linearGradient>
        <linearGradient id="icPane" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={css([228, 30, 24])} />
          <stop offset="100%" stopColor={css([224, 24, 18])} />
        </linearGradient>
        {/* The pool falls off along its length AND fades at the sides via
            the mask, so no edge of it is a drawn line. */}
        <linearGradient id="icPool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fb4ff" stopOpacity="0.15" />
          <stop offset="55%" stopColor="#9fb4ff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#9fb4ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="icPoolFeather" gradientUnits="userSpaceOnUse" x1="14" y1="0" x2="182" y2="0">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="18%" stopColor="#a8a8a8" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="82%" stopColor="#a8a8a8" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <mask id="icPoolMask">
          <rect x="10" y="188" width="180" height="66" fill="url(#icPoolFeather)" />
        </mask>
        <linearGradient id="icFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={css([24, 12, 15])} />
          <stop offset="100%" stopColor={css([24, 12, 11])} />
        </linearGradient>
      </defs>

      {/* ── ROOM ── */}
      <rect width="400" height="250" fill="url(#icWall)" />
      {/* Plank seams — hand-wavering verticals at uneven widths, not
          ruled lines at a metric pitch */}
      {[58, 141, 197, 268, 351].map((x, i) => (
        <path key={`pl${i}`}
          d={`M${x} 0 C${x + 1.2} 48, ${x - 1.2} 100, ${x} 152 C${x + 1} 168, ${x - 0.8} 180, ${x + 0.3} 190`}
          fill="none" stroke={css([222, 15, 12])} strokeWidth={i % 2 ? 0.8 : 1.1}
          opacity={i % 2 ? 0.34 : 0.5} />
      ))}
      {/* A collar beam across the upper wall, and the shadow under it */}
      <path d="M0 62 C80 60, 180 63, 280 61 C336 60, 372 62, 400 61 L400 68 C372 69, 336 67, 280 68 C180 70, 80 67, 0 69 Z"
        fill={css([24, 13, 15])} opacity="0.35" />
      <path d="M0 69 C80 67, 180 70, 280 68 C336 67, 372 69, 400 68 L400 73 C372 74, 336 72, 280 73 C180 75, 80 72, 0 74 Z"
        fill={css([222, 18, 11])} opacity="0.28" />
      {/* Wainscot rail, dropped low so it clears the title block */}
      <path d="M0 188 C90 186, 190 189, 290 187 C340 186, 376 188, 400 187 L400 192 C376 193, 340 191, 290 192 C190 194, 90 191, 0 193 Z"
        fill={wainscot} />

      {/* ── FLOOR ── */}
      <path d="M0 192 C90 190, 190 193, 290 191 C340 190, 376 192, 400 191 L400 250 L0 250 Z"
        fill="url(#icFloor)" />
      {[-40, 40, 118, 196, 274, 352, 430].map((x, i) => (
        <path key={`fb${i}`}
          d={`M${200 + (x - 200) * 0.62} 192 L${x} 250`}
          fill="none" stroke={css([24, 11, 9])} strokeWidth="0.9" opacity="0.8" />
      ))}
      {/* Cold moonlight on the boards — feathered on every edge */}
      <g mask="url(#icPoolMask)">
        <path d={COT_MOON_POOL} fill="url(#icPool)">
          {!still && (
            <animate attributeName="opacity" values="0.78;1;0.78" dur="11s" repeatCount="indefinite" />
          )}
        </path>
        <path d={COT_MOON_POOL_HOT} fill="url(#icPool)" opacity="0.55" />
      </g>

      {/* ── WINDOW (left third) ── */}
      <g>
        <path d={COT_WINDOW_FRAME} fill="url(#icPane)" />
        {/* The night outside */}
        <g fill={css([228, 24, 15])}>
          {COT_OUTSIDE.map((d, i) => <path key={`co${i}`} d={d} />)}
        </g>
        <path d="M96 60 C96.6 61.4, 97.4 62.2, 98.8 62.8 C97.4 63.4, 96.6 64.2, 96 65.6 C95.4 64.2, 94.6 63.4, 93.2 62.8 C94.6 62.2, 95.4 61.4, 96 60 Z"
          fill="#dfe6ff" opacity="0.55">
          {!still && (
            <animate attributeName="opacity" values="0.28;0.62;0.3;0.55;0.28" dur="6.5s" repeatCount="indefinite" />
          )}
        </path>
        {/* Glazing bars and frame — slightly uneven, hand-cut */}
        <path d="M88 26 C88.6 60, 87.4 104, 88 142" fill="none" stroke={wood} strokeWidth="4.4" />
        <path d="M33 82 C66 82.8, 110 81.4, 143 82" fill="none" stroke={wood} strokeWidth="4.4" />
        <path d={COT_WINDOW_FRAME} fill="none" stroke={wood} strokeWidth="6" />
        <path d={COT_WINDOW_FRAME} fill="none" stroke={css([28, 14, 26])} strokeWidth="1.4" opacity="0.5"
          transform="translate(0 -1)" />
        <path d={COT_WINDOW_SILL} fill={wood} />
        <path d="M26 138 C60 136.4, 116 136.4, 150 138" fill="none" stroke={css([28, 14, 27])} strokeWidth="1.2" opacity="0.55" />
      </g>

      {/* ── The wall where something used to hang ── */}
      <g>
        <path d={COT_GHOST_FRAME} fill={css([222, 14, 20])} opacity="0.3" />
        <path d="M174 35 C175.1 34.6, 176 35.2, 175.8 36.2 C175.6 37.1, 174.5 37.5, 173.6 37 C172.9 36.6, 173.1 35.4, 174 35 Z"
          fill={css([26, 14, 10])} />
      </g>

      {/* ── SHELF (right third, low) ── */}
      <g>
        <path d={COT_SHELF} fill={wood} />
        <path d="M208 170 C258 168, 322 167, 386 169" fill="none" stroke={css([30, 15, 28])} strokeWidth="1.1" opacity="0.6" />
        <path d={COT_BRACKET_L} fill={woodDark} />
        <path d={COT_BRACKET_R} fill={woodDark} />

        {/* The mug, cold and empty */}
        <path d="M216 169 Q213.6 162 214.8 157 Q216 153.4 222 153.4 Q228 153.4 229.2 157 Q230.4 162 228 169 Z"
          fill={css([20, 16, 20])} />
        <path d="M229 158 Q235.4 158 235.4 162.6 Q235.4 167.2 229 167.2"
          fill="none" stroke={css([20, 15, 18])} strokeWidth="2" strokeLinecap="round" />
        <path d="M214.6 154.4 C216.8 152.8, 227.2 152.8, 229.4 154.4 C227.2 156, 216.8 156, 214.6 154.4 Z"
          fill={css([22, 14, 23])} />

        {/* THE JOURNAL — closed, waiting. The story turns on this book. */}
        <path d={COT_BOOK_COVER} fill={css([18, 24, 12])} />
        <path d={COT_BOOK_PAGES} fill={css([40, 12, 22])} opacity="0.75" />
        <path d={COT_BOOK_BAND} fill={css([20, 20, 9])} opacity="0.85" />
        <path d="M240.6 162 Q256 160.4 272 162" fill="none" stroke={css([32, 18, 21])} strokeWidth="0.6" opacity="0.45" />

        {/* Three unlit candles — pale cold wax, short spent wicks */}
        {CANDLES.map(([x, h], i) => (
          <g key={`cd${i}`}>
            <path d={candleBody(x, h)} fill={css([44, 11, 27])} />
            <path d={candleDrip(x, h)} fill={css([44, 13, 31])} opacity="0.75" />
            <path d={`M${x + 3.2} ${170 - h * 0.85} C${x + 4} ${170 - h * 0.5}, ${x + 3.6} ${170 - h * 0.2}, ${x + 3.2} 169`}
              fill="none" stroke={css([40, 9, 20])} strokeWidth="1" opacity="0.7" />
            {/* A wick that has burned and gone out: short, bent, charred */}
            <path d={`M${x} ${169.4 - h} C${x + 0.3} ${167.9 - h}, ${x + 0.9} ${167.2 - h}, ${x + 1.4} ${166.8 - h}`}
              fill="none" stroke={css([28, 14, 9])} strokeWidth="0.85" strokeLinecap="round" />
            {/* The melted crater at the top */}
            <path d={`M${x - 3.1} ${169.6 - h} C${x - 1.6} ${170.6 - h}, ${x + 1.6} ${170.6 - h}, ${x + 3.1} ${169.6 - h} C${x + 1.6} ${168.5 - h}, ${x - 1.6} ${168.5 - h}, ${x - 3.1} ${169.6 - h} Z`}
              fill={css([42, 10, 18])} />
          </g>
        ))}
      </g>
    </g>
  );
}

// ─── VIGNETTE 3: THE NIGHT SKY ─────────────────────────────
// The v2 Stars field with the figures NOT drawn — every star is up there,
// none of them joined. The moon hangs low over the treeline.

/** The four figures' stars, at their v2 coordinates. Lines absent. */
const FIGURE_STARS: [number, number, number][] = [
  // Orion
  [50, 88, 2.4], [102, 82, 2.0], [64, 118, 1.7], [77, 121, 1.9],
  [90, 124, 1.7], [58, 152, 1.8], [108, 148, 2.4],
  // Cassiopeia
  [96, 32, 1.7], [120, 50, 2.2], [144, 28, 1.9], [170, 49, 1.7], [194, 32, 1.5],
  // Lyra
  [194, 70, 2.5], [182, 88, 1.5], [206, 84, 1.5], [212, 106, 1.4], [188, 110, 1.4],
  // Cygnus
  [278, 24, 2.4], [265, 69, 1.8], [252, 114, 1.7], [227, 58, 1.6], [302, 80, 1.7],
];

/** Scatter, routed around the figures so the shapes stay legible once the
 *  player names them in the game proper. */
const SKY_SCATTER: [number, number, number, number][] = [
  // x, y, r, colour index (0 white, 1 blue-white, 2 warm)
  [12, 22, 1.1, 1], [30, 44, 1.4, 0], [9, 66, 1.0, 0], [26, 100, 1.2, 1],
  [14, 134, 1.0, 0], [24, 156, 1.3, 2], [58, 18, 1.0, 0], [140, 74, 1.5, 0],
  [150, 96, 1.1, 1], [126, 106, 1.3, 0], [166, 128, 1.0, 0], [128, 138, 1.2, 2],
  [218, 42, 1.4, 0], [152, 142, 1.0, 0], [196, 132, 1.3, 1], [232, 130, 1.1, 0],
  [240, 148, 1.2, 0], [222, 20, 1.4, 0], [244, 14, 1.0, 1], [308, 14, 1.2, 0],
  [352, 24, 1.5, 0], [388, 42, 1.1, 2], [366, 94, 1.3, 0], [392, 120, 1.0, 0],
  [336, 152, 1.4, 1], [306, 158, 1.1, 0], [272, 142, 1.2, 0], [176, 150, 1.0, 0],
  [350, 168, 1.1, 0], [74, 62, 0.9, 0], [46, 172, 1.0, 1], [110, 166, 0.9, 0],
];

const STAR_CORE = ["#ffffff", "#cfd6ff", "#ffe6c4"];
const STAR_HALO = ["url(#isHaloW)", "url(#isHaloC)", "url(#isHaloA)"];

/** The treeline, as three continuous silhouette masses rather than a row
 *  of stamped templates (the first pass stamped a ball-on-a-stick crown
 *  and the whole line read as clip art). The rhythm is hand-set: each row
 *  is a table of peaks — x, height, and kind — and the stitcher walks the
 *  baseline between them, stepping out at each branch layer on a conifer
 *  and bulging into a ragged dome on a broadleaf. One path per row, so
 *  the trees share a ground mass instead of floating apart. */
type Peak = { x: number; h: number; k: 0 | 1 };

function treelinePath(peaks: Peak[], base: number, floor: number): string {
  let d = `M-16 ${base}`;
  for (const { x, h, k } of peaks) {
    const w = k === 0 ? h * 0.31 : h * 0.5;
    if (k === 0) {
      // conifer: three branch-layer steps up each flank to a spire
      d += ` C${x - w * 1.08} ${base - h * 0.05}, ${x - w * 0.80} ${base - h * 0.28}, ${x - w * 0.63} ${base - h * 0.37}`;
      d += ` C${x - w * 0.90} ${base - h * 0.43}, ${x - w * 0.52} ${base - h * 0.64}, ${x - w * 0.39} ${base - h * 0.71}`;
      d += ` C${x - w * 0.58} ${base - h * 0.77}, ${x - w * 0.21} ${base - h * 0.93}, ${x} ${base - h}`;
      d += ` C${x + w * 0.23} ${base - h * 0.92}, ${x + w * 0.60} ${base - h * 0.76}, ${x + w * 0.41} ${base - h * 0.70}`;
      d += ` C${x + w * 0.55} ${base - h * 0.63}, ${x + w * 0.92} ${base - h * 0.42}, ${x + w * 0.65} ${base - h * 0.36}`;
      d += ` C${x + w * 0.83} ${base - h * 0.27}, ${x + w * 1.10} ${base - h * 0.04}, ${x + w * 1.22} ${base}`;
    } else {
      // broadleaf: a lopsided ragged dome on a short bole
      d += ` C${x - w * 1.05} ${base - h * 0.08}, ${x - w * 1.02} ${base - h * 0.44}, ${x - w * 0.80} ${base - h * 0.66}`;
      d += ` C${x - w * 0.66} ${base - h * 0.86}, ${x - w * 0.34} ${base - h * 0.82}, ${x - w * 0.22} ${base - h * 0.93}`;
      d += ` C${x - w * 0.06} ${base - h * 1.03}, ${x + w * 0.30} ${base - h * 1.0}, ${x + w * 0.44} ${base - h * 0.84}`;
      d += ` C${x + w * 0.62} ${base - h * 0.88}, ${x + w * 0.88} ${base - h * 0.62}, ${x + w * 0.84} ${base - h * 0.44}`;
      d += ` C${x + w * 1.0} ${base - h * 0.26}, ${x + w * 1.08} ${base - h * 0.08}, ${x + w * 1.2} ${base}`;
    }
  }
  return `${d} L412 ${floor} L-16 ${floor} Z`;
}

/** Three depth rows: far and hazy, mid, near and black. Heights step up
 *  toward the viewer and the tops step DOWN, so the rows read as
 *  distance rather than as three copies of the same fence. */
const TREE_ROWS: { base: number; floor: number; fill: string; op: number; peaks: Peak[] }[] = [
  {
    base: 200, floor: 224, fill: "#1c2554", op: 0.55,
    peaks: [
      { x: 4, h: 20, k: 0 }, { x: 25, h: 26, k: 0 }, { x: 45, h: 15, k: 1 },
      { x: 65, h: 24, k: 0 }, { x: 87, h: 18, k: 0 }, { x: 105, h: 13, k: 1 },
      { x: 125, h: 27, k: 0 }, { x: 147, h: 21, k: 0 }, { x: 165, h: 14, k: 1 },
      { x: 187, h: 25, k: 0 }, { x: 209, h: 18, k: 0 }, { x: 228, h: 23, k: 0 },
      { x: 249, h: 13, k: 1 }, { x: 269, h: 26, k: 0 }, { x: 291, h: 20, k: 0 },
      { x: 309, h: 15, k: 1 }, { x: 329, h: 24, k: 0 }, { x: 351, h: 19, k: 0 },
      { x: 371, h: 26, k: 0 }, { x: 393, h: 16, k: 1 },
    ],
  },
  {
    base: 219, floor: 240, fill: "#101637", op: 1,
    peaks: [
      { x: -6, h: 26, k: 0 }, { x: 17, h: 32, k: 0 }, { x: 40, h: 20, k: 1 },
      { x: 63, h: 30, k: 0 }, { x: 85, h: 25, k: 0 }, { x: 109, h: 34, k: 0 },
      { x: 131, h: 18, k: 1 }, { x: 153, h: 29, k: 0 }, { x: 177, h: 33, k: 0 },
      { x: 199, h: 24, k: 0 }, { x: 221, h: 17, k: 1 }, { x: 243, h: 31, k: 0 },
      { x: 267, h: 27, k: 0 }, { x: 289, h: 35, k: 0 }, { x: 313, h: 19, k: 1 },
      { x: 335, h: 30, k: 0 }, { x: 359, h: 25, k: 0 }, { x: 383, h: 33, k: 0 },
      { x: 405, h: 22, k: 0 },
    ],
  },
  {
    base: 243, floor: 256, fill: "#04060f", op: 1,
    peaks: [
      { x: -4, h: 34, k: 0 }, { x: 26, h: 42, k: 0 }, { x: 58, h: 26, k: 1 },
      { x: 84, h: 38, k: 0 }, { x: 121, h: 45, k: 0 }, { x: 149, h: 29, k: 0 },
      { x: 183, h: 40, k: 0 }, { x: 214, h: 23, k: 1 }, { x: 244, h: 43, k: 0 },
      { x: 278, h: 31, k: 0 }, { x: 304, h: 37, k: 0 }, { x: 340, h: 27, k: 1 },
      { x: 372, h: 44, k: 0 }, { x: 402, h: 32, k: 0 },
    ],
  },
];

function DormantSky({ opacity, still }: { opacity: number; still: boolean }) {
  if (opacity <= 0) return null;

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id="isSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1130" />
          <stop offset="42%" stopColor="#121840" />
          <stop offset="76%" stopColor="#1a2352" />
          <stop offset="100%" stopColor="#232c60" />
        </linearGradient>
        <radialGradient id="isMilky" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a5abff" stopOpacity="0.13" />
          <stop offset="42%" stopColor="#7c7cd8" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#6060a0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="isMoonAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8e8ff" stopOpacity="0.20" />
          <stop offset="48%" stopColor="#9098f8" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#9098f8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="isMoonNear" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2f2ff" stopOpacity="0.19" />
          <stop offset="55%" stopColor="#d6d8ff" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#b0b4ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="isHaloW" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="45%" stopColor="#dfe4ff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#c8d0ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="isHaloC" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d6dcff" stopOpacity="0.28" />
          <stop offset="45%" stopColor="#a8b4ff" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#8894ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="isHaloA" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe6c4" stopOpacity="0.28" />
          <stop offset="45%" stopColor="#e8b98a" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#c08a60" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="isHorizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3470" stopOpacity="0" />
          <stop offset="55%" stopColor="#2f3a7c" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#36407f" stopOpacity="0.34" />
        </linearGradient>
        {/* Mist between the treeline rows — what actually separates three
            silhouettes of the same colour into three distances. */}
        <linearGradient id="isRowMist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a5896" stopOpacity="0" />
          <stop offset="52%" stopColor="#4a5896" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#4a5896" stopOpacity="0" />
        </linearGradient>
        <mask id="isCrescent">
          <circle cx="330" cy="126" r="21" fill="white" />
          <circle cx="321" cy="121" r="18" fill="black" />
        </mask>
      </defs>

      <rect width="400" height="250" fill="url(#isSky)" />

      {/* The milky way — a faint band, the sky's only large soft form */}
      <g opacity="0.85">
        <ellipse cx="200" cy="84" rx="220" ry="40" fill="url(#isMilky)" transform="rotate(-25, 200, 84)" />
        <ellipse cx="176" cy="80" rx="178" ry="24" fill="url(#isMilky)" transform="rotate(-25, 176, 80)" opacity="0.6" />
        {[
          [118, 66], [144, 74], [168, 68], [196, 114], [220, 88], [244, 96],
          [268, 82], [154, 92], [210, 102], [238, 74], [130, 104], [258, 90],
          [288, 104], [96, 84], [312, 114],
        ].map(([x, y], i) => (
          <circle key={`mw${i}`} cx={x} cy={y} r={0.5 + (i % 3) * 0.28} fill="white"
            opacity={0.12 + (i % 4) * 0.04} />
        ))}
      </g>

      {/* Horizon haze, sitting the treeline into the sky */}
      <rect x="0" y="150" width="400" height="66" fill="url(#isHorizon)" />

      {/* ── THE MOON, low over the trees ── */}
      <g>
        <circle cx="330" cy="126" r="56" fill="url(#isMoonAura)" />
        <circle cx="330" cy="126" r="31" fill="url(#isMoonNear)" />
        <g mask="url(#isCrescent)">
          <circle cx="330" cy="126" r="21" fill="#cfd2e8" />
          <circle cx="338" cy="123" r="2.6" fill="#b4b6d2" opacity="0.3" />
          <circle cx="335" cy="133" r="1.8" fill="#adafcb" opacity="0.24" />
          <circle cx="341" cy="129" r="1.2" fill="#bcbed8" opacity="0.24" />
          <circle cx="332" cy="115" r="1.5" fill="#b8bad6" opacity="0.2" />
        </g>
      </g>

      {/* ── STARS — every one present, not one of them joined ── */}
      <g>
        {SKY_SCATTER.map(([x, y, r, c], i) => (
          <g key={`ss${i}`}>
            <circle cx={x} cy={y} r={r * 3.4} fill={STAR_HALO[c]} />
            <circle cx={x} cy={y} r={r} fill={STAR_CORE[c]} opacity={0.72 + (i % 3) * 0.09}>
              {i % 3 === 0 && !still && (
                <animate attributeName="opacity" values="0.42;0.95;0.55;0.86;0.42"
                  dur={`${4.2 + (i % 5) * 0.8}s`} repeatCount="indefinite" />
              )}
            </circle>
          </g>
        ))}
        {FIGURE_STARS.map(([x, y, r], i) => (
          <g key={`fs${i}`}>
            <circle cx={x} cy={y} r={r * 3.3} fill={STAR_HALO[i % 3 === 2 ? 1 : 0]} />
            <circle cx={x} cy={y} r={r * 0.82} fill="#ffffff" opacity={0.8 + (i % 3) * 0.06}>
              {i % 3 === 1 && !still && (
                <animate attributeName="opacity" values="0.5;1;0.62;0.9;0.5"
                  dur={`${5 + (i % 4) * 0.9}s`} repeatCount="indefinite" />
              )}
            </circle>
          </g>
        ))}
      </g>

      {/* ── TREELINE — three receding masses, mist banked between them ── */}
      <path d={treelinePath(TREE_ROWS[0].peaks, TREE_ROWS[0].base, TREE_ROWS[0].floor)}
        fill={TREE_ROWS[0].fill} opacity={TREE_ROWS[0].op} />
      <rect x="0" y="196" width="400" height="26" fill="url(#isRowMist)" />
      <path d={treelinePath(TREE_ROWS[1].peaks, TREE_ROWS[1].base, TREE_ROWS[1].floor)}
        fill={TREE_ROWS[1].fill} />
      <rect x="0" y="216" width="400" height="22" fill="url(#isRowMist)" opacity="0.7" />
      <path d={treelinePath(TREE_ROWS[2].peaks, TREE_ROWS[2].base, TREE_ROWS[2].floor)}
        fill={TREE_ROWS[2].fill} />
    </g>
  );
}

// ─── ALWAYS-ON: the dawn glow and the firefly ──────────────

/** The warmth that's coming: a faint dawn bloom banked at the horizon,
 *  and one amber mote drifting across the frame on the 24 s cycle so its
 *  Glow light and its body are the same object. */
function TitleAccent({ still }: { still: boolean }) {
  return (
    <g>
      <defs>
        <radialGradient id="itDawn" cx="50%" cy="100%" r="58%">
          <stop offset="0%" stopColor="hsl(28, 62%, 56%)" stopOpacity="0.20" />
          <stop offset="52%" stopColor="hsl(28, 50%, 36%)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="hsl(28, 40%, 20%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="158" width="400" height="92" fill="url(#itDawn)" />
      <g>
        <circle r="1.5" fill="hsl(40, 82%, 70%)" opacity={still ? 0.7 : 0.85}>
          {!still && (
            <>
              <animate attributeName="cx" values={MOTE_X} dur="24s" repeatCount="indefinite" />
              <animate attributeName="cy" values={MOTE_Y} dur="24s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.85;0.7;0.9;0.6;0.85;0.75;0.9;0.5;0"
                dur="24s" repeatCount="indefinite" />
            </>
          )}
          {still && <animate attributeName="cx" values="200" dur="24s" repeatCount="indefinite" />}
        </circle>
        <circle r="0.55" fill="#ffffff" opacity={still ? 0.8 : 0.95}>
          {!still && (
            <>
              <animate attributeName="cx" values={MOTE_X} dur="24s" repeatCount="indefinite" />
              <animate attributeName="cy" values={MOTE_Y} dur="24s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.95;0.8;1;0.7;0.95;0.85;1;0.55;0"
                dur="24s" repeatCount="indefinite" />
            </>
          )}
          {still && <animate attributeName="cx" values="200" dur="24s" repeatCount="indefinite" />}
        </circle>
      </g>
    </g>
  );
}

// ─── THE SCREEN ────────────────────────────────────────────

export default function Intro2() {
  const startGame = useGameStore((g) => g.startGame);
  const enterWander = useGameStore((g) => g.enterWander);
  const hasCompleted = useGameStore((g) => g.hasCompleted);
  const { focusInput } = useInput();
  const [time, setTime] = useState(0);
  const [shareLabel, setShareLabel] = useState("Share");
  const [still] = useState(prefersReducedMotion);
  const startRef = useRef<number>(performance.now());

  // Begin: focus the singleton input synchronously inside the click
  // handler so iOS opens its keyboard during this gesture. The input
  // is mounted at App root, so focus survives the screen swap into
  // PlayingScreen and the keyboard never has to reopen on first tap.
  const handleBegin = () => {
    focusInput();
    startGame();
  };

  // Start intro drone on mount
  useEffect(() => {
    startIntroDrone();
    return () => { stopIntroDrone(); };
  }, []);

  // Keyboard: space/enter to begin
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleBegin();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Free-running rAF tick — drives the looping background phases.
  // No upper bound on elapsed time; the phaseOpacity function uses
  // `time % CYCLE_LEN` so the cycle continues until the user navigates
  // away from this screen.
  useEffect(() => {
    const start = startRef.current;
    let frame: number;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      const elapsed = (now - start) / 1000;
      if (now - lastUpdate > 66) {
        lastUpdate = now;
        setTime(elapsed);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // The Glow reads the cycle straight off the wall clock rather than off
  // React state, so its light never lags the crossfade by a frame.
  const progressOf = useCallback(() => {
    const elapsed = (performance.now() - startRef.current) / 1000;
    return (elapsed % CYCLE_LEN) / CYCLE_LEN;
  }, []);

  const cycleT = time % CYCLE_LEN;

  return (
    <div className={s.container}>
      <div className={s.sceneStage}>
        <svg
          viewBox="0 0 400 250"
          className={s.sceneWrap}
          overflow="hidden"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="400" height="250" fill="#0b0e1c" />
          <DormantGarden opacity={phaseWeight(0, cycleT)} still={still} />
          <DormantCottage opacity={phaseWeight(1, cycleT)} still={still} />
          <DormantSky opacity={phaseWeight(2, cycleT)} still={still} />
          <TitleAccent still={still} />
        </svg>
        <GlowSurface manifest={INTRO_MANIFEST} progressOf={progressOf} />
      </div>

      <div className={s.titleOverlay}>
          <svg viewBox="0 0 60 60" width="64" height="64" className={s.titleLogo}>
            {/* Outer ring — medallion border */}
            <circle cx="30" cy="30" r="26" fill="none"
              stroke="#3a5a2a" strokeWidth="1.2" opacity="0.85" />
            {/* Stave — vertical spine with subtle organic drift */}
            <path
              d="M30 12 C29.5 22, 30.5 32, 30 48"
              stroke="#5a8a4a" strokeWidth="2.2" strokeLinecap="round" fill="none"
            />
            {/* Three diagonal strokes crossing the stave — Ogham nGéadal,
                 varied lengths and progressively steeper angle to fan
                 slightly downward. */}
            <path
              d="M24 19 L35 21"
              stroke="#6aaa58" strokeWidth="1.9" strokeLinecap="round" fill="none"
            />
            <path
              d="M22 28 L37 32"
              stroke="#6aaa58" strokeWidth="1.9" strokeLinecap="round" fill="none"
            />
            <path
              d="M21 37 L38 43"
              stroke="#6aaa58" strokeWidth="1.9" strokeLinecap="round" fill="none"
            />
            {/* Tip spark — firefly catch on the topmost stroke */}
            <circle cx="35" cy="21" r="1.4" fill="#d8e8c8" opacity="0.85" />
            <circle cx="35" cy="21" r="0.5" fill="#ffffff" opacity="0.95" />
          </svg>

          <h1 className={s.title}>Inkwood</h1>

          {/* The previous scribe, once, before you begin. */}
          <p className={s.journalLine}>Someone wrote this forest awake once.</p>

          <div className={s.beginRow}>
            <button
              className={s.beginBtn}
              onClick={(e) => {
                e.stopPropagation();
                switchEdition(false, { screen: "playing", lvl: 0, promptIdx: 0, fresh: true });
              }}
            >
              Begin Inkwood Classic
            </button>
            <button
              className={s.beginBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleBegin();
              }}
            >
              Begin Inkwood 2
            </button>
          </div>

          {hasCompleted && (
            <button
              className={s.wanderLink}
              onClick={(e) => {
                e.stopPropagation();
                enterWander();
              }}
              aria-label="Replay any level — pick a scene to revisit"
            >
              Replay any level
            </button>
          )}

          <button
            className={s.shareLink}
            onClick={async (e) => {
              e.stopPropagation();
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
    </div>
  );
}
