import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── HAND-CRAFTED SVG PATHS ────────────────────────────────

/** Oak trunk — slight leftward lean, subtle burl, NOT a potato */
const TRUNK = `
  M112 195
  C111 189, 110 183, 109 177
  C108 171, 107 166, 106 160
  C105 154, 103 150, 104 145
  C105 140, 106 136, 106 130
  C106 124, 105 118, 106 112
  C107 108, 110 104, 114 101
  L130 101
  C133 104, 135 108, 136 112
  C137 118, 137 124, 137 130
  C137 136, 138 142, 138 148
  C138 154, 139 160, 138 166
  C137 172, 136 178, 135 184
  C134 189, 133 192, 132 195
  Z`;

/** Canopy — irregular, with deep indentations and asymmetry */
const CANOPY = `
  M32 88
  C28 80, 32 72, 40 66
  C46 62, 42 55, 50 50
  C55 46, 62 44, 68 40
  C74 37, 70 32, 78 28
  C84 25, 80 20, 90 18
  C98 16, 104 22, 112 19
  C120 16, 126 20, 134 17
  C142 15, 148 20, 156 22
  C162 24, 158 18, 168 22
  C176 25, 182 30, 188 34
  C194 38, 198 44, 204 48
  C210 53, 216 60, 218 68
  C220 74, 222 82, 218 88
  C215 93, 208 90, 200 94
  C192 98, 186 92, 176 96
  C168 100, 158 94, 148 98
  C138 102, 128 95, 118 100
  C108 104, 98 97, 88 100
  C80 102, 70 95, 60 98
  C50 100, 42 95, 36 92
  C32 90, 30 88, 32 88
  Z`;

/** 3 major limbs — clean tapered curves flowing from trunk into canopy.
 *  A real oak splits: trunk to 2-3 main limbs, canopy fills the rest. */
const LIMBS = [
  // Left limb — curves gracefully left and upward from mid-trunk
  `M108 130
   C102 120, 90 105, 75 90
   C65 80, 55 72, 48 62
   L52 60
   C58 68, 68 78, 78 88
   C92 102, 106 118, 114 134 Z`,
  // Center limb — rises straight up from the trunk crown
  `M116 104
   C115 90, 118 74, 120 58
   C121 48, 122 40, 124 34
   L128 35
   C127 42, 126 50, 126 60
   C125 76, 128 92, 130 106 Z`,
  // Right limb — curves right and slightly upward
  `M132 115
   C140 108, 155 98, 172 90
   C185 84, 196 80, 206 76
   L207 80
   C198 84, 187 88, 174 94
   C158 102, 144 112, 136 120 Z`,
];

/** A few secondary forks — just 3, clean and short */
const FORKS = [
  // off left limb, a short upward fork
  `M72 88 C66 80, 58 72, 52 66 L55 68 C60 74, 68 82, 76 92 Z`,
  // off center limb, a fork to the left
  `M120 62 C112 56, 104 52, 96 48 L98 50 C106 54, 114 60, 124 66 Z`,
  // off right limb, a fork upward
  `M174 90 C180 82, 188 76, 194 68 L196 71 C190 78, 182 86, 178 94 Z`,
];


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

function GardenScene({ progress: p }: SceneProps) {
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
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
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

      {/* Canopy — transitions from grey to green */}
      <path d={CANOPY}
        fill={`hsl(${110 + p * 15}, ${canopyS}%, ${canopyL}%)`}
        opacity={0.3 + canopyLife * 0.6} />
      {/* Canopy highlight — lighter inner area */}
      <path d={CANOPY}
        fill={`hsl(${115 + p * 10}, ${canopyS + 8}%, ${canopyL + 5}%)`}
        opacity={canopyLife * 0.2}
        transform="translate(4, 3) scale(0.85)"
        style={{ transformOrigin: "125px 60px" }} />

      {/* Limbs — 3 clean major limbs + 3 secondary forks */}
      <g opacity={0.4 + p * 0.3}>
        {LIMBS.map((d, i) => (
          <path key={i} d={d}
            fill={`hsl(30, ${trunkS}%, ${trunkL + 3}%)`} />
        ))}
        {FORKS.map((d, i) => (
          <path key={`f${i}`} d={d}
            fill={`hsl(30, ${trunkS}%, ${trunkL + 5}%)`} />
        ))}
      </g>

      {/* Trunk */}
      <path d={TRUNK}
        fill={`hsl(30, ${trunkS}%, ${trunkL}%)`} />

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

      {/* ── WILDFLOWERS — simple, delicate: stem + small color blob ── */}
      {flowers.map((f, i) => {
        const fp = sub(p, f.delay, 0.25);
        if (fp <= 0) return null;
        const baseY = 196 + (i % 2) * 2;
        const headY = baseY - f.stemH * fp;
        return (
          <g key={i} opacity={fp * 0.9}>
            {/* Stem */}
            <path
              d={`M${f.x} ${baseY} Q${f.x + 1.5} ${(baseY + headY) / 2} ${f.x - 0.5} ${headY}`}
              fill="none" stroke={`hsl(120, ${20 + p * 15}%, ${18 + p * 10}%)`} strokeWidth={1.2} />
            {/* Bloom — a soft small circle, not individual petals */}
            <circle cx={f.x} cy={headY} r={f.size * 0.5 * fp} fill={f.color} opacity={0.8} />
            <circle cx={f.x} cy={headY} r={f.size * 0.2 * fp} fill="#f0e880" opacity={0.7} />
          </g>
        );
      })}

      {/* ── POLLEN MOTES — subtle ── */}
      {p > 0.6 && Array.from({ length: 16 }).map((_, i) => {
        const mx = 40 + (i * 53 + 17) % 340;
        const my = 50 + (i * 37 + 11) % 130;
        const mp = sub(p, 0.6 + i * 0.02, 0.15);
        const drift = Math.sin(p * Math.PI * 3 + i * 1.2) * 4;
        return mp > 0 ? (
          <circle key={i} cx={mx + drift} cy={my - mp * 8}
            r={0.7 + (i % 3) * 0.2}
            fill="#f0e870" opacity={mp * 0.2} />
        ) : null;
      })}
    </svg>
  );
}

export default memo(GardenScene);
