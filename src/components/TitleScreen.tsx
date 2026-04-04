import { LEVELS, ACT_LABELS, ACT_RANGES } from "../levels";
import { useGameStore } from "../store";
import s from "../styles/TitleScreen.module.css";

export default function TitleScreen() {
  const setScreen = useGameStore((g) => g.setScreen);

  return (
    <div className={s.container}>
      {/* Logo — SVG tree glyph */}
      <svg viewBox="0 0 60 60" width="52" height="52" className={s.logo}>
        <circle cx="30" cy="30" r="28" fill="none" stroke="#3a5a2a" strokeWidth="1.5" />
        <line x1="30" y1="42" x2="30" y2="18" stroke="#4a7a3a" strokeWidth="2" />
        <line x1="30" y1="28" x2="20" y2="20" stroke="#4a7a3a" strokeWidth="1.5" />
        <line x1="30" y1="32" x2="40" y2="24" stroke="#4a7a3a" strokeWidth="1.5" />
        <line x1="30" y1="42" x2="22" y2="50" stroke="#3a5a2a" strokeWidth="1.5" />
        <line x1="30" y1="42" x2="38" y2="50" stroke="#3a5a2a" strokeWidth="1.5" />
        <circle cx="30" cy="15" r="3" fill="#6bbf6b" opacity="0.6" />
      </svg>

      <h1 className={s.title}>Inkwood</h1>

      <p className={s.subtitle}>
        You are the forest scribe. Your words have power here.
        <br />
        An ancient nexus sleeps beneath the land. Type each phrase and restore
        what was lost.
      </p>

      {/* Act structure */}
      <div className={s.acts}>
        {ACT_LABELS.map((act, ai) => (
          <div key={ai}>
            <div className={s.actLabel}>
              ACT {ai + 1}: {act.toUpperCase()}
            </div>
            {LEVELS.slice(ACT_RANGES[ai][0], ACT_RANGES[ai][1] + 1).map(
              (l, li) => (
                <div key={li} className={s.levelItem}>
                  <span className={s.levelDiamond} style={{ color: l.accent }}>
                    &#x25C6;
                  </span>
                  {l.title}
                </div>
              )
            )}
          </div>
        ))}
      </div>

      <button className={s.beginBtn} onClick={() => setScreen("playing")}>
        Begin
      </button>
    </div>
  );
}
