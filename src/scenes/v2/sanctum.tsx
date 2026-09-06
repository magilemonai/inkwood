import { memo } from "react";
import type { SceneProps } from "../../types";
import { GlowFilter } from "../../svg/filters";
import { sub } from "../util";
import { useParticles } from "../../hooks/useParticles";
import ParticleField from "../../components/ParticleField";

/**
 * The Moonlit Sanctum — Inkwood 2 redraw.
 *
 * v1 framed the clearing with lollipop trees (an oval on a stick). The
 * spirits, the moon and the fireflies were the good parts and are kept.
 *
 * The scene is now a council ring seen from the open side:
 *   • a ring of ancient trees in three depth tones — far treeline, the
 *     elder ring, near wings cropped by the frame — each a forking
 *     trunk under seven small ragged foliage clumps, never a blob,
 *   • five low seat-stones on the ring, empty at rest,
 *   • bracken breaking the clearing's edge so the floor never reads as
 *     a lozenge laid on the forest.
 *
 * Phrase 1 "moonlight, pour into the circle" (p 0 → 0.5)
 *   The veil slides off the moon, beams pour through the gap in the
 *   canopy, and silver floods the clearing from the centre out — a pool
 *   that fills like liquid, pools brightest where the beams land, and
 *   finds the five empty seats.
 *
 * Phrase 2 "Oak, Alder, Yew, take your seats" (p 0.5 → 1)
 *   The moonlight finds each named elder as it is called — a quiet
 *   moon-tinted wash over that tree's own shape. Then five spirits
 *   descend to the stones, staggered left to right, each turning to
 *   face the centre of the ring as it settles.
 */

/* ── path helpers ─────────────────────────────────────────────────── */

const f1 = (n: number) => n.toFixed(1);

/** Closed Catmull-Rom through a point loop, emitted as cubic beziers.
 *  Every organic mass in this scene is a hand-authored radius profile
 *  pushed through here, so the outlines are ragged and specific rather
 *  than smooth clip-art. */
function closedCurve(pts: Array<[number, number]>): string {
  const n = pts.length;
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d +=
      `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)},` +
      `${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)},` +
      `${f1(p2[0])} ${f1(p2[1])}`;
  }
  return `${d}Z`;
}

/** Foliage raggedness. Sixteen radii per clump, with lobes grouped two
 *  or three wide and single-sample drops between them: grouped lobes
 *  read as clumps of leaves, while alternating every sample reads as a
 *  thistle and a smooth profile reads as cloud. Each rhythm differs so
 *  no two clumps repeat. */
const LEAF_PROFILES: number[][] = [
  [1.12, 1.05, 0.81, 0.94, 1.1, 0.79, 1.06, 0.88, 1.13, 0.83, 0.97, 1.08, 0.78, 1.02, 0.89, 1.09],
  [0.84, 1.11, 1.03, 0.79, 1.07, 0.9, 1.12, 0.82, 0.95, 1.09, 1.0, 0.77, 1.05, 0.87, 1.1, 0.93],
  [1.08, 0.86, 1.13, 1.02, 0.8, 1.05, 0.91, 1.11, 0.78, 0.99, 1.07, 0.85, 1.12, 0.94, 0.82, 1.04],
  [0.92, 1.09, 0.79, 1.06, 1.12, 0.84, 0.98, 1.1, 0.81, 1.03, 0.88, 1.13, 0.96, 0.8, 1.07, 1.0],
];

/** One ragged foliage clump. Hangs heavier below than above, the way a
 *  loaded branch does. Seven of these overlapping in one fill make a
 *  single notched crown silhouette. */
function foliage(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  variant: number,
  rot = 0,
): string {
  const prof = LEAF_PROFILES[((variant % 4) + 4) % 4];
  const n = prof.length;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const r = prof[i];
    const sag = Math.sin(a) > 0 ? 1.15 : 0.92;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r * sag]);
  }
  return closedCurve(pts);
}

/** One continuous forking trunk: buttressed foot, bole, a limb reaching
 *  out each side and a centre leader. Twelve cubic segments, and it
 *  forks from the bole rather than radiating from a point. */
function forkedTrunk(
  x: number,
  y: number,
  ht: number,
  tw: number,
  lean: number,
  reach: number,
): string {
  const L = (f: number) => lean * f;
  const R = reach;
  return [
    `M${f1(x - tw * 1.9)} ${f1(y)}`,
    `C${f1(x - tw * 1.5)} ${f1(y - ht * 0.05)},${f1(x - tw * 1.02)} ${f1(y - ht * 0.11)},${f1(x - tw * 0.8)} ${f1(y - ht * 0.24)}`,
    `C${f1(x - tw * 0.72)} ${f1(y - ht * 0.33)},${f1(x - tw * 0.94 + L(0.2))} ${f1(y - ht * 0.4)},${f1(x - tw * 1.18 + L(0.3))} ${f1(y - ht * 0.48)}`,
    `C${f1(x - tw * 2.1 * R + L(0.4))} ${f1(y - ht * 0.57)},${f1(x - tw * 3.1 * R + L(0.5))} ${f1(y - ht * 0.64)},${f1(x - tw * 4.4 * R + L(0.6))} ${f1(y - ht * 0.82)}`,
    `C${f1(x - tw * 3.3 * R + L(0.6))} ${f1(y - ht * 0.74)},${f1(x - tw * 2.3 * R + L(0.5))} ${f1(y - ht * 0.65)},${f1(x - tw * 1.3 + L(0.45))} ${f1(y - ht * 0.59)}`,
    `C${f1(x - tw * 0.62 + L(0.6))} ${f1(y - ht * 0.7)},${f1(x - tw * 0.46 + L(0.8))} ${f1(y - ht * 0.85)},${f1(x - tw * 0.38 + L(1))} ${f1(y - ht * 1.02)}`,
    `C${f1(x - tw * 0.1 + L(1.06))} ${f1(y - ht * 1.09)},${f1(x + tw * 0.16 + L(1.06))} ${f1(y - ht * 1.08)},${f1(x + tw * 0.36 + L(1))} ${f1(y - ht * 0.98)}`,
    `C${f1(x + tw * 0.5 + L(0.8))} ${f1(y - ht * 0.83)},${f1(x + tw * 0.72 + L(0.6))} ${f1(y - ht * 0.69)},${f1(x + tw * 1.5 + L(0.5))} ${f1(y - ht * 0.62)}`,
    `C${f1(x + tw * 2.6 * R + L(0.55))} ${f1(y - ht * 0.67)},${f1(x + tw * 3.5 * R + L(0.6))} ${f1(y - ht * 0.75)},${f1(x + tw * 4.7 * R + L(0.65))} ${f1(y - ht * 0.86)}`,
    `C${f1(x + tw * 3.4 * R + L(0.6))} ${f1(y - ht * 0.7)},${f1(x + tw * 2.3 * R + L(0.45))} ${f1(y - ht * 0.59)},${f1(x + tw * 1.12 + L(0.3))} ${f1(y - ht * 0.46)}`,
    `C${f1(x + tw * 0.88)} ${f1(y - ht * 0.37)},${f1(x + tw * 0.78)} ${f1(y - ht * 0.27)},${f1(x + tw * 0.88)} ${f1(y - ht * 0.17)}`,
    `C${f1(x + tw * 1.12)} ${f1(y - ht * 0.08)},${f1(x + tw * 1.6)} ${f1(y - ht * 0.03)},${f1(x + tw * 2.1)} ${f1(y)}`,
    "Z",
  ].join(" ");
}

