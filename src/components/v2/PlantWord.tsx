import { useMemo, useState } from "react";
import { trackEvent } from "../../analytics";
import s from "../../styles/PlantWord.module.css";

/**
 * The planting finale — "Leave one word for the next scribe."
 *
 * The Act III journal page promises it ("finish the line, then leave one
 * word of your own"). After "It remembers you." the outro offers a blank
 * line. The player types one word and plants it; the word grows into a
 * bloom whose shape, color, and lean are seeded from its letters, with
 * one small star for each letter. It persists in localStorage and is
 * already grown, gently swaying, when they return.
 *
 * Its own visible input, on purpose: the game's singleton input routes
 * keystrokes to the incantation matcher, and this is the one moment the
 * player writes something that is theirs. Tapping the line focuses it
 * inside the gesture, so the iOS keyboard opens.
 *
 * Nothing the player types is sent anywhere; the analytics event is a
 * count only.
 */

const WORD_KEY = "inkwood-word";
const MAX_LEN = 16;

interface Planted {
  word: string;
  at: number;
}

function loadPlanted(): Planted | null {
  try {
    const raw = localStorage.getItem(WORD_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Planted;
    if (typeof data.word === "string" && data.word.length > 0) return data;
  } catch { /* ignore */ }
  return null;
}

function savePlanted(word: string) {
  try { localStorage.setItem(WORD_KEY, JSON.stringify({ word, at: Date.now() })); } catch { /* ignore */ }
}

function clearPlanted() {
  try { localStorage.removeItem(WORD_KEY); } catch { /* ignore */ }
}

/** FNV-1a — the same stable hash the melody planner uses. */
function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Petal hues: the game's own accents, plus a few the forest would grow.
const HUES = [
  { fill: "#e07a8a", edge: "#b5556a" }, // rose
  { fill: "#e8a04a", edge: "#b8702a" }, // amber
  { fill: "#e8d070", edge: "#b8a040" }, // gold
  { fill: "#8fc48f", edge: "#5f9560" }, // leaf green
  { fill: "#70c4c4", edge: "#489090" }, // teal
  { fill: "#9a96f0", edge: "#6a66c0" }, // violet-blue
  { fill: "#c090c8", edge: "#906098" }, // lilac
  { fill: "#f0f0e0", edge: "#c0b890" }, // moon white
];

interface BloomSpec {
  petals: number;
  hue: { fill: string; edge: string };
  petalLen: number;
  petalWidth: number;
  lean: number;
  leaves: number;
  stars: { x: number; y: number; r: number; delay: number }[];
}

/** Everything about the bloom comes from the word. Same word, same
 *  flower, forever. */
function bloomFor(word: string): BloomSpec {
  const rand = mulberry32(hashString(word.toLowerCase()));
  const petals = 5 + Math.floor(rand() * 4);         // 5–8
  const hue = HUES[Math.floor(rand() * HUES.length)];
  const petalLen = 20 + rand() * 9;
  const petalWidth = 6 + rand() * 4;
  const lean = (rand() - 0.5) * 10;                   // degrees
  const leaves = 1 + Math.floor(rand() * 2);
  // One star per letter, on a loose ring around the bloom.
  const stars = Array.from({ length: word.length }, (_, i) => {
    const a = (i / word.length) * Math.PI * 2 + rand() * 0.6;
    const r = 34 + rand() * 18;
    return {
      x: 100 + Math.cos(a) * r * 1.35,
      y: 58 + Math.sin(a) * r * 0.75,
      r: 0.9 + rand() * 0.9,
      delay: rand() * 3,
    };
  });
  return { petals, hue, petalLen, petalWidth, lean, leaves, stars };
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Bloom({ word, grow }: { word: string; grow: boolean }) {
  const spec = useMemo(() => bloomFor(word), [word]);
  const still = prefersReducedMotion();
  const animate = grow && !still;
  const cx = 100, cy = 58;
  const petalPath = `M0 0 C ${-spec.petalWidth} -8, ${-spec.petalWidth - 1} ${-spec.petalLen + 6}, 0 ${-spec.petalLen} C ${spec.petalWidth + 1} ${-spec.petalLen + 6}, ${spec.petalWidth} -8, 0 0 Z`;
  // The stem curves up from the soil line to the bloom, leaning with the word.
  const stem = `M100 132 C ${100 + spec.lean * 0.6} 110, ${100 + spec.lean * 1.4} 90, ${cx + spec.lean * 1.2} ${cy + 10}`;

  return (
    <svg className={s.bloom} viewBox="0 0 200 140" aria-label={`A flower grown from the word ${word}`} role="img">
      <defs>
        <radialGradient id="pwCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d0" />
          <stop offset="70%" stopColor="#e8c060" />
          <stop offset="100%" stopColor="#b08830" />
        </radialGradient>
        <radialGradient id="pwHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={spec.hue.fill} stopOpacity="0.28" />
          <stop offset="100%" stopColor={spec.hue.fill} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soil line */}
      <path d="M62 132 C 80 130, 120 134, 138 132" fill="none" stroke="#3a3020" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

      {/* Everything grows from the soil: scale about (100,132). */}
      <g transform="translate(100 132)">
        <g>
          {animate && (
            <animateTransform attributeName="transform" type="scale" from="0 0" to="1 1" dur="2.2s" fill="freeze" calcMode="spline" keySplines="0.2 0.7 0.2 1" />
          )}
          <g transform="translate(-100 -132)">
            {/* Halo behind the bloom */}
            <circle cx={cx} cy={cy} r="34" fill="url(#pwHalo)" />

            {/* Stem + leaves */}
            <path d={stem} fill="none" stroke="#5f8a4a" strokeWidth="1.8" strokeLinecap="round" />
            {Array.from({ length: spec.leaves }, (_, i) => {
              const t = 0.45 + i * 0.25;
              const lx = 100 + spec.lean * 1.1 * t;
              const ly = 132 - 60 * t;
              const dir = i % 2 === 0 ? -1 : 1;
              return (
                <path key={i}
                  d={`M${lx} ${ly} C ${lx + dir * 6} ${ly - 4}, ${lx + dir * 13} ${ly - 5}, ${lx + dir * 15} ${ly - 1} C ${lx + dir * 12} ${ly + 3}, ${lx + dir * 5} ${ly + 3}, ${lx} ${ly} Z`}
                  fill="#6f9a56" opacity="0.9" />
              );
            })}

            {/* Petals open a breath after the stem rises; a slow sway forever after. */}
            <g transform={`translate(${cx + spec.lean * 1.2} ${cy + 10})`}>
              <g>
                {animate && (
                  <animateTransform attributeName="transform" type="scale" from="0.05 0.05" to="1 1" begin="1.1s" dur="1.6s" fill="freeze" calcMode="spline" keySplines="0.2 0.7 0.2 1" />
                )}
                <g>
                  {!still && (
                    <animateTransform attributeName="transform" type="rotate" values="-2.5;2.5;-2.5" dur="6.5s" repeatCount="indefinite" additive="sum" />
                  )}
                  {Array.from({ length: spec.petals }, (_, i) => (
                    <path key={i} d={petalPath}
                      transform={`rotate(${(i / spec.petals) * 360})`}
                      fill={spec.hue.fill} stroke={spec.hue.edge} strokeWidth="0.6" opacity="0.92" />
                  ))}
                  <circle r="4.2" fill="url(#pwCenter)" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* One small star for each letter of the word. */}
      {spec.stars.map((st, i) => (
        <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#f0e8c0" opacity="0.55">
          {!still && (
            <animate attributeName="opacity" values="0.25;0.8;0.25" dur={`${2.6 + (i % 3) * 0.7}s`} begin={`${animate ? 2.4 + st.delay : st.delay}s`} repeatCount="indefinite" />
          )}
          {animate && (
            <animate attributeName="r" from="0" to={st.r} begin={`${2.2 + st.delay * 0.3}s`} dur="0.8s" fill="freeze" />
          )}
        </circle>
      ))}
    </svg>
  );
}

