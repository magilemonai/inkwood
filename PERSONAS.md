# Inkwood -- Persona Review Panel

Six specialist perspectives on the current state of Inkwood, a cozy typing puzzle (Vite/React/TypeScript/SVG) with 10 levels across 4 acts. Thematic watchwords: **numinous** and **nourishing**.

---

## 1. Code Reviewer

**Role:** Correctness, performance, React patterns, SVG rendering efficiency.

### Assessment

The codebase is compact and readable. `store.ts` uses Zustand well, component decomposition is reasonable, and the SVG scene architecture (`SceneProps.progress` driving everything) is elegant. That said, several patterns will cause real problems at scale or on constrained devices.

| Issue | Location | Severity |
|---|---|---|
| RAF loop calls `setTime()` every frame (~60 Hz state updates) | `IntroSequence.tsx:108-118`, `OutroSequence.tsx:46-55` | High -- triggers a full React reconciliation per frame for 15-28 seconds |
| Scene components are not wrapped in `React.memo` | `scenes/*.tsx`, consumed in `PlayingScreen.tsx:68` | High -- every keystroke re-renders the entire SVG tree via `levelProgress` |
| Store mixes derived functions (`level()`, `target()`, `isComplete()`) with raw state | `store.ts:17-23` | Medium -- callers like `PlayingScreen` must invoke `g.level()` per render; Zustand selectors cannot skip renders for derived values |
| Completion timer uses a `completingRef` guard to survive React strict-mode double-invoke | `PlayingScreen.tsx:40-48` | Low -- works, but the intent is non-obvious; a comment or extraction to a hook would help |
| SVG filter stack (`GlowFilter`, `MistFilter`, `TextureFilter`, `WaterFilter`, `SoftLightFilter`) can compound | `svg/filters.tsx` | Medium -- `feTurbulence` + `feDisplacementMap` on low-end GPUs can drop frames when multiple filters are active |
| `getSceneComponent` returns a new reference only if the key changes, but the lookup map is stable | `scenes/index.ts:26-28` | OK |

### Top Priorities

1. Wrap every scene component (`GardenScene`, `CottageScene`, etc.) in `React.memo` so keystrokes only re-render when `progress` actually changes.
2. Throttle the RAF state updates in `IntroSequence` and `OutroSequence` -- update at ~20 Hz or use CSS/SMIL animations instead of React state for time-driven opacity.
3. Profile SVG filter load on a real low-end device (e.g., Moto G Power). Set a budget: max 2 filters per scene, no stacked `feTurbulence`.

---

## 2. Narrative Director

**Role:** Story arc, flavor text, typed phrases, mystical tone.

### Assessment

The four-act structure (Awakening, Discovery, The Nexus, Restoration) is sound. The best moments happen when what you type is what you see: typing "stand tall again guardians of old" while stones rise in `StonesScene` is genuinely moving. The weakest moments disconnect words from visuals.

| Level | Prompt-to-Visual Alignment | Notes |
|---|---|---|
| The Sleeping Garden | Weak | "warm summer rain" -- but there is no rain in `GardenScene`; flowers just grow |
| The Dark Cottage | Good | "little candle burn bright" maps directly to `candle1/2/3` lighting up |
| The Night Sky | Good | "Orion Vega Sirius Lyra" -- stars appear; the naming conceit works |
| The Dry Well | Good | "deep water remember your name" -- water rises in `WellScene` |
| The Forgotten Bridge | OK | "moss and stone recall the crossing" -- bridge rebuilds, but "spirits still walk" has no visible spirits |
| The Whispering Library | OK | "open the pages let wisdom rise" -- books animate, but "every old word finds its voice" is vague |
| The Spirit Stones | Strong | "stand tall again" triggers stone-rise; "the circle remembers" triggers ley lines |
| The Moonlit Sanctum | Strong | "moonlight gathers where spirits convene" -- moonbeams + spirit figures appear |
| The Great Tree | Strong | Three prompts build roots, branches, full radiance. Best pacing in the game. |
| The Waking World | OK | Callback phrases are nice but feel like a summary, not a climax |

**Flavor text** sometimes over-explains. "An ancient spring, long silent. The stones still remember the sound of water." -- the second sentence weakens the first. One sentence maximum.

**Win text** is strong in Acts I-II, gets wordy in Act III. "Light races between the stones in lines of pale fire. The ley lines are waking. You understand now -- these are not monuments. They are conduits." -- cut the last two sentences; let the visual do that work.

**Outro** (`OutroSequence.tsx`) currently has zero text -- just colored dots and "Begin Again." This is the emotional resolution of the entire game. It needs one poetic line. Not a paragraph. One line.