/** Tapered closed blade — dead spars above an old crown, and grass on
 *  the clearing floor. Never a stroked line: a uniform-width stroke
 *  reads as a toothpick. */
function blade(x: number, y: number, len: number, ang: number, w: number, curl = 0.3): string {
  const dx = Math.cos(ang) * len;
  const dy = Math.sin(ang) * len;
  const nx = -Math.sin(ang) * w;
  const ny = Math.cos(ang) * w;
  const bx = -Math.sin(ang) * len * curl;
  const by = Math.cos(ang) * len * curl;
  return [
    `M${f1(x + nx)} ${f1(y + ny)}`,
    `C${f1(x + dx * 0.34 + nx * 0.68 + bx * 0.3)} ${f1(y + dy * 0.34 + ny * 0.68 + by * 0.3)},${f1(x + dx * 0.66 + nx * 0.42 + bx * 0.7)} ${f1(y + dy * 0.66 + ny * 0.42 + by * 0.7)},${f1(x + dx + bx)} ${f1(y + dy + by)}`,
    `C${f1(x + dx * 0.64 - nx * 0.42 + bx * 0.7)} ${f1(y + dy * 0.64 - ny * 0.42 + by * 0.7)},${f1(x + dx * 0.32 - nx * 0.72 + bx * 0.3)} ${f1(y + dy * 0.32 - ny * 0.72 + by * 0.3)},${f1(x - nx)} ${f1(y - ny)}`,
    "Z",
  ].join(" ");
}

/* ── conifer ──────────────────────────────────────────────────────── */

const CONIFER_LEFT = [
  { f: 0.26, w: 1.0 },
  { f: 0.38, w: 0.89 },
  { f: 0.5, w: 0.75 },
  { f: 0.61, w: 0.61 },
  { f: 0.71, w: 0.47 },
  { f: 0.81, w: 0.34 },
  { f: 0.9, w: 0.2 },
];
const CONIFER_RIGHT = [
  { f: 0.87, w: 0.24 },
  { f: 0.77, w: 0.39 },
  { f: 0.66, w: 0.55 },
  { f: 0.55, w: 0.69 },
  { f: 0.42, w: 0.85 },
  { f: 0.3, w: 0.98 },
  { f: 0.19, w: 1.07 },
];

/** Spruce silhouette: drooping asymmetric branch tiers down both sides
 *  of one closed path, with a different tier rhythm left and right so it
 *  never reads as a mirrored triangle. */
function coniferPath(
  x: number,
  y: number,
  h: number,
  cw: number,
  tw: number,
  lean: number,
): string {
  const X = (f: number) => x + lean * f;
  let d =
    `M${f1(x - tw)} ${f1(y)} ` +
    `C${f1(x - tw * 0.92)} ${f1(y - h * 0.07)},${f1(x - tw * 0.82)} ${f1(y - h * 0.13)},${f1(X(0.17) - tw * 0.7)} ${f1(y - h * 0.17)}`;
  for (const t of CONIFER_LEFT) {
    const ty = y - h * t.f;
    const tipX = X(t.f) - cw * t.w;
    const tipY = ty + h * 0.038;
    d +=
      ` C${f1((X(t.f) + tipX) / 2)} ${f1(ty + h * 0.014)},${f1(tipX + cw * t.w * 0.24)} ${f1(tipY - h * 0.008)},${f1(tipX)} ${f1(tipY)}` +
      ` C${f1(tipX + cw * t.w * 0.3)} ${f1(tipY - h * 0.024)},${f1(X(t.f) - cw * t.w * 0.44)} ${f1(ty - h * 0.03)},${f1(X(t.f + 0.05) - tw * 0.5)} ${f1(ty - h * 0.052)}`;
  }
  d +=
    ` C${f1(X(0.97) - tw * 0.42)} ${f1(y - h * 0.972)},${f1(X(1) - tw * 0.18)} ${f1(y - h * 0.998)},${f1(X(1))} ${f1(y - h)}` +
    ` C${f1(X(1) + tw * 0.22)} ${f1(y - h * 0.996)},${f1(X(0.96) + tw * 0.46)} ${f1(y - h * 0.958)},${f1(X(0.92) + tw * 0.52)} ${f1(y - h * 0.925)}`;
  for (const t of CONIFER_RIGHT) {
    const ty = y - h * t.f;
    const tipX = X(t.f) + cw * t.w;
    const tipY = ty + h * 0.038;
    d +=
      ` C${f1(X(t.f) + cw * t.w * 0.46)} ${f1(ty - h * 0.008)},${f1(tipX - cw * t.w * 0.24)} ${f1(tipY - h * 0.01)},${f1(tipX)} ${f1(tipY)}` +
      ` C${f1(tipX - cw * t.w * 0.3)} ${f1(tipY + h * 0.008)},${f1(X(t.f) + cw * t.w * 0.42)} ${f1(ty + h * 0.03)},${f1(X(t.f - 0.045) + tw * 0.56)} ${f1(ty + h * 0.048)}`;
  }
  d +=
    ` C${f1(x + tw * 0.86)} ${f1(y - h * 0.11)},${f1(x + tw * 0.96)} ${f1(y - h * 0.05)},${f1(x + tw * 1.06)} ${f1(y)} Z`;
  return d;
}

/* ── trees ────────────────────────────────────────────────────────── */

interface TreeSpec {
  x: number;
  y: number;
  h: number;
  /** Crown half-width. */
  cw: number;
  /** Trunk half-width at the bole. */
  tw: number;
  lean: number;
  kind: "broad" | "conifer";
  variant: number;
  /** Limb reach multiplier — elders throw their limbs past the crown. */
  reach?: number;
  /** Bare snapped spars above the crown, the mark of an old tree. */
  spars?: boolean;
}

