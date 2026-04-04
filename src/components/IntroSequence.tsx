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

/** Dormant Garden — grey, lifeless */
function DormantGarden({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      {/* Grey sky */}
      <rect width="400" height="250" fill="hsl(0, 0%, 6%)" />
      {/* Dead hills */}
      <path d="M0 200 Q100 170 200 195 Q300 210 400 185 L400 250 L0 250Z" fill="hsl(0, 0%, 8%)" />
      <path d="M0 215 Q80 195 180 210 Q280 225 400 205 L400 250 L0 250Z" fill="hsl(0, 0%, 9%)" />
      {/* Dead tree silhouettes */}
      <line x1="80" y1="210" x2="80" y2="150" stroke="hsl(0,0%,7%)" strokeWidth="3" />
      <line x1="80" y1="170" x2="60" y2="145" stroke="hsl(0,0%,7%)" strokeWidth="2" />
      <line x1="80" y1="175" x2="100" y2="150" stroke="hsl(0,0%,7%)" strokeWidth="2" />
      <line x1="300" y1="200" x2="300" y2="140" stroke="hsl(0,0%,7%)" strokeWidth="3" />
      <line x1="300" y1="165" x2="280" y2="140" stroke="hsl(0,0%,7%)" strokeWidth="2" />
      <line x1="300" y1="160" x2="320" y2="135" stroke="hsl(0,0%,7%)" strokeWidth="2" />
      {/* Dead flower stems — bare, no blooms */}
      {[120, 170, 220, 270].map((x, i) => (
        <line key={i} x1={x} y1="215" x2={x + (i % 2 === 0 ? 2 : -2)} y2="195" stroke="hsl(0,0%,10%)" strokeWidth="1.2" />
      ))}
      {/* Cracked ground lines */}
      <path d="M50 230 L80 225 L90 240" fill="none" stroke="hsl(0,0%,7%)" strokeWidth="0.5" />
      <path d="M250 235 L280 228 L300 238" fill="none" stroke="hsl(0,0%,7%)" strokeWidth="0.5" />
    </g>
  );
}

/** Dormant Cottage — pitch black, cold */
function DormantCottage({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      <rect width="400" height="250" fill="hsl(0, 0%, 5%)" />
      {/* Dark room walls */}
      <rect x="0" y="0" width="400" height="200" fill="hsl(30, 5%, 5%)" />
      <rect x="0" y="200" width="400" height="50" fill="hsl(25, 5%, 6%)" />
      {/* Window — dead black, no light */}
      <rect x="158" y="28" width="84" height="72" fill="hsl(0,0%,3%)" rx="4" />
      <line x1="200" y1="28" x2="200" y2="100" stroke="hsl(30,5%,8%)" strokeWidth="3" />
      <line x1="158" y1="64" x2="242" y2="64" stroke="hsl(30,5%,8%)" strokeWidth="3" />
      <rect x="153" y="23" width="94" height="82" fill="none" stroke="hsl(30,5%,8%)" strokeWidth="5" rx="4" />
      {/* Cold shelf */}
      <rect x="48" y="173" width="304" height="7" fill="hsl(30,3%,7%)" rx="2" />
      {/* Unlit candles */}
      {[95, 200, 305].map((x, i) => (
        <rect key={i} x={x - 5} y={148} width="10" height="25" fill="hsl(40,5%,10%)" rx="2" />
      ))}
    </g>
  );
}

/** Dormant Sky — starless void */
function DormantSky({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity}>
      <rect width="400" height="250" fill="hsl(232, 10%, 3%)" />
      {/* Empty sky — just dark */}
      <rect x="0" y="232" width="400" height="18" fill="hsl(0,0%,2%)" />
      {/* Bare treeline */}
      {[0, 28, 55, 90, 128, 168, 205, 242, 278, 312, 348, 378].map((x, i) => (
        <polygon key={i} points={`${x},232 ${x + 14},${218 - (i % 3) * 5} ${x + 28},232`} fill="hsl(0,0%,2%)" />
      ))}
      {/* Moon — dead, barely visible */}
      <circle cx="342" cy="45" r="20" fill="hsl(232,10%,6%)" opacity="0.3" />
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

// Phases: garden → cottage → sky → spark → title
const PHASES = [
  { start: 0, end: 4 },      // dormant garden
  { start: 3.5, end: 7.5 },  // dormant cottage
  { start: 7, end: 11 },     // dormant sky
  { start: 10.5, end: 14 },  // spark
  { start: 13, end: 99 },    // title
];

export default function IntroSequence() {
  const { setScreen, startGame } = useGameStore();
  const [time, setTime] = useState(0);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      setTime(elapsed);
      if (elapsed >= 13.5 && !showTitle) {
        setShowTitle(true);
      }
      if (elapsed < 16) {
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
