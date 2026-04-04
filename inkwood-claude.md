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
- A `winText` string — narrative text shown on the level-complete screen, advancing the story

### Story Arc

The game tells a four-act story about a scribe who discovers and restores an ancient nexus of spirit powers. The tone is mystical and slightly numinous without breaking the cozy atmosphere.

- **Act I: Awakening** (Levels 1–3) — The scribe discovers their power and begins to sense something deeper
- **Act II: Discovery** (Levels 4–6) — Ancient structures reveal a hidden network of spirit magic
- **Act III: The Nexus** (Levels 7–9) — The heart of the mystery — standing stones, spirit council, the Great Tree
- **Act IV: Restoration** (Level 10) — All locations connect into a unified, living world

Each level has a `winText` field — narrative text shown on the level-complete screen that advances the story.

### Current Levels

#### Level 1 — The Sleeping Garden
- **Scene:** `GardenScene` · **Accent:** `#6bbf6b` (green) · **BG:** `#080e08`
- **Prompts:** `["warm summer rain", "roots reach deep, leaves touch light"]`
- **Animation:** Sky brightens, sun rises, clouds appear, rain falls mid-progress and fades, flowers bloom staggered, grass greens

#### Level 2 — The Dark Cottage
- **Scene:** `CottageScene` · **Accent:** `#e89a30` (amber) · **BG:** `#0d0905`
- **Prompts:** `["little candle burn bright", "amber glow fills every room"]`
- **Animation:** Three candles light sequentially, window brightens, mug steam, cat silhouette fades in late

#### Level 3 — The Night Sky
- **Scene:** `StarScene` · **Accent:** `#9090f8` (indigo) · **BG:** `#03030e`
- **Prompts:** `["Orion Vega Sirius Lyra", "the sky blooms with ancient fire"]`
- **Animation:** Stars appear one-by-one, moon brightens and rises, constellation lines, treeline silhouette

#### Level 4 — The Dry Well
- **Scene:** `WellScene` · **Accent:** `#50b8b8` (teal) · **BG:** `#040a0a`
- **Prompts:** `["deep water remember your name", "rise and carry the old songs home"]`
- **Animation:** Water rises in the well, glowing runes appear on stones, rope/bucket lower, spirit fish swim, shimmer on water surface

#### Level 5 — The Forgotten Bridge
- **Scene:** `BridgeScene` · **Accent:** `#7aaa6a` (sage) · **BG:** `#060a06`
- **Prompts:** `["moss and stone recall the crossing", "where old paths meet spirits still walk"]`
- **Animation:** Bridge arch over misty chasm, moss fades as carvings glow, spirit lanterns appear, ghostly footprints at completion

#### Level 6 — The Whispering Library
- **Scene:** `LibraryScene` · **Accent:** `#c088b0` (mauve) · **BG:** `#0a0608`
- **Prompts:** `["open the pages let wisdom rise", "every old word finds its voice again"]`
- **Animation:** Underground chamber, books float upward and rotate, crystals grow and glow, spirit wisps drift, Chronicle tome glows at end

#### Level 7 — The Spirit Stones
- **Scene:** `StonesScene` · **Accent:** `#88a8c8` (silver-blue) · **BG:** `#050608`
- **Prompts:** `["stand tall again guardians of old", "the circle remembers what was promised"]`
- **Animation:** Standing stones rise from ground, runes glow on each, ley lines connect between stones, ground circle pattern, energy pulse at full

#### Level 8 — The Moonlit Sanctum
- **Scene:** `SanctumScene` · **Accent:** `#d0b870` (pale gold) · **BG:** `#08080a`
- **Prompts:** `["moonlight gathers where spirits convene", "the ancient ones return to their seats"]`
- **Animation:** Forest clearing, moon brightens, moonbeams descend, ground mandala appears, translucent spirit figures fade in

#### Level 9 — The Great Tree
- **Scene:** `TreeScene` · **Accent:** `#b8c8a8` (sage-silver) · **BG:** `#060806`
- **Prompts:** `["roots deeper than memory", "branches wider than sky", "nexus of all living things awaken"]`
- **Animation:** Roots grow outward with ley-line glow, trunk energy flow, branches extend, leaf canopy fills, spirit lights in crown, final radiance

#### Level 10 — The Waking World
- **Scene:** `WorldScene` · **Accent:** `#d8c890` (warm gold) · **BG:** `#060808`
- **Prompts:** `["the garden blooms the hearth burns bright", "every star remembers every spirit sings", "the ancient order is restored"]`
- **Animation:** Miniature nodes for all 9 previous locations with their accent colors, ley line connections draw between them, energy pulses flow along connections, final radiance

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
├── WellScene({ progress })
├── BridgeScene({ progress })
├── LibraryScene({ progress })
├── StonesScene({ progress })
├── SanctumScene({ progress })
├── TreeScene({ progress })
├── WorldScene({ progress })
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
| `lvl` | Current level index (0–9) |
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

- [x] **More levels** — Expanded to 10 levels across 4 acts with narrative arc
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
