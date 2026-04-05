import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

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
  // Water rises from bottom of cavern to well opening
  const waterLevel = 208 - p * 88;

  // Bucket lowers
  const bucketY = 48 + p * 52;

  // Colors shift dormant → alive
  const skyL = 10 + p * 14;
  const stoneL = 8 + p * 6;       // brighter stones for contrast
  const waterS = 25 + p * 8;      // muted water — cave water, not a pool
  const waterL = 6 + p * 6;       // very dark — it's deep underground water

  // Wall rune positions — on the stone near the water
  const wallRunes = [
    { x: 145, y: 162, delay: 0.42 },
    { x: 255, y: 158, delay: 0.46 },
    { x: 142, y: 180, delay: 0.50 },
    { x: 258, y: 175, delay: 0.54 },
    { x: 148, y: 196, delay: 0.58 },
    { x: 252, y: 192, delay: 0.62 },
  ];

  // Flowing runes — carried downstream by the water
  const flowRunes = [
    { sx: 200, sy: 165, ex: 70,  ey: 180, delay: 0.65 },
    { sx: 200, sy: 170, ex: 330, ey: 185, delay: 0.70 },
    { sx: 200, sy: 160, ex: 40,  ey: 175, delay: 0.76 },
    { sx: 200, sy: 175, ex: 360, ey: 190, delay: 0.82 },
    { sx: 200, sy: 168, ex: 15,  ey: 195, delay: 0.88 },
    { sx: 200, sy: 172, ex: 385, ey: 188, delay: 0.93 },
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

      {/* ── RIVER FLOWING LEFT AND RIGHT beyond cavern ── */}
      {p > 0.25 && (
        <g opacity={sub(p, 0.25, 0.4)}>
          <rect x="0" y={196 - p * 14} width="140" height={14 + p * 12}
            fill={`hsl(185, ${waterS - 10}%, ${waterL - 2}%)`}
            opacity={0.15 + p * 0.15} />
          <rect x="260" y={196 - p * 14} width="140" height={14 + p * 12}
            fill={`hsl(185, ${waterS - 10}%, ${waterL - 2}%)`}
            opacity={0.15 + p * 0.15} />
        </g>
      )}

      {/* ── WATER RISING in central cavern ── */}
      {p > 0.04 && (
        <>
          <rect x="140" y={waterLevel} width="120" height={210 - waterLevel}
            fill="url(#waterGrad)" opacity={0.35 + p * 0.2} />
          {/* Softer surface — gradient fade at the top edge */}
          <rect x="140" y={waterLevel - 4} width="120" height="8"
            fill={`hsl(185, ${waterS}%, ${waterL + 4}%)`}
            opacity={(0.3 + p * 0.2) * 0.5} />
          {/* Surface shimmer */}
          <ellipse cx="200" cy={waterLevel + 1} rx={40 * Math.min(1, p * 2)} ry="1"
            fill="white" opacity={p * 0.08} />
        </>
      )}

      {/* ── RUNES ON CAVERN WALLS — glow when water reaches them ── */}
      {wallRunes.map((r, i) => {
        const rp = sub(p, r.delay, 0.12);
        const wet = waterLevel < r.y;
        if (!wet || rp <= 0) return null;
        return (
          <g key={i} opacity={rp * 0.7} filter="url(#runeGlow)">
            <path d={`M${r.x - 3} ${r.y - 4} L${r.x} ${r.y + 4} L${r.x + 3} ${r.y - 4}`}
              fill="none" stroke="#50b8b8" strokeWidth="1" strokeLinecap="round" />
          </g>
        );
      })}

      {/* ── RUNES FLOWING DOWNSTREAM — "carry the old songs home" ── */}
      {flowRunes.map((r, i) => {
        const fp = sub(p, r.delay, 0.12);
        if (fp <= 0) return null;
        const cx = r.sx + (r.ex - r.sx) * fp;
        const cy = r.sy + (r.ey - r.sy) * fp;
        return (
          <g key={`f${i}`} opacity={(1 - fp * 0.8) * 0.5} filter="url(#runeGlow)">
            <path d={`M${cx - 2} ${cy - 3} L${cx + 2} ${cy + 3} M${cx + 2} ${cy - 2} L${cx - 2} ${cy + 2}`}
              fill="none" stroke="#50b8b8" strokeWidth="0.8" strokeLinecap="round" />
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
