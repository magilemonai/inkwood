import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { startAmbient, stopAmbient } from "../audio";
import { getActIndex } from "../levels";
import s from "../styles/ActTransition.module.css";

/* ── Transition scenes ── */

/** Act I → II: A rune fades in, pulls back to reveal many runes and ley lines */
function DiscoveryScene() {
  // Scattered rune positions on the stone surface
  const runes = [
    { x: 200, y: 125, delay: 0, main: true },
    { x: 130, y: 80, delay: 2.2 },
    { x: 270, y: 70, delay: 2.4 },
    { x: 150, y: 170, delay: 2.6 },
    { x: 260, y: 160, delay: 2.5 },
    { x: 100, y: 125, delay: 2.8 },
    { x: 300, y: 130, delay: 2.7 },
    { x: 200, y: 50, delay: 3.0 },
    { x: 200, y: 200, delay: 2.9 },
  ];

  return (
    <svg viewBox="0 0 400 250" width="100%" height="100%" style={{ maxWidth: 600 }}>
      {/* Stone surface texture — faint grid lines */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ delay: 1.8, duration: 1.5 }}
      >
        {[60, 120, 180, 240, 300, 340].map((x) => (
          <line key={`v${x}`} x1={x} y1="20" x2={x} y2="230" stroke="#887860" strokeWidth="0.3" />
        ))}
        {[50, 100, 150, 200].map((y) => (
          <line key={`h${y}`} x1="40" y1={y} x2="360" y2={y} stroke="#887860" strokeWidth="0.3" />
        ))}
      </motion.g>

      {/* Runes — the main one fades in first, then the camera "pulls back" to reveal others */}
      {runes.map((r, i) => (
        <motion.g key={i}>
          {/* Rune glow */}
          <motion.circle
            cx={r.main ? 200 : r.x}
            cy={r.main ? 125 : r.y}
            r={r.main ? 18 : 8}
            fill="none"
            stroke="#d0b870"
            strokeWidth={r.main ? 1.2 : 0.6}
            initial={{ opacity: 0, scale: r.main ? 2.5 : 0 }}
            animate={{ opacity: r.main ? [0, 0.9, 0.5] : [0, 0.4], scale: 1 }}
            transition={{
              delay: r.main ? 0.3 : r.delay!,
              duration: r.main ? 2.5 : 1.2,
              ease: "easeOut",
            }}
          />
          {/* Rune inner mark */}
          <motion.circle
            cx={r.main ? 200 : r.x}
            cy={r.main ? 125 : r.y}
            r={r.main ? 4 : 2}
            fill="#d0b870"
            initial={{ opacity: 0, scale: r.main ? 2.5 : 0 }}
            animate={{ opacity: r.main ? [0, 0.8, 0.6] : [0, 0.5], scale: 1 }}
            transition={{
              delay: r.main ? 0.5 : r.delay! + 0.2,
              duration: r.main ? 2.2 : 1.0,
              ease: "easeOut",
            }}
          />
        </motion.g>
      ))}

      {/* Ley lines flickering at edges */}
      {[
        "M 0,125 Q 60,110 100,125",
        "M 400,125 Q 340,140 300,130",
        "M 200,0 Q 190,40 200,50",
        "M 200,250 Q 210,210 200,200",
        "M 0,50 Q 80,70 130,80",
        "M 400,200 Q 320,180 260,160",
      ].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="#d0b870"
          strokeWidth="0.5"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: [0, 0.3, 0.15, 0.3], pathLength: 1 }}
          transition={{ delay: 3.5 + i * 0.15, duration: 2, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

/** Act II → III: Ley lines converge on a central nexus node */
function NexusScene() {
  const nodeColors = ["#6bbf6b", "#e89a30", "#9090f8", "#50b8b8", "#7aaa6a", "#c088b0"];
  const cx = 200;
  const cy = 125;

  // Node positions around the viewport edges
  const nodes = nodeColors.map((color, i) => {
    const ang = (i / nodeColors.length) * Math.PI * 2 - Math.PI / 2;
    const rx = 150;
    const ry = 95;
    return {
      x: cx + Math.cos(ang) * rx,
      y: cy + Math.sin(ang) * ry,
      color,
    };
  });

  return (
    <svg viewBox="0 0 400 250" width="100%" height="100%" style={{ maxWidth: 600 }}>
      {/* Ley lines from edges toward center */}
      {nodes.map((node, i) => (
        <motion.line
          key={`line-${i}`}
          x1={node.x}
          y1={node.y}
          x2={cx}
          y2={cy}
          stroke="#d0b870"
          strokeWidth="0.8"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: [0, 0.5, 0.3, 0.5], pathLength: 1 }}
          transition={{ delay: 0.2 + i * 0.3, duration: 2.5, ease: "easeInOut" }}
        />
      ))}

      {/* Additional criss-crossing ley lines for atmosphere */}
      {[
        `M 0,30 L ${cx},${cy}`,
        `M 400,20 L ${cx},${cy}`,
        `M 0,220 L ${cx},${cy}`,
        `M 400,240 L ${cx},${cy}`,
        `M 50,125 L 350,125`,
        `M 200,0 L 200,250`,
      ].map((d, i) => (
        <motion.path
          key={`extra-${i}`}
          d={d}
          fill="none"
          stroke="#d0b870"
          strokeWidth="0.4"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: [0, 0.15, 0.08, 0.15], pathLength: 1 }}
          transition={{ delay: 0.5 + i * 0.2, duration: 3, ease: "easeInOut" }}
        />
      ))}

      {/* Pulsing energy along main lines */}
      {nodes.map((node, i) => (
        <motion.circle
          key={`pulse-${i}`}
          r="2"
          fill="#d0b870"
          initial={{ cx: node.x, cy: node.y, opacity: 0 }}
          animate={{
            cx: [node.x, cx],
            cy: [node.y, cy],
            opacity: [0, 0.7, 0],
          }}
          transition={{ delay: 1.5 + i * 0.3, duration: 2, ease: "easeIn" }}
        />
      ))}

      {/* Place nodes along the ley lines */}
      {nodes.map((node, i) => (
        <motion.circle
          key={`node-${i}`}
          cx={node.x}
          cy={node.y}
          r="5"
          fill={node.color}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.25, duration: 1, ease: "easeOut" }}
        />
      ))}

      {/* Central nexus node — forms from convergence */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="14"
        fill="none"
        stroke="#d0b870"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.8], scale: [0, 1] }}
        transition={{ delay: 3.0, duration: 1.5, ease: "easeOut" }}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r="6"
        fill="#d0b870"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.9], scale: [0, 1] }}
        transition={{ delay: 3.5, duration: 1.2, ease: "easeOut" }}
      />
      {/* Bright core */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="2.5"
        fill="#fff8e0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.7, 1] }}
        transition={{ delay: 4.0, duration: 2, ease: "easeInOut" }}
      />
    </svg>
  );
}

