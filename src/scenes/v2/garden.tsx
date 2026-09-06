import { memo } from "react";
import type { SceneProps } from "../../types";
import { sub } from "../util";
import { GlowFilter } from "../../svg/filters";
import { useParticles } from "../../hooks/useParticles";
import ParticleField from "../../components/ParticleField";

/**
 * The Sleeping Garden — Inkwood 2 redraw.
 *
 * A dawn. The v1 scene was a flat green blob on a flat blue sky; this one
 * is five receding planes (sky → treeline → three hills → the near bed)
 * lit by a sun that rises out from behind the hills as the incantation
 * lands.
 *
 * Phrase 1, "wake now, sleeping roots" (p 0 → 0.5)
 *   A bright head of light runs OUT along each surface root from the
 *   trunk and the wood warms behind it, foliage grows in over the bare
 *   branches, the sun clears the horizon, and stems rise with closed buds
 *   waiting on them.
 * Phrase 2, "bloom, every waiting flower" (p 0.5 → 1)
 *   The waiting buds open, staggered across the bed, each with a small
 *   overshoot. Pollen lifts and the crests take their rim light.
 *
 * How the canopy is shaded, in three passes:
 *   1. Each foliage mass is a clip path, and ONE shared set of light
 *      fields (shadow floor, lit cap, hot cap) is drawn through every
 *      clip — so light runs across the whole crown in a single direction
 *      rather than as concentric copies of each mass (which is what makes
 *      SVG foliage look like broccoli).
 *   2. Hand-placed sunlit leaf clusters on the sun side and dark gaps
 *      through to the branches, which is what actually reads as dapple.
 *   3. The bare branch skeleton is drawn underneath and fades as the
 *      leaves take over — the covering layer the director asked to keep.
 *
 * Idle life is SMIL only (canopy sway, flower sway, grass sway, cloud
 * drift, star twinkle), so nothing here costs a React render between
 * keystrokes.
 */

// ─── HELPERS ───────────────────────────────────────────────

type HSL = [number, number, number];

/** Hue is written modulo 360 so a ramp can cross the top of the wheel:
 *  violet 320 → peach 380 interpolates through red, where 320 → 20 would
 *  swing the long way round and pass through green at half progress. */
const css = (c: HSL) =>
  `hsl(${(((c[0] % 360) + 360) % 360).toFixed(1)}, ${c[1].toFixed(1)}%, ${c[2].toFixed(1)}%)`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: HSL, b: HSL, t: number): HSL => [
  lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t),
];

/** A tapered, bending grass blade — a closed path, never a stroked line. */
function blade(x: number, y: number, h: number, bend: number, w: number): string {
  const tx = x + bend;
  const ty = y - h;
  return `M${x - w} ${y} C${x - w * 0.5} ${y - h * 0.45}, ${tx - w * 0.7} ${y - h * 0.8}, ${tx} ${ty} C${tx + w * 0.28} ${y - h * 0.76}, ${x + w * 0.8} ${y - h * 0.4}, ${x + w} ${y} Z`;
}

// ─── THE TREE ──────────────────────────────────────────────

/** Trunk and its three limbs as one continuous closed path: up the left
 *  flank, out along the left limb and back into the first crotch, up the
 *  centre limb and back down, out along the right limb, then down the
 *  right flank to a buttressed base. Nothing here is straight-sided, and
 *  every tip finishes inside the crown so nothing spikes out of it. */
const TRUNK = `
  M106 195
  C110 186, 113 178, 112 170
  C111 163, 113 156, 112 148
  C111 141, 113 137, 115 131
  C116 125, 114 121, 117 115
  C112 106, 106 98, 100 90
  C94 82, 87 73, 80 65
  C76 60, 72 56, 68 52
  L72 49
  C76 54, 80 60, 85 66
  C92 75, 99 83, 105 91
  C109 96, 112 100, 115 104
  C116 94, 117 84, 118 74
  C119 64, 120 54, 121 45
  C121 40, 121 36, 121 33
  L125 33
  C125 37, 125 41, 125 46
  C125 55, 125 64, 125 74
  C125 83, 125 93, 126 102
  C130 96, 134 90, 139 84
  C146 75, 154 66, 163 58
  C168 53, 173 49, 179 45
  L182 49
  C175 53, 169 58, 163 64
  C154 72, 146 81, 140 89
  C136 95, 134 100, 133 106
  C134 117, 133 127, 135 138
  C137 150, 136 162, 138 172
  C139 182, 139 189, 141 195
  C134 198, 114 198, 106 195
  Z`;

/** Loose bark flakes — small irregular patches that break the fill up so
 *  the trunk isn't one smooth wash of colour. */
const BARK_FLAKES = [
  "M113 158 C116 155, 121 156, 122 161 C122 167, 118 170, 115 168 C111 165, 110 160, 113 158 Z",
  "M127 172 C131 170, 135 172, 134 176 C133 181, 128 182, 126 179 C124 176, 124 173, 127 172 Z",
  "M118 186 C122 184, 127 186, 127 190 C126 194, 121 195, 118 193 C115 191, 115 188, 118 186 Z",
  "M129 141 C132 139, 136 141, 135 145 C134 149, 130 150, 128 147 C126 145, 126 142, 129 141 Z",
];

/** Sub-branches off each limb — tapered closed paths, all ending inside
 *  the canopy bounds so the crown has something to sit on. */
const FORKS = [
  "M92 79 C85 72, 76 66, 66 62 L68 59 C78 63, 88 69, 95 75 Z",
  "M100 91 C92 88, 83 86, 73 86 L73 83 C84 83, 94 85, 103 88 Z",
  "M120 60 C114 54, 107 48, 100 43 L102 40 C110 45, 117 51, 123 57 Z",
  "M123 71 C130 64, 139 58, 148 54 L150 57 C141 61, 132 67, 126 74 Z",
  "M150 68 C158 61, 167 55, 177 51 L178 54 C169 59, 160 65, 153 71 Z",
  "M140 84 C149 81, 159 79, 169 79 L169 82 C159 82, 150 84, 142 87 Z",
  "M117 95 C110 92, 103 90, 96 90 L96 87 C104 87, 112 89, 119 92 Z",
];

