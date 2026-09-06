import { useState, useEffect } from "react";
import { useGameStore } from "../../store";
import { startIntroDrone, stopIntroDrone } from "../../audio";
import { useInput } from "../../contexts/InputContext";
import { shareInkwood } from "../../share";
import s from "../../styles/Intro2.module.css";

/**
 * Intro sequence: a 16-second slow pan across a grey, dormant world.
 * Three vignettes fade in/out — the dead garden, dark cottage, starless sky.
 * Then a faint spark of light → title → begin button.
 * Zero text until the title. Pure visual storytelling.
 */

/** Dormant Garden — grey, washed out, clearly lifeless but VERY visible.
 *  Trees use gnarled bezier trunks with tapered, twisting bare branches
 *  (no leaves — it's winter / dormant) rather than straight Y-sticks. */
function DormantGarden({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      {/* Overcast grey sky */}
      <rect width="400" height="250" fill="hsl(200, 5%, 25%)" />
      <rect width="400" height="120" fill="hsl(210, 6%, 30%)" />
      {/* Dead hills — grey-brown */}
      <path d="M0 185 Q100 155 200 178 Q300 195 400 170 L400 250 L0 250Z" fill="hsl(40, 4%, 20%)" />
      <path d="M0 205 Q80 188 180 200 Q280 215 400 195 L400 250 L0 250Z" fill="hsl(40, 3%, 22%)" />

      {/* ── Left dormant tree — gnarled bare oak silhouette ── */}
      <g>
        {/* Trunk — bezier with slight curve */}
        <path d="M74 208
                 C73 198, 76 190, 74 180
                 C72 170, 77 160, 75 150
                 C73 140, 78 132, 76 122
                 C76 118, 78 115, 80 113
                 C82 115, 84 118, 84 122
                 C84 132, 87 140, 85 150
                 C83 160, 86 170, 84 180
                 C82 190, 85 198, 84 208 Z"
          fill="hsl(30, 5%, 28%)" />
        {/* Major branches — bare, tapered, forking */}
        <path d="M76 145 C70 140, 60 134, 50 128 C44 125, 38 122, 32 118"
          fill="none" stroke="hsl(30, 5%, 28%)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M82 138 C88 132, 96 126, 104 120 C110 115, 115 111, 120 107"
          fill="none" stroke="hsl(30, 5%, 28%)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M78 128 C74 120, 70 112, 66 104"
          fill="none" stroke="hsl(30, 5%, 26%)" strokeWidth="2" strokeLinecap="round" />
        <path d="M82 118 C83 108, 82 98, 80 90"
          fill="none" stroke="hsl(30, 5%, 26%)" strokeWidth="2" strokeLinecap="round" />
        <path d="M82 122 C88 114, 94 106, 98 98"
          fill="none" stroke="hsl(30, 5%, 26%)" strokeWidth="1.8" strokeLinecap="round" />
        {/* Smaller twigs */}
        <path d="M50 128 C48 122, 46 118, 44 114" fill="none" stroke="hsl(30, 5%, 24%)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M104 120 C106 114, 108 110, 110 106" fill="none" stroke="hsl(30, 5%, 24%)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M80 90 C76 84, 74 80, 72 76" fill="none" stroke="hsl(30, 5%, 24%)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M80 90 C82 84, 84 80, 86 76" fill="none" stroke="hsl(30, 5%, 24%)" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* ── Right dormant tree — leaning slightly the other way ── */}
      <g>
        {/* Trunk */}
        <path d="M304 198
                 C303 188, 306 180, 304 170
                 C302 160, 307 150, 305 140
                 C303 130, 308 120, 306 110
                 C306 105, 308 102, 310 100
                 C312 102, 314 105, 314 110
                 C314 120, 317 130, 315 140
                 C313 150, 316 160, 314 170
                 C312 180, 315 188, 314 198 Z"
          fill="hsl(30, 5%, 26%)" />
        {/* Major branches */}
        <path d="M306 130 C300 124, 290 118, 280 112 C274 108, 268 105, 262 102"
          fill="none" stroke="hsl(30, 5%, 26%)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M312 124 C318 118, 326 112, 334 106 C340 102, 346 98, 352 95"
          fill="none" stroke="hsl(30, 5%, 26%)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M308 115 C304 106, 302 98, 300 90"
          fill="none" stroke="hsl(30, 5%, 24%)" strokeWidth="2" strokeLinecap="round" />
        <path d="M312 105 C314 96, 313 86, 311 78"
          fill="none" stroke="hsl(30, 5%, 24%)" strokeWidth="2" strokeLinecap="round" />
        <path d="M312 108 C318 100, 322 92, 326 84"
          fill="none" stroke="hsl(30, 5%, 24%)" strokeWidth="1.8" strokeLinecap="round" />
        {/* Twigs */}
        <path d="M280 112 C278 106, 276 102, 274 98" fill="none" stroke="hsl(30, 5%, 22%)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M334 106 C336 100, 338 96, 340 92" fill="none" stroke="hsl(30, 5%, 22%)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M311 78 C308 72, 306 68, 304 64" fill="none" stroke="hsl(30, 5%, 22%)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M311 78 C314 72, 316 68, 318 64" fill="none" stroke="hsl(30, 5%, 22%)" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Dead flower stems — bare, slightly curved */}
      {[130, 175, 220, 265].map((x, i) => (
        <path key={i}
          d={`M${x} 205 Q${x + (i % 2 === 0 ? 4 : -4)} ${193} ${x + (i % 2 === 0 ? 2 : -2)} 180`}
          fill="none" stroke="hsl(30, 5%, 28%)" strokeWidth="1.8" strokeLinecap="round" />
      ))}
      {/* Cracked dry ground — visible */}
      <path d="M40 225 L80 215 L100 230" fill="none" stroke="hsl(30,5%,25%)" strokeWidth="1" />
      <path d="M200 232 L240 222 L270 235" fill="none" stroke="hsl(30,5%,25%)" strokeWidth="1" />
      <path d="M330 228 L360 220 L380 232" fill="none" stroke="hsl(30,5%,24%)" strokeWidth="0.8" />
    </g>
  );
}

