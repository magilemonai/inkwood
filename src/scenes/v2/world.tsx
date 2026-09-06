import { memo } from "react";
import { sub } from "../util";
import type { SceneProps } from "../../types";
import { GlowFilter } from "../../svg/filters";

// ─── THE WAKING WORLD (Inkwood 2 — full redraw) ────────────
//
// The finale. One panorama that has to hold the whole game: every place
// the player woke, seen at once from a hill above the valley, and the
// ley web that finally ties them to each other.
//
// THE NIGHT IS ALREADY HERE. The sky is the same night the game has
// been under since the Night Sky: fixed from p=0, untouched by the
// first two incantations. Only the dawn moves it. The player never
// watches the sky get darker; the earth wakes under it, then the stars
// are struck into it, then the morning comes.
//
//   "garden bloom, hearth burn bright"  (p 0–0.33) — THE EARTH.
//       The three depths come up out of a blue-black dormancy into
//       green, the garden crowns itself in the near meadow, the cottage
//       window catches and its chimney draws, the well fills, the
//       lanterns come back to the bridge, the stream starts to run out
//       of the gully.
//   "stars remember, spirits sing"      (p 0.33–0.66) — THE SKY.
//       Into that already-dark sky: stars ignite in a sweep across it,
//       the moon climbs over the eastern hill, the named constellation
//       draws itself, the sanctum's pool takes the moonlight, and the
//       spirits and wisps come up out of the valley last, so the
//       phrase keeps changing to its final letter.
//   "the forest remembers"              (p 0.66–1) — THE WORLD.
//       The Great Tree RISES: the trunk climbs out of the ridge, the
//       limbs come with it, the crown fills clump by clump, and only
//       when it is whole do the twenty-one ley threads draw. The heart
//       ignites, the standing stones come back to the meadow, and the
//       dawn breaks behind the ridge.
//
// DEPTH. Three planes, each in three tones (lit crest, body, shade),
// with mist banked between them:
//     far ridge    crest y  86–108   palest, blue-hazed, its own treeline
//     mid hills    crest y 120–140   the well, the bridge, the sanctum,
//                                    the cottage
//     near meadow  crest y 165–178   the garden, the standing stones,
//                                    the flowers and grass
// A stream comes down out of the gully under the bridge and runs at the
// viewer, so the eye is led from the near corner back up to the Tree.
//
// THE GRAPH IS NOT UP FOR DISCUSSION. LEY_POINTS and LEY_CONNECTIONS
// below are byte-identical to src/scenes/WorldScene.tsx — seven nodes,
// twenty-one connections, a complete graph. Every callback is drawn on
// its own node's coordinates, so the web ties places together and not
// abstract dots.
//
// THE ENDING. Dawn is the default: the horizon swells peach into gold
// behind the ridge, the top of the sky deepens to violet, the moon
// pales, the low stars wash out, the threads go gold-white, and every
// callback throws a long soft shadow away from the light.
// The finale ends at dawn (director's ruling 2026-09-06).

const hsl = (h: number, s: number, l: number) =>
  `hsl(${h.toFixed(1)}, ${Math.max(0, s).toFixed(1)}%, ${Math.max(0, l).toFixed(1)}%)`;

// ─── THE THREE DEPTHS ─────────────────────────────────────
// Each ridge is drawn twice: the path itself in the lit tone, then the
// same path nudged down and filled with a body-to-shade gradient. A
// crisp rim of light along the crest, and everything under it falling
// smoothly away — three tones per mass without the contour-map banding
// that three flat copies gives you.

/** Far ridge — the distant range the Great Tree stands on. */
const RIDGE_FAR = `
  M0 106
  C24 101, 44 96, 66 93
  C86 90, 102 95, 120 98
  C138 101, 154 97, 170 93
  C184 90, 194 95, 206 96
  C222 97, 234 90, 250 86
  C266 82, 280 87, 296 91
  C312 95, 326 91, 342 88
  C360 85, 380 91, 400 95
  L400 250 L0 250 Z`;

/** Mid hills — the well, the gully, the sanctum, the cottage. The dip
 *  around x=170 is the gully the bridge spans and the stream leaves. */
const HILLS_MID = `
  M0 146
  C18 143, 34 141, 52 139
  C68 137, 82 136, 96 134
  C110 133, 122 132, 134 132
  C142 132, 146 134, 152 135
  C160 136, 166 137, 172 137
  C180 137, 188 135, 196 133
  C210 130, 222 133, 234 133
  C248 133, 262 130, 276 126
  C288 123, 300 120, 314 120
  C330 120, 344 124, 358 126
  C374 128, 388 128, 400 128
  L400 250 L0 250 Z`;

/** Near meadow — the ground the player is standing on. */
const MEADOW = `
  M0 176
  C16 174, 30 176, 46 178
  C62 180, 74 178, 90 176
  C106 174, 118 172, 134 171
  C150 170, 164 172, 180 173
  C198 174, 214 172, 230 170
  C248 168, 264 166, 280 165
  C298 164, 314 167, 330 169
  C346 171, 366 170, 384 168
  C392 167, 396 167, 400 167
  L400 250 L0 250 Z`;

/** The stream out of the gully, tapering toward the viewer. Drawn over
 *  the meadow so it reads as water running downhill at the frame edge. */
const STREAM = `
  M173 137 C170 142, 167 146, 164 150
  C160 156, 157 160, 154 164
  C149 170, 145 175, 141 180
  C134 187, 128 193, 123 198
  C115 205, 108 212, 102 218
  C93 226, 86 234, 79 240
  C74 245, 69 249, 65 252
  L27 252 C33 249, 39 245, 45 240
  C54 234, 65 226, 74 218
  C82 212, 94 205, 101 198
  C107 193, 118 187, 125 180
  C130 175, 137 170, 142 164
  C145 160, 152 156, 156 150
  C159 146, 164 142, 167 137 Z`;

/** Light lying on the water — flow lines, as in the Well's river. */
const STREAM_LINES = [
  "M170 139 C164 150, 156 162, 146 174 C134 189, 118 205, 100 222",
  "M166 141 C160 152, 151 165, 141 178 C128 194, 112 210, 92 228",
  "M162 143 C157 153, 148 166, 137 180 C124 197, 106 214, 86 234",
];

/** Mist banked between the depths. Never a wash — always a shape. */
const MIST_HIGH = [
  `M0 112 C34 106, 62 116, 98 110 C136 104, 168 115, 206 109
   C244 103, 282 114, 320 108 C352 103, 378 111, 400 107
   L400 121 C370 126, 340 118, 302 123 C262 128, 226 120, 186 125
   C146 130, 106 122, 66 127 C42 130, 20 124, 0 127 Z`,
  `M0 126 C40 122, 76 131, 118 126 C158 121, 190 130, 232 125
   C272 120, 308 129, 346 124 C372 121, 388 127, 400 124
   L400 134 C376 138, 348 132, 312 136 C270 141, 234 134, 194 138
   C152 142, 112 135, 72 139 C44 142, 22 137, 0 139 Z`,
];

const MIST_LOW = `
  M0 156 C38 152, 74 160, 116 155 C156 150, 190 159, 232 154
  C272 149, 310 157, 348 152 C374 149, 388 154, 400 152
  L400 164 C378 168, 348 162, 312 166 C270 171, 234 164, 194 168
  C152 172, 112 165, 72 169 C44 172, 22 167, 0 169 Z`;

// ─── FOLIAGE ──────────────────────────────────────────────
// The same idiom as the Garden and the Great Tree: four hand-drawn,
// deliberately lopsided leaf-cluster silhouettes in unit coordinates,
// stacked back to front and dark to light. Overlapping clusters give
// real dapple; one blob per tree never does.

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
];

/** A conifer in unit coordinates: base at the origin, one unit tall,
 *  with the ragged skirt that makes it a fir and not a triangle. */
const FIR = `M0 0 C-0.32 -0.04, -0.52 -0.09, -0.44 -0.15
  C-0.3 -0.16, -0.36 -0.2, -0.31 -0.27
  C-0.2 -0.29, -0.27 -0.35, -0.2 -0.43
  C-0.12 -0.47, -0.17 -0.56, -0.1 -0.67
  C-0.06 -0.79, -0.02 -0.92, 0 -1
  C0.02 -0.92, 0.06 -0.79, 0.1 -0.67
  C0.17 -0.56, 0.12 -0.47, 0.2 -0.43
  C0.27 -0.35, 0.2 -0.29, 0.31 -0.27
  C0.36 -0.2, 0.3 -0.16, 0.44 -0.15
  C0.52 -0.09, 0.32 -0.04, 0 0 Z`;

/** A five-lobed flower head in unit coordinates. */
const FLOWER = `M0 -1 C0.52 -1.12, 0.98 -0.66, 0.86 -0.16
  C1.28 0.16, 1.06 0.78, 0.55 0.86
  C0.36 1.28, -0.36 1.28, -0.55 0.86
  C-1.06 0.78, -1.28 0.16, -0.86 -0.16
  C-0.98 -0.66, -0.52 -1.12, 0 -1 Z`;

/** [shape, x, y, radius, rotation, tone]. Tone 0 is the deepest shade,
 *  1 is the edge the sky is actually reaching. */
type Puff = [number, number, number, number, number, number];

// ─── THE GREAT TREE, centre, on node (200,40) ──────────────
// A shade mass first, so the gaps between the detail clusters read as
// leaves in the dark rather than as holes to the sky; then the body;
// then the shoulder the sky is on. The crown runs off the top edge.

// Listed lowest-first: the crown grows out of the fork, so the shade
// mass has to arrive in the same order the detail clusters do. Every
// clump here carries tone 0.0, so the reordering is invisible once the
// crown is whole — it only decides which shadow lands first.
const GT_CROWN_BASE: Puff[] = [
  [3, 184, 58, 25, -4, 0.0],
  [0, 216, 58, 25, 5, 0.0],
  [0, 168, 46, 30, -6, 0.0],
  [2, 232, 46, 30, 7, 0.0],
  [1, 200, 34, 34, 4, 0.0],
  [1, 200, 12, 27, -8, 0.0],
];