/** Twigs — the delicate ends that make the dormant frame read as a tree
 *  rather than a snapped post. All inside the crown's footprint. */
const TWIGS = [
  "M71 49 C68 46, 64 44, 60 43 L60 41 C65 42, 69 44, 73 47 Z",
  "M68 52 C62 50, 56 49, 49 49 L49 47 C56 47, 63 48, 69 50 Z",
  "M66 63 C62 60, 57 57, 51 55 L52 53 C58 55, 64 58, 68 61 Z",
  "M180 46 C182 44, 185 42, 188 41 L189 43 C186 44, 183 46, 182 48 Z",
  "M178 44 C178 41, 179 39, 181 37 L183 38 C181 40, 180 42, 180 46 Z",
  "M174 55 C179 52, 185 50, 191 50 L191 52 C185 52, 180 54, 176 57 Z",
  "M120 33 C119 30, 118 28, 116 26 L118 25 C120 27, 121 30, 122 32 Z",
  "M124 33 C126 30, 128 28, 131 26 L132 28 C130 30, 127 32, 126 35 Z",
  "M102 43 C99 39, 95 36, 90 33 L91 31 C96 34, 100 37, 104 41 Z",
  "M148 56 C153 52, 158 49, 164 46 L165 48 C160 51, 155 54, 151 58 Z",
];

/** Bark: darker grooves inside the trunk, then a lit edge on the sun side
 *  so the trunk reads round rather than as a cut-out. */
const BARK_DARK = [
  "M115 192 C117 182, 116 174, 117 165",
  "M116 156 C117 148, 116 141, 117 133",
  "M124 194 C125 184, 124 176, 125 168",
  "M125 158 C126 150, 125 143, 126 136",
  "M132 190 C131 181, 130 174, 130 167",
  "M130 156 C130 148, 130 142, 130 136",
  "M119 172 C123 170, 127 170, 131 171",
  "M117 150 C120 148, 124 148, 128 149",
  "M127 183 C130 182, 133 182, 136 183",
  "M120 138 C124 136, 128 136, 132 137",
];
/** A knot and its lip — the one asymmetry that stops the trunk reading
 *  as a smooth cone. */
const KNOT =
  "M124 152 C127 149, 132 150, 132 155 C132 160, 128 163, 125 161 C122 159, 121 155, 124 152 Z";
const KNOT_LIP =
  "M123 150 C127 147, 133 148, 134 153";
/** The shaded flank, away from the sun. */
const TRUNK_SHADE =
  "M106 195 C111 184, 114 173, 114 161 C114 152, 112 143, 114 134 C115 126, 114 121, 117 115 C114 111, 111 107, 108 103 C109 112, 107 121, 106 130 C105 141, 106 152, 106 163 C106 175, 104 186, 101 195 Z";
const BARK_LIT = [
  "M137 192 C135 178, 134 166, 133 154 C132 143, 131 134, 130 124",
  "M132 101 C130 93, 131 85, 135 77",
  "M121 62 C120 54, 121 46, 122 38",
];

/** Surface roots: a tapered body plus a centreline that a short bright
 *  head travels along (pathLength=1, so the dash maths is unit-free). */
const ROOTS: { body: string; line: string }[] = [
  {
    body: "M105 185 C98 188, 89 191, 79 192 C71 193, 64 193, 57 195 L58 197 C65 196, 73 196, 81 194 C91 192, 100 190, 107 188 Z",
    line: "M106 187 C99 190, 89 192, 79 193 C71 194, 64 194, 58 196",
  },
  {
    body: "M110 191 C105 196, 97 201, 87 204 C79 206, 71 206, 64 208 L64 210 C72 209, 80 208, 88 206 C99 203, 108 198, 113 194 Z",
    line: "M111 193 C106 198, 97 202, 88 205 C80 207, 72 207, 64 209",
  },
  {
    body: "M139 185 C146 188, 156 191, 167 192 C175 193, 183 192, 190 194 L190 196 C182 195, 174 195, 166 194 C155 193, 145 190, 137 188 Z",
    line: "M138 187 C146 190, 157 192, 167 193 C175 194, 183 193, 190 195",
  },
  {
    body: "M136 191 C142 196, 151 201, 162 204 C170 206, 178 206, 185 208 L185 210 C177 209, 169 208, 161 206 C149 203, 140 198, 134 194 Z",
    line: "M137 193 C143 198, 152 202, 162 205 C170 207, 178 207, 185 209",
  },
  {
    body: "M122 196 C121 201, 116 207, 109 212 C103 215, 97 217, 91 219 L92 221 C99 219, 106 216, 112 212 C120 207, 125 201, 126 197 Z",
    line: "M123 198 C122 203, 117 208, 110 213 C104 216, 98 218, 92 220",
  },
];

// ─── CANOPY ────────────────────────────────────────────────

/** Five hand-drawn leaf-cluster silhouettes in local units (roughly a
 *  unit radius, each deliberately lopsided with its own notches). The
 *  crown is built by stacking twenty of these back to front, dark to
 *  light — the way a painter loads a brush and works from the shadow
 *  side up into the sun. Overlapping clusters give real dapple: the dark
 *  ones behind read as gaps, the light ones in front as sunlit leaves,
 *  and nothing floats as an isolated spot the way a drawn-on highlight
 *  does. */