/** Dormant Cottage — cold, blue-grey interior, visible structure */
function DormantCottage({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      <rect width="400" height="250" fill="hsl(220, 8%, 18%)" />
      {/* Walls — cold blue-grey */}
      <rect x="0" y="0" width="400" height="195" fill="hsl(220, 6%, 16%)" />
      <rect x="0" y="195" width="400" height="55" fill="hsl(25, 8%, 20%)" />
      {/* Window — cold blue moonlight clearly visible */}
      <rect x="155" y="25" width="90" height="78" fill="hsl(220,18%,18%)" rx="4" />
      <line x1="200" y1="25" x2="200" y2="103" stroke="hsl(30,10%,25%)" strokeWidth="4" />
      <line x1="155" y1="64" x2="245" y2="64" stroke="hsl(30,10%,25%)" strokeWidth="4" />
      <rect x="150" y="20" width="100" height="88" fill="none" stroke="hsl(30,10%,25%)" strokeWidth="6" rx="4" />
      {/* Shelf — clearly visible */}
      <rect x="45" y="170" width="310" height="8" fill="hsl(30,8%,22%)" rx="2" />
      {/* Unlit candles — visible pale wax */}
      {[95, 200, 305].map((x, i) => (
        <rect key={i} x={x - 6} y={144} width="12" height="26" fill="hsl(45,12%,28%)" rx="3" />
      ))}
      {/* Floor boards — visible grain */}
      {[0, 55, 110, 165, 220, 275, 330, 385].map((x, i) => (
        <line key={i} x1={x} y1="195" x2={x} y2="250" stroke="hsl(30,6%,17%)" strokeWidth="0.8" />
      ))}
      {/* Books on shelf */}
      {[60, 75, 88, 100].map((x, i) => (
        <rect key={i} x={x} y={170 - 12 - i * 2} width={8 + i} height={12 + i * 2} fill={`hsl(${[0,120,220,300][i]},12%,22%)`} rx="1" />
      ))}
    </g>
  );
}

