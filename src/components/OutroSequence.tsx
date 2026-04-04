import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import s from "../styles/Outro.module.css";

/**
 * Outro: a 25-second animated sequence.
 * Phase 1 (0-12s): Location nodes bloom one by one, ley lines connect them,
 *   energy pulses flow. The world map comes alive.
 * Phase 2 (12-18s): The Great Tree grows at center, its canopy spreads over everything.
 * Phase 3 (18-25s): Full radiance, text fades in, "Begin Again" button.
 */

const LOCATIONS = LEVELS.slice(0, 9).map((l, i) => {
  // Arrange in a pleasing arc pattern
  const positions = [
    { x: 70,  y: 65 },
    { x: 165, y: 45 },
    { x: 280, y: 55 },
    { x: 45,  y: 135 },
    { x: 350, y: 125 },
    { x: 110, y: 175 },
    { x: 300, y: 180 },
    { x: 200, y: 120 },
    { x: 200, y: 215 },
  ];
  return { ...positions[i], color: l.accent, title: l.title };
});

const CONNECTIONS = [
  [0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 6],
  [5, 7], [6, 7], [7, 8], [1, 7], [3, 7], [4, 7],
];

function sub(t: number, start: number, dur: number): number {
  return Math.min(1, Math.max(0, (t - start) / dur));
}

