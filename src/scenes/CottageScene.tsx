import { sub } from "./util";
import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";


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
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="flameGlow" radius={10} color="#e89a30" opacity={0.5} />
        <GlowFilter id="flameCore" radius={3} color="#ffe080" opacity={0.7} />
{/* journal uses subtle fill overlay, no filter needed */}

        <radialGradient id="warmOverlay" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={p * 0.12} />
          <stop offset="60%" stopColor="#e89a30" stopOpacity={p * 0.04} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>

        {candles.map((_c, i) => (
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

      {/* ── MUG on far right of shelf — with steam against dark wall ── */}
      <g opacity={0.4 + sub(p, 0.3, 0.2) * 0.6}>
        <path d="M348 118 Q346 112 347 108 Q348 105 353 105 Q358 105 359 108 Q360 112 358 118 Z"
          fill={`rgb(${120 + Math.round(c3 * 40)},${80 + Math.round(c3 * 20)},55)`} />
        <path d="M358 109 Q364 109 364 113 Q364 117 358 117"
          fill="none" stroke={`rgb(${110 + Math.round(c3 * 30)},${75 + Math.round(c3 * 15)},50)`}
          strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="353" cy="105" rx="6" ry="1.8"
          fill={`rgb(${130 + Math.round(c3 * 30)},${90 + Math.round(c3 * 15)},65)`} />
        {/* Steam — asymmetric wispy curves */}
        {sub(p, 0.55, 0.2) > 0 && (
          <g opacity={sub(p, 0.55, 0.2) * 0.3}>
            <path d="M351 102 Q347 94 352 86 Q355 80 351 74"
              fill="none" stroke="#c8b898" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M356 103 Q360 98 357 92 Q354 88 358 84"
              fill="none" stroke="#c8b898" strokeWidth="0.6" strokeLinecap="round" />
            <path d="M353 101 Q350 97 353 93"
              fill="none" stroke="#c8b898" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
          </g>
        )}
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

      {/* ── JOURNAL on shelf — small book that glows faintly, NOT a rectangle ── */}
      {journalP > 0 && (
        <g opacity={journalP * 0.7}>
          {/* Book spine — thin, leaning slightly */}
          <path d="M340 118 L338 106 Q339 104 341 104 L345 104 Q347 104 347 106 L345 118 Z"
            fill={`rgb(${50 + Math.round(p * 30)},${25 + Math.round(p * 12)},12)`} />
          {/* Subtle amber edge glow — NOT a glowing rectangle */}
          <path d="M340 118 L338 106 Q339 104 341 104 L345 104 Q347 104 347 106 L345 118 Z"
            fill="#e89a30" opacity={journalP * 0.12} />
        </g>
      )}

      {/* ── FLOOR ── */}
      <path d="M0 190 C40 189, 80 191, 130 190 C180 189, 230 191, 280 190 C330 189, 370 190, 400 190"
        fill="none" stroke={`rgb(${r + 8},${g + 5},${b + 2})`} strokeWidth="2" />
      <rect x="0" y="190" width="400" height="60"
        fill={`rgb(${r + 3},${g + 2},${b})`} />

      {/* ── CAT — classic sitting silhouette based on reference.
           Large round head (1/3 body), proud chest, round haunches,
           tail curves up behind. Facing right. ── */}
      {catP > 0 && (
        <g opacity={catP}>
          <path d={`
            M72 190
            C72 186, 70 180, 66 176
            C62 170, 58 164, 56 158
            C54 152, 54 148, 56 144
            C58 140, 60 138, 62 136
            C63 134, 62 130, 60 128
            C58 126, 56 122, 56 118
            C56 114, 58 110, 62 108
            L64 104
            C65 102, 67 103, 66 106
            C66 109, 68 110, 70 110
            C72 110, 74 108, 76 106
            L78 102
            C80 100, 82 102, 80 104
            C78 106, 78 110, 80 112
            C84 114, 86 118, 86 122
            C86 126, 84 128, 82 130
            C80 132, 80 134, 80 136
            C80 138, 82 140, 84 142
            C86 146, 88 150, 88 156
            C88 162, 86 168, 84 174
            C82 180, 82 186, 82 190
            Z
          `} fill={`rgb(${Math.max(4, r - 6)},${Math.max(4, g - 5)},${Math.max(4, b - 4)})`} />
          {/* Tail — curves up behind the body and loops over */}
          <path d="M72 184 C66 176, 58 166, 54 154 C50 142, 48 132, 52 124 C55 118, 60 120, 58 126 C56 132, 58 138, 62 144"
            fill="none" stroke={`rgb(${Math.max(4, r - 6)},${Math.max(4, g - 5)},${Math.max(4, b - 4)})`}
            strokeWidth="3.5" strokeLinecap="round" />
          {/* Eye — amber glint */}
          <circle cx="76" cy="118" r="1.3" fill="#e89a30" opacity={Math.min(1, catP * 1.2)} />
          {/* Whiskers */}
          <g opacity={Math.min(0.35, catP * 0.35)}>
            <line x1="84" y1="122" x2="92" y2="120" stroke="#c8a870" strokeWidth="0.4" />
            <line x1="84" y1="124" x2="92" y2="125" stroke="#c8a870" strokeWidth="0.4" />
          </g>
        </g>
      )}

      {/* ── HANGING HERBS — dried bunches near the window ── */}
      <g opacity={0.3 + p * 0.5}>
        {/* Left bundle */}
        <line x1="165" y1="52" x2="165" y2="62" stroke={`hsl(30, 15%, ${12 + p * 6}%)`} strokeWidth="0.5" />
        <path d="M162 62 C163 58, 164 55, 165 52 C166 55, 167 58, 168 62 C166 63, 164 63, 162 62"
          fill={`hsl(90, ${15 + p * 15}%, ${10 + p * 6}%)`} />
        <path d="M160 64 C161 60, 163 56, 165 53 C164 56, 163 60, 162 64 C161 65, 160 65, 160 64"
          fill={`hsl(35, ${20 + p * 12}%, ${12 + p * 5}%)`} />
        {/* Right bundle */}
        <line x1="185" y1="54" x2="185" y2="65" stroke={`hsl(30, 15%, ${12 + p * 6}%)`} strokeWidth="0.5" />
        <path d="M182 65 C183 60, 184 57, 185 54 C186 57, 187 60, 188 65 C186 66, 184 66, 182 65"
          fill={`hsl(80, ${12 + p * 12}%, ${9 + p * 5}%)`} />
      </g>

      {/* ── SMALL RUG — woven oval near the window ── */}
      <ellipse cx="100" cy="188" rx="22" ry="6"
        fill={`hsl(15, ${10 + p * 15}%, ${8 + p * 5}%)`}
        opacity={0.35 + p * 0.3} />
      <ellipse cx="100" cy="188" rx="18" ry="4.5"
        fill={`hsl(25, ${12 + p * 12}%, ${10 + p * 6}%)`}
        opacity={0.25 + p * 0.2} />
      {/* Rug pattern — simple cross-weave lines */}
      <line x1="85" y1="188" x2="115" y2="188"
        stroke={`hsl(35, ${8 + p * 10}%, ${14 + p * 5}%)`}
        strokeWidth="0.4" opacity={0.2 + p * 0.15} />
      <line x1="100" y1="183" x2="100" y2="193"
        stroke={`hsl(35, ${8 + p * 10}%, ${14 + p * 5}%)`}
        strokeWidth="0.4" opacity={0.2 + p * 0.15} />

      {/* ── FLOOR WARMTH — candlelight reflections on floorboards ── */}
      {c1 > 0.3 && (
        <ellipse cx="210" cy="198" rx="35" ry="8" fill="#e89a30" opacity={c1 * 0.04} />
      )}
      {c2 > 0.3 && (
        <ellipse cx="262" cy="198" rx="38" ry="9" fill="#e89a30" opacity={c2 * 0.05} />
      )}
      {c3 > 0.3 && (
        <ellipse cx="318" cy="198" rx="32" ry="7" fill="#e89a30" opacity={c3 * 0.04} />
      )}

      {/* ── WINDOW LIGHT on floor — soft amber pool beneath the window
           once warmth builds. Adds depth and ties the window glow to
           the floor; previously the floor stayed uniformly dark below
           the warm window. Shape matches the window's horizontal span,
           muntins cast faint cross-shadows so the pool reads as "light
           through panes" rather than a generic glow. */}
      {windowWarm > 0.2 && (() => {
        const wlp = sub(p, 0.2, 0.55);
        return (
          <g opacity={wlp * 0.75}>
            {/* Broad outer pool */}
            <ellipse cx="95" cy="202" rx={54} ry={10}
              fill="#e89a30" opacity={0.05} />
            {/* Tighter inner pool */}
            <ellipse cx="95" cy="200" rx={36} ry={6.5}
              fill="#f0b050" opacity={0.09} />
            {/* Muntin shadow — vertical and horizontal bars from the
                 window cross, so the floor pool reads as pane-cast light. */}
            <rect x="93.5" y="193" width="3" height="14"
              fill="#060304" opacity={0.22} />
            <rect x="72" y="199" width="46" height="2.2"
              fill="#060304" opacity={0.16} />
          </g>
        );
      })()}

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
