import { sub } from "./util";
import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";
import { useParticles } from "../hooks/useParticles";
import ParticleField from "../components/ParticleField";


// ─── HAND-CRAFTED SVG PATHS ────────────────────────────────

/** Oak trunk that SPLITS into two main limbs at the crown.
 *  One continuous shape — trunk widens, then forks left and right.
 *  This is the whole wood structure below the canopy. */
const TRUNK_AND_LIMBS = `
  M112 195
  C111 189, 110 183, 109 177
  C108 171, 107 166, 106 160
  C105 155, 104 150, 105 145
  C106 140, 106 135, 106 128
  C106 122, 105 116, 106 110
  C107 106, 110 102, 114 98
  C110 92, 100 82, 88 72
  C80 65, 72 58, 65 52
  L70 50
  C78 54, 86 62, 94 70
  C104 80, 112 90, 118 98
  C120 94, 124 86, 130 78
  C138 68, 148 60, 160 54
  C170 48, 180 46, 190 44
  L192 48
  C182 50, 172 54, 162 60
  C150 68, 140 76, 134 84
  C128 94, 133 102, 136 110
  C137 118, 137 124, 137 130
  C137 136, 138 142, 138 148
  C138 154, 138 160, 137 166
  C136 172, 135 178, 134 184
  C133 189, 132 192, 132 195
  Z`;

/** Secondary branches off the two main limbs — small forks */
const FORKS = [
  // off left limb, forks upward near top
  `M82 68 C76 60, 68 52, 60 46 L63 44 C70 50, 78 58, 86 66 Z`,
  // off right limb, forks upward
  `M155 58 C162 50, 170 44, 178 38 L180 42 C172 48, 164 54, 158 62 Z`,
  // off right limb, smaller fork downward
  `M164 56 C172 60, 182 60, 192 62 L192 65 C182 64, 172 64, 166 60 Z`,
];
const CANOPY = `
  M30 90
  C26 82, 30 74, 38 68
  C44 62, 38 54, 46 48
  C52 43, 48 36, 56 32
  C62 28, 58 22, 66 20
  C72 18, 78 24, 86 18
  C92 13, 98 20, 106 16
  C112 12, 118 22, 126 18
  C134 14, 140 24, 150 20
  C158 16, 164 26, 172 22
  C180 18, 186 28, 194 32
  C200 36, 196 42, 206 46
  C214 50, 210 58, 218 64
  C224 70, 226 78, 222 86
  C220 92, 214 86, 206 92
  C198 98, 190 88, 180 94
  C172 100, 162 90, 152 96
  C144 102, 136 92, 126 98
  C116 104, 108 92, 98 98
  C88 104, 78 94, 68 98
  C58 102, 50 92, 42 96
  C34 98, 28 92, 30 90
  Z`;

/** Roots — spreading from trunk base */
const ROOTS = [
  "M108 194 C98 197, 80 200, 60 199 C44 198, 26 201, 10 200",
  "M112 195 C104 199, 86 204, 66 206 C50 208, 32 207, 14 210",
  "M132 195 C144 199, 164 203, 186 205 C202 207, 222 206, 244 209",
  "M130 194 C140 197, 158 200, 180 199 C196 198, 214 201, 234 200",
];

/** Rolling terrain — hand-drawn contours */
const HILL_FAR = `
  M-10 182 C15 178, 38 170, 65 173 C85 175, 100 168, 128 166
  C150 164, 172 170, 198 168 C220 166, 242 162, 268 165
  C290 167, 312 173, 338 170 C358 168, 378 174, 410 172
  L410 250 L-10 250 Z`;

const HILL_MID = `
  M-10 192 C12 189, 36 183, 62 186 C82 188, 96 182, 122 180
  C142 178, 162 184, 190 182 C212 180, 234 186, 262 184
  C284 182, 306 178, 332 181 C352 183, 372 188, 410 186
  L410 250 L-10 250 Z`;

const GROUND = `
  M-10 200 C18 198, 44 194, 75 196 C100 198, 118 192, 148 194
  C172 196, 192 191, 220 193 C248 195, 268 190, 298 192
  C322 194, 344 198, 378 196 C398 195, 408 198, 420 200
  L420 250 L-10 250 Z`;

/** Grass tufts — organic hand-placed clumps */
const GRASS_TUFTS = [
  { x: 168, paths: [
    "M168 196 Q166 188 164 178", "M170 196 Q169 186 170 176",
    "M172 196 Q174 187 176 179", "M167 196 Q163 190 160 184",
  ]},
  { x: 255, paths: [
    "M255 194 Q253 186 250 177", "M257 194 Q257 184 258 175",
    "M259 194 Q262 186 264 178",
  ]},
  { x: 330, paths: [
    "M330 196 Q328 189 326 181", "M332 196 Q332 187 333 179",
    "M334 196 Q337 189 339 182",
  ]},
  { x: 50, paths: [
    "M50 198 Q48 191 46 183", "M52 198 Q52 189 53 181",
    "M54 198 Q56 191 58 184",
  ]},
  { x: 380, paths: [
    "M380 197 Q378 190 375 182", "M382 197 Q383 188 384 180",
  ]},
];

