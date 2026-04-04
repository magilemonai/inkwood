import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── HAND-CRAFTED PATHS ────────────────────────────────────

/** Window frame — one thick, slightly irregular wooden frame with 4 panes.
 *  The window is the scenic anchor. Cold moonlight → warm amber reflection. */
const WINDOW_FRAME = `
  M52 26 C52 24, 54 22, 58 22 L122 22 C126 22, 128 24, 128 26
  L128 118 C128 120, 126 122, 122 122 L58 122 C54 122, 52 120, 52 118 Z`;
const WINDOW_SILL = `
  M46 118 C46 116, 48 115, 52 115 L128 115 C132 115, 134 116, 134 118
  L134 126 C134 128, 132 129, 128 129 L52 129 C48 129, 46 128, 46 126 Z`;

/** Stone hearth — arched opening, cold and empty.
 *  The story says "the hearth is cold." It stays cold. The candles do the warming. */
const HEARTH_ARCH = `
  M280 190 L280 148 C280 130, 300 118, 320 118
  C340 118, 360 130, 360 148 L360 190 Z`;
const HEARTH_INNER = `
  M288 190 L288 152 C288 138, 304 128, 320 128
  C336 128, 352 138, 352 152 L352 190 Z`;
const HEARTH_MANTEL = `
  M270 145 C270 140, 275 137, 282 137 L358 137 C365 137, 370 140, 370 145
  L370 150 C370 152, 368 153, 366 153 L274 153 C272 153, 270 152, 270 150 Z`;

/** Shelf — slightly bowed, not perfectly straight */
const SHELF = `
  M135 100 C165 98, 210 97, 240 99 L240 103 C210 101, 165 102, 135 104 Z`;

/** Floor-to-wall transition — an irregular line, old cottage */
const FLOOR_LINE = `
  M0 190 C30 189, 60 191, 100 190 C140 189, 180 191, 220 190
  C260 189, 300 191, 340 190 C370 189, 390 190, 400 190`;

// ─── SCENE COMPONENT ───────────────────────────────────────

