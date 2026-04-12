# CLAUDE.md — Inkwood

> A cozy, meditative typing game where the player is a forest scribe whose typed words bring a dormant world back to life.

**Live site:** https://magilemonai.github.io/inkwood/
**Dev panel:** Append `?dev` to the URL, press F2 to jump between scenes.

---

## What Is Inkwood

A browser-based typing game with 10 levels across 4 acts. The player types short evocative phrases; each phrase is an **incantation** the world obeys. As you type, the scene transforms — roots glow, water rises, stones assemble, stars ignite.

Thematic watchwords: **numinous** and **nourishing**.

Core loop:
1. A scene appears in its dormant state (dark, empty, silent)
2. The player types a phrase — each character lights up as they type it
3. The scene responds visually in real time, driven by the typing progress
4. Phrase complete → 1.5s breathing pause → next phrase or next level

---

## Project Goals

1. **Make typing feel like casting spells.** Every prompt maps to a specific visible transformation. "Deep water remember your name" → water rises. "Stand tall again guardians of old" → stones rise.
2. **Visual consistency at a high bar.** Every scene should feel hand-crafted, not procedurally generated. Hand-drawn bezier paths, not primitive shapes.
3. **Meditative pacing.** No scores, no timers, no achievements. The 1.5s breathing pause after each phrase is sacred — fast typists must see the animation they earned.
4. **Mobile-first sensibility, desktop-optimal.** The game works on iPhone Safari and desktop browsers. Landscape aspect ratio preserved on portrait devices.
5. **Audio as atmosphere, not a stunt.** Synthesized ambient pads + nature textures layered in. No audio files — everything is Web Audio API synthesis.

---

## Current State (End of Session — v11)

### Scene Quality
All 10 scenes at **B+ or above** (6 scenes at A-). See `PERSONAS.md` for the full scene-by-scene breakdown.

| Scene | Grade | Defining Element |
|---|---|---|
| Garden | B+ | Canopy covering layer, bezier petal flowers, physics pollen |
| Cottage | A- | Cold blue → warm amber temperature shift, cat silhouette, rug, hanging herbs |
| Stars | A | **Gold standard.** Constellation drawing, moon crescent, comets at climax |
| Well | B+ | Cross-section showing underground, river with flow lines, runes flowing downstream |
| Bridge | A- | Stones assembling at cliff-tops, lanterns above, spirit footprints |
| Library | A- | Gothic cavern with sacred book pedestals, central tome opens, crystals, floating books |
| Stones | B+ | Standing stones rise, ley lines draw, ritual circle, heather/moss patches |
| Sanctum | A- | Varied tree canopies, moon beams, spirit figures, firefly particles |
| Tree | A- | Three-phase (roots/branches/canopy) glow, leaf sparks, diagonal roots beyond viewport |
| World | B+ | Panoramic landscape assembles with callbacks to all prior levels, ley lines connect |

### Technical Stack
- **Vite + React 19 + TypeScript** — standalone SPA
- **Zustand** — game state (`src/store.ts`)
- **Framer Motion** — screen transitions
- **CSS Modules** — scoped styles
- **Inline SVG** — all scene art (hand-crafted bezier paths)
- **Web Audio API** — all audio synthesis (no audio files)
- **GitHub Pages** — auto-deploy on push to `main` via `.github/workflows/deploy.yml`

### Narrative
**Average prompt rating: 4.8/5.** All 20 prompts have strong or excellent prompt↔visual alignment. See `inkwood-claude.md` or `PERSONAS.md` for the current prompt table.

### Audio Architecture (3 layers)
1. **Tonal pad** per act — layered detuned oscillators through low-pass filter + LFO modulation. Four acts with distinct root notes (C, E2, D, G) and character.
2. **Nature texture** per scene — synthesized noise through bandpass filter (wind, water, deep hum).
3. **Completion sweep** on phrase finish — brief filter opening, no chime.

