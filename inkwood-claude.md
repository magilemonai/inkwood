# CLAUDE.md — Inkwood: A Cozy Typing Puzzle Game

This file documents the design intent, technical decisions, and creative context for **Inkwood**, built as a React artifact in Claude.ai. Use this as a reference when continuing development.

---

## Project Overview

**Inkwood** is a cozy, single-player typing puzzle game where the player takes on the role of a forest scribe whose written words have literal power. Typing phrases causes the in-game scene to animate in real time — the core loop is: *type accurately → world comes alive*.

The game was designed to feel meditative and rewarding, closer to *Stardew Valley* in tone than *Mavis Beacon*. It is forgiving (errors are correctable via backspace, no fail states) and atmospheric above all else.

---

## Design Pillars

| Pillar | Description |
|---|---|
| **Cozy** | Warm palette, slow animations, no timers, no punishment for errors |
| **Reactive** | Every keystroke drives visual change — typing feels powerful |
| **Layered** | Each level has multiple prompts; progress within a level accumulates |
| **Authored** | Each scene has its own flavor text, color identity, and visual logic |

---

## Creative Concept

The original concept brief:
- **Mechanic:** Live typing of prompted phrases solves environmental puzzles
- **Theme:** Cozy forest scribe — words have literal in-world power
- **Player feedback:** Character-level coloring (correct = accent color, error = red) with animated cursor
- **Difficulty tone:** Learn-to-type pacing but wrapped in narrative flavor, not a typing trainer

### Rejected alternatives considered:
- Timer-based pressure mechanics → rejected to preserve the cozy feel
- Score/WPM tracking as primary feedback → deferred to a future enhancement
- Randomized prompts → rejected in favor of authored, scene-specific phrases with narrative meaning

---

## Level Structure

Each level has:
- A `title` and `flavor` line (shown below the scene)
- A `scene` key mapping to a dedicated SVG component
- An `accent` color (used for correct characters, UI highlights, progress bars)
- A `bg` color (dark base for the level's atmosphere)
- An array of `prompts` — typed in sequence; completing all prompts clears the level

### Current Levels

#### Level 1 — The Sleeping Garden
- **Scene:** `GardenScene`
- **Accent:** `#6bbf6b` (green)
- **BG:** `#080e08`
- **Prompts:** `["warm summer rain", "roots reach deep, leaves touch light"]`
- **Animation logic:** Sky brightens, sun rises, clouds appear, rain falls mid-progress and fades, flowers bloom staggered by delay offset, grass greens

#### Level 2 — The Dark Cottage
- **Scene:** `CottageScene`
- **Accent:** `#e89a30` (amber)
- **BG:** `#0d0905`
- **Prompts:** `["little candle burn bright", "amber glow fills every room"]`
- **Animation logic:** Three candles light sequentially (staggered progress thresholds), window brightens, mug steam appears, cat silhouette fades in late

#### Level 3 — The Night Sky
- **Scene:** `StarScene`
- **Accent:** `#9090f8` (indigo)
- **BG:** `#03030e`
- **Prompts:** `["Orion Vega Sirius Lyra", "the sky blooms with ancient fire"]`
- **Animation logic:** Stars appear one-by-one via staggered `t` thresholds, moon brightens and rises, constellation lines draw in late, treeline silhouette at bottom

---

## Technical Architecture

### Stack
- **React** (hooks only: `useState`, `useEffect`, `useRef`)
- **Inline SVG** for all scene rendering — no canvas, no external libraries
- **No dependencies** beyond React itself

### Component Map

```
Inkwood (root)
├── GardenScene({ progress })
├── CottageScene({ progress })
├── StarScene({ progress })
└── Screens: title | playing | levelWin | gameWin
```

### Progress Model

Progress is a float `[0, 1]` calculated as:

```js
const promptProgress = typed.length / target.length;
const levelProgress = (promptIdx + promptProgress) / totalPrompts;
```

`levelProgress` drives all scene animations. Individual elements within a scene use local thresholds (e.g. `Math.min(1, Math.max(0, (p - delay) / duration))`) to stagger their entry.

### Typing Logic

- Input is captured via a **hidden `<input>`** element that receives focus on click anywhere in the UI
- `getCharStates(typed, target)` returns `"correct" | "error" | "pending"` per character
- The prompt display renders character-by-character with color and an animated cursor via CSS `@keyframes blink`
- Input is capped at `target.length` — no over-typing allowed
- On completion, a 700ms delay fires before advancing (allows scene to settle visually)

### State

| State var | Purpose |
|---|---|
| `screen` | `"title" \| "playing" \| "levelWin" \| "gameWin"` |
| `lvl` | Current level index (0–2) |
| `promptIdx` | Current prompt within the level |
| `typed` | Current typed string |
| `completing` | Lock flag during the 700ms post-completion delay |

---

## Visual Design Decisions

- **No images or external assets** — all visuals are pure SVG with `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<path>`, `<line>`, and `<radialGradient>`
- **Dark backgrounds** per level — keeps scenes atmospheric and makes accent-colored correct characters pop
- **Accent color = correct character color** — intentional coupling so the scene and feedback share a visual identity
- **Progress bar** is 2px, accent-colored, sits between scene and typing area — subtle but satisfying
- **Staggered element entry** is the primary animation strategy (no tweening library)

---

## UX Decisions

- **No fail state** — errors are shown (red characters) but never penalized beyond the visual disruption
- **Click anywhere to focus** — the entire game div re-focuses the hidden input on click
- **autoCorrect / autoCapitalize / spellCheck all disabled** on the hidden input — critical for accurate capture
- **`whiteSpace: "pre"`** on character spans — preserves spaces in prompts correctly
- **Level win screen** separates levels with a beat rather than instant transition

---

## Planned Enhancements (Backlog)

These were discussed but not yet implemented:

- [ ] **More levels** — The Dry Well, The Frozen Pond, The Enchanted Library, The Moonlit Harbor
- [ ] **WPM + accuracy tracking** — end-of-level cozy summary card
- [ ] **Difficulty tiers** — short phrases (beginner) vs. longer passages (scribe)
- [ ] **Ambient audio** — Web Audio API procedural sound: rain, fire crackle, night crickets
- [ ] **Persistent progress** — `window.storage` API to save completed levels across sessions
- [ ] **Typing stats overlay** — optional live WPM counter (toggleable)
- [ ] **Animated transitions** between screens (fade in/out)

---

## Tone & Voice Reference

All copy (flavor text, level titles, win screens) should adhere to this register:
- Quiet, literary, slightly archaic
- Second person ("your words", "the scribe's work")
- Nature and warmth as primary metaphors
- No exclamation points in flavor text — let the scene carry the emotion

### Example flavor text style:
> *"Frost clings to every petal. Breathe life back into the garden."*
> *"The hearth is cold and every candle dark. Call the warmth home."*
> *"The stars have gone to sleep. Speak their names to wake them."*

---

## File Notes

- All code lives in a single React artifact — no external files
- This `CLAUDE.md` is the companion document for continuing development
- When adding levels, follow the `LEVELS` array schema and create a matching `XxxScene({ progress })` SVG component
