import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";
import { Flower } from "../svg/primitives";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── HAND-CRAFTED SVG PATHS ────────────────────────────────
// Every major element is a single complex bezier path, designed
// to look organic as a solid-color silhouette.

/** Gnarled oak trunk — asymmetric, with a visible burl on the left side */
const TRUNK = `
  M107 195
  C106 190, 104 185, 103 179
  C102 173, 100 169, 98 164
  C95 158, 93 153, 95 148
  C97 143, 100 140, 99 135
  C98 128, 95 123, 97 118
  C99 113, 103 109, 108 106
  C112 103, 116 101, 120 100
  L126 100
  C130 101, 134 104, 136 107
  C139 112, 141 118, 141 125
  C141 132, 143 138, 142 145
  C141 152, 144 158, 143 164
  C142 170, 140 176, 139 182
  C138 188, 137 192, 136 195
  Z`;

/** Canopy — irregular leafy silhouette with ~30 curves */
const CANOPY = `
  M28 92
  C24 86, 26 78, 34 72
  C40 67, 35 60, 42 54
  C47 49, 52 46, 58 43
  C63 40, 59 35, 66 32
  C71 29, 78 34, 84 30
  C89 27, 84 21, 92 19
  C98 17, 104 22, 110 18
  C116 15, 120 20, 128 17
  C134 14, 130 19, 138 17
  C145 15, 150 20, 158 22
  C164 24, 160 18, 170 22
  C178 25, 184 30, 190 33
  C196 36, 192 42, 200 44
  C206 47, 212 52, 216 58
  C220 64, 224 72, 222 78
  C220 84, 226 90, 222 95
  C218 99, 212 96, 206 100
  C198 104, 190 100, 182 104
  C174 108, 166 103, 158 106
  C150 109, 142 105, 134 108
  C126 110, 118 106, 110 109
  C102 112, 94 107, 86 110
  C78 112, 70 107, 62 109
  C54 110, 46 106, 38 102
  C32 98, 28 94, 28 92
  Z`;

/** Branch paths — each is a CLOSED TAPERED SHAPE, wide at trunk, thin at tip */
const BRANCHES = [
  // far left — sweeps down-left, wide at trunk (~6px), thin at tip (~1.5px)
  `M106 103
   C96 95, 78 87, 62 83 C50 80, 38 77, 28 75
   L29 78
   C39 80, 51 83, 64 86 C80 90, 98 98, 110 108 Z`,
  // up-left — curves up and left with a slight bend
  `M112 100
   C104 88, 90 72, 82 62 C76 54, 70 47, 64 42
   L67 44
   C73 50, 80 58, 86 66 C96 78, 108 92, 116 104 Z`,
  // up-center — rises with a gentle S-curve, slight rightward lean
  `M119 99
   C118 86, 120 72, 118 58 C117 48, 118 40, 117 33
   L121 33
   C122 40, 123 48, 124 58 C126 72, 124 86, 125 100 Z`,
  // up-right — curves right with a wider spread
  `M128 100
   C136 88, 146 74, 156 64 C164 56, 172 50, 180 45
   L182 48
   C175 54, 167 60, 159 68 C149 78, 140 92, 132 104 Z`,
  // far right — sweeps right, the longest branch
  `M134 105
   C144 98, 160 92, 178 88 C192 85, 206 84, 220 83
   L220 86
   C207 87, 193 89, 180 92 C162 96, 148 102, 138 109 Z`,
];

/** Sub-branches — medium forking branches off the main ones, tapered closed paths */
const SUB_BRANCHES = [
  // off far-left branch, forks upward around midpoint
  `M72 86 C66 78, 56 72, 48 65 L50 67 C58 74, 68 80, 76 89 Z`,
  // off up-left, forks further left near top
  `M86 64 C78 56, 66 52, 56 46 L58 48 C68 54, 80 60, 90 68 Z`,
  // off up-left, smaller fork downward-left at midpoint
  `M96 78 C88 80, 78 78, 68 80 L69 82 C79 81, 90 82, 98 82 Z`,
  // off center, forks right in upper section
  `M121 55 C128 48, 136 44, 144 38 L145 41 C138 46, 130 52, 124 58 Z`,
  // off center, forks left lower down
  `M119 70 C112 66, 104 62, 96 60 L97 62 C105 65, 114 70, 122 74 Z`,
  // off up-right, forks further right near top
  `M160 62 C168 54, 178 50, 188 44 L189 47 C180 52, 170 58, 163 66 Z`,
  // off far-right, forks upward at midpoint
  `M182 88 C190 80, 198 76, 208 70 L209 73 C200 78, 192 84, 185 92 Z`,
  // off far-right, smaller drooping fork
  `M200 86 C208 90, 216 88, 226 92 L225 94 C216 91, 209 92, 202 90 Z`,
];

