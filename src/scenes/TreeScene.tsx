import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── THE GREAT TREE ────────────────────────────────────────
// The nexus of all living things. Its roots are the ley lines.
// Its branches hold the sky. This is the game's visual climax.
//
// The tree fills the ENTIRE viewport — no landscape, no sky.
// Just the tree as world. Dark but visible at p=0, fully
// luminous at p=1.
//
// Three prompts = three phases:
// "roots deeper than memory"    → roots glow outward
// "branches wider than sky"     → branches glow upward
// "awaken, heart of all things" → heart pulse, canopy blooms
//
// Shifted UP so all content is above y=170 (the typing overlay).
// Roots spread HORIZONTALLY, not downward.

// ─── HAND-CRAFTED PATHS ────────────────────────────────────

/** Massive trunk — gnarled, ancient, the spine of the world.
 *  Center at x=200, base at y=155, crown at y=55.
 *  Wide at base (~50px), narrowing at crown (~16px). */
const TRUNK = `
  M175 160
  C174 154, 172 148, 173 142
  C174 136, 170 132, 172 126
  C173 120, 170 116, 172 110
  C174 104, 171 98, 174 92
  C176 86, 178 80, 180 74
  C182 68, 186 62, 190 58
  L210 58
  C214 62, 218 68, 220 74
  C222 80, 224 86, 226 92
  C229 98, 226 104, 228 110
  C230 116, 227 120, 228 126
  C230 132, 226 136, 227 142
  C228 148, 226 154, 225 160
  Z`;

/** Bark detail lines — carved into the trunk surface */
const BARK_LINES = [
  "M182 145 C184 138, 180 130, 183 122",
  "M218 140 C216 132, 220 124, 217 116",
  "M190 100 C192 92, 188 84, 191 76",
  "M210 105 C208 96, 212 88, 209 80",
  "M195 130 C197 124, 194 118, 196 112",
  // Knot/burl details
  "M185 118 C183 116, 182 114, 184 112 C186 110, 188 112, 186 114",
  "M216 132 C218 130, 220 128, 218 126 C216 124, 214 126, 216 128",
];

/** 6 major roots — thick tapered paths spreading LEFT and RIGHT
 *  from the trunk base. Horizontally deep, not vertically. */
const ROOTS = [
  // Far left — sweeps to the left edge
  `M178 158 C160 156, 130 160, 95 158 C65 156, 35 162, 5 160
   L5 164 C35 166, 65 162, 95 164 C130 166, 160 162, 180 162 Z`,
  // Mid left — curves left-up
  `M176 154 C155 148, 125 142, 90 144 C60 146, 35 140, 10 142
   L10 146 C35 145, 60 150, 90 148 C125 147, 155 153, 178 158 Z`,
  // Near left — shorter, curves down-left
  `M180 160 C165 162, 145 166, 120 165 C100 164, 80 168, 60 166
   L60 170 C80 172, 100 168, 120 169 C145 170, 165 166, 182 164 Z`,
  // Far right — sweeps to the right edge
  `M222 158 C240 156, 270 160, 305 158 C335 156, 365 162, 395 160
   L395 164 C365 166, 335 162, 305 164 C270 166, 240 162, 220 162 Z`,
  // Mid right — curves right-up
  `M224 154 C245 148, 275 142, 310 144 C340 146, 365 140, 390 142
   L390 146 C365 145, 340 150, 310 148 C275 147, 245 153, 222 158 Z`,
  // Near right — shorter
  `M220 160 C235 162, 255 166, 280 165 C300 164, 320 168, 340 166
   L340 170 C320 172, 300 168, 280 169 C255 170, 235 166, 218 164 Z`,
];

/** 5 major branches — thick tapered paths spreading UP and OUT
 *  from the crown. Wide enough to "hold the sky." */
const BRANCHES = [
  // Far left — sweeps to upper-left
  `M188 60 C175 50, 150 38, 120 28 C95 20, 65 14, 30 8
   L32 12 C66 18, 96 24, 122 32 C152 42, 176 54, 192 62 Z`,
  // Left — curves up-left
  `M192 56 C182 44, 165 30, 145 18 C128 8, 108 2, 85 0
   L87 4 C110 6, 130 12, 148 22 C168 34, 184 48, 196 58 Z`,
  // Center — rises straight up with slight lean
  `M196 56 C194 42, 196 28, 198 14 C199 8, 200 2, 202 0
   L206 0 C205 2, 204 8, 204 14 C206 28, 208 42, 208 56 Z`,
  // Right — curves up-right
  `M208 56 C218 44, 235 30, 255 18 C272 8, 292 2, 315 0
   L313 4 C290 6, 270 12, 252 22 C232 34, 216 48, 204 58 Z`,
  // Far right — sweeps to upper-right
  `M212 60 C225 50, 250 38, 280 28 C305 20, 335 14, 370 8
   L368 12 C334 18, 304 24, 278 32 C248 42, 224 54, 208 62 Z`,
];