/** Seven small clumps, spaced so the union keeps deep notches between
 *  them. Positions ride the limb structure below. */
const CROWN_CLUMPS = [
  { dx: -0.02, dy: 0.83, rx: 0.42, ry: 0.15, rot: 0.4, v: 0 },
  { dx: -0.44, dy: 0.71, rx: 0.34, ry: 0.128, rot: 1.1, v: 1 },
  { dx: 0.46, dy: 0.74, rx: 0.35, ry: 0.132, rot: 2.2, v: 2 },
  { dx: -0.74, dy: 0.57, rx: 0.29, ry: 0.11, rot: 0.7, v: 3 },
  { dx: 0.76, dy: 0.59, rx: 0.3, ry: 0.114, rot: 1.8, v: 0 },
  { dx: -0.28, dy: 0.55, rx: 0.27, ry: 0.104, rot: 2.6, v: 2 },
  { dx: 0.3, dy: 0.6, rx: 0.28, ry: 0.108, rot: 0.2, v: 3 },
];

function broadCrown(t: TreeSpec): string[] {
  const { x, y, h, cw, variant, lean } = t;
  const cx = x + lean * 0.95;
  return CROWN_CLUMPS.map((c) =>
    foliage(cx + cw * c.dx, y - h * c.dy, cw * c.rx, h * c.ry, variant + c.v, c.rot),
  );
}

/** Every path that makes up one tree, in one flat list. Silhouette
 *  trees share a fill, so trunk, limbs and clumps union into a single
 *  readable shape — and the rim pass can re-use the same list. */
function treePaths(spec: TreeSpec): string[] {
  const { x, y, h, cw, tw, lean, kind } = spec;
  if (kind === "conifer") return [coniferPath(x, y, h, cw, tw, lean)];
  const out = [forkedTrunk(x, y, h * 0.72, tw, lean, spec.reach ?? 1)];
  if (spec.spars) {
    out.push(blade(x + lean * 0.7 - cw * 0.5, y - h * 0.72, cw * 0.55, -2.45, tw * 0.15, 0.14));
    out.push(blade(x + lean * 0.8 + cw * 0.44, y - h * 0.76, cw * 0.48, -0.78, tw * 0.13, -0.16));
  }
  return out.concat(broadCrown(spec));
}

/** A tree in one tone. When it is named, the moonlight finds it: the
 *  same paths again on top in a moon-tinted tone. An offset copy behind
 *  was tried first and peeked through every notch in the crown as pale
 *  confetti — a wash over the tree's own shape is the honest read. */
function TreeShape({
  spec,
  fill,
  lit = 0,
  litColor,
}: {
  spec: TreeSpec;
  fill: string;
  lit?: number;
  litColor?: string;
}) {
  const paths = treePaths(spec);
  return (
    <>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={fill} />
      ))}
      {lit > 0 && litColor && (
        <g opacity={Math.min(0.34, lit * 0.15)}>
          {paths.map((d, i) => (
            <path key={`l${i}`} d={d} fill={litColor} />
          ))}
        </g>
      )}
    </>
  );
}

/* ── bracken ──────────────────────────────────────────────────────── */

/** A low fringe of undergrowth. Runs along the rim of the clearing so
 *  the floor never reads as a lozenge laid on top of the forest. Each
 *  frond gets its own height from two out-of-phase sines, so the fringe
 *  is uneven the way scrub is. */
function bracken(
  x0: number,
  x1: number,
  yAt: (x: number) => number,
  height: number,
  seed: number,
  bumps: number,
): string {
  const step = (x1 - x0) / bumps;
  let d = `M${f1(x0)} ${f1(yAt(x0))}`;
  for (let i = 0; i < bumps; i++) {
    const xa = x0 + step * i;
    const xb = xa + step;
    const xm = (xa + xb) / 2;
    const s = Math.sin(seed * 9.7 + i * 2.399) * 0.5 + Math.sin(seed * 3.1 + i * 5.113) * 0.5;
    const tip = yAt(xm) - height * (0.5 + s * 0.45 + (i % 3 === 0 ? 0.45 : 0));
    d +=
      ` Q${f1(xm - step * 0.2)} ${f1(tip)} ${f1(xm)} ${f1(tip + height * 0.14)}` +
      ` Q${f1(xm + step * 0.24)} ${f1(tip - height * 0.22)} ${f1(xb)} ${f1(yAt(xb) + height * 0.25)}`;
  }
  // Return along the rim itself. Closing across a straight line instead
  // filled the whole inside of the arc — the clearing went dark above
  // the fringe and the circle read as a band.
  for (let i = bumps; i >= 0; i--) {
    d += ` L${f1(x0 + step * i)} ${f1(yAt(x0 + step * i) + height * 1.5)}`;
  }
  return `${d} Z`;
}

/* ── seat stones ──────────────────────────────────────────────────── */

/** Low weathered seat-slab: flat-worn top, undercut sides, chipped
 *  corners. Seven cubic segments; no ellipse anywhere. */
function seatStone(cx: number, cy: number, w: number, h: number, v: number): string {
  const j = (i: number) => {
    const s = Math.sin((v + 1) * 12.9898 + i * 78.233) * 43758.5453;
    return s - Math.floor(s) - 0.5;
  };
  return [
    `M${f1(cx - w)} ${f1(cy - h * 0.34)}`,
    `C${f1(cx - w * 1.04)} ${f1(cy - h * 0.66 + j(1) * h * 0.16)},${f1(cx - w * 0.86)} ${f1(cy - h * 0.9)},${f1(cx - w * 0.58)} ${f1(cy - h * 0.97 + j(2) * h * 0.12)}`,
    `C${f1(cx - w * 0.26)} ${f1(cy - h * 1.05)},${f1(cx + w * 0.08)} ${f1(cy - h * 1.02 + j(3) * h * 0.14)},${f1(cx + w * 0.42)} ${f1(cy - h * 0.94)}`,
    `C${f1(cx + w * 0.72)} ${f1(cy - h * 0.86 + j(4) * h * 0.14)},${f1(cx + w * 0.96)} ${f1(cy - h * 0.64)},${f1(cx + w)} ${f1(cy - h * 0.34)}`,
    `C${f1(cx + w * 1.02)} ${f1(cy - h * 0.14)},${f1(cx + w * 0.71)} ${f1(cy - h * 0.02)},${f1(cx + w * 0.33)} ${f1(cy)}`,
    `C${f1(cx - w * 0.1)} ${f1(cy + h * 0.04)},${f1(cx - w * 0.66)} ${f1(cy + h * 0.02)},${f1(cx - w * 0.9)} ${f1(cy - h * 0.1)}`,
    `C${f1(cx - w * 0.99)} ${f1(cy - h * 0.18)},${f1(cx - w)} ${f1(cy - h * 0.27)},${f1(cx - w)} ${f1(cy - h * 0.34)}`,
    "Z",
  ].join(" ");
}