const PUFFS = [
  `M-1 0.1 C-1.05 -0.35, -0.75 -0.6, -0.45 -0.62
   C-0.3 -0.95, 0.1 -1.05, 0.3 -0.8
   C0.6 -0.95, 0.95 -0.7, 0.92 -0.35
   C1.12 -0.05, 0.95 0.35, 0.6 0.42
   C0.45 0.75, 0.05 0.85, -0.15 0.6
   C-0.5 0.78, -0.85 0.55, -0.85 0.25
   C-1.0 0.2, -1.02 0.15, -1 0.1 Z`,
  `M-1 0.05 C-1.1 -0.3, -0.8 -0.55, -0.5 -0.5
   C-0.35 -0.85, 0 -0.9, 0.2 -0.62
   C0.45 -0.85, 0.85 -0.7, 0.88 -0.38
   C1.15 -0.2, 1.1 0.15, 0.8 0.3
   C0.7 0.6, 0.3 0.7, 0.1 0.48
   C-0.15 0.7, -0.55 0.62, -0.6 0.32
   C-0.9 0.32, -1.05 0.25, -1 0.05 Z`,
  `M-0.85 0.2 C-1 -0.15, -0.8 -0.5, -0.5 -0.55
   C-0.45 -0.9, -0.05 -1.1, 0.2 -0.85
   C0.5 -1, 0.85 -0.75, 0.8 -0.4
   C1 -0.15, 0.9 0.3, 0.55 0.4
   C0.5 0.7, 0.15 0.85, -0.05 0.62
   C-0.3 0.8, -0.65 0.6, -0.62 0.3
   C-0.8 0.3, -0.88 0.28, -0.85 0.2 Z`,
  `M-0.9 0 C-1 -0.4, -0.6 -0.65, -0.35 -0.55
   C-0.25 -0.9, 0.2 -1, 0.35 -0.7
   C0.7 -0.8, 0.95 -0.5, 0.85 -0.2
   C1.05 0.1, 0.8 0.45, 0.45 0.42
   C0.3 0.7, -0.1 0.75, -0.25 0.5
   C-0.6 0.65, -0.9 0.4, -0.85 0.15
   C-0.92 0.1, -0.92 0.05, -0.9 0 Z`,
  `M-1.05 0.1 C-1.1 -0.25, -0.85 -0.45, -0.55 -0.42
   C-0.42 -0.72, -0.05 -0.8, 0.12 -0.55
   C0.35 -0.78, 0.75 -0.65, 0.8 -0.32
   C1.1 -0.18, 1.08 0.18, 0.78 0.28
   C0.66 0.55, 0.28 0.62, 0.08 0.42
   C-0.18 0.62, -0.58 0.55, -0.62 0.28
   C-0.95 0.3, -1.08 0.24, -1.05 0.1 Z`,
];

/** [shape, x, y, radius, rotation, tone]. Tone 0 = deepest shade, 1 = the
 *  leaves the sun is actually hitting.
 *
 *  CROWN_BASE is the solid mass, all of it in shade — it exists so the
 *  gaps between the detail clusters read as dark leaves rather than as
 *  holes to the sky. CROWN is the visible foliage, painted over it from
 *  the belly up into the light. */
type Puff = [number, number, number, number, number, number];

const CROWN_BASE: Puff[] = [
  [3, 60, 72, 24, -8, 0.0],
  [4, 70, 88, 30, 0, 0.0],
  [0, 92, 58, 26, -5, 0.02],
  [1, 108, 84, 32, 8, 0.02],
  [1, 120, 60, 30, 4, 0.05],
  [2, 148, 84, 30, -6, 0.04],
  [2, 168, 66, 24, 6, 0.06],
  [0, 182, 84, 24, 5, 0.06],
];

const CROWN: Puff[] = [
  // Belly and back — the shaded underside, its edge deliberately uneven.
  [4, 56, 90, 19, -6, 0.0],
  [0, 80, 103, 14, 9, 0.03],
  [1, 112, 99, 21, -4, 0.06],
  [2, 145, 104, 15, 6, 0.12],
  [3, 173, 94, 17, -8, 0.2],
  [0, 42, 80, 13, 12, 0.02],
  // Middle body. Tone tracks the sun: it sits off at (320, 58), so every
  // value brightens to the right and upward, and the left flank stays in
  // its own shade.
  [1, 68, 76, 20, -10, 0.12],
  [2, 96, 72, 15, 5, 0.24],
  [0, 128, 78, 20, -6, 0.34],
  [4, 159, 79, 16, 9, 0.46],
  [3, 190, 78, 18, -5, 0.56],
  [1, 52, 60, 14, 6, 0.16],
  // The lit shoulder of the crown.
  [2, 78, 55, 17, -8, 0.3],
  [0, 108, 50, 15, 6, 0.5],
  [1, 137, 47, 20, -4, 0.7],
  [3, 165, 55, 16, 8, 0.84],
  [4, 197, 62, 17, -6, 0.82],
  [3, 94, 40, 12, 10, 0.5],
  [2, 120, 38, 16, 4, 0.74],
  [0, 148, 34, 15, -6, 0.84],
  [3, 178, 42, 13, -9, 0.99],
  [4, 210, 76, 12, 5, 0.7],
  // Small clusters that fray the outline so the crown never resolves into
  // a chain of equal bumps.
  [3, 34, 90, 9, 20, 0.0],
  [0, 66, 106, 8, -14, 0.02],
  [2, 96, 110, 9, 7, 0.05],
  [4, 130, 112, 8, -5, 0.1],
  [1, 162, 108, 9, 14, 0.16],
  [0, 190, 98, 8, -18, 0.3],
  [2, 214, 88, 8, 9, 0.55],
  [1, 216, 62, 9, -12, 0.76],
  [4, 190, 34, 8, 16, 0.88],
  [3, 132, 26, 9, -10, 0.9],
  [0, 106, 32, 8, 22, 0.6],
  [2, 62, 46, 9, -16, 0.24],
  [1, 32, 68, 8, 11, 0.08],
];

/** Tone 0–1 across the four foliage values. */
function leafTone(t: number, p: number): HSL {
  const a = at("leafShadow", p);
  const b = at("leafMid", p);
  const c = at("leafLit", p);
  const d = at("leafHot", p);
  if (t < 0.34) return mix(a, b, t / 0.34);
  if (t < 0.68) return mix(b, c, (t - 0.34) / 0.34);
  return mix(c, d, (t - 0.68) / 0.32);
}

// ─── LANDSCAPE ─────────────────────────────────────────────

/** A distant treeline: rounded broadleaf crowns with a few narrow spires
 *  between them, heights varied and spacing uneven so it never reads as a
 *  mountain range. Its base tucks under the far hill. */
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
  "M-10 208 C24 205, 56 200, 92 202 C120 204, 144 199, 178 201 C208 203, 232 198, 266 200 C296 202, 322 206, 358 204 C380 203, 398 206, 410 205";

