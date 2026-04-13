# Inkwood — Persona Review Panel v13

Date: 2026-04-13
Trigger: Full six-persona critique cycle run after v12 alpha-test fixes shipped. 82 screenshots generated (10 scenes × 7 progress points + intro + outro timelapses). Code Reviewer verified via `eslint` + `tsc --noEmit`. Cody's v12 fixes pressure-tested visually.

Headline: The game is visibly better than v12. The three ship blockers from v12 (typing integrity, outro composition, moon glow box) all land. Six scenes at A- or higher. Remaining work is opportunity, not debt.

---

## 1. Code Reviewer

**Build:** Zero lint errors, zero TypeScript errors (verified). Bundle 452KB / 139KB gzip — unchanged territory.

| Strength | Notes |
|---|---|
| `typeChar` correctness | Now a true input gate — wrong forward keystrokes silently dropped, backspace preserved. Restores the game's core contract. |
| `playTypeClick` gating | Only fires on accepted input (compares `typed` before/after). No stray click on rejected keys. |
| `GlowFilter` default bounds | Widened from 200% to 500%, fixing clipped halos across cottage candles, runes, moon — a one-line change with broad visual effect. |
| Idle nudge cleanup pattern | State reset lives in the effect's cleanup function, not the body. ESLint's `react-hooks/set-state-in-effect` clean. |
| Outro tree shift | Trunk/canopy/spirit-lights each translated in their own local coords (no hacky group wrapper that would break the root connections to vignettes). |
| Comma audit | Three targeted edits; scene timing keys off length ratio so commas didn't disturb pacing. |

| Remaining concern | Severity |
|---|---|
| `src/components/TitleScreen.tsx`, `GameWinScreen.tsx`, `svg/palettes.ts`, `scenes/index.ts` — still present, still unused | Low |
| `svg/primitives.tsx` exports besides `Star` — still dead | Low |
| `screenshot.mjs` prompts array duplicates `levels.ts` — a drift hazard (already burned us once this cycle when commas were added) | Low |
| No audio preload — still created on first gesture | Low |
| `hasError` path in `PlayingScreen` is now unreachable under normal use (store rejects wrong forward input); the "backspace to correct" hint rarely fires | Cosmetic |

### Verdict
Ship-ready, cleaner than v12. The dead-code and screenshot-script-drift items should be addressed in a dedicated cleanup pass but don't block release.

---

## 2. Narrative Director

| Level | Prompts (v13) | Rating | Prompt ↔ Visual Alignment |
|---|---|---|---|
| Garden | "wake now, sleeping roots" / "bloom, every waiting flower" | **5/5** | Roots glow diagonally; canopy covers bare branches; bezier petal flowers open; pollen drifts |
| Cottage | "little candle, burn bright" / "fill every room with warmth" | **5/5** | Candles light sequentially; amber floods; cat silhouette appears; comma sharpens the incantation |
| Stars | "Orion Vega Sirius Lyra" / "burn again with ancient fire" | **5/5** | Named stars appear by delay order; constellations draw; comets streak at climax |
| Well | "deep water, remember your name" / "rise and carry the old songs home" | **5/5** | Water rises through narrow shaft (contained, not extruded); runes ignite on the stones in place — the "remembered" verb now reads |
| Bridge | "stone, recall the crossing" / "spirits, walk the old paths" | **5/5** | Stones assemble at cliff-tops, lanterns ignite, footprints walk — unchanged gold |
| Library | "open, sleeping pages" / "speak again, forgotten words" | **5/5** | Tome now portrait — reads as a *sacred book*, not a diagram. Runes rise on prompt 2. |
| Stones | "stand tall again, guardians of old" / "remember what was promised" | **5/5** | Stones rise, ley lines connect, ritual circle manifests. Comma rescues the vocative. |
| Sanctum | "moonlight, gather where spirits convene" / "return to your seats, ancient ones" | **5/5** | Moon + beams + spirits on the forest floor — fireflies active |
| Tree | "roots deeper than memory" / "branches wider than sky" / "awaken, heart of all things" | **5/5** | Canopy now present during branch phase — the bare-branches window is closed. Heart blooms full at phrase 3. |
| World | "garden bloom, hearth burn bright" / "stars remember, spirits sing" / "the ancient order is restored" | **5/5** | Garden + cottage on prompt 1; **spirits now visible on the far hill on prompt 2**; **stone guardians rise on prompt 3** alongside the ley lines. Every phrase now has a specific visible callback. |