/** Fine twigs — thin stroked tips at the ends of branches */
const TWIGS = [
  // tips of far-left sub-branch
  "M48 65 C42 60, 36 56, 30 54",
  "M50 67 C44 64, 38 62, 34 58",
  // tips of up-left
  "M56 46 C50 40, 44 36, 38 32",
  "M68 44 C62 38, 58 34, 52 30",
  // tips of center forks
  "M144 38 C150 32, 154 28, 160 24",
  "M96 60 C90 56, 84 54, 78 52",
  // tips of up-right
  "M188 44 C194 38, 200 36, 206 32",
  "M180 48 C186 42, 190 38, 196 34",
  // tips of far-right
  "M208 70 C214 64, 220 62, 226 58",
  "M226 92 C232 90, 238 92, 244 90",
  // a few wispy tips at very ends
  "M30 54 C26 50, 22 48, 18 46",
  "M38 32 C34 26, 30 24, 26 22",
  "M160 24 C164 18, 168 16, 172 14",
  "M206 32 C212 26, 216 24, 222 22",
];

/** Tree roots — thick curves spreading from the trunk base into the earth */
const ROOTS = [
  "M104 194 C94 197, 76 200, 56 199 C40 198, 22 201, 5 200",
  "M108 195 C100 199, 82 204, 62 206 C46 208, 28 207, 10 210",
  "M136 195 C148 199, 168 203, 190 205 C208 207, 228 206, 250 209",
  "M134 194 C144 197, 164 200, 186 199 C202 198, 220 201, 240 200",
];

/** Rolling terrain — hand-drawn with natural undulation, not sine waves */
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