/** Hand-crafted conifer silhouette templates — each path is centered
 *  at x=0 and grows upward (negative y) from a base at y=0. The shapes
 *  use cubic beziers to create irregular branch-layer bumps so the
 *  treeline reads painterly rather than as twelve identical triangles. */
const TREE_SILHOUETTES = [
  // 0: tall narrow spire
  "M -1 0 L -1 -3 C -5 -4 -3 -7 -3 -8 C -6 -11 -2 -13 -2 -14 C -5 -17 -2 -19 -1 -21 C -2 -24 0 -26 0 -27 C 1 -26 1 -24 2 -21 C 3 -19 5 -17 2 -14 C 3 -13 6 -11 3 -8 C 3 -7 5 -4 1 -3 L 1 0 Z",
  // 1: medium conifer, slight right lean
  "M -3 0 L -3 -2 C -8 -3 -5 -6 -5 -7 C -9 -9 -4 -11 -3 -12 C -6 -14 -2 -16 -1 -18 C -2 -20 0 -21 1 -21 C 2 -19 4 -18 4 -16 C 6 -14 3 -12 4 -11 C 8 -9 4 -7 4 -6 C 7 -4 4 -3 3 -2 L 3 0 Z",
  // 2: short bushy / shrub
  "M -3 0 L -3 -1 C -7 -2 -5 -5 -4 -6 C -8 -8 -5 -11 -3 -12 C -6 -13 -2 -15 -1 -16 C -2 -17 0 -18 0 -18 C 1 -17 2 -16 3 -15 C 5 -13 3 -12 3 -11 C 5 -9 6 -7 3 -6 C 5 -4 4 -2 3 -1 L 3 0 Z",
  // 3: tall asymmetric, leans left
  "M -2 0 L -2 -2 C -7 -4 -5 -7 -4 -8 C -8 -10 -3 -13 -3 -14 C -7 -16 -3 -18 -2 -20 C -4 -23 -1 -25 -1 -26 C 0 -27 0 -27 1 -26 C 1 -23 0 -21 2 -20 C 3 -18 5 -16 2 -14 C 3 -13 5 -10 2 -8 C 4 -6 6 -4 3 -2 L 3 0 Z",
];

/** Treeline placements — x position, template index, vertical jitter
 *  for variety. Distances vary so the rhythm reads natural rather than
 *  metric. */
const TREELINE = [
  { x: 12,  t: 1, dy: 0 },
  { x: 30,  t: 0, dy: 1 },
  { x: 48,  t: 2, dy: 0 },
  { x: 72,  t: 3, dy: -1 },
  { x: 100, t: 1, dy: 0 },
  { x: 122, t: 0, dy: 1 },
  { x: 148, t: 2, dy: 0 },
  { x: 175, t: 3, dy: 0 },
  { x: 198, t: 0, dy: -1 },
  { x: 222, t: 1, dy: 1 },
  { x: 248, t: 2, dy: 0 },
  { x: 270, t: 3, dy: 0 },
  { x: 296, t: 0, dy: 0 },
  { x: 320, t: 1, dy: 1 },
  { x: 344, t: 2, dy: -1 },
  { x: 368, t: 3, dy: 0 },
  { x: 388, t: 0, dy: 0 },
];