/** Act III → IV: Spirit circle turns toward golden light */
function RestorationScene() {
  const cx = 200;
  const cy = 125;
  const spiritCount = 8;

  // Simple bezier silhouette paths for spirit figures
  const spiritPath = (x: number, y: number, facing: number) => {
    const dx = facing * 4;
    return `M ${x} ${y + 18} Q ${x - 3} ${y + 5} ${x + dx} ${y - 5} Q ${x + dx + 2} ${y - 12} ${x + dx} ${y - 18} Q ${x + dx - 3} ${y - 22} ${x + dx - 6} ${y - 18} Q ${x - 5} ${y - 8} ${x - 4} ${y + 5} Z`;
  };

  const spirits = Array.from({ length: spiritCount }, (_, i) => {
    const ang = (i / spiritCount) * Math.PI * 2 - Math.PI / 2;
    const r = 70;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    // Facing: turn toward center (+1 right, -1 left)
    const facing = x < cx ? 1 : -1;
    return { x, y, facing, ang };
  });

  // Light source position (above center)
  const lightX = cx;
  const lightY = cy - 10;

  return (
    <svg viewBox="0 0 400 250" width="100%" height="100%" style={{ maxWidth: 600 }}>
      <defs>
        <radialGradient id="warmLight" cx="50%" cy="45%" r="50%">
          <motion.stop
            offset="0%"
            stopColor="#d0a840"
            initial={{ stopOpacity: 0 }}
            animate={{ stopOpacity: [0, 0.6] }}
            transition={{ delay: 3.0, duration: 2.5, ease: "easeIn" }}
          />
          <motion.stop
            offset="100%"
            stopColor="#060608"
            initial={{ stopOpacity: 1 }}
            animate={{ stopOpacity: 1 }}
          />
        </radialGradient>
      </defs>

      {/* Warm light background fill */}
      <motion.rect
        x="0"
        y="0"
        width="400"
        height="250"
        fill="url(#warmLight)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1] }}
        transition={{ delay: 2.5, duration: 3 }}
      />

      {/* Spirit figures — appear in darkness, then turn toward light */}
      {spirits.map((sp, i) => (
        <motion.path
          key={i}
          d={spiritPath(sp.x, sp.y, sp.facing)}
          fill="none"
          stroke="#a0a0b8"
          strokeWidth="0.8"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0.5] }}
          transition={{ delay: 0.3 + i * 0.15, duration: 2, ease: "easeOut" }}
        />
      ))}

      {/* Central golden light point */}
      <motion.circle
        cx={lightX}
        cy={lightY}
        r="3"
        fill="#e8c860"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1], scale: [0, 1] }}
        transition={{ delay: 2.0, duration: 1.5, ease: "easeOut" }}
      />

      {/* Light expands */}
      <motion.circle
        cx={lightX}
        cy={lightY}
        r="30"
        fill="#d0a840"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.15], scale: [0, 1] }}
        transition={{ delay: 3.0, duration: 2.5, ease: "easeOut" }}
      />
      <motion.circle
        cx={lightX}
        cy={lightY}
        r="80"
        fill="#d0a840"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.06], scale: [0, 1] }}
        transition={{ delay: 4.0, duration: 2, ease: "easeOut" }}
      />

      {/* Spirit figures glow warmer as light hits them */}
      {spirits.map((sp, i) => (
        <motion.path
          key={`warm-${i}`}
          d={spiritPath(sp.x, sp.y, sp.facing)}
          fill="none"
          stroke="#d0b870"
          strokeWidth="0.6"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3] }}
          transition={{ delay: 3.5 + i * 0.1, duration: 2, ease: "easeIn" }}
        />
      ))}
    </svg>
  );
}