**Average: 5.0/5.** Up from 4.8 in v11. Every prompt now ties to a specific, verifiable visual change. The "incantation → world obeys" promise is finally airtight — partly because the comma audit fixed three vocatives that had been reading as descriptions, partly because the outro finale now *shows* the thing it speaks.

**Text economy:** unchanged. Flavor text one sentence. Win text 1-2 sentences. No bloat introduced in this pass.

**Arc:** Still lands across the four acts. The Sanctum → Tree → World sequence is the strongest three-beat finish in the game.

---

## 3. UX Researcher

| Finding | Status |
|---|---|
| Wrong keys don't advance scene | **Fixed** — verified in code, the central trust contract now holds |
| Idle nudge escalation | **Added** — after 2.5s with `typed.length === 0`, prompt box switches to stronger pulse and an italic "↓ type here" caption fades in above. Addresses Cody's C1. |
| Mobile portrait layout | **Working** — unchanged |
| 1.5s breathing pause | **Correct** |
| Outro text / tree collision | **Fixed** — tree group shifted up 25 SVG units; text overlay tightened to `bottom: 1.5rem`. "The forest remembers." and "Begin Again" both read in the clear at 20s. |
| Save/resume | **Working** |
| Scene content above y=170 | **Confirmed** |

**New concerns:**

- **Intro dormant-trees still geometric** — Y-shaped stick trees at the 3s Garden vignette and 15s Title screen read as explicit line-art rather than organic silhouettes. This has been on the priority stack since v11 and remains. It's the first thing a new player sees.
- **No feedback on rejected keystroke** — now that wrong keys are dropped silently, a user who mistypes and doesn't watch the cursor may think the input is broken. Consider a subtle haptic-equivalent: a tiny red-tinted flash on the expected character, or a muted "miss" click. Low priority but worth testing.
- **Act transition 7s duration** — still no visible progress affordance on the interstitial. Unchanged since v11.

### Verdict
Every UX finding Cody raised in the alpha test is either fixed or explicitly addressed. The one legitimate open UX issue from v11 (dormant-tree character) persists.

---

## 4. Design Director

### Scene grades

| Scene | v11 | v13 | Animation arc |
|---|---|---|---|
| **Garden** | B+ | **A-** | 0%: bare silhouette, moody. 20%: trunk darkens, canopy begins covering. 50%: full canopy, sun warming, grass tufts. 99%: full bloom, bezier flowers, drifting clouds, sun glow. Covering layer + new cloud drift lifts the grade. |
| **Cottage** | A- | **A-** | Cold blue → warm amber shift still the signature. Candle glow halos now have smooth falloff (no rectangular clipping). Cat silhouette still reads as "slightly odd" per Cody — deferred, requires dedicated session with reference. |
| **Stars** | A | **A** | Moon glow box is gone — the dark crescent-forming circle blends cleanly. Constellation lines no longer cross the moon disc. Comets + Milky Way + treeline parallax intact. **Still the gold standard.** |
| **Well** | B+ | **A-** | Second-half water no longer reads as an extruded rectangle. Narrow shaft column (x=175-225) with inner-shadow edges makes water feel *held*. Flowing runes deleted — runes now glow in place on stones, which actually makes the prompt "carry the old songs home" read as the stones remembering. Genuine grade lift. |
| **Bridge** | A- | **A-** | Unchanged — lanterns on the arch, spirit footprints, dramatic sky. Still the "most satisfying moment" from v11 feedback. |
| **Library** | A- | **A** | Portrait tome is a legitimate step up. Opens like a sacred book, not a diagram. Floating books + crystals + rune floaters + vault ribs all intact. |
| **Stones** | B+ | **A-** | Unchanged from v11 but the comma in "stand tall again, guardians of old" ties the incantation to the rising stones more crisply. |
| **Sanctum** | A- | **A-** | Unchanged — moonbeams through varied tree canopies, spirit figures in the clearing. Composition holds. |
| **Tree** | A- | **A** | Canopy now appears during branch phase — no more bare skeleton. Makes phrase 2 ("branches wider than sky") resolve visually rather than deferring to phrase 3. Heart pulse still lands. |
| **World** | B+ | **A-** | Far-hill spirits (phrase 2) and rising stone guardians (phrase 3) give the outro panorama the callbacks Cody flagged. Ley lines connect at 99%. Finale composition is noticeably stronger. |

