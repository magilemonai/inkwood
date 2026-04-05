import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── THE WHISPERING LIBRARY ──────────────────────────────
// A vast underground library cavern. Shelves of books line the
// walls. Crystals grow from floor and ceiling. In the center,
// a reading pedestal holds a single ancient tome.
//
// Phrase 1 "open, sleeping pages": The tome's pages spread apart
// like wings, revealing golden light within. Crystals brighten.
// The cavern illuminates with warm mauve light.
//
// Phrase 2 "speak again, forgotten words": Rune symbols rise off
// the open tome and float upward. The room fills with golden
// dust motes. Books on shelves begin to glow faintly in sympathy.

// ─── HAND-CRAFTED PATHS ──────────────────────────────────

/** Cavern ceiling — Gothic pointed arch */
const VAULT = `
  M0 0 L0 65 C25 55, 55 40, 85 30
  C115 22, 145 14, 175 8
  C188 4, 200 2, 212 4
  C230 8, 260 14, 290 22
  C320 30, 350 40, 375 55
  L400 65 L400 0 Z`;

/** Left cavern wall */
const WALL_LEFT = `
  M0 65 C25 55, 45 42, 62 35
  C72 30, 78 32, 82 38
  C86 48, 84 62, 80 80
  C76 100, 72 120, 70 140
  C68 158, 66 172, 65 185
  L64 250 L0 250 Z`;

/** Right cavern wall */
const WALL_RIGHT = `
  M400 65 C375 55, 355 42, 338 35
  C328 30, 322 32, 318 38
  C314 48, 316 62, 320 80
  C324 100, 328 120, 330 140
  C332 158, 334 172, 335 185
  L336 250 L400 250 Z`;

// Bookshelf books — colored spines on left and right walls
const LEFT_BOOKS = [
  { x: 20, h: 24, w: 4, color: "#5a2030" },
  { x: 25, h: 28, w: 3, color: "#2a3a5a" },
  { x: 29, h: 20, w: 5, color: "#3a5a2a" },
  { x: 35, h: 26, w: 3, color: "#5a4a20" },
  { x: 39, h: 30, w: 4, color: "#4a2a5a" },
  { x: 44, h: 22, w: 3, color: "#2a5a4a" },
  { x: 48, h: 26, w: 4, color: "#5a3838" },
  { x: 53, h: 18, w: 3, color: "#384858" },
];

const RIGHT_BOOKS = [
  { x: 345, h: 26, w: 4, color: "#4a2838" },
  { x: 350, h: 22, w: 3, color: "#2a3848" },
  { x: 354, h: 28, w: 4, color: "#384a2a" },
  { x: 359, h: 20, w: 3, color: "#4a3a20" },
  { x: 363, h: 24, w: 4, color: "#3a284a" },
  { x: 368, h: 30, w: 3, color: "#284a3a" },
  { x: 372, h: 22, w: 4, color: "#4a3030" },
  { x: 377, h: 26, w: 3, color: "#303a5a" },
];

// Crystal formations
const CRYSTALS = [
  { x: 55, baseY: 250, h: 22, angle: -6, from: "floor" as const },
  { x: 85, baseY: 250, h: 16, angle: 4, from: "floor" as const },
  { x: 320, baseY: 250, h: 25, angle: 6, from: "floor" as const },
  { x: 350, baseY: 250, h: 18, angle: -4, from: "floor" as const },
  { x: 110, baseY: 0, h: 16, angle: 175, from: "ceil" as const },
  { x: 290, baseY: 0, h: 20, angle: -170, from: "ceil" as const },
];

// Rune symbols that rise from the tome
const RUNES = [
  "M0-4 L2-6 L4-4 M2-6 L2-8",
  "M0-3 C2-5, 4-5, 6-3 C4-1, 2-1, 0-3",
  "M0 0 L3-6 L6 0 L3-2 Z",
  "M1 0 L0-4 L3-6 L6-4 L5 0",
  "M0-3 L3 0 L6-3 L3-6 Z",
  "M3 0 C0-2, 0-5, 3-6 C6-5, 6-2, 3 0",
];

