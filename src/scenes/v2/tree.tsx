import { memo } from "react";
import { sub } from "../util";
import type { SceneProps } from "../../types";
import { GlowFilter } from "../../svg/filters";
import { useParticles } from "../../hooks/useParticles";
import ParticleField from "../../components/ParticleField";

// ─── THE GREAT TREE (Inkwood 2 redraw) ─────────────────────
//
// The game's climax. One ancient tree seen from the forest floor at
// dusk: a black silhouette against a faintly luminous sky, then lit
// from inside by its own heart.
//
// Three incantations, three transformations:
//   "roots deeper than memory"    → the buttress roots spread out of
//        the dark and light runs along them to the edge of the world,
//        continuing under the soil as ley threads.
//   "branches wider than sky"     → the canopy grows outward from the
//        fork, clump by clump, until the crown leaves the frame.
//   "awaken, heart of all things" → the hollow ignites, the grain
//        around it warms, and inside the hollow there is one small
//        light for every scribe who wrote this forest awake — two of
//        them already climbing toward the crown.
//
// Depth: two rows of far treeline and drifting mist behind, the tree
// in the middle plane, undergrowth and grass in the near dark. Foliage is
// built from overlapping clumps in three tone bands (shade at the
// undersides, body in the middle, lit along the top) so the canopy
// reads as layered depth rather than a green band.
//
// Dormant (p=0): bare limbs and twigs, roots still hidden in the
// dark, the hollow a black wound. No canopy at all.

// ─── TRUNK ────────────────────────────────────────────────
// One continuous forking path. Up the left flank, out along the left
// limb's underside, round the tip, back along its top edge into the
// crotch, up the leader and down again, out and back along the right
// limb, down the right flank, across the buried base.
const TRUNK = `
  M118 190
  C126 180, 136 174, 145 168
  C152 163, 158 158, 162 152
  C165 146, 167 140, 168 133
  C169 126, 169 121, 170 116
  C163 114, 157 112, 150 109
  C143 106, 137 103, 130 98
  C122 92, 116 87, 110 82
  C103 75, 96 68, 90 62
  C85 56, 80 51, 75 48
  C72 45, 71 41, 74 40
  C79 44, 85 48, 90 52
  C97 57, 104 62, 110 66
  C117 72, 124 77, 130 82
  C137 87, 144 90, 150 93
  C158 96, 168 98, 177 98
  C178 82, 179 62, 180 42
  C181 26, 182 10, 183 -6
  C184 -11, 189 -12, 192 -8
  C194 -4, 195 4, 196 14
  C198 32, 201 52, 204 70
  C207 84, 211 94, 216 100
  C224 95, 232 91, 240 88
  C249 83, 257 78, 265 74
  C274 69, 282 65, 290 62
  C298 58, 306 55, 312 52
  C318 49, 323 46, 327 43
  C330 42, 332 45, 329 49
  C322 54, 315 58, 308 63
  C300 69, 292 75, 285 81
  C277 88, 269 95, 262 101
  C254 107, 246 112, 240 116
  C237 118, 234 119, 232 118
  C233 126, 234 133, 236 140
  C238 147, 241 153, 245 159
  C250 166, 257 172, 264 178
  C270 183, 275 187, 281 190
  C255 187, 228 185, 200 185
  C170 185, 143 187, 118 190
  Z`;

/** Sky-lit band down the left flank. */
const TRUNK_LIT = `
  M118 190
  C126 180, 136 174, 145 168
  C152 163, 158 158, 162 152
  C165 146, 167 140, 168 133
  C169 126, 169 121, 170 116
  L176 118
  C175 124, 174 131, 173 139
  C171 147, 168 154, 163 161
  C157 169, 148 176, 138 183
  C132 187, 127 189, 124 191
  Z`;

/** Shadow band down the right flank. */
const TRUNK_SHADE = `
  M281 190
  C275 187, 270 183, 264 178
  C257 172, 250 166, 245 159
  C241 153, 238 147, 236 140
  C234 133, 233 126, 232 118
  L225 120
  C226 128, 227 136, 230 143
  C232 151, 236 158, 241 165
  C247 173, 255 180, 263 186
  C269 190, 273 192, 276 193
  Z`;

/** Grooves between the buttresses — what keeps the base a root flare
 *  and not a cone. */
const BUTTRESS = [
  "M136 190 C142 180, 148 172, 153 164 L157 166 C152 174, 146 182, 141 191 Z",
  "M160 191 C164 182, 167 175, 170 167 L174 169 C171 177, 168 184, 165 192 Z",
  "M188 190 C189 182, 190 175, 190 168 L194 168 C194 175, 193 182, 192 190 Z",
  "M215 190 C214 182, 213 175, 213 168 L217 168 C217 175, 218 182, 219 190 Z",
  "M242 191 C238 182, 235 175, 232 167 L236 169 C239 177, 242 184, 245 192 Z",
  "M266 190 C260 180, 254 172, 249 164 L245 166 C250 174, 256 182, 261 191 Z",
];

/** Bark ridges — tapered slivers, never uniform strokes. The outer
 *  pair follow the buttress flare, the rest run with the grain. */
