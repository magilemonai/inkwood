import { sub } from "../util";
import { memo } from "react";
import type { SceneProps } from "../../types";
import { GlowFilter } from "../../svg/filters";

/**
 * The Dark Cottage — Inkwood 2.
 *
 * Same room, same coordinates as v1 (the light manifest is tuned to them).
 * What's new is the story's hinge and the room's idle life:
 *
 * - THE JOURNAL. The story now turns on this book ("a journal falls open
 *   in a hand that is not yours"). It lies closed on the shelf between
 *   the first two candles from the start; on phrase 2 it rises and falls
 *   open, propped between the flames, and faint handwriting brightens to
 *   warm gold. At the very end a page turns.
 * - IDLE LIFE (all SMIL, zero React work): candle flames flicker, steam
 *   drifts up and fades on a loop, the cat breathes and flicks an ear.
 *   Skipped when the player prefers reduced motion.
 */

// ─── HAND-CRAFTED PATHS ────────────────────────────────────

const WINDOW_FRAME = `
  M48 30 C48 27, 50 25, 54 25 L136 25 C140 25, 142 27, 142 30
  L142 132 C142 135, 140 137, 136 137 L54 137 C50 137, 48 135, 48 132 Z`;
const WINDOW_SILL = `
  M42 132 C42 130, 44 128, 48 128 L142 128 C146 128, 148 130, 148 132
  L148 140 C148 142, 146 144, 142 144 L48 144 C44 144, 42 142, 42 140 Z`;

const SHELF = `
  M170 118 C210 116, 270 115, 340 117 L340 122 C270 120, 210 121, 170 123 Z`;
const BRACKET_L = "M185 123 L185 138 Q185 140 187 140 L192 140 L185 123";
const BRACKET_R = "M328 123 L328 138 Q328 140 326 140 L321 140 L328 123";

// The journal, propped open between the first two candles (shelf top ≈ y116).
const JOURNAL_SPINE_X = 237;
const PAGE_LEFT = "M237 100 Q230 98.5 223 98 L222 115 Q230 116.2 237 116 Z";
const PAGE_UP = "M237 100 Q237 96 237 92 L237 108 Q237 112 237 116 Z";
const PAGE_RIGHT = "M237 100 Q244 98.5 251 98 L252 115 Q244 116.2 237 116 Z";
const COVER_OPEN = "M237 101 Q229 99 220.5 97 L219.5 116.5 Q229 117.6 237 117.4 Q245 117.6 254.5 116.5 L253.5 97 Q245 99 237 101 Z";
// Closed, lying flat on the shelf: a low slab of cover with a pale page edge.
const BOOK_CLOSED = "M226 116.5 L226.5 112.6 Q237 111.6 248 112.6 L248.5 116.5 Q237 117.4 226 116.5 Z";
const BOOK_CLOSED_PAGES = "M227.5 116 L228 113.6 Q237 112.9 246.2 113.6 L246.6 116 Z";

