import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── THE FORGOTTEN BRIDGE ──────────────────────────────────
// The bridge is GONE at p=0. Two cliff faces with broken stumps
// where it used to be. Mist fills the gap.
//
// Phrase 1 "stone, recall the crossing": individual stone blocks
// float up from the mist and lock into position, rebuilding the
// arch from memory.
//
// Phrase 2 "spirits, walk the old paths": spirit lanterns ignite
// along the rails, ghostly footprints walk across, hints of the
// two sacred places glow on each cliff.

// ─── HAND-CRAFTED PATHS ────────────────────────────────────

/** Left cliff face — irregular, rocky, with broken bridge stump */
const CLIFF_LEFT = `
  M0 90 C10 88, 20 92, 35 90
  C50 88, 60 85, 75 87
  C85 89, 95 86, 105 88
  C112 90, 118 95, 122 100
  C126 108, 128 118, 128 130
  L128 250 L0 250 Z`;

/** Right cliff face */
const CLIFF_RIGHT = `
  M400 95 C390 93, 380 96, 365 94
  C350 92, 340 89, 325 91
  C315 93, 305 90, 295 92
  C288 94, 282 100, 278 106
  C274 114, 272 124, 272 136
  L272 250 L400 250 Z`;

/** Broken stump on left cliff — where the bridge used to attach */
const STUMP_LEFT = `
  M118 100 L128 100 L128 112 L122 114 L118 110 Z`;

/** Broken stump on right cliff */
const STUMP_RIGHT = `
  M278 104 L272 106 L272 118 L278 120 L282 116 Z`;

// Bridge stones — each has a position in the final arch.
// They float up from below and lock into place.
// Arranged as an arch: the bottom stones first, then higher ones.
const BRIDGE_STONES: { x: number; y: number; w: number; h: number; delay: number }[] = [
  // Left base stones — earliest
  { x: 128, y: 112, w: 16, h: 10, delay: 0.04 },
  { x: 142, y: 108, w: 14, h: 10, delay: 0.08 },
  // Left arch rise
  { x: 154, y: 102, w: 14, h: 10, delay: 0.12 },
  { x: 166, y: 96,  w: 14, h: 9,  delay: 0.16 },
  // Left-center
  { x: 178, y: 92,  w: 13, h: 9,  delay: 0.20 },
  // Keystone — the center, last to lock
  { x: 190, y: 89,  w: 20, h: 10, delay: 0.28 },
  // Right-center
  { x: 209, y: 92,  w: 13, h: 9,  delay: 0.22 },
  // Right arch descent
  { x: 220, y: 96,  w: 14, h: 9,  delay: 0.18 },
  { x: 232, y: 102, w: 14, h: 10, delay: 0.14 },
  // Right base stones
  { x: 244, y: 108, w: 14, h: 10, delay: 0.10 },
  { x: 258, y: 112, w: 14, h: 10, delay: 0.06 },
];

// Spirit lanterns — light during phrase 2
const LANTERNS = [
  { x: 140, y: 98,  delay: 0.52 },
  { x: 165, y: 86,  delay: 0.58 },
  { x: 195, y: 80,  delay: 0.64 },
  { x: 225, y: 86,  delay: 0.70 },
  { x: 255, y: 98,  delay: 0.76 },
];

// Spirit footprints — walk from left to right
const FOOTPRINTS = [
  { x: 135, y: 108, delay: 0.80 },
  { x: 155, y: 100, delay: 0.83 },
  { x: 175, y: 92,  delay: 0.86 },
  { x: 200, y: 89,  delay: 0.89 },
  { x: 225, y: 93,  delay: 0.92 },
  { x: 245, y: 100, delay: 0.95 },
  { x: 265, y: 110, delay: 0.98 },
];

// ─── SCENE ─────────────────────────────────────────────────