/* ── Config per act transition ── */
const TRANSITIONS: Record<number, { title: string; Scene: React.FC }> = {
  2: { title: "Discovery", Scene: DiscoveryScene },
  5: { title: "The Nexus", Scene: NexusScene },
  8: { title: "Restoration", Scene: RestorationScene },
};

/* ── Main component ── */
export default function ActTransition() {
  const { lvl, advanceLevel } = useGameStore();

  const transition = TRANSITIONS[lvl];
  const title = transition?.title ?? "";
  const Scene = transition?.Scene;

  const advance = useCallback(() => {
    advanceLevel();
  }, [advanceLevel]);

  // Play the NEXT act's ambient during the transition
  // so the tonal shift is audible as a bridge between acts
  useEffect(() => {
    const nextLvl = lvl + 1;
    const nextAct = getActIndex(nextLvl);
    startAmbient(nextAct, nextLvl);
    return () => { stopAmbient(); };
  }, [lvl]);

  // Auto-advance after 7 seconds
  useEffect(() => {
    const timer = setTimeout(advance, 7000);
    return () => clearTimeout(timer);
  }, [advance]);

  // Keyboard: space/enter to skip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advance]);

  return (
    <div className={s.container} onClick={advance} role="button" tabIndex={0} aria-label="Continue to next act">
      <AnimatePresence>
        <motion.div
          key="scene"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {Scene && <Scene />}
        </motion.div>
      </AnimatePresence>

      {/* Act title */}
      <motion.div
        className={s.actTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 7, times: [0, 0.6, 0.72, 0.85, 1], ease: "easeInOut" }}
      >
        {title}
      </motion.div>

      {/* Skip hint */}
      <motion.div
        className={s.skipHint}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        tap to continue
      </motion.div>
    </div>
  );
}
