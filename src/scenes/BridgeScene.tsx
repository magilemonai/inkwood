import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── THE FORGOTTEN BRIDGE ──────────────────────────────────
// The bridge is GONE at p=0. Two massive cliff faces with broken
// stumps where it used to connect. Deep chasm with mist below.
//
// Phrase 1 "stone, recall the crossing": individual stone blocks
// float up from the chasm and lock into an arch, rebuilding
// from memory. Each stone glows briefly as it settles.
//
// Phrase 2 "spirits, walk the old paths": spirit lanterns ignite
// along the rails, ghostly footprints walk across, moss and
// vegetation bloom on the cliffs and bridge surface.

// ─── HAND-CRAFTED PATHS ────────────────────────────────────

/** Left cliff — tall, jagged, with overhangs and irregular face */
const CLIFF_LEFT = `
  M0 55 C8 53, 15 58, 25 54
  C35 50, 42 56, 52 52
  C60 48, 68 54, 78 50
  C85 47, 90 52, 98 48
  C104 44, 108 50, 114 52
  C118 55, 122 60, 126 68
  C130 78, 132 88, 132 98
  C133 108, 134 118, 134 128
  L134 250 L0 250 Z`;

/** Left cliff inner face — the vertical drop into the chasm */
const CLIFF_LEFT_FACE = `
  M126 68 C128 72, 130 78, 132 88
  C133 98, 134 110, 134 128
  L134 250 L128 250 L128 135
  C127 120, 125 108, 124 98
  C122 88, 120 80, 118 74
  L126 68 Z`;

/** Right cliff — mirroring left with different character */
const CLIFF_RIGHT = `
  M400 60 C392 58, 385 63, 375 59
  C365 55, 358 61, 348 57
  C338 53, 330 58, 322 54
  C314 50, 308 55, 302 52
  C296 48, 290 54, 284 58
  C278 62, 274 70, 270 80
  C267 90, 266 102, 266 115
  C266 125, 266 135, 266 145
  L266 250 L400 250 Z`;

/** Right cliff inner face */
const CLIFF_RIGHT_FACE = `
  M284 58 C278 62, 274 70, 270 80
  C267 90, 266 102, 266 115
  L266 250 L272 250 L272 120
  C273 108, 275 95, 278 85
  C280 76, 282 68, 284 58 Z`;

/** Broken stump on left — jagged broken stone */
const STUMP_LEFT = `
  M120 72 C122 68, 126 65, 130 66
  C133 67, 135 72, 134 78
  C133 84, 132 90, 132 96
  L128 98 C126 92, 124 86, 122 80
  C121 76, 120 74, 120 72 Z`;

/** Broken stump on right — asymmetric break */
const STUMP_RIGHT = `
  M270 76 C272 72, 275 68, 278 69
  C282 70, 284 74, 283 80
  C282 86, 280 92, 278 98
  L274 100 C272 94, 270 88, 268 82
  C267 78, 268 76, 270 76 Z`;

/** Chasm depth — dark void between cliffs */
const CHASM = `
  M134 130 L134 250 L266 250 L266 130
  C260 145, 250 165, 240 170
  C220 180, 200 185, 180 180
  C165 175, 150 160, 140 145
  L134 130 Z`;

/** Chasm inner walls — rocky texture paths */
const CHASM_WALL_LEFT = `
  M134 130 C136 138, 138 148, 140 155
  C142 162, 145 168, 150 172
  L134 175 L134 130 Z`;

const CHASM_WALL_RIGHT = `
  M266 130 C264 140, 262 150, 260 158
  C258 164, 255 170, 250 174
  L266 176 L266 130 Z`;

