import { useGameStore } from "../store";
import { LEVELS, getActLabel } from "../levels";
import s from "../styles/WinScreens.module.css";

export default function LevelWinScreen() {
  const { lvl, advanceLevel } = useGameStore();
  const level = LEVELS[lvl];
  const { accent, bg } = level;
  const pct = Math.round(((lvl + 1) / LEVELS.length) * 100);

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
        {getActLabel(lvl)} — {pct}% COMPLETE
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