const fillTo = (crest: string) => `${crest} L410 254 L-10 254 Z`;

/** Cloud: thin feathered strands, drawn as long tapering slivers with
 *  frayed ends. Anything thicker than a few units at this scale reads as
 *  a lozenge sitting on the sky rather than as morning cirrus. */
const CLOUD_STRANDS: [string, number][] = [
  ["M238 78 C258 74, 282 72, 306 73 C324 74, 340 75, 350 77 C338 78, 318 77, 298 77 C274 77, 252 79, 238 78 Z", 0.24],
  ["M262 86 C278 83, 300 82, 318 83 C330 84, 340 85, 344 86 C334 87, 318 87, 302 87 C286 87, 270 87, 262 86 Z", 0.17],
  ["M284 97 C294 95, 308 94, 320 95 C329 96, 334 96, 336 97 C328 98, 314 98, 303 98 C293 98, 286 98, 284 97 Z", 0.13],
  ["M222 66 C236 64, 252 63, 266 64 C275 65, 280 65, 282 66 C273 67, 260 67, 249 67 C238 67, 224 67, 222 66 Z", 0.14],
];

/** Two small stands of trees far off on the mid hill, so the right half
 *  of the frame has something between the sun and the flower bed. */
const FAR_STANDS: Puff[] = [
  [2, 244, 149, 7, 0, 0],
  [0, 252, 151, 5, 6, 0],
  [4, 236, 152, 4, -8, 0],
  [3, 296, 147, 6, -4, 0],
  [1, 303, 150, 4.5, 9, 0],
];

/** Low shrubs on the near ground — the foreground needs mass, not just
 *  stems, or the bed reads as a lawn with flowers stuck into it. */
const BUSHES: Puff[] = [
  [1, 20, 179, 13, 0, 0.16],
  [3, 34, 182, 9, 8, 0.24],
  [4, 150, 176, 11, -6, 0.2],
  [0, 162, 179, 8, 5, 0.28],
  [2, 342, 187, 12, 4, 0.18],
  [3, 355, 190, 9, -7, 0.26],
  [1, 240, 173, 8, 3, 0.26],
];

/** Ground blossoms — small specks of colour scattered through the bed, so
 *  "bloom, every waiting flower" reaches past the six tall stems. Kept
 *  dim: texture, not objects. */
const SPECKS: [number, number, number, number][] = [
  [140, 184, 1.6, 340], [198, 190, 1.7, 46], [246, 176, 1.4, 286],
  [284, 186, 1.5, 44], [330, 174, 1.5, 12], [386, 182, 1.4, 346],
  [58, 178, 1.4, 40], [96, 188, 1.6, 350],
];

/** Small stones at the tree's foot. */
const STONES = [
  "M92 192 C90 190, 87 188, 84 189 C81 190, 80 193, 83 194 C86 195, 90 195, 92 192 Z",
  "M158 191 C161 189, 166 188, 168 190 C170 192, 167 195, 163 195 C160 195, 157 193, 158 191 Z",
  "M72 199 C70 197, 67 196, 65 197 C62 199, 64 201, 67 202 C69 202, 73 201, 72 199 Z",
  "M198 187 C201 185, 205 185, 206 187 C207 189, 204 191, 201 191 C199 191, 197 189, 198 187 Z",
];

const GRASS: { x: number; y: number; h: number; n: number; spread: number }[] = [
  { x: 30, y: 184, h: 11, n: 6, spread: 5 },
  { x: 88, y: 198, h: 13, n: 7, spread: 6 },
  { x: 160, y: 180, h: 9, n: 5, spread: 4.5 },
  { x: 214, y: 188, h: 12, n: 6, spread: 5.5 },
  { x: 268, y: 181, h: 10, n: 5, spread: 4.5 },
  { x: 318, y: 192, h: 13, n: 7, spread: 6 },
  { x: 372, y: 178, h: 9, n: 5, spread: 4 },
  { x: 396, y: 190, h: 12, n: 5, spread: 5 },
];

// ─── FLOWERS ───────────────────────────────────────────────

/** Petal in local units: tip up, two soft lobes at the crown. Kept narrow
 *  so five of them leave gaps and read as a flower rather than a disc. */
const PETAL =
  "M0 0 C-0.28 -0.22, -0.50 -0.60, -0.40 -0.88 C-0.31 -1.05, -0.13 -1.14, 0 -1.06 C0.13 -1.14, 0.31 -1.05, 0.40 -0.88 C0.50 -0.60, 0.28 -0.22, 0 0 Z";
/** A closed bud — what waits on the stem through phrase one. */
const BUD =
  "M0 0 C-0.34 -0.16, -0.44 -0.62, -0.20 -0.94 C-0.08 -1.08, 0.08 -1.08, 0.20 -0.94 C0.44 -0.62, 0.34 -0.16, 0 0 Z";
/** Leaf, pointing along +x. */
const LEAF =
  "M0 0 C0.28 -0.36, 0.70 -0.46, 1 -0.32 C0.76 -0.02, 0.38 0.22, 0 0 Z";
/** Flower eye — a small irregular blob, not a perfect disc. */
const EYE =
  "M0 -1 C0.62 -0.92, 1.02 -0.44, 0.94 0.14 C0.86 0.7, 0.36 1.04, -0.16 0.98 C-0.72 0.9, -1.04 0.44, -0.96 -0.16 C-0.9 -0.66, -0.5 -1.02, 0 -1 Z";

interface Flower {
  x: number; base: number; stem: number; bend: number;
  size: number; hue: number; sat: number; lit: number;
  leaf: number; sway: number; spin: number; far?: boolean;
}

/** Nine, at two depths: three small pale ones set back on the mid hill,
 *  six near ones on the bed, two of those to the left of the trunk so the
 *  frame isn't a row along the right edge. */