/** A few hand-placed grass tufts — organic clumps, not lines */
const GRASS_TUFTS = [
  // each is a small cluster of curved blades
  { x: 168, paths: [
    "M168 196 Q166 188 164 178", "M170 196 Q169 186 170 176",
    "M172 196 Q174 187 176 179", "M167 196 Q163 190 160 184",
  ]},
  { x: 255, paths: [
    "M255 194 Q253 186 250 177", "M257 194 Q257 184 258 175",
    "M259 194 Q262 186 264 178", "M254 194 Q250 188 247 182",
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

/** Small stones near the tree base */
const STONES = [
  "M92 198 C90 196, 88 194, 86 195 C84 196, 83 198, 85 199 C87 200, 90 200, 92 198 Z",
  "M145 197 C148 195, 152 194, 154 196 C155 198, 153 200, 150 200 C147 200, 144 199, 145 197 Z",
  "M75 200 C74 198, 72 197, 70 198 C68 199, 69 201, 71 202 C73 202, 76 201, 75 200 Z",
];

// ─── SCENE COMPONENT ───────────────────────────────────────

function GardenScene({ progress: p }: SceneProps) {
  // Color transitions: dormant grey-brown → alive green-gold
  const skyH = 180 + p * 30;     // blue-grey → green-teal
  const skyS = 8 + p * 30;
  const skyL = 12 + p * 22;

  const groundS = 8 + p * 32;
  const groundL = 10 + p * 12;

  const trunkS = 6 + p * 14;
  const trunkL = 12 + p * 8;

  const canopyS = 5 + p * 35;
  const canopyL = 10 + p * 16;

  const sunY = 95 - p * 60;

  // Phase: roots wake (0-0.5), flowers bloom (0.4-1.0)
  const rootGlow = sub(p, 0.05, 0.4);
  const canopyLife = sub(p, 0.1, 0.5);

  const flowers = [
    { x: 200, stemH: 34, color: "#e87090", size: 8,  delay: 0.35 },
    { x: 230, stemH: 40, color: "#f0c050", size: 9,  delay: 0.42 },
    { x: 265, stemH: 36, color: "#a070e0", size: 8,  delay: 0.5 },
    { x: 300, stemH: 42, color: "#e8a0c0", size: 9,  delay: 0.58 },
    { x: 340, stemH: 38, color: "#60c888", size: 10, delay: 0.66 },
    { x: 370, stemH: 32, color: "#f08050", size: 8,  delay: 0.75 },
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

      {/* ── CLOUDS — soft shapes are appropriate for clouds ── */}
      {p > 0.35 && (
        <g opacity={sub(p, 0.35, 0.3) * 0.35}>
          <ellipse cx={80} cy={42} rx={35} ry={10} fill="white" />
          <ellipse cx={62} cy={38} rx={22} ry={8} fill="white" />
          <ellipse cx={100} cy={39} rx={25} ry={9} fill="white" />
          <ellipse cx={280} cy={48} rx={30} ry={9} fill="white" opacity={0.7} />
          <ellipse cx={300} cy={45} rx={22} ry={7} fill="white" opacity={0.7} />
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

      {/* ── TREE — the hero element ── */}

      {/* Canopy — transitions from grey to green */}
      <path d={CANOPY}
        fill={`hsl(${110 + p * 15}, ${canopyS}%, ${canopyL}%)`}
        opacity={0.3 + canopyLife * 0.6} />
      {/* Canopy highlight — lighter inner shape suggesting sunlit leaves */}
      <path d={CANOPY}
        fill={`hsl(${115 + p * 10}, ${canopyS + 8}%, ${canopyL + 5}%)`}
        opacity={canopyLife * 0.25}
        transform="translate(3, 2) scale(0.88)"
        style={{ transformOrigin: "125px 65px" }} />

      {/* Branches — tapered filled shapes with forking sub-branches */}
      <g opacity={0.4 + p * 0.3}>
        {/* Main branches */}
        {BRANCHES.map((d, i) => (
          <path key={i} d={d}
            fill={`hsl(30, ${trunkS}%, ${trunkL + 3}%)`} />
        ))}
        {/* Forking sub-branches — medium tapered shapes */}
        {SUB_BRANCHES.map((d, i) => (
          <path key={`sb${i}`} d={d}
            fill={`hsl(30, ${trunkS}%, ${trunkL + 4}%)`} />
        ))}
        {/* Fine twigs at branch tips */}
        {TWIGS.map((d, i) => (
          <path key={`tw${i}`} d={d}
            fill="none"
            stroke={`hsl(30, ${trunkS}%, ${trunkL + 6}%)`}
            strokeWidth={1}
            strokeLinecap="round" />
        ))}
      </g>

      {/* Trunk — complex gnarled path */}
      <path d={TRUNK}
        fill={`hsl(30, ${trunkS}%, ${trunkL}%)`} />
      {/* Bark highlight — one side catching light */}
      <path d={TRUNK}
        fill={`hsl(35, ${trunkS + 4}%, ${trunkL + 6}%)`}
        opacity={p * 0.3}
        clipPath="inset(0 50% 0 0)" />

      {/* Roots — emerge from trunk base, glow as they wake */}
      <g opacity={0.3 + rootGlow * 0.7}>
        {ROOTS.map((d, i) => (
          <path key={i} d={d}
            fill="none"
            stroke={`hsl(30, ${trunkS + rootGlow * 10}%, ${trunkL + rootGlow * 5}%)`}
            strokeWidth={3.5 - i * 0.4}
            strokeLinecap="round" />
        ))}
      </g>
      {/* Root glow — ley-energy hint, subtle */}
      {rootGlow > 0.3 && (
        <g opacity={(rootGlow - 0.3) * 0.5}>
          {ROOTS.map((d, i) => (
            <path key={i} d={d}
              fill="none"
              stroke="#6bbf6b"
              strokeWidth={1.5}
              strokeLinecap="round"
              filter="url(#rootGlow)" />
          ))}
        </g>
      )}

      {/* ── NEAR GROUND ── */}
      <path d={GROUND}
        fill={`hsl(120, ${groundS}%, ${groundL}%)`} />
      {/* Earth below ground line */}
      <rect x={0} y={200} width={400} height={50}
        fill={`hsl(30, ${10 + p * 8}%, ${10 + p * 6}%)`} />

      {/* ── STONES near tree base ── */}
      <g opacity={0.3 + p * 0.4}>
        {STONES.map((d, i) => (
          <path key={i} d={d}
            fill={`hsl(30, ${6 + p * 4}%, ${18 + p * 5}%)`} />
        ))}
      </g>

      {/* ── GRASS TUFTS — organic hand-placed clumps ── */}
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

      {/* ── FLOWERS — bloom during second phrase ── */}
      {flowers.map((f, i) => (
        <Flower
          key={i}
          x={f.x}
          y={196 + (i % 2) * 2}
          stemHeight={f.stemH}
          petalColor={f.color}
          petalSize={f.size}
          progress={sub(p, f.delay, 0.22)}
        />
      ))}

      {/* ── POLLEN MOTES — appear late, very subtle ── */}
      {p > 0.6 && Array.from({ length: 20 }).map((_, i) => {
        const mx = 35 + (i * 53 + 17) % 350;
        const my = 50 + (i * 37 + 11) % 140;
        const mp = sub(p, 0.6 + i * 0.015, 0.15);
        const drift = Math.sin(p * Math.PI * 3 + i * 1.2) * 5;
        return mp > 0 ? (
          <circle key={i} cx={mx + drift} cy={my - mp * 10}
            r={0.8 + (i % 3) * 0.3}
            fill="#f0e870" opacity={mp * 0.25} />
        ) : null;
      })}

      {/* ── A small bird silhouette — reward for completion ── */}
      {p > 0.9 && (
        <g opacity={sub(p, 0.9, 0.1) * 0.5}>
          <path d="M290 55 C288 52, 284 50, 280 52 C282 50, 286 48, 290 50 C294 48, 298 50, 300 52 C296 50, 292 52, 290 55 Z"
            fill={`hsl(30, 10%, ${15 + p * 10}%)`} />
        </g>
      )}
    </svg>
  );
}

export default memo(GardenScene);