export default function OutroSequence() {
  const restart = useGameStore((g) => g.restart);
  const [time, setTime] = useState(0);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      setTime(elapsed);
      if (elapsed >= 19 && !showText) setShowText(true);
      if (elapsed < 28) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [showText]);

  // Phase calculations
  const nodeStagger = 1.0; // seconds between each node
  const treeGrow = sub(time, 12, 5);
  const radiance = sub(time, 17, 3);

  return (
    <div className={s.container}>
      <svg
        viewBox="0 0 400 250"
        className={s.sceneWrap}
        style={{ width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="outroGlow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#d8c890" stopOpacity={radiance * 0.2} />
            <stop offset="100%" stopColor="#d8c890" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="treeRadiance" cx="50%" cy="85%" r="50%">
            <stop offset="0%" stopColor="#b8c8a8" stopOpacity={treeGrow * 0.15} />
            <stop offset="100%" stopColor="#b8c8a8" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="400" height="250" fill={`hsl(180, 6%, ${4 + radiance * 3}%)`} />

        {/* Central glow */}
        <ellipse cx="200" cy="170" rx={180 * Math.min(1, time / 10)} ry={90 * Math.min(1, time / 10)} fill="url(#outroGlow)" />

        {/* Ley line connections */}
        {CONNECTIONS.map(([a, b], i) => {
          const la = LOCATIONS[a];
          const lb = LOCATIONS[b];
          const delay = Math.max(a, b) * nodeStagger + 1;
          const lp = sub(time, delay, 1.5);
          if (lp <= 0) return null;
          return (
            <line
              key={i}
              x1={la.x} y1={la.y}
              x2={la.x + (lb.x - la.x) * lp} y2={la.y + (lb.y - la.y) * lp}
              stroke="#d8c890" strokeWidth="1.2" opacity={lp * 0.35}
            />
          );
        })}

        {/* Location nodes */}
        {LOCATIONS.map((loc, i) => {
          const np = sub(time, i * nodeStagger, 1.5);
          if (np <= 0) return null;
          return (
            <g key={i} opacity={np}>
              <circle cx={loc.x} cy={loc.y} r={20 * np} fill={loc.color} opacity={np * 0.08} />
              <circle cx={loc.x} cy={loc.y} r={10 * np} fill="none" stroke={loc.color} strokeWidth="1" opacity={np * 0.4} />
              <circle cx={loc.x} cy={loc.y} r={4 * np} fill={loc.color} opacity={np * 0.7} />
              <circle cx={loc.x} cy={loc.y} r={1.5 * np} fill="white" opacity={np * 0.5} />
            </g>
          );
        })}

        {/* Energy pulses along connections */}
        {time > 8 && CONNECTIONS.map(([a, b], i) => {
          const la = LOCATIONS[a];
          const lb = LOCATIONS[b];
          const pulseT = ((time - 8) * 0.4 + i * 0.25) % 1;
          const px = la.x + (lb.x - la.x) * pulseT;
          const py = la.y + (lb.y - la.y) * pulseT;
          return (
            <circle
              key={`p${i}`}
              cx={px} cy={py} r="2"
              fill="#d8c890"
              opacity={sub(time, 8, 2) * 0.4 * (1 - Math.abs(pulseT - 0.5) * 2)}
            />
          );
        })}

        {/* Great Tree grows from center-bottom */}
        {treeGrow > 0 && (
          <g opacity={treeGrow}>
            {/* Trunk */}
            <path
              d={`M${192} ${240}
                  C${188} ${240 - 50 * treeGrow}, ${184} ${240 - 90 * treeGrow}, ${190} ${240 - 120 * treeGrow}
                  L${210} ${240 - 120 * treeGrow}
                  C${216} ${240 - 90 * treeGrow}, ${212} ${240 - 50 * treeGrow}, ${208} ${240}
                  Z`}
              fill="hsl(30, 15%, 14%)"
            />
            {/* Canopy */}
            {[
              { x: 160, y: 105, rx: 30, ry: 20 },
              { x: 200, y: 95,  rx: 35, ry: 25 },
              { x: 240, y: 105, rx: 30, ry: 20 },
              { x: 180, y: 100, rx: 25, ry: 18 },
              { x: 220, y: 100, rx: 25, ry: 18 },
            ].map((c, i) => (
              <ellipse
                key={i}
                cx={c.x} cy={c.y}
                rx={c.rx * treeGrow}
                ry={c.ry * treeGrow}
                fill={`hsl(125, ${20 + radiance * 15}%, ${12 + radiance * 8}%)`}
                opacity={treeGrow * 0.75}
              />
            ))}
            {/* Tree glow */}
            <ellipse cx="200" cy="120" rx={80 * treeGrow} ry={50 * treeGrow} fill="url(#treeRadiance)" />
            {/* Spirit lights in canopy */}
            {[
              { x: 170, y: 100 }, { x: 200, y: 90 }, { x: 230, y: 98 },
              { x: 185, y: 108 }, { x: 215, y: 105 },
            ].map((sl, i) => {
              const sp = sub(treeGrow, 0.5, 0.3);
              return sp > 0 ? (
                <g key={i} opacity={sp * 0.5}>
                  <circle cx={sl.x} cy={sl.y} r="5" fill="#b8c8a8" opacity={0.1} />
                  <circle cx={sl.x} cy={sl.y} r="1.8" fill="#d8e8c8" opacity={0.5} />
                  <circle cx={sl.x} cy={sl.y} r="0.7" fill="white" opacity={0.5} />
                </g>
              ) : null;
            })}
          </g>
        )}

        {/* Final radiance burst */}
        {radiance > 0.5 && (
          <ellipse
            cx="200" cy="160"
            rx={120 * (radiance - 0.5) * 2}
            ry={60 * (radiance - 0.5) * 2}
            fill="#d8c890"
            opacity={(1 - (radiance - 0.5) * 2) * 0.1}
          />
        )}
      </svg>

      {/* Text overlay */}
      <AnimatePresence>
        {showText && (
          <motion.div
            className={s.textOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            <motion.h2
              className={s.heading}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              The Ancient Order Holds
            </motion.h2>

            <motion.p
              className={s.body}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1 }}
            >
              Ten places, once forgotten, now alive with spirit and purpose.
              You have written the world back into being, scribe. The spirits
              will remember your name.
            </motion.p>

            <motion.div
              className={s.dotRow}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              {LEVELS.map((l, i) => (
                <div key={i} className={s.dot} style={{ background: l.accent }} />
              ))}
            </motion.div>

            <motion.button
              className={s.restartBtn}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2.5 }}
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