const FLOWERS: Flower[] = [
  { x: 196, base: 170, stem: 20, bend: -2, size: 4.4, hue: 342, sat: 30, lit: 46, leaf: 1, sway: 3.0, spin: 12, far: true },
  { x: 286, base: 168, stem: 18, bend: 2, size: 4.0, hue: 44, sat: 34, lit: 46, leaf: -1, sway: 3.4, spin: 34, far: true },
  { x: 344, base: 171, stem: 21, bend: -2, size: 4.6, hue: 278, sat: 26, lit: 44, leaf: 1, sway: 2.8, spin: 58, far: true },
  { x: 42, base: 186, stem: 26, bend: 3, size: 6.4, hue: 348, sat: 46, lit: 60, leaf: -1, sway: 4.2, spin: 20 },
  { x: 78, base: 196, stem: 41, bend: -3, size: 7.8, hue: 46, sat: 54, lit: 60, leaf: 1, sway: 4.8, spin: 46 },
  { x: 226, base: 182, stem: 24, bend: -4, size: 6.2, hue: 344, sat: 48, lit: 60, leaf: 1, sway: 3.6, spin: 8 },
  { x: 262, base: 194, stem: 42, bend: 3, size: 8.2, hue: 42, sat: 56, lit: 61, leaf: -1, sway: 4.4, spin: 26 },
  { x: 308, base: 184, stem: 33, bend: -3, size: 6.8, hue: 288, sat: 36, lit: 58, leaf: 1, sway: 3.8, spin: 40 },
  { x: 366, base: 192, stem: 27, bend: 3, size: 7.0, hue: 14, sat: 48, lit: 60, leaf: -1, sway: 5.0, spin: 14 },
];

const STARS = [
  { x: 42, y: 26, r: 0.85, tw: 3.4 }, { x: 96, y: 16, r: 0.6, tw: 0 },
  { x: 168, y: 22, r: 0.75, tw: 4.6 }, { x: 232, y: 15, r: 0.55, tw: 0 },
  { x: 268, y: 34, r: 0.8, tw: 3.9 }, { x: 312, y: 21, r: 0.6, tw: 0 },
  { x: 356, y: 40, r: 0.7, tw: 5.2 }, { x: 386, y: 24, r: 0.5, tw: 0 },
  { x: 20, y: 52, r: 0.55, tw: 0 }, { x: 130, y: 33, r: 0.5, tw: 4.1 },
];

// ─── PALETTE ───────────────────────────────────────────────
// Every colour is [dormant, alive]. Foliage tops out in the low thirties
// for lightness: the Glow layer adds the rest, and the dark corners have
// to stay dark. The spread from leafShadow to leafHot is deliberately
// wide — a narrow spread is what reads as poster paint.

const P = {
  treeBack: [[226, 18, 9], [206, 20, 19]] as [HSL, HSL],
  far: [[186, 10, 11], [130, 24, 22]] as [HSL, HSL],
  mid: [[178, 9, 9], [118, 28, 16]] as [HSL, HSL],
  near: [[168, 8, 7], [108, 32, 11]] as [HSL, HSL],
  earth: [[26, 8, 4], [30, 18, 6]] as [HSL, HSL],
  crest: [[40, 16, 12], [26, 52, 32]] as [HSL, HSL],
  // The trunk stays dark and low-saturation. Warm wood against a cool
  // pre-dawn sky reads far lighter than its numbers suggest; the v1 pass
  // here came out looking bleached.
  trunk: [[26, 5, 7], [28, 17, 13]] as [HSL, HSL],
  bark: [[22, 7, 4], [22, 16, 6]] as [HSL, HSL],
  barkLit: [[30, 9, 10], [36, 30, 21]] as [HSL, HSL],
  leafShadow: [[146, 14, 5], [152, 28, 10]] as [HSL, HSL],
  leafMid: [[138, 12, 8], [128, 30, 16]] as [HSL, HSL],
  leafLit: [[128, 14, 11], [96, 36, 24]] as [HSL, HSL],
  leafHot: [[120, 16, 14], [70, 46, 35]] as [HSL, HSL],
  stem: [[126, 16, 12], [102, 34, 21]] as [HSL, HSL],
};

const at = (k: keyof typeof P, t: number) => mix(P[k][0], P[k][1], t);

// ─── SCENE ─────────────────────────────────────────────────

const POLLEN_CONFIG = {
  count: 20,
  bounds: { x: 140, y: 90, width: 250, height: 90 },
  colors: ["#f6e79a", "#efd77e", "#fbf0b4", "#e2c672"],
  sizeRange: [0.35, 0.9] as [number, number],
  speedRange: [2, 6] as [number, number],
  driftX: 1.2,
  driftY: -3.4,
  lifeRange: [4, 8] as [number, number],
};

/** Sky ramp: [stop offset, colour at p=0, colour at p=1]. The zenith stays
 *  dark at every progress so the top corners never go milky. */
const SKY: [number, HSL, HSL][] = [
  [0.0, [232, 34, 7], [230, 46, 14]],
  [0.35, [240, 30, 9], [252, 36, 20]],
  [0.55, [252, 24, 10], [318, 34, 27]],
  [0.66, [258, 22, 11], [380, 62, 42]],
  [1.0, [262, 20, 9], [374, 48, 20]],
];

/** Pollen in its own memo'd component: `useParticles` notifies ~12×/s,
 *  and called from the scene body it would reconcile the whole canopy at
 *  that rate. Down here only the pollen re-renders. */
const Pollen = memo(function Pollen({ active, alpha }: { active: boolean; alpha: number }) {
  const pollen = useParticles(POLLEN_CONFIG, active);
  return <ParticleField particles={pollen} opacity={alpha} />;
});