/** Dormant Sky — deep blue-grey, empty but visible */
function DormantSky({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      {/* Dark blue sky — clearly different from black */}
      <rect width="400" height="250" fill="hsl(225, 18%, 16%)" />
      {/* Horizon slightly lighter */}
      <rect x="0" y="175" width="400" height="57" fill="hsl(225, 12%, 19%)" />
      {/* Distant fog band where the treeline meets the horizon —
           gives the silhouettes something to sit against. */}
      <rect x="0" y="222" width="400" height="14" fill="hsl(225,10%,15%)" opacity="0.6" />
      {/* Treeline base — soft ground line beneath the silhouettes. */}
      <rect x="0" y="232" width="400" height="18" fill="hsl(225,12%,10%)" />
      {/* Hand-drawn conifer silhouettes — varied templates, lightly
           jittered baseline, occasional x perturbations. */}
      {TREELINE.map((tree, i) => (
        <path
          key={i}
          transform={`translate(${tree.x}, ${232 + tree.dy})`}
          d={TREE_SILHOUETTES[tree.t]}
          fill="hsl(225,12%,10%)"
        />
      ))}
      {/* Moon — dead crescent, clearly visible */}
      <circle cx="342" cy="42" r="22" fill="hsl(225,15%,25%)" opacity="0.6" />
      <circle cx="333" cy="39" r="18" fill="hsl(225,18%,16%)" />
      {/* A few barely-there star positions — empty, waiting */}
      {[{ x: 80, y: 40 }, { x: 180, y: 60 }, { x: 260, y: 35 }].map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r="1.5" fill="hsl(225,10%,22%)" opacity="0.4" />
      ))}
    </g>
  );
}

/** Title accent — a faint warm dawn glow on the horizon + one drifting
 *  amber mote. Visible only on the title screen, signals the warmth
 *  that's coming without breaking the dormant-world frame. */