/** Small stones near tree base */
const STONES = [
  "M92 198 C90 196, 88 194, 86 195 C84 196, 83 198, 85 199 C87 200, 90 200, 92 198 Z",
  "M145 197 C148 195, 152 194, 154 196 C155 198, 153 200, 150 200 C147 200, 144 199, 145 197 Z",
  "M75 200 C74 198, 72 197, 70 198 C68 199, 69 201, 71 202 C73 202, 76 201, 75 200 Z",
];

// ─── SCENE COMPONENT ───────────────────────────────────────

const POLLEN_CONFIG = {
  count: 18,
  bounds: { x: 30, y: 40, width: 350, height: 140 },
  colors: ["#f0e870", "#e8d860", "#f0f088", "#d8c850"],
  sizeRange: [0.4, 1.0] as [number, number],
  speedRange: [2, 6] as [number, number],
  driftX: 1.5,
  driftY: -3,
  lifeRange: [4, 8] as [number, number],
};

function GardenScene({ progress: p }: SceneProps) {
  const pollenParticles = useParticles(POLLEN_CONFIG, p > 0.55);

  const skyH = 180 + p * 30;
  const skyS = 8 + p * 30;
  const skyL = 12 + p * 22;

  const groundS = 8 + p * 32;
  const groundL = 10 + p * 12;

  const trunkS = 6 + p * 14;
  const trunkL = 12 + p * 8;

  const canopyS = 5 + p * 35;
  const canopyL = 10 + p * 16;

  const sunY = 95 - p * 60;

  const rootGlow = sub(p, 0.05, 0.4);
  const canopyLife = sub(p, 0.1, 0.5);

  // Smaller, more delicate flowers with softer colors
  const flowers = [
    { x: 210, stemH: 28, color: "#d88090", size: 6, delay: 0.38 },
    { x: 238, stemH: 32, color: "#d8b060", size: 7, delay: 0.45 },
    { x: 270, stemH: 26, color: "#9878c0", size: 6, delay: 0.52 },
    { x: 300, stemH: 30, color: "#c890a8", size: 6, delay: 0.58 },
    { x: 332, stemH: 34, color: "#68b080", size: 7, delay: 0.66 },
    { x: 362, stemH: 24, color: "#c88060", size: 5, delay: 0.74 },
    { x: 185, stemH: 22, color: "#a0a0d0", size: 5, delay: 0.8 },
  ];

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="sunGlow" radius={18} color="#f5e060" opacity={0.35} />
        <GlowFilter id="rootGlow" radius={4} color="#6bbf6b" opacity={0.5} />

        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${skyH}, ${skyS}%, ${skyL + 10}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH - 20}, ${skyS + 5}%, ${skyL}%)`} />
        </linearGradient>

        <radialGradient id="sunRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5e060" stopOpacity={p * 0.45} />
          <stop offset="40%" stopColor="#f5d030" stopOpacity={p * 0.18} />
          <stop offset="100%" stopColor="#f5e060" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="250" fill="url(#skyGrad)" />

      {/* ── SUN ── */}
      <circle cx="345" cy={sunY} r={55} fill="url(#sunRadial)" />
      <circle cx="345" cy={sunY} r={16} fill="#f5d860" opacity={p * 0.85}
        filter={p > 0.3 ? "url(#sunGlow)" : undefined} />

      {/* ── CLOUDS — positioned to NOT overlap the tree ── */}
      {p > 0.35 && (
        <g opacity={sub(p, 0.35, 0.3) * 0.3}>
          <ellipse cx={295} cy={52} rx={28} ry={8} fill="white" />
          <ellipse cx={278} cy={48} rx={18} ry={6} fill="white" />
          <ellipse cx={312} cy={49} rx={20} ry={7} fill="white" />
        </g>
      )}

      {/* ── FAR HILL ── */}
      <path d={HILL_FAR}
        fill={`hsl(120, ${groundS - 4}%, ${groundL - 3}%)`}
        opacity={0.5 + p * 0.3} />

      {/* ── MID HILL ── */}
      <path d={HILL_MID}
        fill={`hsl(125, ${groundS - 2}%, ${groundL - 1}%)`}
        opacity={0.6 + p * 0.3} />

      {/* ── TREE ── */}

      {/* Trunk + limbs first — visible as bare wood */}
      <path d={TRUNK_AND_LIMBS}
        fill={`hsl(30, ${trunkS}%, ${trunkL}%)`} />

      {/* Small forks off the main limbs */}
      <g opacity={0.4 + p * 0.3}>
        {FORKS.map((d, i) => (
          <path key={`f${i}`} d={d}
            fill={`hsl(30, ${trunkS}%, ${trunkL + 4}%)`} />
        ))}
      </g>

      {/* Canopy — rendered ON TOP of branches, fading in with progress
          so you see bare branches early, then leaves fill in and cover them */}
      <path d={CANOPY}
        fill={`hsl(${110 + p * 15}, ${canopyS}%, ${canopyL}%)`}
        opacity={canopyLife * 0.85} />
      {/* Canopy highlight — lighter inner area for depth */}
      <path d={CANOPY}
        fill={`hsl(${115 + p * 10}, ${canopyS + 8}%, ${canopyL + 5}%)`}
        opacity={canopyLife * 0.25}
        transform="translate(4, 3) scale(0.85)"
        style={{ transformOrigin: "125px 60px" }} />

      {/* Roots */}
      <g opacity={0.3 + rootGlow * 0.7}>
        {ROOTS.map((d, i) => (
          <path key={i} d={d}
            fill="none"
            stroke={`hsl(30, ${trunkS + rootGlow * 10}%, ${trunkL + rootGlow * 5}%)`}
            strokeWidth={3.5 - i * 0.4}
            strokeLinecap="round" />
        ))}
      </g>
      {rootGlow > 0.3 && (
        <g opacity={(rootGlow - 0.3) * 0.5}>
          {ROOTS.map((d, i) => (
            <path key={i} d={d}
              fill="none" stroke="#6bbf6b" strokeWidth={1.5}
              strokeLinecap="round" filter="url(#rootGlow)" />
          ))}
        </g>
      )}

      {/* ── NEAR GROUND ── */}
      <path d={GROUND}
        fill={`hsl(120, ${groundS}%, ${groundL}%)`} />
      <rect x={0} y={200} width={400} height={50}
        fill={`hsl(30, ${10 + p * 8}%, ${10 + p * 6}%)`} />

      {/* Stones */}
      <g opacity={0.3 + p * 0.4}>
        {STONES.map((d, i) => (
          <path key={i} d={d}
            fill={`hsl(30, ${6 + p * 4}%, ${18 + p * 5}%)`} />
        ))}
      </g>

      {/* Grass tufts */}
      <g opacity={0.2 + p * 0.7}>
        {GRASS_TUFTS.map((tuft, ti) =>
          tuft.paths.map((d, pi) => (
            <path key={`${ti}-${pi}`} d={d}
              fill="none"
              stroke={`hsl(${115 + ti * 5}, ${20 + p * 25}%, ${15 + p * 15}%)`}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={sub(p, 0.05 + ti * 0.04, 0.3)} />
          ))
        )}
      </g>

      {/* ── FLOWERS — organic bezier petal shapes ── */}
      {flowers.map((f, i) => {
        const fp = sub(p, f.delay, 0.22);
        if (fp <= 0) return null;
        const baseY = 196 + (i % 2) * 2;
        const headY = baseY - f.stemH * fp;
        const ps = f.size * fp;
        const petalCount = 4 + (i % 2); // 4 or 5 petals
        return (
          <g key={i} opacity={fp}>
            {/* Stem — slight curve */}
            <path
              d={`M${f.x} ${baseY} C${f.x + 1 + (i % 3)} ${(baseY + headY) / 2}, ${f.x - 1 + (i % 2)} ${headY + 8} ${f.x} ${headY}`}
              fill="none" stroke={`hsl(120, ${20 + p * 15}%, ${18 + p * 10}%)`} strokeWidth={1.2} strokeLinecap="round" />
            {/* Petals — teardrop bezier shapes */}
            {Array.from({ length: petalCount }).map((_, j) => {
              const ang = (j * 360 / petalCount + i * 15) * Math.PI / 180;
              const petalLen = ps * (0.8 + (j % 2) * 0.3); // vary petal sizes
              const tipX = f.x + Math.cos(ang) * petalLen;
              const tipY = headY + Math.sin(ang) * petalLen;
              const cpOff = ps * 0.4;
              const perpAng = ang + Math.PI / 2;
              return (
                <path key={j}
                  d={`M${f.x} ${headY}
                      C${f.x + Math.cos(perpAng) * cpOff} ${headY + Math.sin(perpAng) * cpOff},
                       ${tipX + Math.cos(perpAng) * cpOff * 0.3} ${tipY + Math.sin(perpAng) * cpOff * 0.3},
                       ${tipX} ${tipY}
                      C${tipX - Math.cos(perpAng) * cpOff * 0.3} ${tipY - Math.sin(perpAng) * cpOff * 0.3},
                       ${f.x - Math.cos(perpAng) * cpOff} ${headY - Math.sin(perpAng) * cpOff},
                       ${f.x} ${headY}`}
                  fill={f.color} opacity={0.75} />
              );
            })}
            {/* Center — small dot */}
            <circle cx={f.x} cy={headY} r={ps * 0.2} fill="#e8d060" opacity={0.9} />
          </g>
        );
      })}

      {/* ── POLLEN — physics-based drifting particles ── */}
      {p > 0.55 && <ParticleField particles={pollenParticles} opacity={0.25} />}
    </svg>
  );
}

export default memo(GardenScene);