/** The worn upper lip that catches the pool once the silver reaches the
 *  stone. A thin sliver along the top, not a pale facet. */
function stoneLip(cx: number, cy: number, w: number, h: number, v: number): string {
  const j = (i: number) => {
    const s = Math.sin((v + 3) * 21.13 + i * 41.77) * 24634.6345;
    return s - Math.floor(s) - 0.5;
  };
  return [
    `M${f1(cx - w * 0.78)} ${f1(cy - h * 0.7)}`,
    `C${f1(cx - w * 0.66)} ${f1(cy - h * 0.9 + j(1) * h * 0.1)},${f1(cx - w * 0.36)} ${f1(cy - h * 0.99)},${f1(cx - w * 0.04)} ${f1(cy - h * 0.97 + j(2) * h * 0.08)}`,
    `C${f1(cx + w * 0.3)} ${f1(cy - h * 0.96)},${f1(cx + w * 0.66)} ${f1(cy - h * 0.86 + j(3) * h * 0.08)},${f1(cx + w * 0.8)} ${f1(cy - h * 0.66)}`,
    `C${f1(cx + w * 0.52)} ${f1(cy - h * 0.82)},${f1(cx - w * 0.36)} ${f1(cy - h * 0.84)},${f1(cx - w * 0.78)} ${f1(cy - h * 0.7)}`,
    "Z",
  ].join(" ");
}

/* ── spirits (kept from v1, seated and turning) ───────────────────── */

/** Translucent teardrop presence with a bright pearl at heart height
 *  and a slow breathing pulse. Unchanged in construction from v1 — this
 *  is the part of the scene the director liked. What is new is that it
 *  descends to its seat, sits low and squat rather than standing, and
 *  turns toward the centre of the ring. */
function SpiritFigure({
  x,
  y,
  height,
  opacity,
  color,
  index,
  turn,
}: {
  x: number;
  y: number;
  height: number;
  opacity: number;
  color: string;
  index: number;
  /** Degrees of lean toward the centre of the ring. */
  turn: number;
}) {
  const topY = y - height;
  const heartY = topY + height * 0.45;
  const bodyW = height * 0.32;
  const haloR = height * 0.5;
  const coreId = `v2SpiritCore-${index}`;
  const haloId = `v2SpiritHalo-${index}`;
  const pulseDelay = `-${(index * 0.7).toFixed(1)}s`;
  const heartShift = (turn / 6) * bodyW * 0.3;
  return (
    <g opacity={opacity} transform={`rotate(${turn.toFixed(2)}, ${f1(x)}, ${f1(y)})`}>
      <animate
        attributeName="opacity"
        values={`${opacity * 0.7};${opacity};${opacity * 0.7}`}
        dur="4s"
        begin={pulseDelay}
        repeatCount="indefinite"
      />
      <defs>
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8e0" stopOpacity={0.5} />
          <stop offset="34%" stopColor={color} stopOpacity={0.26} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={0.055} />
          <stop offset="58%" stopColor={color} stopOpacity={0.016} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Wide and low. A halo as tall as it is round drew a visible egg
          around the figure; spread flat it reads as air. */}
      <ellipse cx={x} cy={heartY} rx={haloR * 1.7} ry={haloR * 0.85} fill={`url(#${haloId})`} />

      <path
        d={`M${x} ${topY}
            C${x - bodyW * 0.5} ${topY + height * 0.08},
             ${x - bodyW * 1.0} ${topY + height * 0.32},
             ${x - bodyW * 0.95} ${topY + height * 0.55}
            C${x - bodyW * 0.85} ${topY + height * 0.78},
             ${x - bodyW * 0.45} ${topY + height * 0.94},
             ${x} ${y}
            C${x + bodyW * 0.45} ${topY + height * 0.94},
             ${x + bodyW * 0.85} ${topY + height * 0.78},
             ${x + bodyW * 0.95} ${topY + height * 0.55}
            C${x + bodyW * 1.0} ${topY + height * 0.32},
             ${x + bodyW * 0.5} ${topY + height * 0.08},
             ${x} ${topY}
            Z`}
        fill={color}
        opacity={0.11}
      />

      {/* The pearl is a tall sliver, not a filled oval — a round core
          inside a round body reads as a glowing egg. */}
      <ellipse
        cx={x + heartShift}
        cy={heartY}
        rx={bodyW * 0.44}
        ry={height * 0.25}
        fill={`url(#${coreId})`}
      />
    </g>
  );
}

/* ── layout ───────────────────────────────────────────────────────── */

const MOON_X = 202;
const MOON_Y = 36;

/** The clearing, as an ellipse in the ground plane. Seats, the silver
 *  pool and the spirits are all placed against it, so the ring reads as
 *  one circle in perspective rather than a row. */
const RING = { cx: 200, cy: 164, rx: 120, ry: 31 };

/** The clearing rim, wobbled hard enough that it never reads as an
 *  ellipse, and re-used by the bracken so the fringe follows it.
 *  Integer harmonics only, so the loop closes cleanly at the seam. */
const RIM_WOBBLE = (a: number) =>
  1 + Math.sin(a * 3 + 1.4) * 0.075 + Math.cos(a * 5) * 0.05 + Math.sin(a * 9 + 0.6) * 0.028;

const rimPoint = (a: number) => {
  const w = RIM_WOBBLE(a);
  return { x: RING.cx + Math.cos(a) * RING.rx * w, y: RING.cy + Math.sin(a) * RING.ry * w };
};

const CLEARING_PATH = closedCurve(
  Array.from({ length: 26 }, (_, i) => {
    const p = rimPoint((i / 26) * Math.PI * 2);
    return [p.x, p.y] as [number, number];
  }),
);

/** y of the far rim of the clearing at a given x — the bracken fringe
 *  rides this line. Solved by two fixed-point passes because the rim
 *  radius itself depends on the angle. */
const farRimY = (x: number) => {
  let a = -Math.acos(Math.max(-1, Math.min(1, (x - RING.cx) / RING.rx)));
  for (let k = 0; k < 3; k++) {
    const w = RIM_WOBBLE(a);
    a = -Math.acos(Math.max(-1, Math.min(1, (x - RING.cx) / (RING.rx * w))));
  }
  return RING.cy + Math.sin(a) * RING.ry * RIM_WOBBLE(a);
};

const onRing = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: RING.cx + Math.cos(a) * RING.rx, y: RING.cy + Math.sin(a) * RING.ry };
};