Plus: intro drone (quiet C2/G2 builds from silence) and act-transition ambient (next act's pad plays during 7s transition).

Hard master volume cap: `0.15`. Mute toggle in header, persisted to localStorage.

### Mobile
- `100dvh` viewport everywhere (iOS Safari keyboard handling)
- Portrait detection via `@media (orientation: portrait)`
- Scene SVG constrained to `aspect-ratio: 8/5` on portrait so content doesn't over-crop
- `font-size: 16px` on input prevents iOS auto-zoom
- iOS keyboard accessory bar accepted as unavoidable (system-level, not removable in pure web)

### Save/Resume
localStorage key `inkwood-save` stores `{ lvl, promptIdx }`. Cleared on game completion. No UI indication — the meditative flow benefits from invisibility.

---

## Project Structure

```
/
├── CLAUDE.md                    # This file — the entry point
├── PERSONAS.md                  # Latest six-persona critique (regenerate via /critique)
├── SCENE_ART_GUIDE.md           # Art principles learned from scene rebuilds
├── inkwood-claude.md            # Earlier version of CLAUDE.md with process notes
├── .claude/
│   └── commands/
│       └── critique.md          # /critique slash command
├── .github/workflows/deploy.yml # GitHub Pages auto-deploy
├── scripts/screenshot.mjs       # Playwright screenshot tool
└── src/
    ├── App.tsx                  # Screen router with AnimatePresence
    ├── store.ts                 # Zustand game state + localStorage save
    ├── levels.ts                # All 10 level definitions
    ├── types.ts                 # TypeScript interfaces
    ├── audio.ts                 # Web Audio API synthesis module
    ├── hooks/
    │   ├── useCompletionTimer.ts
    │   └── useParticles.tsx     # Physics particle system hook
    ├── components/
    │   ├── PlayingScreen.tsx    # Main gameplay (scene + typing overlay)
    │   ├── SceneRenderer.tsx    # Switch mapping scene keys to components
    │   ├── IntroSequence.tsx    # Animated intro (dormant world → title)
    │   ├── OutroSequence.tsx    # Panoramic outro that loops indefinitely
    │   ├── ActTransition.tsx    # 7-second interstitial animations
    │   ├── LevelWinScreen.tsx   # Between-level transition
    │   ├── DevPanel.tsx         # F2 level-skip panel (gated behind ?dev)
    │   ├── ErrorBoundary.tsx    # Scene crash safety net
    │   └── ParticleField.tsx    # SVG particle renderer
    ├── scenes/                  # One file per scene (all memo'd)
    │   ├── util.ts              # Shared sub() helper
    │   └── *Scene.tsx           # 10 scene files
    ├── svg/
    │   ├── filters.tsx          # GlowFilter, MistFilter (SVG filter defs)
    │   ├── primitives.tsx       # Only Star is still used (other exports dead)
    │   └── palettes.ts          # Unused — can be deleted
    └── styles/                  # CSS Modules per component
```

---

## How We Work (Creative Process)

This project is a close collaboration. **Do not build art without discussing the concept first.**

1. Read the level's prompts
2. Propose a visual concept and animation blocking
3. Discuss — the human may redirect, challenge, or refine
4. Build it
5. Screenshot with `scripts/screenshot.mjs` — verify visually before pushing
6. Push to feature branch, merge to `main`, GitHub Pages deploys (~30s)
7. The human tests on the live site and gives feedback
8. Iterate — often 3-5 rounds per scene

### The Human's Aesthetic Values
- **Organic complexity over geometric simplicity** — complex bezier paths with character, not primitives
- **Direct visual storytelling** — when you type "recall" and stones literally recall themselves, the game feels magical. This is the standard.
- **Honest feedback** — the human is direct and has high standards. Match their honesty. Don't call mediocre work good.
- **Details matter** — the human iterated on a cat silhouette 5 times. Small things compound.
- **Novel viewpoints** — Don't default to "side view of a thing." The Well cross-section and Bridge assembly-from-nothing were breakthroughs.

### What the Human Has Praised
- Well cross-section — "Whoa, I can see underground" (first genuine "wow")
- Bridge stones assembling — "most dramatic moment"
- Stars constellation drawing and comets
- Stones prompt↔visual alignment — "excellent visual storytelling"
- Garden canopy fading in over branches
- Cottage blue-to-amber temperature shift
- Outro panoramic summary — "a great summary, honestly"

### What the Human Has Rejected (Learn From These)
- Geometric primitives for organic things (rect/ellipse for trunks, canopies)
- Branches radiating from a single point (palm tree effect)
- A cat with a tiny head (5 iterations — always use reference silhouettes)
- Symmetric steam curves (looked like parentheses)
- Glowing rectangles for journals or books
- Bird silhouette too small to read
- Too-dark intro (fixed THREE times — scenes need 15-25% lightness minimum)
- The word "cheesy" in original outro text — less text is more
- Water that's too bright/saturated (swimming pool effect)
- Doorbell-like completion chime — replaced with filter sweep
- Audio loud enough to hurt ears — hard-capped at MASTER_VOLUME = 0.15
- Outro replay bug — now loops indefinitely until restart

---

## Development Workflow

### Branch Strategy
Work on feature branches like `claude/review-and-plan-wuN8F`. Merge to `main` when ready. Don't push directly to `main` unless it's a hotfix.

### Commands
```bash
npm run dev        # Vite dev server at :5173
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript check only
```

### Visual Self-Verification
Screenshot a scene at a specific progress percentage:

```bash
# Build first, then start preview server
npx vite build && npx vite preview --port 4173 &

# Screenshot usage
node scripts/screenshot.mjs 0          # Garden at 0%
node scripts/screenshot.mjs 3 50       # Well at 50%
node scripts/screenshot.mjs 8 95       # Tree at 95%
node scripts/screenshot.mjs all        # All scenes at 0%
```

Screenshots are saved to `./screenshots/` (gitignored). Use the Read tool to view them — enables iterative art refinement without waiting for human feedback.

**Always screenshot after art changes.** Don't commit blind.

### Deploy
Push to `main` → `.github/workflows/deploy.yml` builds and deploys to GitHub Pages in ~30s. No manual step required.

---

## Slash Commands

### `/critique`
Runs the full six-persona critique protocol. See `.claude/commands/critique.md`.

What it does:
1. Screenshots all 10 scenes at 0%, 20%, 40%, 50%, 60%, 80%, and 99% progress (70 shots)
2. Screenshots the intro at 0s, 3s, 6s, 9s, 12s, 15s (6 shots)
3. Screenshots the outro at 0s, 4s, 8s, 12s, 16s, 20s (6 shots)
4. Visually reviews each screenshot
5. Writes a honest critique from 6 perspectives (Code Reviewer, Narrative Director, UX Researcher, Design Director, Product Lead, Alpha Tester Panel)
6. Produces a prioritized action stack of 10-15 items
7. **Presents a per-persona summary + full priority list to the user**
8. Saves everything to `PERSONAS.md`

Run this after significant changes to assess quality.

---

## Reference Documents

- **`CLAUDE.md`** (this file) — Entry point for future sessions
- **`PERSONAS.md`** — Latest critique with scene grades, prompt ratings, priority stack. Regenerated by `/critique`.
- **`SCENE_ART_GUIDE.md`** — Art principles distilled from scene rebuilds (covering layers, assembly animations, bezier complexity rules, element-specific lessons for trees/cats/water/stone/etc.)
- **`inkwood-claude.md`** — Earlier CLAUDE.md with additional process history

---

## Session History (What Was Done)

This file documents a multi-session collaboration that took the game from inconsistent quality to launch-ready.

### Major Milestones
1. **Scene rebuilds** — WorldScene (network diagram → panoramic landscape), BridgeScene (cliffs + assembly), LibraryScene (hybrid cavern + hero tome opening). Earlier sessions rebuilt Garden, Cottage, Stars, Well, TreeScene.
2. **Audio system** — Built from zero. Three-layer synthesis, per-act and per-scene variation, completion sweep, intro drone, act-transition bridging. Hard volume cap for safety.
3. **Alpha feedback integration** — 13 feedback items fixed including audio safety (dropped volume 5x), outro replay bug, text box occlusion, bridge composition, cat opacity, mushroom trees, Great Tree roots, World well placement.
4. **Mobile responsive** — Portrait layout with landscape-ratio scene container, compact typing area, `100dvh`, iOS quirks handled.
5. **Particle system** — `useParticles` hook with physics (drift, fade, respawn), integrated into Garden (pollen), Library (dust), Sanctum (fireflies), Bridge (mist), Tree (leaf sparks).
6. **Polish pass** — Library tome enlarged, cavern walls textured, Garden flowers replaced with bezier petals, Great Tree canopy opacity boosted, audio acts made more distinct (E2 root for Act II, shimmery 9th for Act III), nature texture layer added, shared `sub()` utility extracted, scene transition colors match level bg.
7. **Infrastructure** — Dev panel gated behind `?dev` URL param, legacy inkwood.tsx deleted, screenshot tool updated, `/critique` slash command created with intro/outro capture.

### Total Improvements
- All scenes rebuilt or polished to B+/A-
- 20+ commits across this session's branch
- `src/audio.ts` grown from zero to 380+ lines
- `useParticles` hook + 5 scene integrations
- 82-screenshot automated critique protocol
- Mobile viewport properly handled on iOS Safari

---

## Known Issues / Next Steps

See `PERSONAS.md` for the latest priority stack. Top items:

1. **Delete dead code** — `TitleScreen.tsx`, `GameWinScreen.tsx`, unused `svg/primitives.tsx` exports, `svg/palettes.ts`, `scenes/index.ts`. ~500+ lines of unused code.
2. **Trailer / landing page** — 30-second screen recording of Bridge + Stars + Tree for shareability.
3. **Well water drama** — 0-40% transition lacks visual punch (feels like filling a bathtub).
4. **Intro dormant trees** — bare stick silhouettes could have more organic character.
5. **Library tome glow at 99%** — could radiate more light.

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Zustand over useState | Clean separation of game logic, derived helpers, persistence |
| Progress quantization (0.01) | Makes React.memo on scenes actually skip re-renders |
| `completingRef` guard in hook | Prevents strict-mode double-fire of completion timer |
| Framer Motion `AnimatePresence mode="wait"` | Smooth cross-fade between screens |
| `useSyncExternalStore` for particles | Avoids setState-in-effect; external store pattern for rAF loop |
| localStorage save/resume | Persists lvl + promptIdx, clears on game completion |
| 1.5s breathing pause between prompts | Fast typists see the animation they earned |
| Dev panel behind `?dev` URL param | Accessible for testing, invisible for players |
| Web Audio synthesis only | Zero audio file dependencies, fully portable |
| Hard MASTER_VOLUME cap at 0.15 | Prevents the alpha test "it hurt my ears" incident from recurring |
| Portrait scene aspect-ratio 8/5 | Prevents SVG `slice` from over-cropping on mobile |
