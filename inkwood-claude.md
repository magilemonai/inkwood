# CLAUDE.md — Inkwood

## What Is Inkwood

A cozy, meditative typing game where the player is a forest scribe whose typed words bring a dormant world back to life. 10 levels across 4 acts. The thematic watchwords are **numinous** and **nourishing**.

The core loop: *type a phrase → watch the scene transform*. Each phrase is a command — an incantation the world obeys.

---

## How We Work

### Creative Process
This project is a close collaboration. **Do not build art without discussing the concept first.** The process is:

1. Read the level's prompts and think about subject matter
2. Propose a visual concept and animation blocking to the human
3. Discuss — the human may redirect, challenge, or refine
4. Build it
5. Screenshot it with `scripts/screenshot.mjs` — verify your own work before pushing
6. Push to feature branch, merge to main, deploy
7. The human tests on the live site and gives feedback
8. Iterate based on feedback — this often takes 3-5 rounds per scene

### The Human's Aesthetic Values
- **Organic complexity over geometric simplicity** — complex bezier paths with character, not primitives
- **Direct visual storytelling** — when you type "recall" and stones literally recall themselves, the game feels magical. This is the standard.
- **Honest feedback** — the human is direct and has high standards. "I'm not trying to be mean, I'm being real with the facts." Be equally honest. Don't call mediocre work good.
- **Details matter** — the human iterated on a cat silhouette 5 times until the proportions were right. Small things compound into the overall feeling.
- **Novel viewpoints** — don't default to "side view of a thing." The Well cross-section and Bridge assembly-from-nothing were breakthroughs specifically because they took unexpected perspectives.

### What the Human Has Praised
- The Well cross-section: "Whoa, I can see underground" — first genuine "wow"
- The Bridge stones assembling from nothing — "most dramatic moment"
- Stars scene constellation drawing and comets — "I love the connection of constellations"
- Stones scene prompt↔visual alignment — "excellent visual storytelling, best one so far"
- The Garden canopy fading in over branches — "really nice"
- The Cottage blue-to-amber color temperature shift

