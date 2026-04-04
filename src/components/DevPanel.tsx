import { useState } from "react";
import { useGameStore } from "../store";
import { LEVELS } from "../levels";

/**
 * Floating dev panel for testing. Toggle with backtick (`) key.
 * Only rendered in development mode.
 */
export default function DevPanel() {
  const [open, setOpen] = useState(false);
  const { lvl, screen, jumpToLevel, setScreen } = useGameStore();

  // Toggle with backtick key
  if (typeof window !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useState(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "`") setOpen((o) => !o);
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    });
  }

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

      <div style={{ marginTop: 6, color: "#444", fontSize: 9 }}>
        press ` to close
      </div>
    </div>
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