function TitleAccent() {
  return (
    <g>
      <defs>
        <radialGradient id="dawnGlow" cx="50%" cy="100%" r="55%">
          <stop offset="0%" stopColor="hsl(28, 60%, 55%)" stopOpacity="0.18" />
          <stop offset="55%" stopColor="hsl(28, 50%, 35%)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="hsl(28, 40%, 20%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="160" width="400" height="90" fill="url(#dawnGlow)" />
      <g>
        <circle r="1.4" fill="hsl(40, 80%, 70%)" opacity="0.85">
          <animate attributeName="cx" values="80;120;160;200;240;280;320" dur="14s" repeatCount="indefinite" />
          <animate attributeName="cy" values="120;108;118;100;115;104;112" dur="14s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.85;0.7;0.9;0.6;0.85;0" dur="14s" repeatCount="indefinite" />
        </circle>
        <circle r="0.5" fill="white" opacity="0.95">
          <animate attributeName="cx" values="80;120;160;200;240;280;320" dur="14s" repeatCount="indefinite" />
          <animate attributeName="cy" values="120;108;118;100;115;104;112" dur="14s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.95;0.8;1;0.7;0.95;0" dur="14s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
}

// Title now appears immediately on load; the dormant vignettes cycle
// continuously behind it as ambient background. Three phases at 8 s
// each crossfade with 1.2 s overlap and loop forever via modulo time.
const CYCLE_LEN = 24;
const LOOP_PHASES = [
  { start: 0,  end: 9 },   // dormant garden
  { start: 8,  end: 17 },  // dormant cottage
  { start: 16, end: 25 },  // dormant sky (extends past CYCLE_LEN; wrap handled below)
];

export default function Intro2() {
  const startGame = useGameStore((g) => g.startGame);
  const enterWander = useGameStore((g) => g.enterWander);
  const hasCompleted = useGameStore((g) => g.hasCompleted);
  const { focusInput } = useInput();
  const [time, setTime] = useState(0);
  const [shareLabel, setShareLabel] = useState("Share");

  // Begin: focus the singleton input synchronously inside the click
  // handler so iOS opens its keyboard during this gesture. The input
  // is mounted at App root, so focus survives the screen swap into
  // PlayingScreen and the keyboard never has to reopen on first tap.
  const handleBegin = () => {
    focusInput();
    startGame();
  };

  // Start intro drone on mount
  useEffect(() => {
    startIntroDrone();
    return () => { stopIntroDrone(); };
  }, []);

  // Keyboard: space/enter to begin
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleBegin();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Free-running rAF tick — drives the looping background phases.
  // No upper bound on elapsed time; the phaseOpacity function uses
  // `time % CYCLE_LEN` so the cycle continues until the user navigates
  // away from this screen.
  useEffect(() => {
    const start = performance.now();
    let frame: number;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      const elapsed = (now - start) / 1000;
      if (now - lastUpdate > 66) {
        lastUpdate = now;
        setTime(elapsed);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Crossfade segment for one phase at a given absolute time within
  // its window. Returns 0 outside the window.
  const segmentOpacity = (t: number, start: number, end: number) => {
    const fade = 1.2;
    if (t < start) return 0;
    if (t < start + fade) return (t - start) / fade;
    if (t < end - fade) return 1;
    if (t < end) return (end - t) / fade;
    return 0;
  };

  // Loop-aware opacity — sample the phase at t, t + CYCLE_LEN, and
  // t - CYCLE_LEN so phases that cross the wrap point still crossfade
  // cleanly.
  const phaseOpacity = (idx: number) => {
    const t = time % CYCLE_LEN;
    const { start, end } = LOOP_PHASES[idx];
    return Math.max(
      segmentOpacity(t, start, end),
      segmentOpacity(t + CYCLE_LEN, start, end),
      segmentOpacity(t - CYCLE_LEN, start, end),
    );
  };


  return (
    <div className={s.container}>
      <svg
        viewBox="0 0 400 250"
        className={s.sceneWrap}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="250" fill="#050505" />
        <DormantGarden opacity={phaseOpacity(0)} />
        <DormantCottage opacity={phaseOpacity(1)} />
        <DormantSky opacity={phaseOpacity(2)} />
        <TitleAccent />
      </svg>

      <div className={s.titleOverlay}>
          <svg viewBox="0 0 60 60" width="64" height="64" className={s.titleLogo}>
            {/* Outer ring — medallion border */}
            <circle cx="30" cy="30" r="26" fill="none"
              stroke="#3a5a2a" strokeWidth="1.2" opacity="0.85" />
            {/* Stave — vertical spine with subtle organic drift */}
            <path
              d="M30 12 C29.5 22, 30.5 32, 30 48"
              stroke="#5a8a4a" strokeWidth="2.2" strokeLinecap="round" fill="none"
            />
            {/* Three diagonal strokes crossing the stave — Ogham nGéadal,
                 varied lengths and progressively steeper angle to fan
                 slightly downward. */}
            <path
              d="M24 19 L35 21"
              stroke="#6aaa58" strokeWidth="1.9" strokeLinecap="round" fill="none"
            />
            <path
              d="M22 28 L37 32"
              stroke="#6aaa58" strokeWidth="1.9" strokeLinecap="round" fill="none"
            />
            <path
              d="M21 37 L38 43"
              stroke="#6aaa58" strokeWidth="1.9" strokeLinecap="round" fill="none"
            />
            {/* Tip spark — firefly catch on the topmost stroke */}
            <circle cx="35" cy="21" r="1.4" fill="#d8e8c8" opacity="0.85" />
            <circle cx="35" cy="21" r="0.5" fill="#ffffff" opacity="0.95" />
          </svg>

          <h1 className={s.title}>Inkwood</h1>

          <button
            className={s.beginBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleBegin();
            }}
          >
            Begin
          </button>

          {hasCompleted && (
            <button
              className={s.wanderLink}
              onClick={(e) => {
                e.stopPropagation();
                enterWander();
              }}
              aria-label="Replay any level — pick a scene to revisit"
            >
              Replay any level
            </button>
          )}

          <button
            className={s.shareLink}
            onClick={async (e) => {
              e.stopPropagation();
              const result = await shareInkwood();
              if (result === "copied" || result === "fallback") {
                setShareLabel("Link copied");
                setTimeout(() => setShareLabel("Share"), 1800);
              }
            }}
            aria-label="Share Inkwood"
          >
            {shareLabel}
          </button>
        </div>
    </div>
  );
}
