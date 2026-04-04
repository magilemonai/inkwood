import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import s from "../styles/Intro.module.css";

/**
 * Intro sequence: a 16-second slow pan across a grey, dormant world.
 * Three vignettes fade in/out — the dead garden, dark cottage, starless sky.
 * Then a faint spark of light → title → begin button.
 * Zero text until the title. Pure visual storytelling.
 */

/** Dormant Garden — grey, desaturated, clearly visible but lifeless */
function DormantGarden({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      <rect width="400" height="250" fill="hsl(200, 3%, 15%)" />
      {/* Overcast sky hint */}
      <rect width="400" height="130" fill="hsl(210, 4%, 18%)" />
      {/* Dead hills */}
      <path d="M0 190 Q100 162 200 185 Q300 200 400 175 L400 250 L0 250Z" fill="hsl(120, 3%, 13%)" />
      <path d="M0 210 Q80 192 180 205 Q280 218 400 200 L400 250 L0 250Z" fill="hsl(120, 2%, 14%)" />
      {/* Dead tree silhouettes */}
      <path d="M80 205 L80 140 M80 165 Q65 148 55 138 M80 158 Q95 145 105 140" fill="none" stroke="hsl(120,3%,20%)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M300 195 L300 130 M300 160 Q283 140 275 130 M300 152 Q318 138 325 130" fill="none" stroke="hsl(120,3%,20%)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Dead flower stems — bare, no blooms */}
      {[120, 170, 220, 270].map((x, i) => (
        <line key={i} x1={x} y1="210" x2={x + (i % 2 === 0 ? 2 : -2)} y2="190" stroke="hsl(120,3%,20%)" strokeWidth="1.5" />
      ))}
      {/* Cracked dry ground */}
      <path d="M50 225 L85 218 L95 232" fill="none" stroke="hsl(30,4%,18%)" strokeWidth="0.8" />
      <path d="M250 228 L285 220 L305 232" fill="none" stroke="hsl(30,4%,18%)" strokeWidth="0.8" />
      <path d="M160 235 L185 230 L200 240" fill="none" stroke="hsl(30,4%,17%)" strokeWidth="0.6" />
    </g>
  );
}

/** Dormant Cottage — cold, dark interior but visible structure */
function DormantCottage({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      <rect width="400" height="250" fill="hsl(30, 4%, 12%)" />
      {/* Dark room walls */}
      <rect x="0" y="0" width="400" height="200" fill="hsl(30, 5%, 10%)" />
      <rect x="0" y="200" width="400" height="50" fill="hsl(25, 6%, 13%)" />
      {/* Window — dark blue, cold moonlight hint */}
      <rect x="158" y="28" width="84" height="72" fill="hsl(220,10%,10%)" rx="4" />
      <line x1="200" y1="28" x2="200" y2="100" stroke="hsl(30,8%,16%)" strokeWidth="3" />
      <line x1="158" y1="64" x2="242" y2="64" stroke="hsl(30,8%,16%)" strokeWidth="3" />
      <rect x="153" y="23" width="94" height="82" fill="none" stroke="hsl(30,8%,16%)" strokeWidth="5" rx="4" />
      {/* Cold shelf */}
      <rect x="48" y="173" width="304" height="7" fill="hsl(30,5%,14%)" rx="2" />
      {/* Unlit candles — visible wax */}
      {[95, 200, 305].map((x, i) => (
        <rect key={i} x={x - 5} y={148} width="10" height="25" fill="hsl(40,8%,18%)" rx="2" />
      ))}
      {/* Floor boards hint */}
      {[0, 60, 120, 180, 240, 300, 360].map((x, i) => (
        <line key={i} x1={x} y1="200" x2={x} y2="250" stroke="hsl(30,5%,11%)" strokeWidth="0.5" />
      ))}
    </g>
  );
}

/** Dormant Sky — deep blue void, cold and empty */
function DormantSky({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      <rect width="400" height="250" fill="hsl(232, 15%, 10%)" />
      {/* Faint horizon glow */}
      <rect x="0" y="180" width="400" height="52" fill="hsl(232, 8%, 12%)" />
      {/* Bare treeline — visible silhouettes */}
      <rect x="0" y="232" width="400" height="18" fill="hsl(232,10%,6%)" />
      {[0, 28, 55, 90, 128, 168, 205, 242, 278, 312, 348, 378].map((x, i) => (
        <polygon key={i} points={`${x},232 ${x + 14},${216 - (i % 3) * 6} ${x + 28},232`} fill="hsl(232,10%,6%)" />
      ))}
      {/* Moon — dead crescent, but visible */}
      <circle cx="342" cy="45" r="20" fill="hsl(232,12%,14%)" opacity="0.5" />
      <circle cx="334" cy="42" r="17" fill="hsl(232,15%,10%)" />
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
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      setTime(elapsed);
      if (elapsed >= 14 && !showTitle) {
        setShowTitle(true);
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
