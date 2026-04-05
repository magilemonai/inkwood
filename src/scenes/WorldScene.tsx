import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── THE WAKING WORLD ─────────────────────────────────────
// The finale. A panoramic landscape that ASSEMBLES from barren
// terrain as the player recites callback phrases from every
// previous level.
//
// Phrase 1 "garden bloom, hearth burn bright":
//   Earth awakens — rolling hills green up, a cottage window
//   glows amber on a distant hillside, flowers dot the foreground.
//
// Phrase 2 "stars remember, spirits sing":
//   Sky awakens — stars ignite, moon appears, spirit wisps
//   drift through the middle ground, standing stones glow.
//
// Phrase 3 "the ancient order is restored":
//   Ley lines surge golden across the landscape connecting
//   everything, the Great Tree silhouette rises center-back,
//   dawn light floods from behind it.

// ─── HAND-CRAFTED PATHS ──────────────────────────────────

/** Far hills — gentle rolling distant range */
const HILLS_FAR = `
  M0 105 C30 98, 55 102, 80 96
  C105 90, 120 85, 145 88
  C165 91, 178 82, 200 78
  C222 74, 240 80, 260 84
  C280 88, 300 82, 320 86
  C345 90, 365 95, 390 92
  L400 97 L400 250 L0 250 Z`;

/** Mid hills — closer, slightly more detail */
const HILLS_MID = `
  M0 140 C25 135, 45 138, 70 132
  C95 126, 110 130, 130 125
  C150 120, 165 128, 185 122
  C205 117, 220 120, 240 126
  C265 132, 285 125, 310 130
  C335 135, 360 128, 385 132
  L400 138 L400 250 L0 250 Z`;

/** Foreground ground — closest, most detail */
const GROUND = `
  M0 175 C20 172, 40 178, 65 174
  C90 170, 110 176, 135 172
  C160 168, 180 174, 200 170
  C225 166, 245 172, 270 168
  C295 164, 315 170, 340 166
  C365 162, 380 168, 400 165
  L400 250 L0 250 Z`;

/** The Great Tree silhouette — rises behind hills, center */
const GREAT_TREE_TRUNK = `
  M190 110 C188 100, 186 85, 185 72
  C184 60, 183 48, 184 38
  C185 30, 188 25, 192 22
  C196 19, 200 18, 204 19
  C208 22, 211 25, 212 30
  C213 38, 214 48, 213 60
  C212 72, 210 85, 208 100
  C206 108, 195 112, 190 110 Z`;

/** Great Tree canopy — massive, fills upper-center */
const GREAT_TREE_CANOPY = `
  M140 55 C145 42, 155 30, 165 24
  C175 18, 182 12, 190 8
  C198 4, 202 4, 210 8
  C218 12, 225 18, 235 24
  C245 30, 255 42, 260 55
  C263 65, 258 72, 250 76
  C240 80, 228 78, 218 75
  C210 72, 205 74, 200 75
  C195 76, 190 74, 182 75
  C172 78, 160 80, 150 76
  C142 72, 137 65, 140 55 Z`;

/** Great Tree roots — spread across the mid-hills */
const TREE_ROOTS = [
  "M192 108 C180 112, 160 118, 140 125",
  "M188 106 C175 114, 155 122, 130 130",
  "M208 108 C220 112, 240 118, 260 125",
  "M210 106 C225 114, 245 122, 270 130",
];

/** Cottage silhouette on right hillside */
const COTTAGE = `
  M305 118 L305 108 L312 102 L319 108 L319 118 Z`;

/** Bridge arch silhouette — distant, between two hills */
const BRIDGE_ARCH = `
  M135 130 C140 124, 148 120, 155 118
  C162 116, 168 118, 175 120
  C182 124, 190 130, 195 134`;

/** Well structure — tiny, on left foreground */
const WELL_POSTS = `
  M68 162 L68 155 L74 152 L80 155 L80 162`;

// Location markers for ley line connections
const LEY_POINTS = [
  { x: 45,  y: 172, label: "garden" },   // foreground left
  { x: 312, y: 112, label: "cottage" },  // right hillside
  { x: 280, y: 55,  label: "stars" },    // upper right sky
  { x: 74,  y: 155, label: "well" },     // left foreground
  { x: 165, y: 126, label: "bridge" },   // mid area
  { x: 350, y: 165, label: "stones" },   // right foreground
  { x: 200, y: 40,  label: "tree" },     // center top
];

