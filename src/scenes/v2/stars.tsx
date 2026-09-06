import { memo } from "react";
import { sub } from "../util";
import type { SceneProps } from "../../types";
import { GlowFilter, MistFilter } from "../../svg/filters";

/**
 * The Night Sky — Inkwood 2.
 *
 * Signature beat: **the constellations you name are the ones that draw.**
 * Phrase 1 is four names ("Orion Lyra Cygnus Cassiopeia"); the scene reads
 * `wordsDone` and the moment a name is finished, that figure flares and
 * traces itself outward from its brightest star. Order is the player's —
 * the pool only permutes the same four names, so by the end of phrase 1
 * the whole sky is written. Phrase 2 ("burn again with ancient fire") is
 * the ignition: every star swells, the milky way blooms, meteors crescendo.
 *
 * The v1 composition is kept where it earned its keep (moon at x=320 with
 * the same rise, treeline path, hills, horizon haze, parallax layers) so
 * the light manifest stays tuned to the art. Three things changed because
 * the screenshots asked for it:
 *   - the moon crescent is cut with a <mask> instead of an opaque dark
 *     disc. Under the Glow layer the old masking circle no longer matched
 *     the lit sky and read as a grey disc (SCENE_ART_GUIDE, "Night sky").
 *   - star halos are radial gradients, not flat low-opacity circles, which
 *     were rendering as hard-edged grey discs.
 *   - treetop moonlight is a soft gradient wash rather than solid ellipses.
 *
 * Idle life: a third of the background stars twinkle on SMIL opacity with
 * phase offsets, so the sky breathes between keystrokes with zero React work.
 */

// ── The four figures ────────────────────────────────────────────────────
// Stars are [x, y, radius]. Edges are ordered OUTWARD from the anchor
// (the figure's brightest star) so the line draw radiates from the star
// the player just named. Regions are kept distinct and clear of the moon
// (x 320, y 45 at full rise, disc r 18).

interface Figure {
  key: string;
  /** Matched case-insensitively against the words the player has finished. */
  name: string;
  stars: [number, number, number][];
  edges: [number, number][];
  /** Index into `stars` — brightest star, draw origin, lingering glow. */
  anchor: number;
  /** Halo gradient id suffix for the anchor's lingering light. */
  tint: "warm" | "cool" | "white";
}

const FIGURES: Figure[] = [
  {
    // Lower left. Belt of three between two shoulders and two feet.
    key: "orion",
    name: "Orion",
    stars: [
      [50, 88, 2.4], // 0 Betelgeuse  — anchor, the red shoulder
      [102, 82, 2.0], // 1 Bellatrix
      [64, 118, 1.7], // 2 Alnitak   ┐
      [77, 121, 1.9], // 3 Alnilam   ├ the belt
      [90, 124, 1.7], // 4 Mintaka   ┘
      [58, 152, 1.8], // 5 Saiph
      [108, 148, 2.4], // 6 Rigel
    ],
    edges: [
      [0, 1], // shoulders
      [0, 2], // Betelgeuse down to the belt
      [2, 3],
      [3, 4], // the belt itself
      [1, 4], // Bellatrix down to the belt
      [2, 5], // belt out to Saiph
      [4, 6], // belt out to Rigel
    ],
    anchor: 0,
    tint: "warm",
  },
  {
    // Left of centre, high. The W.
    key: "cassiopeia",
    name: "Cassiopeia",
    stars: [
      [96, 32, 1.7], // 0 Caph
      [120, 50, 2.2], // 1 Schedar — anchor
      [144, 28, 1.9], // 2 Gamma
      [170, 49, 1.7], // 3 Ruchbah
      [194, 32, 1.5], // 4 Segin
    ],
    edges: [
      [1, 0],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    anchor: 1,
    tint: "cool",
  },
  {
    // Upper centre. A small parallelogram hanging from Vega.
    key: "lyra",
    name: "Lyra",
    stars: [
      [194, 70, 2.5], // 0 Vega — anchor
      [182, 88, 1.5], // 1
      [206, 84, 1.5], // 2
      [212, 106, 1.4], // 3
      [188, 110, 1.4], // 4
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 4],
      [2, 3],
      [4, 3],
    ],
    anchor: 0,
    tint: "cool",
  },
  {
    // Upper right, clear of the moon. The Northern Cross.
    key: "cygnus",
    name: "Cygnus",
    stars: [
      [278, 24, 2.4], // 0 Deneb — anchor, the head
      [265, 69, 1.8], // 1 Sadr — the crossing
      [252, 114, 1.7], // 2 Albireo — the foot
      [227, 58, 1.6], // 3 left wing
      [302, 80, 1.7], // 4 right wing — held out of the moon's aura
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
    ],
    anchor: 0,
    tint: "white",
  },
];