### What the Human Has Rejected (Learn From These)
- Geometric primitives for organic things (ellipses for canopies, rects for trunks)
- Branches radiating from a single point (palm tree effect)
- A cat with a tiny head (took 5 iterations — always use reference silhouettes)
- Symmetric steam curves (looked like parentheses)
- The hearth in the Cottage (didn't read as a fireplace — removed)
- Glowing rectangles for journals or books
- Bird silhouette too small to read
- Too-dark intro (fixed THREE times — scenes need 15-25% lightness minimum)
- The word "cheesy" was used for the original outro text — less text is more
- Water that's too bright/saturated (swimming pool effect — cave water should be dark)

---

## Stack

- **Vite + React 18 + TypeScript** — standalone web app
- **Zustand** — game state (store.ts)
- **Framer Motion** — screen transitions
- **CSS Modules** — scoped styles
- **Inline SVG** — all scene art (hand-crafted bezier paths)
- **GitHub Pages** — auto-deploy on push to main via `.github/workflows/deploy.yml`

## Project Structure

```
src/
├── App.tsx                    # Screen router with AnimatePresence
├── store.ts                   # Zustand state + localStorage save
├── levels.ts                  # All 10 level definitions (data)
├── types.ts                   # TypeScript interfaces
├── hooks/useCompletionTimer.ts
├── components/
│   ├── PlayingScreen.tsx      # Main gameplay (scene + typing overlay)
│   ├── SceneRenderer.tsx      # Static switch mapping scene keys to components
│   ├── IntroSequence.tsx      # Animated intro (dormant world → title)
│   ├── OutroSequence.tsx      # Animated outro (panoramic landscape)
│   ├── ActTransition.tsx      # Interstitial animations between acts
│   ├── LevelWinScreen.tsx     # Level completion screen
│   ├── ErrorBoundary.tsx      # Scene crash safety net
│   └── DevPanel.tsx           # F2 level-skip panel (all builds)
├── scenes/                    # One file per scene, each exports memo'd component
│   ├── GardenScene.tsx        # ✅ Rebuilt with hand-crafted paths
│   ├── CottageScene.tsx       # ✅ Rebuilt
│   ├── StarScene.tsx          # ✅ Polished
│   ├── WellScene.tsx          # ✅ Rebuilt (cross-section concept)
│   ├── BridgeScene.tsx        # ✅ Rebuilt (assembly-from-nothing concept)
│   ├── LibraryScene.tsx       # ❌ Needs rebuild
│   ├── StonesScene.tsx        # ⚠️ Acceptable, not rebuilt
│   ├── SanctumScene.tsx       # ⚠️ Acceptable, not rebuilt
│   ├── TreeScene.tsx          # ✅ Rebuilt (tree-as-world concept)
│   └── WorldScene.tsx         # ❌ Needs rebuild
├── svg/
│   ├── filters.tsx            # GlowFilter (only one still in use)
│   ├── primitives.tsx         # Flower, Star, Hill, etc. (mostly deprecated)
│   └── palettes.ts            # Color systems (unused, may remove)
└── styles/                    # CSS Modules per component
```

---

## Game Flow

```
intro → playing → [levelWin | actTransition] → playing → ... → outro
```

- **Intro:** Animated dormant-world vignettes → title → Begin
- **Playing:** Scene fills viewport, typing overlay at bottom
- **Level Win:** Brief narrative text, space/enter to continue
- **Act Transition:** 7-second animated interstitial (after levels 2, 5, 8)
- **Outro:** Panoramic landscape assembling → "The forest remembers."

---

## Scene Architecture

Every scene is `({ progress: number }) => SVG` wrapped in `React.memo`.

Progress is quantized to 0.01 increments before passing to scenes, so memo actually prevents re-renders on every keystroke.

### Key Patterns

- **`sub(p, start, duration)`** — clamp progress into a sub-range for staggered entry
- **Covering layers** — the "alive" state renders ON TOP of the "structure" with opacity tied to progress (canopy over branches, warm light over cold room, water over dry stone)
- **Assembly animations** — things BUILD themselves rather than fading in (Bridge stones, Well water rising)
- **Absence → presence** — scenes start from meaningful emptiness, not dim versions

### Art Standards (see SCENE_ART_GUIDE.md)

- Main elements are hand-crafted bezier `<path>` with 15-30+ control points
- Must pass the "black silhouette on white" test
- All content above y=170 (visible above typing overlay)
- `overflow="hidden" preserveAspectRatio="xMidYMid slice"` on all SVGs
- GlowFilter sparingly (1-2 per scene max for performance)
- No SVG primitives (rect, ellipse, circle) for organic things

---

## Narrative

### Prompts Are Incantations

Every typed phrase should feel like casting a spell — a **command** the world obeys. Not a description, not a fortune cookie. Direct imperatives.

**Good:** "stand tall again guardians of old" (command → stones rise)
**Bad:** "every old word finds its voice again" (passive, vague)

### Text Economy

- Flavor text: ONE sentence max
- Win text: 1-2 short sentences
- The words are precious and few. They are magical.

### Current Prompts and Alignment

| Level | Prompts | Alignment |
|---|---|---|
| Garden | "wake now, sleeping roots" / "bloom, every waiting flower" | Strong |
| Cottage | "little candle burn bright" / "fill every room with warmth" | Strong |
| Stars | "Orion Vega Sirius Lyra" / "burn again with ancient fire" | Strong |
| Well | "deep water remember your name" / "rise and carry the old songs home" | Excellent |
| Bridge | "stone, recall the crossing" / "spirits, walk the old paths" | Excellent |
| Library | "open, sleeping pages" / "speak again, forgotten words" | Good |
| Stones | "stand tall again guardians of old" / "remember what was promised" | Strong |
| Sanctum | "moonlight, gather where spirits convene" / "return to your seats, ancient ones" | Good |
| Tree | "roots deeper than memory" / "branches wider than sky" / "awaken, heart of all things" | Strong |
| World | "garden bloom, hearth burn bright" / "stars remember, spirits sing" / "the ancient order is restored" | Good |

---

## Six-Persona Critique Protocol

When evaluating the game's state, run critiques from these six perspectives. Each has a specific lens and set of concerns. The full current critique is in **PERSONAS.md**.

### 1. Code Reviewer
**Lens:** Correctness, performance, React patterns, SVG rendering efficiency.
**Cares about:** Bugs, memory leaks, unnecessary re-renders, timer cleanup, TypeScript strictness, SVG filter performance on low-end devices.

### 2. Narrative Director
**Lens:** Story arc, typed phrases, flavor text, mystical tone.
**Cares about:** Do prompts feel like incantations or fortune cookies? Rate each prompt 1-5 for "spell-casting power." Does the story escalate? Is text trimmed to the minimum? Does each prompt map to a specific visual change?

### 3. UX Researcher
**Lens:** Discoverability, flow state, friction points, accessibility.
**Cares about:** Can a new player figure out what to do? Is the typing area visible and inviting? Do transitions feel smooth? Mobile keyboard support? Is the emotional experience consistent across all levels?

### 4. Design Director
**Lens:** Visual quality, animation polish, does this dazzle?
**Cares about:** Grade each scene A-F. Does it pass the silhouette test? Are we using complex paths or primitive shapes? What specific technique would elevate each scene? Reference real games (Journey, Gris, Alto's Adventure). Identify the single most beautiful and ugliest moment per scene.

### 5. Product Lead
**Lens:** Prioritization, creative trade-offs, user delight as north star.
**Cares about:** What 5 changes would make someone screenshot and share? What's blocking a public release? Balance artistic ambition with deliverability. Keep alpha testers in mind.

### 6. Alpha Tester Panel
**Lens:** Four composite users (fast typist, non-gamer on phone, patient explorer, impatient user).
**Cares about:** Is this actually fun? Where did I get confused? Where did I get bored? Would I show this to a friend? Which level made me feel something?

### Running a Critique

1. Read the current state of relevant files (levels.ts, scenes, components)
2. Write honest assessments — don't be gentle. If something is mediocre, say so.
3. Grade scenes A-F, rate prompts 1-5
4. End with a prioritized action stack (top 10 items, ranked by impact/effort)
5. Save to PERSONAS.md

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Zustand over useState | Clean separation of game logic, derived helpers, persistence |
| Progress quantization (0.01) | Makes React.memo on scenes actually skip re-renders |
| `completingRef` guard in hook | Prevents strict-mode double-fire of completion timer |
| Framer Motion `AnimatePresence mode="wait"` | Smooth cross-fade between screens |
| `useState` lazy init for level snapshot | Prevents flash of next level during exit animation |
| `SceneRenderer` switch component | Avoids dynamic component creation during render (lint rule) |
| localStorage save/resume | Persists lvl + promptIdx, clears on game completion |
| 1.5s breathing pause between prompts | Fast typists see the animation they earned |
| Dev panel (F2) in all builds | Essential for testing during active development |

---

## Development Workflow

1. Make changes on `claude/add-story-levels-tEA7p` branch
2. Push to feature branch
3. Merge to `main` and push → triggers GitHub Pages auto-deploy (~30s)
4. Test on live URL: `https://magilemonai.github.io/inkwood/`
5. Use F2 to jump between scenes for testing

### Visual Self-Verification

Claude can verify its own SVG art using `scripts/screenshot.mjs`:

```bash
# Build first, then start preview server
npx vite build && npx vite preview --port 4173 &

# Screenshot a scene at a specific progress percentage
node scripts/screenshot.mjs 0          # Garden at 0%
node scripts/screenshot.mjs 3 50       # Well at 50%
node scripts/screenshot.mjs 8 95       # Tree at 95%
node scripts/screenshot.mjs all        # All scenes at 0%
```

Screenshots are saved to `./screenshots/` (gitignored). Claude can then read these images with the Read tool to see what the SVG actually looks like, enabling iterative art refinement without waiting for human screenshots.

**Always screenshot after art changes.** Don't commit blind — verify visually first.

### Before Public Release

- [ ] Gate dev panel behind URL param or remove
- [ ] Test on real mobile devices (iOS Safari, Android Chrome)
- [ ] Performance profile on budget Android phone
- [ ] Consider sound design (ambient loops, phrase-completion chime)

---

## Current State & What's Next

### Scene Quality Status (as of last update)

| Scene | Status | Grade | Notes |
|---|---|---|---|
| Garden | ✅ Rebuilt | B | Integrated trunk-limb path, canopy covering layer, hand-crafted terrain |
| Cottage | ✅ Rebuilt | B- | Blue→amber temperature shift, cat from reference, candle glow |
| Stars | ✅ Polished | B+ | Moon crescent fixed, tree-top moonlight, 6 comets, constellation drawing |
| Well | ✅ Rebuilt | A- | Cross-section concept, underground river, runes flowing downstream |
| Bridge | ✅ Rebuilt | B+ | Assembly-from-nothing, stones float into arch, spirit footprints |
| Library | ❌ Needs rebuild | D+ | Agent-generated, noisy texture filters, rectangles. Needs breakthrough concept |
| Stones | ⚠️ Acceptable | C+ | Original bezier stones decent, ground/sky flat |
| Sanctum | ⚠️ Acceptable | C+ | Spirit figures and moonbeams work, trees are primitive |
| Tree | ✅ Rebuilt | Needs validation | Tree-as-world concept, three-phase glow, accent gems. Just deployed. |
| World | ❌ Needs rebuild | D | Network diagram. Must become visual culmination |

### Priority Stack
1. **Validate Tree** — screenshot and iterate until it's genuinely the best scene
2. **Rebuild Library** — needs a breakthrough concept like Well's cross-section
3. **Rebuild World** — the finale must feel like culmination
4. **Sound design** — visual-only has hit diminishing returns. Audio is zero-to-one.
5. **Polish Stones & Sanctum** — decent but below rebuilt-scene standard
6. **Real device testing** — mobile is completely untested

### Known Issues
- Dev panel (F2) is accessible in production — gate before public release
- Bridge mist reads as grey blobs — cliffs need more prominence
- Some scenes still import unused filter/primitive modules from old agent code
- Mobile keyboard focus untested on real devices

---

## Reference Documents

- **SCENE_ART_GUIDE.md** — Art principles and rebuild checklist from scene iteration
- **PERSONAS.md** — Current six-persona critique with grades and priority stack