/** Five seats around the open horseshoe. Depth scale comes from how far
 *  down the ellipse the seat sits — the back seat is the smallest. */
const SEATS = [196, 236, 272, 308, 348].map((deg, i) => {
  const p = onRing(deg);
  const t = (p.y - 133) / 24.6;
  return {
    x: p.x,
    y: p.y,
    scale: 0.78 + 0.34 * t,
    turn: (RING.cx - p.x) * 0.05,
    delay: 0.56 + i * 0.076,
    index: i,
  };
});

/** Far treeline: a low dense arc behind the ring, with a deliberate gap
 *  at centre for the moon to pour through. */
const FAR_TREES: TreeSpec[] = [
  { x: 14, y: 140, h: 74, cw: 25, tw: 3.4, lean: 2, kind: "broad", variant: 0 },
  { x: 44, y: 136, h: 58, cw: 12, tw: 2.4, lean: -1, kind: "conifer", variant: 1 },
  { x: 72, y: 139, h: 84, cw: 27, tw: 3.6, lean: 3, kind: "broad", variant: 2 },
  { x: 104, y: 134, h: 66, cw: 14, tw: 2.6, lean: 1, kind: "conifer", variant: 3 },
  { x: 132, y: 138, h: 70, cw: 23, tw: 3.2, lean: -2, kind: "broad", variant: 1 },
  { x: 160, y: 135, h: 54, cw: 11, tw: 2.2, lean: 2, kind: "conifer", variant: 0 },
  { x: 246, y: 135, h: 58, cw: 12, tw: 2.3, lean: -2, kind: "conifer", variant: 2 },
  { x: 274, y: 138, h: 72, cw: 24, tw: 3.3, lean: 2, kind: "broad", variant: 3 },
  { x: 304, y: 134, h: 64, cw: 14, tw: 2.6, lean: -1, kind: "conifer", variant: 1 },
  { x: 334, y: 139, h: 82, cw: 27, tw: 3.5, lean: -3, kind: "broad", variant: 0 },
  { x: 374, y: 137, h: 62, cw: 21, tw: 3.0, lean: 2, kind: "broad", variant: 2 },
];

/** The elder ring — the trees that stand around the clearing. Three of
 *  them are named in the incantation.
 *
 *  The ring is split by depth, not by importance: a tree standing on the
 *  far arc is BEHIND the clearing floor and must be drawn before it.
 *  Drawing the whole ring in front hid four fifths of the circle and the
 *  clearing read as a lit road across the bottom of the frame. */
const ELDER_ALDER: TreeSpec = {
  x: 142, y: 137, h: 112, cw: 27, tw: 4.4, lean: -4, kind: "broad", variant: 1, spars: true, reach: 1.3,
};
const ELDER_YEW: TreeSpec = {
  x: 292, y: 144, h: 118, cw: 37, tw: 6.6, lean: -6, kind: "broad", variant: 3, spars: true, reach: 1.4,
};
const ELDER_OAK: TreeSpec = {
  x: 46, y: 184, h: 150, cw: 54, tw: 8.4, lean: 8, kind: "broad", variant: 2, spars: true, reach: 1.45,
};

/** Far arc of the ring — behind the clearing. */
const BACK_TREES: TreeSpec[] = [
  { x: 110, y: 144, h: 104, cw: 23, tw: 4.0, lean: 3, kind: "broad", variant: 2 },
  ELDER_ALDER,
  { x: 176, y: 134, h: 94, cw: 17, tw: 3.0, lean: 2, kind: "conifer", variant: 0 },
  { x: 228, y: 134, h: 102, cw: 19, tw: 3.2, lean: -2, kind: "conifer", variant: 3 },
  { x: 262, y: 138, h: 86, cw: 16, tw: 2.9, lean: 2, kind: "conifer", variant: 1 },
  ELDER_YEW,
];

/** Near arc of the ring — between the viewer and the clearing. */
const SIDE_TREES: TreeSpec[] = [
  ELDER_OAK,
  { x: 64, y: 186, h: 118, cw: 20, tw: 3.8, lean: 3, kind: "conifer", variant: 2 },
  { x: 340, y: 184, h: 112, cw: 19, tw: 3.6, lean: -3, kind: "conifer", variant: 1 },
  { x: 372, y: 188, h: 140, cw: 46, tw: 7.4, lean: -6, kind: "broad", variant: 0, spars: true, reach: 1.4 },
];

/** Near wings — cropped by the frame, almost black, holding the edges.
 *  Pushed further off-frame than v1's so they do not eat the corners. */
const NEAR_TREES: TreeSpec[] = [
  { x: -16, y: 258, h: 250, cw: 60, tw: 10, lean: 6, kind: "broad", variant: 3, spars: true, reach: 1.5 },
  { x: 20, y: 268, h: 216, cw: 26, tw: 5.4, lean: 3, kind: "conifer", variant: 1 },
  { x: 382, y: 264, h: 240, cw: 30, tw: 6, lean: -4, kind: "conifer", variant: 2 },
  { x: 414, y: 258, h: 258, cw: 64, tw: 11, lean: -6, kind: "broad", variant: 0, spars: true, reach: 1.5 },
];

const STARS = [
  { x: 34, y: 22, r: 1.1 }, { x: 68, y: 12, r: 0.7 }, { x: 96, y: 30, r: 0.9 },
  { x: 128, y: 16, r: 1.2 }, { x: 152, y: 40, r: 0.6 }, { x: 168, y: 20, r: 0.8 },
  { x: 240, y: 18, r: 1.0 }, { x: 262, y: 38, r: 0.6 }, { x: 288, y: 14, r: 1.1 },
  { x: 318, y: 30, r: 0.8 }, { x: 348, y: 18, r: 0.9 }, { x: 378, y: 34, r: 0.7 },
  { x: 208, y: 8, r: 0.6 }, { x: 112, y: 50, r: 0.5 }, { x: 300, y: 52, r: 0.5 },
];

/** The three beams, and where each one lands on the clearing floor.
 *  Their tops sit almost on the moon so the light reads as radiating
 *  from the source — spaced apart they merged into a bright bar under
 *  the disc. */
const BEAMS = [
  { top: 196, foot: 146, half: 15, footY: 166, footR: 1.4, delay: 0.16 },
  { top: 203, foot: 204, half: 21, footY: 156, footR: 1.7, delay: 0.14 },
  { top: 209, foot: 258, half: 13, footY: 168, footR: 1.3, delay: 0.18 },
];