/** Scatter — deliberately routed around the four figures so the shapes
 *  stay legible. c: 0 white, 1 blue-white, 2 warm. */
const BG_STARS: { x: number; y: number; r: number; c: number; d: number }[] = [
  { x: 12, y: 22, r: 1.1, c: 1, d: 0.00 },
  { x: 30, y: 44, r: 1.4, c: 0, d: 0.00 },
  { x: 9, y: 66, r: 1.0, c: 0, d: 0.00 },
  { x: 26, y: 100, r: 1.2, c: 1, d: 0.11 },
  { x: 14, y: 134, r: 1.0, c: 0, d: 0.14 },
  { x: 24, y: 156, r: 1.3, c: 2, d: 0.17 },
  { x: 58, y: 18, r: 1.0, c: 0, d: 0.03 },
  { x: 140, y: 74, r: 1.5, c: 0, d: 0.06 },
  { x: 150, y: 96, r: 1.1, c: 1, d: 0.09 },
  { x: 126, y: 106, r: 1.3, c: 0, d: 0.12 },
  { x: 166, y: 128, r: 1.0, c: 0, d: 0.15 },
  { x: 128, y: 138, r: 1.2, c: 2, d: 0.18 },
  { x: 218, y: 42, r: 1.4, c: 0, d: 0.21 },
  { x: 152, y: 142, r: 1.0, c: 0, d: 0.24 },
  { x: 196, y: 132, r: 1.3, c: 1, d: 0.27 },
  { x: 232, y: 130, r: 1.1, c: 0, d: 0.30 },
  { x: 240, y: 148, r: 1.2, c: 0, d: 0.33 },
  { x: 222, y: 20, r: 1.4, c: 0, d: 0.04 },
  { x: 244, y: 14, r: 1.0, c: 1, d: 0.07 },
  { x: 308, y: 14, r: 1.2, c: 0, d: 0.10 },
  { x: 352, y: 24, r: 1.5, c: 0, d: 0.13 },
  { x: 388, y: 42, r: 1.1, c: 2, d: 0.16 },
  { x: 366, y: 94, r: 1.3, c: 0, d: 0.19 },
  { x: 392, y: 120, r: 1.0, c: 0, d: 0.22 },
  { x: 336, y: 130, r: 1.4, c: 1, d: 0.25 },
  { x: 306, y: 150, r: 1.1, c: 0, d: 0.28 },
  { x: 272, y: 142, r: 1.2, c: 0, d: 0.31 },
  { x: 176, y: 150, r: 1.0, c: 0, d: 0.34 },
  { x: 350, y: 150, r: 1.1, c: 0, d: 0.36 },
  { x: 74, y: 62, r: 0.9, c: 0, d: 0.38 },
];

/** A handful of stars are faintly present even at p=0, spread across the
 *  frame, so the dormant scene reads as a night sky the player is about to
 *  name rather than a blank panel. */
const EMBER_STARS = new Set([0, 6, 13, 19, 22, 26]);

const HALO = ["url(#haloWhite)", "url(#haloCool)", "url(#haloWarm)"];
const CORE = ["#ffffff", "#cfd6ff", "#ffe6c4"];

/** Treeline heights — kept from v1 so the skyline and the light manifest
 *  stay in register. */
const TREES = [
  { x: 10, h: 42, s: 18 }, { x: 35, h: 55, s: 22 }, { x: 58, h: 38, s: 16 },
  { x: 82, h: 62, s: 26 }, { x: 110, h: 48, s: 20 }, { x: 135, h: 58, s: 24 },
  { x: 162, h: 44, s: 18 }, { x: 188, h: 65, s: 28 }, { x: 215, h: 50, s: 22 },
  { x: 240, h: 60, s: 25 }, { x: 265, h: 40, s: 17 }, { x: 290, h: 56, s: 23 },
  { x: 318, h: 68, s: 28 }, { x: 345, h: 45, s: 19 }, { x: 370, h: 52, s: 21 },
  { x: 395, h: 38, s: 16 },
];

