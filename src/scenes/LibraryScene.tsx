import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── THE WHISPERING LIBRARY ──────────────────────────────
// A single enormous tome dominates the scene. At p=0, the book
// lies closed on a stone pedestal in a dark vaulted chamber.
//
// Phrase 1 "open, sleeping pages": The book opens — covers spread,
// pages fan out, warm mauve light spills from within the pages,
// illuminating the chamber walls.
//
// Phrase 2 "speak again, forgotten words": Letters, runes, and
// symbols rise off the open pages and float upward like embers.
// The words come alive. The chamber fills with soft light.

// ─── HAND-CRAFTED PATHS ──────────────────────────────────

/** Vaulted ceiling — Gothic pointed arch */
const VAULT = `
  M0 0 L0 80 C20 70, 50 50, 80 35
  C110 22, 140 12, 170 6
  C185 2, 200 0, 215 2
  C230 4, 260 12, 290 22
  C320 35, 350 50, 380 70
  L400 80 L400 0 Z`;

/** Left wall — stone with alcoves */
const WALL_LEFT = `
  M0 80 C20 70, 40 55, 60 45
  C75 38, 82 35, 85 38
  C88 42, 85 55, 82 70
  C78 90, 72 110, 68 130
  C65 150, 62 165, 60 180
  L58 250 L0 250 Z`;

/** Right wall */
const WALL_RIGHT = `
  M400 80 C380 70, 360 55, 340 45
  C325 38, 318 35, 315 38
  C312 42, 315 55, 318 70
  C322 90, 328 110, 332 130
  C335 150, 338 165, 340 180
  L342 250 L400 250 Z`;

/** Pedestal — wide stone base */
const PEDESTAL = `
  M145 195 C148 188, 155 183, 165 180
  C180 177, 195 176, 200 175
  C205 176, 220 177, 235 180
  C245 183, 252 188, 255 195
  L258 210 C255 215, 248 218, 240 220
  L160 220 C152 218, 145 215, 142 210
  L145 195 Z`;

/** Pedestal base — wider */
const PEDESTAL_BASE = `
  M135 218 C140 215, 150 213, 160 212
  L240 212 C250 213, 260 215, 265 218
  L268 228 C265 232, 255 235, 240 236
  L160 236 C145 235, 135 232, 132 228
  L135 218 Z`;

// Book cover paths — these morph from closed to open
// Closed: flat rectangle. Open: covers spread wide with perspective.

// Runes/symbols that rise off the pages
const RUNES = [
  { path: "M0 0 L2 -5 L4 0 M2 -5 L2 -8", label: "rune1" },           // arrow up
  { path: "M0 -2 C2 -5, 4 -5, 6 -2 C4 1, 2 1, 0 -2", label: "rune2" }, // eye
  { path: "M0 0 L3 -6 L6 0 L3 -2 Z", label: "rune3" },               // diamond
  { path: "M1 0 L0 -4 L3 -6 L6 -4 L5 0", label: "rune4" },           // crown
  { path: "M0 -3 L3 0 L6 -3 L3 -6 Z", label: "rune5" },              // rotated square
  { path: "M3 0 C0 -2, 0 -5, 3 -6 C6 -5, 6 -2, 3 0", label: "rune6" }, // teardrop
  { path: "M0 0 L2 -3 L4 0 M1 -1.5 L3 -1.5", label: "rune7" },       // triangle cross
  { path: "M0 -3 C1 -6, 5 -6, 6 -3 C5 0, 1 0, 0 -3", label: "rune8" }, // oval
];

// Floating positions for runes rising off pages
const RUNE_FLOATERS = [
  { x: 160, startY: 165, endY: 40,  runeIdx: 0, delay: 0.55, drift: -15 },
  { x: 185, startY: 162, endY: 25,  runeIdx: 1, delay: 0.60, drift: 8 },
  { x: 210, startY: 160, endY: 30,  runeIdx: 2, delay: 0.65, drift: -5 },
  { x: 235, startY: 163, endY: 45,  runeIdx: 3, delay: 0.70, drift: 12 },
  { x: 175, startY: 168, endY: 55,  runeIdx: 4, delay: 0.75, drift: -20 },
  { x: 225, startY: 166, endY: 50,  runeIdx: 5, delay: 0.78, drift: 18 },
  { x: 195, startY: 164, endY: 20,  runeIdx: 6, delay: 0.82, drift: -3 },
  { x: 200, startY: 160, endY: 35,  runeIdx: 7, delay: 0.85, drift: 6 },
  { x: 150, startY: 170, endY: 60,  runeIdx: 0, delay: 0.88, drift: -25 },
  { x: 248, startY: 167, endY: 65,  runeIdx: 2, delay: 0.90, drift: 22 },
];