const LEY_CONNECTIONS: [number, number][] = [
  [0, 3], [3, 4], [4, 1], [1, 5],
  [4, 6], [6, 2], [0, 4], [5, 6],
  [2, 6], [1, 2],
];

function WorldScene({ progress: p }: SceneProps) {
  // Three-phrase breakdown: earth (0-0.33), sky (0.33-0.66), unity (0.66-1)
  const earthP = sub(p, 0, 0.33);
  const skyP = sub(p, 0.33, 0.33);
  const unityP = sub(p, 0.66, 0.34);

  // Sky color — deep indigo → pre-dawn blue → golden dawn
  const skyH = 230 - p * 30;
  const skyS = 15 + p * 15;
  const skyTopL = 4 + p * 12;
  const skyBotL = 6 + p * 18;

  // Hill colors — barren grey-brown → alive green/amber
  const farHillL = 8 + earthP * 10;
  const farHillS = 5 + earthP * 20;
  const midHillL = 6 + earthP * 8;
  const midHillS = 4 + earthP * 18;
  const groundL = 5 + earthP * 6;
  const groundS = 4 + earthP * 15;

  // Dawn glow behind tree (unity phase)
  const dawnP = sub(p, 0.72, 0.28);

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="wGlow" radius={6} color="#d8c890" opacity={0.4} />
        <GlowFilter id="wStarGlow" radius={3} color="#e0d8c0" opacity={0.3} />

        <linearGradient id="wSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${skyH}, ${skyS}%, ${skyTopL}%)`} />
          <stop offset="60%" stopColor={`hsl(${skyH - 10}, ${skyS - 3}%, ${(skyTopL + skyBotL) / 2}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH - 20}, ${skyS + 5}%, ${skyBotL}%)`} />
        </linearGradient>

        {/* Dawn radiance behind the Great Tree */}
        <radialGradient id="dawnGlow" cx="50%" cy="32%" r="40%">
          <stop offset="0%" stopColor="#ffe8a0" stopOpacity={dawnP * 0.35} />
          <stop offset="40%" stopColor="#d8a050" stopOpacity={dawnP * 0.15} />
          <stop offset="100%" stopColor="#d8a050" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── SKY ── */}
      <rect width="400" height="250" fill="url(#wSky)" />

      {/* ── STARS — appear during sky phase ── */}
      {skyP > 0 && [
        { x: 30, y: 20, r: 1.2 }, { x: 85, y: 35, r: 0.8 },
        { x: 140, y: 15, r: 1.0 }, { x: 260, y: 12, r: 1.1 },
        { x: 310, y: 28, r: 0.9 }, { x: 355, y: 18, r: 1.0 },
        { x: 380, y: 42, r: 0.7 }, { x: 55, y: 52, r: 0.6 },
        { x: 170, y: 42, r: 0.8 }, { x: 330, y: 55, r: 0.7 },
        { x: 15, y: 65, r: 0.5 }, { x: 390, y: 8, r: 0.9 },
        { x: 120, y: 60, r: 0.6 }, { x: 280, y: 38, r: 0.8 },
        { x: 225, y: 25, r: 0.7 },
      ].map((s, i) => {
        const sp = sub(skyP, i * 0.04, 0.15);
        return sp > 0 ? (
          <g key={`s${i}`}>
            <circle cx={s.x} cy={s.y} r={s.r * 3} fill="#e0d8c0" opacity={sp * 0.06} />
            <circle cx={s.x} cy={s.y} r={s.r} fill="#f0ead0" opacity={sp * 0.7} />
          </g>
        ) : null;
      })}

      {/* ── MOON — crescent, upper right, sky phase ── */}
      {skyP > 0.2 && (() => {
        const mp = sub(skyP, 0.2, 0.3);
        const moonBright = 0.3 + mp * 0.7;
        return (
          <g opacity={mp}>
            {/* Moon bright disc */}
            <circle cx="340" cy="40" r="12"
              fill={`rgb(${200 + Math.floor(moonBright * 40)}, ${200 + Math.floor(moonBright * 40)}, ${210 + Math.floor(moonBright * 35)})`}
            />
            {/* Crescent mask — matches sky at this altitude */}
            <circle cx="333" cy="37" r="10"
              fill={`hsl(${skyH + 8}, ${Math.max(skyS, 30)}%, ${skyTopL + 1}%)`} />
            {/* Surface detail */}
            <circle cx="345" cy="42" r="1.2" fill="#c8c8e0" opacity={moonBright * 0.15} />
          </g>
        );
      })()}

      {/* ── DAWN GLOW behind tree — unity phase ── */}
      {dawnP > 0 && (
        <rect width="400" height="250" fill="url(#dawnGlow)" />
      )}

      {/* ── GREAT TREE SILHOUETTE — rises during unity phase ── */}
      {unityP > 0 && (() => {
        const treeRise = sub(unityP, 0, 0.5);
        const canopyP = sub(unityP, 0.3, 0.4);
        const offsetY = (1 - treeRise) * 30;
        return (
          <g opacity={treeRise * 0.85}>
            {/* Trunk */}
            <path d={GREAT_TREE_TRUNK}
              fill={`hsl(140, ${10 + unityP * 15}%, ${8 + unityP * 6}%)`}
              transform={`translate(0, ${offsetY})`} />
            {/* Canopy — fades in after trunk */}
            {canopyP > 0 && (
              <path d={GREAT_TREE_CANOPY}
                fill={`hsl(130, ${15 + unityP * 20}%, ${10 + unityP * 8}%)`}
                opacity={canopyP * 0.9}
                transform={`translate(0, ${offsetY * 0.5})`} />
            )}
            {/* Roots spreading into hills */}
            {TREE_ROOTS.map((r, i) => (
              <path key={`r${i}`} d={r}
                fill="none"
                stroke={`hsl(50, ${20 + unityP * 30}%, ${12 + unityP * 10}%)`}
                strokeWidth={1.5}
                opacity={sub(unityP, 0.2 + i * 0.1, 0.3) * 0.4}
                transform={`translate(0, ${offsetY * 0.3})`} />
            ))}
            {/* Tree glow — inner light */}
            {canopyP > 0.3 && (
              <ellipse cx="200" cy={45 + offsetY * 0.5} rx="25" ry="18"
                fill="#d8c890" opacity={sub(canopyP, 0.3, 0.5) * 0.08} />
            )}
          </g>
        );
      })()}

      {/* ── FAR HILLS ── */}
      <path d={HILLS_FAR}
        fill={`hsl(${150 - (1 - earthP) * 30}, ${farHillS}%, ${farHillL}%)`} />

      {/* ── TREE SILHOUETTES on far hills — we're in a forest ── */}
      {earthP > 0.1 && (() => {
        const tp = sub(earthP, 0.1, 0.4);
        // Dense treeline along far hill ridge
        const treeXs = [15, 30, 42, 58, 72, 88, 105, 125, 155, 175, 225, 250, 275, 295, 315, 335, 355, 372, 388];
        return (
          <g opacity={tp * 0.6}>
            {treeXs.map((tx, i) => {
              const baseY = 88 + Math.sin(tx * 0.04) * 5; // follow hill contour
              const h = 8 + (i % 3) * 4;
              const w = 3 + (i % 2) * 2;
              return (
                <g key={`ft${i}`}>
                  {/* Trunk */}
                  <line x1={tx} y1={baseY} x2={tx} y2={baseY - h * 0.5}
                    stroke={`hsl(${140 + (i % 3) * 5}, ${farHillS + 5}%, ${farHillL - 1}%)`}
                    strokeWidth={1} />
                  {/* Canopy */}
                  <ellipse cx={tx} cy={baseY - h * 0.6} rx={w} ry={h * 0.45}
                    fill={`hsl(${135 + (i % 4) * 5}, ${farHillS + 3}%, ${farHillL - 1}%)`} />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ── COTTAGE silhouette on right hillside — earth phase ── */}
      {earthP > 0.3 && (() => {
        const cp = sub(earthP, 0.3, 0.3);
        return (
          <g opacity={cp * 0.9}>
            <path d={COTTAGE}
              fill={`hsl(30, ${5 + cp * 8}%, ${10 + cp * 4}%)`} />
            {/* Window glow — amber */}
            <rect x="308" y="110" width="4" height="5" rx="0.5"
              fill="#e89a30" opacity={cp * 0.6} />
            <circle cx="310" cy="112" r="6"
              fill="#e89a30" opacity={cp * 0.06} />
          </g>
        );
      })()}

      {/* ── MID HILLS ── */}
      <path d={HILLS_MID}
        fill={`hsl(${145 - (1 - earthP) * 35}, ${midHillS}%, ${midHillL}%)`} />

      {/* ── BRIDGE arch silhouette — between hills ── */}
      {earthP > 0.5 && (
        <path d={BRIDGE_ARCH}
          fill="none"
          stroke={`hsl(200, ${8 + earthP * 6}%, ${10 + earthP * 5}%)`}
          strokeWidth={2.5}
          opacity={sub(earthP, 0.5, 0.3) * 0.5}
          strokeLinecap="round" />
      )}

      {/* ── SPIRIT WISPS — sky phase, drifting through mid-ground ── */}
      {skyP > 0.3 && [
        { x: 90, y: 130, dx: 5 }, { x: 230, y: 120, dx: -3 },
        { x: 160, y: 135, dx: 4 }, { x: 290, y: 128, dx: -4 },
        { x: 50, y: 125, dx: 3 }, { x: 350, y: 132, dx: -2 },
      ].map((w, i) => {
        const wp = sub(skyP, 0.3 + i * 0.08, 0.2);
        const drift = Math.sin(p * Math.PI * 3 + i * 1.5) * w.dx;
        const bob = Math.sin(p * Math.PI * 4 + i * 2) * 2;
        return wp > 0 ? (
          <g key={`w${i}`}>
            <circle cx={w.x + drift} cy={w.y + bob} r={3}
              fill="#d0b870" opacity={wp * 0.06} />
            <circle cx={w.x + drift} cy={w.y + bob} r={1.2}
              fill="#ffe8a0" opacity={wp * 0.25} />
          </g>
        ) : null;
      })}

      {/* ── STANDING STONES silhouette — right mid-ground, sky phase ── */}
      {skyP > 0.4 && (() => {
        const sp = sub(skyP, 0.4, 0.3);
        return (
          <g opacity={sp * 0.6}>
            {[335, 345, 355, 365].map((x, i) => {
              const h = 8 + (i % 2) * 4;
              const riseP = sub(sp, i * 0.15, 0.4);
              return (
                <rect key={i} x={x} y={158 - h * riseP} width={4} height={h * riseP}
                  fill={`hsl(210, 10%, ${10 + skyP * 5}%)`} rx="1" />
              );
            })}
          </g>
        );
      })()}

      {/* ── FOREGROUND GROUND ── */}
      <path d={GROUND}
        fill={`hsl(${140 - (1 - earthP) * 40}, ${groundS}%, ${groundL}%)`} />

      {/* ── WELL silhouette — left hillside, opposite cottage ── */}
      {earthP > 0.4 && (() => {
        const wp = sub(earthP, 0.4, 0.3);
        return (
          <g opacity={wp * 0.8}>
            {/* Well structure — roof + posts */}
            <path d="M88 128 L88 120 L95 116 L102 120 L102 128"
              fill="none"
              stroke={`hsl(30, 12%, ${12 + earthP * 5}%)`}
              strokeWidth={1.8} strokeLinecap="round" />
            {/* Roof */}
            <path d="M85 120 L95 114 L105 120"
              fill={`hsl(25, 10%, ${10 + earthP * 4}%)`}
              stroke={`hsl(25, 10%, ${10 + earthP * 4}%)`}
              strokeWidth={1} />
            {/* Rope + bucket hint */}
            <line x1="95" y1="120" x2="95" y2="126"
              stroke={`hsl(30, 8%, ${14 + earthP * 4}%)`}
              strokeWidth={0.5} />
            {/* Cyan accent glow */}
            <circle cx="95" cy="130" r="4" fill="#50b8b8" opacity={wp * 0.06} />
          </g>
        );
      })()}

      {/* ── FOREGROUND FLOWERS — earth phase ── */}
      {earthP > 0.5 && [
        { x: 25, y: 174, color: "#6bbf6b" },
        { x: 50, y: 170, color: "#e88080" },
        { x: 105, y: 175, color: "#80a8e0" },
        { x: 155, y: 170, color: "#e8c060" },
        { x: 245, y: 166, color: "#c088b0" },
        { x: 310, y: 168, color: "#6bbf6b" },
        { x: 375, y: 164, color: "#e8c060" },
      ].map((f, i) => {
        const fp = sub(earthP, 0.5 + i * 0.05, 0.2);
        return fp > 0 ? (
          <g key={`f${i}`} opacity={fp * 0.7}>
            {/* Stem */}
            <line x1={f.x} y1={f.y} x2={f.x} y2={f.y - 4 * fp}
              stroke="#3a6830" strokeWidth={0.8} />
            {/* Bloom */}
            <circle cx={f.x} cy={f.y - 5 * fp} r={1.5 * fp}
              fill={f.color} opacity={fp * 0.8} />
          </g>
        ) : null;
      })}

      {/* ── GRASS TUFTS — foreground detail ── */}
      {earthP > 0.3 && [
        { x: 15, y: 176 }, { x: 80, y: 173 }, { x: 130, y: 174 },
        { x: 190, y: 170 }, { x: 260, y: 167 }, { x: 330, y: 166 },
        { x: 385, y: 164 },
      ].map((g_pos, i) => {
        const gp = sub(earthP, 0.3 + i * 0.04, 0.2);
        return gp > 0 ? (
          <g key={`g${i}`} opacity={gp * 0.4}>
            <line x1={g_pos.x - 2} y1={g_pos.y} x2={g_pos.x - 3} y2={g_pos.y - 4 * gp}
              stroke={`hsl(120, ${15 + earthP * 15}%, ${12 + earthP * 8}%)`} strokeWidth={0.6} />
            <line x1={g_pos.x} y1={g_pos.y} x2={g_pos.x + 1} y2={g_pos.y - 5 * gp}
              stroke={`hsl(125, ${15 + earthP * 15}%, ${14 + earthP * 8}%)`} strokeWidth={0.6} />
            <line x1={g_pos.x + 2} y1={g_pos.y} x2={g_pos.x + 4} y2={g_pos.y - 3 * gp}
              stroke={`hsl(115, ${15 + earthP * 15}%, ${11 + earthP * 8}%)`} strokeWidth={0.6} />
          </g>
        ) : null;
      })}

      {/* ── LEY LINES — unity phase, golden connections ── */}
      {unityP > 0.2 && LEY_CONNECTIONS.map(([a, b], i) => {
        const la = LEY_POINTS[a];
        const lb = LEY_POINTS[b];
        const lp = sub(unityP, 0.2 + i * 0.04, 0.25);
        if (lp <= 0) return null;

        const mx = (la.x + lb.x) / 2 + ((i % 3) - 1) * 10;
        const my = (la.y + lb.y) / 2 - 5;
        const lineLen = Math.sqrt((lb.x - la.x) ** 2 + (lb.y - la.y) ** 2) * 1.2;

        return (
          <g key={`ley${i}`}>
            {/* Outer glow line */}
            <path
              d={`M${la.x} ${la.y} Q${mx} ${my} ${lb.x} ${lb.y}`}
              fill="none" stroke="#d8c890" strokeWidth={2}
              strokeDasharray={lineLen}
              strokeDashoffset={lineLen * (1 - lp)}
              opacity={lp * 0.12} />
            {/* Inner bright line */}
            <path
              d={`M${la.x} ${la.y} Q${mx} ${my} ${lb.x} ${lb.y}`}
              fill="none" stroke="#f0e8c0" strokeWidth={0.6}
              strokeDasharray={lineLen}
              strokeDashoffset={lineLen * (1 - lp)}
              opacity={lp * 0.3} />
          </g>
        );
      })}

      {/* ── LEY NODES — glow at connection points, unity phase ── */}
      {unityP > 0.3 && LEY_POINTS.map((pt, i) => {
        const np = sub(unityP, 0.3 + i * 0.05, 0.2);
        return np > 0 ? (
          <g key={`ln${i}`}>
            <circle cx={pt.x} cy={pt.y} r={4} fill="#d8c890" opacity={np * 0.08} />
            <circle cx={pt.x} cy={pt.y} r={1.5} fill="#f0e8c0" opacity={np * 0.35} />
          </g>
        ) : null;
      })}

      {/* ── FINAL GOLDEN WASH — last 10% ── */}
      {p > 0.9 && (() => {
        const fp = sub(p, 0.9, 0.1);
        return (
          <g>
            <rect width="400" height="250" fill="#d8c890" opacity={fp * 0.04} />
            {/* Horizon glow */}
            <ellipse cx="200" cy="90" rx={180 * fp} ry={40 * fp}
              fill="#ffe8a0" opacity={fp * 0.06} />
          </g>
        );
      })()}

      {/* ── ATMOSPHERIC PARTICLES — fine dust/pollen ── */}
      {p > 0.15 && Array.from({ length: 20 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 150 + 20;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.9) * 4;
        const rise = p * 15 * ((i % 4) / 4);
        const size = 0.3 + (i % 3) * 0.2;
        const op = sub(p, 0.15 + (i % 5) * 0.08, 0.2) * 0.15;
        return op > 0 ? (
          <circle key={`p${i}`} cx={px + drift} cy={baseY - rise} r={size}
            fill={i % 3 === 0 ? "#f0e8c0" : "#d8c890"} opacity={op} />
        ) : null;
      })}
    </svg>
  );
}

export default memo(WorldScene);
