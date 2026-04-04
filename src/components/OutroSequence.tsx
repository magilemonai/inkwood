import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import s from "../styles/Outro.module.css";

/**
 * Outro: a quiet, warm aftermath. NOT a repeat of the WorldScene map.
 *
 * The player just finished typing the world back into being.
 * The outro should feel like stepping outside after the ritual is complete.
 * A single, still image that slowly fills with life — then one line, then rest.
 *
 * Phase 1 (0-5s): Dark. A horizon. Dawn light begins.
 * Phase 2 (5-15s): A landscape warms — golden dawn breaks, the Great Tree
 *   silhouette stands at center, light radiates from behind it. Simple.
 *   Color accents from each level drift upward like fireflies or embers.
 * Phase 3 (15-22s): Full warmth. Text fades in. "The forest remembers."
 */

function sub(t: number, start: number, dur: number): number {
  return Math.min(1, Math.max(0, (t - start) / dur));
}

export default function OutroSequence() {
  const restart = useGameStore((g) => g.restart);
  const [time, setTime] = useState(0);
  const [showText, setShowText] = useState(false);

  // Keyboard: space/enter to restart when text showing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && showText) {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showText, restart]);

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
        if (elapsed >= 16 && !showText) setShowText(true);
      }
      if (elapsed < 25) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [showText]);

  // Phase calculations
  const dawn = sub(time, 2, 8);       // 0→1 over 2s-10s
  const treeFade = sub(time, 4, 6);   // tree appears 4-10s
  // embers phase: individual particles use their own delays in emberData
  const fullWarm = sub(time, 10, 5);  // full warmth 10-15s

  // Sky color shifts from deep blue-black to warm golden dawn
  const skyTop = `hsl(${225 - dawn * 20}, ${15 + dawn * 10}%, ${6 + dawn * 18}%)`;
  const skyBot = `hsl(${30 + (1 - dawn) * 190}, ${10 + dawn * 25}%, ${8 + dawn * 28}%)`;

  // Ember particles — one per level, drifting upward in their accent color
  const emberData = LEVELS.map((l, i) => ({
    x: 40 + (i / (LEVELS.length - 1)) * 320,
    startY: 200 - (i % 3) * 20,
    color: l.accent,
    delay: 7 + i * 0.5,
  }));

  return (
    <div className={s.container}>
      <svg
        viewBox="0 0 400 250"
        className={s.sceneWrap}
        style={{ width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="outroDawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="60%" stopColor={skyBot} />
            <stop offset="100%" stopColor={`hsl(30, ${15 + dawn * 20}%, ${6 + dawn * 12}%)`} />
          </linearGradient>

          {/* Sun glow behind tree */}
          <radialGradient id="sunGlow" cx="50%" cy="72%" r="40%">
            <stop offset="0%" stopColor="#f5d860" stopOpacity={dawn * 0.4} />
            <stop offset="50%" stopColor="#e8a030" stopOpacity={dawn * 0.15} />
            <stop offset="100%" stopColor="#e8a030" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="400" height="250" fill="url(#outroDawn)" />

        {/* Dawn glow on horizon */}
        <ellipse
          cx="200" cy="185"
          rx={180 * dawn} ry={60 * dawn}
          fill="url(#sunGlow)"
        />

        {/* Distant hills — dark silhouettes */}
        <path
          d="M0 195 Q60 175 120 185 Q200 168 280 180 Q350 172 400 188 L400 250 L0 250Z"
          fill={`hsl(30, ${8 + dawn * 5}%, ${5 + dawn * 6}%)`}
        />
        <path
          d="M0 205 Q100 190 200 198 Q300 188 400 200 L400 250 L0 250Z"
          fill={`hsl(30, ${6 + dawn * 4}%, ${4 + dawn * 5}%)`}
        />

        {/* The Great Tree — a silhouette against the dawn */}
        {treeFade > 0 && (
          <g opacity={treeFade}>
            {/* Trunk */}
            <path
              d="M190 250 C186 220, 182 190, 186 155 C188 145, 195 138, 200 135 C205 138, 212 145, 214 155 C218 190, 214 220, 210 250 Z"
              fill={`hsl(30, ${8 + fullWarm * 8}%, ${5 + fullWarm * 4}%)`}
            />
            {/* Major branches */}
            <path d="M200 155 Q170 130 130 105" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="5" strokeLinecap="round" />
            <path d="M200 155 Q185 120 160 90" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="4.5" strokeLinecap="round" />
            <path d="M200 148 Q200 110 200 75" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="4" strokeLinecap="round" />
            <path d="M200 155 Q215 120 240 90" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="4.5" strokeLinecap="round" />
            <path d="M200 155 Q230 130 270 105" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="5" strokeLinecap="round" />
            {/* Canopy — large organic shape */}
            <ellipse cx="200" cy="85" rx={75 * treeFade} ry={50 * treeFade}
              fill={`hsl(130, ${12 + fullWarm * 18}%, ${6 + fullWarm * 8}%)`} opacity={treeFade * 0.8} />
            <ellipse cx="160" cy="95" rx={45 * treeFade} ry={35 * treeFade}
              fill={`hsl(125, ${10 + fullWarm * 15}%, ${7 + fullWarm * 7}%)`} opacity={treeFade * 0.7} />
            <ellipse cx="240" cy="95" rx={45 * treeFade} ry={35 * treeFade}
              fill={`hsl(125, ${10 + fullWarm * 15}%, ${7 + fullWarm * 7}%)`} opacity={treeFade * 0.7} />
            {/* Roots spreading along ground */}
            <path d="M190 250 Q160 245 100 240" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="3" strokeLinecap="round" />
            <path d="M210 250 Q240 245 300 240" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="3" strokeLinecap="round" />
            <path d="M195 250 Q175 248 130 248" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="2" strokeLinecap="round" />
            <path d="M205 250 Q225 248 270 248" fill="none" stroke={`hsl(30, 8%, ${5 + fullWarm * 4}%)`} strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Accent-colored embers drifting upward — one per level */}
        {emberData.map((e, i) => {
          const ep = sub(time, e.delay, 8);
          if (ep <= 0) return null;
          const y = e.startY - ep * 140;
          const x = e.x + Math.sin(ep * Math.PI * 2 + i) * 12;
          return (
            <g key={i} opacity={ep < 0.8 ? ep * 0.7 : (1 - ep) * 3.5}>
              <circle cx={x} cy={y} r="6" fill={e.color} opacity={0.06} />
              <circle cx={x} cy={y} r="2" fill={e.color} opacity={0.4} />
              <circle cx={x} cy={y} r="0.8" fill="white" opacity={0.5} />
            </g>
          );
        })}

        {/* Warm haze at horizon */}
        <rect x="0" y="170" width="400" height="80"
          fill={`hsl(35, ${20 + dawn * 15}%, ${12 + dawn * 15}%)`}
          opacity={dawn * 0.15}
        />
      </svg>

      {/* Text overlay */}
      <AnimatePresence>
        {showText && (
          <motion.div
            className={s.textOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.5 }}
          >
            <motion.p
              className={s.body}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              The forest remembers.
            </motion.p>

            <motion.div
              className={s.dotRow}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 2 }}
            >
              {LEVELS.map((l, i) => (
                <div key={i} className={s.dot} style={{ background: l.accent }} />
              ))}
            </motion.div>

            <motion.button
              className={s.restartBtn}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 3.5 }}
              onClick={restart}
            >
              Begin Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