/** Did the player finish this constellation's name? Whole-word,
 *  case-insensitive, order-independent. */
function isNamed(name: string, wordsDone: string): boolean {
  if (!wordsDone) return false;
  const target = name.toLowerCase();
  for (const w of wordsDone.toLowerCase().split(/\s+/)) {
    if (w === target) return true;
  }
  return false;
}

const LINE_DUR = 0.42; // seconds per edge
const LINE_STEP = 0.05; // stagger between edges, outward from the anchor

/** Meteors. `start`/`dur` are progress windows, so they crescendo through
 *  the final stretch (five of the six fall inside the last 15%).
 *  x/y is where the head begins, dx/dy where it travels, tx/ty its tail. */
const METEORS = [
  { x: 100, y: 30, dx: 60, dy: 25, tx: 30, ty: 8, w: 1.2, o: 0.85, start: 0.78, dur: 0.06 },
  { x: 260, y: 50, dx: 50, dy: 20, tx: 35, ty: 10, w: 1.0, o: 0.75, start: 0.85, dur: 0.06 },
  { x: 180, y: 15, dx: 45, dy: 18, tx: 25, ty: 7, w: 0.9, o: 0.8, start: 0.90, dur: 0.05 },
  { x: 50, y: 20, dx: 70, dy: 30, tx: 28, ty: 9, w: 0.8, o: 0.75, start: 0.93, dur: 0.04 },
  { x: 318, y: 112, dx: 55, dy: 22, tx: 32, ty: 10, w: 1.1, o: 0.85, start: 0.96, dur: 0.04 },
  { x: 150, y: 55, dx: 50, dy: 20, tx: 22, ty: 7, w: 0.7, o: 0.7, start: 0.98, dur: 0.03 },
];

