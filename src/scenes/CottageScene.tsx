import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, TextureFilter } from "../svg/filters";
import { Wisp } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

function CottageScene({ progress: p }: SceneProps) {
  // ── Ambient warmth — room color warms as candles light ──
  const ambientR = 12 + p * 28;
  const ambientG = 10 + p * 14;
  const ambientB = 10 + p * 4;
  const ambientColor = `rgb(${ambientR}, ${ambientG}, ${ambientB})`;

  // ── Candle progress ──
  const candle1 = sub(p, 0.08, 0.18);
  const candle2 = sub(p, 0.28, 0.18);
  const candle3 = sub(p, 0.48, 0.18);

  // ── Window glow ──
  const windowGlow = sub(p, 0.05, 0.6);

  // ── Mug steam ──
  const steamP = sub(p, 0.5, 0.2);

  // ── Cat silhouette ──
  const catP = sub(p, 0.72, 0.2);

  // ── Bookshelf books fade in ──
  const booksP = sub(p, 0.12, 0.35);

  // ── Floorboard visibility ──
  const floorP = sub(p, 0.02, 0.3);

  // ── Shelf ──
  const shelfP = sub(p, 0.05, 0.2);

  // book data
  const books = [
    { x: 240, w: 10, h: 34, color: "#6b2020", delay: 0.12 },
    { x: 252, w: 12, h: 38, color: "#1e3a5a", delay: 0.16 },
    { x: 266, w: 9,  h: 30, color: "#3a5a2a", delay: 0.22 },
    { x: 277, w: 11, h: 36, color: "#5a2a5a", delay: 0.28 },
    { x: 290, w: 10, h: 32, color: "#5a4a1a", delay: 0.33 },
    { x: 302, w: 13, h: 40, color: "#2a2a4a", delay: 0.38 },
    { x: 317, w: 9,  h: 28, color: "#6a3a2a", delay: 0.42 },
    { x: 328, w: 11, h: 35, color: "#1a4a4a", delay: 0.46 },
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* Filters */}
        <TextureFilter id="woodTex" scale={0.06} intensity={0.18} seed={5} />
        <TextureFilter id="wallTex" scale={0.04} intensity={0.12} seed={12} />
        <TextureFilter id="floorTex" scale={0.1} intensity={0.15} seed={8} />
        <GlowFilter id="candleGlow1" radius={12} color="#e89a30" opacity={0.5} />
        <GlowFilter id="candleGlow2" radius={8} color="#e89a30" opacity={0.4} />
        <GlowFilter id="windowGlowF" radius={16} color="#e89a30" opacity={0.35} />
        <GlowFilter id="flameGlowInner" radius={3} color="#ffe080" opacity={0.7} />

        {/* Ambient warm radial for candle light pools */}
        <radialGradient id="lightPool1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={0.18 * candle1} />
          <stop offset="60%" stopColor="#e89a30" stopOpacity={0.06 * candle1} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="lightPool2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={0.18 * candle2} />
          <stop offset="60%" stopColor="#e89a30" stopOpacity={0.06 * candle2} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="lightPool3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={0.18 * candle3} />
          <stop offset="60%" stopColor="#e89a30" stopOpacity={0.06 * candle3} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>

        {/* Window amber gradient */}
        <radialGradient id="windowAmber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e89a30" stopOpacity={windowGlow * 0.6} />
          <stop offset="70%" stopColor="#e89a30" stopOpacity={windowGlow * 0.2} />
          <stop offset="100%" stopColor="#e89a30" stopOpacity={0} />
        </radialGradient>
        {/* Parallax animations */}
        <style>{`
          @keyframes parallaxSlow { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-3px); } }
          @keyframes parallaxMed { 0%,100% { transform: translateX(0); } 50% { transform: translateX(2px); } }
          @keyframes parallaxFast { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-1px) translateY(-1px); } }
          .bgLayer { animation: parallaxSlow 12s ease-in-out infinite; }
          .midLayer { animation: parallaxMed 10s ease-in-out infinite; }
          .fgLayer { animation: parallaxFast 8s ease-in-out infinite; }
        `}</style>
      </defs>

      <g className="bgLayer">
      {/* ══════ BACKGROUND LAYER ══════ */}

      {/* Room base — dark walls */}
      <rect width="400" height="250" fill={ambientColor} />

      {/* Back wall with wood texture */}
      <rect x="0" y="0" width="400" height="190" fill={`rgb(${22 + p * 18}, ${18 + p * 10}, ${14 + p * 4})`} filter="url(#wallTex)" />

      {/* Wall panel lines — vertical wood paneling */}
      {[55, 120, 185, 250, 315, 380].map((x, i) => (
        <line
          key={`panel-${i}`}
          x1={x} y1={0} x2={x} y2={190}
          stroke={`rgba(${8 + p * 10}, ${6 + p * 6}, ${4 + p * 2}, ${0.3 + p * 0.15})`}
          strokeWidth={1.5}
        />
      ))}

      {/* Horizontal wainscoting rail */}
      <rect x="0" y="130" width="400" height="4" fill={`rgb(${30 + p * 12}, ${22 + p * 8}, ${14 + p * 3})`} />
      <rect x="0" y="60" width="400" height="2" fill={`rgba(${30 + p * 12}, ${22 + p * 8}, ${14 + p * 3}, 0.5)`} />

      {/* ══════ WINDOW ══════ */}
      {/* Window recess */}
      <rect x="55" y="28" width="68" height="88" rx="3" fill={`rgb(${8 + p * 5}, ${6 + p * 3}, ${5})`} />

      {/* Window panes — start dark, fill with amber glow */}
      <rect x="59" y="32" width="28" height="38" rx="1" fill={`rgba(${20 + Math.floor(windowGlow * 180)}, ${15 + Math.floor(windowGlow * 100)}, ${12 + Math.floor(windowGlow * 20)}, 1)`} />
      <rect x="91" y="32" width="28" height="38" rx="1" fill={`rgba(${20 + Math.floor(windowGlow * 170)}, ${15 + Math.floor(windowGlow * 95)}, ${12 + Math.floor(windowGlow * 18)}, 1)`} />
      <rect x="59" y="74" width="28" height="38" rx="1" fill={`rgba(${20 + Math.floor(windowGlow * 160)}, ${15 + Math.floor(windowGlow * 90)}, ${12 + Math.floor(windowGlow * 16)}, 1)`} />
      <rect x="91" y="74" width="28" height="38" rx="1" fill={`rgba(${20 + Math.floor(windowGlow * 165)}, ${15 + Math.floor(windowGlow * 92)}, ${12 + Math.floor(windowGlow * 17)}, 1)`} />

      {/* Window glow aura */}
      {windowGlow > 0.05 && (
        <ellipse
          cx="89" cy="70" rx="65" ry="55"
          fill="url(#windowAmber)"
          filter="url(#windowGlowF)"
        />
      )}

      {/* Thick wooden muntins */}
      <rect x="86" y="28" width="6" height="88" rx="1" fill={`rgb(${28 + p * 10}, ${20 + p * 6}, ${12 + p * 2})`} />
      <rect x="55" y="68" width="68" height="5" rx="1" fill={`rgb(${28 + p * 10}, ${20 + p * 6}, ${12 + p * 2})`} />
      {/* Window frame */}
      <rect x="53" y="26" width="72" height="92" rx="4" fill="none" stroke={`rgb(${35 + p * 10}, ${26 + p * 7}, ${16 + p * 3})`} strokeWidth="3" />
      {/* Window sill */}
      <rect x="48" y="116" width="82" height="6" rx="2" fill={`rgb(${35 + p * 10}, ${26 + p * 7}, ${16 + p * 3})`} filter="url(#woodTex)" />

      </g>

      <g className="midLayer">
      {/* ══════ MIDGROUND LAYER ══════ */}

      {/* ── Shelf on wall ── */}
      <rect
        x="145" y="100" width="230" height="5" rx="1"
        fill={`rgb(${34 + p * 12}, ${26 + p * 8}, ${16 + p * 3})`}
        opacity={0.3 + shelfP * 0.7}
        filter="url(#woodTex)"
      />
      {/* Shelf bracket left */}
      <path
        d={`M158 105 L158 118 Q158 120 160 120 L165 120 L158 105`}
        fill={`rgb(${30 + p * 10}, ${22 + p * 6}, ${14 + p * 2})`}
        opacity={0.3 + shelfP * 0.7}
      />
      {/* Shelf bracket right */}
      <path
        d={`M362 105 L362 118 Q362 120 360 120 L355 120 L362 105`}
        fill={`rgb(${30 + p * 10}, ${22 + p * 6}, ${14 + p * 2})`}
        opacity={0.3 + shelfP * 0.7}
      />

      {/* ── Three Candles on shelf ── */}
      {/* Candle 1 — left */}
      <g opacity={0.3 + candle1 * 0.7}>
        {/* Wax body — tapered */}
        <path
          d="M168 100 L166 82 Q167 78 170 78 Q173 78 174 82 L172 100 Z"
          fill={`rgb(${200 + Math.floor(candle1 * 40)}, ${190 + Math.floor(candle1 * 30)}, ${170})`}
        />
        {/* Lit side highlight */}
        <path
          d="M170 80 L172 100 L174 82 Z"
          fill={`rgba(255, 220, 160, ${candle1 * 0.25})`}
        />
        {/* Flame — outer */}
        {candle1 > 0.3 && (
          <>
            <ellipse cx="170" cy="73" rx="4.5" ry="7" fill="#e89a30" opacity={candle1 * 0.7} filter="url(#candleGlow1)" />
            {/* Flame — inner bright */}
            <ellipse cx="170" cy="74" rx="2" ry="5" fill="#ffe890" opacity={candle1 * 0.9} filter="url(#flameGlowInner)" />
            <ellipse cx="170" cy="75.5" rx="1" ry="2.5" fill="#fff8e0" opacity={candle1} />
          </>
        )}
        {/* Light pool on wall */}
        <ellipse cx="170" cy="85" rx="45" ry="40" fill="url(#lightPool1)" />
      </g>

      {/* Candle 2 — center */}
      <g opacity={0.3 + candle2 * 0.7}>
        <path
          d="M258 100 L256 78 Q257 74 260 74 Q263 74 264 78 L262 100 Z"
          fill={`rgb(${200 + Math.floor(candle2 * 40)}, ${190 + Math.floor(candle2 * 30)}, ${170})`}
        />
        <path
          d="M260 76 L262 100 L264 78 Z"
          fill={`rgba(255, 220, 160, ${candle2 * 0.25})`}
        />
        {candle2 > 0.3 && (
          <>
            <ellipse cx="260" cy="69" rx="5" ry="7.5" fill="#e89a30" opacity={candle2 * 0.7} filter="url(#candleGlow1)" />
            <ellipse cx="260" cy="70" rx="2.2" ry="5.5" fill="#ffe890" opacity={candle2 * 0.9} filter="url(#flameGlowInner)" />
            <ellipse cx="260" cy="71.5" rx="1.1" ry="2.8" fill="#fff8e0" opacity={candle2} />
          </>
        )}
        <ellipse cx="260" cy="82" rx="48" ry="42" fill="url(#lightPool2)" />
      </g>

      {/* Candle 3 — right */}
      <g opacity={0.3 + candle3 * 0.7}>
        <path
          d="M348 100 L346 85 Q347 81 350 81 Q353 81 354 85 L352 100 Z"
          fill={`rgb(${200 + Math.floor(candle3 * 40)}, ${190 + Math.floor(candle3 * 30)}, ${170})`}
        />
        <path
          d="M350 83 L352 100 L354 85 Z"
          fill={`rgba(255, 220, 160, ${candle3 * 0.25})`}
        />
        {candle3 > 0.3 && (
          <>
            <ellipse cx="350" cy="76" rx="4" ry="6.5" fill="#e89a30" opacity={candle3 * 0.7} filter="url(#candleGlow1)" />
            <ellipse cx="350" cy="77" rx="1.8" ry="4.8" fill="#ffe890" opacity={candle3 * 0.9} filter="url(#flameGlowInner)" />
            <ellipse cx="350" cy="78.5" rx="0.9" ry="2.3" fill="#fff8e0" opacity={candle3} />
          </>
        )}
        <ellipse cx="350" cy="88" rx="40" ry="38" fill="url(#lightPool3)" />
      </g>

      {/* ── Bookshelf (below shelf, against wall) ── */}
      {/* Bookshelf frame */}
      <rect
        x="232" y="130" width="108" height="56" rx="2"
        fill={`rgb(${26 + p * 10}, ${20 + p * 6}, ${12 + p * 2})`}
        opacity={0.3 + booksP * 0.7}
        filter="url(#woodTex)"
      />
      {/* Shelf dividers */}
      <rect x="232" y="155" width="108" height="2" fill={`rgb(${34 + p * 10}, ${26 + p * 6}, ${16 + p * 2})`} opacity={0.3 + booksP * 0.7} />

      {/* Books — top row */}
      {books.slice(0, 4).map((b, i) => {
        const bp = sub(p, b.delay, 0.2);
        const litSide = i < 2 ? candle2 * 0.15 : candle3 * 0.12;
        return (
          <g key={`book-t-${i}`} opacity={0.2 + bp * 0.8}>
            <rect
              x={b.x} y={155 - b.h * 0.7}
              width={b.w} height={b.h * 0.7}
              rx="1"
              fill={b.color}
            />
            {/* Spine highlight from candlelight */}
            <rect
              x={b.x} y={155 - b.h * 0.7}
              width={2} height={b.h * 0.7}
              fill="#e89a30"
              opacity={litSide}
            />
          </g>
        );
      })}

      {/* Books — bottom row */}
      {books.slice(4).map((b, i) => {
        const bp = sub(p, b.delay, 0.2);
        const litSide = candle2 * 0.12 + candle3 * 0.08;
        return (
          <g key={`book-b-${i}`} opacity={0.2 + bp * 0.8}>
            <rect
              x={b.x} y={186 - b.h * 0.65}
              width={b.w} height={b.h * 0.65}
              rx="1"
              fill={b.color}
            />
            <rect
              x={b.x} y={186 - b.h * 0.65}
              width={2} height={b.h * 0.65}
              fill="#e89a30"
              opacity={litSide}
            />
          </g>
        );
      })}

      {/* ══════ FLOOR LAYER ══════ */}

      {/* Floor base */}
      <rect x="0" y="190" width="400" height="60" fill={`rgb(${20 + p * 14}, ${16 + p * 8}, ${10 + p * 3})`} filter="url(#floorTex)" />

      {/* Floorboard lines — horizontal with slight perspective */}
      {[195, 205, 218, 234].map((y, i) => (
        <line
          key={`floor-${i}`}
          x1="0" y1={y} x2="400" y2={y + (i % 2 === 0 ? 1 : -0.5)}
          stroke={`rgba(${10 + p * 8}, ${8 + p * 5}, ${5 + p * 2}, ${(0.15 + floorP * 0.2)})`}
          strokeWidth={1}
        />
      ))}

      {/* Floorboard vertical seams — wood grain direction */}
      {[45, 95, 150, 205, 260, 320, 375].map((x, i) => (
        <line
          key={`seam-${i}`}
          x1={x + (i % 2) * 5} y1="190" x2={x} y2="250"
          stroke={`rgba(${8 + p * 6}, ${6 + p * 4}, ${4 + p * 2}, ${0.12 + floorP * 0.1})`}
          strokeWidth={0.8}
        />
      ))}

      {/* Floor candle light reflections */}
      {candle1 > 0.3 && (
        <ellipse cx="170" cy="210" rx="30" ry="12" fill="#e89a30" opacity={candle1 * 0.04} />
      )}
      {candle2 > 0.3 && (
        <ellipse cx="260" cy="210" rx="35" ry="14" fill="#e89a30" opacity={candle2 * 0.05} />
      )}
      {candle3 > 0.3 && (
        <ellipse cx="350" cy="210" rx="28" ry="10" fill="#e89a30" opacity={candle3 * 0.04} />
      )}

      </g>

      <g className="fgLayer">
      {/* ══════ FOREGROUND OBJECTS ══════ */}

      {/* ── Ceramic Mug ── */}
      <g opacity={0.4 + sub(p, 0.3, 0.25) * 0.6}>
        {/* Mug body — slightly tapered elliptical */}
        <path
          d="M145 204 Q143 195 144 190 Q145 186 152 186 Q159 186 160 190 Q161 195 159 204 Z"
          fill={`rgb(${140 + Math.floor(candle1 * 40)}, ${90 + Math.floor(candle1 * 20)}, ${60})`}
        />
        {/* Mug lit side from candle 1 */}
        <path
          d="M155 186 Q159 186 160 190 Q161 195 159 204 L157 204 Q158 195 157 190 Z"
          fill="#e89a30"
          opacity={candle1 * 0.2}
        />
        {/* Handle */}
        <path
          d="M159 190 Q167 190 167 196 Q167 202 159 202"
          fill="none"
          stroke={`rgb(${130 + Math.floor(candle1 * 30)}, ${85 + Math.floor(candle1 * 15)}, ${55})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Mug rim */}
        <ellipse cx="152" cy="186" rx="8" ry="2.5" fill={`rgb(${155 + Math.floor(candle1 * 30)}, ${100 + Math.floor(candle1 * 15)}, ${70})`} />
        {/* Liquid inside */}
        <ellipse cx="152" cy="187" rx="6.5" ry="1.8" fill={`rgb(${50 + Math.floor(candle1 * 20)}, ${25 + Math.floor(candle1 * 10)}, ${10})`} />

        {/* Steam wisps */}
        {steamP > 0 && (
          <>
            <Wisp x={149} y={180 - steamP * 8} color="#d8d0c8" radius={1.5} opacity={steamP * 0.25} />
            <Wisp x={153} y={176 - steamP * 12} color="#d8d0c8" radius={1.2} opacity={steamP * 0.2} />
            <Wisp x={156} y={178 - steamP * 6} color="#d8d0c8" radius={1.0} opacity={steamP * 0.18} />
            {/* Extra wisp curls via paths */}
            <path
              d={`M149 ${182 - steamP * 10} Q147 ${175 - steamP * 12} 150 ${170 - steamP * 14}`}
              fill="none" stroke="#c8c0b8" strokeWidth="0.8" strokeLinecap="round"
              opacity={steamP * 0.15}
            />
            <path
              d={`M155 ${181 - steamP * 8} Q158 ${174 - steamP * 10} 155 ${168 - steamP * 13}`}
              fill="none" stroke="#c8c0b8" strokeWidth="0.7" strokeLinecap="round"
              opacity={steamP * 0.12}
            />
          </>
        )}
      </g>

      {/* ── Cat silhouette — bezier organic shape ── */}
      {catP > 0 && (
        <g opacity={catP * 0.85}>
          {/* Cat body — sitting, facing slightly left */}
          <path
            d={`
              M42 208
              C42 198 48 190 55 188
              C58 187 60 186 62 183
              L65 178
              C66 176 68 176 68 178
              L68 181
              L72 176
              C73 174 75 174 75 177
              L73 182
              C75 183 76 185 76 188
              C78 188 80 190 80 192
              C80 194 78 195 76 195
              C75 198 72 202 72 208
              C72 210 70 212 65 212
              L48 212
              C43 212 42 210 42 208
              Z
            `}
            fill={`rgb(${14 + Math.floor(p * 8)}, ${12 + Math.floor(p * 5)}, ${10 + Math.floor(p * 3)})`}
          />
          {/* Tail — curving bezier */}
          <path
            d={`M72 206 C82 202 92 195 88 186 C86 182 80 184 82 190`}
            fill="none"
            stroke={`rgb(${14 + Math.floor(p * 8)}, ${12 + Math.floor(p * 5)}, ${10 + Math.floor(p * 3)})`}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Eye — subtle glint */}
          <circle cx="64" cy="183" r="1" fill="#e89a30" opacity={catP * 0.6} />
          <circle cx="70" cy="183.5" r="0.8" fill="#e89a30" opacity={catP * 0.5} />
          {/* Ear inner highlights */}
          <path d="M64 178.5 L65.5 176.5 L66.5 179" fill="none" stroke="#e89a30" strokeWidth="0.4" opacity={catP * 0.2} />
          <path d="M71.5 177 L72.5 175 L73.5 178" fill="none" stroke="#e89a30" strokeWidth="0.4" opacity={catP * 0.2} />
        </g>
      )}

      {/* ── Shadow cast by mug from candle 1 ── */}
      {candle1 > 0.3 && (
        <ellipse cx="138" cy="210" rx="12" ry="3" fill="#000" opacity={candle1 * 0.08} />
      )}

      {/* ── Shadow cast by bookshelf from candles ── */}
      {(candle2 > 0.3 || candle3 > 0.3) && (
        <rect x="232" y="186" width="108" height="6" fill="#000" opacity={Math.max(candle2, candle3) * 0.06} />
      )}

      </g>

      {/* ══════ AMBIENT OVERLAYS ══════ */}

      {/* Overall warm wash as candles light up */}
      <rect
        width="400" height="250"
        fill="#e89a30"
        opacity={p * 0.04}
      />

      {/* Vignette — dark corners for coziness */}
      <rect width="400" height="250" fill="url(#vignette)" opacity={0.6} />

      {/* Subtle dust motes in candlelight — late appearance */}
      {p > 0.6 && (
        <>
          <Wisp x={180} y={95} color="#e8d8b0" radius={0.8} opacity={sub(p, 0.6, 0.15) * 0.15} />
          <Wisp x={250} y={80} color="#e8d8b0" radius={0.6} opacity={sub(p, 0.65, 0.15) * 0.12} />
          <Wisp x={310} y={92} color="#e8d8b0" radius={0.7} opacity={sub(p, 0.7, 0.15) * 0.14} />
          <Wisp x={195} y={110} color="#e8d8b0" radius={0.5} opacity={sub(p, 0.75, 0.15) * 0.1} />
          <Wisp x={340} y={105} color="#e8d8b0" radius={0.9} opacity={sub(p, 0.8, 0.15) * 0.13} />
          <Wisp x={160} y={75} color="#e8d8b0" radius={0.6} opacity={sub(p, 0.85, 0.12) * 0.11} />
        </>
      )}

      {/* Atmospheric particles — dust motes and tiny embers */}
      {Array.from({ length: 40 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 220 + 15;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 8;
        const py = baseY - p * 30 * ((i % 5) / 5);
        const size = 0.5 + (i % 4) * 0.25;
        const opacity = (0.08 + (i % 3) * 0.06) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={py} r={size}
            fill={i % 5 === 0 ? "#e8a040" : "#e8d0a0"} opacity={opacity} />
        );
      })}
    </svg>
  );
}

export default memo(CottageScene);
