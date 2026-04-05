import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── THE SPIRIT STONES ────────────────────────────────────
// 7 standing stones in a perspective arc on a misty moorland.
// "stand tall again guardians of old" → stones rise from the earth.
// "remember what was promised" → ley lines draw between them,
// runes glow, ritual circle manifests, aurora shimmers above.

// ─── HAND-CRAFTED TERRAIN ─────────────────────────────────

/** Far hills — gentle rolling distant moor */
const HILLS_FAR = `
  M0 162 C30 158, 55 164, 80 160
  C105 156, 130 162, 160 158
  C190 154, 210 160, 240 156
  C270 152, 300 158, 330 155
  C360 152, 380 158, 400 155
  L400 250 L0 250 Z`;

/** Mid hills — closer, heather-covered */
const HILLS_MID = `
  M0 178 C25 174, 50 180, 75 176
  C100 172, 120 178, 145 174
  C170 170, 190 176, 215 172
  C240 168, 260 174, 285 170
  C310 166, 335 172, 360 168
  C385 164, 395 170, 400 168
  L400 250 L0 250 Z`;

/** Ground — foreground moorland */
const GROUND = `
  M0 195 C20 192, 45 198, 70 194
  C95 190, 115 196, 140 192
  C165 188, 185 194, 210 190
  C235 186, 255 192, 280 188
  C305 184, 325 190, 350 186
  C375 182, 390 188, 400 185
  L400 250 L0 250 Z`;

// 7 standing stones — perspective arc
const STONES = [
  { x: 200, y: 85,  w: 22, h: 58, lean: 0,   delay: 0 },
  { x: 138, y: 100, w: 20, h: 48, lean: -3,  delay: 0.08 },
  { x: 262, y: 98,  w: 21, h: 50, lean: 2,   delay: 0.15 },
  { x: 88,  y: 125, w: 18, h: 42, lean: -5,  delay: 0.22 },
  { x: 312, y: 122, w: 19, h: 44, lean: 4,   delay: 0.28 },
  { x: 62,  y: 158, w: 16, h: 35, lean: -4,  delay: 0.34 },
  { x: 338, y: 155, w: 17, h: 37, lean: 3,   delay: 0.4 },
];

// Ley line connections
const LEY_LINES = [
  { from: 0, to: 1, delay: 0.5 },
  { from: 0, to: 2, delay: 0.54 },
  { from: 1, to: 3, delay: 0.58 },
  { from: 2, to: 4, delay: 0.62 },
  { from: 3, to: 5, delay: 0.66 },
  { from: 4, to: 6, delay: 0.7 },
  { from: 5, to: 6, delay: 0.75 },
  { from: 1, to: 2, delay: 0.78 },
];

// Rune paths — angular marks carved on stones
const RUNE_SHAPES = [
  "M0-5 L0 5 M-3-2 L3-2",
  "M-3-5 L0 0 L3-5 M0 0 L0 5",
  "M-3-4 L3-4 L3 4 L-3 4",
  "M0-5 L3 0 L0 5 L-3 0 Z",
  "M-3-5 L3 5 M3-5 L-3 5",
  "M-2-5 L-2 5 M2-5 L2 5 M-4 0 L4 0",
  "M0-5 L4 0 L0 5 M0-5 L-4 0 L0 5",
];