/** Canopy — an organic shape that blooms OVER the branches in phase 3.
 *  Covers the branch structure like the Garden canopy covers its branches. */
const CANOPY = `
  M15 18 C18 12, 28 6, 42 4
  C55 2, 62 8, 75 5
  C88 2, 95 6, 108 4
  C118 2, 128 8, 142 6
  C155 4, 165 2, 178 4
  C188 6, 195 2, 205 4
  C215 6, 225 2, 238 4
  C250 6, 262 2, 278 5
  C292 8, 305 4, 318 6
  C330 8, 342 4, 358 6
  C372 8, 382 12, 388 18
  C394 28, 396 40, 390 50
  C384 58, 375 52, 365 56
  C355 60, 345 54, 335 58
  C322 62, 312 56, 300 60
  C288 64, 275 58, 262 62
  C248 66, 235 60, 222 64
  C210 66, 205 62, 198 64
  C188 66, 178 62, 165 64
  C152 66, 140 60, 128 64
  C115 68, 102 62, 88 66
  C75 68, 62 62, 48 64
  C35 66, 25 60, 18 56
  C10 50, 6 40, 8 28
  C10 22, 14 18, 15 18
  Z`;

/** Accent colors from every previous level — embedded as gems in the trunk */
const LEVEL_GEMS = [
  { y: 72,  color: "#6bbf6b" }, // Garden
  { y: 82,  color: "#e89a30" }, // Cottage
  { y: 92,  color: "#9090f8" }, // Stars
  { y: 102, color: "#50b8b8" }, // Well
  { y: 112, color: "#7aaa6a" }, // Bridge
  { y: 122, color: "#c088b0" }, // Library
  { y: 132, color: "#88a8c8" }, // Stones
  { y: 142, color: "#d0b870" }, // Sanctum
];

// ─── SCENE ─────────────────────────────────────────────────