const BARK = [
  // kept short and clear of the hollow — long ridges either side of it
  // turn the heart into a lit doorway
  "M176 178 C174 168, 177 158, 175 148 C173 140, 176 134, 175 130 L179 130 C180 134, 177 140, 179 148 C181 158, 178 168, 180 178 Z",
  "M226 174 C228 164, 224 154, 226 144 C228 136, 225 130, 227 126 L231 127 C229 131, 232 137, 230 144 C228 154, 232 164, 230 174 Z",
  "M132 184 C140 176, 148 168, 154 158 C158 152, 161 146, 163 140 L167 142 C165 148, 162 154, 158 160 C152 170, 144 178, 137 186 Z",
  "M266 184 C258 176, 250 168, 244 158 C240 152, 237 146, 235 140 L231 142 C233 148, 236 154, 240 160 C246 170, 254 178, 261 186 Z",
  "M196 180 C194 172, 197 166, 195 160 L199 160 C200 166, 197 172, 199 180 Z",
  "M208 178 C210 170, 207 164, 209 158 L213 159 C211 164, 214 170, 212 178 Z",
  "M160 176 C164 168, 169 160, 172 152 L175 154 C172 161, 168 169, 164 177 Z",
  "M240 174 C236 166, 231 158, 228 150 L231 149 C234 157, 239 165, 243 173 Z",
  // grain up the leader, so the column above the fork isn't a slab
  "M186 96 C185 82, 187 68, 186 54 C185 42, 187 30, 186 20 L189 20 C190 30, 188 42, 189 54 C190 68, 188 82, 189 96 Z",
  "M204 96 C205 82, 203 68, 204 56 C205 44, 203 32, 204 22 L207 23 C206 32, 208 44, 207 56 C206 68, 208 82, 207 96 Z",
  "M196 128 C195 118, 197 108, 196 100 L199 100 C200 108, 198 118, 199 128 Z",
  // and along the two great limbs
  "M120 84 C126 90, 133 95, 140 99 L138 102 C131 98, 124 93, 118 87 Z",
  "M280 74 C274 79, 267 84, 260 89 L262 92 C269 87, 276 82, 282 77 Z",
];

/** Knots and burls. */
const KNOTS = [
  "M176 126 C172 123, 171 119, 175 116 C179 115, 182 118, 181 122 C180 125, 178 127, 176 126 Z",
  "M234 154 C238 151, 241 153, 240 157 C239 161, 235 163, 232 160 C230 158, 231 155, 234 154 Z",
  "M198 90 C195 88, 194 85, 197 83 C200 82, 203 84, 202 87 C201 89, 200 91, 198 90 Z",
];

// ─── LIMBS ────────────────────────────────────────────────
/** Secondary branches — closed tapered paths off the three limbs. */
const BRANCHES = [
  "M132 88 C124 78, 114 68, 102 60 C96 56, 90 52, 84 49 L82 52 C89 55, 95 59, 101 64 C112 72, 121 82, 128 92 Z",
  "M152 104 C148 94, 143 84, 137 74 C133 68, 129 62, 125 57 L122 59 C126 64, 130 70, 134 77 C139 87, 144 97, 148 107 Z",
  "M180 64 C172 56, 162 48, 150 42 C144 39, 137 36, 131 34 L130 37 C137 39, 143 42, 149 46 C160 52, 169 60, 176 68 Z",
  "M185 24 C190 16, 198 10, 208 6 C214 3, 220 2, 226 1 L226 4 C220 5, 214 7, 209 10 C200 15, 192 21, 188 28 Z",
  "M204 66 C212 58, 222 51, 234 46 C240 43, 246 41, 252 40 L252 43 C246 45, 240 47, 235 50 C224 56, 214 63, 208 70 Z",
  "M252 94 C248 84, 244 74, 240 64 C237 58, 234 52, 231 47 L228 49 C231 54, 234 60, 237 67 C241 77, 245 87, 248 97 Z",
  "M286 68 C293 60, 302 54, 313 50 C319 47, 325 45, 331 44 L331 47 C325 49, 319 51, 314 54 C304 59, 296 66, 291 72 Z",
  "M274 78 C270 70, 267 62, 265 54 C263 49, 262 45, 261 41 L258 42 C259 46, 260 51, 262 57 C265 65, 268 73, 271 81 Z",
];

/** Fine twigs — thin strokes, the way the intro trees do it. */
const TWIGS = [
  "M80 50 C74 46, 68 43, 61 41",
  "M82 53 C77 58, 71 61, 64 63",
  "M84 49 C79 44, 73 41, 66 39",
  "M125 57 C120 51, 114 47, 107 44",
  "M131 34 C126 29, 120 26, 113 24",
  "M190 4 C185 -1, 179 -4, 172 -6",
  "M226 2 C232 0, 238 -1, 245 -1",
  "M252 41 C258 37, 265 34, 272 33",
  "M228 48 C223 43, 217 40, 210 38",
  "M331 45 C337 42, 343 40, 350 39",
  "M316 43 C322 39, 329 37, 336 36",
  "M258 42 C253 37, 247 34, 240 32",
  "M105 62 C99 57, 93 54, 86 52",
  "M150 44 C145 39, 139 36, 132 34",
  "M204 70 C210 65, 217 61, 225 59",
  "M240 66 C235 61, 229 58, 222 56",
  "M187 30 C183 24, 178 20, 172 17",
  "M199 44 C204 39, 210 35, 217 33",
];

// ─── ROOTS ────────────────────────────────────────────────
/** Buttress roots, hugging the ground. Two run to the frame edges,
 *  two lift clear of the soil before diving, the rest sink away. */
