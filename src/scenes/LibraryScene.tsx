import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, TextureFilter, MistFilter } from "../svg/filters";
import { Wisp, StoneBlock } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

function LibraryScene({ progress: p }: SceneProps) {
  // ── Ambient light — dark cave that warms to mauve ──
  const ambientL = 3 + p * 14;
  const ambientS = 10 + p * 30;

  // ── Floating books ──
  const floatingBooks = [
    { x: 70,  shelfY: 180, color: "#8b4513", pages: "#e8d8c0", delay: 0.1,  rot: -12 },
    { x: 130, shelfY: 175, color: "#6a3070", pages: "#e0d0e8", delay: 0.2,  rot: 8 },
    { x: 220, shelfY: 182, color: "#2a5a4a", pages: "#d0e8d8", delay: 0.3,  rot: -18 },
    { x: 290, shelfY: 178, color: "#5a2a2a", pages: "#e8d0c8", delay: 0.4,  rot: 15 },
    { x: 340, shelfY: 176, color: "#3a3a6a", pages: "#d0d0e8", delay: 0.5,  rot: -10 },
    { x: 160, shelfY: 185, color: "#6a5a20", pages: "#e8e0c0", delay: 0.55, rot: 22 },
    { x: 250, shelfY: 180, color: "#4a2060", pages: "#d8c8e0", delay: 0.62, rot: -8 },
  ];

  // ── Crystal formations ──
  const crystals = [
    { x: 50,  y: 230, h: 28, w: 8,  angle: -8,  delay: 0.05, from: "floor" as const },
    { x: 85,  y: 230, h: 22, w: 6,  angle: 5,   delay: 0.12, from: "floor" as const },
    { x: 310, y: 230, h: 32, w: 9,  angle: 8,   delay: 0.08, from: "floor" as const },
    { x: 345, y: 230, h: 20, w: 7,  angle: -5,  delay: 0.18, from: "floor" as const },
    { x: 370, y: 230, h: 25, w: 6,  angle: 12,  delay: 0.15, from: "floor" as const },
    { x: 100, y: 20,  h: 20, w: 7,  angle: 175, delay: 0.1,  from: "ceil" as const },
    { x: 280, y: 18,  h: 24, w: 8,  angle: -170,delay: 0.14, from: "ceil" as const },
    { x: 180, y: 15,  h: 18, w: 5,  angle: 168, delay: 0.2,  from: "ceil" as const },
  ];

  // ── Dust motes / sparkles ──
  const sparkles = [
    { x: 60,  y: 80,  delay: 0.1 },
    { x: 120, y: 50,  delay: 0.2 },
    { x: 185, y: 95,  delay: 0.15 },
    { x: 230, y: 40,  delay: 0.3 },
    { x: 270, y: 75,  delay: 0.25 },
    { x: 320, y: 55,  delay: 0.35 },
    { x: 150, y: 120, delay: 0.4 },
    { x: 95,  y: 140, delay: 0.32 },
    { x: 340, y: 100, delay: 0.28 },
    { x: 200, y: 65,  delay: 0.45 },
    { x: 50,  y: 110, delay: 0.38 },
    { x: 375, y: 85,  delay: 0.42 },
  ];

  // ── Left bookshelf books ──
  const leftShelfBooks = [
    { x: 18, h: 28, w: 5, color: "#7a3030" },
    { x: 24, h: 32, w: 4, color: "#304070" },
    { x: 29, h: 26, w: 6, color: "#508030" },
    { x: 36, h: 30, w: 4, color: "#805030" },
    { x: 41, h: 24, w: 5, color: "#603060" },
    { x: 47, h: 34, w: 4, color: "#306050" },
    { x: 52, h: 28, w: 5, color: "#704040" },
    { x: 58, h: 22, w: 4, color: "#405080" },
    { x: 63, h: 30, w: 5, color: "#806020" },
    { x: 69, h: 26, w: 4, color: "#504070" },
  ];

  // ── Right bookshelf books ──
  const rightShelfBooks = [
    { x: 330, h: 30, w: 5, color: "#703838" },
    { x: 336, h: 26, w: 4, color: "#384870" },
    { x: 341, h: 32, w: 5, color: "#507038" },
    { x: 347, h: 24, w: 4, color: "#705838" },
    { x: 352, h: 28, w: 6, color: "#583868" },
    { x: 359, h: 34, w: 4, color: "#386858" },
    { x: 364, h: 26, w: 5, color: "#684848" },
    { x: 370, h: 30, w: 4, color: "#485878" },
    { x: 375, h: 22, w: 5, color: "#786828" },
    { x: 381, h: 28, w: 4, color: "#584878" },
  ];

  // ── Wisps ──
  const wisps = [
    { x: 100, y: 70,  delay: 0.5 },
    { x: 180, y: 45,  delay: 0.55 },
    { x: 260, y: 60,  delay: 0.6 },
    { x: 320, y: 80,  delay: 0.65 },
    { x: 140, y: 100, delay: 0.7 },
  ];

  // ── Stone tiles on floor ──
  const tiles = [
    { x: 0,   y: 228, w: 50,  h: 22, seed: 1 },
    { x: 52,  y: 230, w: 45,  h: 20, seed: 2 },
    { x: 100, y: 228, w: 55,  h: 22, seed: 3 },
    { x: 158, y: 230, w: 48,  h: 20, seed: 4 },
    { x: 208, y: 228, w: 52,  h: 22, seed: 5 },
    { x: 262, y: 230, w: 46,  h: 20, seed: 6 },
    { x: 310, y: 228, w: 50,  h: 22, seed: 7 },
    { x: 362, y: 230, w: 40,  h: 20, seed: 8 },
  ];

  // ── Chronicle tome glow ──
  const tomeP = sub(p, 0.8, 0.15);

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* Filters */}
        <GlowFilter id="crystalGlow" radius={8} color="#c088b0" opacity={0.5} />
        <GlowFilter id="bookGlow" radius={4} color="#c088b0" opacity={0.3} />
        <GlowFilter id="tomeGlow" radius={12} color="#e0b0d0" opacity={0.7} />
        <GlowFilter id="runeGlow" radius={5} color="#d8a8c8" opacity={0.5} />
        <GlowFilter id="wispGlow" radius={6} color="#c088b0" opacity={0.4} />
        <TextureFilter id="stoneTex" scale={0.1} intensity={0.18} seed={5} />
        <TextureFilter id="wallTex" scale={0.06} intensity={0.12} seed={9} />
        <MistFilter id="caveMist" scale={0.01} opacity={0.2} />

        {/* Ambient gradient — dark cave to mauve-lit */}
        <radialGradient id="ambientLight" cx="50%" cy="65%" r="60%">
          <stop offset="0%" stopColor="#c088b0" stopOpacity={p * 0.12} />
          <stop offset="50%" stopColor="#c088b0" stopOpacity={p * 0.06} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </radialGradient>

        {/* Ceiling gradient */}
        <linearGradient id="ceilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(280, ${ambientS}%, ${ambientL - 1}%)`} />
          <stop offset="100%" stopColor={`hsl(280, ${ambientS}%, ${ambientL + 3}%)`} />
        </linearGradient>

        {/* Tome radial */}
        <radialGradient id="tomeRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0b0d0" stopOpacity={tomeP * 0.6} />
          <stop offset="60%" stopColor="#c088b0" stopOpacity={tomeP * 0.2} />
          <stop offset="100%" stopColor="#c088b0" stopOpacity={0} />
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
      {/* ── Background — dark cavern ── */}
      <rect width="400" height="250" fill={`hsl(280, ${ambientS}%, ${ambientL}%)`} />

      {/* ── Cavern ceiling — curved bezier arch ── */}
      <path
        d="M0 0 L0 50 Q50 8, 120 18 C160 5, 240 5, 280 18 Q350 8, 400 50 L400 0 Z"
        fill={`hsl(270, ${10 + p * 8}%, ${4 + p * 3}%)`}
        filter="url(#wallTex)"
      />

      {/* ── Cavern walls — left ── */}
      <path
        d="M0 50 Q50 8, 120 18 C130 20, 130 25, 125 35
           Q110 60, 95 90 L85 130 Q80 160, 82 190 L80 230 L0 230 Z"
        fill={`hsl(268, ${8 + p * 6}%, ${5 + p * 4}%)`}
        filter="url(#wallTex)"
      />

      {/* ── Cavern walls — right ── */}
      <path
        d="M400 50 Q350 8, 280 18 C270 20, 270 25, 275 35
           Q290 60, 305 90 L315 130 Q320 160, 318 190 L320 230 L400 230 Z"
        fill={`hsl(268, ${8 + p * 6}%, ${5 + p * 4}%)`}
        filter="url(#wallTex)"
      />

      {/* ── Archway at back center — suggesting depth ── */}
      <path
        d="M165 230 L165 130 Q165 90, 200 80 Q235 90, 235 130 L235 230 Z"
        fill={`hsl(275, ${12 + p * 10}%, ${3 + p * 2}%)`}
      />
      {/* Arch border */}
      <path
        d="M165 230 L165 130 Q165 90, 200 80 Q235 90, 235 130 L235 230"
        fill="none"
        stroke={`hsl(270, ${15 + p * 10}%, ${8 + p * 5}%)`}
        strokeWidth={2.5}
      />
      {/* Faint glow from archway */}
      <ellipse
        cx={200} cy={160}
        rx={25} ry={40}
        fill="#c088b0"
        opacity={p * 0.04}
      />

      </g>
      <g className="midLayer">
      {/* ── Stone columns — left and right ── */}
      {/* Left column */}
      <rect
        x={88} y={35} width={16} height={195}
        fill={`hsl(265, ${6 + p * 5}%, ${10 + p * 5}%)`}
        filter="url(#stoneTex)"
      />
      <rect x={85} y={30} width={22} height={10} rx={2}
        fill={`hsl(265, ${6 + p * 5}%, ${12 + p * 5}%)`}
      />
      <rect x={85} y={225} width={22} height={8} rx={2}
        fill={`hsl(265, ${6 + p * 5}%, ${12 + p * 5}%)`}
      />

      {/* Right column */}
      <rect
        x={296} y={35} width={16} height={195}
        fill={`hsl(265, ${6 + p * 5}%, ${10 + p * 5}%)`}
        filter="url(#stoneTex)"
      />
      <rect x={293} y={30} width={22} height={10} rx={2}
        fill={`hsl(265, ${6 + p * 5}%, ${12 + p * 5}%)`}
      />
      <rect x={293} y={225} width={22} height={8} rx={2}
        fill={`hsl(265, ${6 + p * 5}%, ${12 + p * 5}%)`}
      />

      {/* ── Left bookshelf ── */}
      <rect x={12} y={100} width={68} height={130}
        fill={`hsl(25, 30%, ${8 + p * 5}%)`}
        filter="url(#stoneTex)"
      />
      {/* Shelf dividers */}
      {[130, 165, 195].map((sy) => (
        <rect key={sy} x={12} y={sy} width={68} height={3}
          fill={`hsl(25, 25%, ${12 + p * 5}%)`}
        />
      ))}
      {/* Books on left shelf — row 1 */}
      {leftShelfBooks.slice(0, 5).map((b, i) => (
        <rect key={`lb1-${i}`} x={b.x} y={130 - b.h + 3} width={b.w} height={b.h}
          fill={b.color} opacity={0.4 + p * 0.5} rx={0.5}
        />
      ))}
      {/* Books on left shelf — row 2 */}
      {leftShelfBooks.slice(5).map((b, i) => (
        <rect key={`lb2-${i}`} x={b.x} y={165 - b.h + 3} width={b.w} height={b.h}
          fill={b.color} opacity={0.4 + p * 0.5} rx={0.5}
        />
      ))}

      {/* ── Right bookshelf ── */}
      <rect x={324} y={100} width={68} height={130}
        fill={`hsl(25, 30%, ${8 + p * 5}%)`}
        filter="url(#stoneTex)"
      />
      {[130, 165, 195].map((sy) => (
        <rect key={`rs-${sy}`} x={324} y={sy} width={68} height={3}
          fill={`hsl(25, 25%, ${12 + p * 5}%)`}
        />
      ))}
      {rightShelfBooks.slice(0, 5).map((b, i) => (
        <rect key={`rb1-${i}`} x={b.x} y={130 - b.h + 3} width={b.w} height={b.h}
          fill={b.color} opacity={0.4 + p * 0.5} rx={0.5}
        />
      ))}
      {rightShelfBooks.slice(5).map((b, i) => (
        <rect key={`rb2-${i}`} x={b.x} y={165 - b.h + 3} width={b.w} height={b.h}
          fill={b.color} opacity={0.4 + p * 0.5} rx={0.5}
        />
      ))}

      {/* ── Stone tile floor ── */}
      {tiles.map((t, i) => (
        <StoneBlock key={`tile-${i}`}
          x={t.x} y={t.y} width={t.w} height={t.h}
          color={`hsl(265, ${5 + p * 3}%, ${8 + p * 4}%)`}
          roughness={2} seed={t.seed}
        />
      ))}
      {/* Floor base */}
      <rect x={0} y={227} width={400} height={23}
        fill={`hsl(268, ${6 + p * 4}%, ${6 + p * 3}%)`}
        filter="url(#stoneTex)"
      />

      {/* ── Crystal formations ── */}
      {crystals.map((c, i) => {
        const cp = sub(p, c.delay, 0.3);
        const h = c.h * cp;
        const w = c.w * (0.6 + cp * 0.4);
        const brightness = 40 + p * 30;
        const baseY = c.y;
        const tipY = c.from === "floor" ? baseY - h : baseY + h;

        return (
          <g key={`crystal-${i}`} opacity={cp}>
            <polygon
              points={`
                ${c.x - w / 2},${baseY}
                ${c.x - w * 0.15},${tipY}
                ${c.x + w * 0.1},${tipY + (c.from === "floor" ? 3 : -3)}
                ${c.x + w / 2},${baseY}
              `}
              fill={`hsl(290, ${30 + p * 25}%, ${brightness}%)`}
              opacity={0.7 + cp * 0.3}
              transform={`rotate(${c.angle}, ${c.x}, ${baseY})`}
              filter={cp > 0.5 ? "url(#crystalGlow)" : undefined}
            />
            {/* Secondary shard */}
            <polygon
              points={`
                ${c.x + w * 0.2},${baseY}
                ${c.x + w * 0.15},${tipY + (c.from === "floor" ? h * 0.3 : -h * 0.3)}
                ${c.x + w * 0.35},${tipY + (c.from === "floor" ? h * 0.25 : -h * 0.25)}
                ${c.x + w * 0.5},${baseY}
              `}
              fill={`hsl(300, ${25 + p * 20}%, ${brightness + 10}%)`}
              opacity={0.5 + cp * 0.3}
              transform={`rotate(${c.angle + 5}, ${c.x}, ${baseY})`}
            />
          </g>
        );
      })}

      {/* ── Reading pedestal — center ── */}
      <g>
        {/* Pedestal base */}
        <path
          d={`M185 230 L188 200 Q190 192, 200 190 Q210 192, 212 200 L215 230 Z`}
          fill={`hsl(260, ${8 + p * 5}%, ${12 + p * 5}%)`}
          filter="url(#stoneTex)"
        />
        {/* Pedestal top surface */}
        <ellipse cx={200} cy={190} rx={18} ry={5}
          fill={`hsl(258, ${10 + p * 5}%, ${15 + p * 5}%)`}
        />

        {/* ── Chronicle of the Nexus — glowing tome ── */}
        {tomeP > 0 && (
          <g opacity={tomeP}>
            {/* Tome glow halo */}
            <ellipse cx={200} cy={182} rx={30} ry={18}
              fill="url(#tomeRadial)"
            />
            {/* Book shape */}
            <rect x={190} y={178} width={20} height={14} rx={1}
              fill="#3a1840"
              filter="url(#tomeGlow)"
            />
            {/* Book spine */}
            <line x1={200} y1={178} x2={200} y2={192}
              stroke="#c088b0" strokeWidth={0.5} opacity={0.6}
            />
            {/* Glowing pages */}
            <rect x={192} y={180} width={7} height={10} rx={0.5}
              fill="#e8d0e0" opacity={0.7}
            />
            <rect x={201} y={180} width={7} height={10} rx={0.5}
              fill="#e8d0e0" opacity={0.7}
            />
            {/* Rune on tome */}
            <path
              d="M197 183 L200 186 L203 183 M200 186 L200 189"
              fill="none" stroke="#e0b0d0" strokeWidth={0.8}
              filter="url(#runeGlow)"
              opacity={tomeP}
            />
          </g>
        )}
      </g>

      {/* ── Floating books ── */}
      {floatingBooks.map((book, i) => {
        const bp = sub(p, book.delay, 0.25);
        const floatY = book.shelfY - bp * (60 + i * 12);
        const rotation = book.rot * bp;
        const bookW = 14 + (i % 3) * 2;
        const bookH = 10 + (i % 4);

        return bp > 0 ? (
          <g key={`fbook-${i}`}
            transform={`translate(${book.x}, ${floatY}) rotate(${rotation})`}
            opacity={0.6 + bp * 0.4}
          >
            {/* Book body */}
            <rect x={-bookW / 2} y={-bookH / 2} width={bookW} height={bookH}
              rx={1} fill={book.color}
              filter={bp > 0.4 ? "url(#bookGlow)" : undefined}
            />
            {/* Pages edge */}
            <rect x={-bookW / 2 + 1.5} y={-bookH / 2 + 1} width={bookW - 3} height={bookH - 2}
              fill={book.pages} opacity={0.6} rx={0.5}
            />
            {/* Spine line */}
            <line x1={0} y1={-bookH / 2} x2={0} y2={bookH / 2}
              stroke={book.pages} strokeWidth={0.4} opacity={0.4}
            />
          </g>
        ) : null;
      })}

      </g>
      <g className="fgLayer">
      {/* ── Dust motes / sparkle particles ── */}
      {sparkles.map((s, i) => {
        const sp = sub(p, s.delay, 0.15);
        const drift = sp * ((i % 2 === 0) ? 5 : -3);
        return sp > 0 ? (
          <g key={`sparkle-${i}`} opacity={sp * (0.3 + (i % 3) * 0.15)}>
            <circle cx={s.x + drift} cy={s.y - sp * 8} r={1.2}
              fill="#e0c8d8" opacity={0.5}
            />
            <circle cx={s.x + drift} cy={s.y - sp * 8} r={3}
              fill="#c088b0" opacity={0.08}
            />
          </g>
        ) : null;
      })}

      {/* ── Spirit wisps — enter after 50% ── */}
      {wisps.map((w, i) => {
        const wp = sub(p, w.delay, 0.15);
        const driftX = wp * Math.sin(i * 2.3) * 15;
        const driftY = wp * Math.cos(i * 1.7) * 8;
        return wp > 0 ? (
          <Wisp
            key={`wisp-${i}`}
            x={w.x + driftX}
            y={w.y + driftY}
            color="#c088b0"
            radius={2 + (i % 2)}
            opacity={wp * 0.55}
          />
        ) : null;
      })}

      </g>
      {/* ── Ambient light overlay ── */}
      <rect width="400" height="250" fill="url(#ambientLight)" />

      {/* ── Cave mist — faint atmospheric layer ── */}
      <rect x={0} y={150} width={400} height={100}
        fill="#c088b0"
        opacity={(0.5 + p * 0.5) * 0.04}
        filter="url(#caveMist)"
      />

      {/* ── Vignette overlay for cave depth ── */}
      <rect width="400" height="250"
        fill={`hsl(280, 15%, 2%)`}
        opacity={Math.max(0, 0.3 - p * 0.2)}
      />

      {/* Atmospheric particles — dust motes catching light */}
      {Array.from({ length: 40 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 220 + 15;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 8;
        const py = baseY - p * 30 * ((i % 5) / 5);
        const size = 0.5 + (i % 4) * 0.25;
        const opacity = (0.08 + (i % 3) * 0.06) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={py} r={size}
            fill={i % 4 === 0 ? "#d8b0d0" : "#c088b0"} opacity={opacity} />
        );
      })}
    </svg>
  );
}

export default memo(LibraryScene);
