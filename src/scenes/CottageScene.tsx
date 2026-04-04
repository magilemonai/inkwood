import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

// ─── HAND-CRAFTED PATHS ────────────────────────────────────

/** Window frame — thick old wood, slightly irregular */
const WINDOW_FRAME = `
  M48 30 C48 27, 50 25, 54 25 L136 25 C140 25, 142 27, 142 30
  L142 132 C142 135, 140 137, 136 137 L54 137 C50 137, 48 135, 48 132 Z`;
const WINDOW_SILL = `
  M42 132 C42 130, 44 128, 48 128 L142 128 C146 128, 148 130, 148 132
  L148 140 C148 142, 146 144, 142 144 L48 144 C44 144, 42 142, 42 140 Z`;

/** Shelf — long, slightly bowed, spanning the center-right wall */
const SHELF = `
  M170 118 C210 116, 270 115, 340 117 L340 122 C270 120, 210 121, 170 123 Z`;
/** Shelf brackets */
const BRACKET_L = "M185 123 L185 138 Q185 140 187 140 L192 140 L185 123";
const BRACKET_R = "M328 123 L328 138 Q328 140 326 140 L321 140 L328 123";

// ─── SCENE COMPONENT ───────────────────────────────────────

function CottageScene({ progress: p }: SceneProps) {
  // Color temperature: cold blue → warm amber (more dramatic shift)
  const coldR = 10, coldG = 12, coldB = 28;
  const warmR = 44, warmG = 28, warmB = 14;
  const r = Math.round(coldR + (warmR - coldR) * p);
  const g = Math.round(coldG + (warmG - coldG) * p);
  const b = Math.round(coldB + (warmB - coldB) * p);

  // Candle timing — phrase 1
  const c1 = sub(p, 0.06, 0.18);
  const c2 = sub(p, 0.24, 0.18);
  const c3 = sub(p, 0.42, 0.18);

  // Window warmth
  const windowWarm = sub(p, 0.05, 0.55);

  // Phrase 2 elements
  const catP = sub(p, 0.58, 0.2);
  const journalP = sub(p, 0.82, 0.12);
  const dustP = sub(p, 0.55, 0.2);

  // Candle data — all above the fold
  const candles = [
    { x: 210, wickY: 90, baseY: 118 },
    { x: 262, wickY: 86, baseY: 116 },
    { x: 318, wickY: 92, baseY: 118 },
  ];
  const candleLit = [c1, c2, c3];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="flameGlow" radius={10} color="#e89a30" opacity={0.5} />
        <GlowFilter id="flameCore" radius={3} color="#ffe080" opacity={0.7} />
        <GlowFilter id="journalGlow" radius={5} color="#e89a30" opacity={0.4} />

        <radialGradient id="warmOverlay" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={p * 0.12} />
          <stop offset="60%" stopColor="#e89a30" stopOpacity={p * 0.04} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>

        {candles.map((c, i) => (
          <radialGradient key={i} id={`pool${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e89a30" stopOpacity={candleLit[i] * 0.2} />
            <stop offset="60%" stopColor="#e89a30" stopOpacity={candleLit[i] * 0.06} />
            <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
          </radialGradient>
        ))}

        <radialGradient id="windowGlowGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={windowWarm * 0.45} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ── ROOM ── */}
      <rect width="400" height="250" fill={`rgb(${r},${g},${b})`} />

      {/* Back wall */}
      <rect x="0" y="0" width="400" height="190"
        fill={`rgb(${r + 6},${g + 4},${b + 2})`} />

      {/* Wall panel grooves */}
      {[70, 145, 220, 295, 370].map((x, i) => (
        <line key={i} x1={x} y1="0" x2={x} y2="190"
          stroke={`rgba(${r - 4},${g - 3},${b - 2}, 0.2)`} strokeWidth="1" />
      ))}
      {/* Wainscoting rail */}
      <line x1="0" y1="148" x2="400" y2="148"
        stroke={`rgb(${r + 10},${g + 5},${b + 2})`} strokeWidth="3" />

      {/* ── WINDOW — left side, the scenic anchor ── */}
      {/* Panes — cold blue → warm amber */}
      {[[52, 30, 38, 46], [100, 30, 38, 46], [52, 80, 38, 48], [100, 80, 38, 48]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="1"
          fill={`rgb(${10 + Math.round(windowWarm * 160)},${12 + Math.round(windowWarm * 88)},${35 + Math.round(windowWarm * 5)})`} />
      ))}
      {/* Window glow into room */}
      {windowWarm > 0.1 && (
        <ellipse cx="95" cy="80" rx="65" ry="55"
          fill="url(#windowGlowGrad)" />
      )}
      {/* Frame */}
      <path d={WINDOW_FRAME} fill="none"
        stroke={`rgb(${r + 16},${g + 9},${b + 3})`} strokeWidth="5" />
      {/* Muntins */}
      <line x1="95" y1="30" x2="95" y2="132"
        stroke={`rgb(${r + 14},${g + 8},${b + 3})`} strokeWidth="4" />
      <line x1="52" y1="76" x2="138" y2="76"
        stroke={`rgb(${r + 14},${g + 8},${b + 3})`} strokeWidth="4" />
      {/* Sill */}
      <path d={WINDOW_SILL}
        fill={`rgb(${r + 12},${g + 7},${b + 3})`} />

      {/* ── MUG on windowsill — ABOVE the fold ── */}
      <g opacity={0.4 + sub(p, 0.3, 0.2) * 0.6}>
        <path d="M68 140 Q66 134 67 130 Q68 127 73 127 Q78 127 79 130 Q80 134 78 140 Z"
          fill={`rgb(${120 + Math.round(c1 * 40)},${80 + Math.round(c1 * 20)},55)`} />
        <path d="M78 131 Q84 131 84 135 Q84 139 78 139"
          fill="none" stroke={`rgb(${110 + Math.round(c1 * 30)},${75 + Math.round(c1 * 15)},50)`}
          strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="73" cy="127" rx="6" ry="1.8"
          fill={`rgb(${130 + Math.round(c1 * 30)},${90 + Math.round(c1 * 15)},65)`} />
      </g>

      {/* ── SHELF ── */}
      <path d={SHELF} fill={`rgb(${r + 14},${g + 8},${b + 3})`} />
      <path d={BRACKET_L} fill={`rgb(${r + 10},${g + 6},${b + 2})`} />
      <path d={BRACKET_R} fill={`rgb(${r + 10},${g + 6},${b + 2})`} />

      {/* ── CANDLES on shelf ── */}
      {candles.map((c, i) => {
        const lit = candleLit[i];
        return (
          <g key={i}>
            {/* Light pool on wall */}
            <ellipse cx={c.x} cy={c.baseY - 20} rx="45" ry="38"
              fill={`url(#pool${i})`} />
            {/* Wax body — tapered */}
            <path
              d={`M${c.x - 4} ${c.baseY} L${c.x - 3} ${c.wickY + 4}
                  Q${c.x} ${c.wickY} ${c.x + 3} ${c.wickY + 4}
                  L${c.x + 4} ${c.baseY} Z`}
              fill={`rgb(${200 + Math.round(lit * 40)},${190 + Math.round(lit * 30)},170)`}
              opacity={0.4 + lit * 0.6} />
            {/* Flame */}
            {lit > 0.3 && (
              <>
                <ellipse cx={c.x} cy={c.wickY - 5} rx={4} ry={7}
                  fill="#e89a30" opacity={lit * 0.7} filter="url(#flameGlow)" />
                <ellipse cx={c.x} cy={c.wickY - 4} rx={2} ry={5}
                  fill="#ffe890" opacity={lit * 0.9} filter="url(#flameCore)" />
                <ellipse cx={c.x} cy={c.wickY - 3} rx={1} ry={2.5}
                  fill="#fff8e0" opacity={lit} />
              </>
            )}
          </g>
        );
      })}

      {/* ── BOOKS on shelf — to the LEFT of first candle ── */}
      {[
        { x: 176, w: 6, h: 16, color: `rgb(${60 + Math.round(p * 30)},20,20)` },
        { x: 184, w: 7, h: 20, color: `rgb(20,${40 + Math.round(p * 20)},60)` },
        { x: 193, w: 5, h: 14, color: `rgb(30,${50 + Math.round(p * 20)},25)` },
      ].map((bk, i) => (
        <rect key={i} x={bk.x} y={118 - bk.h} width={bk.w} height={bk.h}
          fill={bk.color} rx="0.5" opacity={0.3 + sub(p, 0.1 + i * 0.06, 0.2) * 0.7} />
      ))}

      {/* ── JOURNAL on shelf — far right, narrative hook ── */}
      {journalP > 0 && (
        <g opacity={journalP}>
          <rect x="335" y="108" width="14" height="10" rx="1"
            fill={`rgb(${60 + Math.round(p * 40)},${30 + Math.round(p * 15)},15)`}
            filter="url(#journalGlow)" />
        </g>
      )}

      {/* ── FLOOR ── */}
      <path d="M0 190 C40 189, 80 191, 130 190 C180 189, 230 191, 280 190 C330 189, 370 190, 400 190"
        fill="none" stroke={`rgb(${r + 8},${g + 5},${b + 2})`} strokeWidth="2" />
      <rect x="0" y="190" width="400" height="60"
        fill={`rgb(${r + 3},${g + 2},${b})`} />

      {/* ── CAT — bigger, sitting on the floor but visible above overlay ── */}
      {catP > 0 && (
        <g opacity={catP * 0.9} transform="translate(30, 148) scale(1.3)">
          {/* Body — sitting cat, facing right */}
          <path d={`
            M0 28 C0 18, 6 10, 14 8
            C16 7, 18 5, 20 2
            L22 -3 C23 -5, 25 -5, 25 -2 L25 1
            L28 -4 C29 -6, 31 -6, 31 -3 L30 2
            C32 3, 34 6, 34 9
            C36 9, 38 12, 38 15
            C38 18, 36 19, 34 19
            C32 22, 30 26, 30 30
            L30 32 L8 32
            C2 32, 0 30, 0 28 Z
          `} fill={`rgb(${r - 2},${g - 2},${b - 2})`} />
          {/* Tail — long, curving */}
          <path d="M30 28 C40 24, 50 18, 48 10 C46 6, 40 8, 42 14"
            fill="none" stroke={`rgb(${r - 2},${g - 2},${b - 2})`}
            strokeWidth="3" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="22" cy="3" r="1.2" fill="#e89a30" opacity={catP * 0.7} />
          <circle cx="28" cy="3.5" r="1" fill="#e89a30" opacity={catP * 0.6} />
        </g>
      )}

      {/* ── WARM LIGHT OVERLAY — covering layer, fades in ── */}
      <rect width="400" height="250" fill="url(#warmOverlay)" />

      {/* ── DUST MOTES ── */}
      {dustP > 0 && Array.from({ length: 10 }).map((_, i) => {
        const mx = 160 + (i * 41) % 180;
        const my = 40 + (i * 31) % 100;
        const drift = Math.sin(p * Math.PI * 2 + i * 1.5) * 3;
        const mp = sub(p, 0.55 + i * 0.03, 0.12);
        return mp > 0 ? (
          <circle key={i} cx={mx + drift} cy={my}
            r={0.5 + (i % 3) * 0.2}
            fill="#e8d0a0" opacity={mp * 0.15} />
        ) : null;
      })}
    </svg>
  );
}

export default memo(CottageScene);
