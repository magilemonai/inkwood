import { sub } from "./util";
import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";


// ─── CROSS-SECTION VIEW ────────────────────────────────────
// Top half: sky + well structure sitting on ground
// Bottom half: underground earth cut away, showing a dry river
// channel that fills with water as the player types.

/** Ground surface — the earth's skin, where the cross-section begins */
const GROUND_SURFACE = `
  M0 105 C30 103, 60 106, 100 104 C140 102, 170 105, 200 103
  C230 101, 260 104, 300 103 C340 102, 370 105, 400 104 L400 112 L0 112 Z`;

/** Underground cavern walls — the river channel carved through stone */
const CAVERN_LEFT = `
  M0 135 C15 133, 30 137, 50 135 C70 133, 90 140, 110 142
  C125 144, 133 150, 138 158 C142 165, 140 175, 140 185
  L140 210 L0 210 Z`;

const CAVERN_RIGHT = `
  M400 135 C385 133, 370 137, 350 135 C330 133, 310 140, 290 142
  C275 144, 267 150, 262 158 C258 165, 260 175, 260 185
  L260 210 L400 210 Z`;

// ─── SCENE ─────────────────────────────────────────────────

function WellScene({ progress: p }: SceneProps) {
  // Water rises with an eased curve so it doesn't snap up during
  // the second prompt — feels held, not extruded.
  const easedP = 1 - (1 - p) * (1 - p);
  const waterLevel = 208 - easedP * 88;

  // Bucket lowers
  const bucketY = 48 + p * 52;

  // Colors shift dormant → alive
  const skyL = 10 + p * 14;
  const stoneL = 8 + p * 6;       // brighter stones for contrast
  const waterS = 25 + p * 8;      // muted water — cave water, not a pool
  const waterL = 6 + p * 6;       // very dark — it's deep underground water

  // Wall rune positions — runes now activate IN PLACE on the well
  // stones rather than flowing downstream. The prompt "carry the old
  // songs home" reads as "remembered by the stones," not as literal
  // rune-projectiles on the river current.
  const wallRunes = [
    // Near the central shaft (where water rises first)
    { x: 178, y: 162, delay: 0.30 },
    { x: 222, y: 158, delay: 0.34 },
    { x: 182, y: 178, delay: 0.40 },
    { x: 218, y: 174, delay: 0.44 },
    // Cavern-wall runes — light up when water reaches them
    { x: 145, y: 168, delay: 0.52 },
    { x: 255, y: 164, delay: 0.56 },
    { x: 148, y: 184, delay: 0.62 },
    { x: 252, y: 180, delay: 0.66 },
    { x: 152, y: 196, delay: 0.72 },
    { x: 248, y: 192, delay: 0.76 },
  ];

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="runeGlow" radius={4} color="#50b8b8" opacity={0.6} />
        <GlowFilter id="waterGlow" radius={6} color="#50b8b8" opacity={0.3} />

        <linearGradient id="wellSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(210, 15%, ${skyL + 6}%)`} />
          <stop offset="100%" stopColor={`hsl(200, 12%, ${skyL}%)`} />
        </linearGradient>

        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(185, ${waterS}%, ${waterL + 6}%)`} />
          <stop offset="100%" stopColor={`hsl(185, ${waterS - 8}%, ${waterL - 2}%)`} />
        </linearGradient>
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="112" fill="url(#wellSky)" />

      {/* ── GROUND SURFACE — the cut line ── */}
      <path d={GROUND_SURFACE}
        fill={`hsl(120, ${8 + p * 15}%, ${10 + p * 8}%)`} />

      {/* Grass on surface */}
      {[25, 70, 130, 270, 330, 375].map((x, i) => (
        <g key={i} opacity={0.3 + p * 0.5}>
          <path d={`M${x} 105 Q${x - 2} ${97 + i % 3} ${x - 3} ${93 + i % 3}`}
            fill="none" stroke={`hsl(120, ${15 + p * 18}%, ${14 + p * 10}%)`}
            strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${x + 4} 105 Q${x + 5} ${95 + i % 2} ${x + 3} ${91 + i % 3}`}
            fill="none" stroke={`hsl(120, ${12 + p * 16}%, ${12 + p * 8}%)`}
            strokeWidth="1" strokeLinecap="round" />
        </g>
      ))}

      {/* ── UNDERGROUND EARTH ── */}
      <rect x="0" y="112" width="400" height="138"
        fill={`hsl(25, ${6 + p * 3}%, ${stoneL}%)`} />

      {/* ── CAVERN WALLS — stone edges of the river channel ── */}
      <path d={CAVERN_LEFT}
        fill={`hsl(25, ${8 + p * 4}%, ${stoneL + 3}%)`} />
      <path d={CAVERN_RIGHT}
        fill={`hsl(25, ${8 + p * 4}%, ${stoneL + 3}%)`} />

      {/* Stone texture — subtle horizontal lines */}
      {[125, 140, 155, 170, 185, 200].map((y, i) => (
        <g key={i} opacity="0.2">
          <line x1={0} y1={y + i * 0.5} x2={138 - i * 2} y2={y + 3}
            stroke={`hsl(25, 4%, ${stoneL + 5}%)`} strokeWidth="0.4" />
          <line x1={262 + i * 2} y1={y + i * 0.5} x2={400} y2={y + 3}
            stroke={`hsl(25, 4%, ${stoneL + 5}%)`} strokeWidth="0.4" />
        </g>
      ))}

      {/* ── UNDERGROUND RIVER — contained column + dim side channels ──
           The central water column is narrowed to x=175-225 (the width
           of the actual well shaft above) so water reads as held in the
           stone throat, not as a rectangle extruding upward. The side
           channels still fill but sit in shadow at half intensity. */}
      {p > 0.04 && (() => {
        const waterOp = 0.35 + p * 0.2;
        const riverLevel = waterLevel + 8;
        const shaftL = 175;
        const shaftR = 225;
        return (
          <>
            {/* Left river channel — darker, holds the ambient flow */}
            <rect x="0" y={Math.max(riverLevel, 185)} width="140" height={210 - Math.max(riverLevel, 185)}
              fill={`hsl(185, ${waterS - 8}%, ${waterL - 1}%)`}
              opacity={waterOp * 0.55} />
            {/* Left shoulder between cavern wall and shaft — mid-dim */}
            <rect x="140" y={Math.max(waterLevel, riverLevel - 4)} width={shaftL - 140}
              height={210 - Math.max(waterLevel, riverLevel - 4)}
              fill={`hsl(185, ${waterS - 6}%, ${waterL}%)`}
              opacity={waterOp * 0.7} />
            {/* Central shaft — narrow, bright, the held column */}
            <rect x={shaftL} y={waterLevel} width={shaftR - shaftL} height={210 - waterLevel}
              fill="url(#waterGrad)" opacity={waterOp} />
            {/* Inner shadow on shaft walls — subtle darker edges so the
                 column reads as contained by stone, not free-floating. */}
            <rect x={shaftL} y={waterLevel} width={3} height={210 - waterLevel}
              fill={`hsl(185, ${waterS - 10}%, ${Math.max(2, waterL - 3)}%)`}
              opacity={waterOp * 0.6} />
            <rect x={shaftR - 3} y={waterLevel} width={3} height={210 - waterLevel}
              fill={`hsl(185, ${waterS - 10}%, ${Math.max(2, waterL - 3)}%)`}
              opacity={waterOp * 0.6} />
            {/* Right shoulder */}
            <rect x={shaftR} y={Math.max(waterLevel, riverLevel - 4)} width={260 - shaftR}
              height={210 - Math.max(waterLevel, riverLevel - 4)}
              fill={`hsl(185, ${waterS - 6}%, ${waterL}%)`}
              opacity={waterOp * 0.7} />
            {/* Right river channel */}
            <rect x="260" y={Math.max(riverLevel, 185)} width="140" height={210 - Math.max(riverLevel, 185)}
              fill={`hsl(185, ${waterS - 8}%, ${waterL - 1}%)`}
              opacity={waterOp * 0.55} />
            {/* Meniscus on the shaft — narrow, aligned with shaft */}
            <ellipse cx="200" cy={waterLevel + 0.5}
              rx={(shaftR - shaftL) / 2 * Math.min(1, p * 2)} ry="1.2"
              fill="white" opacity={p * 0.1} />
            {/* Side channel surfaces — barely there */}
            <line x1="0" y1={Math.max(riverLevel, 185) + 1} x2="140" y2={Math.max(riverLevel, 185) + 1}
              stroke="white" strokeWidth="0.4" opacity={p * 0.03} />
            <line x1="260" y1={Math.max(riverLevel, 185) + 1} x2="400" y2={Math.max(riverLevel, 185) + 1}
              stroke="white" strokeWidth="0.4" opacity={p * 0.03} />
          </>
        );
      })()}

      {/* ── RUNES ON WELL & CAVERN STONES — glow IN PLACE when water
           reaches them. No more downstream sweep; the old songs are
           "carried home" by the stones remembering, not by projectile
           runes on the current. Each rune uses a slightly different
           glyph and pulses subtly once lit. */}
      {wallRunes.map((r, i) => {
        const rp = sub(p, r.delay, 0.18);
        const wet = waterLevel < r.y + 2;
        if (!wet || rp <= 0) return null;
        const pulse = 0.8 + 0.2 * Math.sin(p * Math.PI * 6 + i * 1.3);
        // Alternate glyph shapes for visual variety
        const glyph = i % 3 === 0
          ? `M${r.x - 3} ${r.y - 3} L${r.x} ${r.y + 3} L${r.x + 3} ${r.y - 3}`
          : i % 3 === 1
            ? `M${r.x - 3} ${r.y} L${r.x + 3} ${r.y} M${r.x} ${r.y - 3} L${r.x} ${r.y + 3}`
            : `M${r.x - 3} ${r.y - 2} Q${r.x} ${r.y - 4} ${r.x + 3} ${r.y - 2} Q${r.x} ${r.y + 3} ${r.x - 3} ${r.y - 2} Z`;
        return (
          <g key={i} opacity={rp * 0.75 * pulse} filter="url(#runeGlow)">
            <path d={glyph}
              fill="none" stroke="#50b8b8" strokeWidth="1" strokeLinecap="round" />
          </g>
        );
      })}

      {/* ── WELL STRUCTURE — sitting on the ground surface ── */}

      {/* Well shaft walls going underground */}
      <rect x="175" y="68" width="8" height="44"
        fill={`hsl(25, ${10 + p * 5}%, ${14 + p * 6}%)`} />
      <rect x="217" y="68" width="8" height="44"
        fill={`hsl(25, ${10 + p * 5}%, ${14 + p * 6}%)`} />

      {/* Well rim — stone cap */}
      <path d="M168 65 L232 65 L232 72 Q200 74 168 72 Z"
        fill={`hsl(25, ${10 + p * 5}%, ${16 + p * 6}%)`} />

      {/* Support posts */}
      <rect x="174" y="38" width="4" height="28"
        fill={`hsl(30, ${12 + p * 6}%, ${16 + p * 6}%)`} />
      <rect x="222" y="38" width="4" height="28"
        fill={`hsl(30, ${12 + p * 6}%, ${16 + p * 6}%)`} />

      {/* Roof — simple peaked shape */}
      <path d="M170 40 L200 26 L230 40 Z"
        fill={`hsl(25, ${10 + p * 5}%, ${13 + p * 5}%)`} />

      {/* Rope */}
      <line x1="200" y1="40" x2="200" y2={bucketY}
        stroke={`hsl(40, ${10 + p * 8}%, ${20 + p * 8}%)`}
        strokeWidth="1" />

      {/* Bucket */}
      <path d={`M194 ${bucketY} L196 ${bucketY + 8} L204 ${bucketY + 8} L206 ${bucketY} Z`}
        fill={`hsl(30, ${12 + p * 8}%, ${16 + p * 8}%)`} />

      {/* ── BOTTOM FILL ── */}
      <rect x="0" y="210" width="400" height="40"
        fill={`hsl(25, ${5 + p * 3}%, ${6 + p * 2}%)`} />

      {/* ── SUBTLE PARTICLES ── */}
      {p > 0.3 && Array.from({ length: 10 }).map((_, i) => {
        const mx = 155 + (i * 19) % 90;
        const my = 130 + (i * 23) % 60;
        const mp = sub(p, 0.3 + i * 0.05, 0.12);
        return mp > 0 ? (
          <circle key={i} cx={mx} cy={my} r={0.5}
            fill="#50b8b8" opacity={mp * 0.12} />
        ) : null;
      })}
    </svg>
  );
}

export default memo(WellScene);