### Top Priorities

1. Audit every prompt against its scene animation. Fix "warm summer rain" (add rain, or change the phrase to "green returns to sleeping roots").
2. Trim all flavor text to one sentence. Trust the player.
3. Add a single closing line to the outro -- something that echoes the opening silence without explaining it.

---

## 3. UX Researcher

**Role:** Discoverability, flow state, accessibility.

### Assessment

The core loop (read phrase, type it, watch the scene change) is intuitive once understood. Getting to that understanding is the problem.

| Finding | Severity | Location |
|---|---|---|
| Mobile keyboard may never appear: the hidden `<input>` in `PlayingScreen.tsx:163` relies on programmatic `.focus()` with a 50ms delay, which many mobile browsers block without a direct user gesture | Critical | `PlayingScreen.tsx:51-53` |
| No skip affordance on intro beyond a tiny "tap to skip" hint at the bottom of `IntroSequence.tsx:207` -- easy to miss, especially on desktop where "tap" is the wrong word | High | `IntroSequence.tsx:207` |
| Screen transitions use `AnimatePresence mode="wait"` in `App.tsx:19` -- if exit duration (300ms) and enter duration (500ms) overlap badly, users see a flash of blank screen | Medium | `App.tsx:9-13` |
| Progress diamonds in `PlayingScreen.tsx:78-88` are small unicode characters (`\u25C6`) with no labels; 10 dots at body font size are hard to parse | Medium | `PlayingScreen.tsx:78-88` |
| No pause, no back button, no way to revisit a completed level | Medium | `store.ts` (no save/load actions) |
| No ARIA labels on the prompt characters or progress indicators | Low | `PlayingScreen.tsx:109-130` |
| Color-only error indication (red text for mistyped characters) fails WCAG for color-blind users | Low | `PlayingScreen.tsx:119` |

### Top Priorities

1. Test mobile keyboard trigger on iOS Safari and Chrome Android. If `.focus()` fails, add a visible "Tap here to begin typing" overlay that fires focus on a real user tap event.
2. Replace "tap to skip" with "click anywhere to skip" on desktop, or use a universal affordance like a small skip button.
3. Add `aria-label` to the prompt box and progress indicators.

---

## 4. Design Director

**Role:** Visual quality, animation polish. Does this dazzle?

### Assessment

The SVG filter library in `svg/filters.tsx` (glow, mist, texture, water ripple, soft light, inner shadow) is a strong foundation. `svg/primitives.tsx` provides reusable shapes (`Hill`, `Wisp`, `GrassRow`). Color palettes in `svg/palettes.ts` are well-chosen -- muted, earthy, appropriate for the tone.

**What works:**
- `StonesScene` -- the 7-stone perspective arc with staggered rise + ley-line connections is the visual high point.
- `SanctumScene` -- moonbeam pooling + spirit figures is atmospheric.
- `TreeScene` -- three-phase build (roots, branches, full canopy) with radiance is satisfying.
- Intro vignettes (`DormantGarden`, `DormantCottage`, `DormantSky`) are moody and effective.
- Act transitions in `ActTransition.tsx` are atmospheric.

**What does not work:**
- `CottageScene` feels diagrammatic: flat rectangles for walls, simple rect candles, basic window cross. Compare its geometric primitives to the organic shapes in `StonesScene`.
- `LibraryScene` likely has the same flatness problem (geometric book shapes, no atmosphere).
- The outro world-map (`OutroSequence.tsx`) is circles and lines -- the most abstract moment in the game is supposed to be the most beautiful. It reads as a network diagram, not a living world.
- No ambient motion. Scenes are static until the player types. A slow parallax drift, firefly particles, or gentle color cycling would make the world feel alive even at rest.

### Top Priorities

1. Rebuild `CottageScene` and `LibraryScene` to match the organic quality of `StonesScene`/`SanctumScene`. Use the texture and mist filters that already exist in `svg/filters.tsx` but are underused.
2. Make the outro a showpiece: replace the node-and-line diagram with a painterly landscape that assembles from the 9 scene palettes, culminating in the Great Tree.
3. Add subtle ambient CSS animations (slow background color drift, particle layer, gentle parallax on scene layers) so the world breathes even when the player pauses.

---

## 5. Product Lead

**Role:** Prioritization, creative trade-offs, user delight as north star.

### Assessment

Inkwood is a small game with a big emotional ask: it wants 20-30 minutes of focused attention and rewards patience. That contract only holds if quality is even across all 10 levels.

**Biggest risks:**