function StarScene({ progress: p, wordsDone = "" }: SceneProps) {
  // ── Moon (v1 timing and position; the manifest is tuned to these) ──
  const moonP = sub(p, 0.05, 0.4);
  const moonY = 80 - moonP * 35;
  const moonBright = 0.3 + moonP * 0.7;

  // ── Phrase 2: "burn again with ancient fire" ──
  // Spans the whole second incantation so the sky is still gaining at the
  // last keystroke; a window that closed early made 60% and 99% twins.
  const blaze = sub(p, 0.5, 0.45);

  // ── Milky way: a faint band while you name, a bloom when you ignite ──
  const milkyP = sub(p, 0.15, 0.35);
  const milkyVis = milkyP * (0.3 + blaze * 0.7);

  // ── Horizon / treeline / haze (v1 timing) ──
  const hazeP = sub(p, 0.1, 0.3);
  const treeP = sub(p, 0.02, 0.25);

  // The figures' lines are cool violet while you name them, warming
  // toward ember as phrase 2 sets the sky alight.
  const lineCol = `rgb(${Math.round(166 + blaze * 42)}, ${Math.round(176 + blaze * 32)}, ${Math.round(255 - blaze * 18)})`;

  // ── Meteors — crescendo through the final stretch ──
  const shoot = METEORS.map((m) => sub(p, m.start, m.dur));

  // Every figure is up once phrase 1 is finished, whatever the order was.
  // p is quantized to 0.01 and phrase 1 ends at exactly 0.5 with two
  // prompts, so the >= keeps the figures mounted across the phrase
  // boundary (where `wordsDone` resets to "") without re-triggering SMIL.
  const allUp = p >= 0.5;

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="shootGlow" radius={2} color="#ffffff" opacity={0.5} />
        <MistFilter id="horizonMist" scale={0.01} opacity={0.2} />

        {/* Sky — deep at the zenith, lifting toward the horizon */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04061a" />
          <stop offset="50%" stopColor="#080e2a" />
          <stop offset="85%" stopColor="#101838" />
          <stop offset="100%" stopColor="#182048" />
        </linearGradient>

        <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#182048" stopOpacity={0} />
          <stop offset="40%" stopColor="#202860" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#283068" stopOpacity={0.3} />
        </linearGradient>

        <radialGradient id="milkyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9aa0ff" stopOpacity={0.10} />
          <stop offset="40%" stopColor="#7878d0" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#6060a0" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="moonRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8e8ff" stopOpacity={moonBright * 0.22} />
          <stop offset="50%" stopColor="#9090f8" stopOpacity={moonBright * 0.07} />
          <stop offset="100%" stopColor="#9090f8" stopOpacity={0} />
        </radialGradient>
        {/* The moon's near halo. A flat low-opacity disc showed a hard
            circular edge once the Glow layer lit the sky around it. */}
        <radialGradient id="moonInner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2f2ff" stopOpacity={moonBright * 0.30} />
          <stop offset="55%" stopColor="#d6d8ff" stopOpacity={moonBright * 0.10} />
          <stop offset="100%" stopColor="#b0b4ff" stopOpacity={0} />
        </radialGradient>

        {/* "burn again with ancient fire" — the sky's one temperature
            event, so phrase 2 changes colour and not only scale. */}
        <radialGradient id="emberGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb070" stopOpacity={0.11} />
          <stop offset="45%" stopColor="#e08a70" stopOpacity={0.045} />
          <stop offset="100%" stopColor="#a06090" stopOpacity={0} />
        </radialGradient>

        {/* Star halos as gradients — flat low-opacity discs read as
            hard-edged grey circles once the Glow layer lifts the sky. */}
        <radialGradient id="haloWhite" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.36} />
          <stop offset="35%" stopColor="#ffffff" stopOpacity={0.10} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="haloCool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8d0ff" stopOpacity={0.36} />
          <stop offset="35%" stopColor="#a8b4ff" stopOpacity={0.10} />
          <stop offset="100%" stopColor="#8090ff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="haloWarm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe4c0" stopOpacity={0.36} />
          <stop offset="35%" stopColor="#ffcc94" stopOpacity={0.10} />
          <stop offset="100%" stopColor="#ffb070" stopOpacity={0} />
        </radialGradient>

        {/* Lingering glow left on a figure's brightest star once it draws */}
        <radialGradient id="anchorWarm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd7a8" stopOpacity={0.5} />
          <stop offset="45%" stopColor="#ffb878" stopOpacity={0.13} />
          <stop offset="100%" stopColor="#ff9a50" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="anchorCool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dfe6ff" stopOpacity={0.5} />
          <stop offset="45%" stopColor="#a8b8ff" stopOpacity={0.13} />
          <stop offset="100%" stopColor="#8090f8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="anchorWhite" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
          <stop offset="45%" stopColor="#d0d4ff" stopOpacity={0.13} />
          <stop offset="100%" stopColor="#9098f0" stopOpacity={0} />
        </radialGradient>

        {/* Soft moonlight pooling on the treetops nearest the moon */}
        <radialGradient id="treeMoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b6bcff" stopOpacity={0.30} />
          <stop offset="100%" stopColor="#b6bcff" stopOpacity={0} />
        </radialGradient>

        <linearGradient id="shootGrad1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity={0.8} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </linearGradient>

        {/* The crescent is CUT from the disc rather than covered by a dark
            circle — a masking circle can never match a sky the Glow layer
            is lighting, and it showed as a grey disc. */}
        <mask id="crescentMask" maskUnits="userSpaceOnUse" x="296" y={moonY - 26} width="52" height="52">
          <circle cx="320" cy={moonY} r="19" fill="#fff" />
          <circle cx="310" cy={moonY - 4} r="15" fill="#000" />
        </mask>

        <style>{`
          @keyframes parallaxSlow { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-3px); } }
          @keyframes parallaxMed { 0%,100% { transform: translateX(0); } 50% { transform: translateX(2px); } }
          @keyframes parallaxFast { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-1px) translateY(-1px); } }
          .bgLayer { animation: parallaxSlow 12s ease-in-out infinite; }
          .midLayer { animation: parallaxMed 10s ease-in-out infinite; }
          .fgLayer { animation: parallaxFast 8s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* ══════ SKY ══════ */}
      <rect width="400" height="250" fill="url(#skyGrad)" />

      <g className="bgLayer">

        {/* ── Milky way — a faint band while you name, a bloom when you ignite ── */}
        {milkyVis > 0 && (
          <g opacity={milkyVis}>
            <ellipse cx="200" cy="90" rx="220" ry="40" fill="url(#milkyGrad)" transform="rotate(-25, 200, 90)" />
            <ellipse cx="180" cy="85" rx="180" ry="25" fill="url(#milkyGrad)" transform="rotate(-25, 180, 85)" opacity={0.6} />
            {blaze > 0 && (
              <ellipse cx="196" cy="88" rx="205" ry="34" fill="url(#emberGrad)" transform="rotate(-25, 196, 88)" opacity={blaze} />
            )}
            {[
              { x: 118, y: 70 }, { x: 144, y: 78 }, { x: 168, y: 72 },
              { x: 196, y: 118 }, { x: 220, y: 92 }, { x: 244, y: 100 },
              { x: 268, y: 86 }, { x: 154, y: 96 }, { x: 210, y: 106 },
              { x: 238, y: 78 }, { x: 130, y: 108 }, { x: 258, y: 94 },
              { x: 288, y: 108 }, { x: 96, y: 88 }, { x: 312, y: 118 },
            ].map((d, i) => (
              <circle
                key={`mw-${i}`}
                cx={d.x} cy={d.y}
                r={0.5 + (i % 3) * 0.3}
                fill="white"
                opacity={0.10 + (i % 4) * 0.04 + blaze * 0.24}
              />
            ))}
          </g>
        )}

        {/* ── Moon ── */}
        {moonP > 0 && (
          <g opacity={moonP}>
            <circle cx="320" cy={moonY} r="55" fill="url(#moonRadial)" />
            <circle cx="320" cy={moonY} r="36" fill="url(#moonInner)" />
            <g mask="url(#crescentMask)">
              <circle
                cx="320" cy={moonY} r="19"
                fill={`rgb(${208 + Math.floor(moonBright * 38)}, ${208 + Math.floor(moonBright * 38)}, ${218 + Math.floor(moonBright * 32)})`}
              />
              {/* Craters, only where the crescent is lit */}
              <circle cx="328" cy={moonY - 2} r="2.4" fill="#b8b8d4" opacity={moonBright * 0.28} />
              <circle cx="325" cy={moonY + 7} r="1.7" fill="#b0b0cc" opacity={moonBright * 0.22} />
              <circle cx="331" cy={moonY + 3} r="1.1" fill="#c0c0dc" opacity={moonBright * 0.22} />
              <circle cx="322" cy={moonY - 9} r="1.4" fill="#bcbcd8" opacity={moonBright * 0.18} />
            </g>
          </g>
        )}

        {/* ── Background stars — the sky populates as you name it ── */}
        {BG_STARS.map((s, i) => {
          const ap = Math.max(EMBER_STARS.has(i) ? 0.22 : 0, sub(p, s.d, 0.09));
          if (ap <= 0) return null;
          const r = s.r * (1 + blaze * 0.45);
          const halo = r * 3.9 * (1 + blaze * 0.5);
          const twinkles = i % 3 === 0;
          return (
            <g key={`bg-${i}`} opacity={ap * (0.42 + blaze * 0.55)}>
              <g>
                {twinkles && (
                  <animate
                    attributeName="opacity"
                    values="1;0.42;1;0.78;1"
                    dur={`${3.2 + (i % 5) * 0.7}s`}
                    begin={`-${(i * 0.53) % 4}s`}
                    repeatCount="indefinite"
                  />
                )}
                <circle cx={s.x} cy={s.y} r={halo} fill={HALO[s.c]} opacity={0.85} />
                <circle cx={s.x} cy={s.y} r={r} fill={CORE[s.c]} />
              </g>
            </g>
          );
        })}

        {/* ══════ THE FOUR FIGURES ══════
            Their stars are always in the sky (dim); naming one flares it
            and traces its lines outward from the brightest star. */}
        {FIGURES.map((fig, fi) => {
          const named = allUp || isNamed(fig.name, wordsDone);
          const [ax, ay] = fig.stars[fig.anchor];
          const Tint = fig.tint === "warm" ? "Warm" : fig.tint === "cool" ? "Cool" : "White";

          return (
            <g key={fig.key}>
              {/* Latent stars — the pattern was always there */}
              {fig.stars.map(([x, y, r], si) => {
                const ap = sub(p, 0.02 + (fi * 6 + si) * 0.011, 0.1);
                if (ap <= 0) return null;
                return (
                  <g key={`lat-${si}`} opacity={ap * (named ? 0 : 0.5)}>
                    <circle cx={x} cy={y} r={r * 3.4} fill="url(#haloWhite)" opacity={0.5} />
                    <circle cx={x} cy={y} r={r * 0.62} fill="#e6ebff" />
                  </g>
                );
              })}

              {named && (
                <g>
                  {/* Lines trace outward from the anchor */}
                  {fig.edges.map(([a, b], ei) => {
                    const [x1, y1] = fig.stars[a];
                    const [x2, y2] = fig.stars[b];
                    const len = Math.hypot(x2 - x1, y2 - y1);
                    return (
                      <line
                        key={`e-${ei}`}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={lineCol}
                        strokeWidth={0.7 + blaze * 0.35}
                        strokeLinecap="round"
                        opacity={0.34 + blaze * 0.34}
                        strokeDasharray={len}
                        strokeDashoffset={len}
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from={len} to="0"
                          dur={`${LINE_DUR}s`}
                          begin={`${(ei * LINE_STEP).toFixed(2)}s`}
                          fill="freeze"
                        />
                      </line>
                    );
                  })}

                  {/* The figure's stars, lit */}
                  {fig.stars.map(([x, y, r], si) => {
                    const isAnchor = si === fig.anchor;
                    const rr = r * (1 + blaze * 0.4);
                    return (
                      <g key={`lit-${si}`} opacity={0}>
                        <animate
                          attributeName="opacity" from="0" to="1"
                          dur="0.5s" begin={`${(si * 0.03).toFixed(2)}s`} fill="freeze"
                        />
                        <circle
                          cx={x} cy={y} r={rr * (isAnchor ? 6.0 : 4.6)}
                          fill={isAnchor ? `url(#anchor${Tint})` : HALO[fig.tint === "warm" ? 2 : fig.tint === "cool" ? 1 : 0]}
                        />
                        <circle cx={x} cy={y} r={rr * 1.7} fill="#ffffff" opacity={0.16} />
                        <circle
                          cx={x} cy={y} r={rr}
                          fill={isAnchor && fig.tint === "warm" ? "#ffe0bc" : isAnchor && fig.tint === "cool" ? "#e6ecff" : "#ffffff"}
                        />
                      </g>
                    );
                  })}

                  {/* The answer: a ring opens off the named star, once */}
                  <circle cx={ax} cy={ay} r="3" fill="none" stroke="#dfe4ff" strokeWidth="0.7" opacity="0">
                    <animate attributeName="r" from="3" to="26" dur="1.1s" begin="0s" fill="freeze" />
                    <animate attributeName="opacity" values="0;0.55;0" dur="1.1s" begin="0s" fill="freeze" />
                  </circle>

                  {/* Lingering breath on the brightest star */}
                  <circle cx={ax} cy={ay} r={10.5 + blaze * 4} fill={`url(#anchor${Tint})`} opacity={0.55}>
                    <animate
                      attributeName="opacity"
                      values="0.55;0.85;0.55"
                      dur="5.4s"
                      begin={`-${fi * 1.3}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )}
            </g>
          );
        })}

        {/* ── Meteors — a bright head with a fading tail, so one still
             reads as a meteor mid-flight instead of a scratch ── */}
        {METEORS.map((m, i) => {
          const t = shoot[i];
          if (t <= 0 || t >= 1) return null;
          const hx = m.x + t * m.dx;
          const hy = m.y + t * m.dy;
          const fade = 1 - t;
          return (
            <g key={`met-${i}`} opacity={fade * m.o} filter="url(#shootGlow)">
              <line
                x1={hx} y1={hy} x2={hx - m.tx} y2={hy - m.ty}
                stroke="white" strokeWidth={m.w} strokeLinecap="round" opacity={0.55}
              />
              <circle cx={hx} cy={hy} r={m.w * 1.15} fill="#ffffff" />
            </g>
          );
        })}

      </g>

      <g className="midLayer">
        {/* ══════ HORIZON ══════ */}
        <rect x="0" y="140" width="400" height="110" fill="url(#hazeGrad)" opacity={hazeP * 0.7} />
        {hazeP > 0.2 && (
          <rect x="0" y="160" width="400" height="60" fill="#283060" opacity={hazeP * 0.06} filter="url(#horizonMist)" />
        )}

        <path d="M0 210 C30 205, 60 212, 100 208 C140 204, 180 210, 220 206 C260 202, 300 208, 340 204 C370 200, 390 206, 400 204 L400 250 L0 250 Z"
          fill="#060e18" opacity={0.3 + treeP * 0.7} />
        <path d="M0 220 C25 216, 55 222, 85 218 C115 214, 145 220, 175 216 C205 212, 235 218, 265 214 C295 210, 325 216, 355 212 C380 210, 395 214, 400 212 L400 250 L0 250 Z"
          fill="#050c14" opacity={0.3 + treeP * 0.7} />
        <path d="M0 228 C20 225, 50 230, 80 227 C110 224, 140 229, 170 226 C200 223, 230 228, 260 225 C290 222, 320 227, 350 224 C375 222, 392 226, 400 224 L400 250 L0 250 Z"
          fill="#040a10" opacity={0.4 + treeP * 0.6} />
      </g>

      <g className="fgLayer">
        {/* ══════ TREELINE ══════ */}
        <rect x="0" y="220" width="400" height="30" fill="#030810" opacity={0.4 + treeP * 0.6} />

        {/* Moonlight pooling on the crowns nearest the moon — soft gradient
            washes, not discs. Drawn UNDER the silhouette so it reads as
            haze catching the light rather than paint on the trees. */}
        {p > 0.4 && (
          <g opacity={sub(p, 0.4, 0.4)}>
            <ellipse cx="322" cy="192" rx="96" ry="34" fill="url(#treeMoon)" opacity={0.5} />
            <ellipse cx="252" cy="200" rx="62" ry="24" fill="url(#treeMoon)" opacity={0.28} />
            <ellipse cx="378" cy="198" rx="52" ry="22" fill="url(#treeMoon)" opacity={0.22} />
          </g>
        )}

        <path
          d={`
            M0 222
            C5 220, 8 ${222 - TREES[0].h * (0.2 + treeP * 0.8)}, 10 ${222 - TREES[0].h * (0.2 + treeP * 0.8)}
            C12 ${222 - TREES[0].h * (0.2 + treeP * 0.8) - 5}, 22 ${222 - TREES[0].h * (0.2 + treeP * 0.8) + 2}, 25 222
            C28 ${222 - 8 * treeP}, 30 ${222 - TREES[1].h * (0.2 + treeP * 0.8)}, 35 ${222 - TREES[1].h * (0.2 + treeP * 0.8)}
            C38 ${222 - TREES[1].h * (0.2 + treeP * 0.8) - 6}, 48 ${222 - TREES[1].h * (0.2 + treeP * 0.8) + 3}, 52 ${222 - 5 * treeP}
            C55 222, 56 ${222 - TREES[2].h * (0.2 + treeP * 0.8)}, 58 ${222 - TREES[2].h * (0.2 + treeP * 0.8)}
            C60 ${222 - TREES[2].h * (0.2 + treeP * 0.8) - 4}, 68 ${222 - TREES[2].h * (0.2 + treeP * 0.8) + 5}, 72 222
            C76 ${222 - 6 * treeP}, 78 ${222 - TREES[3].h * (0.2 + treeP * 0.8)}, 82 ${222 - TREES[3].h * (0.2 + treeP * 0.8)}
            C86 ${222 - TREES[3].h * (0.2 + treeP * 0.8) - 8}, 100 ${222 - TREES[3].h * (0.2 + treeP * 0.8) + 4}, 105 222
            C110 ${222 - 5 * treeP}, 115 ${222 - TREES[4].h * (0.2 + treeP * 0.8)}, 120 ${222 - TREES[4].h * (0.2 + treeP * 0.8)}
            C125 ${222 - TREES[4].h * (0.2 + treeP * 0.8) - 6}, 138 ${222 - TREES[4].h * (0.2 + treeP * 0.8) + 3}, 142 222
            C148 ${222 - 8 * treeP}, 152 ${222 - TREES[5].h * (0.2 + treeP * 0.8)}, 155 ${222 - TREES[5].h * (0.2 + treeP * 0.8)}
            C158 ${222 - TREES[5].h * (0.2 + treeP * 0.8) - 5}, 168 ${222 - TREES[5].h * (0.2 + treeP * 0.8) + 4}, 172 222
            C178 ${222 - 6 * treeP}, 182 ${222 - TREES[6].h * (0.2 + treeP * 0.8)}, 185 ${222 - TREES[6].h * (0.2 + treeP * 0.8)}
            C188 ${222 - TREES[6].h * (0.2 + treeP * 0.8) - 7}, 198 ${222 - TREES[6].h * (0.2 + treeP * 0.8) + 3}, 202 222
            C208 ${222 - 5 * treeP}, 212 ${222 - TREES[7].h * (0.2 + treeP * 0.8)}, 215 ${222 - TREES[7].h * (0.2 + treeP * 0.8)}
            C218 ${222 - TREES[7].h * (0.2 + treeP * 0.8) - 5}, 228 ${222 - TREES[7].h * (0.2 + treeP * 0.8) + 4}, 232 222
            C238 ${222 - 8 * treeP}, 242 ${222 - TREES[8].h * (0.2 + treeP * 0.8)}, 245 ${222 - TREES[8].h * (0.2 + treeP * 0.8)}
            C248 ${222 - TREES[8].h * (0.2 + treeP * 0.8) - 6}, 258 ${222 - TREES[8].h * (0.2 + treeP * 0.8) + 3}, 262 222
            C268 ${222 - 6 * treeP}, 272 ${222 - TREES[9].h * (0.2 + treeP * 0.8)}, 275 ${222 - TREES[9].h * (0.2 + treeP * 0.8)}
            C278 ${222 - TREES[9].h * (0.2 + treeP * 0.8) - 8}, 290 ${222 - TREES[9].h * (0.2 + treeP * 0.8) + 5}, 295 222
            C300 ${222 - 5 * treeP}, 305 ${222 - TREES[10].h * (0.2 + treeP * 0.8)}, 308 ${222 - TREES[10].h * (0.2 + treeP * 0.8)}
            C312 ${222 - TREES[10].h * (0.2 + treeP * 0.8) - 5}, 322 ${222 - TREES[10].h * (0.2 + treeP * 0.8) + 3}, 328 222
            C332 ${222 - 7 * treeP}, 338 ${222 - TREES[11].h * (0.2 + treeP * 0.8)}, 342 ${222 - TREES[11].h * (0.2 + treeP * 0.8)}
            C345 ${222 - TREES[11].h * (0.2 + treeP * 0.8) - 6}, 358 ${222 - TREES[11].h * (0.2 + treeP * 0.8) + 4}, 362 222
            C366 ${222 - 5 * treeP}, 370 ${222 - TREES[12].h * (0.2 + treeP * 0.8)}, 375 ${222 - TREES[12].h * (0.2 + treeP * 0.8)}
            C378 ${222 - TREES[12].h * (0.2 + treeP * 0.8) - 4}, 390 ${222 - TREES[12].h * (0.2 + treeP * 0.8) + 3}, 395 222
            L400 222 L400 250 L0 250 Z
          `}
          fill="#050d16"
          opacity={treeP * 0.9}
        />

        <path d="M0 238 C20 236, 50 240, 80 237 C110 234, 140 238, 170 235 C200 232, 230 237, 260 234 C290 232, 320 236, 350 233 C375 231, 392 235, 400 233 L400 250 L0 250 Z"
          fill="#020608" opacity={0.5 + treeP * 0.5} />
        <rect x="0" y="240" width="400" height="10" fill="#020508" />
      </g>

      {/* Cosmic dust — far, faint, drifting */}
      {Array.from({ length: 34 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = ((i * 71 + 29) % 200) + 12;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 8;
        const py = baseY - p * 26 * ((i % 5) / 5);
        const size = 0.35 + (i % 4) * 0.18;
        const opacity = (0.05 + (i % 3) * 0.035) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={py} r={size} fill={i % 3 === 0 ? "#c8c8ff" : "#e0e8ff"} opacity={opacity} />
        );
      })}
    </svg>
  );
}

export default memo(StarScene);