const ROOTS = [
  `M164 162 C146 163, 128 168, 108 173 C88 178, 66 181, 46 181
   C32 181, 16 180, 2 182 L2 186 C16 184, 32 185, 46 185
   C66 185, 88 184, 108 180 C128 176, 146 174, 166 180 Z`,
  `M166 168 C150 176, 132 184, 112 189 C94 193, 74 195, 56 196
   L56 201 C74 200, 94 198, 114 194 C136 190, 156 184, 174 182 Z`,
  `M160 172 C146 180, 132 189, 120 200 C110 210, 103 219, 98 228
   L106 232 C111 222, 118 212, 128 202 C140 190, 154 182, 168 178 Z`,
  `M162 164 C148 158, 132 157, 118 162 C106 166, 96 173, 82 177
   L82 183 C96 179, 108 172, 120 168 C132 164, 146 165, 158 172 Z`,
  `M236 162 C254 163, 272 168, 292 173 C312 178, 334 181, 354 181
   C368 181, 384 180, 398 182 L398 186 C384 184, 368 185, 354 185
   C334 185, 312 184, 292 180 C272 176, 254 174, 234 180 Z`,
  `M234 168 C250 176, 268 184, 288 189 C306 193, 326 195, 344 196
   L344 201 C326 200, 306 198, 286 194 C264 190, 244 184, 226 182 Z`,
  `M240 172 C254 180, 268 189, 280 200 C290 210, 297 219, 302 228
   L294 232 C289 222, 282 212, 272 202 C260 190, 246 182, 232 178 Z`,
  `M238 164 C252 158, 268 157, 282 162 C294 166, 304 173, 318 177
   L318 183 C304 179, 292 172, 280 168 C268 164, 254 165, 242 172 Z`,
  `M204 176 C196 184, 186 192, 174 198 C164 203, 154 206, 144 208
   L144 213 C155 211, 166 208, 177 202 C190 195, 200 187, 208 180 Z`,
];

/** Ley filaments — the light that runs out along each root and keeps
 *  going. Stroked centrelines, drawn by dash offset with progress. */
const LEY = [
  "M164 170 C146 172, 128 176, 108 178 C88 181, 66 183, 46 183 C32 183, 16 182, 2 184",
  "M168 174 C152 181, 134 188, 112 191 C94 195, 74 196, 56 198",
  "M164 176 C150 184, 136 193, 124 203 C114 213, 107 221, 102 230",
  "M160 168 C146 162, 132 161, 119 165 C107 169, 97 176, 82 180",
  "M236 170 C254 171, 272 176, 292 178 C312 182, 334 183, 354 183 C368 183, 384 182, 398 184",
  "M232 172 C248 180, 266 188, 287 192 C305 196, 325 197, 344 198",
  "M236 176 C250 184, 264 193, 276 203 C286 213, 293 221, 298 230",
  "M240 168 C254 162, 270 161, 283 165 C295 169, 305 176, 318 180",
];

/** Where each filament ends — the tip lights. */
const LEY_TIPS: [number, number][] = [
  [3, 184], [56, 198], [102, 230], [82, 180],
  [397, 184], [344, 198], [298, 230], [318, 180],
];

/** Root threads seen through the soil, below the frame's waistline. */
const DEEP_ROOTS = [
  "M186 186 C180 198, 172 210, 166 222 C162 230, 159 238, 157 246",
  "M199 188 C198 202, 200 216, 198 230 C197 238, 195 244, 194 250",
  "M212 186 C219 198, 228 209, 236 220 C242 228, 246 236, 249 244",
  "M170 192 C158 202, 144 212, 132 224 C124 232, 118 240, 113 248",
  "M228 192 C242 201, 256 211, 268 223 C277 232, 284 240, 289 248",
  "M152 198 C138 208, 122 216, 106 226 C96 232, 87 238, 79 245",
  "M246 199 C260 208, 276 217, 291 227 C301 234, 310 240, 317 246",
];

// ─── CANOPY ───────────────────────────────────────────────
// Foliage is built from overlapping clumps rather than one blob per
// mass: six hand-drawn lobed silhouettes, placed 24 times at varied
// scale and flip across three tone bands. Shade clumps sit low and
// outside, body clumps fill, lit clumps ride the top edge, so the
// overlaps do the shading instead of concentric copies.
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

interface Leaf {
  x: number;
  y: number;
  s: number;
  /** -1 flips the clump so no shape repeats visibly. */
  f: 1 | -1;
  shape: number;
  /** 0 shade (undersides), 1 body, 2 lit (top edge). */
  tone: 0 | 1 | 2;
}