function LibraryScene({ progress: p }: SceneProps) {
  // Chamber ambient — very dark purple → warmer mauve
  const chamberH = 275 - p * 10;
  const chamberS = 8 + p * 20;
  const chamberL = 4 + p * 10;

  // Book opening — the key animation
  // At p=0: book is closed (covers together). At p=0.5: fully open.
  const openP = sub(p, 0.02, 0.45);
  // Cover spread angle — 0 (closed) to 1 (fully open, 70° each side)
  const spreadAngle = openP * 70;

  // Page light — spills from inside the open book
  const pageLightP = sub(p, 0.15, 0.35);

  // Word rising phase
  const wordP = sub(p, 0.5, 0.5);

  // Final chamber glow
  const glowP = sub(p, 0.8, 0.2);

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="pageGlow" radius={10} color="#c088b0" opacity={0.4} />
        <GlowFilter id="runeGlow" radius={4} color="#d8a8c8" opacity={0.5} />
        <GlowFilter id="tomeGlow" radius={15} color="#e0b0d0" opacity={0.5} />

        <linearGradient id="libSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${chamberH}, ${chamberS}%, ${chamberL}%)`} />
          <stop offset="100%" stopColor={`hsl(${chamberH + 5}, ${chamberS - 3}%, ${chamberL + 2}%)`} />
        </linearGradient>

        {/* Light from open book */}
        <radialGradient id="bookLight" cx="50%" cy="70%" r="45%">
          <stop offset="0%" stopColor="#e0c0d8" stopOpacity={pageLightP * 0.2} />
          <stop offset="40%" stopColor="#c088b0" stopOpacity={pageLightP * 0.08} />
          <stop offset="100%" stopColor="#c088b0" stopOpacity={0} />
        </radialGradient>

        {/* Final warm wash */}
        <radialGradient id="chamberWash" cx="50%" cy="68%" r="55%">
          <stop offset="0%" stopColor="#d8b0c8" stopOpacity={glowP * 0.12} />
          <stop offset="50%" stopColor="#c088b0" stopOpacity={glowP * 0.05} />
          <stop offset="100%" stopColor="#c088b0" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── CHAMBER BACKGROUND ── */}
      <rect width="400" height="250" fill="url(#libSky)" />

      {/* ── VAULTED CEILING ── */}
      <path d={VAULT}
        fill={`hsl(${chamberH - 5}, ${chamberS - 4}%, ${Math.max(2, chamberL - 2)}%)`} />

      {/* Vault ribs — Gothic stone lines */}
      {[
        "M200 0 C200 5, 200 10, 200 15",
        "M140 5 C155 12, 175 18, 200 15",
        "M260 5 C245 12, 225 18, 200 15",
        "M80 30 C120 20, 160 14, 200 15",
        "M320 30 C280 20, 240 14, 200 15",
      ].map((d, i) => (
        <path key={`rib${i}`} d={d} fill="none"
          stroke={`hsl(${chamberH}, ${chamberS - 2}%, ${chamberL + 4}%)`}
          strokeWidth={1.2} opacity={0.2 + p * 0.15} />
      ))}

      {/* ── WALLS ── */}
      <path d={WALL_LEFT}
        fill={`hsl(${chamberH}, ${chamberS - 2}%, ${chamberL + 1}%)`} />
      <path d={WALL_RIGHT}
        fill={`hsl(${chamberH}, ${chamberS - 2}%, ${chamberL + 1}%)`} />

      {/* Wall stone lines */}
      {[60, 90, 120, 150, 180].map((y, i) => (
        <g key={`wl${i}`} opacity={0.1 + p * 0.08}>
          <path d={`M0 ${y + i * 2} C15 ${y + 1}, 35 ${y - 1}, ${62 - i * 2} ${y + 3}`}
            fill="none" stroke={`hsl(${chamberH}, 5%, ${chamberL + 5}%)`} strokeWidth="0.5" />
          <path d={`M400 ${y + i * 2} C385 ${y + 1}, 365 ${y - 1}, ${338 + i * 2} ${y + 3}`}
            fill="none" stroke={`hsl(${chamberH}, 5%, ${chamberL + 5}%)`} strokeWidth="0.5" />
        </g>
      ))}

      {/* ── FLOOR ── */}
      <path d={`
        M58 195 C100 190, 150 188, 200 187
        C250 188, 300 190, 342 195
        L342 250 L58 250 Z
      `} fill={`hsl(${chamberH + 5}, ${chamberS - 3}%, ${chamberL - 1}%)`} />

      {/* Floor tile lines */}
      {[200, 210, 222, 236].map((y, i) => (
        <path key={`fl${i}`}
          d={`M${70 + i * 5} ${y} C${150 - i * 3} ${y + 1}, ${250 + i * 3} ${y + 1}, ${330 - i * 5} ${y}`}
          fill="none" stroke={`hsl(${chamberH}, 4%, ${chamberL + 3}%)`}
          strokeWidth="0.4" opacity={0.15 + p * 0.1} />
      ))}

      {/* ── BOOK LIGHT — spills upward from open book ── */}
      {pageLightP > 0 && (
        <rect width="400" height="250" fill="url(#bookLight)" />
      )}

      {/* ── PEDESTAL ── */}
      <path d={PEDESTAL_BASE}
        fill={`hsl(${chamberH + 5}, ${chamberS - 4}%, ${chamberL + 2}%)`} />
      <path d={PEDESTAL}
        fill={`hsl(${chamberH + 3}, ${chamberS - 3}%, ${chamberL + 4}%)`} />

      {/* ── THE TOME — the main event ── */}
      <g>
        {/* Book spine — always visible, center */}
        <rect x="196" y="168" width="8" height="20" rx="1"
          fill={`hsl(280, ${15 + p * 10}%, ${12 + p * 6}%)`} />
        {/* Spine detail */}
        <line x1="200" y1="170" x2="200" y2="186"
          stroke={`hsl(40, ${10 + p * 15}%, ${18 + p * 8}%)`}
          strokeWidth="0.5" opacity={0.4 + p * 0.3} />

        {/* LEFT COVER — rotates open */}
        <g transform={`translate(196, 168)`}>
          <g transform={`rotate(${-spreadAngle}, 0, 10)`}>
            {/* Cover face */}
            <path d={`
              M0 0 C-2 -1, -42 -2, -48 0
              C-50 3, -50 17, -48 20
              C-42 22, -2 21, 0 20 Z
            `} fill={`hsl(280, ${12 + p * 8}%, ${10 + p * 5}%)`} />
            {/* Cover embossing */}
            <path d={`
              M-5 3 C-10 2, -38 2, -43 3
              C-44 5, -44 15, -43 17
              C-38 18, -10 18, -5 17 Z
            `} fill="none"
              stroke={`hsl(40, ${10 + p * 12}%, ${16 + p * 8}%)`}
              strokeWidth="0.5" opacity={0.3 + p * 0.2} />
            {/* Corner details */}
            <circle cx="-6" cy="4" r="1.5"
              fill={`hsl(40, ${8 + p * 10}%, ${14 + p * 6}%)`} opacity={0.3 + p * 0.2} />
            <circle cx="-42" cy="4" r="1.5"
              fill={`hsl(40, ${8 + p * 10}%, ${14 + p * 6}%)`} opacity={0.3 + p * 0.2} />
            {/* Pages visible from side when opening */}
            {openP > 0.1 && (
              <rect x="-45" y="2" width="42" height="16" rx="0.5"
                fill="#e8d8d0" opacity={openP * 0.6} />
            )}
          </g>
        </g>

        {/* RIGHT COVER — rotates open other direction */}
        <g transform={`translate(204, 168)`}>
          <g transform={`rotate(${spreadAngle}, 0, 10)`}>
            <path d={`
              M0 0 C2 -1, 42 -2, 48 0
              C50 3, 50 17, 48 20
              C42 22, 2 21, 0 20 Z
            `} fill={`hsl(280, ${12 + p * 8}%, ${10 + p * 5}%)`} />
            <path d={`
              M5 3 C10 2, 38 2, 43 3
              C44 5, 44 15, 43 17
              C38 18, 10 18, 5 17 Z
            `} fill="none"
              stroke={`hsl(40, ${10 + p * 12}%, ${16 + p * 8}%)`}
              strokeWidth="0.5" opacity={0.3 + p * 0.2} />
            <circle cx="6" cy="4" r="1.5"
              fill={`hsl(40, ${8 + p * 10}%, ${14 + p * 6}%)`} opacity={0.3 + p * 0.2} />
            <circle cx="42" cy="4" r="1.5"
              fill={`hsl(40, ${8 + p * 10}%, ${14 + p * 6}%)`} opacity={0.3 + p * 0.2} />
            {openP > 0.1 && (
              <rect x="3" y="2" width="42" height="16" rx="0.5"
                fill="#e8d8d0" opacity={openP * 0.6} />
            )}
          </g>
        </g>

        {/* OPEN PAGES — visible once book is opening */}
        {openP > 0.3 && (() => {
          const pp = sub(openP, 0.3, 0.7);
          return (
            <g opacity={pp}>
              {/* Left page */}
              <rect x="155" y="170" width="42" height="16" rx="1"
                fill="#e8e0d8" opacity={pp * 0.7} />
              {/* Right page */}
              <rect x="203" y="170" width="42" height="16" rx="1"
                fill="#ede5dd" opacity={pp * 0.7} />
              {/* Page text lines — left */}
              {[173, 176, 179, 182].map((y, i) => (
                <line key={`tl${i}`} x1="159" y1={y} x2={185 - i * 3} y2={y}
                  stroke="#c088b0" strokeWidth="0.4"
                  opacity={pp * (0.2 + wordP * 0.3)} />
              ))}
              {/* Page text lines — right */}
              {[173, 176, 179, 182].map((y, i) => (
                <line key={`tr${i}`} x1="207" y1={y} x2={233 - i * 3} y2={y}
                  stroke="#c088b0" strokeWidth="0.4"
                  opacity={pp * (0.2 + wordP * 0.3)} />
              ))}
              {/* Center illustration — a rune circle on the pages */}
              <circle cx="200" cy="178" r={5 * pp}
                fill="none" stroke="#c088b0"
                strokeWidth="0.5" opacity={pp * 0.3} />
              <circle cx="200" cy="178" r={3 * pp}
                fill="#c088b0" opacity={pp * 0.06} />
              {/* Page glow */}
              <ellipse cx="200" cy="178" rx="30" ry="12"
                fill="#e0c0d8" opacity={pp * 0.04}
                filter="url(#pageGlow)" />
            </g>
          );
        })()}

        {/* Tome glow halo */}
        {openP > 0.2 && (
          <ellipse cx="200" cy="178" rx={35 * openP} ry={15 * openP}
            fill="#c088b0" opacity={openP * 0.06}
            filter="url(#tomeGlow)" />
        )}
      </g>

      {/* ── RISING RUNES — words lift off pages and float upward ── */}
      {RUNE_FLOATERS.map((rf, i) => {
        const rp = sub(p, rf.delay, 0.12);
        if (rp <= 0) return null;
        const rune = RUNES[rf.runeIdx];
        const y = rf.startY + (rf.endY - rf.startY) * rp;
        const x = rf.x + rf.drift * rp;
        const scale = 0.8 + rp * 0.4;
        const fadeIn = Math.min(1, rp * 3);
        const fadeOut = rp > 0.8 ? 1 - (rp - 0.8) / 0.2 : 1;
        const opacity = fadeIn * fadeOut * 0.5;
        return (
          <g key={`rune${i}`} transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
            <path d={rune.path}
              fill="none" stroke="#d8a8c8" strokeWidth={0.8}
              filter="url(#runeGlow)" />
          </g>
        );
      })}

      {/* ── WALL ALCOVE BOOKS — small bookshelves in wall niches ── */}
      {openP > 0.3 && (() => {
        const bp = sub(openP, 0.3, 0.5);
        return (
          <g opacity={bp * 0.5}>
            {/* Left alcove */}
            <rect x="62" y="82" width="18" height="35" rx="1"
              fill={`hsl(${chamberH}, ${chamberS - 3}%, ${chamberL - 1}%)`} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={`lab${i}`} x={64 + i * 2.5} y={84} width={2} height={12 + (i % 3) * 3}
                fill={["#5a2030", "#2a3a5a", "#3a5a2a", "#5a4a20", "#4a2a5a", "#2a5a4a"][i]}
                rx="0.3" />
            ))}
            {/* Right alcove */}
            <rect x="320" y="82" width="18" height="35" rx="1"
              fill={`hsl(${chamberH}, ${chamberS - 3}%, ${chamberL - 1}%)`} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={`rab${i}`} x={322 + i * 2.5} y={84} width={2} height={10 + (i % 3) * 4}
                fill={["#4a2838", "#2a3848", "#384a2a", "#4a3a20", "#3a284a", "#284a3a"][i]}
                rx="0.3" />
            ))}
          </g>
        );
      })()}

      {/* ── CHAMBER WARM WASH — final glow ── */}
      {glowP > 0 && (
        <rect width="400" height="250" fill="url(#chamberWash)" />
      )}

      {/* ── ATMOSPHERIC DUST — catching the book light ── */}
      {pageLightP > 0 && Array.from({ length: 15 }).map((_, i) => {
        const px = 130 + (i * 23) % 140;
        const baseY = 60 + (i * 37) % 120;
        const drift = Math.sin(p * Math.PI * 2 + i * 1.1) * 5;
        const rise = p * 20 * ((i % 4) / 4);
        const size = 0.3 + (i % 3) * 0.2;
        const op = pageLightP * 0.12 * (1 - (i % 3) * 0.2);
        return (
          <circle key={`dust${i}`} cx={px + drift} cy={baseY - rise} r={size}
            fill={i % 3 === 0 ? "#e0c8d8" : "#c088b0"} opacity={op} />
        );
      })}
    </svg>
  );
}

export default memo(LibraryScene);