| Risk | Impact | Mitigation |
|---|---|---|
| Uneven level quality -- `StonesScene`/`SanctumScene` are genuinely moving; `CottageScene`/`LibraryScene` are forgettable | Players disengage mid-game and never reach the best content | Prioritize visual parity before any new features |
| No save state -- closing the tab resets to the intro | A 20-min game with no resume is hostile to mobile users | Add `localStorage` save/resume (current `lvl` + `promptIdx`) to `store.ts` |
| Intro may appear broken on slow loads -- 0.8s of pure black before anything renders | First impression is "is this working?" | Show a minimal loading indicator or start the first vignette immediately |
| Outro has no emotional payoff -- no text, abstract visuals, just "Begin Again" | The ending is the last thing the player remembers | One poetic line, a more beautiful final scene |
| Performance untested on real devices | SVG filters can destroy frame rate on budget phones | Test on 3 real devices before launch; set a filter budget |

**What NOT to build yet:** Level select, achievements, sound design, sharing. All of these are polish on top of a foundation that needs evening out first.

### Top Priorities

1. Level quality parity: bring every scene to `StonesScene` level before adding features.
2. Save/resume via `localStorage` -- minimal effort, large impact.
3. Performance audit on real devices (budget Android phone, older iPad, desktop Firefox).

---

## 6. Alpha Tester Panel

**Role:** Composite user testing. Four profiles, four experiences.

### Profiles

| Tester | Device | Style | Typing Speed |
|---|---|---|---|
| Alex | Desktop, Chrome | Fast typist, competitive | 90+ WPM |
| Bea | iPhone SE, Safari | Non-gamer, curious | 30 WPM, hunt-and-peck |
| Cal | Desktop, Firefox | Patient explorer, art-lover | 50 WPM, deliberate |
| Dana | Android tablet, Chrome | Impatient, low attention span | 60 WPM |

### Session Notes

**Alex (fast typist, desktop):** Blasted through each prompt in seconds. Barely saw the animations -- by the time stones started rising, the level was already won. Said: "I typed it all correctly but felt like I missed the point." The 700ms completion delay (`PlayingScreen.tsx:45`) is the only breathing room, and it is not enough. Would benefit from a brief animation hold (1-2s) between prompts so the visual change can land.

**Bea (non-gamer, phone):** Could not figure out where to type. Tapped the prompt text, tapped the screen, nothing happened. The hidden input (`PlayingScreen.tsx:163`) never received focus because iOS Safari blocked the programmatic `.focus()` call. Eventually gave up. When we manually triggered the keyboard, she enjoyed the game but found the "type the phrase above" hint (`PlayingScreen.tsx:151`) too subtle -- she did not realize she needed to match the exact text including spaces. Autocorrect also interfered despite `autoCorrect="off"`.

**Cal (patient explorer, desktop):** Loved it. Paused between keystrokes to watch the scene evolve. Said the intro was "beautiful but too long" and wished he could linger on completed scenes before the level-win overlay appeared. Wanted to revisit the Moonlit Sanctum. Was disappointed by the outro -- "it felt like a credits screen, not a finale."

**Dana (impatient, tablet):** Clicked through the intro immediately, landed on Level 1 with no context. Did not know it was a typing game until she accidentally triggered the keyboard. Finished 3 levels, got bored during the Bridge, closed the tab. Came back later and was annoyed to start over from the beginning. Said: "If there's no save, it needs to be shorter."

### Top Priorities

1. Add a visible "tap anywhere to begin typing" overlay on mobile, triggered on the first `playing` screen entry.
2. Add a 1-2 second breathing pause between prompts so fast typists can see the animation they earned.
3. Test and fix mobile keyboard focus on iOS Safari and Android Chrome.
4. Implement `localStorage` save so returning players resume where they left off.
5. Consider a brief (3-second) non-interactive hold on completed scenes before showing the win overlay.

---

## Summary: Cross-Persona Priority Stack

| Priority | Owner | Effort |
|---|---|---|
| Fix mobile keyboard focus | UX / Code | Small |
| `React.memo` on all scene components | Code | Small |
| Save/resume via `localStorage` | Product / Code | Small |
| Throttle RAF loops in intro/outro | Code | Small |
| Audit prompts against visual changes | Narrative | Medium |
| Trim flavor text to one sentence | Narrative | Small |
| Add one poetic line to outro | Narrative / Design | Small |
| Rebuild `CottageScene` and `LibraryScene` | Design | Large |
| Redesign outro as a visual showpiece | Design | Large |
| Performance test on 3 real devices | Product / Code | Medium |
| Add ambient motion to idle scenes | Design | Medium |
| Add breathing pause between prompts | UX / Code | Small |