function CottageScene({ progress: p }: SceneProps) {
  // Color temperature: cold blue-grey → warm amber
  const coldR = 14, coldG = 14, coldB = 20;
  const warmR = 42, warmG = 28, warmB = 16;
  const r = Math.round(coldR + (warmR - coldR) * p);
  const g = Math.round(coldG + (warmG - coldG) * p);
  const b = Math.round(coldB + (warmB - coldB) * p);

  // Candle timing — three candles light during phrase 1
  const c1 = sub(p, 0.06, 0.18);
  const c2 = sub(p, 0.24, 0.18);
  const c3 = sub(p, 0.42, 0.18);

  // Window warmth
  const windowWarm = sub(p, 0.05, 0.55);

  // Second phrase elements
  const steamP = sub(p, 0.52, 0.18);
  const catP = sub(p, 0.68, 0.2);
  const dustP = sub(p, 0.6, 0.2);
  const journalP = sub(p, 0.85, 0.12);

  // Candle positions
  const candles = [
    { x: 160, wickY: 80, baseY: 103, lit: c1 },
    { x: 195, wickY: 76, baseY: 100, lit: c2 },
    { x: 228, wickY: 82, baseY: 103, lit: c3 },
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="flameGlow" radius={10} color="#e89a30" opacity={0.5} />
        <GlowFilter id="flameCore" radius={3} color="#ffe080" opacity={0.7} />
        <GlowFilter id="journalGlow" radius={6} color="#e89a30" opacity={0.4} />

        {/* Warm light overlay gradient — fades in as candles light */}
        <radialGradient id="warmOverlay" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={p * 0.12} />
          <stop offset="60%" stopColor="#e89a30" stopOpacity={p * 0.04} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>

        {/* Per-candle light pools */}
        {candles.map((c, i) => (
          <radialGradient key={i} id={`pool${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e89a30" stopOpacity={c.lit * 0.2} />
            <stop offset="60%" stopColor="#e89a30" stopOpacity={c.lit * 0.06} />
            <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
          </radialGradient>
        ))}

        {/* Window color */}
        <radialGradient id="windowGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={windowWarm * 0.5} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── ROOM BASE — cold, warms with progress ── */}
      <rect width="400" height="250" fill={`rgb(${r},${g},${b})`} />

      {/* ── BACK WALL — slightly warmer than base ── */}
      <rect x="0" y="0" width="400" height="190"
        fill={`rgb(${r + 6},${g + 4},${b + 2})`} />

      {/* Wall panel grooves — vertical lines suggesting old wood */}
      {[65, 130, 195, 260, 325, 390].map((x, i) => (
        <line key={i} x1={x} y1="0" x2={x} y2="190"
          stroke={`rgba(${r - 4},${g - 3},${b - 2}, 0.25)`} strokeWidth="1.2" />
      ))}
      {/* Wainscoting rail */}
      <line x1="0" y1="135" x2="400" y2="135"
        stroke={`rgb(${r + 12},${g + 6},${b + 2})`} strokeWidth="3" />

      {/* ── WINDOW — cold moonlight outside, warming ── */}
      {/* Panes — start cold blue, warm to amber */}
      {[[56, 30, 30, 40], [92, 30, 30, 40], [56, 74, 30, 40], [92, 74, 30, 40]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="1"
          fill={`rgb(${16 + Math.round(windowWarm * 140)},${16 + Math.round(windowWarm * 80)},${28 + Math.round(windowWarm * 10)})`} />
      ))}
      {/* Window glow spilling into room */}
      {windowWarm > 0.1 && (
        <ellipse cx="90" cy="72" rx="60" ry="50"
          fill="url(#windowGlow)" />
      )}
      {/* Frame — thick wood */}
      <path d={WINDOW_FRAME} fill="none"
        stroke={`rgb(${r + 18},${g + 10},${b + 4})`} strokeWidth="5" />
      {/* Muntins */}
      <line x1="89" y1="26" x2="89" y2="118"
        stroke={`rgb(${r + 16},${g + 9},${b + 3})`} strokeWidth="4" />
      <line x1="56" y1="70" x2="124" y2="70"
        stroke={`rgb(${r + 16},${g + 9},${b + 3})`} strokeWidth="4" />
      {/* Sill */}
      <path d={WINDOW_SILL}
        fill={`rgb(${r + 14},${g + 8},${b + 3})`} />

      {/* ── HEARTH — stone arch, cold and empty ── */}
      <path d={HEARTH_ARCH}
        fill={`rgb(${r + 8},${g + 5},${b + 2})`} />
      <path d={HEARTH_INNER}
        fill={`rgb(${Math.max(6, r - 4)},${Math.max(5, g - 3)},${Math.max(5, b - 2)})`} />
      <path d={HEARTH_MANTEL}
        fill={`rgb(${r + 12},${g + 7},${b + 3})`} />
      {/* Cold ash in hearth */}
      <ellipse cx="320" cy="186" rx="24" ry="4"
        fill={`rgb(${r + 4},${g + 3},${b + 2})`} opacity="0.4" />
      {/* Stone texture lines on hearth */}
      <line x1="290" y1="155" x2="290" y2="190" stroke={`rgb(${r + 2},${g + 1},${b})`} strokeWidth="0.5" opacity="0.3" />
      <line x1="320" y1="145" x2="320" y2="118" stroke={`rgb(${r + 2},${g + 1},${b})`} strokeWidth="0.5" opacity="0.2" />
      <line x1="350" y1="155" x2="350" y2="190" stroke={`rgb(${r + 2},${g + 1},${b})`} strokeWidth="0.5" opacity="0.3" />

      {/* ── SHELF ── */}
      <path d={SHELF}
        fill={`rgb(${r + 16},${g + 10},${b + 4})`} />

      {/* ── CANDLES on shelf ── */}
      {candles.map((c, i) => (
        <g key={i}>
          {/* Light pool on wall */}
          <ellipse cx={c.x} cy={c.baseY - 15} rx="42" ry="35"
            fill={`url(#pool${i})`} />
          {/* Wax body — tapered */}
          <path
            d={`M${c.x - 4} ${c.baseY} L${c.x - 3} ${c.wickY + 4}
                Q${c.x} ${c.wickY} ${c.x + 3} ${c.wickY + 4}
                L${c.x + 4} ${c.baseY} Z`}
            fill={`rgb(${200 + Math.round(c.lit * 40)},${190 + Math.round(c.lit * 30)},${170})`}
            opacity={0.4 + c.lit * 0.6} />
          {/* Flame */}
          {c.lit > 0.3 && (
            <>
              <ellipse cx={c.x} cy={c.wickY - 5} rx={4} ry={7}
                fill="#e89a30" opacity={c.lit * 0.7} filter="url(#flameGlow)" />
              <ellipse cx={c.x} cy={c.wickY - 4} rx={2} ry={5}
                fill="#ffe890" opacity={c.lit * 0.9} filter="url(#flameCore)" />
              <ellipse cx={c.x} cy={c.wickY - 3} rx={1} ry={2.5}
                fill="#fff8e0" opacity={c.lit} />
            </>
          )}
        </g>
      ))}

      {/* ── BOOKS on shelf ── */}
      {[
        { x: 140, w: 6, h: 16, color: `rgb(${60 + Math.round(p * 30)},20,20)` },
        { x: 148, w: 7, h: 20, color: `rgb(20,${40 + Math.round(p * 20)},60)` },
        { x: 157, w: 5, h: 14, color: `rgb(30,${50 + Math.round(p * 20)},25)` },
        { x: 164, w: 6, h: 18, color: `rgb(${50 + Math.round(p * 20)},25,${50 + Math.round(p * 15)})` },
      ].map((bk, i) => (
        <rect key={i} x={bk.x} y={100 - bk.h} width={bk.w} height={bk.h}
          fill={bk.color} rx="0.5" opacity={0.3 + sub(p, 0.1 + i * 0.06, 0.2) * 0.7} />
      ))}

      {/* ── JOURNAL on mantel — glows late, narrative hook ── */}
      {journalP > 0 && (
        <g opacity={journalP}>
          <rect x="310" y="130" width="16" height="10" rx="1"
            fill={`rgb(${60 + Math.round(p * 40)},${30 + Math.round(p * 15)},15)`}
            filter="url(#journalGlow)" />
          {/* Faint glow suggesting the symbols */}
          <rect x="313" y="132" width="10" height="6" rx="0.5"
            fill="#e89a30" opacity={journalP * 0.15} />
        </g>
      )}

      {/* ── FLOOR ── */}
      <path d={FLOOR_LINE} fill="none"
        stroke={`rgb(${r + 10},${g + 6},${b + 2})`} strokeWidth="2" />
      <rect x="0" y="190" width="400" height="60"
        fill={`rgb(${r + 4},${g + 2},${b})`} />
      {/* Floorboard seams */}
      {[50, 110, 175, 240, 310, 370].map((x, i) => (
        <line key={i} x1={x} y1="190" x2={x - 3} y2="250"
          stroke={`rgb(${r - 2},${g - 2},${b - 1})`} strokeWidth="0.6" opacity="0.3" />
      ))}

      {/* ── MUG — with steam in phrase 2 ── */}
      <g opacity={0.4 + sub(p, 0.3, 0.2) * 0.6}>
        <path d="M108 204 Q106 196 107 191 Q108 188 114 188 Q120 188 121 191 Q122 196 120 204 Z"
          fill={`rgb(${120 + Math.round(c1 * 40)},${80 + Math.round(c1 * 20)},55)`} />
        <path d="M120 192 Q127 192 127 197 Q127 202 120 202"
          fill="none" stroke={`rgb(${110 + Math.round(c1 * 30)},${75 + Math.round(c1 * 15)},50)`}
          strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="114" cy="188" rx="7" ry="2" fill={`rgb(${130 + Math.round(c1 * 30)},${90 + Math.round(c1 * 15)},65)`} />
        {/* Steam */}
        {steamP > 0 && (
          <g opacity={steamP * 0.3}>
            <path d={`M111 ${186 - steamP * 8} Q109 ${180 - steamP * 10} 112 ${175 - steamP * 12}`}
              fill="none" stroke="#c8c0b0" strokeWidth="0.8" strokeLinecap="round" />
            <path d={`M116 ${185 - steamP * 6} Q118 ${178 - steamP * 9} 115 ${172 - steamP * 11}`}
              fill="none" stroke="#c8c0b0" strokeWidth="0.7" strokeLinecap="round" />
          </g>
        )}
      </g>

      {/* ── CAT — bezier silhouette, appears late ── */}
      {catP > 0 && (
        <g opacity={catP * 0.85}>
          <path d={`
            M42 208 C42 198 48 190 55 188 C58 187 60 186 62 183
            L65 178 C66 176 68 176 68 178 L68 181 L72 176
            C73 174 75 174 75 177 L73 182 C75 183 76 185 76 188
            C78 188 80 190 80 192 C80 194 78 195 76 195
            C75 198 72 202 72 208 C72 210 70 212 65 212
            L48 212 C43 212 42 210 42 208 Z
          `} fill={`rgb(${r - 2},${g - 2},${b - 2})`} />
          {/* Tail */}
          <path d="M72 206 C82 202 92 195 88 186 C86 182 80 184 82 190"
            fill="none" stroke={`rgb(${r - 2},${g - 2},${b - 2})`}
            strokeWidth="3.5" strokeLinecap="round" />
          {/* Eyes — amber glint */}
          <circle cx="64" cy="183" r="1" fill="#e89a30" opacity={catP * 0.6} />
          <circle cx="70" cy="183.5" r="0.8" fill="#e89a30" opacity={catP * 0.5} />
        </g>
      )}

      {/* ── WARM LIGHT OVERLAY — like the canopy, this covers the cold room ── */}
      <rect width="400" height="250" fill="url(#warmOverlay)" />

      {/* ── DUST MOTES in candlelight ── */}
      {dustP > 0 && Array.from({ length: 12 }).map((_, i) => {
        const mx = 130 + (i * 37) % 140;
        const my = 60 + (i * 29) % 100;
        const drift = Math.sin(p * Math.PI * 2 + i * 1.5) * 3;
        const mp = sub(p, 0.6 + i * 0.025, 0.12);
        return mp > 0 ? (
          <circle key={i} cx={mx + drift} cy={my - mp * 5}
            r={0.5 + (i % 3) * 0.2}
            fill="#e8d0a0" opacity={mp * 0.15} />
        ) : null;
      })}
    </svg>
  );
}

export default memo(CottageScene);