const FOLIAGE: Leaf[] = [
  // shade — the underside of the crown, hanging lower at the edges
  { x: 54, y: 72, s: 0.85, f: -1, shape: 4, tone: 0 },
  { x: 84, y: 66, s: 0.95, f: 1, shape: 2, tone: 0 },
  { x: 118, y: 58, s: 1.05, f: -1, shape: 1, tone: 0 },
  { x: 160, y: 50, s: 1.1, f: 1, shape: 3, tone: 0 },
  { x: 200, y: 48, s: 1.15, f: -1, shape: 5, tone: 0 },
  { x: 240, y: 50, s: 1.1, f: 1, shape: 0, tone: 0 },
  { x: 282, y: 58, s: 1.05, f: -1, shape: 2, tone: 0 },
  { x: 316, y: 66, s: 0.95, f: 1, shape: 4, tone: 0 },
  { x: 346, y: 72, s: 0.85, f: -1, shape: 1, tone: 0 },
  // body — the belly of the crown
  { x: 48, y: 52, s: 0.85, f: 1, shape: 1, tone: 1 },
  { x: 76, y: 41, s: 0.95, f: -1, shape: 0, tone: 1 },
  { x: 112, y: 31, s: 1.05, f: 1, shape: 3, tone: 1 },
  { x: 155, y: 23, s: 1.15, f: -1, shape: 2, tone: 1 },
  { x: 200, y: 20, s: 1.25, f: 1, shape: 5, tone: 1 },
  { x: 245, y: 23, s: 1.15, f: -1, shape: 4, tone: 1 },
  { x: 288, y: 31, s: 1.05, f: 1, shape: 0, tone: 1 },
  { x: 324, y: 41, s: 0.95, f: -1, shape: 1, tone: 1 },
  { x: 352, y: 52, s: 0.85, f: 1, shape: 3, tone: 1 },
  // lit — the top of the dome, where the sky reaches it
  { x: 44, y: 26, s: 0.8, f: -1, shape: 3, tone: 2 },
  { x: 72, y: 15, s: 0.9, f: 1, shape: 2, tone: 2 },
  { x: 110, y: 5, s: 1.0, f: -1, shape: 5, tone: 2 },
  { x: 150, y: -3, s: 1.1, f: 1, shape: 1, tone: 2 },
  { x: 200, y: -6, s: 1.2, f: -1, shape: 4, tone: 2 },
  { x: 250, y: -3, s: 1.1, f: 1, shape: 0, tone: 2 },
  { x: 290, y: 5, s: 1.0, f: -1, shape: 5, tone: 2 },
  { x: 328, y: 15, s: 0.9, f: 1, shape: 2, tone: 2 },
  { x: 356, y: 26, s: 0.8, f: -1, shape: 3, tone: 2 },
  // sprigs breaking the top silhouette so the crown is never a dome cap
  { x: 128, y: -6, s: 0.45, f: 1, shape: 3, tone: 2 },
  { x: 172, y: -16, s: 0.5, f: -1, shape: 4, tone: 2 },
  { x: 226, y: -18, s: 0.45, f: 1, shape: 1, tone: 2 },
  { x: 270, y: -8, s: 0.5, f: -1, shape: 3, tone: 2 },
  { x: 92, y: -2, s: 0.36, f: 1, shape: 4, tone: 2 },
  { x: 310, y: 0, s: 0.36, f: -1, shape: 1, tone: 2 },
  // tufts fraying the outer and lower edge — a smooth crown edge is
  // what makes foliage read as cloud
  { x: 30, y: 40, s: 0.34, f: -1, shape: 3, tone: 1 },
  { x: 374, y: 38, s: 0.34, f: 1, shape: 4, tone: 1 },
  { x: 42, y: 62, s: 0.3, f: 1, shape: 1, tone: 0 },
  { x: 74, y: 79, s: 0.32, f: -1, shape: 4, tone: 0 },
  { x: 154, y: 73, s: 0.3, f: 1, shape: 3, tone: 0 },
  { x: 246, y: 74, s: 0.3, f: -1, shape: 1, tone: 0 },
  { x: 322, y: 79, s: 0.32, f: 1, shape: 3, tone: 0 },
  { x: 362, y: 60, s: 0.3, f: -1, shape: 4, tone: 0 },
];

/** The canopy grows outward from the fork. */
const FORK_X = 200;
const FORK_Y = 104;

// ─── THE HOLLOW ───────────────────────────────────────────
const HOLLOW = `
  M198 114
  C193 116, 190 121, 189 127
  C188 132, 191 135, 189 140
  C187 145, 184 149, 185 154
  C186 159, 190 163, 196 164
  C201 165, 206 162, 209 157
  C212 152, 211 146, 212 140
  C213 134, 211 128, 208 123
  C205 118, 202 113, 198 114
  Z`;

/** The overhang under the top lip — what keeps the hollow a hole in a
 *  body and not a lit oval. */
const HOLLOW_OVERHANG = `
  M198 114 C193 116, 190 121, 189 127 C188 131, 190 133, 189 137
  C193 133, 197 129, 203 128 C208 127, 211 129, 212 133
  C212 129, 210 124, 208 121 C205 117, 202 113, 198 114 Z`;

/** The near lip, where the light inside falls on torn wood. */
const HOLLOW_LIP = `
  M186 156 C187 160, 191 163, 196 164
  C201 165, 206 162, 209 157
  L206 154 C203 158, 199 160, 195 159
  C191 158, 189 157, 188 154 Z`;

/** Bark ridges close enough to the hollow to catch its light. Warming
 *  the wood the tree already has beats drawing new lines: cracks
 *  radiating from the heart read as a cartoon starburst. */
const HEART_LIT_BARK = [4, 5, 6, 7];

/** One light for every scribe: the ten level accents. Two have drifted
 *  out of the hollow and are climbing the trunk toward the canopy. */
const SCRIBES: { x: number; y: number; r: number; c: string; dur: number; dx: number; dy: number }[] = [
  { x: 196, y: 133, r: 0.9, c: "#8ac98a", dur: 11, dx: 1.2, dy: -2.6 },
  { x: 203, y: 138, r: 0.75, c: "#eeb262", dur: 9, dx: -1.3, dy: -2.0 },
  { x: 192, y: 142, r: 0.85, c: "#a6a6f6", dur: 13, dx: 1.6, dy: -1.6 },
  { x: 202, y: 147, r: 0.7, c: "#76c8c8", dur: 10, dx: -1.0, dy: -2.4 },
  { x: 195, y: 151, r: 0.95, c: "#96bd8c", dur: 12, dx: 0.9, dy: -3.0 },
  { x: 205, y: 154, r: 0.7, c: "#cfa4c2", dur: 8.5, dx: -1.5, dy: -1.8 },
  { x: 190, y: 155, r: 0.8, c: "#a2bcd6", dur: 14, dx: 1.3, dy: -2.2 },
  { x: 199, y: 158, r: 0.9, c: "#dcc98c", dur: 9.5, dx: -0.8, dy: -2.8 },
  // risen — climbing the trunk toward the crown
  { x: 200, y: 104, r: 1.0, c: "#f0dfae", dur: 16, dx: 2.0, dy: -5.0 },
  { x: 204, y: 78, r: 0.85, c: "#eddcaa", dur: 18, dx: -2.2, dy: -6.0 },
];

/** Glints among the leaves once the heart is lit: x, y, twinkle period. */
const GLINTS: [number, number, number][] = [
  [58, 44, 3.1], [92, 32, 4.2], [118, 58, 3.6], [136, 18, 5.0],
  [162, 38, 3.4], [178, 10, 4.6], [150, 64, 3.9], [196, 24, 4.1],
  [214, 6, 5.2], [232, 34, 3.3], [250, 16, 4.4], [246, 60, 3.7],
  [272, 42, 4.0], [292, 22, 3.5], [308, 54, 4.8], [334, 36, 3.2],
  [356, 46, 4.5], [110, 66, 3.8], [286, 70, 4.3], [204, 64, 3.6],
];

