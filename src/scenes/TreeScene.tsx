import { sub } from "./util";
import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";
import { useParticles, ParticleField } from "../hooks/useParticles";


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
  M170 160
  C168 154, 166 148, 167 142
  C168 136, 164 132, 166 126
  C167 120, 164 116, 166 110
  C168 104, 165 98, 168 92
  C170 86, 173 80, 176 74
  C179 68, 183 62, 188 58
  L212 58
  C217 62, 221 68, 224 74
  C227 80, 230 86, 232 92
  C235 98, 232 104, 234 110
  C236 116, 233 120, 234 126
  C236 132, 232 136, 233 142
  C234 148, 232 154, 230 160
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

/** 8 major roots — thick brown paths spreading DIAGONALLY outward.
 *  Some snake behind the text box and emerge in corners. */
const ROOTS = [
  // Far left — sweeps diagonally to lower-left corner
  `M178 158 C155 158, 120 165, 80 175
   C50 185, 25 200, 5 220
   L0 225 L0 218 C20 198, 45 182, 75 172
   C115 162, 150 156, 180 162 Z`,
  // Mid left — curves to mid-left
  `M176 154 C155 148, 125 145, 90 148
   C60 152, 35 155, 10 152
   L10 156 C35 159, 60 156, 90 152
   C125 149, 155 153, 178 158 Z`,
  // Near left — diagonal down-left
  `M180 160 C160 165, 130 178, 95 192
   C65 205, 40 218, 20 235
   L15 240 L10 235 C30 216, 55 202, 88 188
   C125 175, 158 164, 182 164 Z`,
  // Center-left short root
  `M185 160 C175 165, 155 172, 140 170
   C130 168, 120 172, 115 170
   L115 174 C120 176, 130 172, 140 174
   C155 176, 175 169, 187 164 Z`,
  // Far right — sweeps diagonally to lower-right corner
  `M222 158 C245 158, 280 165, 320 175
   C350 185, 375 200, 395 220
   L400 225 L400 218 C380 198, 355 182, 325 172
   C285 162, 250 156, 220 162 Z`,
  // Mid right — curves to mid-right
  `M224 154 C245 148, 275 145, 310 148
   C340 152, 365 155, 390 152
   L390 156 C365 159, 340 156, 310 152
   C275 149, 245 153, 222 158 Z`,
  // Near right — diagonal down-right
  `M220 160 C240 165, 270 178, 305 192
   C335 205, 360 218, 380 235
   L385 240 L390 235 C370 216, 345 202, 312 188
   C275 175, 242 164, 218 164 Z`,
  // Center-right short root
  `M215 160 C225 165, 245 172, 260 170
   C270 168, 280 172, 285 170
   L285 174 C280 176, 270 172, 260 174
   C245 176, 225 169, 213 164 Z`,
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

const LEAF_SPARK_CONFIG = {
  count: 30,
  bounds: { x: 20, y: 2, width: 360, height: 60 },
  colors: ["#d8e8c8", "#c8d8b8", "#e0f0d0", "#b8c8a8"],
  sizeRange: [0.3, 1.0] as [number, number],
  speedRange: [2, 5] as [number, number],
  driftX: 0.5,
  driftY: -2,
  lifeRange: [3, 6] as [number, number],
};

function TreeScene({ progress: p }: SceneProps) {
  const heartPhaseForParticles = p > 0.75;
  const leafParticles = useParticles(LEAF_SPARK_CONFIG, heartPhaseForParticles);
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

      {/* ── ROOTS — phase 1: brown with green glow outlines ── */}
      {ROOTS.map((d, i) => {
        const rp = sub(rootPhase, i * 0.08, 0.3);
        return (
          <g key={`r${i}`}>
            {/* Green glow outline — appears first as ley energy */}
            {rp > 0 && (
              <path d={d}
                fill="none"
                stroke={glowColor}
                strokeWidth={3}
                opacity={rp * 0.35} />
            )}
            {/* Root body — brown wood */}
            <path d={d}
              fill={`hsl(28, ${woodS + 5}%, ${woodL - 2}%)`}
              opacity={0.3 + rp * 0.6} />
          </g>
        );
      })}

      {/* ── TRUNK — always visible, brightens with progress ── */}
      <path d={TRUNK}
        fill={`hsl(30, ${woodS}%, ${woodL}%)`}
        opacity={0.5 + p * 0.5} />

      {/* Bark detail lines — thicker for organic feel */}
      <g opacity={0.2 + p * 0.25}>
        {BARK_LINES.map((d, i) => (
          <path key={i} d={d}
            fill="none"
            stroke={`hsl(25, ${woodS}%, ${woodL + 5}%)`}
            strokeWidth={i < 5 ? "1.5" : "1"}
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
        <>
          <path d={CANOPY}
            fill={`hsl(${120 + p * 15}, ${20 + heartPhase * 30}%, ${10 + heartPhase * 16}%)`}
            opacity={heartPhase * 0.88} />
          {/* Leaf texture — tiny dots across canopy for organic feel */}
          {heartPhase > 0.3 && Array.from({ length: 25 }).map((_, i) => {
            const lx = 25 + (i * 37 + 11) % 360;
            const ly = 6 + (i * 23 + 5) % 55;
            return (
              <circle key={`lf${i}`} cx={lx} cy={ly}
                r={0.6 + (i % 3) * 0.3}
                fill={`hsl(${125 + (i % 4) * 5}, ${30 + heartPhase * 20}%, ${18 + heartPhase * 12}%)`}
                opacity={sub(heartPhase, 0.3 + (i % 5) * 0.1, 0.2) * 0.4} />
            );
          })}
        </>
      )}

      {/* ── HEART GLOW — radiance from the center trunk in phase 3 ── */}
      {heartPhase > 0 && (
        <>
          <rect width="400" height="250" fill="url(#heartRadiance)" />
          {/* Core glow point — the heart itself */}
          <ellipse cx="200" cy="108" rx={14 + heartPhase * 12} ry={18 + heartPhase * 14}
            fill="#b8c8a8" opacity={heartPhase * 0.22}
            filter="url(#heartGlow)" />
          {/* Bright inner core */}
          <ellipse cx="200" cy="108" rx={6 + heartPhase * 4} ry={8 + heartPhase * 5}
            fill="#d8e8c8" opacity={heartPhase * 0.15} />
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

      {/* ── LEAF SPARKS — physics-based particles in the canopy ── */}
      {heartPhaseForParticles && <ParticleField particles={leafParticles} opacity={0.4} />}

      {/* ── BOTTOM GRADIENT — fades to dark below roots, allows
           roots to peek through behind the text overlay ── */}
      <rect x="0" y="168" width="400" height="82"
        fill={`hsl(130, ${bgS - 3}%, ${bgL - 1}%)`}
        opacity={0.6} />
    </svg>
  );
}

export default memo(TreeScene);