// Bridge stones — bezier path data for each irregular stone block
// Each stone has its own hand-crafted shape (not rectangles)
const BRIDGE_STONES: { path: string; cx: number; cy: number; delay: number }[] = [
  // Left base — connects at cliff top (~y=55)
  { path: "M0 0 C2 -2, 14 -3, 16 0 C17 4, 16 9, 14 10 C6 11, 2 10, 0 8 C-1 5, -1 2, 0 0 Z",
    cx: 134, cy: 58, delay: 0.04 },
  { path: "M0 0 C3 -2, 11 -2, 14 0 C15 3, 14 8, 12 10 C5 11, 1 10, 0 7 C-1 4, -1 2, 0 0 Z",
    cx: 148, cy: 54, delay: 0.08 },
  // Left arch rise
  { path: "M0 0 C2 -3, 12 -3, 14 -1 C15 3, 14 8, 12 9 C5 10, 1 9, 0 7 C-1 4, -1 1, 0 0 Z",
    cx: 160, cy: 48, delay: 0.12 },
  { path: "M0 0 C3 -2, 11 -3, 13 -1 C14 2, 13 7, 11 9 C5 10, 1 9, 0 6 C-1 3, -1 1, 0 0 Z",
    cx: 172, cy: 42, delay: 0.16 },
  // Left-center
  { path: "M0 0 C2 -2, 10 -3, 13 -1 C14 2, 13 7, 11 8 C5 9, 1 8, 0 6 C-1 3, -1 1, 0 0 Z",
    cx: 183, cy: 37, delay: 0.20 },
  // KEYSTONE — center, at the peak of the arch
  { path: "M0 0 C3 -4, 15 -4, 18 -1 C20 3, 19 9, 16 11 C8 12, 2 11, 0 8 C-2 4, -1 1, 0 0 Z",
    cx: 192, cy: 33, delay: 0.28 },
  // Right-center
  { path: "M0 0 C2 -2, 10 -3, 13 -1 C14 2, 13 7, 11 8 C5 9, 1 8, 0 6 C-1 3, -1 1, 0 0 Z",
    cx: 209, cy: 37, delay: 0.22 },
  // Right arch descent
  { path: "M0 0 C3 -2, 11 -3, 13 -1 C14 2, 13 7, 11 9 C5 10, 1 9, 0 6 C-1 3, -1 1, 0 0 Z",
    cx: 220, cy: 42, delay: 0.18 },
  { path: "M0 0 C2 -3, 12 -3, 14 -1 C15 3, 14 8, 12 9 C5 10, 1 9, 0 7 C-1 4, -1 1, 0 0 Z",
    cx: 232, cy: 48, delay: 0.14 },
  // Right base — connects at right cliff top (~y=58)
  { path: "M0 0 C3 -2, 11 -2, 14 0 C15 3, 14 8, 12 10 C5 11, 1 10, 0 7 C-1 4, -1 2, 0 0 Z",
    cx: 246, cy: 54, delay: 0.10 },
  { path: "M0 0 C2 -2, 14 -3, 16 0 C17 4, 16 9, 14 10 C6 11, 2 10, 0 8 C-1 5, -1 2, 0 0 Z",
    cx: 258, cy: 58, delay: 0.06 },
];

// Spirit lanterns — along the arch, above cliff tops
const LANTERNS = [
  { x: 148, y: 44, delay: 0.52 },
  { x: 172, y: 32, delay: 0.58 },
  { x: 200, y: 25, delay: 0.64 },
  { x: 228, y: 32, delay: 0.70 },
  { x: 252, y: 44, delay: 0.76 },
];

// Spirit footprints — walk from left to right across the high arch
const FOOTPRINTS = [
  { x: 140, y: 56, delay: 0.80 },
  { x: 160, y: 48, delay: 0.83 },
  { x: 180, y: 39, delay: 0.86 },
  { x: 200, y: 35, delay: 0.89 },
  { x: 220, y: 39, delay: 0.92 },
  { x: 240, y: 48, delay: 0.95 },
  { x: 260, y: 56, delay: 0.98 },
];

