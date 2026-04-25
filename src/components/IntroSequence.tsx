import { useState, useEffect } from "react";
import { useGameStore } from "../store";
import { startIntroDrone, stopIntroDrone } from "../audio";
import { useInput } from "../contexts/InputContext";
import s from "../styles/Intro.module.css";

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

/** Dormant Sky — deep blue-grey, empty but visible */
function DormantSky({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      {/* Dark blue sky — clearly different from black */}
      <rect width="400" height="250" fill="hsl(225, 18%, 16%)" />
      {/* Horizon slightly lighter */}
      <rect x="0" y="175" width="400" height="57" fill="hsl(225, 12%, 19%)" />
      {/* Treeline silhouettes — prominent */}
      <rect x="0" y="232" width="400" height="18" fill="hsl(225,12%,10%)" />
      {[0, 28, 55, 90, 128, 168, 205, 242, 278, 312, 348, 378].map((x, i) => (
        <polygon key={i} points={`${x},232 ${x + 14},${214 - (i % 3) * 7} ${x + 28},232`} fill="hsl(225,12%,10%)" />
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

/** The spark — the tiny sign of dormant power */
function Spark({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      <circle cx="200" cy="125" r="40" fill="#6bbf6b" opacity={0.03} />
      <circle cx="200" cy="125" r="15" fill="#6bbf6b" opacity={0.06} />
      <circle cx="200" cy="125" r="3" fill="#90d870" opacity={0.4} />
      <circle cx="200" cy="125" r="1" fill="white" opacity={0.6} />
    </g>
  );
}

// Phases: black beat → garden → cottage → sky → spark → title
const PHASES = [
  { start: 0.8, end: 4.5 },  // dormant garden (starts after a beat of black)
  { start: 4, end: 8 },      // dormant cottage
  { start: 7.5, end: 11.5 }, // dormant sky
  { start: 11, end: 14.5 },  // spark
  { start: 14, end: 99 },    // title
];

export default function IntroSequence() {
  const startGame = useGameStore((g) => g.startGame);
  const enterWander = useGameStore((g) => g.enterWander);
  const hasCompleted = useGameStore((g) => g.hasCompleted);
  const { focusInput } = useInput();
  const [time, setTime] = useState(0);
  const [showTitle, setShowTitle] = useState(false);

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

  // Keyboard: space/enter to skip or begin
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (showTitle) handleBegin();
        else setShowTitle(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTitle]);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      const elapsed = (now - start) / 1000;
      // Throttle state updates to ~15 Hz
      if (now - lastUpdate > 66) {
        lastUpdate = now;
        setTime(elapsed);
        if (elapsed >= 14 && !showTitle) {
          setShowTitle(true);
        }
      }
      if (elapsed < 18) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [showTitle]);

  // Compute phase opacities with crossfade
  const phaseOpacity = (idx: number) => {
    const { start, end } = PHASES[idx];
    const fadeIn = 1.2;
    const fadeOut = 1.2;
    if (time < start) return 0;
    if (time < start + fadeIn) return (time - start) / fadeIn;
    if (time < end - fadeOut) return 1;
    if (time < end) return (end - time) / fadeOut;
    return 0;
  };

  const handleSkip = () => {
    if (showTitle) return; // let button handle it
    setShowTitle(true);
  };

  return (
    <div className={s.container} onClick={handleSkip}>
      <svg
        viewBox="0 0 400 250"
        className={s.sceneWrap}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="250" fill="#050505" />
        <DormantGarden opacity={phaseOpacity(0)} />
        <DormantCottage opacity={phaseOpacity(1)} />
        <DormantSky opacity={phaseOpacity(2)} />
        <Spark opacity={phaseOpacity(3)} />
      </svg>

      {showTitle && (
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
              aria-label="Wander the woods — replay any single scene"
            >
              Wander the woods
            </button>
          )}
        </div>
      )}

      {!showTitle && (
        <div className={s.skipHint}>tap to skip</div>
      )}
    </div>
  );
}
