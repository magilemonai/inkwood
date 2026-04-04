import { useRef, useEffect } from "react";
import { useGameStore } from "../store";
import { LEVELS, getActLabel } from "../levels";
import s from "../styles/WinScreens.module.css";

export default function LevelWinScreen() {
  const { lvl, advanceLevel } = useGameStore();

  // Capture level data at mount — prevents flash of next level during exit animation
  const snapshotRef = useRef({ lvl, level: LEVELS[lvl] });
  const { level } = snapshotRef.current;
  const snappedLvl = snapshotRef.current.lvl;

  // Keyboard: space or enter to advance
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advanceLevel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advanceLevel]);

  const { accent, bg } = level;
  const pct = Math.round(((snappedLvl + 1) / LEVELS.length) * 100);

  return (
    <div className={s.container} style={{ background: bg }}>
      <div
        className={s.glowDot}
        style={{
          background: accent,
          boxShadow: `0 0 18px 6px ${accent}40`,
        }}
      />
      <h2 className={s.heading}>{level.title}</h2>
      <p className={s.winText}>{level.winText}</p>
      <div className={s.actLabel}>
        {getActLabel(snappedLvl)} — {pct}% COMPLETE
      </div>
      <button
        className={s.continueBtn}
        style={{ border: `1px solid ${accent}`, color: accent }}
        onClick={advanceLevel}
      >
        Continue →
      </button>
    </div>
  );
}
