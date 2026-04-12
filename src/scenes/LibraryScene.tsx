import { sub } from "./util";
import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";
import { useParticles } from "../hooks/useParticles";
import ParticleField from "../components/ParticleField";


// ─── THE WHISPERING LIBRARY ──────────────────────────────
// A sacred underground library. Words are precious and few here.
// Books don't sit on shelves — each rests on its own stone pedestal
// or altar, honored like relics. Crystals grow from the cavern.
// A central archway frames the space. The hero tome sits center.
//
// Phrase 1 "open, sleeping pages": The tome opens. Books on their
// pedestals begin to glow. Crystals brighten. Some books lift off
// their altars and float, orbiting slowly.
//
// Phrase 2 "speak again, forgotten words": Rune symbols rise from
// the open tome. The chamber fills with warm light. Floating books
// orbit wider. Wisps drift through the space.

// ─── HAND-CRAFTED PATHS ──────────────────────────────────

const VAULT = `
  M0 0 L0 65 C25 55, 55 40, 85 30
  C115 22, 145 14, 175 8
  C188 4, 200 2, 212 4
  C230 8, 260 14, 290 22
  C320 30, 350 40, 375 55
  L400 65 L400 0 Z`;

const WALL_LEFT = `
  M0 65 C25 55, 45 42, 62 35
  C72 30, 78 32, 82 38
  C86 48, 84 62, 80 80
  C76 100, 72 120, 70 140
  C68 158, 66 172, 65 185
  L64 250 L0 250 Z`;

const WALL_RIGHT = `
  M400 65 C375 55, 355 42, 338 35
  C328 30, 322 32, 318 38
  C314 48, 316 62, 320 80
  C324 100, 328 120, 330 140
  C332 158, 334 172, 335 185
  L336 250 L400 250 Z`;

/** Central archway — frames the space */
const ARCHWAY = `
  M150 185 L150 100 Q150 70, 200 60 Q250 70, 250 100 L250 185`;

// Sacred book pedestals — each holds one precious book
const BOOK_ALTARS = [
  // Left side — two pedestals against the wall
  { x: 75,  y: 160, bookColor: "#7a3030", bookW: 12, bookH: 8, delay: 0.08 },
  { x: 105, y: 155, bookColor: "#304070", bookW: 10, bookH: 7, delay: 0.14 },
  // Right side
  { x: 295, y: 158, bookColor: "#508030", bookW: 11, bookH: 8, delay: 0.12 },
  { x: 325, y: 162, bookColor: "#805030", bookW: 10, bookH: 7, delay: 0.18 },
  // Flanking the archway
  { x: 140, y: 148, bookColor: "#603060", bookW: 9,  bookH: 6, delay: 0.10 },
  { x: 260, y: 150, bookColor: "#306050", bookW: 10, bookH: 7, delay: 0.16 },
];

// Floating books — lift off altars and orbit
const FLOATING_BOOKS = [
  { startX: 75,  startY: 155, endX: 110, endY: 90,  color: "#8b4513", rot: -15, delay: 0.35 },
  { startX: 295, startY: 153, endX: 270, endY: 85,  color: "#6a3070", rot: 12,  delay: 0.40 },
  { startX: 140, startY: 143, endX: 160, endY: 75,  color: "#2a5a4a", rot: -20, delay: 0.45 },
  { startX: 260, startY: 145, endX: 240, endY: 80,  color: "#5a2a2a", rot: 18,  delay: 0.50 },
  { startX: 105, startY: 150, endX: 130, endY: 95,  color: "#3a3a6a", rot: -8,  delay: 0.55 },
  { startX: 325, startY: 157, endX: 300, endY: 100, color: "#6a5a20", rot: 22,  delay: 0.58 },
];

// Crystal clumps — jutting from walls, floor, and ceiling
const CRYSTALS = [
  // Floor clusters — left side
  { x: 45,  baseY: 200, h: 22, angle: -10, from: "floor" as const },
  { x: 55,  baseY: 205, h: 16, angle: -2,  from: "floor" as const },
  { x: 62,  baseY: 198, h: 12, angle: 8,   from: "floor" as const },
  // Floor clusters — right side
  { x: 338, baseY: 202, h: 24, angle: 10,  from: "floor" as const },
  { x: 348, baseY: 208, h: 18, angle: 2,   from: "floor" as const },
  { x: 355, baseY: 200, h: 14, angle: -6,  from: "floor" as const },
  // Wall-growing left (angled inward)
  { x: 70,  baseY: 130, h: 15, angle: 30,  from: "floor" as const },
  { x: 68,  baseY: 110, h: 12, angle: 35,  from: "floor" as const },
  // Wall-growing right
  { x: 330, baseY: 125, h: 16, angle: -28, from: "floor" as const },
  { x: 332, baseY: 108, h: 13, angle: -32, from: "floor" as const },
  // Ceiling stalactites
  { x: 105, baseY: 28,  h: 16, angle: 175, from: "ceil" as const },
  { x: 120, baseY: 24,  h: 12, angle: 168, from: "ceil" as const },
  { x: 280, baseY: 26,  h: 18, angle: -172,from: "ceil" as const },
  { x: 295, baseY: 22,  h: 14, angle: -165,from: "ceil" as const },
  { x: 190, baseY: 12,  h: 10, angle: 178, from: "ceil" as const },
];