const RUNE_FLOATERS = [
  { x: 168, startY: 140, endY: 30, runeIdx: 0, delay: 0.55, drift: -12 },
  { x: 190, startY: 138, endY: 20, runeIdx: 1, delay: 0.60, drift: 6 },
  { x: 210, startY: 136, endY: 25, runeIdx: 2, delay: 0.65, drift: -4 },
  { x: 232, startY: 140, endY: 35, runeIdx: 3, delay: 0.70, drift: 10 },
  { x: 178, startY: 142, endY: 40, runeIdx: 4, delay: 0.75, drift: -16 },
  { x: 222, startY: 139, endY: 38, runeIdx: 5, delay: 0.78, drift: 14 },
  { x: 200, startY: 135, endY: 15, runeIdx: 0, delay: 0.82, drift: -2 },
  { x: 185, startY: 143, endY: 45, runeIdx: 3, delay: 0.88, drift: -20 },
  { x: 215, startY: 141, endY: 42, runeIdx: 5, delay: 0.92, drift: 18 },
];

function LibraryScene({ progress: p }: SceneProps) {
  // Chamber ambient
  const chamberH = 275 - p * 10;
  const chamberS = 8 + p * 22;
  const chamberL = 4 + p * 12;

  // Book opening — pages spread apart like wings
  const openP = sub(p, 0.05, 0.42);
  // How far pages spread: 0 = closed, 1 = fully open
  const spread = openP;

  // Light from the open book
  const pageLightP = sub(p, 0.15, 0.35);

  // Crystal glow
  const crystalP = sub(p, 0.08, 0.4);

  // Word rising phase
  const wordP = sub(p, 0.5, 0.5);

  // Shelf sympathy glow
  const sympathyP = sub(p, 0.6, 0.3);

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="pageGlow" radius={10} color="#c088b0" opacity={0.4} />
        <GlowFilter id="crystalGlow" radius={6} color="#c088b0" opacity={0.5} />
        <GlowFilter id="runeGlow" radius={4} color="#d8a8c8" opacity={0.5} />

        <linearGradient id="libSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${chamberH}, ${chamberS}%, ${chamberL}%)`} />
          <stop offset="100%" stopColor={`hsl(${chamberH + 5}, ${chamberS - 3}%, ${chamberL + 2}%)`} />
        </linearGradient>

        <radialGradient id="bookLight" cx="50%" cy="58%" r="40%">
          <stop offset="0%" stopColor="#e0c0d8" stopOpacity={pageLightP * 0.18} />
          <stop offset="50%" stopColor="#c088b0" stopOpacity={pageLightP * 0.06} />
          <stop offset="100%" stopColor="#c088b0" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── CHAMBER ── */}
      <rect width="400" height="250" fill="url(#libSky)" />

      {/* ── VAULT CEILING ── */}
      <path d={VAULT}
        fill={`hsl(${chamberH - 5}, ${chamberS - 4}%, ${Math.max(2, chamberL - 2)}%)`} />

      {/* Vault ribs */}
      {[
        "M200 2 C200 6, 200 10, 200 14",
        "M130 10 C155 12, 178 14, 200 14",
        "M270 10 C245 12, 222 14, 200 14",
        "M80 28 C120 20, 160 15, 200 14",
        "M320 28 C280 20, 240 15, 200 14",
      ].map((d, i) => (
        <path key={`rib${i}`} d={d} fill="none"
          stroke={`hsl(${chamberH}, ${chamberS - 2}%, ${chamberL + 4}%)`}
          strokeWidth={1} opacity={0.15 + p * 0.12} />
      ))}

      {/* ── WALLS ── */}
      <path d={WALL_LEFT}
        fill={`hsl(${chamberH}, ${chamberS - 2}%, ${chamberL + 1}%)`} />
      <path d={WALL_RIGHT}
        fill={`hsl(${chamberH}, ${chamberS - 2}%, ${chamberL + 1}%)`} />

      {/* Wall texture */}
      {[55, 80, 105, 130, 155].map((y, i) => (
        <g key={`wl${i}`} opacity={0.08 + p * 0.06}>
          <path d={`M0 ${y + i * 2} C15 ${y + 1}, 35 ${y - 1}, ${60 - i * 2} ${y + 2}`}
            fill="none" stroke={`hsl(${chamberH}, 4%, ${chamberL + 4}%)`} strokeWidth="0.4" />
          <path d={`M400 ${y + i * 2} C385 ${y + 1}, 365 ${y - 1}, ${340 + i * 2} ${y + 2}`}
            fill="none" stroke={`hsl(${chamberH}, 4%, ${chamberL + 4}%)`} strokeWidth="0.4" />
        </g>
      ))}

      {/* ── LEFT BOOKSHELF ── */}
      <rect x="15" y="90" width="48" height="100" rx="1"
        fill={`hsl(25, ${20 + p * 8}%, ${6 + p * 4}%)`} />
      {[115, 140, 165].map((sy) => (
        <rect key={sy} x="15" y={sy} width="48" height="2"
          fill={`hsl(25, 18%, ${10 + p * 4}%)`} />
      ))}
      {LEFT_BOOKS.map((b, i) => (
        <rect key={`lb${i}`} x={b.x} y={115 - b.h} width={b.w} height={b.h}
          fill={b.color} opacity={0.4 + p * 0.4 + (sympathyP > 0 ? sympathyP * 0.15 : 0)} rx="0.3" />
      ))}

      {/* ── RIGHT BOOKSHELF ── */}
      <rect x="338" y="90" width="48" height="100" rx="1"
        fill={`hsl(25, ${20 + p * 8}%, ${6 + p * 4}%)`} />
      {[115, 140, 165].map((sy) => (
        <rect key={`rs${sy}`} x="338" y={sy} width="48" height="2"
          fill={`hsl(25, 18%, ${10 + p * 4}%)`} />
      ))}
      {RIGHT_BOOKS.map((b, i) => (
        <rect key={`rb${i}`} x={b.x} y={115 - b.h} width={b.w} height={b.h}
          fill={b.color} opacity={0.4 + p * 0.4 + (sympathyP > 0 ? sympathyP * 0.15 : 0)} rx="0.3" />
      ))}

      {/* ── BOOK LIGHT ── */}
      {pageLightP > 0 && <rect width="400" height="250" fill="url(#bookLight)" />}

      {/* ── CRYSTALS ── */}
      {CRYSTALS.map((c, i) => {
        const cp = sub(crystalP, i * 0.06, 0.3);
        if (cp <= 0) return null;
        const h = c.h * cp;
        const w = 5 + (i % 3) * 2;
        const tipY = c.from === "floor" ? c.baseY - h : c.baseY + h;
        const brightness = 30 + p * 30;
        return (
          <g key={`cr${i}`} opacity={cp * 0.8}>
            <polygon
              points={`${c.x - w / 2},${c.baseY} ${c.x},${tipY} ${c.x + w / 2},${c.baseY}`}
              fill={`hsl(290, ${25 + p * 20}%, ${brightness}%)`}
              transform={`rotate(${c.angle}, ${c.x}, ${c.baseY})`}
              filter={cp > 0.5 ? "url(#crystalGlow)" : undefined}
            />
          </g>
        );
      })}

      {/* ── FLOOR ── */}
      <path d={`M64 185 C120 180, 170 178, 200 177 C230 178, 280 180, 336 185 L336 250 L64 250 Z`}
        fill={`hsl(${chamberH + 5}, ${chamberS - 4}%, ${chamberL - 1}%)`} />

      {/* ── PEDESTAL ── */}
      <path d="M178 165 C180 158, 188 154, 200 152 C212 154, 220 158, 222 165 L225 175 L175 175 Z"
        fill={`hsl(${chamberH + 3}, ${chamberS - 3}%, ${chamberL + 4}%)`} />
      <ellipse cx="200" cy="152" rx="24" ry="5"
        fill={`hsl(${chamberH + 2}, ${chamberS - 2}%, ${chamberL + 6}%)`} />

      {/* ── THE HERO TOME ── */}
      <g>
        {/* Book spine — always visible at center */}
        <rect x="197" y="140" width="6" height="14" rx="1"
          fill={`hsl(280, ${15 + p * 10}%, ${12 + p * 6}%)`} />

        {/* LEFT PAGE SPREAD — fan out to the left as book opens */}
        {spread > 0.05 && (() => {
          // Pages spread: closed (width 0) → fully open (40px wide)
          const pageW = spread * 40;
          const pageH = 12;
          const baseX = 197;
          const baseY = 141;
          return (
            <g>
              {/* Page surface — cream colored */}
              <rect x={baseX - pageW} y={baseY + 1} width={pageW} height={pageH}
                fill="#e8e0d0" opacity={spread * 0.7} rx="0.5" />
              {/* Text lines on page */}
              {spread > 0.3 && [0, 3, 6, 9].map((dy) => (
                <line key={`tl${dy}`}
                  x1={baseX - pageW + 3} y1={baseY + 3 + dy}
                  x2={baseX - pageW + pageW * 0.7} y2={baseY + 3 + dy}
                  stroke="#c088b0" strokeWidth="0.3"
                  opacity={spread * 0.3 + wordP * 0.2} />
              ))}
              {/* Cover — darker, behind the page */}
              <rect x={baseX - pageW - 2} y={baseY} width={pageW + 2} height={pageH + 2}
                fill={`hsl(280, ${12 + p * 8}%, ${10 + p * 5}%)`}
                opacity={spread * 0.8} rx="1" />
              {/* Cover emboss */}
              <rect x={baseX - pageW} y={baseY + 2} width={pageW - 2} height={pageH - 2}
                fill="none" stroke={`hsl(40, ${8 + p * 10}%, ${14 + p * 6}%)`}
                strokeWidth="0.4" opacity={spread * 0.25} rx="0.5" />
            </g>
          );
        })()}

        {/* RIGHT PAGE SPREAD — mirror */}
        {spread > 0.05 && (() => {
          const pageW = spread * 40;
          const pageH = 12;
          const baseX = 203;
          const baseY = 141;
          return (
            <g>
              <rect x={baseX} y={baseY + 1} width={pageW} height={pageH}
                fill="#ede5d8" opacity={spread * 0.7} rx="0.5" />
              {spread > 0.3 && [0, 3, 6, 9].map((dy) => (
                <line key={`tr${dy}`}
                  x1={baseX + 3} y1={baseY + 3 + dy}
                  x2={baseX + pageW * 0.7} y2={baseY + 3 + dy}
                  stroke="#c088b0" strokeWidth="0.3"
                  opacity={spread * 0.3 + wordP * 0.2} />
              ))}
              <rect x={baseX} y={baseY} width={pageW + 2} height={pageH + 2}
                fill={`hsl(280, ${12 + p * 8}%, ${10 + p * 5}%)`}
                opacity={spread * 0.8} rx="1" />
              <rect x={baseX + 2} y={baseY + 2} width={pageW - 2} height={pageH - 2}
                fill="none" stroke={`hsl(40, ${8 + p * 10}%, ${14 + p * 6}%)`}
                strokeWidth="0.4" opacity={spread * 0.25} rx="0.5" />
            </g>
          );
        })()}

        {/* Golden light from within the open book */}
        {spread > 0.2 && (
          <ellipse cx="200" cy="148" rx={25 * spread} ry={8 * spread}
            fill="#c088b0" opacity={spread * 0.05}
            filter="url(#pageGlow)" />
        )}
      </g>

      {/* ── RISING RUNES — words lift off the open tome ── */}
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

      {/* ── DUST MOTES — catching the book light ── */}
      {pageLightP > 0 && Array.from({ length: 12 }).map((_, i) => {
        const px = 120 + (i * 29) % 160;
        const baseY = 50 + (i * 37) % 100;
        const drift = Math.sin(p * Math.PI * 2 + i * 1.1) * 4;
        const rise = p * 15 * ((i % 3) / 3);
        const op = pageLightP * 0.1 * (1 - (i % 3) * 0.2);
        return (
          <circle key={`dust${i}`} cx={px + drift} cy={baseY - rise}
            r={0.4 + (i % 3) * 0.2}
            fill={i % 3 === 0 ? "#e0c8d8" : "#c088b0"} opacity={op} />
        );
      })}

      {/* ── CHAMBER WARM WASH ── */}
      {wordP > 0 && (
        <rect width="400" height="250" fill="#c088b0"
          opacity={wordP * 0.03} />
      )}
    </svg>
  );
}

export default memo(LibraryScene);
