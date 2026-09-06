# CLAUDE.md — Inkwood

> A cozy, meditative typing game where the player is a forest scribe whose typed words bring a dormant world back to life.

**Live site:** https://inkwood.codywymore.com/
**Status:** **Two editions, both first-class** (director's ruling 2026-09-06): the title screen offers "Begin Inkwood Classic" (April 2026) and "Begin Inkwood 2" (September 2026: redrawn scenes, rewritten story, light layer, typing feel, tween), and a pinned Classic | Inkwood 2 toggle sits top-right on every screen, switching at any point while keeping the player's level and phrase. Default with no choice made: Inkwood 2. `?classic` / `?v2` deep-link an edition. v1.5 archived (tag `v1.5`). Music/ink/seasons still gated off awaiting verdicts (Session History #18).
**Dev panel:** Append `?dev` to the URL, press F2 to jump between scenes (panel also has toggles for the five prototype gates).

> **AI sessions: read `HANDOFF-OPUS.md` in the repo root FIRST.** It carries the current handoff (state of the world, decision rights, hazards); `ROADMAP.md` beside it carries the long game and learned wisdom. Both are local-only and deliberately unpublished (Cody's ruling 2026-07-15 — do not commit them). If they are missing, you are in a fresh clone without the local steering files: stop and ask Cody before proceeding.

---

## What Is Inkwood

A browser-based typing game with 10 levels across 4 acts. The player types short evocative phrases; each phrase is an **incantation** the world obeys. As you type, the scene transforms — roots glow, water rises, stones assemble, stars ignite.

Thematic watchwords: **numinous** and **nourishing**.

Core loop:
1. A scene appears in its dormant state (dark, empty, silent)
2. The player types a phrase — each character lights up as they type it
3. The scene responds visually in real time, driven by the typing progress
4. Phrase complete → 1.5s breathing pause → next phrase or next level

### Game Flow

```
intro → playing → [levelWin | actTransition] → playing → ... → outro → (loops until restart)
```

- **Intro:** Title + Begin appear immediately on a soft black background. The three dormant-world vignettes (garden → cottage → sky) crossfade behind the title on a 24-second loop until the player taps Begin. A drifting amber firefly mote and a faint dawn-glow horizon hint at the warmth coming. (Earlier versions ran a 14s linear sequence + spark transition; that's been retired.)
- **Playing:** Scene fills viewport, typing overlay at bottom
- **Level Win:** Brief narrative text, space/enter to continue (within an act)
- **Act Transition:** 7-second animated interstitial (after levels 2, 5, 8) with next act's audio
- **Outro:** Panoramic landscape assembling → "The forest remembers." → loops indefinitely

---

## Project Goals

1. **Make typing feel like casting spells.** Every prompt maps to a specific visible transformation. "Deep water remember your name" → water rises. "Stand tall again guardians of old" → stones rise.
2. **Visual consistency at a high bar.** Every scene should feel hand-crafted, not procedurally generated. Hand-drawn bezier paths, not primitive shapes.
3. **Meditative pacing.** No scores, no timers, no achievements. The 1.5s breathing pause after each phrase is sacred — fast typists must see the animation they earned.
4. **Mobile-first sensibility, desktop-optimal.** The game works on iPhone Safari and desktop browsers. Landscape aspect ratio preserved on portrait devices.
5. **Audio as atmosphere, not a stunt.** Synthesized ambient pads + nature textures layered in. No audio files — everything is Web Audio API synthesis.

---

## Current State (v1.0 — shipped)

### Scene Quality
**Post-v15 grades.** Library, Tree, Sanctum, Cottage, and Stones each got a polish pass after v15 (see Session History #17). World is unchanged from v14 (the v15 rebalance attempt was reverted per director feedback). See `PERSONAS.md` for the full scene-by-scene breakdown.

| Scene | Grade | Defining Element |
|---|---|---|
| Garden | A- | Bezier petal flowers with sway animation, canopy covering layer, physics pollen, tapered dormant trunk |
| Cottage | A | Cold blue → warm amber shift, cat silhouette (loaf pose, peeking eye), candle floor pools at ~0.10–0.14 opacity |
| Stars | A | **Gold standard.** Constellation drawing, moon crescent, comets at climax |
| Well | A | Cross-section reveal at ~30%, river with flow lines, runes flowing downstream |
| Bridge | A- | Stones assembling at cliff-tops, lanterns above, spirit footprints |
| Library | A | Phrase-2 escalation: voice rays from open tome, crystal pulse, warm gold pages, expanding tome glow |
| Stones | A- | Standing stones with hand-carved runes (turbulence/displacement filter), ley lines, ritual circle |
| Sanctum | A- | Translucent teardrop spirits (+30% size from v14, slow opacity pulse via SMIL), moon beams, fireflies |
| Tree | A- | Widened trunk + bark, canopy reaches sky via three spire puffs + upward bleed, three-phase glow |
| World | B+ | Panoramic landscape assembles with callbacks to all prior levels, 21-connection ley network |

### Technical Stack
- **Vite + React 19 + TypeScript** — standalone SPA
- **Zustand** — game state (`src/store.ts`)
- **Framer Motion** — screen transitions
- **CSS Modules** — scoped styles
- **Inline SVG** — all scene art (hand-crafted bezier paths)
- **Web Audio API** — all audio synthesis (no audio files)
- **Vitest** — unit tests for the pure logic modules (`npm test`)
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
├── NEXT.md                      # (local, untracked) dashboard steering — auto-synced by /critique Step 6
├── LOOPS.md                     # (local, untracked) scouted self-improvement loops + status
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
    ├── audio.ts                 # Web Audio API synthesis module (pads, textures, melody voices)
    ├── analytics.ts             # GoatCounter wrapper: per-screen pageviews + prototype-gate events
    ├── melody.ts                # Music of Typing: pure per-phrase melody planner (composer-tunable)
    ├── music.ts                 # Music of Typing: controller + prototype gate (?music)
    ├── ink.ts                   # Ink system: gate (?ink), INK_FOCUS landing map, mote bus
    ├── seasons.ts               # Living Seasons: gate (?seasons / ?season=x), particle specs
    ├── glow.ts                  # The Glow: gate (?glow) for the three.js light layer
    ├── feel.ts                  # The Feel: gate (?feel) for typing-feel CSS (ignite, ink cursor, word settle, exhale)
    ├── __tests__/               # Vitest unit tests (melody, ink, seasons, store, util)
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
    │   ├── DevPanel.tsx         # F2 level-skip panel (gated behind ?dev) + prototype toggles
    │   ├── ErrorBoundary.tsx    # Scene crash safety net
    │   ├── InkOverlay.tsx       # Ink motes: canvas overlay, glyph → scene focus point
    │   ├── SeasonalLayer.tsx    # Seasonal weather overlay (viewBox-aligned SVG)
    │   ├── GlowLayer.tsx        # Mounts the lazy three.js chunk when ?glow is on and the scene has a manifest
    │   ├── GlowCanvas.tsx       # Screen-blended WebGL quad: light falloff + flicker, haze, dust, grain, exhale
    │   └── ParticleField.tsx    # SVG particle renderer
    ├── scenes/                  # One file per scene (all memo'd)
    │   ├── util.ts              # Shared sub() helper
    │   ├── manifest.ts          # Per-scene light manifests for the Glow (viewBox coords, director-tunable)
    │   └── *Scene.tsx           # 10 scene files
    ├── contexts/
    │   └── InputContext.tsx     # Singleton typing input shared across screens
    ├── share.ts                 # navigator.share + clipboard fallback
    ├── svg/
    │   ├── filters.tsx          # GlowFilter, MistFilter (SVG filter defs)
    │   └── primitives.tsx       # Only Star is exported (used by StarScene)
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
- World ley-line graph as 6 radial spokes (v15 attempt) — director prefers the 21-connection complete graph for its woven "interconnected" reading
- Intro dormant trees as filled-branch silhouettes (v15 attempt) — director prefers the original stroked branches with delicate twigs
- Bordered CTAs replaced with text + underline (v15 attempt) — the bordered box is doing real work as a mobile tap affordance; restored. **Default to keeping bordered buttons unless explicitly directed otherwise.**

---

## Development Workflow

### Branch Strategy
Work on feature branches like `claude/review-and-plan-wuN8F`. When a unit of work is complete (build + lint clean), fast-forward merge the feature branch into `main` and push `main` so GitHub Pages auto-deploys.

**Push-to-main workflow (authorized by the director for this project):**

```bash
# 1. Commit on the feature branch
git commit -m "..."
# 2. Push the feature branch
git push -u origin <feature-branch>
# 3. Fast-forward main and push
git checkout main
git merge --ff-only <feature-branch>
git push origin main
# 4. Return to the feature branch and continue
git checkout <feature-branch>
```

Rules:
- Only fast-forward merges — never create merge commits on `main`.
- If `main` has diverged from the feature branch, stop and ask before anything force-ish.
- Never force-push `main`.
- Only do this after `npm run build` + `npm run lint` pass clean.

### Commands
```bash
npm run dev        # Vite dev server at :5173
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npm test           # Vitest unit tests (pure logic: melody, ink, seasons, store, util)
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
9. Syncs the top of the priority stack into `NEXT.md` (the dashboard steering file) — merges with manual bullets rather than clobbering them, caps at 6 bullets, never re-adds director-rejected items, stamps provenance

Run this after significant changes to assess quality. Step 9 is the critique→steering loop: QA output becomes next-session steering automatically.

---

## Scene Architecture

Every scene is `({ progress: number }) => SVG` wrapped in `React.memo`. Progress is quantized to 0.01 increments before passing to scenes, so memo actually prevents re-renders on every keystroke.

### Key Patterns
- **`sub(p, start, duration)`** — clamp progress into a sub-range for staggered entry. Imported from `scenes/util.ts`.
- **Covering layers** — the "alive" state renders ON TOP of the "structure" with opacity tied to progress (canopy over branches, warm light over cold room, water over dry stone)
- **Assembly animations** — things BUILD themselves rather than fading in (Bridge stones, Well water rising)
- **Absence → presence** — scenes start from meaningful emptiness, not dim versions

### Art Standards (see `SCENE_ART_GUIDE.md` for full detail)
- Main elements are hand-crafted bezier `<path>` with 15-30+ control points
- Must pass the "black silhouette on white" test
- All content above y=170 (visible above typing overlay)
- `overflow="hidden" preserveAspectRatio="xMidYMid slice"` on all SVGs
- `GlowFilter` sparingly (1-2 per scene max for performance)
- No SVG primitives (`rect`, `ellipse`, `circle`) for organic things

---

## Narrative Philosophy

### Prompts Are Incantations
Every typed phrase should feel like casting a spell — a **command** the world obeys. Not a description, not a fortune cookie. Direct imperatives.

- **Good:** "stand tall again guardians of old" (command → stones rise)
- **Bad:** "every old word finds its voice again" (passive, vague)

### Text Economy
- Flavor text: ONE sentence max
- Win text: 1-2 short sentences
- The words are precious and few. They are magical.

See `src/levels.ts` for the full prompt table. Current average rating: 4.8/5.

---

## Six-Persona Critique Protocol (reference)

The `/critique` slash command runs this protocol. Each persona has a specific lens:

### 1. Code Reviewer
Correctness, performance, React patterns, SVG rendering efficiency. Cares about: bugs, memory leaks, unnecessary re-renders, timer cleanup, TypeScript strictness, SVG filter performance on low-end devices.

### 2. Narrative Director
Story arc, typed phrases, flavor text, mystical tone. Cares about: do prompts feel like incantations or fortune cookies? Rate each prompt 1-5 for "spell-casting power." Does the story escalate? Is text trimmed? Does each prompt map to a specific visual change?

### 3. UX Researcher
Discoverability, flow state, friction points, accessibility. Cares about: can a new player figure out what to do? Is the typing area visible and inviting? Do transitions feel smooth? Mobile keyboard support? Is the emotional experience consistent?

### 4. Design Director
Visual quality, animation polish, does this dazzle? Grade each scene A-F. Does it pass the silhouette test? Complex paths or primitive shapes? What specific technique would elevate each scene? References: Journey, Gris, Alto's Adventure. Identify the single most beautiful and ugliest moment per scene.

### 5. Product Lead
Prioritization, creative trade-offs, user delight as north star. Cares about: what 5 changes would make someone screenshot and share? What's blocking public release? Balance artistic ambition with deliverability.

### 6. Alpha Tester Panel
Four composite users:
- **Cal** (patient explorer): savors every scene, notices details
- **Alex** (fast typist): blazes through, notices pacing issues
- **Dana** (impatient): will quit if something feels broken or boring
- **Sam** (non-gamer on phone): tests mobile, confused by novel interactions

Cares about: is this actually fun? Where did I get confused? Where did I get bored? Would I show this to a friend? Which level made me feel something?

### Running a Critique
Just run `/critique`. The skill handles screenshots, visual review, writing, saving to `PERSONAS.md`, and syncing the top of the priority stack into `NEXT.md` (Step 6 of the command). Present a per-persona summary + full priority stack to the user before saving.

---

## Reference Documents

- **`CLAUDE.md`** (this file) — Entry point for future sessions. Contains everything needed to orient.
- **`PERSONAS.md`** — Latest critique with scene grades, prompt ratings, priority stack. Regenerated by `/critique`.
- **`SCENE_ART_GUIDE.md`** — Art principles distilled from scene rebuilds (covering layers, assembly animations, bezier complexity rules, element-specific lessons for trees/cats/water/stone/etc.)
- **`NEXT.md`** (local, untracked) — 1–6 bullet steering file read by the director's dashboard. Auto-synced from the PERSONAS.md priority stack by `/critique` Step 6; safe to edit by hand between critiques. Keep it current when priorities shift mid-session.
- **`LOOPS.md`** (local, untracked) — Scouted recursive self-improvement loops with their first steps. critique→steering is implemented; funnel→priorities, gate telemetry, and screenshot regression are still open.

---

## Session History (What Was Done)

This file documents a multi-session collaboration that took the game from inconsistent quality to launch-ready.

### Major Milestones
1. **Scene rebuilds** — WorldScene (network diagram → panoramic landscape), BridgeScene (cliffs + assembly), LibraryScene (hybrid cavern + hero tome opening). Earlier sessions rebuilt Garden, Cottage, Stars, Well, TreeScene.
2. **Audio system** — Built from zero. Three-layer synthesis, per-act and per-scene variation, completion sweep, intro drone, act-transition bridging. Hard `MASTER_VOLUME` cap, plus a user-adjustable `userVolume` scalar exposed as a header slider.
3. **Alpha feedback integration** — 13 feedback items fixed including audio safety (dropped volume 5x), outro replay bug, text box occlusion, bridge composition, cat opacity, mushroom trees, Great Tree roots, World well placement.
4. **Mobile responsive** — Portrait layout with landscape-ratio scene container, compact typing area, `100dvh`, iOS quirks handled.
5. **Particle system** — `useParticles` hook with physics (drift, fade, respawn), integrated into Garden (pollen), Library (dust), Sanctum (fireflies), Bridge (mist), Tree (leaf sparks).
6. **Polish pass** — Library tome enlarged, cavern walls textured, Garden flowers replaced with bezier petals, Great Tree canopy opacity boosted, audio acts made more distinct (E2 root for Act II, shimmery 9th for Act III), nature texture layer added, shared `sub()` utility extracted, scene transition colors match level bg.
7. **Infrastructure** — Dev panel gated behind `?dev` URL param, legacy inkwood.tsx deleted, screenshot tool updated, `/critique` slash command created with intro/outro capture.
8. **Outro redesign** — Top-center dot row, dots fade in as their scene appears in the panorama, disconnected canopy stubs removed. Final card is "The forest remembers." + Begin Again + Wander + Share. Loops indefinitely until restart.
9. **iOS keyboard fix** — Singleton input lifted to App root via `InputContext`, gesture-driven `focusInput()` on every screen-transition button (Begin, Continue, level cards). Survives the React tree swap so iOS keyboard stays up across interstitials.
10. **Mobile portrait layout** — Letterboxed scenes at natural 8:5 ratio (matches viewBox so nothing crops), title and outro text blocks below. Prompt font auto-scales by `--char-count` so the longest canonical phrase fits one line.
11. **Brand pass** — Ogham-style rune logo replaces the stick-tree, applied to title screen and favicon. OG image regenerated as Stars climax + wordmark + tagline. Em-dash audit on all card text.
12. **Player UX** — Skip-intro for returning players (`hasCompleted` short-circuits the dormant-world animation); daily-seeded prompt rotation so replays vary by calendar day; in-app `Share` button via `navigator.share` + clipboard fallback.
13. **Scene polish (v14)** — Tree trunk widened with bark detail and overlapping canopy puffs; Sanctum / World / Outro spirit figures rebuilt as translucent teardrops with radial-gradient pearls and halos; Garden flowers now sway via `<animateTransform>`. Cat ear occlusion fixed; Well water no longer surfaces through ground.
14. **Audio safety** — `armTerminationSilence()` silences master gain on `pagehide` and `visibilitychange` to kill the loud sine burst on mobile tab-close. Mute slider compacted to icon-only on mobile.
15. **Long-prompt typography** — `--char-count` CSS clamp + `.wordRun` / `.spaceRun` flex containers so long phrases never wrap mid-typing.
16. **v1.0 launch (2026-04-26)** — Custom domain `inkwood.codywymore.com` (CNAME in `public/`, base path `/`). PWA kept enabled (offline play, installable). GoatCounter analytics wired with per-screen pageviews via `src/analytics.ts` (paths: `/intro`, `/play/{scene}`, `/win/{scene}`, `/transition/{scene}`, `/outro`, `/wander`). Tagged `v1.0` in git.
17. **v15 critique + first post-launch polish pass (2026-04-26 → 2026-04-29)** — Nine of eleven v15 priority items shipped, two reverted per director feedback, plus an intro behavior change.
    - **Shipped:** skip-caption race fixed (intro #10); Library phrase-2 escalation with voice rays + crystal pulse + warm gold pages + bigger tome glow (#1, #8); Tree canopy spire puffs + upward bleed (#4); Sanctum spirits scaled +30% with staggered slow opacity pulse via SMIL `<animate>` (#5); Cottage candle floor pools bumped from 0.04 to ~0.10–0.14 with bright cores (#9); Stones runes gain a `feTurbulence` + `feDisplacementMap` filter chain for hand-carved displacement (#11); Garden dormant-trunk path tapered from a wider base (#6); Title-screen warmth accent — drifting amber firefly mote + dawn glow at the horizon, always on under the title (#3).
    - **Reverted per director feedback:** World finale 6-spoke rebalance (kept the original 21-connection complete graph); intro dormant-tree filled-branch redesign (kept the original stroked branches with thin twigs).
    - **Intro behavior change (post-v15):** Title now appears immediately on load. The three dormant vignettes loop continuously behind it on a 24-second cycle (`time % CYCLE_LEN`, three phases at 9s with 1.2s crossfades, sampled at ±cycle for clean wrap-around). Spark transition retired. Skip-hint and click-to-skip handler removed.
    - **CTA styling experiment** — Tried a text + always-visible underline pattern for Begin / Begin Again / Replay any level. Director preferred the original bordered buttons; reverted. Lesson: the box border is doing real work as a tap affordance on mobile, and the "form button" feeling didn't bother the director the way it bothered me in screenshots.

18. **Elevation project kickoff (2026-07-02)** — Director-approved five-pillar plan: (1) archive + funnel, (2) Music of Typing, (3) the Ink, (4) Scribe's Memory + planting finale + keepsake, (5) Living Seasons. Session output:
    - **v1.5 archived, triple-redundant**: annotated tag `v1.5` @ e858c95, branch `archive/v1-classic`, GitHub release with playable build zip. Non-negotiable safety net before any bold moves.
    - **Music of Typing prototype** (`?music`): every keystroke plays a note; each phrase has a fixed, deterministic melody in the act's harmonic world. Per-act just-intonation pentatonics rooted on the pad tonics (C4/E3/D4/G3). Skeleton = one target tone per word in an arch (climax ~70% through, final word lands the tonic); letters walk stepwise toward each word's target. Word ends bloom a low tonic (dominant at the climax word), wrong keys thud softly, completion swells a tonic chord through the 1.5s breath. Tuning knobs in `ACT_SCALES` (melody.ts); flip `DEFAULT_ENABLED` in music.ts to ship for everyone.
    - **Ink system prototype** (`?ink`): each accepted keystroke lifts a glowing mote off its glyph in the prompt box and arcs it into the scene, landing with a ripple at that phrase's focus point (`INK_FOCUS` in ink.ts, director-tunable viewBox coords). The letters-as-origin design was chosen specifically for mobile: no cursor concept needed, and the portrait crossing from prompt box to letterboxed scene is the shortest, cleanest flight. Word-end motes are brighter, synced with the music bloom. Reduced-motion pulses at the landing point instead of traveling.
    - **Living Seasons prototype** (`?seasons`, or `?season=winter` etc. to force one): quiet weather over outdoor scenes keyed to the real calendar — spring pollen rising, summer fireflies, autumn leaf-fall, winter snow-hush. Interiors (cottage, library) take no weather; the well only weathers above ground. Deliberately sparse (max 26 particles, opacity ≤ 0.6).
    - **All three gates default OFF** — the live game is byte-identical to v1.5 for players until the director approves each and its `DEFAULT_ENABLED` flips.
    - **GoatCounter funnel pull blocked**: dashboard is private; needs an API token or public toggle from the director.
    - **Critique→steering loop implemented (same day)**: `/critique` gained Step 6, which syncs the top of the fresh priority stack into `NEXT.md` (the dashboard steering file). Merge rules: keep live manual bullets, drop shipped/obsolete ones, compress top 3–5 stack items into one-line bullets, cap at 6, never re-add director-rejected items, stamp provenance. NEXT.md was synced once by hand against v15 to seed the loop; it closes fully on the next `/critique` run.
    - **Gate telemetry implemented (same day)**: `trackGateActive()` in `analytics.ts` fires one GoatCounter event per prototype gate per session (`gate/music`, `gate/ink`, `gate/seasons`) whenever a gate is active — at page load (URL param or persisted localStorage) and on dev-panel toggle-on. Events are `event: true` so the pageview funnel stays clean; the seasons event title records which season was seen and whether it was forced (`?season=x`). Once the GoatCounter token arrives, gate-session counts back each `DEFAULT_ENABLED` verdict with real usage data. Verified headless with a stubbed GoatCounter across URL, dev-panel, and control paths.
    - Not built, pending discussion: World finale ink convergence (touches the defended 21-connection ley graph — options first), Scribe's Memory text beats, planting finale + printable keepsake.

19. **Inkwood 2 plan + Cottage test slice (2026-09-05)** — Director asked for a plan to dramatically upgrade the whole game (visuals, typing feel, animation, story, three.js) using subagents, then asked to see a test page in the recommended style before approving. Plan lives in local `PLAN-INKWOOD-2.md` (gitignored with the other steering docs). Thesis: add light, air, texture, depth, and idle life on top of the hand-drawn SVG; redraw only silhouette-test failures; make every keystroke a visible act; give the story a speaker. Recommended three.js path is an atmosphere layer → depth stage → Stars-only 3D spike, not a full 3D rebuild. Test slice shipped on The Dark Cottage behind two new default-off gates (same template as the trio):
    - **The Glow** (`?glow`, `src/glow.ts`): a lazy-loaded three.js chunk (~130 KB gz, excluded from the PWA precache so classic players never fetch it) renders a screen-blended WebGL quad over the SVG. One fragment shader: light falloff from manifest-declared sources with noise flicker, a drifting fbm haze band, CPU-positioned dust motes bright only where the light is, a 420ms global bloom on phrase completion, and brightening film grain in the dark. `src/scenes/manifest.ts` holds per-scene lights/haze/motes as functions of progress in viewBox coords (only Cottage so far). DPR capped 1.5, paused when hidden, FPS probe after warm-up turns the layer off below ~38 fps, reduced-motion stills flicker/drift/grain. WebGL unavailable → layer off, classic game untouched.
    - **The Feel** (`?feel`, `src/feel.ts`): typing-feel CSS scoped under `[data-feel="1"]` on the playing container — letters ignite (white flash, lift, bloom, settle to accent, lingering wet-ink text-shadow), a breathing ink-drop cursor replaces the bar, wrong keys shiver, finished words settle and draw an underline (`data-done` on word runs), and the completed phrase exhales left to right through the breath. Helper text goes quiet except "backspace to correct." Zero extra React work; keyed on `data-state`/`--i` attributes PlayingScreen now renders.
    - `scripts/screenshot.mjs` gained `--mobile` (390×844, touch, DPR 2), `--params=glow,feel`, and `--settle=ms`; headless Chromium now launches with SwiftShader flags so WebGL renders in screenshots.
    - Director's live test URL: `https://inkwood.codywymore.com/?glow&feel` (Cottage is level 2; `&dev` + F2 jumps straight there). The other nine scenes have no manifest yet and render as before under `?glow`.

20. **Inkwood 2 build (2026-09-05, same night)** — Director approved the Cottage slice ("that's great, let's improve every scene with that") and gave free rein on story, visuals, and phrases. Everything ships behind one master gate, **`?v2`** (`src/v2.ts`), which implies glow + feel and swaps in the rewritten story, redrawn scenes, journal act cards, and the outro's second line. The live game stays v1.5 until the director flips it.
    - **Story** (`src/levels2.ts`, served by `levels.ts` under the gate): you are the new scribe; the one before you wrote the forest awake once and went quiet; their journal (found in the Cottage) holds the incantations half finished; in the Great Tree you learn the old scribes go into the heart as small lights; the last line is yours. Two voices, no new surfaces: `flavor` is the journal (first person, one sentence), `winText` is the world answering. Acts: Kindling / The Old Paths / The Listening / The Last Line. Act cards carry a journal page and run 9.5s. Outro adds "It remembers you." Phrase changes: Stars 1 "Orion Lyra Cygnus Cassiopeia" (pool permutes the four); Library 2 "every voice, rise and speak as one"; Sanctum "moonlight, pour into the circle" + "Oak, Alder, Yew, take your seats" (the ancient ones are the elder trees); World 3 "the forest remembers". `src/__tests__/levels2.test.ts` keeps the table shape-compatible with v1 (same scenes/titles/phrase counts, every prompt ≤34 chars).
    - **Scene overrides**: `src/scenes/v2/<sceneKey>.tsx` auto-register via `import.meta.glob` (`scenes/v2/index.ts`); light manifests likewise from `src/scenes/manifests/<sceneKey>.ts`. Parallel agents never touched a shared file. All ten scenes now have a v2 override and a manifest. `SceneProps.wordsDone` (finished words of the current phrase, v2 scenes only) lets scenes obey the words literally: the Stars draw each constellation the moment its name is typed.
    - **Redraws** (six Opus 5 agents in `.claude/worktrees/`, each screenshot-verified at 0/30/60/99% desktop + 99% mobile, self-graded B+ to A-): Tree (forking buttressed trunk, 40-clump crown, roots carrying ley light to the frame edge, torn heart hollow with the ten scribe lights), Garden (dawn sky, rising sun, five receding planes, five-petal bezier flowers, bare branching tree at dormancy), Well (dry black shaft that fills from an aquifer, fitted-stone lining picked out by water, runes lit course by course, bucket floating up), Library (one-point perspective cavern, shaped books, hero tome with the ogham stave, six books lifted from real gaps, three rays braiding into one column), Sanctum (broadleaf + spruce ring in three depths, five seat-stones, spirits kept), Bridge (segmental arch of 13 voussoirs assembling springings-in, keystone last; luminous receding gorge with mist, waterfall thread, river; five lanterns).
    - **Signature passes** for the four that kept their art: Cottage (journal lies closed between the first two candles, rises and opens on phrase 2, handwriting draws and brightens to gold, a page turns at 99%; candle flicker, steam drift, cat breathing and ear flick, all SMIL, skipped under reduced motion), Stars (named constellations draw; twinkle; moon masked properly against lit sky), Stones (weathered chipped stones seated in sockets on a moor swell; light pulses travel the ley lines toward the center; rune ring on the ground; runes moved to phrase 2), World (**three rendering options behind `?worldvariant=a|b|c`**, default `a`; the 21-connection graph is byte-identical to v1 and was diffed to prove it. A = ink threads with traveling motes, B = node-to-node gradient threads over three-tone hills with mist, C = A plus dawn breaking on the last phrase. Director picks; then the switch is removed. Bonus fix: v1's stagger left five of the 21 lines undrawn at 99%).
    - **Glow layer fixes**: the FPS probe now compares frames with the layer rendering against frames with the render skipped and turns off only when the layer itself costs >7ms (a heavy SVG scene keeps its light); one retry; `?glowprobe=off` for screenshot tooling (screenshot.mjs passes it). Manifest tuning law recorded in `manifest.ts`: whole-frame lights ≤0.05, haze ≤0.03, or the dark corners go milky.
    - **Perf**: every v2 scene that uses `useParticles` now does so in a memo'd child component (the Library established the pattern) so the scene body stops re-rendering at particle rate. `eslint.config.js` and `.gitignore` ignore `.claude/worktrees`.
    - **Tooling**: `screenshot.mjs --port`, `--params=v2` (reads levels2.ts), `--mobile`, `--settle`. `SCENE_BRIEFS_V2.md` (committed) holds the director's pass, the story frame, the glow contract, and every brief the agents built from.
    - **Known weak spots for the next pass**: Garden and Tree canopies still read as clustered blobs at desktop size; Garden 0% is very dark; Well mouth above the waterline is a dark block; Library crystals read as feathers; Sanctum floor light is soft; Stars treeline is flat; Stones aurora barely registers.
    - **Director's live test URL**: `https://inkwood.codywymore.com/?v2` (add `&dev` + F2 to jump; `&worldvariant=b` or `c` for the World options).
    - **The frame (2026-09-06)** — Director: "The waking world, the intro, and the outro all need the same kind of attention and care that the individual scenes got." Three more Opus agents from briefs in `SCENE_BRIEFS_V2.md` §7, seams in App.tsx (`components/v2/Intro.tsx` + `Intro2.module.css`, `components/v2/Outro.tsx` + `Outro2.module.css`, picked under `?v2`), `GlowSurface` (lazy light canvas with a caller manifest and `progressOf` clock for non-scene surfaces).
      - **Waking World full redraw** (`scenes/v2/world.tsx`, A-): three-depth valley with mist and a stream leading in, every callback a miniature of its v2 scene placed on its LEY_POINT, ink threads with traveling motes completing all 21 by unity 0.9, dawn on "the forest remembers" as the default ending. `?worldvariant=night` keeps the night sky (dev-only; remove after the pick). `LEY_POINTS`/`LEY_CONNECTIONS` byte-identical to v1 (md5 verified). The a/b/c switch is gone.
      - **Intro redraw** (B+): three dormant vignettes in the v2 language (bare garden tree over receding hills, the cold cottage with the journal closed on the shelf, the latent star field under the moon), SMIL idle life, GlowSurface lights following the 24s cycle, measured lightness 16–19% (inside the 15–25% floor), one journal line under the title: "Someone wrote this forest awake once." **Flag for the director**: the garden vignette's tree came back with filled tapered limbs rather than v1's thin stroked branches (defended territory); shipped under the gate for a ruling.
      - **Outro redraw** (B+): panorama as a three-depth valley at first light, eight miniatures matching the World's, the Great Tree with its lit hollow and ink threads to every place, GlowSurface lights arriving as vignettes bloom; viewBox now 400×250 slice so the light layer registers; React clock stops at 28s and SMIL carries the idle loop.
      - **The planting finale** (`components/v2/PlantWord.tsx`, mine): after "It remembers you.", "Leave one word for the next scribe." One word grows into a bloom seeded from its hash (petals, hue, lean, leaves, one star per letter), persists in localStorage `inkwood-word`, greets the returning player already grown ("Still here."). Own visible input on purpose (the singleton routes to the incantation matcher); native Enter/Space stopped inside it so the outro's restart listener never fires. Count-only `plant/word` analytics event via `trackEvent`; the word never leaves the browser. Dev-only unplant link.
      - **Frame-by-frame playtest (2026-09-06)** — Director: "go through the animations frame by frame and analyze them so that they make sense to the end user (the well does this properly)." Dawn confirmed as the finale's ending; the night switch is gone. `scripts/sweep.mjs <idx>` types a scene's phrases and screenshots every 5% plus the breath and next-phrase frames into a labeled contact sheet; `SCENE_BRIEFS_V2.md` §8 holds the standard (the Well) and five rules: causality, continuity (nothing appears in one step), no dead stretches, phrase boundaries are seams, assembly over fade. Passed as-is: Well, Bridge, Stones, Sanctum, Stars. Fixed and re-swept: Library (the tome now hinges open on its spine across 5–45%, cover foreshortening with cos of the angle, leaves crossing the gutter, light only after the spread exists), Tree (roots extend with their light drawing along them through phrase 1; crown builds from the fork clump by clump through phrase 2, spaced by cumulative area), Garden (crown fills from the crotch outward 20–50%; buds swell from 50% and flowers unfold one per step), World (sky is night from 0% so phrase 2 ignites stars into it; the Great Tree rises trunk → limbs → crown across 66–82% before the threads draw), Cottage (wick tip → core → halo → wall pool; window stays cold through phrase 1, warms with the room on phrase 2). Known: 35% of the Tree and 20% of the Library are the thinnest frames; the Tree and Garden crowns still read as clustered blobs.
      - **Motion, not stills (2026-09-06)** — Director: "these frames hit the human eye in quick succession... animate quickly one after the other to tell a cohesive story of movement." The real fault the sweep exposed: scenes only changed when a key landed, so the world snapped state to state and sat still between letters. Under the Feel gate, `hooks/useTweenedProgress.ts` now eases the displayed progress toward each keystroke's target (ease-out cubic, ~180–620ms by distance, quantized to 0.005, retargets mid-tween, snaps on level change and reduced motion); `displayProgress.ts` shares that value with the light layer so art and light move together. `scripts/motion.mjs <idx> --from --to --cadence --fps` records real typing as video and lays it out as a frame strip: the honest check for animation. Verified on the Library opening and the Tree's crown growth at 170ms/letter: continuous, no snaps.
      - **Inkwood 2 becomes the default; Classic becomes the comparison (2026-09-06)** — Director: "Their first experience should be the newer graphics and animations. Then afterwards, they should be allowed to toggle between the first and second version... a way to see how far the models have come." `src/v2.ts`: `DEFAULT_ENABLED = true`; `?classic` forces the first edition, `?v2` forces the second, localStorage `inkwood-v2` persists a choice; `switchEdition(on)` persists, sets a `sessionStorage` return marker, and reloads; the store reads the marker at boot and lands on Wander (only reachable after a completion, so the first run is always Inkwood 2). WanderScreen carries the Classic / Inkwood 2 toggle (bordered, active one filled) with one line: "Inkwood was made twice: first in April 2026, then again in September 2026 with far more capable models. Wander either one." Gate telemetry: `gate/classic` counts opt-outs; glow/feel events only fire when chosen on their own. Tools default to the v2 table; `--params=classic` selects v1. `LEVELS_V1` is exported for the parity test. Motion check on all ten scenes at 170ms/letter (`scripts/motion.mjs all`): clean; the snap detector now flags isolated single-frame jumps only (sustained change like the finale's threads or the completion bloom is motion). `scripts/walk.mjs` plays the whole game headlessly (intro → 10 levels → outro → plant → wander → switch offered) in either edition and on mobile, collecting console and page errors.
      - **Both editions from the first screen; the toggle is always there (2026-09-06, later)** — Director changed his mind: "I want the user to be able to switch between them at any point... two different buttons: one to start Inkwood Classic, one to start Inkwood V2, and then the toggle should constantly exist." Both intros (`IntroSequence.tsx`, `v2/Intro.tsx`) now carry a `.beginRow` with "Begin Inkwood Classic" and "Begin Inkwood 2" (stacked on phones); the current edition's button starts directly (gesture-driven focus kept), the other calls `switchEdition(on, { screen: "playing", lvl: 0, fresh: true })`. `components/EditionToggle.tsx` is pinned top-right on every screen (`z-index 60`; the playing header gets right padding for it; below the header row on phones). `switchEdition(on, marker)` persists the choice, writes a `ReturnMarker` to sessionStorage (`playing` with lvl + promptIdx from a level or the next level from a win/act card; `outro`; `wander`; `intro`), rewrites the save with only lvl + promptIdx so the arrival edition re-samples its own phrasing, strips `?v2`/`?classic` from the URL (a deep link would outrank the stored choice), and navigates. The store reads the marker at boot. After a switch there is no gesture, so the prompt box shows "click anywhere to type" until tapped. Verified by a scratch switch test (both intros, Begin Classic → level 0, mid-level switch keeps Library phrase 2 both ways, desktop + mobile) and the three full walks. Wander keeps only the one-line note.

### Total Improvements
- All scenes rebuilt or polished to B+/A-
- 30+ commits over multiple sessions
- `src/audio.ts` grown from zero to 460+ lines (incl. user volume + drone unlock)
- `useParticles` hook + 5 scene integrations
- 82-screenshot automated critique protocol
- Mobile viewport properly handled on iOS Safari
- Singleton input architecture with shared context

---

## Known Issues / Next Steps

**Elevation project (active, 2026-07-02 →):** five gated prototypes await director verdicts. The immediate queue:

1. **Director listens to the Music of Typing** (`?music`) → tune `ACT_SCALES`/timbre/levels together → flip `DEFAULT_ENABLED` in music.ts.
2. **Director views the Ink** (`?ink`, especially on iPhone) → tune `INK_FOCUS` landing points + mote density/size → flip gate in ink.ts.
3. **Director views Living Seasons** (`?season=winter` etc. to taste-test all four) → refine palettes (leaf shapes?) → flip gate in seasons.ts.
4. **Director judges the Cottage test slice** (`?glow&feel`, desktop + iPhone) → approve/redirect the Inkwood 2 plan in `PLAN-INKWOOD-2.md` (five decisions listed in its §8). On approval: Phase 0 (baseline harness, perf probe, manifest seam for all ten scenes, `.claude/agents/` crew) starts without further taste calls.
5. **GoatCounter access** — dashboard is private; need an API token (Settings → API) or public toggle, then pull the two-month funnel and let data re-rank everything below. The token also unlocks the new `gate/*` events, which count prototype playtest sessions per gate.
6. **World finale ink convergence** — proposal: during World phrase 3, ink threads flow along the existing 21-connection ley network, feeding it (never replacing it). Show options before building; the graph is defended territory.
7. **Scribe's Memory + planting finale** (pillar 4) — journal frame in existing text slots, "Leave one word for the next scribe" authorship beat, printable SVG keepsake. Design agreed at vision level; text specifics need the director's pen.

**Pre-elevation backlog (still valid, data-pending):**

1. **Sanctum prompt 2 length** — "moonlight, gather where spirits convene" (39 chars) still squeezes via `--char-count` font scaling. Tightening to ~30 chars would let it sit at full prompt size. Both v14 and v15 flagged this.
2. **Watch GoatCounter funnel** — site has been live since 2026-04-26 with per-screen pageviews. Pull `/intro → /play/garden → … → /outro` drop-off rates and let real player data drive the next round of art priorities. v15 explicitly recommended a one-week watch before more art work.
3. **Trailer publishing** — `scripts/trailer.mjs` produces a polished mp4; consider pinning the latest export to a release asset and updating share previews to point at it.
4. **Library voice rays sanity check** — verify in motion they don't read as a "victory beam" cliché. If they do, dial five rays back to three.
5. **Re-screenshot the World scene at 99%** — director kept the 21-connection complete graph but v15 testers (Alex) flagged the in-game finale as anticlimactic. If the funnel shows drop-off there, revisit (with options shown rather than a unilateral redesign).
6. **Run `/critique` again** for v16 once funnel data lands — its new Step 6 will re-sync `NEXT.md` from the v16 stack, closing the critique→steering loop for the first time.

**Director-rejected territory (do not re-attempt without explicit ask):** redesigning the World ley-line graph, redesigning the dormant intro trees, replacing the bordered CTA buttons with text/underline.

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
