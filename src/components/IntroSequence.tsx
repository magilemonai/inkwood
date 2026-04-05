import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { startIntroDrone, stopIntroDrone } from "../audio";
import s from "../styles/Intro.module.css";

/**
 * Intro sequence: a 16-second slow pan across a grey, dormant world.
 * Three vignettes fade in/out — the dead garden, dark cottage, starless sky.
 * Then a faint spark of light → title → begin button.
 * Zero text until the title. Pure visual storytelling.
 */

/** Dormant Garden — grey, washed out, clearly lifeless but VERY visible */
function DormantGarden({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      {/* Overcast grey sky */}
      <rect width="400" height="250" fill="hsl(200, 5%, 25%)" />
      <rect width="400" height="120" fill="hsl(210, 6%, 30%)" />
      {/* Dead hills — grey-brown */}
      <path d="M0 185 Q100 155 200 178 Q300 195 400 170 L400 250 L0 250Z" fill="hsl(40, 4%, 20%)" />
      <path d="M0 205 Q80 188 180 200 Q280 215 400 195 L400 250 L0 250Z" fill="hsl(40, 3%, 22%)" />
      {/* Dead bare trees — prominent */}
      <path d="M80 200 L80 130 M80 160 Q60 140 50 125 M80 155 Q100 138 110 128 M80 145 Q68 132 62 122" fill="none" stroke="hsl(30,5%,30%)" strokeWidth="3" strokeLinecap="round" />
      <path d="M310 190 L310 120 M310 155 Q288 132 278 118 M310 148 Q332 130 340 120 M310 140 Q300 125 295 115" fill="none" stroke="hsl(30,5%,28%)" strokeWidth="3" strokeLinecap="round" />
      {/* Dead flower stems — bare, prominent */}
      {[130, 175, 220, 265].map((x, i) => (
        <line key={i} x1={x} y1="205" x2={x + (i % 2 === 0 ? 3 : -3)} y2="180" stroke="hsl(30,5%,28%)" strokeWidth="1.8" />
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
  const { startGame } = useGameStore();
  const [time, setTime] = useState(0);
  const [showTitle, setShowTitle] = useState(false);

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
        if (showTitle) startGame();
        else setShowTitle(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showTitle, startGame]);

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
        style={{ width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="250" fill="#050505" />
        <DormantGarden opacity={phaseOpacity(0)} />
        <DormantCottage opacity={phaseOpacity(1)} />
        <DormantSky opacity={phaseOpacity(2)} />
        <Spark opacity={phaseOpacity(3)} />
      </svg>

      <AnimatePresence>
        {showTitle && (
          <motion.div
            className={s.titleOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            {/* Logo */}
            <motion.svg
              viewBox="0 0 60 60"
              width="56"
              height="56"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              <circle cx="30" cy="30" r="28" fill="none" stroke="#3a5a2a" strokeWidth="1.5" />
              <line x1="30" y1="42" x2="30" y2="18" stroke="#4a7a3a" strokeWidth="2" />
              <line x1="30" y1="28" x2="20" y2="20" stroke="#4a7a3a" strokeWidth="1.5" />
              <line x1="30" y1="32" x2="40" y2="24" stroke="#4a7a3a" strokeWidth="1.5" />
              <line x1="30" y1="42" x2="22" y2="50" stroke="#3a5a2a" strokeWidth="1.5" />
              <line x1="30" y1="42" x2="38" y2="50" stroke="#3a5a2a" strokeWidth="1.5" />
              <circle cx="30" cy="15" r="3" fill="#6bbf6b" opacity="0.6" />
            </motion.svg>

            <motion.h1
              className={s.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Inkwood
            </motion.h1>

            <motion.button
              className={s.beginBtn}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
            >
              Begin
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {!showTitle && (
        <div className={s.skipHint}>tap to skip</div>
      )}
    </div>
  );
}
