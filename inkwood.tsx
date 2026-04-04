import { useState, useEffect, useRef } from "react";

const LEVELS = [
  {
    title: "The Sleeping Garden",
    flavor: "Frost clings to every petal. Breathe life back into the garden.",
    prompts: ["warm summer rain", "roots reach deep, leaves touch light"],
    scene: "garden",
    accent: "#6bbf6b",
    bg: "#080e08",
  },
  {
    title: "The Dark Cottage",
    flavor: "The hearth is cold and every candle dark. Call the warmth home.",
    prompts: ["little candle burn bright", "amber glow fills every room"],
    scene: "cottage",
    accent: "#e89a30",
    bg: "#0d0905",
  },
  {
    title: "The Night Sky",
    flavor: "The stars have gone to sleep. Speak their names to wake them.",
    prompts: ["Orion Vega Sirius Lyra", "the sky blooms with ancient fire"],
    scene: "stars",
    accent: "#9090f8",
    bg: "#03030e",
  },
];

function getCharStates(typed, target) {
  return target.split("").map((ch, i) => {
    if (i >= typed.length) return "pending";
    return typed[i] === ch ? "correct" : "error";
  });
}

// ─── GARDEN SCENE ───────────────────────────────────────────
function GardenScene({ progress: p }) {
  const skyH = 110 + p * 15;
  const skyS = 20 + p * 28;
  const skyL = 7 + p * 20;
  const sunY = 88 - p * 62;

  const flowers = [
    { x: 90,  color: "#e87090", delay: 0 },
    { x: 160, color: "#f0c050", delay: 0.2 },
    { x: 230, color: "#a070e0", delay: 0.4 },
    { x: 300, color: "#60c888", delay: 0.6 },
    { x: 350, color: "#f08050", delay: 0.78 },
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <radialGradient id="sg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5e060" stopOpacity={p * 0.35} />
          <stop offset="100%" stopColor="#f5e060" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill={`hsl(${skyH},${skyS}%,${skyL}%)`} />
      {p > 0.35 && (
        <>
          <ellipse cx="75"  cy="58" rx="38" ry="13" fill="white" opacity={Math.min(1, (p - 0.35) / 0.25) * 0.55} />
          <ellipse cx="108" cy="52" rx="28" ry="10" fill="white" opacity={Math.min(1, (p - 0.35) / 0.25) * 0.55} />
          <ellipse cx="290" cy="42" rx="33" ry="11" fill="white" opacity={Math.min(1, (p - 0.45) / 0.25) * 0.45} />
        </>
      )}
      <circle cx="335" cy={sunY} r="52" fill="url(#sg)" />
      <circle cx="335" cy={sunY} r="20" fill="#f5d860" opacity={p} />
      <rect x="0" y="205" width="400" height="45" fill={`hsl(120,${28 + p * 20}%,${11 + p * 9}%)`} />
      {[20,55,85,115,150,185,215,250,285,320,355].map((x, i) => (
        <line key={i} x1={x} y1="205" x2={x - 4} y2={192} stroke={`hsl(120,${38+p*18}%,${20+p*14}%)`} strokeWidth="2" opacity={p} />
      ))}
      {p > 0.05 && p < 0.62 && Array.from({ length: 18 }).map((_, i) => (
        <line key={i} x1={25 + i * 20} y1={38 + (i % 5) * 28} x2={23 + i * 20} y2={52 + (i % 5) * 28}
          stroke="#90c8f0" strokeWidth="1.2"
          opacity={(p < 0.32 ? p / 0.32 : (0.62 - p) / 0.3) * 0.7} />
      ))}
      {flowers.map((f, i) => {
        const fp = Math.min(1, Math.max(0, (p - f.delay) / 0.28));
        const sh = fp * 42;
        const pr = fp * 10;
        return (
          <g key={i} opacity={fp}>
            <line x1={f.x} y1="205" x2={f.x} y2={205 - sh} stroke="#3a7a2a" strokeWidth="2" />
            {[0, 72, 144, 216, 288].map((ang, j) => (
              <ellipse key={j}
                cx={f.x + Math.cos((ang * Math.PI) / 180) * pr * 1.4}
                cy={(205 - sh) + Math.sin((ang * Math.PI) / 180) * pr * 1.4}
                rx={pr * 0.75} ry={pr * 0.48}
                fill={f.color}
                transform={`rotate(${ang}, ${f.x + Math.cos((ang * Math.PI) / 180) * pr * 1.4}, ${(205 - sh) + Math.sin((ang * Math.PI) / 180) * pr * 1.4})`}
              />
            ))}
            <circle cx={f.x} cy={205 - sh} r={pr * 0.48} fill="#f5e060" />
          </g>
        );
      })}
    </svg>
  );
}

