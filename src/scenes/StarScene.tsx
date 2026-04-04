import type { SceneProps } from "../types";
import { GlowFilter, MistFilter } from "../svg/filters";
import { Hill, TreeSilhouette, Star } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ── Star data: 28 stars with staggered appearance ──
const STARS: { x: number; y: number; r: number; glow: number; delay: number }[] = [
  { x: 52,  y: 18,  r: 1.5, glow: 6,  delay: 0.02 },
  { x: 310, y: 12,  r: 1.8, glow: 7,  delay: 0.04 },
  { x: 175, y: 35,  r: 1.2, glow: 5,  delay: 0.06 },
  { x: 380, y: 28,  r: 2.0, glow: 8,  delay: 0.08 },
  { x: 95,  y: 45,  r: 1.4, glow: 5,  delay: 0.10 },
  { x: 240, y: 20,  r: 1.6, glow: 6,  delay: 0.12 },
  { x: 28,  y: 55,  r: 1.3, glow: 5,  delay: 0.14 },
  { x: 355, y: 50,  r: 1.7, glow: 7,  delay: 0.16 },
  { x: 140, y: 60,  r: 2.2, glow: 9,  delay: 0.18 },
  { x: 200, y: 15,  r: 1.1, glow: 4,  delay: 0.20 },
  { x: 270, y: 55,  r: 1.5, glow: 6,  delay: 0.22 },
  { x: 15,  y: 30,  r: 1.0, glow: 4,  delay: 0.24 },
  { x: 325, y: 38,  r: 1.9, glow: 7,  delay: 0.26 },
  { x: 110, y: 22,  r: 1.3, glow: 5,  delay: 0.28 },
  { x: 390, y: 60,  r: 1.1, glow: 4,  delay: 0.30 },
  { x: 60,  y: 72,  r: 1.6, glow: 6,  delay: 0.32 },
  { x: 220, y: 68,  r: 1.4, glow: 5,  delay: 0.35 },
  { x: 165, y: 82,  r: 1.2, glow: 5,  delay: 0.38 },
  { x: 290, y: 78,  r: 1.8, glow: 7,  delay: 0.40 },
  { x: 45,  y: 90,  r: 1.0, glow: 4,  delay: 0.42 },
  { x: 345, y: 85,  r: 1.5, glow: 6,  delay: 0.44 },
  { x: 130, y: 95,  r: 1.3, glow: 5,  delay: 0.46 },
  { x: 250, y: 42,  r: 2.0, glow: 8,  delay: 0.48 },
  { x: 80,  y: 108, r: 1.1, glow: 4,  delay: 0.50 },
  { x: 370, y: 72,  r: 1.4, glow: 5,  delay: 0.52 },
  { x: 195, y: 105, r: 1.6, glow: 6,  delay: 0.54 },
  { x: 305, y: 95,  r: 1.2, glow: 5,  delay: 0.56 },
  { x: 155, y: 48,  r: 1.7, glow: 7,  delay: 0.58 },
];

// ── Constellation lines — pairs of star indices ──
const CONSTELLATIONS: [number, number][] = [
  [0, 6],   // top-left cluster
  [6, 15],
  [4, 8],   // mid-left triangle
  [8, 16],
  [4, 16],
  [1, 12],  // right arc
  [12, 7],
  [7, 20],
  [9, 5],   // top center link
  [5, 10],
  [10, 18],
];

// ── Treeline data ──
const TREES = [
  { x: 10,  h: 42, s: 18 },
  { x: 35,  h: 55, s: 22 },
  { x: 58,  h: 38, s: 16 },
  { x: 82,  h: 62, s: 26 },
  { x: 110, h: 48, s: 20 },
  { x: 135, h: 58, s: 24 },
  { x: 162, h: 44, s: 18 },
  { x: 188, h: 65, s: 28 },
  { x: 215, h: 50, s: 22 },
  { x: 240, h: 60, s: 25 },
  { x: 265, h: 40, s: 17 },
  { x: 290, h: 56, s: 23 },
  { x: 318, h: 68, s: 28 },
  { x: 345, h: 45, s: 19 },
  { x: 370, h: 52, s: 21 },
  { x: 395, h: 38, s: 16 },
];