const GT_CROWN: Puff[] = [
  // Belly and flanks — the underside, its edge deliberately uneven.
  [3, 154, 60, 17, -10, 0.02],
  [2, 178, 67, 14, 6, 0.05],
  [0, 220, 68, 14, -6, 0.08],
  [3, 248, 58, 17, 9, 0.10],
  [1, 144, 48, 16, 5, 0.06],
  [0, 258, 48, 15, -7, 0.12],
  // Body.
  [1, 168, 50, 20, -6, 0.22],
  [3, 200, 52, 20, 8, 0.30],
  [0, 232, 50, 19, -5, 0.26],
  [2, 150, 34, 17, 10, 0.20],
  [3, 250, 34, 17, -9, 0.24],
  // The shoulder the sky is on.
  [2, 176, 30, 20, -5, 0.55],
  [0, 202, 24, 21, 6, 0.72],
  [3, 228, 30, 19, -8, 0.62],
  [1, 188, 8, 17, 9, 0.85],
  [3, 216, 8, 16, -6, 0.80],
  [2, 200, -2, 14, 4, 0.95],
  // Fray, so the outline never resolves into a chain of equal bumps.
  [3, 138, 60, 10, 16, 0.02],
  [0, 262, 58, 10, -14, 0.06],
  [1, 152, 20, 11, -18, 0.30],
  [1, 250, 18, 11, 12, 0.36],
  [2, 172, -4, 10, 8, 0.80],
  [0, 232, -6, 10, -10, 0.70],
];

/** The trunk: one continuous forking silhouette. Up the left flank, out
 *  and back along the left limb, up the leader and down, out and back
 *  along the right limb, down the right flank, across the base. */
const GT_TRUNK = `
  M176 122
  C180 116, 184 110, 187 103
  C190 96, 192 88, 193 80
  C194 72, 194 66, 195 60
  C190 58, 185 55, 180 51
  C174 46, 169 41, 164 36
  C162 34, 163 31, 166 33
  C171 37, 176 42, 181 46
  C185 49, 189 52, 194 54
  C195 47, 196 40, 197 32
  C197 26, 198 20, 199 14
  C199 11, 202 11, 202 14
  C203 21, 204 28, 205 36
  C206 43, 207 49, 208 55
  C213 52, 218 48, 223 43
  C228 38, 232 34, 236 30
  C239 28, 241 31, 238 34
  C233 39, 228 44, 223 49
  C218 54, 213 57, 208 60
  C209 66, 210 72, 211 80
  C212 88, 214 96, 217 103
  C220 110, 224 116, 228 122
  C218 120, 210 119, 202 119
  C194 119, 185 120, 176 122
  Z`;

/** Sky-lit band down the left flank, shadow down the right — the two
 *  tones that keep the trunk from reading as a cut-out. */
const GT_TRUNK_LIT = `
  M176 122 C180 116, 184 110, 187 103
  C190 96, 192 88, 193 80 C194 72, 194 66, 195 60
  L191 59 C190 66, 190 72, 189 80
  C188 88, 186 96, 183 103 C180 110, 177 116, 173 122 Z`;
const GT_TRUNK_SHADE = `
  M228 122 C224 116, 220 110, 217 103
  C214 96, 212 88, 211 80 C210 72, 209 66, 208 60
  L212 59 C213 66, 213 72, 214 80
  C215 88, 217 96, 220 103 C223 110, 226 116, 230 122 Z`;

/** Grooves between the buttresses — what keeps the base a root flare
 *  and not a cone. */
const GT_BUTTRESS = [
  "M182 122 C186 115, 189 109, 191 102 L195.4 103.4 C192.6 110, 189.4 116.4, 187 123 Z",
  "M195 121 C196.4 114, 196.6 108.4, 196.6 102 L200.6 102 C200.6 108.4, 200.4 114, 199.4 121 Z",
  "M209 121 C209 114, 210 108.4, 211.4 102 L215.4 103 C213.6 109.4, 212.4 115, 212.4 122 Z",
  "M222 122 C218.6 115.4, 215.6 109.6, 213 103 L217.2 101.8 C219.8 108.6, 223 115, 226.4 121.6 Z",
];

/** Root flares breaking the base outline — without these the trunk
 *  resolves into a cone, which is what the Great Tree's own redraw was
 *  fixing in the first place. */
const GT_FLARES = [
  "M180 120 C173 121, 166 123, 160 126 C167 122, 174 120, 180 118 Z",
  "M224 120 C231 121, 238 123, 244 126 C237 122, 230 120, 224 118 Z",
  "M186 121.6 C180 124, 175 127, 170 130 C177 126, 183 124, 188 122.4 Z",
  "M218 121.6 C224 124, 229 127, 234 130 C227 126, 221 124, 216 122.4 Z",
];

/** Roots running out of the base into the ridge; light runs along them
 *  once the heart is lit, exactly as it does in the Great Tree. */
const GT_ROOTS = [
  "M180 120 C170 122, 160 125, 149 129",
  "M186 122 C178 126, 170 130, 161 134",
  "M224 120 C234 122, 244 125, 255 129",
  "M218 122 C226 126, 234 130, 243 134",
];

/** The hollow in the trunk. Dark all game; on the last incantation it
 *  is the warmest thing in the valley. */
const GT_HEART = `M200 90 C203.6 91.6, 206 95.4, 206 100
  C206 104.6, 203.4 108, 200 108
  C196.6 108, 194 104.6, 194 100
  C194 95.4, 196.4 91.6, 200 90 Z`;
const GT_HEART_CORE = `M200 93.4 C202.4 94.6, 204 97.2, 204 100
  C204 103, 202.2 105.4, 200 105.4
  C197.8 105.4, 196 103, 196 100
  C196 97.2, 197.6 94.6, 200 93.4 Z`;

// ─── THE GARDEN, near meadow left, on node (45,172) ────────

/** Trunk with the Garden's own lean and taper. */
const GDN_TRUNK = `
  M40 192 C40 185, 41 178, 42 171
  C42 167, 43 163, 43 159
  C42 155, 41 151, 40 148
  L43 147 C44 151, 45 155, 46 159
  C47 155, 49 151, 51 148
  L53 150 C50 154, 48 158, 47 162
  C47 167, 47 174, 48 181
  C48 186, 49 189, 49 192
  C46 191, 43 191, 40 192 Z`;

/** Bare twigs — all there is at p=0, and still there under the crown. */
const GDN_TWIGS = [
  "M44 158 C40 154, 36 150, 31 147",
  "M46 154 C50 150, 55 147, 60 145",
  "M44 166 C39 163, 34 161, 29 160",
  "M47 168 C52 166, 57 165, 62 165",
];

const GDN_CROWN_BASE: Puff[] = [
  [1, 45, 147, 23, 4, 0.0],
  [3, 32, 154, 16, -6, 0.0],
  [0, 58, 153, 16, 7, 0.0],
];

const GDN_CROWN: Puff[] = [
  [2, 45, 160, 12, -5, 0.02],
  [3, 34, 163, 9, 8, 0.0],
  [0, 56, 162, 9, -9, 0.04],
  [2, 33, 149, 12, -8, 0.10],
  [3, 57, 147, 12, 9, 0.20],
  [1, 26, 152, 9, 12, 0.05],
  [3, 64, 150, 9, -12, 0.15],
  [0, 45, 140, 13, 3, 0.38],
  [1, 30, 138, 9, -14, 0.28],
  [3, 60, 136, 9, 10, 0.44],
  [2, 45, 128, 10, 6, 0.62],
  [0, 34, 130, 8, 16, 0.42],
  [1, 56, 129, 8, -11, 0.55],
];

// ─── THE COTTAGE, mid hill right, on node (312,112) ────────

const COT_BODY = `M300 121 C300 115, 300 109, 300 103
  C308 102, 318 102, 326 103
  C326 109, 326 115, 326 121
  C317 122, 308 122, 300 121 Z`;
const COT_ROOF = `M294 105 C300 100, 306 95, 313 90
  C320 95, 326 100, 332 105
  C320 106, 306 106, 294 105 Z`;
const COT_CHIMNEY = "M319 97 L319 86 C321 85, 323 85, 325 86 L325 100 Z";
const COT_WINDOW = "M306 108 L317 108 L317 117 L306 117 Z";
const COT_SMOKE = [
  "M321.5 85 C319 81.6, 322.6 78.6, 321 75.4 C319.6 72.6, 322.4 70.6, 321.8 68",
  "M323 85 C325.4 81.4, 322.4 78.4, 324.6 75 C326 72.6, 324.2 70.6, 325 67.4",
];

// ─── THE WELL, mid hill left, on node (95,128) ─────────────

const WELL_RING = `M85 135 C85 131, 86 128, 88 126
  C92 125, 98 125, 102 126
  C104 128, 105 131, 105 135
  C99 136, 91 136, 85 135 Z`;
const WELL_COURSES = [
  "M86 130 C92 129.2, 98 129.2, 104 130",
  "M85.5 132.6 C92 131.9, 98 131.9, 104.5 132.6",
];
const WELL_POSTS = [
  "M87 126 C87 122, 87.5 118, 88 114 L90.2 114 C89.6 118, 89.2 122, 89.2 126 Z",
  "M103 126 C103 122, 102.5 118, 102 114 L99.8 114 C100.4 118, 100.8 122, 100.8 126 Z",
];
const WELL_ROOF = `M79 116 C84 111, 89 106, 95 101
  C101 106, 106 111, 111 116
  C100 117, 90 117, 79 116 Z`;
const WELL_ROPE = "M95 103 C97 108, 98 113, 96 118 C95 120, 94 122, 95 124";
const WELL_WATER = `M89 127 C92 126.2, 98 126.2, 101 127
  C101 129, 98 130, 95 130 C92 130, 89 129, 89 127 Z`;

// ─── THE BRIDGE, over the gully, on node (165,126) ─────────

const BR_DECK = `M140 114.5 C151 111.5, 161 110.5, 170 110.5
  C179 110.5, 189 111.5, 200 114.5
  L200 119 C189 116, 179 115, 170 115
  C161 115, 151 116, 140 119 Z`;
/** The arch ring — extrados over intrados, a true segmental span, thick
 *  enough to read as cut stone at this distance. */
const BR_ARCH = `M141 139 C141 130, 149 122.6, 161 120.4
  C164 119.9, 176 119.9, 179 120.4
  C191 122.6, 199 130, 199 139
  L191 139 C191 132.8, 185 127.4, 177 125.8
  C174 125.3, 166 125.3, 163 125.8
  C155 127.4, 149 132.8, 149 139 Z`;
/** The dark under the span, so the opening reads as a hole and not as
 *  more hillside. */