const FIREFLY_CONFIG = {
  count: 24,
  bounds: { x: 112, y: 92, width: 176, height: 62 },
  colors: ["#e8d090", "#d0b870", "#f0e0a0", "#c8a850"],
  sizeRange: [0.4, 0.9] as [number, number],
  speedRange: [3, 8] as [number, number],
  driftX: 0,
  driftY: -1,
  lifeRange: [3, 7] as [number, number],
};

/* ── scene ────────────────────────────────────────────────────────── */

function SanctumScene({ progress: p }: SceneProps) {
  const fireflies = useParticles(FIREFLY_CONFIG, p > 0.52);

  // Phrase 1 — the pour.
  const unveil = sub(p, 0.04, 0.26);
  const moonUp = sub(p, 0.02, 0.3);
  const pour = sub(p, 0.2, 0.3);

  // Phrase 2 — the council. Each elder answers to its own name: a flare
  // as the word lands, decaying into a wash it keeps. A flat wash alone
  // was too quiet to read as "the tree heard me".
  const named = (start: number) => {
    const hold = sub(p, start, 0.07);
    const up = sub(p, start, 0.025);
    const down = sub(p, start + 0.025, 0.075);
    return hold + up * (1 - down) * 0.95;
  };
  const oakNamed = named(0.52);
  const alderNamed = named(0.63);
  const yewNamed = named(0.72);
  const rimOf = (t: TreeSpec) =>
    t === ELDER_OAK ? oakNamed : t === ELDER_ALDER ? alderNamed : t === ELDER_YEW ? yewNamed : 0;

  // Night lifts a little as the moon is let in; never past dim. The
  // dormant frame still has to be legible — the house has fixed a
  // too-dark opening three times, so the floor for every tone is set at
  // p=0, not just at the climax.
  const skyTop = `hsl(228, ${21 + moonUp * 7}%, ${8.5 + moonUp * 4}%)`;
  const skyMid = `hsl(233, ${19 + moonUp * 6}%, ${5.5 + moonUp * 3}%)`;
  const skyLow = `hsl(220, ${17 + moonUp * 6}%, ${3.6 + moonUp * 2.2}%)`;

  const toneFar = `hsl(216, ${15 + moonUp * 4}%, ${12 + moonUp * 3}%)`;
  const toneMid = `hsl(211, ${13 + moonUp * 4}%, ${7.4 + moonUp * 1.6}%)`;
  const toneNear = `hsl(206, ${11 + moonUp * 3}%, ${3.6 + moonUp * 1}%)`;
  // Nearly neutral. A green floor turned the silver pool yellow-green;
  // desaturating the ground lets the moonlight read as moonlight.
  const toneFloor = `hsl(158, ${5 + moonUp * 4}%, ${6.5 + moonUp * 2}%)`;

  const poolScale = 0.14 + pour * 0.86;

  return (
    <svg
      viewBox="0 0 400 250"
      overflow="hidden"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <GlowFilter id="v2SanctumMoon" radius={9} color="#dfe7ff" opacity={0.45} />

        <clipPath id="v2SanctumClearing">
          <path d={CLEARING_PATH} />
        </clipPath>

        {/* Warmth a seated spirit spills onto its own stone. */}
        <radialGradient id="v2SanctumSeatWarm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d0b870" stopOpacity={0.16} />
          <stop offset="60%" stopColor="#d0b870" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#d0b870" stopOpacity={0} />
        </radialGradient>

        <linearGradient id="v2SanctumSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="58%" stopColor={skyMid} />
          <stop offset="100%" stopColor={skyLow} />
        </linearGradient>

        <radialGradient id="v2SanctumMoonHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f4f8ff" stopOpacity={moonUp * 0.5} />
          <stop offset="26%" stopColor="#cfdcf5" stopOpacity={moonUp * 0.18} />
          <stop offset="62%" stopColor="#9fb6dc" stopOpacity={moonUp * 0.055} />
          <stop offset="100%" stopColor="#9fb6dc" stopOpacity={0} />
        </radialGradient>

        {/* Beams: bright leaving the canopy gap, gone before the floor. */}
        <linearGradient id="v2SanctumBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dce8ff" stopOpacity={0.11} />
          <stop offset="45%" stopColor="#b9cdf0" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#9db4dc" stopOpacity={0} />
        </linearGradient>

        {/* The pool of silver on the clearing floor. */}
        <radialGradient id="v2SanctumPool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dbe7fb" stopOpacity={0.2} />
          <stop offset="40%" stopColor="#adc3e2" stopOpacity={0.1} />
          <stop offset="76%" stopColor="#8299bd" stopOpacity={0.035} />
          <stop offset="100%" stopColor="#8299bd" stopOpacity={0} />
        </radialGradient>

        {/* Darkness closing back in at the rim of the clearing. */}
        <radialGradient id="v2SanctumRimFall" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#03040a" stopOpacity={0} />
          <stop offset="46%" stopColor="#03040a" stopOpacity={0} />
          <stop offset="100%" stopColor="#03040a" stopOpacity={0.62} />
        </radialGradient>

        {/* Where a beam actually lands — a brighter, softer-edged patch. */}
        <radialGradient id="v2SanctumFoot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f4f8ff" stopOpacity={0.28} />
          <stop offset="30%" stopColor="#d6e3f8" stopOpacity={0.12} />
          <stop offset="68%" stopColor="#9fb4d8" stopOpacity={0.03} />
          <stop offset="100%" stopColor="#9fb4d8" stopOpacity={0} />
        </radialGradient>

        <style>{`
          @keyframes v2SanctumDriftA { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-2.2px); } }
          @keyframes v2SanctumDriftB { 0%,100% { transform: translateX(0); } 50% { transform: translateX(1.6px); } }
          @keyframes v2SanctumSwayA { 0%,100% { transform: rotate(-0.2deg); } 50% { transform: rotate(0.2deg); } }
          @keyframes v2SanctumSwayB { 0%,100% { transform: rotate(0.15deg); } 50% { transform: rotate(-0.15deg); } }
          .v2sFar { animation: v2SanctumDriftA 15s ease-in-out infinite; }
          .v2sMid { animation: v2SanctumDriftB 12s ease-in-out infinite; }
          .v2sSwayL { transform-box: fill-box; transform-origin: 50% 100%; animation: v2SanctumSwayA 9s ease-in-out infinite; }
          .v2sSwayR { transform-box: fill-box; transform-origin: 50% 100%; animation: v2SanctumSwayB 11s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* ── Sky ── */}
      <rect width="400" height="250" fill="url(#v2SanctumSky)" />

      {/* ── Stars ── */}
      {STARS.map((s, i) => {
        const sp = sub(p, 0.02 + (i % 5) * 0.03, 0.18);
        if (sp <= 0) return null;
        return (
          <g key={`st${i}`} opacity={sp * 0.75}>
            <circle cx={s.x} cy={s.y} r={s.r * 2.8} fill="#dfe8ff" opacity={0.05} />
            <circle cx={s.x} cy={s.y} r={s.r} fill="#eef3ff" opacity={0.62}>
              {i % 4 === 0 && (
                <animate
                  attributeName="opacity"
                  values="0.62;0.3;0.62"
                  dur={`${5 + (i % 3)}s`}
                  begin={`-${i * 0.6}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        );
      })}

      {/* ── Moon ── */}
      <circle cx={MOON_X} cy={MOON_Y} r={54} fill="url(#v2SanctumMoonHalo)" />
      <circle cx={MOON_X} cy={MOON_Y} r={16} fill="#e9f0ff" opacity={moonUp * 0.09} />
      <circle
        cx={MOON_X}
        cy={MOON_Y}
        r={10.5}
        fill="#f6f9ff"
        opacity={0.22 + moonUp * 0.62}
        filter="url(#v2SanctumMoon)"
      />
      {/* Maria — faint, hand-drawn, so the disc isn't a flat coin. */}
      <g opacity={(0.22 + moonUp * 0.62) * 0.3}>
        <path
          d={`M${MOON_X - 5.0} ${MOON_Y - 3.4} C${MOON_X - 2.4} ${MOON_Y - 5.8},${MOON_X + 1.5} ${MOON_Y - 4.9},${MOON_X + 2.1} ${MOON_Y - 2.1}
              C${MOON_X + 2.6} ${MOON_Y + 0.4},${MOON_X - 1.0} ${MOON_Y + 1.1},${MOON_X - 3.4} ${MOON_Y - 0.4}
              C${MOON_X - 5.2} ${MOON_Y - 1.5},${MOON_X - 5.8} ${MOON_Y - 2.5},${MOON_X - 5.0} ${MOON_Y - 3.4} Z`}
          fill="#a8bad9"
        />
        <path
          d={`M${MOON_X + 1.1} ${MOON_Y + 3.0} C${MOON_X + 3.1} ${MOON_Y + 1.5},${MOON_X + 5.9} ${MOON_Y + 2.2},${MOON_X + 5.5} ${MOON_Y + 4.4}
              C${MOON_X + 5.1} ${MOON_Y + 6.3},${MOON_X + 1.5} ${MOON_Y + 5.9},${MOON_X + 1.1} ${MOON_Y + 3.0} Z`}
          fill="#a8bad9"
        />
      </g>

      {/* ── The veil. Long, wide, low-contrast haze bands drifting off
             as the incantation opens the sky. Short defined wisps were
             tried first and read as grey fish swimming past the moon —
             wide and faint is haze, narrow and defined is an object. ── */}
      {unveil < 1 && (
        <g
          opacity={(1 - unveil) * 0.9}
          transform={`translate(${(unveil * 60).toFixed(1)}, ${(unveil * -7).toFixed(1)})`}
        >
          <path
            d="M96 30 C132 20, 168 34, 206 27 C240 21, 272 33, 306 26 C330 21, 344 27, 356 24
               C338 38, 306 40, 276 42 C240 45, 206 40, 172 43 C142 46, 114 42, 96 30 Z"
            fill="#8fa1c6"
            opacity={0.055}
          />
          <path
            d="M118 47 C154 40, 186 52, 222 46 C254 41, 282 51, 312 45 C330 41, 342 46, 350 43
               C332 55, 300 56, 270 58 C238 60, 208 55, 178 57 C152 59, 130 55, 118 47 Z"
            fill="#8395ba"
            opacity={0.042}
          />
          <path
            d="M132 16 C166 9, 196 19, 230 13 C258 8, 282 16, 306 11
               C286 24, 256 25, 226 27 C198 29, 170 25, 148 26 C138 26, 133 22, 132 16 Z"
            fill="#9aabcd"
            opacity={0.05}
          />
        </g>
      )}

      {/* ── Moonbeams pouring through the gap in the canopy ── */}
      {BEAMS.map((b, i) => {
        const bp = sub(p, b.delay, 0.28);
        if (bp <= 0) return null;
        return (
          <polygon
            key={`bm${i}`}
            points={`${b.top - 1.5},${MOON_Y + 5} ${b.top + 1.5},${MOON_Y + 5} ${b.foot + b.half},198 ${b.foot - b.half},198`}
            fill="url(#v2SanctumBeam)"
            opacity={bp}
          >
            <animate
              attributeName="opacity"
              values={`${(bp * 0.76).toFixed(3)};${bp.toFixed(3)};${(bp * 0.76).toFixed(3)}`}
              dur={`${7 + i * 2}s`}
              begin={`-${i * 2.4}s`}
              repeatCount="indefinite"
            />
          </polygon>
        );
      })}

      {/* ── FAR: forest floor and the treeline behind the ring ── */}
      <g className="v2sFar">
        <path
          d="M0 148 C28 143, 52 149, 78 145 C104 141, 130 147, 156 143 C182 139, 208 144, 234 141 C260 138, 286 145, 312 141 C338 137, 368 144, 400 140 L400 250 L0 250 Z"
          fill={`hsl(214, ${12 + moonUp * 4}%, ${4.6 + moonUp * 2.4}%)`}
        />
        {FAR_TREES.map((t, i) => (
          <TreeShape key={`ft${i}`} spec={t} fill={toneFar} />
        ))}
      </g>

      {/* ── MID, far arc: the elders standing behind the clearing ── */}
      <g className="v2sMid">
        {BACK_TREES.map((t, i) => (
          <g key={`bt${i}`} className={i % 2 === 0 ? "v2sSwayL" : "v2sSwayR"}>
            <TreeShape spec={t} fill={toneMid} lit={rimOf(t)} litColor="#61789c" />
          </g>
        ))}
      </g>

      {/* ── The clearing floor. Barely distinct from the forest floor
             until the moonlight arrives — the light is what makes the
             circle, not a green disc. ── */}
      <path d={CLEARING_PATH} fill={toneFloor} />

      {/* Everything the moon puts on the floor is clipped to the floor.
          Unclipped, the pool bled a pale wedge onto the near forest and
          the circle stopped being a circle. */}
      <g clipPath="url(#v2SanctumClearing)">
        {/* The pour: silver filling the circle from the centre out */}
        {pour > 0 && (
          <g
            transform={`translate(${RING.cx}, ${RING.cy}) scale(${poolScale.toFixed(3)}) translate(${-RING.cx}, ${-RING.cy})`}
            opacity={0.4 + pour * 0.6}
          >
            <ellipse
              cx={RING.cx}
              cy={RING.cy}
              rx={RING.rx * 0.96}
              ry={RING.ry * 0.99}
              fill="url(#v2SanctumPool)"
            />
          </g>
        )}

        {/* Where the beams land — the brightest silver on the floor.
            Continuing the beam polygons down here was tried and drew
            three flat vertical stripes across the ground; the landing
            pools alone carry the connection. */}
        {BEAMS.map((b, i) => {
          const bp = sub(p, b.delay + 0.1, 0.3);
          if (bp <= 0) return null;
          return (
            <ellipse
              key={`bf${i}`}
              cx={b.foot}
              cy={b.footY}
              rx={b.half * b.footR * (0.5 + bp * 0.5)}
              ry={b.half * b.footR * 0.34 * (0.5 + bp * 0.5)}
              fill="url(#v2SanctumFoot)"
              opacity={bp}
            >
              <animate
                attributeName="opacity"
                values={`${(bp * 0.8).toFixed(3)};${bp.toFixed(3)};${(bp * 0.8).toFixed(3)}`}
                dur={`${9 + i * 2}s`}
                begin={`-${i * 3}s`}
                repeatCount="indefinite"
              />
            </ellipse>
          );
        })}

        {/* The rim of the clearing falls back into the dark, so the
            floor never reads as a lit plate laid on the forest. */}
        <ellipse
          cx={RING.cx}
          cy={RING.cy}
          rx={RING.rx * 1.02}
          ry={RING.ry * 1.05}
          fill="url(#v2SanctumRimFall)"
        />

        {/* Grass on the clearing floor. Drawn dark: it stands between
            the viewer and the lit floor, so it silhouettes. */}
        {[
          [118, 174], [140, 181], [168, 186], [198, 188], [228, 186],
          [252, 181], [276, 173], [106, 160], [298, 162], [154, 147],
          [248, 148], [200, 143], [128, 154], [176, 160], [216, 168],
          [268, 156], [92, 170], [312, 172], [186, 176], [238, 174],
        ].map(([gx, gy], i) => (
          <g key={`gr${i}`} opacity={0.3 + pour * 0.4}>
            {[-0.3, 0.02, 0.28].map((k, j) => (
              <path
                key={j}
                d={blade(gx + j * 1.5 - 1.5, gy, 4 + (i % 3), -Math.PI / 2 + k, 0.4, 0.2)}
                fill={toneNear}
              />
            ))}
          </g>
        ))}
      </g>

      {/* ── Bracken along the far rim, so the clearing edge is a fringe
             of undergrowth rather than a drawn curve ── */}
      <path
        d={bracken(80, 320, (x) => farRimY(x) + 0.8, 3.2, 1, 40)}
        fill={`hsl(150, ${9 + pour * 5}%, ${4 + pour * 1.8}%)`}
      />

      {/* ── MID, near arc: the elders standing in front of the clearing ── */}
      <g className="v2sMid">
        {SIDE_TREES.map((t, i) => (
          <g key={`st${i}`} className={i % 2 === 0 ? "v2sSwayL" : "v2sSwayR"}>
            <TreeShape spec={t} fill={toneMid} lit={rimOf(t)} litColor="#61789c" />
          </g>
        ))}
      </g>

      {/* ── Seat stones, and the spirits that come to them ── */}
      {SEATS.map((s) => {
        const w = 10.5 * s.scale;
        const h = 6.8 * s.scale;
        const lit = sub(pour, 0.25 + s.index * 0.06, 0.3);
        const arrive = sub(p, s.delay, 0.1);
        const seated = sub(p, s.delay + 0.05, 0.09);
        const drop = (1 - arrive) * -22 * s.scale;
        const spiritH = 30 * s.scale;
        return (
          <g key={`seat${s.index}`}>
            {/* Cast shadow away from the moon, so the slab has weight */}
            <path
              d={seatStone(s.x + (s.x < MOON_X ? -w * 0.5 : w * 0.5), s.y + h * 0.16, w * 0.95, h * 0.34, s.index + 7)}
              fill="#020306"
              opacity={0.35 + lit * 0.25}
            />
            <path
              d={seatStone(s.x, s.y, w, h, s.index)}
              fill={`hsl(212, ${8 + lit * 4}%, ${6 + lit * 3}%)`}
            />
            {/* The worn lip catching the pool — a sliver, not a facet */}
            <path
              d={stoneLip(s.x, s.y, w, h, s.index)}
              fill="#a9bdd8"
              opacity={0.03 + lit * 0.11}
            />

            {/* The spirit's own warmth on the stone it sits on — the
                only thing that keeps it from floating. */}
            {arrive > 0 && (
              <ellipse
                cx={s.x}
                cy={s.y - h * 0.72}
                rx={w * 0.9}
                ry={h * 0.42}
                fill="url(#v2SanctumSeatWarm)"
                opacity={arrive}
              />
            )}

            {arrive > 0 && (
              <g transform={`translate(0, ${drop.toFixed(2)})`}>
                <SpiritFigure
                  index={s.index}
                  x={s.x}
                  y={s.y - h * 0.98}
                  height={spiritH}
                  opacity={arrive * 0.58}
                  color="#d0b870"
                  turn={s.turn * seated}
                />
              </g>
            )}
          </g>
        );
      })}

      {/* ── Fireflies — kept from v1, gathering once the council does ── */}
      {p > 0.52 && <ParticleField particles={fireflies} opacity={0.32} />}

      {/* ── NEAR: the wings, almost black, holding the frame ── */}
      {NEAR_TREES.map((t, i) => (
        <g key={`nt${i}`} className={i < 2 ? "v2sSwayL" : "v2sSwayR"}>
          <TreeShape spec={t} fill={toneNear} />
        </g>
      ))}

      {/* ── Scrub at the shoulders of the ring. Foliage clumps low to
             the ground, not fern fans — a radial fan of fronds read as
             a sunburst rather than a plant. ── */}
      {[
        { x: 74, y: 176, rx: 17, ry: 6.5, v: 1 },
        { x: 108, y: 186, rx: 13, ry: 5, v: 2 },
        { x: 328, y: 180, rx: 16, ry: 6, v: 3 },
        { x: 294, y: 190, rx: 12, ry: 4.6, v: 0 },
        { x: 176, y: 214, rx: 22, ry: 8, v: 2 },
        { x: 246, y: 216, rx: 20, ry: 7.5, v: 1 },
      ].map((sh, i) => (
        <path
          key={`sh${i}`}
          d={foliage(sh.x, sh.y, sh.rx, sh.ry, sh.v, i * 0.8)}
          fill={toneNear}
        />
      ))}
    </svg>
  );
}

export default memo(SanctumScene);