// ─── COTTAGE SCENE ──────────────────────────────────────────
function CottageScene({ progress: p }) {
  const ambL = 5 + p * 16;
  const candles = [
    { x: 95,  y: 178, prog: Math.min(1, p / 0.38), col: "#f5a020" },
    { x: 200, y: 163, prog: Math.min(1, Math.max(0, (p - 0.32) / 0.38)), col: "#f0c040" },
    { x: 305, y: 178, prog: Math.min(1, Math.max(0, (p - 0.62) / 0.36)), col: "#e88030" },
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {candles.map((c, i) => (
          <radialGradient key={i} id={`cg${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c.col} stopOpacity={c.prog * 0.75} />
            <stop offset="100%" stopColor={c.col} stopOpacity="0" />
          </radialGradient>
        ))}
        <radialGradient id="wg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f5e0a0" stopOpacity={p * 0.45} />
          <stop offset="100%" stopColor="#f5e0a0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill={`hsl(30,18%,${ambL}%)`} />
      <rect x="0" y="0" width="400" height="200" fill={`hsl(30,13%,${4 + p * 9}%)`} />
      <rect x="0" y="200" width="400" height="50" fill={`hsl(25,28%,${7 + p * 8}%)`} />
      {/* Window */}
      <rect x="158" y="28" width="84" height="72" fill={`hsl(210,45%,${8 + p * 26}%)`} rx="4" />
      <rect x="158" y="28" width="84" height="72" fill="url(#wg)" rx="4" />
      <line x1="200" y1="28" x2="200" y2="100" stroke="#6a4820" strokeWidth="3.5" />
      <line x1="158" y1="64" x2="242" y2="64" stroke="#6a4820" strokeWidth="3.5" />
      <rect x="153" y="23" width="94" height="82" fill="none" stroke="#6a4820" strokeWidth="5" rx="4" />
      {/* Shelf */}
      <rect x="48" y="173" width="304" height="7" fill="#6a4010" rx="2" />
      {/* Books */}
      {[["#7a3010",16],["#106838",14],["#0e2075",17],["#6a1050",13]].map(([col, h], i) => (
        <rect key={i} x={68 + i * 17} y={173 - h} width="13" height={h} fill={col} rx="1" />
      ))}
      {/* Mug */}
      <rect x="268" y="161" width="20" height="15" fill="#c08850" rx="3" />
      <path d="M288 165 Q297 165 297 171 Q297 177 288 177" fill="none" stroke="#c08850" strokeWidth="2.5" />
      {p > 0.48 && (
        <>
          <path d="M273 158 Q270 152 273 146" fill="none" stroke="white" strokeWidth="1.5" opacity={(p - 0.48) / 0.52 * 0.55} />
          <path d="M279 158 Q276 150 279 144" fill="none" stroke="white" strokeWidth="1.5" opacity={(p - 0.48) / 0.52 * 0.45} />
        </>
      )}
      {/* Candles */}
      {candles.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 22} r="62" fill={`url(#cg${i})`} />
          <rect x={c.x - 6} y={c.y - 30} width="12" height="30" fill="#f0ead0" rx="3" />
          <ellipse cx={c.x} cy={c.y - 35} rx={4.5 * c.prog} ry={8 * c.prog} fill={c.col} opacity={c.prog} />
          <ellipse cx={c.x} cy={c.y - 39} rx={2.2 * c.prog} ry={4.5 * c.prog} fill="white" opacity={c.prog * 0.75} />
        </g>
      ))}
      {/* Cat silhouette - appears late */}
      {p > 0.7 && (
        <g opacity={Math.min(1, (p - 0.7) / 0.25)}>
          <ellipse cx="340" cy="200" rx="18" ry="12" fill="#111" />
          <circle cx="340" cy="188" r="10" fill="#111" />
          <polygon points="332,180 328,170 336,178" fill="#111" />
          <polygon points="348,180 352,170 344,178" fill="#111" />
          <path d="M350 200 Q365 195 370 205" fill="none" stroke="#111" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}

// ─── STAR SCENE ─────────────────────────────────────────────
function StarScene({ progress: p }) {
  const bgL = 3 + p * 6;
  const moonY = 42 - p * 18;

  const stars = [
    { x: 118, y: 78,  r: 3.2, t: 0 },
    { x: 138, y: 98,  r: 2.2, t: 0.05 },
    { x: 128, y: 118, r: 2.6, t: 0.09 },
    { x: 113, y: 145, r: 2.1, t: 0.13 },
    { x: 143, y: 145, r: 2.1, t: 0.17 },
    { x: 106, y: 162, r: 2.2, t: 0.2 },
    { x: 150, y: 162, r: 2.6, t: 0.24 },
    { x: 262, y: 58,  r: 3.8, t: 0.28 },
    { x: 298, y: 178, r: 3.2, t: 0.38 },
    { x: 78,  y: 198, r: 2.0, t: 0.46 },
    { x: 332, y: 88,  r: 2.8, t: 0.5  },
    { x: 48,  y: 68,  r: 1.6, t: 0.56 },
    { x: 202, y: 38,  r: 2.1, t: 0.61 },
    { x: 352, y: 138, r: 1.6, t: 0.66 },
    { x: 172, y: 168, r: 2.1, t: 0.71 },
    { x: 242, y: 208, r: 1.6, t: 0.75 },
    { x: 372, y: 58,  r: 2.1, t: 0.79 },
    { x: 28,  y: 128, r: 1.6, t: 0.83 },
    { x: 312, y: 228, r: 2.1, t: 0.86 },
    { x: 182, y: 222, r: 1.6, t: 0.89 },
    { x: 68,  y: 42,  r: 2.6, t: 0.92 },
    { x: 382, y: 198, r: 1.6, t: 0.94 },
    { x: 218, y: 128, r: 2.1, t: 0.96 },
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <radialGradient id="mg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8d4f0" stopOpacity={p * 0.55} />
          <stop offset="100%" stopColor="#c8d4f0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill={`hsl(232,38%,${bgL}%)`} />
      <ellipse cx="200" cy="130" rx="340" ry="55" fill="hsl(240,28%,10%)" opacity={p * 0.38} transform="rotate(-18,200,130)" />
      <circle cx="342" cy={moonY} r="56" fill="url(#mg)" />
      <circle cx="342" cy={moonY} r="23" fill={`hsl(222,28%,${58 + p * 22}%)`} opacity={0.28 + p * 0.72} />
      <circle cx="332" cy={moonY - 4} r="19" fill={`hsl(232,38%,${bgL}%)`} opacity={0.25 + p * 0.52} />
      {stars.map((s, i) => {
        const sp = Math.min(1, Math.max(0, (p - s.t) / 0.09));
        return (
          <g key={i} opacity={sp}>
            <circle cx={s.x} cy={s.y} r={s.r * 2.8} fill="white" opacity="0.12" />
            <circle cx={s.x} cy={s.y} r={s.r} fill="white" />
          </g>
        );
      })}
      {p > 0.68 && (
        <>
          <line x1="106" y1="162" x2="150" y2="162" stroke="white" strokeWidth="0.6" opacity={(p - 0.68) / 0.32 * 0.38} />
          <line x1="118" y1="78"  x2="138" y2="98"  stroke="white" strokeWidth="0.5" opacity={(p - 0.68) / 0.32 * 0.28} />
        </>
      )}
      <rect x="0" y="232" width="400" height="18" fill="#040407" />
      {[0,28,55,90,128,168,205,242,278,312,348,378].map((x, i) => (
        <polygon key={i} points={`${x},232 ${x + 14},${216 - (i % 3) * 7} ${x + 28},232`} fill="#040407" />
      ))}
    </svg>
  );
}

const SCENES = { garden: GardenScene, cottage: CottageScene, stars: StarScene };

// ─── MAIN GAME ──────────────────────────────────────────────
export default function Inkwood() {
  const [screen, setScreen] = useState("title");
  const [lvl, setLvl] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [completing, setCompleting] = useState(false);
  const inputRef = useRef(null);

  const level = LEVELS[lvl];
  const target = level.prompts[promptIdx];
  const totalPrompts = level.prompts.length;
  const charStates = getCharStates(typed, target);
  const hasError = charStates.some((s) => s === "error");
  const isComplete = typed === target;
  const promptProgress = typed.length / target.length;
  const levelProgress = (promptIdx + promptProgress) / totalPrompts;

  useEffect(() => {
    if (isComplete && !completing) {
      setCompleting(true);
      setTimeout(() => {
        if (promptIdx + 1 < totalPrompts) {
          setPromptIdx((p) => p + 1);
          setTyped("");
          setCompleting(false);
        } else {
          if (lvl + 1 < LEVELS.length) setScreen("levelWin");
          else setScreen("gameWin");
        }
      }, 700);
    }
  }, [isComplete, completing, promptIdx, totalPrompts, lvl]);

  useEffect(() => {
    if (screen === "playing") setTimeout(() => inputRef.current?.focus(), 50);
  }, [screen, lvl, promptIdx]);

  const handleType = (e) => {
    if (completing) return;
    const v = e.target.value;
    if (v.length <= target.length) setTyped(v);
  };

  const nextLevel = () => {
    setLvl((l) => l + 1);
    setPromptIdx(0);
    setTyped("");
    setCompleting(false);
    setScreen("playing");
  };

  const restart = () => {
    setLvl(0); setPromptIdx(0); setTyped(""); setCompleting(false);
    setScreen("title");
  };

  const SceneComp = SCENES[level.scene];
  const { accent, bg } = level;

  // ── Title ──
  if (screen === "title") return (
    <div style={{ background: "#090e09", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#d8c8a0", padding: "2rem", gap: "1.25rem", textAlign: "center" }}>
      <div style={{ fontSize: "3rem" }}>🌿</div>
      <h1 style={{ fontSize: "2.6rem", fontWeight: "normal", letterSpacing: "0.12em", margin: 0, color: "#eaddb0" }}>Inkwood</h1>
      <p style={{ fontSize: "0.95rem", maxWidth: "380px", lineHeight: "1.85", color: "#9a8868", margin: 0 }}>
        You are the forest scribe. Your words have power here.<br />Type each phrase and watch the world come alive.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem", fontSize: "0.82rem", color: "#6a5a3a" }}>
        <div>🌱 &nbsp;The Sleeping Garden</div>
        <div>🕯️ &nbsp;The Dark Cottage</div>
        <div>🌙 &nbsp;The Night Sky</div>
      </div>
      <button onClick={() => setScreen("playing")} style={{ marginTop: "1.25rem", padding: "0.7rem 2.8rem", background: "transparent", border: "1px solid #4a7a3a", color: "#80c860", fontFamily: "Georgia, serif", fontSize: "1rem", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.1em" }}>
        Begin
      </button>
    </div>
  );

  // ── Level Win ──
  if (screen === "levelWin") return (
    <div style={{ background: bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#d8c8a0", gap: "1.5rem", textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "2.5rem" }}>✨</div>
      <h2 style={{ fontWeight: "normal", fontSize: "1.75rem", margin: 0, color: "#eaddb0" }}>{level.title}</h2>
      <p style={{ color: "#9a8868", maxWidth: "360px", lineHeight: "1.85", margin: 0 }}>The scene is alive. Your words worked their magic.</p>
      <button onClick={nextLevel} style={{ padding: "0.7rem 2.8rem", background: "transparent", border: `1px solid ${accent}`, color: accent, fontFamily: "Georgia, serif", fontSize: "1rem", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.1em" }}>
        Continue →
      </button>
    </div>
  );

  // ── Game Win ──
  if (screen === "gameWin") return (
    <div style={{ background: "#03030e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#d0c8f0", gap: "1.5rem", textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "3rem" }}>🌙</div>
      <h2 style={{ fontWeight: "normal", fontSize: "2rem", margin: 0 }}>The world is awake.</h2>
      <p style={{ color: "#9090c0", maxWidth: "380px", lineHeight: "1.85", margin: 0 }}>Garden, hearth, and sky — all restored by your careful hand. The scribe's work is done... for now.</p>
      <button onClick={restart} style={{ padding: "0.7rem 2.8rem", background: "transparent", border: "1px solid #7070d0", color: "#9898f0", fontFamily: "Georgia, serif", fontSize: "1rem", cursor: "pointer", borderRadius: "4px", letterSpacing: "0.1em", marginTop: "0.5rem" }}>
        Play Again
      </button>
    </div>
  );

  // ── Playing ──
  return (
    <div onClick={() => inputRef.current?.focus()} style={{ background: bg, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", color: "#d8c8a0", userSelect: "none" }}>
      {/* Header */}
      <div style={{ padding: "0.85rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1c2a1c" }}>
        <span style={{ fontSize: "0.82rem", color: "#4a7a3a", letterSpacing: "0.12em" }}>INKWOOD</span>
        <span style={{ fontSize: "0.82rem", color: "#6a5a3a" }}>{level.title}</span>
        <span style={{ fontSize: "0.82rem", color: "#3a4a3a" }}>
          {LEVELS.map((_, i) => <span key={i} style={{ margin: "0 2px", color: i <= lvl ? accent : "#2a3a2a" }}>{i <= lvl ? "◆" : "◇"}</span>)}
        </span>
      </div>

      {/* Scene */}
      <div style={{ flex: 1, minHeight: "200px", maxHeight: "310px", overflow: "hidden" }}>
        <SceneComp progress={levelProgress} />
      </div>

      {/* Level progress bar */}
      <div style={{ height: "2px", background: "#141e14" }}>
        <div style={{ height: "100%", width: `${levelProgress * 100}%`, background: accent, transition: "width 0.18s ease" }} />
      </div>

      {/* Typing area */}
      <div style={{ padding: "1.25rem 1.5rem 1.5rem", background: `${bg}ee`, borderTop: "1px solid #1c2a1c" }}>
        <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "#6a5238", textAlign: "center", fontStyle: "italic", lineHeight: "1.7" }}>
          {level.flavor}
        </p>

        {/* Prompt display */}
        <div
          style={{ background: "#0d140d", border: "1px solid #253525", borderRadius: "6px", padding: "0.9rem 1.2rem", marginBottom: "0.6rem", fontSize: "1.18rem", letterSpacing: "0.06em", lineHeight: "1.7", minHeight: "3.6rem", display: "flex", flexWrap: "wrap", alignItems: "center", cursor: "text" }}
          onClick={() => inputRef.current?.focus()}
        >
          {target.split("").map((ch, i) => {
            const s = charStates[i];
            const isCursor = i === typed.length && !completing;
            return (
              <span key={i} style={{
                color: s === "correct" ? accent : s === "error" ? "#e05050" : "#2e3e2e",
                borderLeft: isCursor ? `2px solid ${accent}` : "none",
                paddingLeft: isCursor ? "1px" : "0",
                animation: isCursor ? "blink 1.1s step-end infinite" : "none",
                whiteSpace: "pre",
                transition: "color 0.08s",
              }}>{ch}</span>
            );
          })}
          {typed.length >= target.length && !completing && (
            <span style={{ borderLeft: `2px solid ${accent}`, animation: "blink 1.1s step-end infinite" }}> </span>
          )}
        </div>

        {/* Sub-info */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#3a4a3a", marginBottom: "0.5rem", padding: "0 0.1rem" }}>
          <span style={{ color: isComplete ? accent : hasError ? "#884040" : "#3a4a3a" }}>
            {isComplete ? "✓ well done" : hasError ? "backspace to correct" : "type the phrase above"}
          </span>
          <span>phrase {promptIdx + 1} of {totalPrompts}</span>
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          value={typed}
          onChange={handleType}
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
        />
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