function GardenScene({ progress: p }: SceneProps) {

  // ── Phase clocks. Phrase 1 runs 0–0.5, phrase 2 runs 0.5–1. ──
  const rootWake = sub(p, 0.02, 0.34);   // light running out along the roots
  const canopyIn = sub(p, 0.06, 0.40);   // foliage growing in over branches
  const trunkWarm = sub(p, 0.04, 0.42);
  const rim = sub(p, 0.3, 0.5);          // crest rim light
  const sunIn = sub(p, 0.04, 0.5);

  const sunX = 320;
  const sunY = 194 - 136 * p;

  const crest = mix(at("far", p), at("crest", p), rim);
  const crestMid = mix(at("mid", p), at("crest", p), rim * 0.7);
  const crestNear = mix(at("near", p), at("crest", p), rim * 0.5);
  const trunkFill = css(at("trunk", trunkWarm));
  const canopyScale = 0.8 + 0.2 * canopyIn;
  // The bare skeleton recedes as the leaves take it over.
  const boneFade = 1 - 0.72 * canopyIn;

  return (
    <svg
      viewBox="0 0 400 250"
      overflow="hidden"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <GlowFilter id="gdnRootGlow" radius={1.4} color="#bde88a" opacity={0.45} />

        <linearGradient id="gdnSky" x1="0" y1="0" x2="0" y2="1">
          {SKY.map(([off, a, b]) => (
            <stop key={off} offset={`${off * 100}%`} stopColor={css(mix(a, b, p))} />
          ))}
        </linearGradient>

        {/* Hills: a warm crest melting into the body of the band, so the
            rim light is air rather than a drawn contour line. */}
        <linearGradient id="gdnFar" gradientUnits="userSpaceOnUse" x1="0" y1="136" x2="0" y2="176">
          <stop offset="0%" stopColor={css(crest)} />
          <stop offset="26%" stopColor={css(at("far", p))} />
          <stop offset="100%" stopColor={css(mix(at("far", p), [150, 12, 4], 0.4))} />
        </linearGradient>
        <linearGradient id="gdnMid" gradientUnits="userSpaceOnUse" x1="0" y1="149" x2="0" y2="192">
          <stop offset="0%" stopColor={css(crestMid)} />
          <stop offset="24%" stopColor={css(at("mid", p))} />
          <stop offset="100%" stopColor={css(mix(at("mid", p), [140, 12, 3], 0.45))} />
        </linearGradient>
        <linearGradient id="gdnNear" gradientUnits="userSpaceOnUse" x1="0" y1="163" x2="0" y2="214">
          <stop offset="0%" stopColor={css(crestNear)} />
          <stop offset="22%" stopColor={css(at("near", p))} />
          <stop offset="100%" stopColor={css(mix(at("near", p), [130, 12, 2], 0.5))} />
        </linearGradient>

        {/* The trunk turns: shaded flank on the left, sun-caught edge on
            the right, so it reads as a cylinder rather than a cut-out. */}
        <linearGradient id="gdnTrunk" gradientUnits="userSpaceOnUse" x1="104" y1="0" x2="143" y2="0">
          <stop offset="0%" stopColor={css(at("bark", trunkWarm))} />
          <stop offset="38%" stopColor={trunkFill} />
          <stop offset="82%" stopColor={css(mix(at("trunk", trunkWarm), at("barkLit", trunkWarm), 0.38))} />
          <stop offset="100%" stopColor={css(mix(at("trunk", trunkWarm), at("bark", trunkWarm), 0.5))} />
        </linearGradient>

        <radialGradient id="gdnSunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6de" stopOpacity="1" />
          <stop offset="44%" stopColor="#ffdf9e" stopOpacity="0.94" />
          <stop offset="76%" stopColor="#f9bd6e" stopOpacity="0.44" />
          <stop offset="100%" stopColor="#ef9d55" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gdnSunHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd08a" stopOpacity="0.38" />
          <stop offset="34%" stopColor="#f2a463" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#d8794c" stopOpacity="0" />
        </radialGradient>

      </defs>

      {/* ── SKY ── */}
      <rect x="0" y="0" width="400" height="250" fill="url(#gdnSky)" />

      {/* ── STARS — the night this dawn is replacing ── */}
      <g opacity={0.5 * (1 - sub(p, 0, 0.55))}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#cfd6ff">
            {s.tw > 0 && (
              <animate attributeName="opacity" values="0.35;1;0.5;0.9;0.35"
                dur={`${s.tw}s`} repeatCount="indefinite" />
            )}
          </circle>
        ))}
      </g>

      {/* ── HORIZON BLOOM — squashed flat so it reads as air, not a disc ── */}
      <g transform={`translate(${sunX} 148) scale(1 0.26) translate(${-sunX} -148)`}
        opacity={0.8 * sunIn}>
        <circle cx={sunX} cy={148} r={155} fill="url(#gdnSunHalo)" />
      </g>

      {/* ── THE SUN — rises out from behind the hills ── */}
      <g opacity={sunIn}>
        <circle cx={sunX} cy={sunY} r={56} fill="url(#gdnSunHalo)" />
        <circle cx={sunX} cy={sunY} r={13.5} fill="url(#gdnSunCore)" />
      </g>

      {/* ── CLOUD — thin feathered strands ── */}
      <g opacity={sub(p, 0.34, 0.4)}>
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="-5 0; 5 0; -5 0" dur="38s" repeatCount="indefinite" />
          {CLOUD_STRANDS.map(([d, o], i) => (
            <path key={i} d={d} fill={css(mix([310, 26, 30], [382, 58, 54], p))} opacity={o} />
          ))}
        </g>
      </g>

      {/* ── PLANE 1: distant treeline ── */}
      <path d={TREELINE} fill={css(at("crest", p))} opacity={0.3 * rim}
        transform="translate(0 -1.8)" />
      <path d={TREELINE} fill={css(at("treeBack", p))} />

      {/* ── PLANES 2–4: hills, each with its own rim-to-body ramp ── */}
      <path d={fillTo(CREST_FAR)} fill="url(#gdnFar)" />
      {/* Two small stands far off, sitting on the far hill. */}
      {FAR_STANDS.map(([s, x, y, r, rot], i) => (
        <path key={`fs${i}`} d={PUFFS[s]}
          fill={css(mix(at("treeBack", p), at("mid", p), 0.5))}
          transform={`translate(${x} ${y}) rotate(${rot}) scale(${r})`} />
      ))}
      <path d={fillTo(CREST_MID)} fill="url(#gdnMid)" />
      <path d={fillTo(CREST_NEAR)} fill="url(#gdnNear)" />

      {/* ── THE TREE: bare structure first, then leaves over it ── */}
      <g>
        <g opacity={boneFade}>
          {TWIGS.map((d, i) => (
            <path key={`t${i}`} d={d} fill={css(at("bark", trunkWarm))} />
          ))}
          {FORKS.map((d, i) => (
            <path key={`f${i}`} d={d} fill={trunkFill} />
          ))}
        </g>
        <path d={TRUNK} fill="url(#gdnTrunk)" />
        {/* The flank turned away from the sun. */}
        <path d={TRUNK_SHADE} fill={css(at("bark", trunkWarm))} opacity={0.45} />
        {BARK_FLAKES.map((d, i) => (
          <path key={`bf${i}`} d={d}
            fill={css(mix(at("trunk", trunkWarm), at(i % 2 ? "bark" : "barkLit", trunkWarm), 0.4))}
            opacity={0.42} />
        ))}
        {BARK_DARK.map((d, i) => (
          <path key={`bd${i}`} d={d} fill="none" stroke={css(at("bark", trunkWarm))}
            strokeWidth={i > 5 ? 0.55 : 1.1} strokeLinecap="round"
            opacity={0.55 + 0.3 * trunkWarm} />
        ))}
        <path d={KNOT} fill={css(at("bark", trunkWarm))} opacity={0.9} />
        <path d={KNOT_LIP} fill="none" stroke={css(at("barkLit", trunkWarm))}
          strokeWidth={0.7} strokeLinecap="round" opacity={0.3 + 0.4 * trunkWarm} />
        {BARK_LIT.map((d, i) => (
          <path key={`bl${i}`} d={d} fill="none" stroke={css(at("barkLit", trunkWarm))}
            strokeWidth={1.2 - i * 0.3} strokeLinecap="round"
            opacity={0.3 + 0.5 * trunkWarm} />
        ))}
      </g>

      {/* ── SURFACE ROOTS — a bright head runs OUT from the trunk ── */}
      <g>
        {ROOTS.map((r, i) => {
          const t = sub(p, 0.03 + i * 0.045, 0.26);
          return (
            <path key={`rb${i}`} d={r.body}
              fill={css(mix([26, 10, 4], [30, 20, 11], t))} />
          );
        })}
      </g>
      <g filter="url(#gdnRootGlow)">
        {ROOTS.map((r, i) => {
          const t = sub(p, 0.03 + i * 0.045, 0.26);
          if (t <= 0 || t >= 1) return null;
          // A short bright segment travelling from trunk to tip, then gone.
          return (
            <path key={`rl${i}`} d={r.line} fill="none"
              stroke={css([76, 60, 62])} strokeWidth={0.9} strokeLinecap="round"
              pathLength={1} strokeDasharray="0.14 1"
              strokeDashoffset={0.14 - t * 1.14}
              opacity={0.85 * Math.sin(Math.PI * t) + 0.1} />
          );
        })}
      </g>
      {/* The wood keeps a low ember once the light has passed through. */}
      <g opacity={0.3 * rootWake}>
        {ROOTS.map((r, i) => (
          <path key={`re${i}`} d={r.line} fill="none"
            stroke={css([64, 40, 40])} strokeWidth={0.5} strokeLinecap="round"
            pathLength={1} strokeDasharray="1 1"
            strokeDashoffset={1 - sub(p, 0.03 + i * 0.045, 0.26)} />
        ))}
      </g>

      {/* ── CANOPY — twenty leaf clusters stacked dark to light ── */}
      <g opacity={canopyIn}
        transform={`translate(${(116 * (1 - canopyScale)).toFixed(2)} ${(126 * (1 - canopyScale)).toFixed(2)}) scale(${canopyScale.toFixed(3)})`}>
        <g>
          <animateTransform attributeName="transform" type="rotate"
            values="-0.4 116 132; 0.4 116 132; -0.4 116 132"
            dur="14s" repeatCount="indefinite" />
          {/* Narrow and lift the whole crown: laid out flat it reads as a
              mushroom cap, which is a shape this project has rejected
              before. Squeezing x and stretching y gives it a head. */}
          <g transform="translate(120 83) scale(0.85 1.1) translate(-120 -78)">
          {CROWN_BASE.map(([s, x, y, r, rot, tone], i) => (
            <path key={`b${i}`} d={PUFFS[s]} fill={css(leafTone(tone, p))}
              transform={`translate(${x} ${y}) rotate(${rot}) scale(${r})`} />
          ))}
          {CROWN.map(([s, x, y, r, rot, tone], i) => {
            const under = css(leafTone(Math.max(0, tone - 0.13), p));
            const face = css(leafTone(tone, p));
            return (
              <g key={`p${i}`}>
                {/* Each cluster casts a hair of shade on the one behind it. */}
                <path d={PUFFS[s]} fill={under}
                  transform={`translate(${x - 0.4} ${y + 1.4}) rotate(${rot}) scale(${r})`} />
                <path d={PUFFS[s]} fill={face}
                  transform={`translate(${x} ${y}) rotate(${rot}) scale(${r})`} />
              </g>
            );
          })}
          </g>
        </g>
      </g>

      {/* ── FOREGROUND EARTH ── */}
      <path d={fillTo(CREST_EARTH)} fill={css(at("earth", p))} />

      {/* ── LOW SHRUBS on the near ground ── */}
      <g>
        {BUSHES.map(([s, x, y, r, rot, tone], i) => {
          const t = sub(p, 0.1 + i * 0.02, 0.34);
          if (t <= 0) return null;
          return (
            <g key={`bu${i}`}>
              <path d={PUFFS[s]} fill={css(leafTone(tone, p))}
                transform={`translate(${x} ${y}) rotate(${rot}) scale(${(r * t).toFixed(2)})`} />
              <path d={PUFFS[s]} fill={css(leafTone(tone + 0.34, p))} opacity={0.7}
                transform={`translate(${x + 2.5} ${y - 2}) rotate(${rot}) scale(${(r * t * 0.5).toFixed(2)})`} />
            </g>
          );
        })}
      </g>

      {/* ── STONES ── */}
      <g opacity={0.35 + 0.35 * p}>
        {STONES.map((d, i) => (
          <path key={i} d={d} fill={css(mix([28, 5, 9], [30, 9, 17], p))} />
        ))}
      </g>

      {/* ── GRASS ── */}
      <g>
        {GRASS.map((g, gi) => {
          const t = sub(p, 0.08 + gi * 0.028, 0.3);
          if (t <= 0) return null;
          return (
            <g key={`g${gi}`} opacity={0.4 + 0.55 * t}>
              <animateTransform attributeName="transform" type="rotate"
                values={`-1.2 ${g.x} ${g.y}; 1.2 ${g.x} ${g.y}; -1.2 ${g.x} ${g.y}`}
                dur={`${4.2 + (gi % 3) * 0.8}s`} repeatCount="indefinite" />
              {Array.from({ length: g.n }).map((_, bi) => {
                const f = bi / (g.n - 1) - 0.5;
                return (
                  <path key={bi}
                    d={blade(
                      g.x + f * g.spread * 2,
                      g.y + Math.abs(f) * 1.2,
                      g.h * t * (1 - Math.abs(f) * 0.35),
                      f * 6 + (bi % 2 ? 1 : -1),
                      0.5,
                    )}
                    fill={css(mix(at("stem", p), at("leafLit", p), bi / g.n))} />
                );
              })}
            </g>
          );
        })}
      </g>

      {/* ── FLOWERS — stems and buds in phrase 1, the bloom in phrase 2 ── */}
      {FLOWERS.map((f, i) => {
        const grow = sub(p, 0.16 + i * 0.02, 0.26);
        if (grow <= 0) return null;
        const open = sub(p, 0.5 + i * 0.035, 0.18);
        const eased = 1 - Math.pow(1 - open, 3);
        const pop = eased * (1 + 0.14 * Math.sin(Math.PI * open));
        const hx = f.x + f.bend * grow;
        const hy = f.base - f.stem * grow;
        const midY = (f.base + hy) / 2;
        const stemCol = css(mix(at("stem", p), at("mid", p), f.far ? 0.55 : 0));
        const petal: HSL = [f.hue, lerp(f.sat * 0.5, f.sat, open), lerp(f.lit * 0.55, f.lit, open)];
        const petalLow: HSL = [f.hue - 5, f.sat * 0.9, f.lit * 0.58];
        const budCol: HSL = [f.hue - 10, lerp(16, f.sat * 0.6, grow), lerp(16, 28, grow)];
        const leafT = sub(p, 0.22 + i * 0.02, 0.24);

        return (
          <g key={`fl${i}`} opacity={f.far ? 0.65 : 1}>
            <animateTransform attributeName="transform" type="rotate"
              values={`${-f.sway * 0.55} ${f.x} ${f.base}; ${f.sway * 0.55} ${f.x} ${f.base}; ${-f.sway * 0.55} ${f.x} ${f.base}`}
              dur={`${f.sway + 1.6}s`} repeatCount="indefinite" />

            {/* Stem — one curved, tapered closed path */}
            <path
              d={`M${f.x - 0.6} ${f.base}
                  C${f.x - 0.5 + f.bend * 0.35} ${midY + 3}, ${hx - 0.9} ${hy + 7}, ${hx - 0.4} ${hy}
                  L${hx + 0.4} ${hy}
                  C${hx + 0.9} ${hy + 7}, ${f.x + 0.7 + f.bend * 0.35} ${midY + 3}, ${f.x + 0.6} ${f.base} Z`}
              fill={stemCol} />

            {!f.far && leafT > 0 && (
              <path d={LEAF} fill={stemCol}
                transform={`translate(${f.x + f.bend * 0.4} ${midY + 2}) rotate(${f.leaf > 0 ? -24 : 204}) scale(${(7 * leafT).toFixed(2)})`} />
            )}

            {open < 1 && (
              <path d={BUD} fill={css(budCol)} opacity={1 - eased}
                transform={`translate(${hx} ${hy + f.size * 0.25}) rotate(${f.bend * 0.8}) scale(${(f.size * 0.6 * grow).toFixed(2)})`} />
            )}

            {open > 0 && (
              <g opacity={Math.min(1, open * 2.2)}>
                {/* Lower petals in the shaded tone, upper petals over them
                    in the lit tone. Alternating tones read as a pinwheel. */}
                {[0, 1, 2, 3, 4].map((j) => {
                  const ang = f.spin + j * 72;
                  const norm = ((ang % 360) + 360) % 360;
                  const lower = norm > 100 && norm < 260;
                  const len = f.size * pop * (0.94 + ((j + i) % 3) * 0.05);
                  return (
                    <path key={j} d={PETAL} fill={css(lower ? petalLow : petal)}
                      transform={`translate(${hx} ${hy}) rotate(${ang}) scale(${len.toFixed(2)})`} />
                  );
                })}
                <path d={EYE} fill={css([46, 60, lerp(34, 56, open)])}
                  transform={`translate(${hx} ${hy}) scale(${(f.size * 0.19 * pop).toFixed(2)})`} />
              </g>
            )}
          </g>
        );
      })}

      {/* ── GROUND BLOSSOMS — the bed answering the bed ── */}
      {SPECKS.map(([x, y, r, hue], i) => {
        const t = sub(p, 0.56 + i * 0.026, 0.16);
        if (t <= 0) return null;
        return (
          <g key={`sp${i}`} opacity={0.5 * t}>
            {[0, 1, 2, 3, 4].map((j) => (
              <path key={j} d={PETAL} fill={css([hue, 38, lerp(28, 52, t)])}
                transform={`translate(${x} ${y}) rotate(${j * 72 + i * 11}) scale(${(r * t).toFixed(2)})`} />
            ))}
          </g>
        );
      })}

      {/* ── POLLEN ── */}
      {p > 0.5 && <Pollen active={p > 0.5} alpha={0.26 * sub(p, 0.5, 0.25)} />}
    </svg>
  );
}

export default memo(GardenScene);