function StonesScene({ progress: p }: SceneProps) {
  const skyH = 220;
  const skyS = 10 + p * 8;
  const skyL = 5 + p * 7;
  const groundH = 35 - p * 5;
  const groundS = 8 + p * 8;
  const groundL = 7 + p * 5;

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="runeGlow" radius={5} color="#88a8c8" opacity={0.6} />
        <GlowFilter id="leyGlow" radius={3} color="#88a8c8" opacity={0.5} />

        <linearGradient id="stonesSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${skyH}, ${skyS}%, ${skyL + 4}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH - 5}, ${skyS + 3}%, ${skyL}%)`} />
        </linearGradient>

        <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#88a8c8" stopOpacity={0} />
          <stop offset="30%" stopColor="#88a8c8" stopOpacity={sub(p, 0.7, 0.2) * 0.08} />
          <stop offset="50%" stopColor="#a0b8d8" stopOpacity={sub(p, 0.7, 0.2) * 0.12} />
          <stop offset="70%" stopColor="#88a8c8" stopOpacity={sub(p, 0.7, 0.2) * 0.06} />
          <stop offset="100%" stopColor="#88a8c8" stopOpacity={0} />
        </linearGradient>

        <radialGradient id="stonesGlow" cx="50%" cy="45%" r="40%">
          <stop offset="0%" stopColor="#88a8c8" stopOpacity={p * 0.12} />
          <stop offset="100%" stopColor="#88a8c8" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="250" fill="url(#stonesSky)" />

      {/* ── AURORA at high progress ── */}
      {p > 0.7 && <rect x="60" y="5" width="280" height="40" fill="url(#aurora)" rx="20" />}

      {/* ── FAR HILLS ── */}
      <path d={HILLS_FAR}
        fill={`hsl(${skyH - 5}, ${skyS - 2}%, ${skyL - 1}%)`} />

      {/* ── MID HILLS ── */}
      <path d={HILLS_MID}
        fill={`hsl(${skyH - 8}, ${skyS}%, ${skyL + 1}%)`} />

      {/* ── GROUND ── */}
      <path d={GROUND}
        fill={`hsl(${groundH}, ${groundS}%, ${groundL}%)`} />

      {/* Ground base fill */}
      <rect x="0" y="200" width="400" height="50"
        fill={`hsl(${groundH}, ${groundS}%, ${groundL - 1}%)`} />

      {/* ── HEATHER TUFTS — hand-drawn grass ── */}
      {[
        { x: 25, y: 196 }, { x: 55, y: 193 }, { x: 90, y: 198 },
        { x: 130, y: 194 }, { x: 170, y: 190 }, { x: 210, y: 192 },
        { x: 250, y: 188 }, { x: 290, y: 190 }, { x: 320, y: 186 },
        { x: 360, y: 188 }, { x: 390, y: 185 },
        { x: 40, y: 205 }, { x: 115, y: 202 }, { x: 200, y: 200 },
        { x: 275, y: 198 }, { x: 345, y: 196 },
      ].map((g, i) => {
        const gp = 0.3 + p * 0.7;
        return (
          <g key={`gr${i}`} opacity={gp * 0.5}>
            <line x1={g.x - 2} y1={g.y} x2={g.x - 3} y2={g.y - 5 * gp}
              stroke={`hsl(${30 + (i % 3) * 5}, ${12 + p * 8}%, ${10 + p * 5}%)`}
              strokeWidth={0.7} strokeLinecap="round" />
            <line x1={g.x} y1={g.y} x2={g.x + 1} y2={g.y - 7 * gp}
              stroke={`hsl(${28 + (i % 4) * 3}, ${14 + p * 8}%, ${12 + p * 5}%)`}
              strokeWidth={0.7} strokeLinecap="round" />
            <line x1={g.x + 2} y1={g.y} x2={g.x + 4} y2={g.y - 4 * gp}
              stroke={`hsl(${32 + (i % 2) * 4}, ${10 + p * 7}%, ${9 + p * 4}%)`}
              strokeWidth={0.7} strokeLinecap="round" />
          </g>
        );
      })}

      {/* ── CENTRAL GLOW ── */}
      <ellipse cx="200" cy="155" rx="140" ry="60" fill="url(#stonesGlow)" />

      {/* ── RITUAL CIRCLE — raised above text overlay ── */}
      {p > 0.65 && (
        <g opacity={sub(p, 0.65, 0.2)}>
          <ellipse cx="200" cy="160" rx={120 * sub(p, 0.65, 0.15)} ry={20 * sub(p, 0.65, 0.15)}
            fill="none" stroke="#88a8c8" strokeWidth="0.8" opacity="0.35" strokeDasharray="6 8" />
          <ellipse cx="200" cy="160" rx={90 * sub(p, 0.7, 0.15)} ry={14 * sub(p, 0.7, 0.15)}
            fill="none" stroke="#88a8c8" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 5" />
        </g>
      )}

      {/* ── LEY LINES ── */}
      {LEY_LINES.map((l, i) => {
        const lp = sub(p, l.delay, 0.12);
        if (lp <= 0) return null;
        const s1 = STONES[l.from];
        const s2 = STONES[l.to];
        const stoneTopY1 = s1.y + s1.h - sub(p, s1.delay, 0.2) * s1.h;
        const stoneTopY2 = s2.y + s2.h - sub(p, s2.delay, 0.2) * s2.h;
        const midY1 = stoneTopY1 + 15;
        const midY2 = stoneTopY2 + 15;
        const lineLength = Math.sqrt((s2.x - s1.x) ** 2 + (midY2 - midY1) ** 2);
        return (
          <g key={`ley${i}`}>
            <line x1={s1.x} y1={midY1} x2={s2.x} y2={midY2}
              stroke="#88a8c8" strokeWidth="1.5" strokeLinecap="round"
              strokeDasharray={lineLength} strokeDashoffset={lineLength * (1 - lp)}
              opacity={lp * 0.4} filter="url(#leyGlow)" />
            {/* Inner bright line */}
            <line x1={s1.x} y1={midY1} x2={s2.x} y2={midY2}
              stroke="#b0c8e0" strokeWidth="0.5" strokeLinecap="round"
              strokeDasharray={lineLength} strokeDashoffset={lineLength * (1 - lp)}
              opacity={lp * 0.2} />
          </g>
        );
      })}

      {/* ── STANDING STONES ── */}
      {STONES.map((s, i) => {
        const sp = sub(p, s.delay, 0.2);
        if (sp <= 0) return null;
        const rise = sp * s.h;
        const topY = s.y + s.h - rise;
        const hw = s.w / 2;

        const path = `
          M${s.x - hw + s.lean} ${topY}
          C${s.x - hw * 1.1 + s.lean * 0.5} ${topY + rise * 0.3},
           ${s.x - hw * 1.15} ${topY + rise * 0.7},
           ${s.x - hw * 0.95} ${s.y + s.h}
          L${s.x + hw * 0.95} ${s.y + s.h}
          C${s.x + hw * 1.15} ${topY + rise * 0.7},
           ${s.x + hw * 1.1 + s.lean * 0.5} ${topY + rise * 0.3},
           ${s.x + hw + s.lean} ${topY}
          Z`;

        const runeP = sub(sp, 0.6, 0.3);

        return (
          <g key={`stone${i}`}>
            {/* Stone body */}
            <path d={path}
              fill={`hsl(220, ${6 + p * 4}%, ${16 + p * 5}%)`} />
            {/* Stone texture — subtle horizontal lines */}
            {[0.2, 0.4, 0.6, 0.8].map((t, j) => {
              const ly = topY + rise * t;
              const lx1 = s.x - hw * (1 - t * 0.15) + s.lean * (1 - t);
              const lx2 = s.x + hw * (1 - t * 0.15) + s.lean * (1 - t);
              return (
                <line key={`tex${j}`} x1={lx1 + 2} y1={ly} x2={lx2 - 2} y2={ly}
                  stroke={`hsl(220, 4%, ${20 + p * 4}%)`}
                  strokeWidth="0.4" opacity={sp * 0.15} />
              );
            })}
            {/* Cap — lighter top */}
            <line x1={s.x - hw + s.lean + 2} y1={topY + 1}
              x2={s.x + hw + s.lean - 2} y2={topY + 1}
              stroke={`hsl(220, 5%, ${22 + p * 5}%)`}
              strokeWidth="2" strokeLinecap="round" opacity={sp * 0.4} />
            {/* Rune */}
            {runeP > 0 && (
              <g opacity={runeP} filter="url(#runeGlow)"
                transform={`translate(${s.x}, ${topY + rise * 0.4})`}>
                <path d={RUNE_SHAPES[i]} fill="none"
                  stroke="#88a8c8" strokeWidth="1.2" strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}

      {/* ── SMALL CAIRNS ── */}
      {[
        { x: 168, y: 192 }, { x: 232, y: 190 },
        { x: 115, y: 200 }, { x: 285, y: 198 },
      ].map((c, i) => (
        <g key={`cairn${i}`} opacity={0.3 + p * 0.3}>
          <circle cx={c.x} cy={c.y} r="3" fill={`hsl(220, 6%, ${14 + p * 3}%)`} />
          <circle cx={c.x - 1} cy={c.y - 4} r="2.5" fill={`hsl(220, 7%, ${15 + p * 3}%)`} />
          <circle cx={c.x + 0.5} cy={c.y - 7} r="2" fill={`hsl(220, 8%, ${16 + p * 3}%)`} />
        </g>
      ))}

      {/* ── SPIRIT WISPS — inlined, no primitive ── */}
      {p > 0.3 && [
        { x: 100, y: 170, delay: 0.4, r: 2 },
        { x: 300, y: 165, delay: 0.5, r: 1.8 },
        { x: 200, y: 175, delay: 0.6, r: 2.2 },
      ].map((w, i) => {
        const wp = sub(p, w.delay, 0.15);
        const drift = Math.sin(p * Math.PI * 3 + i * 2) * 5;
        const bob = Math.sin(p * Math.PI * 4 + i * 1.5) * 3;
        return wp > 0 ? (
          <g key={`wisp${i}`}>
            <circle cx={w.x + drift} cy={w.y + bob} r={w.r * 2.5}
              fill="#88a8c8" opacity={wp * 0.04} />
            <circle cx={w.x + drift} cy={w.y + bob} r={w.r}
              fill="#b0c8e0" opacity={wp * 0.25} />
          </g>
        ) : null;
      })}

      {/* ── LOW MIST — organic wisps, not filtered rect ── */}
      {[
        "M0 200 C40 196, 90 202, 140 198 C190 194, 240 200, 300 196 C340 192, 380 198, 400 195",
        "M0 210 C50 206, 100 212, 160 208 C220 204, 280 210, 340 206 C370 204, 390 208, 400 206",
      ].map((d, i) => (
        <path key={`mist${i}`} d={d} fill="none"
          stroke="#8898a8" strokeWidth={6 - i * 2}
          strokeLinecap="round" opacity={(0.08 - p * 0.04) * (1 + i * 0.3)} />
      ))}

      {/* ── ENERGY PULSE at completion ── */}
      {p > 0.9 && (
        <ellipse cx="200" cy="155" rx={80 * sub(p, 0.9, 0.1)} ry={25 * sub(p, 0.9, 0.1)}
          fill="#88a8c8" opacity={(1 - sub(p, 0.9, 0.1)) * 0.15} />
      )}

      {/* ── ATMOSPHERIC PARTICLES ── */}
      {Array.from({ length: 20 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 180 + 30;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 6;
        const rise = p * 20 * ((i % 4) / 4);
        const size = 0.4 + (i % 3) * 0.2;
        const op = (0.06 + (i % 3) * 0.04) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={baseY - rise} r={size}
            fill={i % 3 === 0 ? "#a0b8d8" : "#88a8c8"} opacity={op} />
        );
      })}
    </svg>
  );
}

export default memo(StonesScene);