// Runes
const RUNES = [
  "M0-4 L2-6 L4-4 M2-6 L2-8",
  "M0-3 C2-5, 4-5, 6-3 C4-1, 2-1, 0-3",
  "M0 0 L3-6 L6 0 L3-2 Z",
  "M1 0 L0-4 L3-6 L6-4 L5 0",
  "M0-3 L3 0 L6-3 L3-6 Z",
  "M3 0 C0-2, 0-5, 3-6 C6-5, 6-2, 3 0",
];

const RUNE_FLOATERS = [
  { x: 170, startY: 140, endY: 25, runeIdx: 0, delay: 0.58, drift: -12 },
  { x: 192, startY: 138, endY: 18, runeIdx: 1, delay: 0.63, drift: 5 },
  { x: 208, startY: 136, endY: 22, runeIdx: 2, delay: 0.68, drift: -4 },
  { x: 230, startY: 140, endY: 30, runeIdx: 3, delay: 0.73, drift: 10 },
  { x: 180, startY: 142, endY: 35, runeIdx: 4, delay: 0.78, drift: -18 },
  { x: 220, startY: 139, endY: 32, runeIdx: 5, delay: 0.82, drift: 15 },
  { x: 200, startY: 135, endY: 12, runeIdx: 0, delay: 0.86, drift: -2 },
  { x: 188, startY: 143, endY: 40, runeIdx: 3, delay: 0.90, drift: -22 },
  { x: 212, startY: 141, endY: 38, runeIdx: 5, delay: 0.93, drift: 20 },
];

// Wisps
const WISPS = [
  { x: 110, y: 80,  delay: 0.5,  color: "#c088b0" },
  { x: 190, y: 55,  delay: 0.56, color: "#d0a0c0" },
  { x: 270, y: 70,  delay: 0.62, color: "#c088b0" },
  { x: 150, y: 110, delay: 0.68, color: "#d8b0c8" },
  { x: 240, y: 100, delay: 0.74, color: "#c088b0" },
];

const DUST_CONFIG = {
  count: 20,
  bounds: { x: 100, y: 30, width: 200, height: 130 },
  colors: ["#e0c8d8", "#c088b0", "#d8b8c8", "#c898b8"],
  sizeRange: [0.3, 0.8] as [number, number],
  speedRange: [1, 3] as [number, number],
  driftX: 0.5,
  driftY: -2,
  lifeRange: [5, 10] as [number, number],
};

