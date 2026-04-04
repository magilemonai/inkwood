import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import s from "../styles/WinScreens.module.css";

export default function GameWinScreen() {
  const restart = useGameStore((g) => g.restart);

  return (
    <div className={s.container} style={{ background: "#060808" }}>
      {/* Nexus mandala */}
      <svg viewBox="0 0 120 120" width="80" height="80" className={s.logo}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="#d8c890" strokeWidth="1" opacity="0.3" />
        <circle
          cx="60"
          cy="60"
          r="35"
          fill="none"
          stroke="#d8c890"
          strokeWidth="0.8"
          opacity="0.2"
          strokeDasharray="3 5"
        />
        {LEVELS.map((l, i) => {
          const ang = (i / LEVELS.length) * Math.PI * 2 - Math.PI / 2;
          const x = 60 + Math.cos(ang) * 42;
          const y = 60 + Math.sin(ang) * 42;
          return <circle key={i} cx={x} cy={y} r="3" fill={l.accent} opacity="0.7" />;
        })}
        <circle cx="60" cy="60" r="6" fill="#d8c890" opacity="0.4" />
        <circle cx="60" cy="60" r="2.5" fill="white" opacity="0.5" />
      </svg>

      <h2 className={s.gameWinHeading}>The Ancient Order Holds</h2>

      <p className={s.gameWinText}>
        Ten places, once forgotten, now alive with spirit and purpose. The ley
        lines hum, the Great Tree breathes, and the nexus pulses with quiet
        power. You have written the world back into being, scribe. The spirits
        will remember your name.
      </p>

      <div className={s.dotRow}>
        {LEVELS.map((l, i) => (
          <div key={i} className={s.dotItem} style={{ background: l.accent }} />
        ))}
      </div>

      <button
        className={s.continueBtn}
        style={{ border: "1px solid #6a6040", color: "#d8c890", marginTop: "0.5rem" }}
        onClick={restart}
      >
        Begin Again
      </button>
    </div>
  );
}