const BR_VOID = `M149 139 C149 132.8, 155 127.4, 163 125.8
  C166 125.3, 174 125.3, 177 125.8
  C185 127.4, 191 132.8, 191 139 Z`;
/** Banks, not legs: wedges where the arch meets the ground. */
const BR_ABUTMENTS = [
  "M131 142 C133 135, 136 129, 141 124 L152 126 C147 130, 143 135, 141 142 Z",
  "M209 142 C207 135, 204 129, 199 124 L188 126 C193 130, 197 135, 199 142 Z",
];
/** Voussoir joints, radiating from the arch centre. */
const BR_JOINTS = [
  "M149.6 133 L142 135", "M155 126.8 L151 122.4", "M164 123.4 L163.4 119.8",
  "M176 123.4 L176.6 119.8", "M185 126.8 L189 122.4", "M190.4 133 L198 135",
];
const BR_LANTERNS = [
  { x: 150, y: 108.5 },
  { x: 170, y: 106.5 },
  { x: 190, y: 108.5 },
];

// ─── THE SANCTUM, mid hill centre-right, no node ───────────

const SANCTUM_POOL = `M234 131 C240 128, 247 127, 253 127
  C261 127, 268 129, 270 132
  C266 135, 259 136, 252 136
  C244 136, 237 134, 234 131 Z`;
const SANCTUM_FIRS: [number, number, number][] = [
  [229, 133, 9], [235, 129, 11], [243, 126, 12], [252, 124, 13],
  [261, 125, 12], [268, 128, 10], [274, 133, 9],
];

// ─── THE LIBRARY, far ridge left, no node ──────────────────

const LIB_BLUFF = `M2 110 C3 105, 6 100, 10 96
  C13 92, 17 89, 21 90
  C24 86, 30 86, 33 90
  C38 89, 43 92, 46 96
  C50 99, 53 102, 55 106
  C57 107, 58 108, 59 110
  C40 111, 20 111, 2 110 Z`;
/** The shaded flank, so the bluff reads as rock and not a barrow. */
const LIB_BLUFF_SHADE = `M33 90 C38 89, 43 92, 46 96
  C50 99, 53 102, 55 106 C57 107, 58 108, 59 110
  C50 110.6, 42 110.8, 38 110.8
  C40 104, 38 96, 33 90 Z`;
const LIB_MOUTH = `M23 109 C23 103, 26 99.6, 30 99.6
  C34 99.6, 37 103, 37 109
  C32 109.5, 28 109.5, 23 109 Z`;

// ─── THE STANDING STONES, near meadow right, node (350,165) ─
// Seven chipped slabs, read in perspective as a ring: the back row
// small and high, the front pair tall and low, the sides between.

const STONES: { x: number; base: number; h: number; w: number; lean: number; rune: number }[] = [
  { x: 338, base: 168, h: 12, w: 2.4, lean: -0.6, rune: 0 },
  { x: 350, base: 167, h: 13.5, w: 2.5, lean: 0.4, rune: 1 },
  { x: 362, base: 168, h: 12, w: 2.4, lean: 0.7, rune: 2 },
  { x: 326, base: 173, h: 15, w: 2.9, lean: -0.9, rune: 3 },
  { x: 374, base: 173, h: 15, w: 2.9, lean: 1.0, rune: 0 },
  { x: 333, base: 179, h: 17.5, w: 3.4, lean: -0.5, rune: 1 },
  { x: 367, base: 179, h: 17.5, w: 3.4, lean: 0.6, rune: 2 },
];

/** Carved marks, in local units — the Spirit Stones' own alphabet. */
const RUNES = [
  "M0 -0.6 L0 0.6 M-0.45 -0.2 L0.45 -0.2 M-0.45 0.2 L0.45 0.2",
  "M-0.4 -0.6 L0 0 L-0.4 0.6 M0.4 -0.5 L0.4 0.5",
  "M-0.45 -0.5 L0.45 0.5 M0.45 -0.5 L-0.45 0.5",
  "M0 -0.6 L0 0.6 M0 -0.1 L0.5 -0.55 M0 -0.1 L-0.5 -0.55",
];

// ─── THE FAR TREELINE ─────────────────────────────────────
// Ranks of small firs and rounded hardwoods along the far crest, so the
// distance reads as forest rather than as a bare ridge. The centre is
// left open — that ground belongs to the Great Tree.

const TREELINE: { x: number; y: number; h: number; fir: boolean }[] = (() => {
  const out: { x: number; y: number; h: number; fir: boolean }[] = [];
  const crest = (x: number) => 100 - Math.sin(x * 0.021 + 0.6) * 7 - Math.sin(x * 0.052) * 2.5;
  for (let i = 0; i < 46; i++) {
    const x = 4 + i * 8.7 + ((i * 37) % 5);
    if (x > 400) break;
    if (x > 150 && x < 254) continue;
    out.push({ x, y: crest(x) + 1.6, h: 5 + ((i * 13) % 5), fir: i % 3 !== 0 });
  }
  return out;
})();

/** A thinner scatter on the mid hills, in the gaps the callbacks leave,
 *  so the middle distance has scale and is not an empty green field. */
const MID_TREES: { x: number; y: number; h: number; fir: boolean }[] = [
  { x: 9, y: 146, h: 8, fir: true }, { x: 22, y: 144, h: 6, fir: false },
  { x: 36, y: 142, h: 8, fir: true }, { x: 52, y: 140, h: 6, fir: true },
  { x: 68, y: 138, h: 7, fir: false }, { x: 116, y: 134, h: 7, fir: true },
  { x: 126, y: 133, h: 5, fir: false }, { x: 208, y: 135, h: 6, fir: true },
  { x: 218, y: 135, h: 8, fir: true }, { x: 284, y: 126, h: 6, fir: false },
  { x: 340, y: 124, h: 7, fir: true }, { x: 354, y: 127, h: 6, fir: true },
  { x: 370, y: 128, h: 8, fir: false }, { x: 388, y: 129, h: 6, fir: true },
];

// ─── THE NEAR MEADOW'S OWN LIFE ───────────────────────────

const MEADOW_FLOWERS: { x: number; y: number; c: string; r: number }[] = [
  { x: 14, y: 186, c: "#e8899a", r: 2.4 },
  { x: 26, y: 178, c: "#f0d489", r: 2.0 },
  { x: 64, y: 184, c: "#b98fd0", r: 2.2 },
  { x: 80, y: 177, c: "#8fb6e4", r: 1.9 },
  { x: 98, y: 190, c: "#e8899a", r: 2.5 },
  { x: 152, y: 177, c: "#f0d489", r: 2.0 },
  { x: 178, y: 183, c: "#b98fd0", r: 2.2 },
  { x: 214, y: 178, c: "#8fb6e4", r: 2.0 },
  { x: 250, y: 175, c: "#e8899a", r: 2.1 },
  { x: 296, y: 173, c: "#f0d489", r: 2.0 },
  { x: 318, y: 180, c: "#b98fd0", r: 2.3 },
  { x: 386, y: 176, c: "#8fb6e4", r: 2.0 },
];

/** Low scrub right at the viewer's feet — the darkest mass in the
 *  frame, so the meadow has a near edge and the eye starts here. */
const NEAR_SCRUB: { x: number; y: number; r: number; s: number }[] = [
  { x: 14, y: 204, r: 13, s: 0 },
  { x: 66, y: 213, r: 16, s: 2 },
  { x: 116, y: 199, r: 11, s: 1 },
  { x: 204, y: 209, r: 15, s: 3 },
  { x: 266, y: 197, r: 12, s: 0 },
  { x: 330, y: 206, r: 15, s: 2 },
  { x: 388, y: 197, r: 12, s: 1 },
];

const GRASS: { x: number; y: number }[] = [
  { x: 8, y: 181 }, { x: 36, y: 183 }, { x: 56, y: 181 }, { x: 88, y: 180 },
  { x: 112, y: 177 }, { x: 134, y: 175 }, { x: 160, y: 176 }, { x: 192, y: 177 },
  { x: 222, y: 175 }, { x: 258, y: 171 }, { x: 288, y: 170 }, { x: 308, y: 172 },
  { x: 342, y: 174 }, { x: 382, y: 172 },
];

// ─── THE NIGHT SKY ────────────────────────────────────────

const STARFIELD: { x: number; y: number; r: number }[] = [
  { x: 18, y: 22, r: 0.9 }, { x: 42, y: 46, r: 0.6 }, { x: 66, y: 16, r: 1.0 },
  { x: 88, y: 38, r: 0.7 }, { x: 108, y: 60, r: 0.5 }, { x: 122, y: 24, r: 0.9 },
  { x: 146, y: 48, r: 0.6 }, { x: 164, y: 12, r: 0.8 }, { x: 186, y: 66, r: 0.5 },
  { x: 210, y: 70, r: 0.6 }, { x: 232, y: 20, r: 0.8 }, { x: 254, y: 74, r: 0.5 },
  { x: 268, y: 34, r: 0.7 }, { x: 300, y: 20, r: 0.9 }, { x: 316, y: 62, r: 0.6 },
  { x: 334, y: 12, r: 0.8 }, { x: 366, y: 52, r: 0.7 }, { x: 384, y: 30, r: 0.9 },
  { x: 392, y: 68, r: 0.5 }, { x: 8, y: 58, r: 0.6 }, { x: 56, y: 72, r: 0.5 },
  { x: 350, y: 78, r: 0.6 },
];

/** The named constellation, drawn on the stars node at (280,55) — the
 *  same kind of figure the Night Sky draws, sized for the distance. */
const CONSTELLATION: { x: number; y: number; r: number }[] = [
  { x: 258, y: 44, r: 1.5 },
  { x: 270, y: 52, r: 1.2 },
  { x: 280, y: 46, r: 1.9 },
  { x: 291, y: 55, r: 1.3 },
  { x: 298, y: 68, r: 1.5 },
  { x: 283, y: 66, r: 1.1 },
  { x: 268, y: 70, r: 1.3 },
];
const CONSTELLATION_LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [5, 1],
];

/** Spirits over the valley, on the sky phrase. */
const SPIRITS: { x: number; y: number }[] = [
  { x: 122, y: 122 }, { x: 208, y: 124 }, { x: 288, y: 118 }, { x: 64, y: 130 },
];
const WISPS: { x: number; y: number }[] = [
  { x: 92, y: 134 }, { x: 148, y: 128 }, { x: 196, y: 138 },
  { x: 244, y: 122 }, { x: 300, y: 134 }, { x: 344, y: 130 },
];

