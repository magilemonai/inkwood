import { memo } from "react";
import { sub } from "../util";
import type { SceneProps } from "../../types";
import { GlowFilter } from "../../svg/filters";

// ─── THE WAKING WORLD (Inkwood 2) ─────────────────────────
// The finale. A panoramic landscape that ASSEMBLES from barren
// terrain as the player recites callback phrases from every
// previous level.
//
// Phrase 1 "garden bloom, hearth burn bright"  (p 0–0.33)
//   Earth awakens — hills green up, the cottage window glows,
//   the well and the bridge come back, flowers dot the ground.
// Phrase 2 "stars remember, spirits sing"      (p 0.33–0.66)
//   Sky awakens — stars ignite, the moon rises, spirits gather.
// Phrase 3 "the forest remembers"              (p 0.66–1)
//   The Great Tree rises, the ley web weaves every place to
//   every other, and the light changes.
//
// ─── OPTIONS, NOT A DECISION ──────────────────────────────
// The 21-connection complete graph is defended territory: every
// one of the 7 LEY_POINTS connects to every other, and the node
// positions and connection list below are byte-identical to v1.
// What is on the table is how that web is DRAWN, so the finale
// reads as a woven, living world rather than a network diagram.
//
// Three variants, chosen by the dev-only `?worldvariant=` param
// (read once at module init; default "a"):
//
//   a — INK THREADS.  Hair-thin ink strokes over a soft wide
//       halo stroke, each carrying its own hand-inked weight and
//       a small turbulence wobble. A thread flares as it draws
//       then settles back to a whisper, so the web never blazes
//       all at once, and a mote of light travels every finished
//       thread toward the Great Tree. Nodes are soft halos.
//
//   b — WOVEN GLOW.  Every thread is a per-line gradient, bright
//       at each endpoint and nearly gone at mid-span, so the web
//       reads as places holding hands rather than wires. Hills
//       gain three tones and a mist band; nodes are warm glows
//       sized by how much each place matters (the Tree largest).
//
//   c — DAWN BREAKS.  A's threads, but the last incantation is
//       morning: the horizon swells peach to gold, the threads
//       catch first light and go gold-white, long soft shadows
//       fall away from the Tree, the moon pales out. The game
//       ends in daylight.
//
// After the director picks, delete the switch and keep one.

type Variant = "a" | "b" | "c";

const VARIANT: Variant = (() => {
  if (typeof window === "undefined") return "a";
  try {
    const v = new URLSearchParams(window.location.search).get("worldvariant");
    if (v === "b" || v === "c") return v;
  } catch { /* ignore */ }
  return "a";
})();

// ─── HAND-CRAFTED PATHS ──────────────────────────────────

/** Far hills — gentle rolling distant range */
const HILLS_FAR = `
  M0 105 C30 98, 55 102, 80 96
  C105 90, 120 85, 145 88
  C165 91, 178 82, 200 78
  C222 74, 240 80, 260 84
  C280 88, 300 82, 320 86
  C345 90, 365 95, 390 92
  L400 97 L400 250 L0 250 Z`;

/** Mid hills — closer, slightly more detail */
const HILLS_MID = `
  M0 140 C25 135, 45 138, 70 132
  C95 126, 110 130, 130 125
  C150 120, 165 128, 185 122
  C205 117, 220 120, 240 126
  C265 132, 285 125, 310 130
  C335 135, 360 128, 385 132
  L400 138 L400 250 L0 250 Z`;

/** Foreground ground — closest, most detail */
const GROUND = `
  M0 175 C20 172, 40 178, 65 174
  C90 170, 110 176, 135 172
  C160 168, 180 174, 200 170
  C225 166, 245 172, 270 168
  C295 164, 315 170, 340 166
  C365 162, 380 168, 400 165
  L400 250 L0 250 Z`;

/** The Great Tree silhouette — rises behind hills, center */
const GREAT_TREE_TRUNK = `
  M190 110 C188 100, 186 85, 185 72
  C184 60, 183 48, 184 38
  C185 30, 188 25, 192 22
  C196 19, 200 18, 204 19
  C208 22, 211 25, 212 30
  C213 38, 214 48, 213 60
  C212 72, 210 85, 208 100
  C206 108, 195 112, 190 110 Z`;

/** Great Tree canopy — massive, fills upper-center */
const GREAT_TREE_CANOPY = `
  M140 55 C145 42, 155 30, 165 24
  C175 18, 182 12, 190 8
  C198 4, 202 4, 210 8
  C218 12, 225 18, 235 24
  C245 30, 255 42, 260 55
  C263 65, 258 72, 250 76
  C240 80, 228 78, 218 75
  C210 72, 205 74, 200 75
  C195 76, 190 74, 182 75
  C172 78, 160 80, 150 76
  C142 72, 137 65, 140 55 Z`;