// Cliff-top vegetation — moss and ferns that bloom in phrase 2
const VEGETATION = [
  // Left cliff top
  { x: 30, y: 52, h: 6, delay: 0.55 },
  { x: 55, y: 50, h: 8, delay: 0.60 },
  { x: 80, y: 48, h: 7, delay: 0.65 },
  { x: 105, y: 50, h: 5, delay: 0.58 },
  // Right cliff top
  { x: 295, y: 52, h: 6, delay: 0.62 },
  { x: 320, y: 55, h: 7, delay: 0.57 },
  { x: 345, y: 57, h: 8, delay: 0.68 },
  { x: 370, y: 59, h: 5, delay: 0.63 },
];

function BridgeScene({ progress: p }: SceneProps) {
  // Sky — dark teal, slightly brighter with progress
  const skyL = 6 + p * 12;
  const skySat = 12 + p * 10;

  // Cliff color — starts very dark, gains some warmth
  const cliffH = 200 - p * 15;
  const cliffS = 6 + p * 8;
  const cliffL = 8 + p * 8;

  // Inner cliff face — slightly lighter than main cliff
  const faceL = cliffL + 3;

  // Mist opacity — thins as bridge forms
  const mistOpacity = Math.max(0, 0.2 - p * 0.18);

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="stoneGlow" radius={5} color="#7aaa6a" opacity={0.5} />
        <GlowFilter id="lanternGlow" radius={8} color="#d0b870" opacity={0.5} />

        <linearGradient id="bridgeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(210, ${skySat}%, ${skyL + 6}%)`} />
          <stop offset="60%" stopColor={`hsl(200, ${skySat - 2}%, ${skyL + 3}%)`} />
          <stop offset="100%" stopColor={`hsl(190, ${skySat + 3}%, ${skyL}%)`} />
        </linearGradient>

        {/* Chasm depth gradient — darkest at bottom */}
        <linearGradient id="chasmDepth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(210, 8%, ${cliffL - 2}%)`} />
          <stop offset="100%" stopColor={`hsl(220, 10%, 3%)`} />
        </linearGradient>
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="250" fill="url(#bridgeSky)" />

      {/* ── CHASM MIST — organic wisps rising from the void ── */}
      {[
        "M140 160 C155 152, 175 148, 200 145 C225 148, 245 152, 260 160",
        "M145 140 C165 134, 185 130, 200 128 C215 130, 235 134, 255 140",
        "M150 115 C170 110, 185 108, 200 106 C215 108, 230 110, 250 115",
      ].map((d, i) => (
        <path key={`mist${i}`} d={d}
          fill="none" stroke="#8898a8"
          strokeWidth={8 - i * 2}
          strokeLinecap="round"
          opacity={(0.06 + i * 0.02) * (1 - p * 0.8)} />
      ))}

      {/* ── CHASM — deep dark void between cliffs ── */}
      <path d={CHASM} fill="url(#chasmDepth)" />

      {/* Chasm inner wall shadows */}
      <path d={CHASM_WALL_LEFT}
        fill={`hsl(${cliffH}, ${cliffS + 2}%, ${cliffL - 3}%)`} />
      <path d={CHASM_WALL_RIGHT}
        fill={`hsl(${cliffH}, ${cliffS + 2}%, ${cliffL - 3}%)`} />

      {/* ── CLIFF FACES ── */}
      <path d={CLIFF_LEFT}
        fill={`hsl(${cliffH}, ${cliffS}%, ${cliffL}%)`} />
      <path d={CLIFF_RIGHT}
        fill={`hsl(${cliffH}, ${cliffS}%, ${cliffL}%)`} />

      {/* Inner cliff faces — slightly different shade for depth */}
      <path d={CLIFF_LEFT_FACE}
        fill={`hsl(${cliffH}, ${cliffS + 2}%, ${faceL}%)`} />
      <path d={CLIFF_RIGHT_FACE}
        fill={`hsl(${cliffH}, ${cliffS + 2}%, ${faceL}%)`} />

      {/* Cliff texture — layered horizontal stone lines */}
      {[58, 68, 78, 88, 100, 115, 130, 148].map((y, i) => (
        <g key={`tex${i}`} opacity={0.12 + p * 0.06}>
          <path
            d={`M${3 + i * 2} ${y + i * 0.5} C${30 + i * 5} ${y + 1}, ${60 + i * 3} ${y - 1}, ${125 - i * 3} ${y + 2}`}
            fill="none" stroke={`hsl(${cliffH}, 4%, ${cliffL + 5}%)`} strokeWidth="0.5" />
          <path
            d={`M${275 + i * 3} ${y + i * 0.5 + 4} C${310 + i * 2} ${y + 5}, ${350 - i * 2} ${y + 3}, ${397 - i * 2} ${y + 6}`}
            fill="none" stroke={`hsl(${cliffH}, 4%, ${cliffL + 5}%)`} strokeWidth="0.5" />
        </g>
      ))}

      {/* ── BROKEN STUMPS — jagged remnants ── */}
      <path d={STUMP_LEFT}
        fill={`hsl(${cliffH}, ${cliffS + 3}%, ${cliffL + 4}%)`} />
      <path d={STUMP_RIGHT}
        fill={`hsl(${cliffH}, ${cliffS + 3}%, ${cliffL + 4}%)`} />

      {/* Stump crack details */}
      <line x1="126" y1="70" x2="128" y2="85" stroke={`hsl(${cliffH}, 3%, ${cliffL - 2}%)`} strokeWidth="0.5" opacity="0.3" />
      <line x1="276" y1="74" x2="274" y2="88" stroke={`hsl(${cliffH}, 3%, ${cliffL - 2}%)`} strokeWidth="0.5" opacity="0.3" />

      {/* ── BRIDGE STONES — float up from chasm and lock into arch ── */}
      {BRIDGE_STONES.map((s, i) => {
        const sp = sub(p, s.delay, 0.12);
        if (sp <= 0) return null;

        // Stone starts 50px below its final position and rises
        const offsetY = (1 - sp) * 50;
        // Brief glow as it locks into place
        const lockGlow = sp > 0.7 && sp < 0.95;
        const lockIntensity = (sp - 0.7) / 0.25;

        return (
          <g key={i} transform={`translate(${s.cx}, ${s.cy + offsetY})`}>
            {/* Lock glow flash */}
            {lockGlow && (
              <circle r={10} fill="#7aaa6a"
                opacity={lockIntensity * 0.15}
                filter="url(#stoneGlow)" />
            )}
            {/* The stone — hand-crafted irregular shape */}
            <path d={s.path}
              fill={`hsl(${cliffH}, ${cliffS + 3}%, ${cliffL + 5 + (i % 3)}%)`}
              opacity={sp} />
            {/* Top edge highlight */}
            <path d={s.path}
              fill="none"
              stroke={`hsl(${cliffH}, 4%, ${cliffL + 10}%)`}
              strokeWidth="0.4" opacity={sp * 0.25} />
          </g>
        );
      })}

      {/* ── BRIDGE ARCH CURVE — at cliff-top height ── */}
      {p > 0.35 && (
        <path d={`
          M134 58 C150 45, 170 36, 200 33
          C230 36, 250 45, 266 58
        `} fill="none"
          stroke={`hsl(${cliffH}, ${cliffS + 2}%, ${cliffL + 3}%)`}
          strokeWidth="1.5"
          opacity={sub(p, 0.35, 0.15) * 0.3}
          strokeLinecap="round" />
      )}

      {/* ── CLIFF-TOP VEGETATION — moss/ferns bloom in phrase 2 ── */}
      {VEGETATION.map((v, i) => {
        const vp = sub(p, v.delay, 0.15);
        if (vp <= 0) return null;
        return (
          <g key={`veg${i}`} opacity={vp * 0.6}>
            {/* Fern fronds */}
            <line x1={v.x - 2} y1={v.y} x2={v.x - 4} y2={v.y - v.h * vp}
              stroke={`hsl(140, ${15 + p * 15}%, ${10 + p * 8}%)`}
              strokeWidth={0.8} strokeLinecap="round" />
            <line x1={v.x} y1={v.y} x2={v.x + 1} y2={v.y - (v.h + 2) * vp}
              stroke={`hsl(135, ${15 + p * 15}%, ${12 + p * 8}%)`}
              strokeWidth={0.8} strokeLinecap="round" />
            <line x1={v.x + 2} y1={v.y} x2={v.x + 4} y2={v.y - (v.h - 1) * vp}
              stroke={`hsl(145, ${15 + p * 15}%, ${11 + p * 8}%)`}
              strokeWidth={0.8} strokeLinecap="round" />
          </g>
        );
      })}

      {/* ── SPIRIT LANTERNS — ignite during phrase 2 ── */}
      {LANTERNS.map((l, i) => {
        const lp = sub(p, l.delay, 0.1);
        if (lp <= 0) return null;
        return (
          <g key={`l${i}`} opacity={lp}>
            {/* Lantern post */}
            <line x1={l.x} y1={l.y + 8} x2={l.x} y2={l.y}
              stroke={`hsl(30, 10%, ${14 + p * 6}%)`}
              strokeWidth="1.2" strokeLinecap="round" />
            {/* Warm glow halo */}
            <circle cx={l.x} cy={l.y - 3} r="10"
              fill="#d0b870" opacity={lp * 0.06} />
            {/* Lantern flame */}
            <ellipse cx={l.x} cy={l.y - 3} rx="2" ry="3"
              fill="#d0b870" opacity={lp * 0.6} />
            <ellipse cx={l.x} cy={l.y - 3} rx="1" ry="1.5"
              fill="#ffe890" opacity={lp * 0.8} />
          </g>
        );
      })}

      {/* ── SPIRIT FOOTPRINTS — walking across the arch ── */}
      {FOOTPRINTS.map((f, i) => {
        const fp = sub(p, f.delay, 0.04);
        if (fp <= 0) return null;
        return (
          <g key={`f${i}`} opacity={fp * 0.35}>
            {/* Left foot */}
            <ellipse cx={f.x - 1} cy={f.y - 2} rx="2" ry="1"
              fill="#7aaa6a" filter="url(#stoneGlow)" />
            {/* Right foot — slightly ahead */}
            <ellipse cx={f.x + 4} cy={f.y - 1} rx="2" ry="1"
              fill="#7aaa6a" filter="url(#stoneGlow)" />
          </g>
        );
      })}

      {/* ── MOSS on bridge surface — appears late, life returning ── */}
      {p > 0.75 && (() => {
        const mp = sub(p, 0.75, 0.2);
        return (
          <g opacity={mp * 0.3}>
            {[145, 165, 190, 215, 240].map((x, i) => {
              const archY = 58 - Math.sin(((x - 134) / 132) * Math.PI) * 25;
              return (
                <circle key={`moss${i}`}
                  cx={x} cy={archY + 2} r={1.5 + (i % 2)}
                  fill={`hsl(${130 + i * 5}, 20%, ${12 + p * 6}%)`} />
              );
            })}
          </g>
        );
      })()}

      {/* ── RISING MIST WISPS from chasm — atmospheric ── */}
      {Array.from({ length: 6 }).map((_, i) => {
        const wx = 150 + (i * 23) % 100;
        const baseY = 140 + (i * 17) % 40;
        const drift = Math.sin(p * Math.PI * 2 + i * 1.5) * 6;
        const rise = p * 20 * ((i % 3) / 3);
        return (
          <circle key={`wp${i}`}
            cx={wx + drift} cy={baseY - rise} r={0.5 + (i % 3) * 0.3}
            fill="#8898a8"
            opacity={Math.max(0, 0.08 - p * 0.05)} />
        );
      })}
    </svg>
  );
}

export default memo(BridgeScene);