// Location markers for ley line connections
const LEY_POINTS = [
  { x: 45,  y: 172, label: "garden" },   // foreground left
  { x: 312, y: 112, label: "cottage" },  // right hillside
  { x: 280, y: 55,  label: "stars" },    // upper right sky
  { x: 95,  y: 128, label: "well" },     // left hillside (matches well visual)
  { x: 165, y: 126, label: "bridge" },   // mid area
  { x: 350, y: 165, label: "stones" },   // right foreground
  { x: 200, y: 40,  label: "tree" },     // center top
];

// Complete graph across all 7 ley-point nodes — every location
// connects to every other, so "the ancient order is restored" reads as
// a fully-woven web rather than a sparse network. 21 connections total.
const LEY_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
  [2, 3], [2, 4], [2, 5], [2, 6],
  [3, 4], [3, 5], [3, 6],
  [4, 5], [4, 6],
  [5, 6],
];

// ─── LEY GEOMETRY (derived, never hand-edited) ────────────
// The curve for connection i is exactly v1's: the same quadratic with
// the same control point. Only the direction of travel is chosen here,
// and because the control point is symmetric in the two endpoints,
// reversing traversal leaves the drawn curve identical.

const TREE_IDX = 6;

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

interface LeyLine {
  /** Path data, traversed from the endpoint further from the Great
   *  Tree toward the nearer one, so every pulse runs toward the Tree. */
  d: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Approximate arc length (quadratic estimate) for dash maths. */
  len: number;
}

const LEY_LINES: LeyLine[] = LEY_CONNECTIONS.map(([a, b], i) => {
  const pa = LEY_POINTS[a];
  const pb = LEY_POINTS[b];
  const tree = LEY_POINTS[TREE_IDX];
  const mx = (pa.x + pb.x) / 2 + ((i % 3) - 1) * 10;
  const my = (pa.y + pb.y) / 2 - 5;
  const aIsNearer = dist(pa, tree) <= dist(pb, tree);
  const from = aIsNearer ? pb : pa;
  const to = aIsNearer ? pa : pb;
  const chord = dist(from, to);
  const poly =
    Math.hypot(mx - from.x, my - from.y) + Math.hypot(to.x - mx, to.y - my);
  return {
    d: `M${from.x} ${from.y} Q${mx} ${my} ${to.x} ${to.y}`,
    from,
    to,
    len: (chord + poly) / 2,
  };
});

// Draw schedule. The web waits for the Tree: the crown lands its last
// clump at unityP 0.47 (p ≈ 0.82) and the first thread leaves at 0.47,
// so the player watches one thing at a time — the Tree rise, then the
// world tie itself together. The twenty-first thread closes at 0.99, so
// at the end of the game the web is whole (v1's step left five of them
// unfinished).
const LEY_START = 0.47;
const LEY_STEP = 0.0165;
const LEY_DRAW = 0.19;

const leyDraw = (unityP: number, i: number) =>
  sub(unityP, LEY_START + i * LEY_STEP, LEY_DRAW);
const leySettle = (unityP: number, i: number) =>
  sub(unityP, LEY_START + i * LEY_STEP + LEY_DRAW, 0.13);

/** How much each place weighs in the web. The Great Tree is the heart. */
const NODE_WEIGHT: number[] = [0.52, 0.55, 0.62, 0.48, 0.45, 0.52, 1.0];

// ─── THE WEB AS INK ───────────────────────────────────────

/** A hair-thin thread over a soft halo stroke, flaring as it draws and
 *  settling back so the whole net never blazes at once, with a mote of
 *  light travelling each finished thread toward the Tree. */
function LeyWebInk({ unityP, dawn }: { unityP: number; dawn: number }) {
  if (unityP <= LEY_START) return null;
  // The threads catch the first light when the morning comes.
  const inkColor = dawn > 0 ? "#fff0c4" : "#ece0b4";
  const haloColor = dawn > 0 ? "#ffd89a" : "#d8c890";
  const haloGain = 1 + dawn * 0.8;

  return (
    <>
      {/* Soft halo strokes — the air around the thread. */}
      <g>
        {LEY_LINES.map((L, i) => {
          const dp = leyDraw(unityP, i);
          if (dp <= 0) return null;
          const rise = Math.min(1, dp * 2.5);
          const settle = leySettle(unityP, i);
          const dash = L.len * 1.06;
          return (
            <path
              key={`h${i}`}
              d={L.d}
              fill="none"
              stroke={haloColor}
              strokeWidth={3.6}
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={dash * (1 - dp)}
              opacity={rise * (0.085 - 0.048 * settle) * haloGain}
            />
          );
        })}
      </g>

      {/* Ink threads — displaced just enough to read as a drawn line, and
          each thread carries its own weight so the web looks inked by a
          hand rather than plotted. */}
      <g filter="url(#wInkWobble)">
        {LEY_LINES.map((L, i) => {
          const dp = leyDraw(unityP, i);
          if (dp <= 0) return null;
          const rise = Math.min(1, dp * 2.5);
          const settle = leySettle(unityP, i);
          const dash = L.len * 1.06;
          const weight = 0.70 + ((i * 7) % 5) * 0.15;
          return (
            <path
              key={`k${i}`}
              d={L.d}
              fill="none"
              stroke={inkColor}
              strokeWidth={0.5 + (i % 3) * 0.1}
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={dash * (1 - dp)}
              opacity={rise * (0.70 - 0.54 * settle) * weight}
            />
          );
        })}
      </g>

      {/* Travelling light — one mote per finished thread, running toward
          the Great Tree, staggered so the web breathes instead of
          flashing. Pure SMIL: no React re-render per frame. */}
      <g>
        {LEY_LINES.map((L, i) => {
          if (leyDraw(unityP, i) < 1) return null;
          const dashLen = 5;
          const period = dashLen + L.len * 2;
          const dur = 2.4 + (i % 5) * 0.3;
          return (
            <path
              key={`p${i}`}
              d={L.d}
              fill="none"
              stroke={dawn > 0 ? "#fff8e0" : "#fff4cf"}
              strokeWidth={1.35}
              strokeLinecap="round"
              opacity={0.42 + dawn * 0.18}
              strokeDasharray={`${dashLen} ${L.len * 2}`}
              strokeDashoffset={period}
            >
              <animate
                attributeName="stroke-dashoffset"
                values={`${period};0`}
                dur={`${dur}s`}
                begin={`${((i * 0.37) % 2.2).toFixed(2)}s`}
                repeatCount="indefinite"
              />
            </path>
          );
        })}
      </g>
    </>
  );
}

/** Nodes are soft halos, never bright discs, sized by how much each
 *  place weighs in the web — the Tree largest. */
function LeyNodes({ unityP, dawn }: { unityP: number; dawn: number }) {
  return (
    <>
      {LEY_POINTS.map((pt, i) => {
        // Each place lights just before its threads leave it, so the
        // halos never sit over ground the Tree has not finished rising
        // out of.
        const np = sub(unityP, 0.38 + i * 0.035, 0.22);
        if (np <= 0) return null;
        const w = NODE_WEIGHT[i];
        const r = 6 + w * 10;
        return (
          <g key={`n${i}`}>
            <circle cx={pt.x} cy={pt.y} r={r} fill="url(#wHalo)" opacity={np * (0.58 + dawn * 0.3)} />
            <circle cx={pt.x} cy={pt.y} r={0.6 + w * 1.1} fill="#fdf3d2" opacity={np * (0.16 + w * 0.16 + dawn * 0.1)} />
          </g>
        );
      })}
    </>
  );
}

/** A long soft shadow thrown away from the light rising behind the
 *  Tree. Two passes — a near shadow and a longer, fainter tail — so the
 *  edge softens the way a low sun's shadow does. */
function DawnShadow({ x, y, w, len, dawn }: { x: number; y: number; w: number; len: number; dawn: number }) {
  if (dawn <= 0) return null;
  const dir = x < 200 ? -1 : 1;
  const dx = dir * len * dawn;
  const dy = len * 0.30 * dawn;
  return (
    <g>
      <path
        d={`M${x - w} ${y} L${x + w} ${y}
            L${x + dx * 1.55 + w * 0.3} ${y + dy * 1.55}
            L${x + dx * 1.55 - w * 0.3} ${y + dy * 1.55} Z`}
        fill="#070b11"
        opacity={0.18 * dawn}
      />
      <path
        d={`M${x - w} ${y} L${x + w} ${y}
            L${x + dx + w * 0.4} ${y + dy}
            L${x + dx - w * 0.4} ${y + dy} Z`}
        fill="#070b11"
        opacity={0.30 * dawn}
      />
    </g>
  );
}

// ─── THE SCENE ───────────────────────────────────────────