**Average: A-.** Seven scenes at A-, two at A. No B+ left.

**Most beautiful moment:** Stars at 99% — constellation lines drawn clean of the moon, comets streaking, horizon treeline parallax softly drifting. Unambiguous.

**Second-most beautiful:** Outro at 20s — tree fully grown with "The forest remembers." sitting clean below the trunk, all 8 vignette lights alive, ley lines connecting them, a crescent moon to the right. The finale finally *composes*.

**Ugliest remaining moment:** Intro at 3s — the geometric Y-stick trees against flat-dark sky. Everything else has been lifted; this is the last holdout.

**Silhouette test:** All 10 main scenes pass. The intro dormant-world vignettes do not — they read as explicit line-art, not organic silhouettes.

---

## 5. Product Lead

**Public-ship-ready.** v12 fixed the gameplay integrity bug and the finale composition; v13 is the quality bar that matches the vision.

### Top 5 screenshot-and-share moments

1. **Stars at 99%** — constellations drawing over a clean crescent, comets streaking.
2. **Outro at 20s** — tree silhouette against the panorama with "The forest remembers" legible beneath.
3. **Library at 99%** — portrait tome open on its pedestal with runes rising and floating books orbiting.
4. **Bridge at 99%** — lanterns on assembled stones, footprints continuing beyond.
5. **Well at 60%** — water held in the narrow shaft with runes glowing on the stones. (This was a C-grade moment in v12; it's now a shareable.)

### What's still blocking wider release

| Item | Gate? |
|---|---|
| Intro dormant-tree character | **Not a blocker** — cosmetic. Flag for next art pass. |
| Dead code in repo | **Not a blocker for play** — a blocker for anyone auditing the repo publicly. Schedule a cleanup commit. |
| Trailer / landing page | **Not in-repo work** — 30s screen recording + copy. Scheduled; needs a day. |
| Cottage cat silhouette | **Not a blocker** — it reads as a cat, just an awkward cat. Deferred per v12 call. |

### What NOT to do

- Don't rebuild any of the 10 scenes from scratch. They're done.
- Don't add new scenes, prompts, or acts.
- Don't optimize without a measured problem; current bundle and render behavior are fine.
- Don't touch the audio mix without director ear review.
- Don't modify the 1.5s breathing pause — confirmed working across all testing.

---

## 6. Alpha Tester Panel

**Cal** (patient explorer): "The canopy arriving during branch phase fixed something I couldn't articulate before — the Tree used to feel half-finished at phrase 2. It doesn't now. The runes glowing in place on the well stones is the detail I didn't know I wanted. And I noticed the clouds drift in the garden."

**Alex** (fast typist): "I *can't* mash through anymore — that's the biggest change. When I fat-finger, nothing happens. It feels correct. I respect the typing now. Completion sweep is still subtle, pacing is clean. Favorite run-through yet."

**Dana** (impatient): "Outro used to have text sitting inside the tree trunk and I was rolling my eyes. Now it reads clean. The stone guardians rising on 'ancient order restored' made me sit up. First time the finale felt *earned*."

**Sam** (non-gamer on phone): "Pulsing prompt + the '↓ type here' caption after a couple seconds was exactly the confirmation I needed. The portrait Library tome is easier to see on a phone screen too — it was squat before and I couldn't tell what it was. Would show a friend."

**Panel consensus:** Universally happier than v11/v12. The three "broken-feeling" items (mashable typing, text-on-tree, moon-box) are fixed. The remaining gaps are polish.

---

## Priority Stack — v13

Four items remain. All are polish / deferred; none are blockers.

| # | Item | Impact | Effort | Category |
|---|---|---|---|---|
| 1 | **Intro dormant-trees — organic character.** Replace the Y-shaped stick trees in Garden/Cottage/Sky vignettes + title screen with gnarled bezier silhouettes that match the Scene Art Guide's "organic complexity over geometric simplicity" standard. First impression of the game. | High | Medium | Art |
| 2 | **Dead-code cleanup.** Delete `TitleScreen.tsx`, `GameWinScreen.tsx`, `TitleScreen.module.css`, `svg/palettes.ts`, `scenes/index.ts`, and unused exports in `svg/primitives.tsx` (keep `Star`). ~500 lines of dead code. Important before making the repo public. | Medium | Small | Code |
| 3 | **De-duplicate `screenshot.mjs` prompt data.** Have the script import or read `levels.ts` at runtime rather than duplicating the prompt array. The v12 comma audit briefly broke the script because of the duplication. | Medium | Small | Code |
| 4 | **Cottage cat — reference pass.** Sixth iteration; needs its own dedicated session with a real cat silhouette reference. Do not batch with other polish. | Medium | Medium | Art |
| 5 | **Trailer / landing page.** 30s screen recording featuring Bridge + Stars + Tree + Outro, embedded on the GitHub Pages root. Shareable artifact. | High | Medium | Marketing |
| 6 | **Cottage window shadow.** Soft light pool on floor when candles are lit — currently the floor stays uniformly dark. Subtle but adds depth. | Low | Small | Art |
| 7 | **Rejected-keystroke feedback.** Optional: subtle red flash on the expected character when a key is dropped, so users who aren't watching the cursor get a signal. Test before shipping. | Low | Small | UX |
| 8 | **Audio preload.** Create the `AudioContext` earlier to avoid the first-gesture stutter. | Low | Small | Code |
| 9 | **Act-transition skip affordance.** Visible progress bar or more prominent "space to skip" on the 7s interstitial. | Low | Small | UX |
| 10 | **Sanctum vignette spirit size (outro).** The spirits in the far-right outro vignette are present but small (~3px tall). Consider doubling the scale so they read unambiguously at thumbnail size. | Low | Small | Art |

**Launch-readiness verdict:** Inkwood is ready to share publicly. Items 1-3 are recommended before a formal "1.0 post" on social/HN; items 4-10 are ongoing polish that can ship incrementally.

---

## What Changed Since v12

Ten v12 alpha-test items landed and verified visually this cycle:

- ✅ Wrong keystrokes no longer advance the scene (C5)
- ✅ Outro text reads clean of the tree trunk (C23)
- ✅ Moon rectangular glow box eliminated (C6)
- ✅ Constellation lines no longer cross the moon (C7)
- ✅ Well central column narrowed and eased; no longer reads as extruded rectangle (C10)
- ✅ Well runes glow in place instead of sweeping downstream (C11)
- ✅ Tree canopy appears during branch phase; bare-branch window closed (C18)
- ✅ Cottage candle glow halos render without clipped filter bounds (C4)
- ✅ Library hero tome is portrait at all stages (C13)
- ✅ World outro gets spirits on far hill (C20) and stone guardians in unity phase (C21)
- ✅ Sanctum outro vignette shows spirit silhouettes (C22)
- ✅ Prompt commas normalized (C9/C15)
- ✅ Garden clouds drift (C2)
- ✅ Idle nudge escalation after 2.5s (C1)

The only v12-audio-test item explicitly deferred is C3 (Cottage cat) — appears on the v13 stack as item #4.

**Average grade v11 → v12 → v13:** B+/A- → A- → **A-/A.**