/** Ground mist — hand-drawn banks, slowly drifting. */
const MIST = [
  "M-20 168 C10 163, 40 170, 70 166 C100 162, 130 169, 160 165 C190 161, 220 168, 250 164 C280 160, 310 167, 340 163 C370 159, 400 166, 430 162 L430 184 L-20 184 Z",
  "M-20 176 C20 171, 60 178, 100 174 C140 170, 180 177, 220 173 C260 169, 300 176, 340 172 C380 168, 410 175, 430 171 L430 192 L-20 192 Z",
];

/** Undergrowth in the near dark — the same foliage vocabulary, small
 *  and almost black, so the corners have a foreground plane. */
const BUSHES: { x: number; y: number; s: number; f: 1 | -1; shape: number }[] = [
  { x: 16, y: 200, s: 0.62, f: 1, shape: 2 },
  { x: 56, y: 210, s: 0.5, f: -1, shape: 4 },
  { x: 386, y: 198, s: 0.62, f: -1, shape: 0 },
  { x: 344, y: 209, s: 0.5, f: 1, shape: 5 },
  { x: 118, y: 228, s: 0.45, f: 1, shape: 1 },
  { x: 274, y: 232, s: 0.45, f: -1, shape: 3 },
];

// Floor stones were tried here and cut: at this scale any rounded
// low shape on the ground reads as a plate, not a rock. The near
// plane carries undergrowth and grass instead.

const GRASS = [
  "M118 186 C120 180, 122 176, 125 172", "M132 188 C133 182, 133 177, 132 173",
  "M146 189 C149 183, 152 179, 156 175", "M266 186 C264 180, 262 176, 259 172",
  "M280 188 C279 182, 279 178, 280 174", "M294 189 C291 183, 288 179, 284 176",
  "M58 186 C60 180, 62 176, 65 172", "M72 187 C71 181, 70 177, 69 173",
  "M324 185 C322 179, 320 175, 317 172", "M340 187 C341 181, 342 177, 343 173",
  "M204 186 C205 180, 207 176, 210 173", "M188 187 C186 181, 185 177, 183 174",
  "M96 188 C97 182, 99 178, 102 175", "M310 188 C309 182, 307 178, 304 175",
];

const LEAF_SPARKS = {
  count: 24,
  bounds: { x: 46, y: 2, width: 308, height: 64 },
  colors: ["#dfe9c6", "#c6d8ae", "#f0e2b4", "#aec295"],
  sizeRange: [0.3, 0.85] as [number, number],
  speedRange: [1.6, 4] as [number, number],
  driftX: 0.4,
  driftY: -1.6,
  lifeRange: [3, 6] as [number, number],
};

const smooth = (t: number) => t * t * (3 - 2 * t);