/** Great Tree roots — spread across the mid-hills */
const TREE_ROOTS = [
  "M192 108 C180 112, 160 118, 140 125",
  "M188 106 C175 114, 155 122, 130 130",
  "M208 108 C220 112, 240 118, 260 125",
  "M210 106 C225 114, 245 122, 270 130",
];

/** Cottage silhouette on right hillside */
const COTTAGE = `
  M305 118 L305 108 L312 102 L319 108 L319 118 Z`;

/** Bridge arch silhouette — distant, between two hills */
const BRIDGE_ARCH = `
  M135 130 C140 124, 148 120, 155 118
  C162 116, 168 118, 175 120
  C182 124, 190 130, 195 134`;

/** Valley mist — asymmetric wisps that lie between the far and mid
 *  ranges. Variant B only; never a wash, always a shape. */
const MIST_WISPS = [
  `M0 112 C34 106, 62 116, 98 110 C136 104, 168 115, 206 109
   C244 103, 282 114, 320 108 C352 103, 378 111, 400 107
   L400 121 C370 126, 340 118, 302 123 C262 128, 226 120, 186 125
   C146 130, 106 122, 66 127 C42 130, 20 124, 0 127 Z`,
  `M0 128 C40 124, 76 133, 118 128 C158 123, 190 132, 232 127
   C272 122, 308 131, 346 126 C372 123, 388 129, 400 126
   L400 136 C376 140, 348 134, 312 138 C270 143, 234 136, 194 140
   C152 144, 112 137, 72 141 C44 144, 22 139, 0 141 Z`,
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

// Draw schedule. Every one of the 21 threads finishes by unityP 0.90,
// so at 99% the web is complete — v1's 0.04 step started the last
// connection at unityP 1.0, leaving five threads unfinished at the end
// of the game.
const LEY_START = 0.12;
const LEY_STEP = 0.028;
const LEY_DRAW = 0.22;

const leyDraw = (unityP: number, i: number) =>
  sub(unityP, LEY_START + i * LEY_STEP, LEY_DRAW);
const leySettle = (unityP: number, i: number) =>
  sub(unityP, LEY_START + i * LEY_STEP + LEY_DRAW, 0.18);

/** How much each place weighs in the web. The Great Tree is the heart. */
const NODE_WEIGHT: number[] = [0.52, 0.55, 0.62, 0.48, 0.45, 0.52, 1.0];

/** Callback silhouettes that throw a shadow when the dawn comes (C). */
const GUARDIAN_STONES = [
  { x: 70,  baseY: 142, h: 18 },
  { x: 120, baseY: 140, h: 22 },
  { x: 175, baseY: 138, h: 20 },
  { x: 240, baseY: 138, h: 22 },
  { x: 295, baseY: 140, h: 18 },
  { x: 340, baseY: 142, h: 20 },
];

// ─── VARIANT A / C — INK THREADS ─────────────────────────

/** The web as ink: a hair-thin thread over a soft halo stroke, flaring
 *  as it draws and settling back so the whole net never blazes at once,
 *  with a mote of light travelling each thread toward the Tree. */
function LeyWebInk({ unityP, dawn }: { unityP: number; dawn: number }) {
  if (unityP <= LEY_START) return null;
  // The threads catch the first light in variant C.
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

// ─── VARIANT B — WOVEN GLOW ──────────────────────────────

/** The web as connections between places: each thread is brightest where
 *  it touches its two nodes and nearly gone at mid-span, so the eye reads
 *  "these places hold each other" rather than "here is a network". */
function LeyWebWoven({ unityP }: { unityP: number }) {
  if (unityP <= LEY_START) return null;
  return (
    <>
      <defs>
        {LEY_LINES.map((L, i) => (
          <linearGradient
            key={`wg${i}`}
            id={`wLey${i}`}
            gradientUnits="userSpaceOnUse"
            x1={L.from.x}
            y1={L.from.y}
            x2={L.to.x}
            y2={L.to.y}
          >
            <stop offset="0%" stopColor="#fff6d8" stopOpacity={1} />
            <stop offset="7%" stopColor="#f4e2ae" stopOpacity={0.46} />
            <stop offset="26%" stopColor="#e4d29a" stopOpacity={0.11} />
            <stop offset="50%" stopColor="#d8c890" stopOpacity={0.035} />
            <stop offset="74%" stopColor="#e4d29a" stopOpacity={0.11} />
            <stop offset="93%" stopColor="#f4e2ae" stopOpacity={0.46} />
            <stop offset="100%" stopColor="#fff6d8" stopOpacity={1} />
          </linearGradient>
        ))}
      </defs>

      {/* Wide soft pass — the endpoints bloom into the land. */}
      <g>
        {LEY_LINES.map((L, i) => {
          const dp = leyDraw(unityP, i);
          if (dp <= 0) return null;
          const dash = L.len * 1.06;
          return (
            <path
              key={`bh${i}`}
              d={L.d}
              fill="none"
              stroke={`url(#wLey${i})`}
              strokeWidth={4.2}
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={dash * (1 - dp)}
              opacity={Math.min(1, dp * 2.5) * 0.16}
            />
          );
        })}
      </g>

      {/* The thread itself. */}
      <g>
        {LEY_LINES.map((L, i) => {
          const dp = leyDraw(unityP, i);
          if (dp <= 0) return null;
          const dash = L.len * 1.06;
          const settle = leySettle(unityP, i);
          return (
            <path
              key={`bk${i}`}
              d={L.d}
              fill="none"
              stroke={`url(#wLey${i})`}
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={dash * (1 - dp)}
              opacity={Math.min(1, dp * 2.5) * (0.9 - 0.25 * settle)}
            />
          );
        })}
      </g>
    </>
  );
}

// ─── LEY NODES ───────────────────────────────────────────

function LeyNodes({ unityP, dawn }: { unityP: number; dawn: number }) {
  return (
    <>
      {LEY_POINTS.map((pt, i) => {
        const np = sub(unityP, 0.18 + i * 0.05, 0.22);
        if (np <= 0) return null;
        if (VARIANT === "b") {
          // Warm glows, sized by how much the place matters.
          const w = NODE_WEIGHT[i];
          const r = 3.5 + w * 11;
          return (
            <g key={`n${i}`}>
              <circle cx={pt.x} cy={pt.y} r={r} fill="url(#wWarmNode)" opacity={np * 0.9} />
              <circle cx={pt.x} cy={pt.y} r={0.6 + w * 1.7} fill="#fff4d0" opacity={np * (0.26 + w * 0.34)} />
            </g>
          );
        }
        // A / C: soft halos, never bright discs.
        return (
          <g key={`n${i}`}>
            <circle cx={pt.x} cy={pt.y} r={11} fill="url(#wHalo)" opacity={np * (0.60 + dawn * 0.30)} />
            <circle cx={pt.x} cy={pt.y} r={1} fill="#fdf3d2" opacity={np * (0.14 + dawn * 0.12)} />
          </g>
        );
      })}
    </>
  );
}

// ─── VARIANT C — DAWN SHADOWS ────────────────────────────

/** A long soft shadow thrown away from the light rising behind the Tree. */
function DawnShadow({ x, y, w, len, dawn }: { x: number; y: number; w: number; len: number; dawn: number }) {
  if (dawn <= 0) return null;
  const dir = x < 200 ? -1 : 1;
  const dx = dir * len * dawn;
  const dy = len * 0.30 * dawn;
  // Two passes: a solid near-shadow and a longer, fainter tail, so the
  // edge softens the way a low sun's shadow does.
  return (
    <g>
      <path
        d={`M${x - w} ${y} L${x + w} ${y}
            L${x + dx * 1.55 + w * 0.3} ${y + dy * 1.55}
            L${x + dx * 1.55 - w * 0.3} ${y + dy * 1.55} Z`}
        fill="#080d13"
        opacity={0.20 * dawn}
      />
      <path
        d={`M${x - w} ${y} L${x + w} ${y}
            L${x + dx + w * 0.4} ${y + dy}
            L${x + dx - w * 0.4} ${y + dy} Z`}
        fill="#080d13"
        opacity={0.34 * dawn}
      />
    </g>
  );
}

// ─── THE SCENE ───────────────────────────────────────────

function WorldScene({ progress: p }: SceneProps) {
  // Three-phrase breakdown: earth (0-0.33), sky (0.33-0.66), unity (0.66-1)
  const earthP = sub(p, 0, 0.33);
  const skyP = sub(p, 0.33, 0.33);
  const unityP = sub(p, 0.66, 0.34);

  // Sky color — deep indigo → pre-dawn blue → golden dawn
  const skyH = 230 - p * 30;
  const skyS = 15 + p * 15;
  const skyTopL = 4 + p * 12;
  const skyBotL = 6 + p * 18;

  // Hill colors — barren grey-brown → alive green/amber
  const farHillL = 8 + earthP * 10;
  const farHillS = 5 + earthP * 20;
  const midHillL = 6 + earthP * 8;
  const midHillS = 4 + earthP * 18;
  const groundL = 5 + earthP * 6;
  const groundS = 4 + earthP * 15;

  // Dawn glow behind tree (unity phase)
  const dawnP = sub(p, 0.72, 0.28);
  // Variant C turns the last incantation into morning.
  const morning = VARIANT === "c" ? dawnP : 0;
  const woven = VARIANT === "b";

  const farHue = 150 - (1 - earthP) * 30;
  const midHue = 145 - (1 - earthP) * 35;
  const groundHue = 140 - (1 - earthP) * 40;
  // Variant C silhouettes the far range against the bright horizon.
  const farL = farHillL - morning * 3.2;

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="wGlow" radius={6} color="#d8c890" opacity={0.4} />

        {/* Hand-drawn wobble for the ink threads — the same trick the
            Stones runes use, tuned small so 0.6-wide strokes survive. */}
        <filter id="wInkWobble" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.021" numOctaves={2} seed={11} result="wnoise" />
          <feDisplacementMap in="SourceGraphic" in2="wnoise" scale={3.2} xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <linearGradient id="wSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${skyH}, ${skyS}%, ${skyTopL}%)`} />
          <stop offset="60%" stopColor={`hsl(${skyH - 10}, ${skyS - 3}%, ${(skyTopL + skyBotL) / 2}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH - 20}, ${skyS + 5}%, ${skyBotL}%)`} />
        </linearGradient>

        {/* Dawn radiance behind the Great Tree */}
        <radialGradient id="dawnGlow" cx="50%" cy="32%" r="40%">
          <stop offset="0%" stopColor="#ffe8a0" stopOpacity={dawnP * (0.5 + morning * 0.35)} />
          <stop offset="40%" stopColor="#d8a050" stopOpacity={dawnP * (0.15 + morning * 0.12)} />
          <stop offset="100%" stopColor="#d8a050" stopOpacity={0} />
        </radialGradient>

        {/* Node halos — soft, never a disc. */}
        <radialGradient id="wHalo">
          <stop offset="0%" stopColor="#f6ecc4" stopOpacity={0.50} />
          <stop offset="42%" stopColor="#e0cf96" stopOpacity={0.16} />
          <stop offset="100%" stopColor="#d8c890" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="wWarmNode">
          <stop offset="0%" stopColor="#fff0c8" stopOpacity={0.62} />
          <stop offset="38%" stopColor="#e8b860" stopOpacity={0.20} />
          <stop offset="100%" stopColor="#d89840" stopOpacity={0} />
        </radialGradient>

        {/* Variant B: mist lying in the valley. */}
        {woven && (
          <linearGradient id="wMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fb4ae" stopOpacity={0} />
            <stop offset="45%" stopColor="#adc2ba" stopOpacity={0.19} />
            <stop offset="100%" stopColor="#8fa8a2" stopOpacity={0} />
          </linearGradient>
        )}

        {/* Variant C: morning. */}
        {morning > 0 && (
          <>
            <linearGradient id="wTwilight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b2452" stopOpacity={0.30 * morning} />
              <stop offset="100%" stopColor="#2b2452" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="wDawnBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c06a72" stopOpacity={0} />
              <stop offset="40%" stopColor="#d87a72" stopOpacity={0.15 * morning} />
              <stop offset="72%" stopColor="#f0a068" stopOpacity={0.30 * morning} />
              <stop offset="100%" stopColor="#ffd884" stopOpacity={0.46 * morning} />
            </linearGradient>
            <radialGradient id="wDawnCore" cx="50%" cy="100%" r="62%">
              <stop offset="0%" stopColor="#ffeeb4" stopOpacity={0.38 * morning} />
              <stop offset="55%" stopColor="#ffbe74" stopOpacity={0.12 * morning} />
              <stop offset="100%" stopColor="#ffbe74" stopOpacity={0} />
            </radialGradient>
            {/* Fades in at both edges so first light lies on the valley
                without a seam where the band starts. */}
            <linearGradient id="wDawnFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f9d194" stopOpacity={0} />
              <stop offset="30%" stopColor="#f9d194" stopOpacity={0.13 * morning} />
              <stop offset="100%" stopColor="#f9d194" stopOpacity={0} />
            </linearGradient>
          </>
        )}
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="250" fill="url(#wSky)" />

      {/* ── C: morning twilight deepens the top of the sky so the
             horizon has something to be brighter than. ── */}
      {morning > 0 && <rect x="0" y="0" width="400" height="76" fill="url(#wTwilight)" />}

      {/* ── STARS — appear during sky phase; in C they wash out at dawn ── */}
      {skyP > 0 && [
        { x: 30, y: 20, r: 1.2 }, { x: 85, y: 35, r: 0.8 },
        { x: 140, y: 15, r: 1.0 }, { x: 260, y: 12, r: 1.1 },
        { x: 310, y: 28, r: 0.9 }, { x: 355, y: 18, r: 1.0 },
        { x: 380, y: 42, r: 0.7 }, { x: 55, y: 52, r: 0.6 },
        { x: 170, y: 42, r: 0.8 }, { x: 330, y: 55, r: 0.7 },
        { x: 15, y: 65, r: 0.5 }, { x: 390, y: 8, r: 0.9 },
        { x: 120, y: 60, r: 0.6 }, { x: 280, y: 38, r: 0.8 },
        { x: 225, y: 25, r: 0.7 },
      ].map((s, i) => {
        const sp = sub(skyP, i * 0.04, 0.15);
        // The low stars go first as the light comes up.
        const fade = 1 - morning * (0.35 + (s.y / 70) * 0.6);
        if (sp <= 0 || fade <= 0) return null;
        return (
          <g key={`s${i}`}>
            <circle cx={s.x} cy={s.y} r={s.r * 3} fill="#e0d8c0" opacity={sp * 0.06 * fade} />
            <circle cx={s.x} cy={s.y} r={s.r} fill="#f0ead0" opacity={sp * 0.7 * fade} />
          </g>
        );
      })}

      {/* ── MOON — crescent, upper right. Pales out at dawn in C. ── */}
      {skyP > 0.05 && (() => {
        const mp = sub(skyP, 0.05, 0.9);
        const moonBright = 0.2 + mp * 0.8;
        return (
          <g opacity={mp * (1 - morning * 0.72)}>
            <circle cx="340" cy="40" r="12"
              fill={`rgb(${200 + Math.floor(moonBright * 40)}, ${200 + Math.floor(moonBright * 40)}, ${210 + Math.floor(moonBright * 35)})`}
            />
            {/* Crescent mask — matches sky at this altitude */}
            <circle cx="333" cy="37" r="10"
              fill={`hsl(${skyH + 8}, ${Math.max(skyS, 30)}%, ${skyTopL + 1}%)`} />
            <circle cx="345" cy="42" r="1.2" fill="#c8c8e0" opacity={moonBright * 0.15} />
          </g>
        );
      })()}

      {/* ── DAWN GLOW behind tree — unity phase ── */}
      {dawnP > 0 && <rect width="400" height="250" fill="url(#dawnGlow)" />}

      {/* ── C: the horizon swells, peach into gold ── */}
      {morning > 0 && (
        <>
          <rect x="0" y="22" width="400" height="94" fill="url(#wDawnBand)" />
          <rect x="0" y="30" width="400" height="86" fill="url(#wDawnCore)" />
        </>
      )}

      {/* ── GREAT TREE SILHOUETTE — rises during unity phase ── */}
      {unityP > 0 && (() => {
        const treeRise = sub(unityP, 0, 0.5);
        const canopyP = sub(unityP, 0.3, 0.4);
        const offsetY = (1 - treeRise) * 30;
        return (
          <g opacity={treeRise * 0.85}>
            <path d={GREAT_TREE_TRUNK}
              fill={`hsl(140, ${10 + unityP * 15}%, ${8 + unityP * 6 - morning * 2}%)`}
              transform={`translate(0, ${offsetY})`} />
            {canopyP > 0 && (
              <path d={GREAT_TREE_CANOPY}
                fill={`hsl(130, ${15 + unityP * 20}%, ${10 + unityP * 8 - morning * 2}%)`}
                opacity={canopyP * 0.9}
                transform={`translate(0, ${offsetY * 0.5})`} />
            )}
            {TREE_ROOTS.map((r, i) => (
              <path key={`r${i}`} d={r}
                fill="none"
                stroke={`hsl(50, ${20 + unityP * 30}%, ${12 + unityP * 10}%)`}
                strokeWidth={1.5}
                opacity={sub(unityP, 0.2 + i * 0.1, 0.3) * 0.4}
                transform={`translate(0, ${offsetY * 0.3})`} />
            ))}
            {canopyP > 0.3 && (
              <ellipse cx="200" cy={45 + offsetY * 0.5} rx="25" ry="18"
                fill="#d8c890" opacity={sub(canopyP, 0.3, 0.5) * 0.08} />
            )}
          </g>
        );
      })()}

      {/* ── FAR HILLS — three tones in variant B (lit ridge, mid slope,
             shadow), one mass everywhere else ── */}
      <path d={HILLS_FAR} fill={`hsl(${farHue}, ${farHillS}%, ${woven ? farL + 4 : farL}%)`} />
      {woven && (
        <>
          <path d={HILLS_FAR} transform="translate(0, 5)" fill={`hsl(${farHue - 3}, ${farHillS}%, ${farL}%)`} />
          <path d={HILLS_FAR} transform="translate(0, 13)" fill={`hsl(${farHue - 6}, ${Math.max(0, farHillS - 1)}%, ${Math.max(3, farL - 3)}%)`} />
        </>
      )}

      {/* ── TREE SILHOUETTES on far hills — we're in a forest ── */}
      {earthP > 0.1 && (() => {
        const tp = sub(earthP, 0.1, 0.4);
        const treeXs = [15, 30, 42, 58, 72, 88, 105, 125, 155, 175, 225, 250, 275, 295, 315, 335, 355, 372, 388];
        return (
          <g opacity={tp * 0.6}>
            {treeXs.map((tx, i) => {
              const baseY = 88 + Math.sin(tx * 0.04) * 5;
              const h = 8 + (i % 3) * 4;
              const w = 3 + (i % 2) * 2;
              return (
                <g key={`ft${i}`}>
                  <line x1={tx} y1={baseY} x2={tx} y2={baseY - h * 0.5}
                    stroke={`hsl(${140 + (i % 3) * 5}, ${farHillS + 5}%, ${farHillL - 1}%)`}
                    strokeWidth={1} />
                  <ellipse cx={tx} cy={baseY - h * 0.6} rx={w} ry={h * 0.45}
                    fill={`hsl(${135 + (i % 4) * 5}, ${farHillS + 3}%, ${farHillL - 1}%)`} />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ── COTTAGE silhouette on right hillside — earth phase ── */}
      {earthP > 0.3 && (() => {
        const cp = sub(earthP, 0.3, 0.3);
        return (
          <g opacity={cp * 0.9}>
            {/* Variant B's shadowed slope is darker, so the cottage has to
                go darker still to keep its silhouette. */}
            <path d={COTTAGE} fill={`hsl(30, ${5 + cp * 8}%, ${(10 + cp * 4) * (woven ? 0.62 : 1)}%)`} />
            <rect x="308" y="110" width="4" height="5" rx="0.5"
              fill="#e89a30" opacity={cp * 0.6 * (1 - morning * 0.45)} />
            <circle cx="310" cy="112" r="6"
              fill="#e89a30" opacity={cp * 0.06 * (1 - morning * 0.45)} />
          </g>
        );
      })()}

      {/* ── C: the cottage throws its long shadow down the hillside ── */}
      {morning > 0 && earthP > 0.3 && (
        <DawnShadow x={312} y={118} w={7} len={26} dawn={morning} />
      )}

      {/* ── B: mist between the ranges ── */}
      {woven && earthP > 0.15 && (() => {
        const mp = sub(earthP, 0.15, 0.5);
        return (
          <g opacity={mp}>
            <rect x="0" y="98" width="400" height="48" fill="url(#wMist)" />
            {MIST_WISPS.map((d, i) => (
              <path key={`mw${i}`} d={d} fill="#c2d2ca" opacity={0.095 - i * 0.022}>
                <animateTransform attributeName="transform" type="translate"
                  values={`0 0; ${i % 2 ? -7 : 7} -1.5; 0 0`}
                  dur={`${26 + i * 7}s`} repeatCount="indefinite" />
              </path>
            ))}
          </g>
        );
      })()}

      {/* ── MID HILLS — three tones in variant B ── */}
      <path d={HILLS_MID} fill={`hsl(${midHue}, ${midHillS}%, ${woven ? midHillL + 3.5 : midHillL}%)`} />
      {woven && (
        <>
          <path d={HILLS_MID} transform="translate(0, 4)" fill={`hsl(${midHue - 3}, ${midHillS}%, ${midHillL}%)`} />
          <path d={HILLS_MID} transform="translate(0, 11)" fill={`hsl(${midHue - 6}, ${Math.max(0, midHillS - 1)}%, ${Math.max(3, midHillL - 2.5)}%)`} />
        </>
      )}

      {/* ── BRIDGE arch silhouette — between hills ── */}
      {earthP > 0.5 && (
        <path d={BRIDGE_ARCH}
          fill="none"
          stroke={`hsl(200, ${8 + earthP * 6}%, ${10 + earthP * 5}%)`}
          strokeWidth={2.5}
          opacity={sub(earthP, 0.5, 0.3) * 0.5}
          strokeLinecap="round" />
      )}

      {/* ── SPIRIT FIGURES on the far hill — "stars remember, spirits sing" ── */}
      {skyP > 0.25 && (() => {
        const sp = sub(skyP, 0.25, 0.4);
        const spirits = [
          { x: 150, baseY: 92 },
          { x: 200, baseY: 90 },
          { x: 250, baseY: 92 },
        ];
        return (
          <g opacity={sp * 0.85}>
            {spirits.map((s, i) => {
              const fp = sub(sp, i * 0.15, 0.5);
              if (fp <= 0) return null;
              const bob = Math.sin(p * Math.PI * 3 + i * 1.6) * 0.6;
              const y = s.baseY + bob;
              return (
                <g key={`spirit${i}`} opacity={fp}>
                  <ellipse cx={s.x} cy={y - 1} rx={3.6} ry={5}
                    fill="#d0b870" opacity={fp * 0.14} />
                  <path
                    d={`M${s.x} ${y - 5}
                        C${s.x - 1.6} ${y - 4}, ${s.x - 2.6} ${y - 2}, ${s.x - 2.5} ${y}
                        C${s.x - 2.2} ${y + 2.5}, ${s.x - 1.2} ${y + 4}, ${s.x} ${y + 4}
                        C${s.x + 1.2} ${y + 4}, ${s.x + 2.2} ${y + 2.5}, ${s.x + 2.5} ${y}
                        C${s.x + 2.6} ${y - 2}, ${s.x + 1.6} ${y - 4}, ${s.x} ${y - 5} Z`}
                    fill="#d0b870" opacity={fp * 0.18}
                  />
                  <circle cx={s.x} cy={y - 0.5} r={1.8} fill="#d0b870" opacity={fp * 0.32} />
                  <circle cx={s.x} cy={y - 0.5} r={0.9} fill="#fff8e0" opacity={fp * 0.65} />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ── SPIRIT WISPS — sky phase, drifting through mid-ground ── */}
      {skyP > 0.3 && [
        { x: 90, y: 130, dx: 5 }, { x: 230, y: 120, dx: -3 },
        { x: 160, y: 135, dx: 4 }, { x: 290, y: 128, dx: -4 },
        { x: 50, y: 125, dx: 3 }, { x: 350, y: 132, dx: -2 },
      ].map((w, i) => {
        const wp = sub(skyP, 0.3 + i * 0.08, 0.2);
        const drift = Math.sin(p * Math.PI * 3 + i * 1.5) * w.dx;
        const bob = Math.sin(p * Math.PI * 4 + i * 2) * 2;
        return wp > 0 ? (
          <g key={`w${i}`}>
            <circle cx={w.x + drift} cy={w.y + bob} r={3} fill="#d0b870" opacity={wp * 0.06} />
            <circle cx={w.x + drift} cy={w.y + bob} r={1.2} fill="#ffe8a0" opacity={wp * 0.25} />
          </g>
        ) : null;
      })}

      {/* ── C: the standing stones throw shadows as they rise ── */}
      {morning > 0 && unityP > 0.05 && (
        <g>
          {GUARDIAN_STONES.map((st, i) => {
            const riseP = sub(sub(unityP, 0.05, 0.5), i * 0.08, 0.45);
            if (riseP <= 0) return null;
            return (
              <DawnShadow key={`gs${i}`} x={st.x} y={st.baseY} w={3.4}
                len={18 + (i % 3) * 6} dawn={morning * riseP} />
            );
          })}
        </g>
      )}

      {/* ── STANDING STONE GUARDIANS — the ancient order, rising ── */}
      {unityP > 0.05 && (() => {
        const up = sub(unityP, 0.05, 0.5);
        return (
          <g opacity={up * 0.8}>
            {GUARDIAN_STONES.map((st, i) => {
              const riseP = sub(up, i * 0.08, 0.45);
              if (riseP <= 0) return null;
              const h = st.h * riseP;
              const w = 3.2;
              const lean = (i % 2 === 0 ? -0.5 : 0.5);
              const top = st.baseY - h;
              return (
                <g key={`sg${i}`}>
                  <path
                    d={`M${st.x - w} ${st.baseY}
                        L${st.x - w + lean * 0.6} ${top + 2}
                        Q${st.x + lean} ${top} ${st.x + w + lean * 0.6} ${top + 2}
                        L${st.x + w} ${st.baseY}
                        Z`}
                    fill={`hsl(210, ${8 + unityP * 4}%, ${12 + unityP * 5 - morning * 3}%)`}
                    opacity={riseP * 0.9}
                  />
                  {unityP > 0.3 && (
                    <path
                      d={`M${st.x - w * 0.5} ${top + h * 0.4}
                          L${st.x + lean * 0.4} ${top + h * 0.1}
                          L${st.x + w * 0.5} ${top + h * 0.4}`}
                      fill="none"
                      stroke="#d8c890"
                      strokeWidth={0.6}
                      opacity={sub(unityP, 0.3, 0.4) * 0.4}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ── FOREGROUND GROUND — three tones in variant B ── */}
      <path d={GROUND} fill={`hsl(${groundHue}, ${groundS}%, ${woven ? groundL + 3 : groundL}%)`} />
      {woven && (
        <>
          <path d={GROUND} transform="translate(0, 4)" fill={`hsl(${groundHue - 3}, ${groundS}%, ${groundL}%)`} />
          <path d={GROUND} transform="translate(0, 10)" fill={`hsl(${groundHue - 6}, ${Math.max(0, groundS - 1)}%, ${Math.max(3, groundL - 2)}%)`} />
        </>
      )}

      {/* ── C: first light lies along the valley floor ── */}
      {morning > 0 && <rect x="0" y="146" width="400" height="72" fill="url(#wDawnFloor)" />}

      {/* ── C: the well's shadow, thrown left, away from the Tree ── */}
      {morning > 0 && earthP > 0.4 && (
        <DawnShadow x={95} y={131} w={6} len={24} dawn={morning} />
      )}

      {/* ── WELL silhouette — left hillside, opposite cottage ── */}
      {earthP > 0.4 && (() => {
        const wp = sub(earthP, 0.4, 0.3);
        return (
          <g opacity={wp * 0.8}>
            <path d="M88 128 L88 120 L95 116 L102 120 L102 128"
              fill="none"
              stroke={`hsl(30, 12%, ${12 + earthP * 5}%)`}
              strokeWidth={1.8} strokeLinecap="round" />
            <path d="M85 120 L95 114 L105 120"
              fill={`hsl(25, 10%, ${10 + earthP * 4}%)`}
              stroke={`hsl(25, 10%, ${10 + earthP * 4}%)`}
              strokeWidth={1} />
            <line x1="95" y1="120" x2="95" y2="126"
              stroke={`hsl(30, 8%, ${14 + earthP * 4}%)`}
              strokeWidth={0.5} />
            <circle cx="95" cy="130" r="4" fill="#50b8b8" opacity={wp * 0.06} />
          </g>
        );
      })()}

      {/* ── FOREGROUND FLOWERS — earth phase ── */}
      {earthP > 0.5 && [
        { x: 25, y: 174, color: "#6bbf6b" },
        { x: 50, y: 170, color: "#e88080" },
        { x: 105, y: 175, color: "#80a8e0" },
        { x: 155, y: 170, color: "#e8c060" },
        { x: 245, y: 166, color: "#c088b0" },
        { x: 310, y: 168, color: "#6bbf6b" },
        { x: 375, y: 164, color: "#e8c060" },
      ].map((f, i) => {
        const fp = sub(earthP, 0.5 + i * 0.05, 0.2);
        return fp > 0 ? (
          <g key={`f${i}`} opacity={fp * 0.7}>
            <line x1={f.x} y1={f.y} x2={f.x} y2={f.y - 4 * fp}
              stroke="#3a6830" strokeWidth={0.8} />
            <circle cx={f.x} cy={f.y - 5 * fp} r={1.5 * fp}
              fill={f.color} opacity={fp * 0.8} />
          </g>
        ) : null;
      })}

      {/* ── GRASS TUFTS — foreground detail ── */}
      {earthP > 0.3 && [
        { x: 15, y: 176 }, { x: 80, y: 173 }, { x: 130, y: 174 },
        { x: 190, y: 170 }, { x: 260, y: 167 }, { x: 330, y: 166 },
        { x: 385, y: 164 },
      ].map((g_pos, i) => {
        const gp = sub(earthP, 0.3 + i * 0.04, 0.2);
        return gp > 0 ? (
          <g key={`g${i}`} opacity={gp * 0.4}>
            <line x1={g_pos.x - 2} y1={g_pos.y} x2={g_pos.x - 3} y2={g_pos.y - 4 * gp}
              stroke={`hsl(120, ${15 + earthP * 15}%, ${12 + earthP * 8}%)`} strokeWidth={0.6} />
            <line x1={g_pos.x} y1={g_pos.y} x2={g_pos.x + 1} y2={g_pos.y - 5 * gp}
              stroke={`hsl(125, ${15 + earthP * 15}%, ${14 + earthP * 8}%)`} strokeWidth={0.6} />
            <line x1={g_pos.x + 2} y1={g_pos.y} x2={g_pos.x + 4} y2={g_pos.y - 3 * gp}
              stroke={`hsl(115, ${15 + earthP * 15}%, ${11 + earthP * 8}%)`} strokeWidth={0.6} />
          </g>
        ) : null;
      })}

      {/* ── THE LEY WEB — 21 connections, 7 nodes, unchanged ── */}
      {woven
        ? <LeyWebWoven unityP={unityP} />
        : <LeyWebInk unityP={unityP} dawn={morning} />}
      <LeyNodes unityP={unityP} dawn={morning} />

      {/* ── FINAL WASH — last 10%. In C the morning does this instead. ── */}
      {p > 0.9 && (() => {
        const fp = sub(p, 0.9, 0.1);
        return (
          <g>
            <rect width="400" height="250" fill="#d8c890" opacity={fp * (morning > 0 ? 0.03 : 0.08)} />
            <ellipse cx="200" cy="90" rx={180 * fp} ry={40 * fp}
              fill="#ffe8a0" opacity={fp * (morning > 0 ? 0.03 : 0.06)} />
          </g>
        );
      })()}

      {/* ── ATMOSPHERIC PARTICLES — fine dust/pollen ── */}
      {p > 0.15 && Array.from({ length: 20 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 150 + 20;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.9) * 4;
        const rise = p * 15 * ((i % 4) / 4);
        const size = 0.3 + (i % 3) * 0.2;
        const op = sub(p, 0.15 + (i % 5) * 0.08, 0.2) * 0.15;
        return op > 0 ? (
          <circle key={`p${i}`} cx={px + drift} cy={baseY - rise} r={size}
            fill={i % 3 === 0 ? "#f0e8c0" : "#d8c890"} opacity={op} />
        ) : null;
      })}
    </svg>
  );
}

export default memo(WorldScene);