function TreeScene({ progress: p }: SceneProps) {
  // Three-phase progress (3 prompts → each is 1/3)
  const rootPhase = sub(p, 0, 0.33);      // roots glow
  const branchPhase = sub(p, 0.33, 0.33); // branches glow
  const heartPhase = sub(p, 0.66, 0.34);  // heart awakens

  // Background — deep green-black, warming slightly
  const bgL = 4 + p * 4;
  const bgS = 10 + p * 15;

  // Wood color — dormant dark brown, brightening
  const woodL = 14 + p * 10;
  const woodS = 8 + p * 12;

  // Glow color — the tree's inner light
  const glowColor = `hsl(${120 + p * 15}, ${25 + p * 30}%, ${20 + p * 25}%)`;

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="heartGlow" radius={20} color="#b8c8a8" opacity={0.4} />

        {/* Background gradient — deep green, barely there */}
        <radialGradient id="treeBg" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={`hsl(130, ${bgS}%, ${bgL + 3}%)`} />
          <stop offset="100%" stopColor={`hsl(130, ${bgS - 5}%, ${bgL}%)`} />
        </radialGradient>

        {/* Heart radiance — expands from center trunk in phase 3 */}
        <radialGradient id="heartRadiance" cx="50%" cy="42%" r="45%">
          <stop offset="0%" stopColor="#b8c8a8" stopOpacity={heartPhase * 0.2} />
          <stop offset="40%" stopColor="#b8c8a8" stopOpacity={heartPhase * 0.08} />
          <stop offset="100%" stopColor="#b8c8a8" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── BACKGROUND — deep green-black ── */}
      <rect width="400" height="250" fill="url(#treeBg)" />

      {/* ── ROOTS — phase 1: glow outward from center ── */}
      {ROOTS.map((d, i) => {
        // Roots light up sequentially from center outward
        const rp = sub(rootPhase, i * 0.12, 0.35);
        return (
          <g key={`r${i}`}>
            {/* Root structure — always visible as dark shape */}
            <path d={d}
              fill={`hsl(30, ${woodS}%, ${woodL - 4}%)`}
              opacity={0.3 + rp * 0.5} />
            {/* Ley-line energy glow — appears in phase 1 */}
            {rp > 0 && (
              <path d={d}
                fill={glowColor}
                opacity={rp * 0.3} />
            )}
          </g>
        );
      })}

      {/* ── TRUNK — always visible, brightens with progress ── */}
      <path d={TRUNK}
        fill={`hsl(30, ${woodS}%, ${woodL}%)`}
        opacity={0.5 + p * 0.5} />

      {/* Bark detail lines */}
      <g opacity={0.15 + p * 0.2}>
        {BARK_LINES.map((d, i) => (
          <path key={i} d={d}
            fill="none"
            stroke={`hsl(30, ${woodS - 3}%, ${woodL + 6}%)`}
            strokeWidth="0.8"
            strokeLinecap="round" />
        ))}
      </g>

      {/* ── BRANCHES — phase 2: glow upward from crown ── */}
      {BRANCHES.map((d, i) => {
        const bp = sub(branchPhase, i * 0.1, 0.4);
        return (
          <g key={`b${i}`}>
            {/* Branch structure — dark until lit */}
            <path d={d}
              fill={`hsl(30, ${woodS}%, ${woodL - 2}%)`}
              opacity={0.2 + bp * 0.6} />
            {/* Branch glow — appears in phase 2 */}
            {bp > 0 && (
              <path d={d}
                fill={glowColor}
                opacity={bp * 0.25} />
            )}
          </g>
        );
      })}

      {/* ── CANOPY — phase 3: blooms OVER branches (covering layer) ── */}
      {heartPhase > 0 && (
        <path d={CANOPY}
          fill={`hsl(${120 + p * 15}, ${20 + heartPhase * 25}%, ${10 + heartPhase * 14}%)`}
          opacity={heartPhase * 0.65} />
      )}

      {/* ── HEART GLOW — radiance from the center trunk in phase 3 ── */}
      {heartPhase > 0 && (
        <>
          <rect width="400" height="250" fill="url(#heartRadiance)" />
          {/* Core glow point — the heart itself */}
          <ellipse cx="200" cy="108" rx={12 + heartPhase * 8} ry={15 + heartPhase * 10}
            fill="#b8c8a8" opacity={heartPhase * 0.15}
            filter="url(#heartGlow)" />
        </>
      )}

      {/* ── ENERGY FLOW — thin bright lines traveling along roots and trunk ── */}
      {rootPhase > 0.3 && (
        <g opacity={(rootPhase - 0.3) * 0.4}>
          {/* Energy up the trunk */}
          <line x1="195" y1="155" x2="195" y2={155 - rootPhase * 80}
            stroke="#b8c8a8" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <line x1="205" y1="155" x2="205" y2={155 - rootPhase * 85}
            stroke="#c8d8b8" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
        </g>
      )}

      {/* Energy through branches in phase 2 */}
      {branchPhase > 0.3 && (
        <g opacity={(branchPhase - 0.3) * 0.3}>
          <line x1="195" y1="58" x2={195 - branchPhase * 80} y2={58 - branchPhase * 30}
            stroke="#b8c8a8" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="205" y1="58" x2={205 + branchPhase * 80} y2={58 - branchPhase * 30}
            stroke="#b8c8a8" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="200" y1="56" x2="200" y2={56 - branchPhase * 40}
            stroke="#c8d8b8" strokeWidth="0.6" strokeLinecap="round" />
        </g>
      )}

      {/* ── ACCENT GEMS — one per restored level, embedded in trunk ── */}
      {heartPhase > 0.2 && (
        <g>
          {LEVEL_GEMS.map((gem, i) => {
            const gp = sub(heartPhase, 0.2 + i * 0.08, 0.12);
            if (gp <= 0) return null;
            const x = 200 + (i % 2 === 0 ? -8 : 8);
            return (
              <g key={i} opacity={gp * 0.7}>
                <circle cx={x} cy={gem.y} r={2.5 * gp}
                  fill={gem.color} opacity={0.6} />
                <circle cx={x} cy={gem.y} r={1 * gp}
                  fill="white" opacity={0.4} />
              </g>
            );
          })}
        </g>
      )}

      {/* ── LEAF SPARKS — tiny points of light on the canopy in phase 3 ── */}
      {heartPhase > 0.3 && Array.from({ length: 20 }).map((_, i) => {
        const lp = sub(heartPhase, 0.3 + i * 0.03, 0.1);
        if (lp <= 0) return null;
        // Distribute across canopy area
        const lx = 30 + (i * 47 + 13) % 340;
        const ly = 8 + (i * 23 + 7) % 52;
        return (
          <circle key={i} cx={lx} cy={ly} r={0.8 + (i % 3) * 0.3}
            fill="#d8e8c8" opacity={lp * 0.35} />
        );
      })}

      {/* ── BOTTOM FILL — ground beneath the roots ── */}
      <rect x="0" y="165" width="400" height="85"
        fill={`hsl(130, ${bgS - 3}%, ${bgL - 1}%)`} />
    </svg>
  );
}

export default memo(TreeScene);
