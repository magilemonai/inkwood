import { useEffect, useCallback } from "react";
import { useGameStore } from "../store";
import { startAmbient } from "../audio";
import { getActIndex } from "../levels";
import s from "../styles/ActTransition.module.css";

/**
 * Act interstitial — a ~7s animated scene that bridges between acts.
 * Three variants (Discovery / Nexus / Restoration). All animation is
 * pure CSS / SVG SMIL — no Framer Motion.
 */

/* ── Discovery: a rune fades in, then scattered runes and ley lines appear ── */
function DiscoveryScene() {
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

  const leyPaths = [
    "M 0,125 Q 60,110 100,125",
    "M 400,125 Q 340,140 300,130",
    "M 200,0 Q 190,40 200,50",
    "M 200,250 Q 210,210 200,200",
    "M 0,50 Q 80,70 130,80",
    "M 400,200 Q 320,180 260,160",
  ];

  return (
    <svg viewBox="0 0 400 250" width="100%" height="100%" style={{ maxWidth: 600 }}>
      <g className={s.discoveryGrid}>
        {[60, 120, 180, 240, 300, 340].map((x) => (
          <line key={`v${x}`} x1={x} y1="20" x2={x} y2="230" stroke="#887860" strokeWidth="0.3" />
        ))}
        {[50, 100, 150, 200].map((y) => (
          <line key={`h${y}`} x1="40" y1={y} x2="360" y2={y} stroke="#887860" strokeWidth="0.3" />
        ))}
      </g>

      {runes.map((r, i) => (
        <g key={i}>
          <circle
            cx={r.main ? 200 : r.x}
            cy={r.main ? 125 : r.y}
            r={r.main ? 18 : 8}
            fill="none"
            stroke="#d0b870"
            strokeWidth={r.main ? 1.2 : 0.6}
            className={r.main ? s.mainRuneRing : s.smallRuneRing}
            style={!r.main ? ({ "--delay": `${r.delay}s` } as React.CSSProperties) : undefined}
          />
          <circle
            cx={r.main ? 200 : r.x}
            cy={r.main ? 125 : r.y}
            r={r.main ? 4 : 2}
            fill="#d0b870"
            className={r.main ? s.mainRuneDot : s.smallRuneDot}
            style={!r.main ? ({ "--delay": `${r.delay + 0.2}s` } as React.CSSProperties) : undefined}
          />
        </g>
      ))}

      {leyPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#d0b870"
          strokeWidth="0.5"
          pathLength="1"
          className={s.leyLine}
          style={{ "--delay": `${3.5 + i * 0.15}s` } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

/* ── Nexus: ley lines converge on a central core ── */
function NexusScene() {
  const nodeColors = ["#6bbf6b", "#e89a30", "#9090f8", "#50b8b8", "#7aaa6a", "#c088b0"];
  const cx = 200;
  const cy = 125;

  const nodes = nodeColors.map((color, i) => {
    const ang = (i / nodeColors.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(ang) * 150,
      y: cy + Math.sin(ang) * 95,
      color,
    };
  });

  const extraPaths = [
    `M 0,30 L ${cx},${cy}`,
    `M 400,20 L ${cx},${cy}`,
    `M 0,220 L ${cx},${cy}`,
    `M 400,240 L ${cx},${cy}`,
    `M 50,125 L 350,125`,
    `M 200,0 L 200,250`,
  ];

  return (
    <svg viewBox="0 0 400 250" width="100%" height="100%" style={{ maxWidth: 600 }}>
      {/* Main ley lines from each node to center */}
      {nodes.map((node, i) => (
        <line
          key={`line-${i}`}
          x1={node.x}
          y1={node.y}
          x2={cx}
          y2={cy}
          stroke="#d0b870"
          strokeWidth="0.8"
          pathLength="1"
          className={s.nexusLine}
          style={{ "--delay": `${0.2 + i * 0.3}s` } as React.CSSProperties}
        />
      ))}

      {/* Additional criss-crossing ley lines for atmosphere */}
      {extraPaths.map((d, i) => (
        <path
          key={`extra-${i}`}
          d={d}
          fill="none"
          stroke="#d0b870"
          strokeWidth="0.4"
          pathLength="1"
          className={s.nexusExtra}
          style={{ "--delay": `${0.5 + i * 0.2}s` } as React.CSSProperties}
        />
      ))}

      {/* Pulses traveling along main lines, expressed via SMIL. */}
      {nodes.map((node, i) => (
        <circle key={`pulse-${i}`} r="2" fill="#d0b870" opacity="0">
          <animate
            attributeName="cx"
            from={node.x}
            to={cx}
            begin={`${1.5 + i * 0.3}s`}
            dur="2s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.42 0 1 1"
          />
          <animate
            attributeName="cy"
            from={node.y}
            to={cy}
            begin={`${1.5 + i * 0.3}s`}
            dur="2s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.42 0 1 1"
          />
          <animate
            attributeName="opacity"
            values="0;0.7;0"
            begin={`${1.5 + i * 0.3}s`}
            dur="2s"
            fill="freeze"
          />
        </circle>
      ))}

      {/* Node points along the ley lines */}
      {nodes.map((node, i) => (
        <circle
          key={`node-${i}`}
          cx={node.x}
          cy={node.y}
          r="5"
          fill={node.color}
          className={s.nexusNode}
          style={{ "--delay": `${0.8 + i * 0.25}s` } as React.CSSProperties}
        />
      ))}

      {/* Central nexus ring */}
      <circle
        cx={cx}
        cy={cy}
        r="14"
        fill="none"
        stroke="#d0b870"
        strokeWidth="1.5"
        className={s.nexusCoreRing}
      />
      <circle
        cx={cx}
        cy={cy}
        r="6"
        fill="#d0b870"
        className={s.nexusCoreFill}
      />
      <circle cx={cx} cy={cy} r="2.5" fill="#fff8e0" className={s.nexusCoreBright} />
    </svg>
  );
}

/* ── Restoration: spirits face a golden light that builds ── */
function RestorationScene() {
  const cx = 200;
  const cy = 125;
  const spiritCount = 8;
  const lightX = cx;
  const lightY = cy - 10;

  const spiritPath = (x: number, y: number, facing: number) => {
    const dx = facing * 4;
    return `M ${x} ${y + 18} Q ${x - 3} ${y + 5} ${x + dx} ${y - 5} Q ${x + dx + 2} ${y - 12} ${x + dx} ${y - 18} Q ${x + dx - 3} ${y - 22} ${x + dx - 6} ${y - 18} Q ${x - 5} ${y - 8} ${x - 4} ${y + 5} Z`;
  };

  const spirits = Array.from({ length: spiritCount }, (_, i) => {
    const ang = (i / spiritCount) * Math.PI * 2 - Math.PI / 2;
    const r = 70;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    const facing = x < cx ? 1 : -1;
    return { x, y, facing, ang };
  });

  return (
    <svg viewBox="0 0 400 250" width="100%" height="100%" style={{ maxWidth: 600 }}>
      <defs>
        <radialGradient id="warmLight" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#d0a840" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#060608" stopOpacity="1" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="400" height="250" fill="url(#warmLight)" className={s.warmLight} />

      {spirits.map((sp, i) => (
        <path
          key={i}
          d={spiritPath(sp.x, sp.y, sp.facing)}
          fill="none"
          stroke="#a0a0b8"
          strokeWidth="0.8"
          className={s.spirit}
          style={{ "--delay": `${0.3 + i * 0.15}s` } as React.CSSProperties}
        />
      ))}

      <circle cx={lightX} cy={lightY} r="3" fill="#e8c860" className={s.restLight} />
      <circle cx={lightX} cy={lightY} r="30" fill="#d0a840" className={s.restLightRing1} />
      <circle cx={lightX} cy={lightY} r="80" fill="#d0a840" className={s.restLightRing2} />

      {spirits.map((sp, i) => (
        <path
          key={`warm-${i}`}
          d={spiritPath(sp.x, sp.y, sp.facing)}
          fill="none"
          stroke="#d0b870"
          strokeWidth="0.6"
          className={s.warmSpirit}
          style={{ "--delay": `${3.5 + i * 0.1}s` } as React.CSSProperties}
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
  const lvl = useGameStore((g) => g.lvl);
  const advanceLevel = useGameStore((g) => g.advanceLevel);

  const transition = TRANSITIONS[lvl];
  const title = transition?.title ?? "";
  const Scene = transition?.Scene;

  const advance = useCallback(() => {
    advanceLevel();
  }, [advanceLevel]);

  // Play the NEXT act's ambient during the transition so the tonal
  // shift is audible as a bridge. No cleanup: the engine crossfades.
  useEffect(() => {
    const nextLvl = lvl + 1;
    const nextAct = getActIndex(nextLvl);
    startAmbient(nextAct, nextLvl);
  }, [lvl]);

  useEffect(() => {
    const timer = setTimeout(advance, 7000);
    return () => clearTimeout(timer);
  }, [advance]);

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
    <div
      className={s.container}
      onClick={advance}
      role="button"
      tabIndex={0}
      aria-label={`Act transition — ${title}. Press space to continue.`}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          advance();
        }
      }}
    >
      <div className={s.sceneWrap}>
        {Scene && <Scene />}
      </div>

      <div className={s.actTitle}>{title}</div>

      <div className={s.skipHint}>tap to continue</div>
    </div>
  );
}