function TreeScene({ progress: p }: SceneProps) {
  const rootPhase = sub(p, 0.02, 0.31);
  const branchPhase = sub(p, 0.34, 0.32);
  const heartPhase = sub(p, 0.67, 0.33);

  const sparksOn = heartPhase > 0.15;
  const sparks = useParticles(LEAF_SPARKS, sparksOn);

  // ── Palette ──
  // The sky stays cool the whole way; every drop of warmth comes from
  // the tree itself, so the heart reads as the only fire in the world.
  const skyTop = `hsl(206, ${22 + p * 6}%, ${9 + p * 2}%)`;
  const skyMid = `hsl(197, ${19 + p * 8}%, ${14 + p * 3}%)`;
  const skyLow = `hsl(187, ${17 + p * 10}%, ${18 + p * 4}%)`;

  // Wood swings from cold grey-green to warm brown as the tree wakes,
  // and stays darker than the sky so the silhouette always holds.
  const woodHue = 152 - p * 124;
  const woodSat = 7 + p * 13;
  // Most of the wood's lift waits for the heart: through the first two
  // phrases the tree stays a dark body against a lighter sky.
  const woodL = 4.5 + p * 2.5 + heartPhase * 4;
  const wood = `hsl(${woodHue}, ${woodSat}%, ${woodL}%)`;
  const woodLit = `hsl(${woodHue + 4}, ${woodSat + 6}%, ${woodL + 5 + heartPhase * 4}%)`;
  const woodShade = `hsl(${woodHue - 8}, ${woodSat}%, ${Math.max(3, woodL - 2.5)}%)`;

  // The ley light starts green-gold and warms toward the heart's own
  // colour, so by the climax the whole tree burns in one key.
  const leyColor = `hsl(${94 + rootPhase * 14 - heartPhase * 30}, ${34 + rootPhase * 18}%, ${30 + rootPhase * 14}%)`;
  const leyCore = `hsl(${76 - heartPhase * 26}, ${46 - heartPhase * 6}%, ${76 - heartPhase * 4}%)`;

  // Roots sit against the soil, not the sky, so they carry their own
  // (lighter) three tones or they vanish into the ground.
  const rootFill = `hsl(${woodHue + 4}, ${woodSat}%, ${woodL + 1.5}%)`;
  const rootLit = `hsl(${woodHue + 8}, ${woodSat + 6}%, ${woodL + 4.5}%)`;
  const rootShadow = `hsl(200, 10%, ${Math.max(2.5, 4 + p)}%)`;

  // The forest floor catches the last of the sky, so it stays lighter
  // than the wood — every part of the tree reads as a silhouette.
  const earth = `hsl(${192 - p * 14}, ${13 + p * 3}%, ${10 + p * 2}%)`;
  const earthLine = `hsl(${176 - p * 30}, ${15 + p * 8}%, ${14 + p * 4}%)`;

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="treeHeartGlow" radius={7} color="#f4c176" opacity={0.5} />

        <linearGradient id="treeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="58%" stopColor={skyMid} />
          <stop offset="100%" stopColor={skyLow} />
        </linearGradient>

        <radialGradient id="treeHorizon" cx="50%" cy="70%" r="62%">
          <stop offset="0%" stopColor={`hsl(180, 22%, ${17 + p * 5}%)`} stopOpacity={0.45} />
          <stop offset="100%" stopColor="hsl(200, 20%, 8%)" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="treeHeartCore" cx="50%" cy="52%" r="50%">
          <stop offset="0%" stopColor="#ffeec6" stopOpacity={0.85} />
          <stop offset="26%" stopColor="#f3bd6c" stopOpacity={0.6} />
          <stop offset="62%" stopColor="#cf8434" stopOpacity={0.34} />
          <stop offset="100%" stopColor="#6b3a12" stopOpacity={0.08} />
        </radialGradient>

        <radialGradient id="treeHeartBleed" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eaa858" stopOpacity={0.22} />
          <stop offset="45%" stopColor="#d68f42" stopOpacity={0.07} />
          <stop offset="100%" stopColor="#b8752c" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="treeTip" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dcebae" stopOpacity={0.5} />
          <stop offset="45%" stopColor="#9ec880" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#6ea060" stopOpacity={0} />
        </radialGradient>

        {/* The hollow's mouth clips the fire inside it. */}
        <clipPath id="treeHollowClip"><path d={HOLLOW} /></clipPath>
        {/* The ley light lives inside the wood, never in the air above
            it — the root bodies clip every filament. */}
        <clipPath id="treeRootBodies">
          {ROOTS.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
        {/* Roots reveal outward from the base as the first phrase lands. */}
        <clipPath id="treeRootReveal">
          <ellipse cx="200" cy="178" rx={26 + smooth(rootPhase) * 250} ry={16 + smooth(rootPhase) * 120} />
        </clipPath>
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="250" fill="url(#treeSky)" />
      <rect width="400" height="250" fill="url(#treeHorizon)" />

      {/* ── FAR TREELINE — two receding rows ── */}
      <path
        fill={`hsl(196, ${14 + p * 6}%, ${11 + p * 3}%)`}
        d="M0 174 L0 162 C5 161, 7 154, 11 158 C14 161, 16 156, 20 159
           C24 162, 26 152, 31 157 C35 161, 38 156, 42 160
           C46 163, 49 151, 54 156 C58 160, 61 157, 65 161
           C69 164, 72 153, 77 158 C81 162, 85 158, 89 161
           C93 164, 96 150, 101 155 C105 159, 109 157, 113 160
           C117 163, 120 152, 125 157 C129 161, 133 158, 137 161
           C141 164, 144 149, 149 154 C153 158, 157 156, 161 160
           C165 163, 168 151, 173 156 C177 160, 181 158, 185 161
           C189 164, 192 153, 197 157 C201 161, 205 158, 209 161
           C213 164, 216 150, 221 155 C225 159, 229 157, 233 160
           C237 163, 240 152, 245 157 C249 161, 253 158, 257 161
           C261 164, 264 149, 269 154 C273 158, 277 157, 281 160
           C285 163, 288 152, 293 157 C297 161, 301 158, 305 161
           C309 164, 312 151, 317 156 C321 160, 325 158, 329 161
           C333 164, 336 150, 341 155 C345 159, 349 157, 353 160
           C357 163, 360 152, 365 157 C369 161, 373 158, 377 161
           C381 164, 384 154, 388 158 C392 161, 396 160, 400 162 L400 174 Z"
      />
      <path
        fill={`hsl(192, ${13 + p * 5}%, ${7 + p * 2}%)`}
        d="M0 180 L0 170 C6 169, 11 158, 18 165 C23 170, 27 164, 33 168
           C39 172, 43 157, 51 163 C57 168, 62 165, 68 169
           C74 173, 79 156, 87 162 C93 167, 98 164, 104 168
           C110 172, 115 159, 122 164 C128 168, 133 166, 139 169
           C145 172, 150 158, 158 163 C164 167, 169 166, 175 169
           C181 172, 186 160, 193 165 C199 169, 204 167, 210 170
           C216 173, 221 157, 229 163 C235 168, 240 166, 246 169
           C252 172, 257 159, 264 164 C270 168, 275 167, 281 170
           C287 173, 292 158, 300 163 C306 167, 311 166, 317 169
           C323 172, 328 160, 335 165 C341 169, 346 167, 352 170
           C358 173, 363 159, 371 164 C377 168, 382 167, 388 170
           C393 172, 397 171, 400 172 L400 180 Z"
      />

      {/* ── GROUND MIST — far, slow, hand-drawn banks ── */}
      {MIST.map((d, i) => (
        <path key={`mist${i}`} d={d} fill={`hsl(190, 16%, ${17 + p * 4}%)`} opacity={0.15 + p * 0.05}>
          <animateTransform
            attributeName="transform" type="translate"
            values={i === 0 ? "0 0; 9 -1; 0 0" : "0 0; -8 1; 0 0"}
            dur={i === 0 ? "34s" : "44s"} repeatCount="indefinite"
          />
        </path>
      ))}

      {/* ── EARTH ── */}
      <path
        fill={earth}
        d="M0 176 C22 172, 44 174, 66 171 C88 168, 110 172, 132 170
           C150 168, 168 172, 188 171 C210 170, 232 173, 254 170
           C276 167, 298 172, 320 169 C342 166, 364 171, 386 168
           C392 167, 396 168, 400 167 L400 250 L0 250 Z"
      />
      <path
        fill={`hsl(190, 11%, ${8 + p * 2}%)`} opacity={0.6}
        d="M0 198 C30 194, 60 200, 92 196 C124 192, 154 199, 186 196
           C218 193, 248 200, 280 196 C312 192, 344 199, 376 195
           C386 194, 394 195, 400 194 L400 250 L0 250 Z"
      />
      <path
        fill={`hsl(186, 10%, ${6 + p * 2}%)`} opacity={0.7}
        d="M0 224 C34 219, 68 226, 104 221 C140 216, 174 224, 210 220
           C246 216, 282 224, 318 219 C348 215, 376 221, 400 218 L400 250 L0 250 Z"
      />

      {/* ── DEEP ROOTS — seen through the soil, under everything ── */}
      <g clipPath="url(#treeRootReveal)">
        {DEEP_ROOTS.map((d, i) => {
          const t = sub(rootPhase, 0.25 + i * 0.06, 0.5);
          if (t <= 0) return null;
          return (
            <g key={`deep${i}`}>
              <path d={d} fill="none" stroke={earthLine} strokeWidth={3.4 - i * 0.3} strokeLinecap="round" opacity={t * 0.4} />
              <path d={d} fill="none" stroke={leyColor} strokeWidth={0.5} strokeLinecap="round" opacity={t * 0.15} />
            </g>
          );
        })}
      </g>

      {/* soil lip, buried before the roots lie down on top of it */}
      <path
        fill={earth} opacity={0.92}
        d="M104 250 C104 198, 130 180, 168 177 C186 175, 214 175, 232 177
           C270 180, 296 198, 296 250 Z"
      />
      <path
        fill="none" stroke={earthLine} strokeWidth={0.7} opacity={0.45}
        d="M110 202 C116 188, 138 179, 168 177 C186 175, 214 175, 232 177
           C262 179, 286 188, 292 202"
      />

      {/* ── BUTTRESS ROOTS + LEY, spreading outward from the base ── */}
      <g clipPath="url(#treeRootReveal)">
        {/* cast shadow, body, sky-lit top edge */}
        {ROOTS.map((d, i) => {
          const t = sub(rootPhase, i * 0.055, 0.42);
          if (t <= 0) return null;
          return (
            <g key={`root${i}`} opacity={0.4 + t * 0.6}>
              <path d={d} fill={rootShadow} transform="translate(0.6 2.4)" />
              <path d={d} fill={rootFill} />
              <path d={d} fill={rootLit} transform="translate(-0.4 -1.2)" opacity={0.4 + t * 0.2} />
            </g>
          );
        })}

        {/* the light running out along them — clipped to the wood, so
            it reads as light inside a root, not a wire in the air */}
        <g clipPath="url(#treeRootBodies)">
          {LEY.map((d, i) => {
            const t = sub(rootPhase, 0.18 + i * 0.055, 0.5);
            if (t <= 0) return null;
            return (
              <g key={`ley${i}`}>
                <path d={d} fill="none" stroke={leyColor} strokeWidth={3} strokeLinecap="round"
                  pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} opacity={t * 0.16} />
                <path d={d} fill="none" stroke={leyCore} strokeWidth={0.7} strokeLinecap="round"
                  pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} opacity={t * 0.21} />
              </g>
            );
          })}
        </g>

        {/* tip lights */}
        {LEY_TIPS.map(([x, y], i) => {
          const t = sub(rootPhase, 0.5 + i * 0.045, 0.3);
          if (t <= 0) return null;
          return (
            <g key={`tip${i}`} opacity={t}>
              <circle cx={x} cy={y} r={5} fill="url(#treeTip)" opacity={0.3} />
              <circle cx={x} cy={y} r={0.8} fill={leyCore} opacity={0.45}>
                <animate attributeName="opacity" values="0.55;0.28;0.55" dur={`${5 + i * 0.7}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </g>

      {/* ── TRUNK ── */}
      <path d={TRUNK} fill={wood} />
      <path d={TRUNK_SHADE} fill={woodShade} opacity={0.85} />
      <path d={TRUNK_LIT} fill={woodLit} opacity={0.4 + p * 0.15} />
      <g opacity={0.55 + p * 0.25}>
        {BUTTRESS.map((d, i) => (
          <path key={`but${i}`} d={d} fill={woodShade} opacity={0.85} />
        ))}
      </g>
      <g opacity={0.7 + p * 0.2}>
        {BARK.map((d, i) => (
          <path key={`bark${i}`} d={d} fill={i % 2 === 0 ? woodShade : woodLit} opacity={i % 2 === 0 ? 0.85 : 0.55} />
        ))}
        {KNOTS.map((d, i) => (
          <path key={`knot${i}`} d={d} fill={woodShade} opacity={0.8} />
        ))}
      </g>

      {/* ── LIMBS ── */}
      {BRANCHES.map((d, i) => (
        <g key={`br${i}`}>
          <path d={d} fill={woodShade} transform="translate(0.6 1.4)" opacity={0.7} />
          <path d={d} fill={wood} />
        </g>
      ))}
      <g stroke={woodShade} fill="none" strokeLinecap="round" opacity={0.9}>
        {TWIGS.map((d, i) => (
          <path key={`tw${i}`} d={d} strokeWidth={i % 3 === 0 ? 1 : 0.65} />
        ))}
      </g>

      {/* ── THE HOLLOW — a black wound until the heart takes ── */}
      <path d={HOLLOW} fill={`hsl(200, 12%, ${3 + heartPhase * 1.5}%)`} />
      {heartPhase > 0 && (
        <>
          <g clipPath="url(#treeHollowClip)">
            {/* the fire sits low in the hollow, not centred in it */}
            <ellipse
              cx={198} cy={150}
              rx={8 + heartPhase * 5} ry={12 + heartPhase * 7}
              fill="url(#treeHeartCore)" opacity={0.4 + heartPhase * 0.34}
            >
              <animate
                attributeName="ry"
                values={`${12 + heartPhase * 8};${14 + heartPhase * 9};${12 + heartPhase * 8}`}
                dur="6s" repeatCount="indefinite"
              />
            </ellipse>
            {/* the overhang keeps the top of the hollow in shadow */}
            <path d={HOLLOW_OVERHANG} fill="#0a0c0d" opacity={0.85} />
          </g>
          {/* torn wood at the near lip, catching what spills out */}
          <path d={HOLLOW_LIP} fill="#e8b06a" opacity={heartPhase * 0.28} />
        </>
      )}

      {/* the grain around the hollow warms as the heart takes */}
      {heartPhase > 0.1 && HEART_LIT_BARK.map((idx, i) => {
        const t = sub(heartPhase, 0.1 + i * 0.06, 0.4);
        if (t <= 0) return null;
        return <path key={`hb${i}`} d={BARK[idx]} fill="#e8ac62" opacity={t * 0.07} />;
      })}

      {/* the scribes */}
      {heartPhase > 0.08 && SCRIBES.map((s, i) => {
        const t = sub(heartPhase, 0.08 + i * 0.075, 0.22);
        if (t <= 0) return null;
        return (
          <g key={`sc${i}`} opacity={t}>
            <g>
              <animateTransform
                attributeName="transform" type="translate"
                values={`0 0; ${s.dx} ${s.dy * 0.5}; ${-s.dx * 0.6} ${s.dy}; ${s.dx * 0.4} ${s.dy * 0.4}; 0 0`}
                dur={`${s.dur}s`} repeatCount="indefinite"
              />
              <circle cx={s.x} cy={s.y} r={s.r * 2.6} fill={s.c} opacity={0.11} filter="url(#treeHeartGlow)" />
              <circle cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={0.7} />
              <circle cx={s.x - s.r * 0.25} cy={s.y - s.r * 0.25} r={s.r * 0.38} fill="#fff8e6" opacity={0.6} />
            </g>
          </g>
        );
      })}

      {/* ── CANOPY — grows outward from the fork on phrase two ── */}
      {branchPhase > 0 && [0, 1].map((group) => (
        <g key={`sway${group}`}>
          <animateTransform
            attributeName="transform" type="rotate"
            values={group === 0
              ? `-0.45 ${FORK_X} ${FORK_Y}; 0.45 ${FORK_X} ${FORK_Y}; -0.45 ${FORK_X} ${FORK_Y}`
              : `0.7 ${FORK_X} ${FORK_Y}; -0.7 ${FORK_X} ${FORK_Y}; 0.7 ${FORK_X} ${FORK_Y}`}
            dur={group === 0 ? "13s" : "9.5s"} repeatCount="indefinite"
          />
          {FOLIAGE.map((c, i) => {
            if (i % 2 !== group) return null;
            // clumps nearer the fork fill in first
            const reach = Math.hypot(c.x - FORK_X, (c.y - FORK_Y) * 0.8) / 210;
            const t = sub(branchPhase, reach * 0.5, 0.42);
            if (t <= 0) return null;
            const g = 0.1 + 0.9 * smooth(t);
            const jitter = ((i * 37) % 5) - 2;
            const warm = heartPhase * (c.tone === 0 ? 1 : c.tone === 1 ? 0.6 : 0.3);
            // Wide tone bands. Measured on screen, anything narrower
            // than this and the crown flattens into one green shape.
            const hue = [152, 140, 126][c.tone] - warm * 16;
            const sat = [16, 24, 31][c.tone] + heartPhase * 4;
            const lig = [4.5, 11, 19][c.tone] + heartPhase * 3 + jitter * 0.6;
            return (
              <g key={`leaf${i}`} transform={`translate(${FORK_X} ${FORK_Y}) scale(${g.toFixed(3)}) translate(${-FORK_X} ${-FORK_Y})`}>
                <path
                  d={CLUMPS[c.shape]}
                  fill={`hsl(${hue.toFixed(1)}, ${sat.toFixed(1)}%, ${lig.toFixed(1)}%)`}
                  opacity={0.72 + t * 0.28}
                  transform={`translate(${c.x} ${c.y}) scale(${c.s * c.f} ${c.s})`}
                />
              </g>
            );
          })}
        </g>
      ))}

      {/* glints among the leaves */}
      {heartPhase > 0.2 && GLINTS.map(([x, y, dur], i) => {
        const t = sub(heartPhase, 0.2 + (i % 7) * 0.07, 0.25);
        if (t <= 0) return null;
        return (
          <circle key={`gl${i}`} cx={x} cy={y} r={0.6 + (i % 3) * 0.22} fill="#f2e8bc" opacity={t * 0.5}>
            <animate attributeName="opacity" values={`${t * 0.12};${t * 0.5};${t * 0.12}`} dur={`${dur}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      {sparksOn && <ParticleField particles={sparks} opacity={0.3 * heartPhase} />}

      {/* ── HEART BLEED — the tree's own light on the air around it ── */}
      {heartPhase > 0 && (
        <ellipse cx={199} cy={138} rx={72} ry={62} fill="url(#treeHeartBleed)" opacity={heartPhase * 0.34} />
      )}

      {/* ── NEAR DARK — undergrowth and grass in the foreground ── */}
      <g fill={`hsl(${186 - p * 20}, 12%, ${4 + p * 1.5}%)`}>
        {BUSHES.map((b, i) => (
          <path key={`bush${i}`} d={CLUMPS[b.shape]}
            transform={`translate(${b.x} ${b.y}) scale(${b.s * b.f} ${b.s})`} />
        ))}
      </g>
      <g stroke={`hsl(${170 - p * 40}, 12%, ${8 + p * 3}%)`} fill="none" strokeWidth={0.85} strokeLinecap="round" opacity={0.8}>
        {GRASS.map((d, i) => <path key={`gr${i}`} d={d} />)}
      </g>
    </svg>
  );
}

export default memo(TreeScene);
