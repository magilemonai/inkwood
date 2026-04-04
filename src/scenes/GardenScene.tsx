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

/** Branches — emerge at DIFFERENT HEIGHTS on the trunk, not all from one point */
const BRANCHES = [
  // lowest left branch — forks from trunk at y:135, sweeps left
  `M106 136
   C98 130, 86 124, 72 118 C64 115, 56 114, 50 112
   L51 115
   C58 116, 66 118, 74 122 C88 128, 100 134, 110 140 Z`,
  // mid-left — from y:118, curves up-left
  `M106 118
   C98 110, 86 100, 76 90 C70 84, 64 80, 60 76
   L63 78
   C66 82, 72 86, 80 94 C90 104, 100 112, 110 122 Z`,
  // upper-left — from y:108, reaches toward top-left canopy
  `M110 108
   C104 98, 92 86, 82 76 C76 70, 70 64, 64 58
   L67 60
   C72 66, 78 72, 86 80 C96 90, 106 100, 114 112 Z`,
  // upper-right — from y:106, curves up-right
  `M130 106
   C136 96, 146 84, 156 74 C162 68, 168 64, 174 58
   L176 61
   C170 66, 164 72, 158 78 C148 88, 138 98, 134 110 Z`,
  // right — from y:120, sweeps right
  `M137 120
   C146 114, 160 108, 176 104 C188 100, 196 98, 204 96
   L204 99
   C197 101, 190 103, 178 108 C162 112, 148 118, 140 124 Z`,
];

/** Sub-branches — forking off mains, inside canopy */
const SUB_BRANCHES = [
  // off lowest-left, forks down
  `M68 120 C62 122, 55 120, 48 122 L49 124 C56 123, 64 124, 72 124 Z`,
  // off mid-left, forks left
  `M80 92 C74 86, 66 82, 58 78 L60 80 C67 84, 76 90, 84 96 Z`,
  // off upper-left, forks up
  `M84 78 C78 72, 70 66, 64 62 L66 64 C72 68, 80 74, 88 82 Z`,
  // off upper-right, forks right
  `M158 72 C164 66, 172 62, 178 56 L180 59 C174 64, 166 70, 162 76 Z`,
  // off right branch, forks up
  `M180 104 C186 96, 194 92, 200 86 L202 89 C196 94, 188 100, 184 108 Z`,
];

/** Fine twigs — very short */
const TWIGS = [
  "M48 122 C44 120, 40 120, 36 118",
  "M58 78 C54 74, 48 72, 44 70",
  "M64 62 C58 56, 54 54, 48 50",
  "M64 58 C60 52, 56 48, 52 44",
  "M178 56 C184 50, 188 48, 194 44",
  "M174 58 C178 52, 184 50, 188 46",
  "M200 86 C206 80, 210 78, 214 76",
  "M198 90 C204 86, 210 84, 214 80",
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

      {/* Branches — emerge at different heights along trunk */}
      <g opacity={0.4 + p * 0.3}>
        {BRANCHES.map((d, i) => (
          <path key={i} d={d}
            fill={`hsl(30, ${trunkS}%, ${trunkL + 3}%)`} />
        ))}
        {SUB_BRANCHES.map((d, i) => (
          <path key={`sb${i}`} d={d}
            fill={`hsl(30, ${trunkS}%, ${trunkL + 4}%)`} />
        ))}
        {TWIGS.map((d, i) => (
          <path key={`tw${i}`} d={d}
            fill="none"
            stroke={`hsl(30, ${trunkS}%, ${trunkL + 6}%)`}
            strokeWidth={1}
            strokeLinecap="round" />
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

      {/* ── FLOWERS — smaller, softer colors, more delicate ── */}
      {flowers.map((f, i) => {
        const fp = sub(p, f.delay, 0.22);
        if (fp <= 0) return null;
        const headY = f.x > 400 ? 196 : (196 + (i % 2) * 2) - f.stemH * fp;
        const ps = f.size * fp;
        const baseY = 196 + (i % 2) * 2;
        return (
          <g key={i} opacity={fp}>
            {/* Stem — slight curve */}
            <path
              d={`M${f.x} ${baseY} Q${f.x + 2} ${baseY - f.stemH * 0.5 * fp} ${f.x} ${headY}`}
              fill="none" stroke="#2a5a1a" strokeWidth={1.5} />
            {/* Petals — 5 small petals */}
            {[0, 72, 144, 216, 288].map((ang, j) => {
              const px = f.x + Math.cos((ang * Math.PI) / 180) * ps * 1.1;
              const py = headY + Math.sin((ang * Math.PI) / 180) * ps * 1.1;
              return (
                <ellipse key={j}
                  cx={px} cy={py}
                  rx={ps * 0.55} ry={ps * 0.35}
                  fill={f.color}
                  transform={`rotate(${ang + 90}, ${px}, ${py})`} />
              );
            })}
            {/* Center */}
            <circle cx={f.x} cy={headY} r={ps * 0.3} fill="#e8d060" />
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