// Handwriting: short wavering strokes, three per page, drawn left to right.
const SCRIPT_LEFT = [
  "M225.5 103.5 Q228 102.6 230 103.4 Q232 104.1 234.5 103.2",
  "M225 107.2 Q227.5 106.4 229.8 107.1 Q232.2 107.8 234.8 106.9",
  "M225 110.8 Q227 110.1 229 110.7 Q230.5 111.2 232 110.6",
];
const SCRIPT_RIGHT = [
  "M239.5 103.2 Q242 102.4 244 103.2 Q246 103.9 248.5 103.1",
  "M239.2 106.9 Q241.6 106.1 244 106.9 Q246.4 107.6 248.8 106.7",
  "M239.2 110.6 Q241 109.9 243 110.5 Q244.6 111 246 110.4",
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── SCENE COMPONENT ───────────────────────────────────────

function CottageScene({ progress: p }: SceneProps) {
  const still = prefersReducedMotion();

  // Color temperature: cold blue → warm amber
  const coldR = 10, coldG = 12, coldB = 28;
  const warmR = 44, warmG = 28, warmB = 14;
  const r = Math.round(coldR + (warmR - coldR) * p);
  const g = Math.round(coldG + (warmG - coldG) * p);
  const b = Math.round(coldB + (warmB - coldB) * p);

  // Candle timing — phrase 1
  const c1 = sub(p, 0.06, 0.18);
  const c2 = sub(p, 0.24, 0.18);
  const c3 = sub(p, 0.42, 0.18);

  // The window stays cold through phrase 1: a candle cannot light the night
  // outside. The panes carry only a faint reflection of the flames until
  // phrase 2 ("fill every room with warmth") warms them with the room.
  const pools = (c1 + c2 + c3) / 3;
  const windowWarm = sub(p, 0.5, 0.42);
  const paneWarm = Math.min(1, windowWarm + 0.14 * pools);

  // Phrase 2
  const catP = sub(p, 0.58, 0.2);
  const journalP = sub(p, 0.78, 0.14);   // the book rises and opens
  const scriptP = sub(p, 0.86, 0.12);    // the handwriting brightens
  const pageTurn = p > 0.95;             // a page turns at the very end
  const dustP = sub(p, 0.55, 0.2);

  const candles = [
    { x: 210, wickY: 90, baseY: 118, dur: 1.7 },
    { x: 262, wickY: 86, baseY: 116, dur: 2.1 },
    { x: 318, wickY: 92, baseY: 118, dur: 1.9 },
  ];
  const candleLit = [c1, c2, c3];

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="flameGlow" radius={10} color="#e89a30" opacity={0.5} />
        <GlowFilter id="flameCore" radius={3} color="#ffe080" opacity={0.7} />

        <radialGradient id="warmOverlay" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={p * 0.12} />
          <stop offset="60%" stopColor="#e89a30" stopOpacity={p * 0.04} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>

        {candles.map((_c, i) => (
          <radialGradient key={i} id={`pool${i}`} cx="50%" cy="50%" r="50%">
            {/* The wall pool follows the flame; it never leads it. */}
            <stop offset="0%" stopColor="#e89a30" stopOpacity={sub(candleLit[i], 0.5, 0.5) * 0.2} />
            <stop offset="60%" stopColor="#e89a30" stopOpacity={sub(candleLit[i], 0.5, 0.5) * 0.06} />
            <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
          </radialGradient>
        ))}

        <radialGradient id="windowGlowGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={windowWarm * 0.45} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>

        {/* Page paper: warm cream, a touch darker toward the spine. */}
        <linearGradient id="pageL" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#c9b48e" />
          <stop offset="100%" stopColor="#e8dcc0" />
        </linearGradient>
        <linearGradient id="pageR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9b48e" />
          <stop offset="100%" stopColor="#e8dcc0" />
        </linearGradient>
      </defs>

      {/* ── ROOM ── */}
      <rect width="400" height="250" fill={`rgb(${r},${g},${b})`} />
      <rect x="0" y="0" width="400" height="190" fill={`rgb(${r + 6},${g + 4},${b + 2})`} />
      {[70, 145, 220, 295, 370].map((x, i) => (
        <line key={i} x1={x} y1="0" x2={x} y2="190"
          stroke={`rgba(${r - 4},${g - 3},${b - 2}, 0.2)`} strokeWidth="1" />
      ))}
      <line x1="0" y1="148" x2="400" y2="148"
        stroke={`rgb(${r + 10},${g + 5},${b + 2})`} strokeWidth="3" />

      {/* ── WINDOW ── */}
      {[[52, 30, 38, 46], [100, 30, 38, 46], [52, 80, 38, 48], [100, 80, 38, 48]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="1"
          fill={`rgb(${10 + Math.round(paneWarm * 160)},${12 + Math.round(paneWarm * 88)},${35 + Math.round(paneWarm * 5)})`} />
      ))}
      {windowWarm > 0.1 && (
        <ellipse cx="95" cy="80" rx="65" ry="55" fill="url(#windowGlowGrad)" />
      )}
      <path d={WINDOW_FRAME} fill="none" stroke={`rgb(${r + 16},${g + 9},${b + 3})`} strokeWidth="5" />
      <line x1="95" y1="30" x2="95" y2="132" stroke={`rgb(${r + 14},${g + 8},${b + 3})`} strokeWidth="4" />
      <line x1="52" y1="76" x2="138" y2="76" stroke={`rgb(${r + 14},${g + 8},${b + 3})`} strokeWidth="4" />
      <path d={WINDOW_SILL} fill={`rgb(${r + 12},${g + 7},${b + 3})`} />

      {/* ── MUG with drifting steam ── */}
      <g opacity={0.4 + sub(p, 0.3, 0.2) * 0.6}>
        <path d="M348 118 Q346 112 347 108 Q348 105 353 105 Q358 105 359 108 Q360 112 358 118 Z"
          fill={`rgb(${120 + Math.round(c3 * 40)},${80 + Math.round(c3 * 20)},55)`} />
        <path d="M358 109 Q364 109 364 113 Q364 117 358 117"
          fill="none" stroke={`rgb(${110 + Math.round(c3 * 30)},${75 + Math.round(c3 * 15)},50)`}
          strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="353" cy="105" rx="6" ry="1.8"
          fill={`rgb(${130 + Math.round(c3 * 30)},${90 + Math.round(c3 * 15)},65)`} />
        {sub(p, 0.55, 0.2) > 0 && (
          <g opacity={sub(p, 0.55, 0.2) * 0.3}>
            {[
              { d: "M351 102 Q347 94 352 86 Q355 80 351 74", w: 0.8, dur: "4.6s", begin: "0s" },
              { d: "M356 103 Q360 98 357 92 Q354 88 358 84", w: 0.6, dur: "5.4s", begin: "-1.8s" },
              { d: "M353 101 Q350 97 353 93", w: 0.5, dur: "3.9s", begin: "-3.1s" },
            ].map((wisp, i) => (
              <path key={i} d={wisp.d} fill="none" stroke="#c8b898" strokeWidth={wisp.w} strokeLinecap="round">
                {!still && (
                  <>
                    <animateTransform attributeName="transform" type="translate"
                      values="0 0; 0.6 -3; -0.3 -6.5" dur={wisp.dur} begin={wisp.begin} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0" dur={wisp.dur} begin={wisp.begin} repeatCount="indefinite" />
                  </>
                )}
              </path>
            ))}
          </g>
        )}
      </g>

      {/* ── SHELF ── */}
      <path d={SHELF} fill={`rgb(${r + 14},${g + 8},${b + 3})`} />
      <path d={BRACKET_L} fill={`rgb(${r + 10},${g + 6},${b + 2})`} />
      <path d={BRACKET_R} fill={`rgb(${r + 10},${g + 6},${b + 2})`} />

      {/* ── THE JOURNAL — closed on the shelf from the start; rises and
           falls open between the first two candles on phrase 2. ── */}
      <g>
        {/* Closed, lying flat */}
        <g opacity={1 - journalP}>
          <path d={BOOK_CLOSED} fill={`rgb(${52 + Math.round(p * 26)},${26 + Math.round(p * 10)},${12 + Math.round(p * 4)})`} />
          <path d={BOOK_CLOSED_PAGES} fill={`rgb(${150 + Math.round(p * 40)},${135 + Math.round(p * 35)},${105 + Math.round(p * 25)})`} opacity={0.85} />
        </g>
        {/* Open, propped */}
        {journalP > 0 && (
          <g
            opacity={journalP}
            transform={`translate(${JOURNAL_SPINE_X} 116) scale(${0.6 + journalP * 0.4}) translate(${-JOURNAL_SPINE_X} -116)`}
          >
            <path d={COVER_OPEN} fill="#4a2814" />
            <path d={COVER_OPEN} fill="#e89a30" opacity={0.10 + scriptP * 0.12} />
            <path d={PAGE_LEFT} fill="url(#pageL)" />
            <path d={PAGE_RIGHT} fill="url(#pageR)" />
            {/* Spine shadow */}
            <path d="M237 100 L237 116" stroke="#8a7050" strokeWidth="0.7" opacity="0.7" />
            {/* Handwriting — a hand that is not yours. Brightens to gold. */}
            <g strokeLinecap="round" fill="none" strokeWidth="0.55">
              {SCRIPT_LEFT.map((d, i) => (
                <path key={`sl${i}`} d={d}
                  stroke={scriptP > 0.5 ? "#c88a2a" : "#7a5a3a"}
                  opacity={0.35 + scriptP * 0.55}
                  strokeDasharray="12" strokeDashoffset={12 * (1 - sub(scriptP, i * 0.12, 0.45))} />
              ))}
              {SCRIPT_RIGHT.map((d, i) => (
                <path key={`sr${i}`} d={d}
                  stroke={scriptP > 0.5 ? "#c88a2a" : "#7a5a3a"}
                  opacity={0.35 + scriptP * 0.55}
                  strokeDasharray="12" strokeDashoffset={12 * (1 - sub(scriptP, 0.4 + i * 0.12, 0.45))} />
              ))}
            </g>
            {/* Gold glow off the open pages once the writing is awake */}
            {scriptP > 0.3 && (
              <path d={COVER_OPEN} fill="#ffd27a" opacity={(scriptP - 0.3) * 0.14} filter="url(#flameCore)" />
            )}
            {/* A page turns, once, and rests. */}
            {pageTurn && !still && (
              <path d={PAGE_LEFT} fill="#efe4cc" opacity="0.7">
                <animate attributeName="d"
                  values={`${PAGE_LEFT};${PAGE_UP};${PAGE_RIGHT};${PAGE_RIGHT}`}
                  keyTimes="0;0.11;0.22;1" dur="7s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1" />
              </path>
            )}
          </g>
        )}
      </g>

      {/* ── CANDLES — flames flicker ── */}
      {candles.map((c, i) => {
        const lit = candleLit[i];
        return (
          <g key={i}>
            <ellipse cx={c.x} cy={c.baseY - 20} rx="45" ry="38" fill={`url(#pool${i})`} />
            <path
              d={`M${c.x - 4} ${c.baseY} L${c.x - 3} ${c.wickY + 4}
                  Q${c.x} ${c.wickY} ${c.x + 3} ${c.wickY + 4}
                  L${c.x + 4} ${c.baseY} Z`}
              fill={`rgb(${200 + Math.round(lit * 40)},${190 + Math.round(lit * 30)},170)`}
              opacity={0.4 + lit * 0.6} />
            {/* A wick catches in order: the tip first, then the core grows,
                and only then does the halo spread onto the wall. */}
            {lit > 0.12 && (
              <>
                <ellipse cx={c.x} cy={c.wickY - 5} rx={4} ry={7}
                  fill="#e89a30" opacity={sub(lit, 0.5, 0.5) * 0.7} filter="url(#flameGlow)">
                  {!still && (
                    <>
                      <animate attributeName="ry" values="7;6.3;7.4;6.7;7.2;7" dur={`${c.dur}s`} repeatCount="indefinite" />
                      <animate attributeName="cx" values={`${c.x};${c.x + 0.4};${c.x - 0.3};${c.x + 0.2};${c.x}`} dur={`${c.dur * 1.3}s`} repeatCount="indefinite" />
                    </>
                  )}
                </ellipse>
                <ellipse cx={c.x} cy={c.wickY - 4} rx={2 * (0.4 + 0.6 * sub(lit, 0.25, 0.4))} ry={5 * (0.3 + 0.7 * sub(lit, 0.25, 0.4))}
                  fill="#ffe890" opacity={sub(lit, 0.25, 0.4) * 0.9} filter="url(#flameCore)">
                  {!still && (
                    <animate attributeName="ry" values="5;4.5;5.3;4.8;5" dur={`${c.dur * 0.9}s`} repeatCount="indefinite" />
                  )}
                </ellipse>
                <ellipse cx={c.x} cy={c.wickY - 3} rx={1} ry={2.5 * (0.4 + 0.6 * sub(lit, 0.12, 0.3))} fill="#fff8e0" opacity={sub(lit, 0.12, 0.3)} />
              </>
            )}
          </g>
        );
      })}

      {/* ── BOOKS on shelf ── */}
      {[
        { x: 176, w: 6, h: 16, color: `rgb(${60 + Math.round(p * 30)},20,20)` },
        { x: 184, w: 7, h: 20, color: `rgb(20,${40 + Math.round(p * 20)},60)` },
        { x: 193, w: 5, h: 14, color: `rgb(30,${50 + Math.round(p * 20)},25)` },
      ].map((bk, i) => (
        <rect key={i} x={bk.x} y={118 - bk.h} width={bk.w} height={bk.h}
          fill={bk.color} rx="0.5" opacity={0.3 + sub(p, 0.1 + i * 0.06, 0.2) * 0.7} />
      ))}

      {/* ── FLOOR ── */}
      <path d="M0 190 C40 189, 80 191, 130 190 C180 189, 230 191, 280 190 C330 189, 370 190, 400 190"
        fill="none" stroke={`rgb(${r + 8},${g + 5},${b + 2})`} strokeWidth="2" />
      <rect x="0" y="190" width="400" height="60" fill={`rgb(${r + 3},${g + 2},${b})`} />

      {/* ── CAT — loaf on the sill. Breathes; flicks an ear now and then. ── */}
      {catP > 0 && (() => {
        const catColor = `rgb(${Math.max(3, r - 7)},${Math.max(3, g - 6)},${Math.max(3, b - 5)})`;
        return (
          <g opacity={catP}>
            <g transform="translate(100 128)">
              <g>
                {!still && (
                  <animateTransform attributeName="transform" type="scale"
                    values="1 1;1 1.014;1 1" dur="4.2s" repeatCount="indefinite" calcMode="spline"
                    keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
                )}
                <g transform="translate(-100 -128)">
                  <path d={`
                    M 72 128
                    C 62 122, 62 109, 72 102
                    C 82 96, 96 95, 110 99
                    C 120 102, 127 108, 130 116
                    C 132 123, 130 128, 126 128
                    Z
                  `} fill={catColor} />
                  {/* Far ear */}
                  <path d="M 108 100 Q 109 93 112 92 Q 115 96 116 100 Z" fill={catColor} />
                  {/* Near ear — flicks */}
                  <path d="M 123 101 Q 125 91 129 91 Q 131 96 131 101 Z" fill={catColor}>
                    {!still && (
                      <animateTransform attributeName="transform" type="rotate"
                        values="0 127 101;0 127 101;-9 127 101;2 127 101;0 127 101;0 127 101"
                        keyTimes="0;0.88;0.9;0.93;0.95;1" dur="9s" repeatCount="indefinite" />
                    )}
                  </path>
                  <path d={`
                    M 103 125
                    C 99 117, 100 105, 108 99
                    C 116 95, 126 95, 131 100
                    C 135 105, 135 114, 132 120
                    C 130 125, 124 127, 118 128
                    L 105 128
                    Z
                  `} fill={catColor} />
                  <ellipse cx="124" cy="110" rx="1.9" ry="2.3" fill="#f0b040" opacity={Math.min(1, catP * 1.15)} />
                  <ellipse cx="124" cy="110" rx="0.55" ry="1.9" fill="#1a0a04" opacity={Math.min(1, catP * 1.15)} />
                  <circle cx="124.5" cy="109" r="0.35" fill="#fff2c0" opacity={Math.min(0.9, catP)} />
                  <path d="M 110 110 Q 112.5 111 115 110"
                    fill="none" stroke="#8a5020" strokeWidth="0.55"
                    strokeLinecap="round" opacity={Math.min(0.55, catP * 0.6)} />
                  <path d="M 116.5 115 L 119 115 L 117.7 116.5 Z" fill="#9a5a48" opacity={Math.min(0.85, catP)} />
                  <path d="M 117.7 116.5 Q 116.2 118 114.8 117 M 117.7 116.5 Q 119.2 118 120.6 117"
                    fill="none" stroke="#2a1a14" strokeWidth="0.45" strokeLinecap="round"
                    opacity={Math.min(0.6, catP * 0.7)} />
                  <g opacity={Math.min(0.22, catP * 0.25)}>
                    <line x1="113" y1="116" x2="103" y2="115" stroke="#a88870" strokeWidth="0.3" strokeLinecap="round" />
                    <line x1="113" y1="118" x2="104" y2="119" stroke="#a88870" strokeWidth="0.3" strokeLinecap="round" />
                    <line x1="122" y1="116" x2="132" y2="115" stroke="#a88870" strokeWidth="0.3" strokeLinecap="round" />
                    <line x1="122" y1="118" x2="131" y2="119" stroke="#a88870" strokeWidth="0.3" strokeLinecap="round" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        );
      })()}

      {/* ── HANGING HERBS ── */}
      <g opacity={0.3 + p * 0.5}>
        <line x1="165" y1="52" x2="165" y2="62" stroke={`hsl(30, 15%, ${12 + p * 6}%)`} strokeWidth="0.5" />
        <path d="M162 62 C163 58, 164 55, 165 52 C166 55, 167 58, 168 62 C166 63, 164 63, 162 62"
          fill={`hsl(90, ${15 + p * 15}%, ${10 + p * 6}%)`} />
        <path d="M160 64 C161 60, 163 56, 165 53 C164 56, 163 60, 162 64 C161 65, 160 65, 160 64"
          fill={`hsl(35, ${20 + p * 12}%, ${12 + p * 5}%)`} />
        <line x1="185" y1="54" x2="185" y2="65" stroke={`hsl(30, 15%, ${12 + p * 6}%)`} strokeWidth="0.5" />
        <path d="M182 65 C183 60, 184 57, 185 54 C186 57, 187 60, 188 65 C186 66, 184 66, 182 65"
          fill={`hsl(80, ${12 + p * 12}%, ${9 + p * 5}%)`} />
      </g>

      {/* ── SMALL RUG ── */}
      <ellipse cx="100" cy="188" rx="22" ry="6" fill={`hsl(15, ${10 + p * 15}%, ${8 + p * 5}%)`} opacity={0.35 + p * 0.3} />
      <ellipse cx="100" cy="188" rx="18" ry="4.5" fill={`hsl(25, ${12 + p * 12}%, ${10 + p * 6}%)`} opacity={0.25 + p * 0.2} />
      <line x1="85" y1="188" x2="115" y2="188" stroke={`hsl(35, ${8 + p * 10}%, ${14 + p * 5}%)`} strokeWidth="0.4" opacity={0.2 + p * 0.15} />
      <line x1="100" y1="183" x2="100" y2="193" stroke={`hsl(35, ${8 + p * 10}%, ${14 + p * 5}%)`} strokeWidth="0.4" opacity={0.2 + p * 0.15} />

      {/* ── FLOOR WARMTH ── */}
      {(c1 + c2 + c3) > 0.3 && (
        <ellipse cx="265" cy="200" rx={92} ry={11} fill="#e89a30" opacity={(c1 + c2 + c3) * 0.035} />
      )}
      {c1 > 0.3 && <ellipse cx="210" cy="198" rx="32" ry="7" fill="#e89a30" opacity={c1 * 0.11} />}
      {c2 > 0.3 && <ellipse cx="262" cy="198" rx="34" ry="8" fill="#e89a30" opacity={c2 * 0.12} />}
      {c3 > 0.3 && <ellipse cx="318" cy="198" rx="30" ry="7" fill="#e89a30" opacity={c3 * 0.10} />}
      {c1 > 0.5 && <ellipse cx="210" cy="198" rx="14" ry="4" fill="#f0b050" opacity={c1 * 0.10} />}
      {c2 > 0.5 && <ellipse cx="262" cy="198" rx="16" ry="4" fill="#f0b050" opacity={c2 * 0.11} />}
      {c3 > 0.5 && <ellipse cx="318" cy="198" rx="13" ry="4" fill="#f0b050" opacity={c3 * 0.09} />}

      {/* ── WINDOW LIGHT on floor ── */}
      {windowWarm > 0.2 && (() => {
        const wlp = sub(p, 0.55, 0.4);
        return (
          <g opacity={wlp * 0.75}>
            <ellipse cx="95" cy="202" rx={54} ry={10} fill="#e89a30" opacity={0.05} />
            <ellipse cx="95" cy="200" rx={36} ry={6.5} fill="#f0b050" opacity={0.09} />
            <rect x="93.5" y="193" width="3" height="14" fill="#060304" opacity={0.22} />
            <rect x="72" y="199" width="46" height="2.2" fill="#060304" opacity={0.16} />
          </g>
        );
      })()}

      {/* ── WARM LIGHT OVERLAY ── */}
      <rect width="400" height="250" fill="url(#warmOverlay)" />

      {/* ── DUST MOTES ── */}
      {dustP > 0 && Array.from({ length: 10 }).map((_, i) => {
        const mx = 160 + (i * 41) % 180;
        const my = 40 + (i * 31) % 100;
        const drift = Math.sin(p * Math.PI * 2 + i * 1.5) * 3;
        const mp = sub(p, 0.55 + i * 0.03, 0.12);
        return mp > 0 ? (
          <circle key={i} cx={mx + drift} cy={my} r={0.5 + (i % 3) * 0.2} fill="#e8d0a0" opacity={mp * 0.15} />
        ) : null;
      })}
    </svg>
  );
}

export default memo(CottageScene);