export default function PlantWord() {
  const [planted, setPlanted] = useState<Planted | null>(() => loadPlanted());
  const [justPlanted, setJustPlanted] = useState(false);
  const [draft, setDraft] = useState("");
  const [devMode] = useState(() => {
    try { return new URLSearchParams(window.location.search).has("dev"); } catch { return false; }
  });

  // Letters only, one word, gentle cap. Keep the player's casing.
  const clean = (v: string) => v.replace(/[^\p{L}]/gu, "").slice(0, MAX_LEN);
  const canPlant = draft.length >= 2;

  const plant = () => {
    if (!canPlant) return;
    savePlanted(draft);
    setPlanted({ word: draft, at: Date.now() });
    setJustPlanted(true);
    trackEvent("plant/word");
  };

  if (planted) {
    return (
      <div className={s.plant} style={justPlanted ? { animation: "none", opacity: 1 } : undefined}>
        <Bloom word={planted.word} grow={justPlanted} />
        <p className={s.planted}>{planted.word}</p>
        <p className={s.keep}>{justPlanted ? "It will be here when you return." : "Still here."}</p>
        {devMode && (
          <button className={s.unplant} onClick={() => { clearPlanted(); setPlanted(null); setJustPlanted(false); setDraft(""); }}>
            unplant (dev)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={s.plant}>
      <p className={s.ask}>Leave one word for the next scribe.</p>
      <div className={s.row}>
        <input
          className={s.word}
          data-plant-input="1"
          type="text"
          value={draft}
          onChange={(e) => setDraft(clean(e.target.value))}
          onKeyDown={(e) => {
            // Space/Enter restart the outro via a window listener; while the
            // player is writing, those keys are theirs. Stopping the native
            // event here (after React has dispatched it) keeps it from ever
            // reaching that listener.
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.nativeEvent.stopPropagation();
              if (e.key === "Enter") plant();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          maxLength={MAX_LEN}
          aria-label="One word for the next scribe"
        />
        <button className={s.plantBtn} onClick={(e) => { e.stopPropagation(); plant(); }} disabled={!canPlant}>
          Plant
        </button>
      </div>
    </div>
  );
}