function WorldScene({ progress: p }: SceneProps) {
  const earthP = sub(p, 0, 0.33);
  const skyP = sub(p, 0.33, 0.33);
  const unityP = sub(p, 0.66, 0.34);
  const dawnP = sub(p, 0.74, 0.26);
  /** Morning. Zero in the night variant; everything else is identical. */
  const dawn = dawnP;

  // ── SKY. NIGHT FROM THE FIRST FRAME. No term here depends on p:
  //    the sky the player finishes the Night Sky under is the sky this
  //    level opens on, holds through both the earth and the sky
  //    incantations, and only the dawn touches. (The old schedule
  //    lifted it a little with every keystroke, which read on the
  //    contact sheet as the sky going dark when the stars arrived — the
  //    one thing the finale must never do.) The dawn end-state is the
  //    same colour it always was; the p terms were folded into it. ──
  const skyTop = hsl(236 + dawn * 14, 28 + dawn * 16, 4.5 + dawn * 3.7);
  const skyMid = hsl(228 + dawn * 6, 26 + dawn * 5, 7 + dawn * 3);
  const skyLow = hsl(214 - dawn * 4, 24 + dawn * 15, 11 + dawn * 6);

  // ── LAND. Blue-black and asleep under that night at p=0 — night
  //    ground, not a grey haze that could be mistaken for a pale
  //    twilight sky — and green by the end of the earth phrase. The far
  //    range stays palest (atmospheric distance), the near meadow
  //    darkest. ──
  const farH = 202 - earthP * 44, farS = 13 + earthP * 4, farL = 11 + earthP * 8 - dawn * 2.2;
  const midH = 198 - earthP * 54, midS = 13 + earthP * 8, midL = 7 + earthP * 6 - dawn * 0.8;
  const nearH = 194 - earthP * 64, nearS = 13 + earthP * 10, nearL = 4.2 + earthP * 3.8 - dawn * 0.2;

  /** Foliage tone, 0 = deepest shade, 1 = the edge the sky is on. */
  const crownC = (t: number, lift = 0) =>
    hsl(
      140 - t * 38 - dawn * t * 16,
      20 + t * 18 + earthP * 4 + dawn * t * 10,
      5 + t * 15 + lift + dawn * t * 5,
    );

  /** `grow` < 1 walks the list in order, each clump scaling up out of
   *  nothing over 0.3 of the window — a crown that fills clump by clump
   *  instead of a crown that fades in whole. */
  const clumps = (list: Puff[], lift: number, op: number, key: string, grow = 1) =>
    list.map(([s, x, y, r, rot, t], i) => {
      const g =
        grow >= 1 ? 1 : sub(grow, (i / Math.max(1, list.length - 1)) * 0.78, 0.26);
      if (g <= 0) return null;
      const rr = r * (0.34 + 0.66 * g);
      return (
        <path
          key={`${key}${i}`}
          d={PUFFS[s]}
          fill={crownC(t, lift)}
          opacity={op * (grow >= 1 ? 1 : Math.min(1, g * 1.6))}
          transform={`translate(${x} ${y}) rotate(${rot}) scale(${rr.toFixed(2)})`}
        />
      );
    });

  // ── THE CALLBACK SCHEDULE ──
  const gdnCrown = sub(earthP, 0.0, 0.42);
  const cotLit = sub(earthP, 0.14, 0.34);
  const cotSmoke = sub(earthP, 0.42, 0.4);
  const wellP = sub(earthP, 0.3, 0.34);
  const bridgeP = sub(earthP, 0.46, 0.34);
  const libP = sub(earthP, 0.58, 0.4);
  const streamP = sub(earthP, 0.38, 0.45);
  const bloomP = sub(earthP, 0.5, 0.5);

  // ── THE SKY PHRASE. Everything used to be finished by two thirds of
  //    "stars remember, spirits sing", leaving the last third dead.
  //    Now the four arrivals are laid end to end and overlapped, so
  //    every five per cent of the phrase gains something and the last
  //    wisp settles on the last letter. ──
  const starP = sub(skyP, 0.0, 0.50);     // struck across the sky first
  const moonP = sub(skyP, 0.0, 0.60);     // climbs over the eastern hill
  const constP = sub(skyP, 0.30, 0.50);   // the named figure draws
  const sanctumP = sub(skyP, 0.45, 0.35); // the pool takes the moonlight
  const spiritP = sub(skyP, 0.52, 0.48);  // "spirits sing" — last, and slow

  // ── THE LAST INCANTATION. The Tree has to be a rise, not an arrival:
  //    trunk out of the ridge (0–0.34, i.e. p 0.66–0.78), limbs with
  //    it, crown clump by clump (0.15–0.47, p 0.71–0.82), and only
  //    then the web. At the sweep's five per cent steps that reads:
  //    70% a buttressed shaft up to the fork, 75% the limbs bare above
  //    it with the first clusters at the fork, 80% the crown nearly
  //    closed, 82% whole — no frame gaining a whole element. ──
  const trunkP = sub(unityP, 0.0, 0.34);
  const rootP = sub(unityP, 0.02, 0.26);
  const treeCrown = sub(unityP, 0.15, 0.32);
  const heartP = sub(unityP, 0.44, 0.34);
  const stoneP = sub(unityP, 0.04, 0.4);
  const runeP = sub(unityP, 0.34, 0.36);

  /** The edge of the reveal, walking up out of the ridge. Below it the
   *  Tree is drawn; above it, not yet. Twelve units of softness, so it
   *  reads as growth and never as a shutter. */
  const riseEdge = 128 - trunkP * 160;

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="wHeartGlow" radius={4} color="#ffd27a" opacity={0.55} />

        {/* Hand-drawn wobble for the ink threads — the same trick the
            Stones' runes use, tuned small so 0.6-wide strokes survive. */}
        <filter id="wInkWobble" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.021" numOctaves={2} seed={11} result="wnoise" />
          <feDisplacementMap in="SourceGraphic" in2="wnoise" scale={3.2} xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* The Great Tree's rise. A soft edge walks up out of the ridge
            and the trunk is drawn below it — flare and buttress first,
            then the shaft, then the fork, then the limbs and the
            leader. Nothing about the Tree fades in. */}
        <linearGradient
          id="wGtRiseEdge"
          gradientUnits="userSpaceOnUse"
          x1="0" y1={(riseEdge - 9).toFixed(2)} x2="0" y2={(riseEdge + 3).toFixed(2)}
        >
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <mask id="wGtRise" maskUnits="userSpaceOnUse" x="120" y="-40" width="160" height="200">
          <path d="M120 -40 L280 -40 L280 160 L120 160 Z" fill="url(#wGtRiseEdge)" />
        </mask>

        <linearGradient id="wSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="46%" stopColor={skyMid} />
          <stop offset="100%" stopColor={skyLow} />
        </linearGradient>

        {/* Node halos — soft, never a disc. */}
        <radialGradient id="wHalo">
          <stop offset="0%" stopColor="#f6ecc4" stopOpacity={0.50} />
          <stop offset="42%" stopColor="#e0cf96" stopOpacity={0.16} />
          <stop offset="100%" stopColor="#d8c890" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="wWarmHalo">
          <stop offset="0%" stopColor="#ffd68e" stopOpacity={0.85} />
          <stop offset="38%" stopColor="#e8a34c" stopOpacity={0.24} />
          <stop offset="100%" stopColor="#d08a30" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="wTealHalo">
          <stop offset="0%" stopColor="#9fe6e0" stopOpacity={0.8} />
          <stop offset="40%" stopColor="#4fb0b4" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#3a8c92" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="wMoonHalo">
          <stop offset="0%" stopColor="#e6ecff" stopOpacity={0.30} />
          <stop offset="45%" stopColor="#aeb8ea" stopOpacity={0.09} />
          <stop offset="100%" stopColor="#9aa4dc" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="wHeartHalo">
          <stop offset="0%" stopColor="#ffe6b0" stopOpacity={0.9} />
          <stop offset="34%" stopColor="#f2a94e" stopOpacity={0.26} />
          <stop offset="100%" stopColor="#d88a30" stopOpacity={0} />
        </radialGradient>

        {/* Each depth falls from its body tone into its own shade. */}
        <linearGradient id="wFarBody" gradientUnits="userSpaceOnUse" x1="0" y1="88" x2="0" y2="152">
          <stop offset="0%" stopColor={hsl(farH, farS, farL)} />
          <stop offset="100%" stopColor={hsl(farH - 7, farS - 1, farL - 4.6)} />
        </linearGradient>
        <linearGradient id="wMidBody" gradientUnits="userSpaceOnUse" x1="0" y1="122" x2="0" y2="196">
          <stop offset="0%" stopColor={hsl(midH, midS, midL)} />
          <stop offset="100%" stopColor={hsl(midH - 7, midS - 1, midL - 4)} />
        </linearGradient>
        <linearGradient id="wNearBody" gradientUnits="userSpaceOnUse" x1="0" y1="168" x2="0" y2="250">
          <stop offset="0%" stopColor={hsl(nearH, nearS, nearL)} />
          <stop offset="100%" stopColor={hsl(nearH - 7, nearS - 1, nearL - 3.2)} />
        </linearGradient>

        {/* First light on the ground behind the Tree, so the trunk has
            something bright to stand against on the last phrase. */}
        <radialGradient id="wRidgeDawn" cx="50%" cy="34%" r="58%">
          <stop offset="0%" stopColor="#ffd79a" stopOpacity={0.20 * dawn} />
          <stop offset="55%" stopColor="#f0a862" stopOpacity={0.07 * dawn} />
          <stop offset="100%" stopColor="#e09850" stopOpacity={0} />
        </radialGradient>

        <linearGradient id="wStream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5d8e96" stopOpacity={0.55} />
          <stop offset="55%" stopColor="#3f6d7c" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#26485a" stopOpacity={0.42} />
        </linearGradient>

        {/* The morning. */}
        <linearGradient id="wTwilight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#251d4e" stopOpacity={0.34 * dawn} />
          <stop offset="100%" stopColor="#251d4e" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="wDawnBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8626e" stopOpacity={0} />
          <stop offset="38%" stopColor="#d2766f" stopOpacity={0.14 * dawn} />
          <stop offset="70%" stopColor="#ef9f66" stopOpacity={0.29 * dawn} />
          <stop offset="100%" stopColor="#ffd684" stopOpacity={0.45 * dawn} />
        </linearGradient>
        <radialGradient id="wDawnCore" cx="50%" cy="98%" r="60%">
          <stop offset="0%" stopColor="#ffeeb4" stopOpacity={0.36 * dawn} />
          <stop offset="52%" stopColor="#ffbe74" stopOpacity={0.11 * dawn} />
          <stop offset="100%" stopColor="#ffbe74" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="wDawnFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f9d194" stopOpacity={0} />
          <stop offset="34%" stopColor="#f9d194" stopOpacity={0.12 * dawn} />
          <stop offset="100%" stopColor="#f9d194" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* ══ SKY ══ */}
      <path d="M0 0 L400 0 L400 250 L0 250 Z" fill="url(#wSky)" />

      {/* Morning twilight deepens the top so the horizon has something
          to be brighter than. */}
      {dawn > 0 && <path d="M0 0 L400 0 L400 84 L0 84 Z" fill="url(#wTwilight)" />}

      {/* ── STARS — the sky phrase lights them; the dawn washes the low
             ones out first, as it does. ── */}
      {starP > 0 && STARFIELD.map((s, i) => {
        // One at a time, sweeping the sky. Each is STRUCK: a soft bloom
        // opens around it, then tightens to the point — so the first
        // letters of "stars remember" already change the sky, and no
        // star ever simply switches on.
        const sp = sub(starP, i * 0.033, 0.26);
        const fade = 1 - dawn * (0.3 + (s.y / 80) * 0.65);
        if (sp <= 0 || fade <= 0) return null;
        const r = s.r * (0.4 + 0.6 * sp);
        const strike = sp * (1 - sp) * 4;
        return (
          <g key={`st${i}`}>
            <circle cx={s.x} cy={s.y} r={r * (3.2 + 5.5 * strike)} fill="#dfe4ff"
              opacity={(sp * 0.05 + 0.055 * strike) * fade} />
            <circle cx={s.x} cy={s.y} r={r} fill="#f2f2ff" opacity={sp * 0.68 * fade}>
              <animate
                attributeName="opacity"
                values={`${(sp * 0.68 * fade).toFixed(3)};${(sp * 0.4 * fade).toFixed(3)};${(sp * 0.68 * fade).toFixed(3)}`}
                dur={`${3.4 + (i % 5) * 0.9}s`}
                begin={`${((i * 0.41) % 3).toFixed(2)}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}

      {/* ── THE CONSTELLATION — the figure the player named, on the
             stars node. Lines draw between the stars they join. ── */}
      {constP > 0 && (() => {
        const fade = 1 - dawn * 0.62;
        return (
          <g opacity={fade}>
            {CONSTELLATION_LINKS.map(([a, b], i) => {
              const lp = sub(constP, 0.25 + i * 0.08, 0.3);
              if (lp <= 0) return null;
              const A = CONSTELLATION[a], B = CONSTELLATION[b];
              return (
                <line
                  key={`cl${i}`}
                  x1={A.x} y1={A.y}
                  x2={A.x + (B.x - A.x) * lp} y2={A.y + (B.y - A.y) * lp}
                  stroke="#c6cdf2" strokeWidth={0.4} strokeLinecap="round"
                  opacity={0.42}
                />
              );
            })}
            {CONSTELLATION.map((s, i) => {
              const sp = sub(constP, i * 0.07, 0.3);
              if (sp <= 0) return null;
              return (
                <g key={`cs${i}`}>
                  <circle cx={s.x} cy={s.y} r={s.r * 4} fill="#cfd6ff" opacity={sp * 0.07} />
                  <circle cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={sp * 0.9} />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ── THE MOON — it CLIMBS over the eastern hill through the sky
             phrase, and pales as the morning comes up behind the
             ridge. ── */}
      {moonP > 0 && (() => {
        const bright = 0.25 + moonP * 0.75;
        const fade = moonP * (1 - dawn * 0.74);
        const climb = (1 - moonP) * 20;
        return (
          <g opacity={fade} transform={`translate(0 ${climb.toFixed(2)})`}>
            <circle cx="354" cy="26" r="30" fill="url(#wMoonHalo)" opacity={bright} />
            <path
              d="M358 15 C350 16, 344 21, 344 27 C344 33, 350 38, 358 38
                 C354 34, 352 30, 352 26 C352 22, 354 18, 358 15 Z"
              fill="#eef1ff"
              opacity={0.72 + bright * 0.24}
            />
          </g>
        );
      })()}

      {/* ── THE DAWN — the horizon swells peach into gold behind the far
             ridge, and blooms once more right behind the Tree. ── */}
      {dawn > 0 && (
        <>
          <path d="M0 34 L400 34 L400 112 L0 112 Z" fill="url(#wDawnBand)" />
          <path d="M40 40 L360 40 L360 112 L40 112 Z" fill="url(#wDawnCore)" />
        </>
      )}

      {/* ══ FAR RIDGE — lit crest over a body that falls into shade ══ */}
      <path d={RIDGE_FAR} fill={hsl(farH + 8, farS + 3, farL + 3.2)} />
      <path d={RIDGE_FAR} transform="translate(0 4)" fill="url(#wFarBody)" />

      {/* First light on the ridge behind the Tree. */}
      {dawn > 0 && <path d="M104 86 L296 86 L296 152 L104 152 Z" fill="url(#wRidgeDawn)" />}

      {/* ── THE FAR TREELINE — we are looking across a forest ── */}
      <g>
        {TREELINE.map((t, i) => (
          <path
            key={`tl${i}`}
            d={t.fir ? FIR : PUFFS[i % 4]}
            fill={hsl(farH - 4 + (i % 3) * 3, farS + 4, farL - 2.2)}
            transform={
              t.fir
                ? `translate(${t.x} ${t.y}) scale(${(t.h * 0.5).toFixed(2)} ${t.h})`
                : `translate(${t.x} ${t.y - t.h * 0.45}) scale(${(t.h * 0.42).toFixed(2)})`
            }
          />
        ))}
      </g>

      {/* ── THE LIBRARY — a bluff on the far ridge with one warm mouth,
             the last cavern still burning out there. ── */}
      <g>
        <path d={LIB_BLUFF} fill={hsl(256, 8 + farS * 0.4, farL - 3.2)} />
        <path d={LIB_BLUFF_SHADE} fill={hsl(252, 7, Math.max(3, farL - 6.4))} />
        <path d={LIB_MOUTH} fill="#0b0710" />
        {libP > 0 && (
          <>
            <circle cx="30" cy="105" r="15" fill="url(#wWarmHalo)" opacity={libP * 0.34} />
            <path d={LIB_MOUTH} fill="#f0c070" opacity={libP * 0.5} />
            <path
              d="M26 109 C26 105, 28 102.6, 30 102.6 C32 102.6, 34 105, 34 109 Z"
              fill="#fff0c0"
              opacity={libP * 0.62}
            />
          </>
        )}
      </g>

      {/* ══ THE GREAT TREE — the last incantation raises it ══
             Nothing here fades. The roots draw outward, the trunk is
             uncovered by an edge walking up out of the ridge, and the
             crown fills clump by clump. Every five per cent of the
             phrase between 0.66 and 0.82 is a different stage of one
             motion. */}
      {unityP > 0 && (
        <g>
          {/* Roots reaching out into the ridge — drawn, not faded, the
              way the Great Tree's own roots are. Light runs out along
              them once the heart is lit. */}
          {GT_ROOTS.map((d, i) => {
            const rp = sub(rootP, i * 0.09, 0.44);
            if (rp <= 0) return null;
            return (
              <g key={`gr${i}`}>
                <path d={d} fill="none" stroke={hsl(28, 16, 7)} strokeWidth={1.6} strokeLinecap="round"
                  strokeDasharray={36} strokeDashoffset={36 * (1 - rp)} opacity={0.85} />
                {heartP > 0 && (
                  <path d={d} fill="none" stroke="#e8b45c" strokeWidth={0.55} strokeLinecap="round"
                    opacity={sub(heartP, i * 0.1, 0.5) * 0.42} />
                )}
              </g>
            );
          })}

          {/* Trunk, buttresses, flares and the dark hollow, all under
              the rising edge: flare, shaft, fork, limbs, leader. */}
          <g mask="url(#wGtRise)">
            <path d={GT_TRUNK} fill={hsl(26, 16 + heartP * 8, 7.5 + heartP * 2)} />
            {/* The left flank takes the sky, and the morning behind the
                ridge puts a warm rim on it. */}
            <path d={GT_TRUNK_LIT} fill={hsl(30 + dawn * 6, 15 + heartP * 10 + dawn * 14, 13 + heartP * 4 + dawn * 7)} opacity={0.92} />
            <path d={GT_TRUNK_SHADE} fill={hsl(22, 14, 4.4)} opacity={0.9} />
            {GT_FLARES.map((d, i) => (
              <path key={`gf${i}`} d={d} fill={hsl(26, 15, 6.6)} />
            ))}
            {GT_BUTTRESS.map((d, i) => (
              <path key={`gb${i}`} d={d} fill={hsl(22, 15, 2.6)} opacity={0.9} />
            ))}
            <path d={GT_HEART} fill="#0a0705" opacity={0.9} />
          </g>

          {/* The heart. Dark until the very last of the phrase. */}
          {heartP > 0 && (
            <g>
              <circle cx="200" cy="99" r={17} fill="url(#wHeartHalo)" opacity={heartP * 0.6} />
              <path d={GT_HEART} fill="#eaa84e" opacity={heartP * 0.8} filter="url(#wHeartGlow)" />
              <path d={GT_HEART_CORE} fill="#fff0c4" opacity={heartP * 0.88} />
              {/* One small light for every scribe. */}
              {[[198.6, 96.4], [201.4, 100], [199.6, 103.4]].map(([sx, sy], i) => (
                <circle key={`sc${i}`} cx={sx} cy={sy} r={0.55} fill="#ffffff" opacity={heartP * 0.9}>
                  <animate attributeName="cy" values={`${sy};${sy - 1.8};${sy}`}
                    dur={`${5 + i * 1.4}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </g>
          )}

          {/* Crown. Grows out of the fork, clump by clump, outward and
              upward into the top edge of the frame — the shade mass
              leading its own detail, each cluster swelling into place
              over a third of the window. Whole by unityP 0.47. */}
          {treeCrown > 0 && (
            <g>
              <g transform={`translate(200 44) scale(${(0.965 + treeCrown * 0.035).toFixed(3)}) translate(-200 -44)`}>
                {clumps(GT_CROWN_BASE, 0, 1, "gcb", treeCrown)}
                {clumps(GT_CROWN, 0, 1, "gc", treeCrown)}
                <animateTransform attributeName="transform" type="rotate"
                  values="-0.25 200 110; 0.25 200 110; -0.25 200 110"
                  dur="17s" repeatCount="indefinite" additive="sum" />
              </g>
            </g>
          )}
        </g>
      )}

      {/* ══ MIST between the far ridge and the mid hills ══ */}
      <g opacity={0.42 + earthP * 0.58}>
        {MIST_HIGH.map((d, i) => (
          <path key={`mh${i}`} d={d} fill="#b6c6cc" opacity={0.075 - i * 0.022}>
            <animateTransform attributeName="transform" type="translate"
              values={`0 0; ${i % 2 ? -8 : 8} -1.6; 0 0`}
              dur={`${28 + i * 9}s`} repeatCount="indefinite" />
          </path>
        ))}
      </g>

      {/* ══ MID HILLS — lit crest over a body that falls into shade ══ */}
      <path d={HILLS_MID} fill={hsl(midH + 8, midS + 3, midL + 2.8)} />
      <path d={HILLS_MID} transform="translate(0 3.5)" fill="url(#wMidBody)" />

      {/* ── Scattered trees on the mid hills, for scale and texture ── */}
      <g>
        {MID_TREES.map((t, i) => (
          <path
            key={`mt${i}`}
            d={t.fir ? FIR : PUFFS[i % 4]}
            fill={hsl(midH - 8, midS + 6, Math.max(2.5, midL - 3.2))}
            transform={
              t.fir
                ? `translate(${t.x} ${t.y}) scale(${(t.h * 0.46).toFixed(2)} ${t.h})`
                : `translate(${t.x} ${t.y - t.h * 0.5}) scale(${(t.h * 0.46).toFixed(2)})`
            }
          />
        ))}
      </g>

      {/* ── THE SANCTUM — a ring of elders round a pool that takes the
             moonlight. Not a node; just a place that is still there. ── */}
      <g>
        {SANCTUM_FIRS.map(([x, y, h], i) => (
          <path key={`sf${i}`} d={FIR}
            fill={hsl(204, 10 + sanctumP * 3, Math.max(2.5, midL - 3.4 + (i % 2) * 1))}
            transform={`translate(${x} ${y}) scale(${(h * 0.44).toFixed(2)} ${h})`} />
        ))}
        <path d={SANCTUM_POOL} fill={hsl(202, 11, Math.max(3, midL - 2))} />
        {sanctumP > 0 && (
          <>
            <path d={SANCTUM_POOL} fill="#c2d0dd" opacity={sanctumP * 0.24} />
            <path d="M242 131.6 C246 130.4, 254 130.4, 259 131.4 C255 132.8, 247 132.8, 242 131.6 Z"
              fill="#e8eef6" opacity={sanctumP * 0.4}>
              <animate attributeName="opacity"
                values={`${(sanctumP * 0.4).toFixed(3)};${(sanctumP * 0.22).toFixed(3)};${(sanctumP * 0.4).toFixed(3)}`}
                dur="7s" repeatCount="indefinite" />
            </path>
          </>
        )}
      </g>

      {/* ── THE WELL — stone ring, A-frame, rope and bucket, and water
             that finally has something in it. ── */}
      <g>
        <path d={WELL_ROOF} fill={hsl(24, 14 + wellP * 6, 8.5)} />
        <path d="M79 116 C84 111, 89 106, 95 101 L95 104 C90 108, 85 112, 82 116 Z"
          fill={hsl(26, 14, 12)} opacity={0.8} />
        {WELL_POSTS.map((d, i) => (
          <path key={`wp${i}`} d={d} fill={hsl(26, 13, i ? 6.5 : 11)} />
        ))}
        <path d={WELL_ROPE} fill="none" stroke={hsl(38, 16, 13)} strokeWidth={0.55} strokeLinecap="round" />
        <path d="M93.4 123.6 C93.4 122.6, 96.6 122.6, 96.6 123.6 L96.2 126.4 C95 126.8, 95 126.8, 93.8 126.4 Z"
          fill={hsl(28, 18, 12)} />
        <path d={WELL_RING} fill={hsl(212, 7, 14)} />
        <path d="M85 135 C85 131, 86 128, 88 126 L92 126 C90 128, 89 131, 89 135 Z"
          fill={hsl(212, 7, 19)} opacity={0.85} />
        <path d="M105 135 C105 131, 104 128, 102 126 L98.5 126 C100.5 128, 101 131, 101 135 Z"
          fill={hsl(212, 8, 8)} opacity={0.9} />
        {WELL_COURSES.map((d, i) => (
          <path key={`wc${i}`} d={d} fill="none" stroke={hsl(212, 8, 6)} strokeWidth={0.42} opacity={0.75} />
        ))}
        {wellP > 0 && (
          <g>
            <circle cx="95" cy="128" r={13} fill="url(#wTealHalo)" opacity={wellP * 0.34} />
            <path d={WELL_WATER} fill="#7fdcd6" opacity={wellP * 0.62}>
              <animate attributeName="opacity"
                values={`${(wellP * 0.62).toFixed(3)};${(wellP * 0.42).toFixed(3)};${(wellP * 0.62).toFixed(3)}`}
                dur="6s" repeatCount="indefinite" />
            </path>
          </g>
        )}
      </g>

      {/* ── THE BRIDGE — a segmental arch over the gully, with the
             lanterns back on the parapet. ── */}
      <g>
        <path d={BR_VOID} fill="#05080c" opacity={0.62} />
        {BR_ABUTMENTS.map((d, i) => (
          <path key={`ba${i}`} d={d} fill={hsl(206, 8, Math.max(3, midL - 2.5))} />
        ))}
        <path d={BR_ARCH} fill={hsl(206, 10, 10 + bridgeP * 9)} />
        <path d="M141 139 C141 130, 149 122.6, 161 120.4 C164 119.9, 170 119.9, 170 119.9 L170 125.4 C166 125.4, 164 125.4, 163 125.8 C155 127.4, 149 132.8, 149 139 Z"
          fill={hsl(206, 12, 15 + bridgeP * 10)} opacity={0.8} />
        {BR_JOINTS.map((d, i) => (
          <path key={`bj${i}`} d={d} fill="none" stroke={hsl(208, 10, 6)} strokeWidth={0.45} opacity={0.6} />
        ))}
        <path d={BR_DECK} fill={hsl(204, 11, 13 + bridgeP * 10)} />
        <path d="M140 119 C151 116, 161 115, 170 115 C179 115, 189 116, 200 119 L200 121.4 C189 118.4, 179 117.4, 170 117.4 C161 117.4, 151 118.4, 140 121.4 Z"
          fill={hsl(204, 10, 7)} opacity={0.85} />
        {bridgeP > 0 && BR_LANTERNS.map((l, i) => {
          const lp = sub(bridgeP, i * 0.16, 0.5);
          if (lp <= 0) return null;
          return (
            <g key={`bl${i}`}>
              <circle cx={l.x} cy={l.y} r={7} fill="url(#wWarmHalo)" opacity={lp * 0.30} />
              <path d={`M${l.x} ${l.y + 3} L${l.x} ${l.y + 1}`} stroke={hsl(206, 9, 12)} strokeWidth={0.5} />
              <circle cx={l.x} cy={l.y} r={1.05} fill="#ffe9b4" opacity={lp * 0.92}>
                <animate attributeName="opacity"
                  values={`${(lp * 0.92).toFixed(3)};${(lp * 0.7).toFixed(3)};${(lp * 0.92).toFixed(3)}`}
                  dur={`${4 + i}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </g>

      {/* ── THE COTTAGE — the hearth the second act was spent lighting,
             seen from outside at last. ── */}
      <g>
        <path d={COT_CHIMNEY} fill={hsl(20, 12, 7)} />
        <path d={COT_BODY} fill={hsl(34, 11 + cotLit * 8, 8 + cotLit * 3)} />
        <path d="M300 121 C300 115, 300 109, 300 103 L306 103 C306 109, 306 115, 306 121 Z"
          fill={hsl(34, 10, 12 + cotLit * 3)} opacity={0.7} />
        <path d={COT_ROOF} fill={hsl(18, 13, 5.5)} />
        <path d="M294 105 C300 100, 306 95, 313 90 L313 93 C307 97, 302 101, 298 105 Z"
          fill={hsl(20, 12, 10)} opacity={0.8} />
        <path d={COT_WINDOW} fill="#120c06" />
        {cotLit > 0 && (
          <g>
            <circle cx="311.5" cy="112.5" r={16} fill="url(#wWarmHalo)" opacity={cotLit * 0.42 * (1 - dawn * 0.35)} />
            <path d={COT_WINDOW} fill="#ffc873" opacity={cotLit * 0.92 * (1 - dawn * 0.3)} />
            <path d="M311.5 108 L311.5 117 M306 112.5 L317 112.5" stroke="#3a2410" strokeWidth={0.6} opacity={0.85} />
          </g>
        )}
        {cotSmoke > 0 && COT_SMOKE.map((d, i) => (
          <path key={`cs${i}`} d={d} fill="none" stroke="#b9ad96" strokeWidth={0.7}
            strokeLinecap="round" opacity={cotSmoke * (0.14 - i * 0.05)}>
            <animateTransform attributeName="transform" type="translate"
              values={`0 0; ${i ? 1.6 : -1.6} -5; 0 0`}
              dur={`${11 + i * 4}s`} repeatCount="indefinite" />
          </path>
        ))}
      </g>

      {/* ══ MIST between the mid hills and the meadow ══ */}
      <path d={MIST_LOW} fill="#a8bcc0" opacity={0.05 + earthP * 0.02}>
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 9 -1.2; 0 0" dur="34s" repeatCount="indefinite" />
      </path>

      {/* ══ NEAR MEADOW — lit crest over a body that falls into shade ══ */}
      <path d={MEADOW} fill={hsl(nearH + 9, nearS + 3, nearL + 2.8)} />
      <path d={MEADOW} transform="translate(0 3.5)" fill="url(#wNearBody)" />

      {/* ── THE STREAM — out of the gully, at the viewer ── */}
      {streamP > 0 && (
        <g opacity={streamP}>
          <path d={STREAM} fill="url(#wStream)" />
          {STREAM_LINES.map((d, i) => (
            <path key={`sl${i}`} d={d} fill="none" stroke="#cfe4ea" strokeWidth={0.45}
              strokeLinecap="round" opacity={0.16 - i * 0.04}
              strokeDasharray="7 16" strokeDashoffset={0}>
              <animate attributeName="stroke-dashoffset" values="0;-46"
                dur={`${7 + i * 2.5}s`} repeatCount="indefinite" />
            </path>
          ))}
        </g>
      )}

      {/* ── DAWN SHADOWS — thrown away from the light behind the Tree ── */}
      {dawn > 0 && (
        <g>
          <DawnShadow x={312} y={121} w={12} len={30} dawn={dawn * cotLit} />
          <DawnShadow x={95} y={135} w={9} len={26} dawn={dawn * wellP} />
          <DawnShadow x={168} y={139} w={16} len={22} dawn={dawn * bridgeP} />
          {STONES.map((s, i) => (
            <DawnShadow key={`ss${i}`} x={s.x} y={s.base} w={s.w * 1.3}
              len={13 + (i % 3) * 5} dawn={dawn * sub(stoneP, i * 0.07, 0.4)} />
          ))}
          <DawnShadow x={45} y={192} w={16} len={38} dawn={dawn * gdnCrown} />
        </g>
      )}

      {/* ── THE STANDING STONES — the ancient order, coming back to the
             meadow with the last incantation. ── */}
      {stoneP > 0 && STONES.map((s, i) => {
        const rp = sub(stoneP, i * 0.07, 0.42);
        if (rp <= 0) return null;
        const h = s.h * rp;
        const top = s.base - h;
        const lean = s.lean;
        return (
          <g key={`sg${i}`}>
            {/* Chipped, weathered, leaning — never a rounded slab. */}
            <path
              d={`M${s.x - s.w} ${s.base}
                  C${s.x - s.w - 0.25} ${top + h * 0.55}, ${s.x - s.w * 0.92 + lean * 0.3} ${top + 4}, ${s.x - s.w * 0.72 + lean * 0.6} ${top + 1.2}
                  L${s.x - s.w * 0.12 + lean} ${top}
                  L${s.x + s.w * 0.56 + lean * 0.8} ${top + 2.6}
                  C${s.x + s.w * 0.92 + lean * 0.4} ${top + 5}, ${s.x + s.w + 0.15} ${top + h * 0.55}, ${s.x + s.w} ${s.base} Z`}
              fill={hsl(210, 9, nearL + 9)}
            />
            <path
              d={`M${s.x + s.w * 0.12} ${s.base}
                  L${s.x + s.w * 0.06 + lean * 0.9} ${top + 1.6}
                  L${s.x + s.w * 0.56 + lean * 0.8} ${top + 2.6}
                  C${s.x + s.w * 0.92 + lean * 0.4} ${top + 5}, ${s.x + s.w + 0.15} ${top + h * 0.55}, ${s.x + s.w} ${s.base} Z`}
              fill={hsl(214, 11, Math.max(2.5, nearL - 0.5))}
              opacity={0.94}
            />
            {runeP > 0 && (
              <path d={RUNES[s.rune]} fill="none" stroke="#c2e0ff" strokeWidth={0.34}
                strokeLinecap="round"
                opacity={sub(runeP, i * 0.06, 0.4) * 0.8}
                transform={`translate(${s.x + lean * 0.5} ${top + h * 0.48}) scale(${(s.w * 0.82).toFixed(2)} ${(h * 0.19).toFixed(2)})`} />
            )}
          </g>
        );
      })}

      {/* ── THE GARDEN — bare at the start, crowned by the first
             incantation, with the meadow blooming under it. ── */}
      <g>
        {GDN_TWIGS.map((d, i) => (
          <path key={`gt${i}`} d={d} fill="none" stroke={hsl(28, 12, 6.5)}
            strokeWidth={0.7} strokeLinecap="round" opacity={0.9} />
        ))}
        <path d={GDN_TRUNK} fill={hsl(26, 13, 6.4)} />
        <path d="M40 192 C40 185, 41 178, 42 171 C42 167, 43 163, 43 159 L45 159 C44.5 163, 44 167, 44 171 C43.5 178, 43 185, 43 192 Z"
          fill={hsl(28, 12, 10.5)} opacity={0.75} />
        {gdnCrown > 0 && (
          <g opacity={Math.min(1, gdnCrown * 1.35)}>
            <g transform={`translate(45 168) scale(${(0.66 + gdnCrown * 0.34).toFixed(3)}) translate(-45 -168)`}>
              {clumps(GDN_CROWN_BASE, -1.5, 1, "gnb")}
              {clumps(GDN_CROWN, -1.5, 1, "gn")}
              <animateTransform attributeName="transform" type="rotate"
                values="-0.7 45 190; 0.7 45 190; -0.7 45 190"
                dur="11s" repeatCount="indefinite" additive="sum" />
            </g>
          </g>
        )}
      </g>

      {/* ── FLOWERS AND GRASS — "garden bloom" reaches the whole meadow ── */}
      {GRASS.map((g, i) => {
        const gp = sub(earthP, 0.2 + (i % 6) * 0.05, 0.3);
        if (gp <= 0) return null;
        const c = hsl(120 - earthP * 10, 12 + earthP * 18, 9 + earthP * 7);
        return (
          <g key={`gr${i}`} opacity={gp * 0.7}>
            <path d={`M${g.x - 2} ${g.y} C${g.x - 2.6} ${g.y - 2}, ${g.x - 3} ${g.y - 3.4}, ${g.x - 3.4} ${g.y - 4.6 * gp}`}
              fill="none" stroke={c} strokeWidth={0.5} strokeLinecap="round" />
            <path d={`M${g.x} ${g.y} C${g.x + 0.3} ${g.y - 2.4}, ${g.x + 0.6} ${g.y - 4}, ${g.x + 0.9} ${g.y - 5.6 * gp}`}
              fill="none" stroke={c} strokeWidth={0.5} strokeLinecap="round" />
            <path d={`M${g.x + 2} ${g.y} C${g.x + 2.8} ${g.y - 1.8}, ${g.x + 3.4} ${g.y - 2.8}, ${g.x + 4} ${g.y - 3.8 * gp}`}
              fill="none" stroke={c} strokeWidth={0.5} strokeLinecap="round" />
          </g>
        );
      })}

      {MEADOW_FLOWERS.map((f, i) => {
        const fp = sub(bloomP, (i % 7) * 0.07, 0.34);
        if (fp <= 0) return null;
        return (
          <g key={`fl${i}`} opacity={fp}>
            <path d={`M${f.x} ${f.y} C${f.x - 0.6} ${f.y - 2.4}, ${f.x - 0.3} ${f.y - 4}, ${f.x} ${f.y - 5.4 * fp}`}
              fill="none" stroke={hsl(112, 22, 13)} strokeWidth={0.6} strokeLinecap="round" />
            <path d={FLOWER} fill={f.c} opacity={0.78}
              transform={`translate(${f.x} ${f.y - 5.6 * fp}) scale(${(f.r * fp).toFixed(2)})`} />
            <path d={FLOWER} fill="#fff4cf" opacity={0.5}
              transform={`translate(${f.x} ${f.y - 5.6 * fp}) scale(${(f.r * fp * 0.32).toFixed(2)})`} />
            <animateTransform attributeName="transform" type="rotate"
              values={`-2.2 ${f.x} ${f.y}; 2.2 ${f.x} ${f.y}; -2.2 ${f.x} ${f.y}`}
              dur={`${8 + (i % 4) * 2}s`} begin={`${((i * 0.6) % 4).toFixed(2)}s`}
              repeatCount="indefinite" />
          </g>
        );
      })}

      {/* ── NEAR SCRUB — the dark near edge of the meadow ── */}
      <g>
        {NEAR_SCRUB.map((b, i) => (
          <path key={`ns${i}`} d={PUFFS[b.s]}
            fill={hsl(nearH - 12, nearS + 4, Math.max(2, nearL - 2.8))}
            transform={`translate(${b.x} ${b.y}) scale(${b.r} ${(b.r * 0.62).toFixed(2)})`} />
        ))}
      </g>

      {/* ── FIRST LIGHT along the valley floor ── */}
      {dawn > 0 && <path d="M0 140 L400 140 L400 212 L0 212 Z" fill="url(#wDawnFloor)" />}

      {/* ══ SPIRITS — the sky phrase brings them up out of the valley ══ */}
      {spiritP > 0 && SPIRITS.map((s, i) => {
        // They come UP out of the valley — the last thing the sky
        // phrase does, still moving on its final letter.
        const fp = sub(spiritP, i * 0.14, 0.45);
        if (fp <= 0) return null;
        return (
          <g key={`sp${i}`} transform={`translate(0 ${((1 - fp) * 9).toFixed(2)})`}>
          <g opacity={fp * (1 - dawn * 0.25)}>
            <path
              d={`M${s.x} ${s.y - 5.4}
                  C${s.x - 1.8} ${s.y - 4.2}, ${s.x - 2.9} ${s.y - 2}, ${s.x - 2.8} ${s.y}
                  C${s.x - 2.5} ${s.y + 2.8}, ${s.x - 1.4} ${s.y + 4.4}, ${s.x} ${s.y + 4.4}
                  C${s.x + 1.4} ${s.y + 4.4}, ${s.x + 2.5} ${s.y + 2.8}, ${s.x + 2.8} ${s.y}
                  C${s.x + 2.9} ${s.y - 2}, ${s.x + 1.8} ${s.y - 4.2}, ${s.x} ${s.y - 5.4} Z`}
              fill="#d8c48a" opacity={0.2}
            />
            <circle cx={s.x} cy={s.y - 0.4} r={1.7} fill="#e6d29a" opacity={0.34} />
            <circle cx={s.x} cy={s.y - 0.4} r={0.85} fill="#fff8e0" opacity={0.7} />
            <animateTransform attributeName="transform" type="translate"
              values={`0 0; ${i % 2 ? 3 : -3} -4; 0 0`}
              dur={`${13 + i * 3}s`} repeatCount="indefinite" />
          </g>
          </g>
        );
      })}

      {spiritP > 0 && WISPS.map((w, i) => {
        // Staggered to the last letter of "spirits sing", each lifting
        // into place so the phrase never stops moving.
        const wp = sub(spiritP, 0.25 + i * 0.09, 0.30);
        if (wp <= 0) return null;
        return (
          <g key={`wi${i}`} transform={`translate(0 ${((1 - wp) * 7).toFixed(2)})`}>
          <g opacity={wp * (1 - dawn * 0.3)}>
            <circle cx={w.x} cy={w.y} r={2.6 * (0.5 + 0.5 * wp)} fill="#d8c48a" opacity={0.07} />
            <circle cx={w.x} cy={w.y} r={0.85} fill="#ffe8b0" opacity={0.4} />
            <animateTransform attributeName="transform" type="translate"
              values={`0 0; ${i % 2 ? 5 : -5} -7; 0 0`}
              dur={`${16 + i * 2.5}s`} repeatCount="indefinite" />
          </g>
          </g>
        );
      })}

      {/* ══ THE LEY WEB — 21 connections, 7 nodes, unchanged ══ */}
      <LeyWebInk unityP={unityP} dawn={dawn} />
      <LeyNodes unityP={unityP} dawn={dawn} />

      {/* ══ THE LAST BREATH — a whisper of warmth over the whole frame,
             kept well under the ceiling so nothing goes milky ══ */}
      {p > 0.92 && (
        <path d="M0 0 L400 0 L400 250 L0 250 Z" fill="#e8d8a0"
          opacity={sub(p, 0.92, 0.08) * (dawn > 0 ? 0.022 : 0.05)} />
      )}
    </svg>
  );
}

export default memo(WorldScene);