export default function StarScene({ progress: p }: SceneProps) {
  // ── Moon ──
  const moonP = sub(p, 0.05, 0.4);
  const moonY = 80 - moonP * 35;
  const moonBright = 0.3 + moonP * 0.7;

  // ── Milky Way ──
  const milkyP = sub(p, 0.2, 0.4);

  // ── Constellations ──
  const constP = sub(p, 0.65, 0.25);

  // ── Shooting stars ──
  const shoot1 = sub(p, 0.78, 0.06);
  const shoot2 = sub(p, 0.88, 0.06);
  const shoot3 = sub(p, 0.94, 0.05);

  // ── Horizon haze ──
  const hazeP = sub(p, 0.1, 0.3);

  // ── Treeline ──
  const treeP = sub(p, 0.02, 0.25);

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* Filters */}
        <GlowFilter id="moonGlow" radius={18} color="#c8c8ff" opacity={0.35} />
        <GlowFilter id="starGlow" radius={4} color="#d8d8ff" opacity={0.3} />
        <GlowFilter id="shootGlow" radius={2} color="#ffffff" opacity={0.5} />
        <MistFilter id="horizonMist" scale={0.01} opacity={0.2} />

        {/* Sky gradient — deep blue top to slightly lighter at horizon */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04061a" />
          <stop offset="50%" stopColor="#080e2a" />
          <stop offset="85%" stopColor="#101838" />
          <stop offset="100%" stopColor="#182048" />
        </linearGradient>

        {/* Horizon haze gradient */}
        <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#182048" stopOpacity={0} />
          <stop offset="40%" stopColor="#202860" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#283068" stopOpacity={0.3} />
        </linearGradient>

        {/* Milky way gradient — diagonal ellipse fill */}
        <radialGradient id="milkyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9090f8" stopOpacity={0.08} />
          <stop offset="40%" stopColor="#7878d0" stopOpacity={0.04} />
          <stop offset="100%" stopColor="#6060a0" stopOpacity={0} />
        </radialGradient>

        {/* Moon radial glow */}
        <radialGradient id="moonRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8e8ff" stopOpacity={moonBright * 0.25} />
          <stop offset="50%" stopColor="#9090f8" stopOpacity={moonBright * 0.08} />
          <stop offset="100%" stopColor="#9090f8" stopOpacity={0} />
        </radialGradient>

        {/* Shooting star gradient */}
        <linearGradient id="shootGrad1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity={0.8} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* ══════ BACKGROUND LAYER — SKY ══════ */}
      <rect width="400" height="250" fill="url(#skyGrad)" />

      {/* ── Milky Way band — diagonal wash ── */}
      {milkyP > 0 && (
        <g opacity={milkyP * 0.7}>
          <ellipse
            cx="200" cy="90"
            rx="220" ry="40"
            fill="url(#milkyGrad)"
            transform="rotate(-25, 200, 90)"
          />
          {/* Secondary wispy layer */}
          <ellipse
            cx="180" cy="85"
            rx="180" ry="25"
            fill="url(#milkyGrad)"
            transform="rotate(-25, 180, 85)"
            opacity={0.6}
          />
          {/* Tiny scattered dots within milky way */}
          {[
            { x: 120, y: 70 }, { x: 145, y: 78 }, { x: 170, y: 72 },
            { x: 195, y: 80 }, { x: 220, y: 75 }, { x: 245, y: 82 },
            { x: 270, y: 76 }, { x: 155, y: 85 }, { x: 210, y: 88 },
            { x: 240, y: 70 }, { x: 130, y: 82 }, { x: 260, y: 85 },
          ].map((d, i) => (
            <circle
              key={`mw-${i}`}
              cx={d.x} cy={d.y}
              r={0.5 + (i % 3) * 0.3}
              fill="white"
              opacity={milkyP * (0.08 + (i % 4) * 0.03)}
            />
          ))}
        </g>
      )}

      {/* ── Moon — crescent via overlapping circles ── */}
      {moonP > 0 && (
        <g opacity={moonP}>
          {/* Moon glow aura */}
          <circle cx="320" cy={moonY} r="55" fill="url(#moonRadial)" />

          {/* Moon bright disc */}
          <circle
            cx="320" cy={moonY} r="18"
            fill={`rgb(${210 + Math.floor(moonBright * 35)}, ${210 + Math.floor(moonBright * 35)}, ${220 + Math.floor(moonBright * 30)})`}
            filter="url(#moonGlow)"
          />

          {/* Dark overlap circle to create crescent — offset to upper-left */}
          <circle
            cx="310" cy={moonY - 4} r="15"
            fill="#060e24"
          />

          {/* Subtle surface detail on lit crescent */}
          <circle cx="328" cy={moonY - 2} r="2" fill="#c8c8e0" opacity={moonBright * 0.15} />
          <circle cx="325" cy={moonY + 6} r="1.5" fill="#c0c0d8" opacity={moonBright * 0.1} />
          <circle cx="330" cy={moonY + 2} r="1" fill="#c8c8e0" opacity={moonBright * 0.12} />
        </g>
      )}

      {/* ── Stars — 28 appearing sequentially ── */}
      {STARS.map((s, i) => {
        const sp = sub(p, s.delay, 0.08);
        return sp > 0 ? (
          <Star
            key={`star-${i}`}
            x={s.x}
            y={s.y}
            radius={s.r * sp}
            glowRadius={s.glow * sp}
            opacity={sp}
            color={i % 5 === 0 ? "#c8c8ff" : i % 7 === 0 ? "#ffe8c8" : "white"}
          />
        ) : null;
      })}

      {/* ── Constellation lines — draw in after 65% ── */}
      {constP > 0 && (
        <g opacity={constP * 0.35}>
          {CONSTELLATIONS.map(([a, b], i) => {
            const lineP = sub(p, 0.65 + i * 0.02, 0.12);
            if (lineP <= 0) return null;
            const sa = STARS[a];
            const sb = STARS[b];
            // Partial line draw via dasharray
            const dx = sb.x - sa.x;
            const dy = sb.y - sa.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            return (
              <line
                key={`const-${i}`}
                x1={sa.x} y1={sa.y}
                x2={sb.x} y2={sb.y}
                stroke="#9090f8"
                strokeWidth={0.6}
                strokeLinecap="round"
                strokeDasharray={`${len}`}
                strokeDashoffset={len * (1 - lineP)}
                opacity={lineP * 0.8}
              />
            );
          })}
        </g>
      )}

      {/* ── Shooting stars ── */}
      {shoot1 > 0 && shoot1 < 1 && (
        <line
          x1={100 + shoot1 * 60} y1={30 + shoot1 * 25}
          x2={100 + shoot1 * 60 - 30} y2={30 + shoot1 * 25 - 8}
          stroke="white" strokeWidth={1.2} strokeLinecap="round"
          opacity={(1 - shoot1) * 0.8}
          filter="url(#shootGlow)"
        />
      )}
      {shoot2 > 0 && shoot2 < 1 && (
        <line
          x1={260 + shoot2 * 50} y1={50 + shoot2 * 20}
          x2={260 + shoot2 * 50 - 35} y2={50 + shoot2 * 20 - 10}
          stroke="white" strokeWidth={1.0} strokeLinecap="round"
          opacity={(1 - shoot2) * 0.7}
          filter="url(#shootGlow)"
        />
      )}
      {shoot3 > 0 && shoot3 < 1 && (
        <line
          x1={180 + shoot3 * 45} y1={15 + shoot3 * 18}
          x2={180 + shoot3 * 45 - 25} y2={15 + shoot3 * 18 - 7}
          stroke="white" strokeWidth={0.9} strokeLinecap="round"
          opacity={(1 - shoot3) * 0.75}
          filter="url(#shootGlow)"
        />
      )}

      {/* ══════ HORIZON / MIDGROUND ══════ */}

      {/* Atmospheric haze at horizon */}
      <rect
        x="0" y="140" width="400" height="110"
        fill="url(#hazeGrad)"
        opacity={hazeP * 0.7}
      />

      {/* Haze mist overlay */}
      {hazeP > 0.2 && (
        <rect
          x="0" y="160" width="400" height="60"
          fill="#283060"
          opacity={hazeP * 0.06}
          filter="url(#horizonMist)"
        />
      )}

      {/* ── Rolling hills beneath treeline ── */}
      <Hill y={210} height={22} color="#060e18" seed={0.5} opacity={0.3 + treeP * 0.7} />
      <Hill y={218} height={18} color="#050c14" seed={2.1} opacity={0.3 + treeP * 0.7} />
      <Hill y={225} height={14} color="#040a10" seed={3.8} opacity={0.4 + treeP * 0.6} />

      {/* ══════ FOREGROUND — TREELINE ══════ */}

      {/* Dark ground base */}
      <rect x="0" y="220" width="400" height="30" fill="#030810" opacity={0.4 + treeP * 0.6} />

      {/* Tree silhouettes — varying heights for organic skyline */}
      {TREES.map((t, i) => {
        const tp = sub(p, 0.02 + i * 0.012, 0.15);
        return (
          <TreeSilhouette
            key={`tree-${i}`}
            x={t.x}
            y={222}
            height={t.h * (0.3 + tp * 0.7)}
            spread={t.s}
            color={i % 3 === 0 ? "#050d16" : i % 3 === 1 ? "#060e18" : "#040b14"}
            opacity={0.2 + tp * 0.8}
          />
        );
      })}

      {/* Foreground ground — darkest layer */}
      <Hill y={238} height={8} color="#020608" seed={1.2} opacity={0.5 + treeP * 0.5} />

      {/* ── Subtle moonlight on treeline ── */}
      {moonP > 0.3 && (
        <ellipse
          cx="320" cy="210" rx="60" ry="20"
          fill="#9090f8"
          opacity={moonP * 0.03}
        />
      )}

      {/* ── Bottom ground — absolute dark ── */}
      <rect x="0" y="240" width="400" height="10" fill="#020508" />
    </svg>
  );
}
