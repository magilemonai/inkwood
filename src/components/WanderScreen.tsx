import { useEffect } from "react";
import { useGameStore } from "../store";
import { LEVELS, getActIndex, ACT_LABELS } from "../levels";
import { startAmbient } from "../audio";
import s from "../styles/Wander.module.css";

/**
 * Free-play chapter select. Reachable from the outro once the game has
 * been completed at least once. Each card is a "doorway" back into a
 * single scene — no progression, no sequential advance, just the scene.
 */
export default function WanderScreen() {
  const wanderToLevel = useGameStore((g) => g.wanderToLevel);
  const restart = useGameStore((g) => g.restart);

  // Play Act IV ambient as a gentle menu bed — neutral, restorative.
  useEffect(() => {
    startAmbient(3, 9);
  }, []);

  return (
    <div className={s.container}>
      <h2 className={s.heading}>Wander the woods</h2>
      <p className={s.subheading}>Return to any scene you've wakened.</p>

      <div className={s.grid}>
        {LEVELS.map((level, i) => {
          const actIdx = getActIndex(i);
          return (
            <button
              key={i}
              className={s.card}
              style={{
                borderColor: `${level.accent}40`,
                background: level.bg,
              }}
              onClick={() => wanderToLevel(i)}
              aria-label={`Enter ${level.title}`}
            >
              <span className={s.cardAct}>{ACT_LABELS[actIdx]}</span>
              <span className={s.cardTitle} style={{ color: level.accent }}>
                {level.title}
              </span>
              <span className={s.cardFlavor}>{level.flavor}</span>
              <span className={s.cardGlow} style={{ background: level.accent }} />
            </button>
          );
        })}
      </div>

      <button className={s.backBtn} onClick={restart} aria-label="Return to intro">
        Return to the beginning
      </button>
    </div>
  );
}