function LibraryScene({ progress: p }: SceneProps) {
  const dustParticles = useParticles(DUST_CONFIG, p > 0.15);
  const chamberH = 280 - p * 10;
  const chamberS = 12 + p * 28;
  const chamberL = 5 + p * 14;

  const openP = sub(p, 0.05, 0.42);
  const spread = openP;
  const pageLightP = sub(p, 0.15, 0.35);
  const crystalP = sub(p, 0.08, 0.4);
  const wordP = sub(p, 0.5, 0.5);

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="pageGlow" radius={10} color="#c088b0" opacity={0.4} />
        <GlowFilter id="crystalGlow" radius={6} color="#c088b0" opacity={0.5} />
        <GlowFilter id="runeGlow" radius={4} color="#d8a8c8" opacity={0.5} />
        <GlowFilter id="bookAltarGlow" radius={4} color="#c088b0" opacity={0.3} />

        <linearGradient id="libSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${chamberH}, ${chamberS}%, ${chamberL}%)`} />
          <stop offset="100%" stopColor={`hsl(${chamberH + 5}, ${chamberS - 3}%, ${chamberL + 3}%)`} />
        </linearGradient>

        <radialGradient id="bookLight" cx="50%" cy="58%" r="40%">
          <stop offset="0%" stopColor="#e0c0d8" stopOpacity={pageLightP * 0.22} />
          <stop offset="50%" stopColor="#c088b0" stopOpacity={pageLightP * 0.08} />
          <stop offset="100%" stopColor="#c088b0" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="archGlow" cx="50%" cy="45%" r="35%">
          <stop offset="0%" stopColor="#c088b0" stopOpacity={p * 0.08} />
          <stop offset="100%" stopColor="#c088b0" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── CHAMBER ── */}
      <rect width="400" height="250" fill="url(#libSky)" />

      {/* ── VAULT CEILING ── */}
      <path d={VAULT}
        fill={`hsl(${chamberH - 5}, ${chamberS - 2}%, ${Math.max(2, chamberL - 2)}%)`} />

      {/* Vault ribs */}
      {[
        "M200 2 L200 14",
        "M130 10 C155 12, 178 14, 200 14",
        "M270 10 C245 12, 222 14, 200 14",
        "M80 28 C120 20, 160 15, 200 14",
        "M320 28 C280 20, 240 15, 200 14",
      ].map((d, i) => (
        <path key={`rib${i}`} d={d} fill="none"
          stroke={`hsl(${chamberH}, ${chamberS}%, ${chamberL + 5}%)`}
          strokeWidth={1.2} opacity={0.15 + p * 0.15} />
      ))}

      {/* ── WALLS ── */}
      <path d={WALL_LEFT}
        fill={`hsl(${chamberH}, ${chamberS - 2}%, ${chamberL + 1}%)`} />
      <path d={WALL_RIGHT}
        fill={`hsl(${chamberH}, ${chamberS - 2}%, ${chamberL + 1}%)`} />

      {/* Wall texture — stone lines */}
      {[45, 60, 75, 90, 105, 120, 135, 150, 165].map((y, i) => (
        <g key={`wt${i}`} opacity={0.1 + p * 0.1}>
          <path d={`M0 ${y + i * 0.5} C12 ${y + 1}, 30 ${y - 1}, ${64 - i * 2} ${y + 2}`}
            fill="none" stroke={`hsl(${chamberH}, 5%, ${chamberL + 5}%)`} strokeWidth="0.6" />
          <path d={`M400 ${y + i * 0.5} C388 ${y + 1}, 370 ${y - 1}, ${336 + i * 2} ${y + 2}`}
            fill="none" stroke={`hsl(${chamberH}, 5%, ${chamberL + 5}%)`} strokeWidth="0.6" />
        </g>
      ))}

      {/* ── ARCHWAY — frames the central space ── */}
      <path d={ARCHWAY}
        fill={`hsl(${chamberH + 2}, ${chamberS + 5}%, ${Math.max(2, chamberL - 1)}%)`} />
      <path d={ARCHWAY}
        fill="none" stroke={`hsl(${chamberH - 5}, ${chamberS + 3}%, ${chamberL + 6}%)`}
        strokeWidth={2.5} />
      {/* Glow from within the arch */}
      <rect width="400" height="250" fill="url(#archGlow)" />

      {/* ── BOOK LIGHT from hero tome ── */}
      {pageLightP > 0 && <rect width="400" height="250" fill="url(#bookLight)" />}

      {/* ── CRYSTALS ── */}
      {CRYSTALS.map((c, i) => {
        const cp = sub(crystalP, i * 0.05, 0.3);
        if (cp <= 0) return null;
        const h = c.h * cp;
        const w = 5 + (i % 3) * 2;
        const tipY = c.from === "floor" ? c.baseY - h : c.baseY + h;
        const brightness = 30 + p * 35;
        return (
          <g key={`cr${i}`} opacity={cp * 0.8}>
            <polygon
              points={`${c.x - w / 2},${c.baseY} ${c.x - 1},${tipY} ${c.x + w * 0.3},${tipY + (c.from === "floor" ? 2 : -2)} ${c.x + w / 2},${c.baseY}`}
              fill={`hsl(290, ${25 + p * 25}%, ${brightness}%)`}
              transform={`rotate(${c.angle}, ${c.x}, ${c.baseY})`}
              filter={cp > 0.4 ? "url(#crystalGlow)" : undefined}
            />
            {/* Secondary shard */}
            <polygon
              points={`${c.x + w * 0.15},${c.baseY} ${c.x + w * 0.2},${tipY + (c.from === "floor" ? h * 0.3 : -h * 0.3)} ${c.x + w * 0.45},${c.baseY}`}
              fill={`hsl(300, ${20 + p * 20}%, ${brightness + 8}%)`}
              opacity={0.6}
              transform={`rotate(${c.angle + 4}, ${c.x}, ${c.baseY})`}
            />
          </g>
        );
      })}

      {/* ── FLOOR ── */}
      <path d={`M64 185 C120 180, 170 178, 200 177 C230 178, 280 180, 336 185 L336 250 L64 250 Z`}
        fill={`hsl(${chamberH + 5}, ${chamberS - 4}%, ${chamberL - 1}%)`} />
      {/* Floor tile lines */}
      {[190, 200, 215, 232].map((y, i) => (
        <path key={`fl${i}`}
          d={`M${70 + i * 5} ${y} C${150 - i * 3} ${y + 1}, ${250 + i * 3} ${y + 1}, ${330 - i * 5} ${y}`}
          fill="none" stroke={`hsl(${chamberH}, 4%, ${chamberL + 3}%)`}
          strokeWidth="0.4" opacity={0.12 + p * 0.08} />
      ))}

      {/* ── BOOK ALTARS — sacred pedestals with individual books ── */}
      {BOOK_ALTARS.map((a, i) => {
        const ap = sub(p, a.delay, 0.2);
        const glowing = pageLightP > 0;
        return (
          <g key={`altar${i}`} opacity={0.4 + ap * 0.6}>
            {/* Stone pedestal */}
            <path d={`M${a.x - 8} ${a.y + 10} L${a.x - 5} ${a.y} L${a.x + 5} ${a.y} L${a.x + 8} ${a.y + 10} Z`}
              fill={`hsl(${chamberH + 3}, ${chamberS - 5}%, ${chamberL + 3}%)`} />
            {/* Pedestal top */}
            <ellipse cx={a.x} cy={a.y} rx={7} ry={2}
              fill={`hsl(${chamberH + 2}, ${chamberS - 3}%, ${chamberL + 5}%)`} />
            {/* The sacred book */}
            <rect x={a.x - a.bookW / 2} y={a.y - a.bookH - 1} width={a.bookW} height={a.bookH}
              fill={a.bookColor} opacity={0.6 + ap * 0.4} rx={0.5}
              filter={glowing ? "url(#bookAltarGlow)" : undefined} />
            {/* Book spine line */}
            <line x1={a.x} y1={a.y - a.bookH - 1} x2={a.x} y2={a.y - 1}
              stroke="#e8d8c0" strokeWidth={0.3} opacity={0.3 + ap * 0.2} />
            {/* Subtle glow when awakened */}
            {glowing && (
              <circle cx={a.x} cy={a.y - a.bookH / 2} r={6}
                fill={a.bookColor} opacity={pageLightP * 0.06} />
            )}
          </g>
        );
      })}

      {/* ── HERO PEDESTAL — center, larger ── */}
      <path d="M178 165 C180 158, 188 154, 200 152 C212 154, 220 158, 222 165 L225 175 L175 175 Z"
        fill={`hsl(${chamberH + 3}, ${chamberS - 3}%, ${chamberL + 5}%)`} />
      <ellipse cx="200" cy="152" rx="24" ry="5"
        fill={`hsl(${chamberH + 2}, ${chamberS - 2}%, ${chamberL + 7}%)`} />

      {/* ── HERO TOME — taller-than-wide portrait book at every stage ──
           Real sacred books are portrait; the old squat spread-out
           proportions read as a diagram, not a tome. Spine h=58 with
           pages extending h=56; max spread width ~50 keeps the footprint
           within the pedestal. */}
      <g>
        {/* Spine */}
        <rect x="197" y="95" width="6" height="58" rx="1"
          fill={`hsl(280, ${15 + p * 12}%, ${12 + p * 8}%)`} />
        {/* Spine gold detail */}
        <line x1="200" y1="99" x2="200" y2="149"
          stroke={`hsl(40, ${10 + p * 15}%, ${16 + p * 8}%)`}
          strokeWidth="0.6" opacity={0.3 + p * 0.3} />

        {/* LEFT PAGE SPREAD */}
        {spread > 0.05 && (() => {
          const pageW = spread * 22;
          const bookY = 96;
          const bookH = 56;
          return (
            <g>
              <rect x={197 - pageW - 2} y={bookY} width={pageW + 2} height={bookH} rx="1"
                fill={`hsl(280, ${12 + p * 8}%, ${10 + p * 5}%)`} opacity={spread * 0.8} />
              <rect x={197 - pageW} y={bookY + 1} width={pageW} height={bookH - 2} rx="0.5"
                fill="#e8e0d0" opacity={spread * 0.7} />
              {spread > 0.3 && [0, 5, 10, 15, 20, 25, 30, 35, 40, 45].map((dy) => (
                <line key={`tl${dy}`} x1={197 - pageW + 2} y1={bookY + 5 + dy}
                  x2={197 - pageW + pageW * 0.8} y2={bookY + 5 + dy}
                  stroke="#c088b0" strokeWidth="0.3" opacity={spread * 0.3 + wordP * 0.2} />
              ))}
            </g>
          );
        })()}

        {/* RIGHT PAGE SPREAD */}
        {spread > 0.05 && (() => {
          const pageW = spread * 22;
          const bookY = 96;
          const bookH = 56;
          return (
            <g>
              <rect x="203" y={bookY} width={pageW + 2} height={bookH} rx="1"
                fill={`hsl(280, ${12 + p * 8}%, ${10 + p * 5}%)`} opacity={spread * 0.8} />
              <rect x="203" y={bookY + 1} width={pageW} height={bookH - 2} rx="0.5"
                fill="#ede5d8" opacity={spread * 0.7} />
              {spread > 0.3 && [0, 5, 10, 15, 20, 25, 30, 35, 40, 45].map((dy) => (
                <line key={`tr${dy}`} x1="206" y1={bookY + 5 + dy}
                  x2={203 + pageW * 0.8} y2={bookY + 5 + dy}
                  stroke="#c088b0" strokeWidth="0.3" opacity={spread * 0.3 + wordP * 0.2} />
              ))}
            </g>
          );
        })()}

        {/* Book glow — portrait halo matching the new aspect */}
        {spread > 0.2 && (
          <ellipse cx="200" cy="124" rx={22 * spread} ry={32 * spread}
            fill="#c088b0" opacity={spread * 0.08} filter="url(#pageGlow)" />
        )}
      </g>

      {/* ── FLOATING BOOKS — lift off altars and orbit ── */}
      {FLOATING_BOOKS.map((fb, i) => {
        const fp = sub(p, fb.delay, 0.2);
        if (fp <= 0) return null;
        const x = fb.startX + (fb.endX - fb.startX) * fp;
        const y = fb.startY + (fb.endY - fb.startY) * fp;
        const rot = fb.rot * fp;
        return (
          <g key={`fb${i}`} transform={`translate(${x}, ${y}) rotate(${rot})`}
            opacity={0.5 + fp * 0.5}>
            <rect x={-7} y={-5} width={14} height={10} rx={1}
              fill={fb.color} filter={fp > 0.3 ? "url(#bookAltarGlow)" : undefined} />
            <rect x={-5.5} y={-4} width={11} height={8} rx={0.5}
              fill="#e8d8c0" opacity={0.5} />
            <line x1={0} y1={-5} x2={0} y2={5}
              stroke="#e8d8c0" strokeWidth={0.3} opacity={0.3} />
          </g>
        );
      })}

      {/* ── RISING RUNES ── */}
      {RUNE_FLOATERS.map((rf, i) => {
        const rp = sub(p, rf.delay, 0.1);
        if (rp <= 0) return null;
        const rune = RUNES[rf.runeIdx];
        const y = rf.startY + (rf.endY - rf.startY) * rp;
        const x = rf.x + rf.drift * rp;
        const scale = 0.7 + rp * 0.5;
        const fadeIn = Math.min(1, rp * 3);
        const fadeOut = rp > 0.8 ? 1 - (rp - 0.8) / 0.2 : 1;
        return (
          <g key={`rune${i}`} transform={`translate(${x}, ${y}) scale(${scale})`}
            opacity={fadeIn * fadeOut * 0.45}>
            <path d={rune} fill="none" stroke="#d8a8c8" strokeWidth={0.8}
              filter="url(#runeGlow)" />
          </g>
        );
      })}

      {/* ── WISPS ── */}
      {WISPS.map((w, i) => {
        const wp = sub(p, w.delay, 0.15);
        if (wp <= 0) return null;
        const drift = Math.sin(p * Math.PI * 3 + i * 2) * 6;
        const bob = Math.cos(p * Math.PI * 4 + i * 1.5) * 4;
        return (
          <g key={`wisp${i}`}>
            <circle cx={w.x + drift} cy={w.y + bob} r={4}
              fill={w.color} opacity={wp * 0.04} />
            <circle cx={w.x + drift} cy={w.y + bob} r={1.5}
              fill={w.color} opacity={wp * 0.3} />
          </g>
        );
      })}

      {/* ── DUST MOTES — physics-based floating particles ── */}
      {p > 0.15 && <ParticleField particles={dustParticles} opacity={0.15} />}

      {/* ── WARM WASH at high progress ── */}
      {wordP > 0 && (
        <rect width="400" height="250" fill="#c088b0" opacity={wordP * 0.04} />
      )}
    </svg>
  );
}

export default memo(LibraryScene);
