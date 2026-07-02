import { useState, useEffect } from "react";
import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import { isMusicEnabled, setMusicEnabled } from "../music";
import { isInkEnabled, setInkEnabled } from "../ink";
import { isSeasonsEnabled, setSeasonsEnabled } from "../seasons";

/**
 * Floating dev panel for testing. Toggle with F2 key.
 * Only rendered in development mode.
 */
export default function DevPanel() {
  const [open, setOpen] = useState(false);
  const lvl = useGameStore((g) => g.lvl);
  const screen = useGameStore((g) => g.screen);
  const jumpToLevel = useGameStore((g) => g.jumpToLevel);
  const setScreen = useGameStore((g) => g.setScreen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      top: 8,
      right: 8,
      zIndex: 9999,
      background: "rgba(0,0,0,0.9)",
      border: "1px solid #333",
      borderRadius: 6,
      padding: "8px 12px",
      fontFamily: "monospace",
      fontSize: 11,
      color: "#aaa",
      maxHeight: "90vh",
      overflowY: "auto",
      userSelect: "none",
    }}>
      <div style={{ marginBottom: 6, color: "#666", fontSize: 10 }}>
        DEV — screen: {screen} — lvl: {lvl}
      </div>

      <div style={{ marginBottom: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button onClick={() => setScreen("intro")} style={btnStyle}>intro</button>
        <button onClick={() => setScreen("outro")} style={btnStyle}>outro</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {LEVELS.map((l, i) => (
          <button
            key={i}
            onClick={() => jumpToLevel(i)}
            style={{
              ...btnStyle,
              textAlign: "left",
              color: i === lvl ? l.accent : "#888",
              fontWeight: i === lvl ? "bold" : "normal",
            }}
          >
            {i}: {l.title}
          </button>
        ))}
      </div>

      <MusicToggle />

      <div style={{ marginTop: 6, color: "#444", fontSize: 9 }}>
        F2 to close
      </div>
    </div>
  );
}

/** Prototype gates for the elevation pillars (also ?music / ?ink). */
function MusicToggle() {
  const [music, setMusic] = useState(isMusicEnabled);
  const [ink, setInk] = useState(isInkEnabled);
  const [seasons, setSeasons] = useState(isSeasonsEnabled);
  return (
    <>
      <label style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, cursor: "pointer", color: music ? "#b8c8a8" : "#888" }}>
        <input
          type="checkbox"
          checked={music}
          onChange={(e) => {
            setMusic(e.target.checked);
            setMusicEnabled(e.target.checked);
          }}
        />
        music of typing
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, cursor: "pointer", color: ink ? "#b8c8a8" : "#888" }}>
        <input
          type="checkbox"
          checked={ink}
          onChange={(e) => {
            setInk(e.target.checked);
            setInkEnabled(e.target.checked);
          }}
        />
        ink motes
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, cursor: "pointer", color: seasons ? "#b8c8a8" : "#888" }}>
        <input
          type="checkbox"
          checked={seasons}
          onChange={(e) => {
            setSeasons(e.target.checked);
            setSeasonsEnabled(e.target.checked);
          }}
        />
        living seasons
      </label>
    </>
  );
}

const btnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid #333",
  color: "#888",
  padding: "2px 6px",
  borderRadius: 3,
  cursor: "pointer",
  fontFamily: "monospace",
  fontSize: 11,
};