function BridgeScene({ progress: p }: SceneProps) {
  // Sky — dark teal, slightly brighter with progress
  const skyL = 8 + p * 10;

  // Cliff/stone color
  const stoneL = 10 + p * 6;

  // Mist opacity — thick at start, thins as bridge forms
  const mistOpacity = 0.35 - p * 0.25;

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="stoneGlow" radius={5} color="#7aaa6a" opacity={0.5} />
        <GlowFilter id="lanternGlow" radius={8} color="#d0b870" opacity={0.5} />
        <GlowFilter id="sacredGlow" radius={12} color="#7aaa6a" opacity={0.3} />

        <linearGradient id="bridgeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(200, 15%, ${skyL + 5}%)`} />
          <stop offset="100%" stopColor={`hsl(190, 12%, ${skyL}%)`} />
        </linearGradient>

        {/* Mist gradient — thickest in the gap */}
        <radialGradient id="mistGrad" cx="50%" cy="55%" r="40%">
          <stop offset="0%" stopColor="#8898a8" stopOpacity={mistOpacity} />
          <stop offset="100%" stopColor="#8898a8" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="250" fill="url(#bridgeSky)" />

      {/* ── MIST in the gap — fades as bridge rebuilds ── */}
      <ellipse cx="200" cy="160" rx="100" ry="70" fill="url(#mistGrad)" />
      {/* Secondary mist layers */}
      <ellipse cx="180" cy="175" rx="80" ry="40"
        fill="#8090a0" opacity={mistOpacity * 0.5} />
      <ellipse cx="220" cy="150" rx="60" ry="30"
        fill="#8898a8" opacity={mistOpacity * 0.4} />

      {/* ── CLIFF FACES ── */}
      <path d={CLIFF_LEFT}
        fill={`hsl(200, ${6 + p * 4}%, ${stoneL}%)`} />
      <path d={CLIFF_RIGHT}
        fill={`hsl(200, ${6 + p * 4}%, ${stoneL}%)`} />

      {/* Cliff texture — subtle horizontal stone lines */}
      {[100, 115, 130, 148, 168, 190, 215].map((y, i) => (
        <g key={i} opacity="0.15">
          <line x1={0} y1={y + i} x2={125 - i * 2} y2={y + 2}
            stroke={`hsl(200, 4%, ${stoneL + 4}%)`} strokeWidth="0.5" />
          <line x1={275 + i * 2} y1={y + i * 0.5} x2={400} y2={y + 2}
            stroke={`hsl(200, 4%, ${stoneL + 4}%)`} strokeWidth="0.5" />
        </g>
      ))}

      {/* ── BROKEN STUMPS — visible remnants of the old bridge ── */}
      <path d={STUMP_LEFT}
        fill={`hsl(200, ${8 + p * 4}%, ${stoneL + 3}%)`} />
      <path d={STUMP_RIGHT}
        fill={`hsl(200, ${8 + p * 4}%, ${stoneL + 3}%)`} />

      {/* ── BRIDGE STONES — float up from mist and lock into place ── */}
      {BRIDGE_STONES.map((s, i) => {
        const sp = sub(p, s.delay, 0.12);
        if (sp <= 0) return null;

        // Stone starts 40px below its final position and rises
        const offsetY = (1 - sp) * 40;
        // Slight glow as it locks into place
        const lockGlow = sp > 0.7 && sp < 0.95;

        return (
          <g key={i}>
            {/* Lock glow — brief flash as stone settles */}
            {lockGlow && (
              <rect x={s.x - 2} y={s.y + offsetY - 2}
                width={s.w + 4} height={s.h + 4} rx="2"
                fill="#7aaa6a" opacity={(sp - 0.7) * 0.3}
                filter="url(#stoneGlow)" />
            )}
            {/* The stone block itself — slightly irregular */}
            <rect x={s.x} y={s.y + offsetY}
              width={s.w} height={s.h} rx="1"
              fill={`hsl(200, ${8 + p * 5}%, ${stoneL + 4 + (i % 3)}%)`}
              opacity={sp} />
            {/* Top edge highlight */}
            <line x1={s.x + 1} y1={s.y + offsetY + 1}
              x2={s.x + s.w - 1} y2={s.y + offsetY + 1}
              stroke={`hsl(200, 5%, ${stoneL + 8}%)`}
              strokeWidth="0.5" opacity={sp * 0.3} />
          </g>
        );
      })}

      {/* ── BRIDGE SURFACE — appears once all stones are placed ── */}
      {p > 0.35 && (
        <path d={`
          M128 112 C150 104, 170 94, 200 89
          C230 94, 250 104, 272 112
        `} fill="none"
          stroke={`hsl(200, ${6 + p * 4}%, ${stoneL + 2}%)`}
          strokeWidth="2"
          opacity={sub(p, 0.35, 0.15) * 0.4} />
      )}

      {/* ── SPIRIT LANTERNS — ignite during phrase 2 ── */}
      {LANTERNS.map((l, i) => {
        const lp = sub(p, l.delay, 0.1);
        if (lp <= 0) return null;
        return (
          <g key={`l${i}`} opacity={lp}>
            {/* Lantern post — thin line from bridge surface */}
            <line x1={l.x} y1={l.y + 8} x2={l.x} y2={l.y}
              stroke={`hsl(30, 10%, ${16 + p * 6}%)`}
              strokeWidth="1.5" />
            {/* Lantern glow */}
            <circle cx={l.x} cy={l.y - 3} r="8"
              fill="#d0b870" opacity={lp * 0.08}
              filter="url(#lanternGlow)" />
            {/* Lantern flame */}
            <circle cx={l.x} cy={l.y - 3} r="2.5"
              fill="#d0b870" opacity={lp * 0.6} />
            <circle cx={l.x} cy={l.y - 3} r="1"
              fill="#ffe890" opacity={lp * 0.8} />
          </g>
        );
      })}

      {/* ── SPIRIT FOOTPRINTS — walking across the bridge ── */}
      {FOOTPRINTS.map((f, i) => {
        const fp = sub(p, f.delay, 0.04);
        if (fp <= 0) return null;
        return (
          <g key={`f${i}`} opacity={fp * 0.4}>
            <ellipse cx={f.x} cy={f.y - 2} rx="2.5" ry="1.2"
              fill="#7aaa6a" filter="url(#stoneGlow)" />
            <ellipse cx={f.x + 5} cy={f.y - 1} rx="2.5" ry="1.2"
              fill="#7aaa6a" filter="url(#stoneGlow)" />
          </g>
        );
      })}

      {/* ── SACRED PLACE HINTS — glow on each cliff at high progress ── */}
      {p > 0.85 && (
        <g opacity={sub(p, 0.85, 0.12)}>
          {/* Left cliff — hint of a tree (Garden/Tree connection) */}
          <circle cx="50" cy="75" r="15"
            fill="#6bbf6b" opacity="0.05" filter="url(#sacredGlow)" />
          {/* Right cliff — hint of standing stones */}
          <circle cx="350" cy="78" r="15"
            fill="#88a8c8" opacity="0.05" filter="url(#sacredGlow)" />
        </g>
      )}

      {/* ── DEPTH — dark bottom of the chasm ── */}
      <rect x="128" y="200" width="144" height="50"
        fill={`hsl(210, 10%, ${4 + p * 2}%)`} opacity="0.5" />

      {/* ── SUBTLE MIST PARTICLES ── */}
      {Array.from({ length: 8 }).map((_, i) => {
        const mx = 140 + (i * 31) % 120;
        const my = 130 + (i * 19) % 60;
        const drift = Math.sin(p * Math.PI * 2 + i * 1.3) * 5;
        return (
          <circle key={i} cx={mx + drift} cy={my}
            r={0.6} fill="#8898a8"
            opacity={Math.max(0, 0.12 - p * 0.08)} />
        );
      })}
    </svg>
  );
}

export default memo(BridgeScene);
