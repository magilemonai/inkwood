# Inkwood — Persona Review Panel v12

Date: 2026-04-12
Trigger: Cody's live alpha test on ThinkPad/Chrome, transcribed. Weighted heavily (director voice) and pressure-tested through the six personas + code read of the implicated files.

---

## 0. Cody's Alpha Test — Raw Findings (tabulated)

| # | Scene / Area | Observation | Cody's ask |
|---|---|---|---|
| C1 | Intro / idle | After click-to-begin, if player does nothing for ~1s, nothing nudges them | Something should glow or escalate ("Type the phrase above") after brief inactivity |
| C2 | Garden | Clouds don't drift | Animate cloud motion |
| C3 | Cottage | Cat silhouette still reads as "off" | Another pass, use reference |
| C4 | Cottage | Candles show a rectangular glow box (filter bounds visible) | Kill the rectangle — soft falloff only |
| C5 | **Global gameplay** | **Typing gibberish still advances the animation.** Player is "rewarded" without getting the phrase right | Wrong keys must NOT advance. Backspace still allowed. |
| C6 | Stars | Rectangular box of diffusion around the moon reveals the dark crescent-forming circle | Fix moon glow compositing — no visible filter bounds |
| C7 | Stars | Rightmost constellation line crosses in front of the moon at 99% | Reorder so lines never pass over the moon disc |
| C8 | Stars | Meteors + interstitial | ✅ "Don't ever touch this" |
| C9 | Well | Punctuation — "deep water, remember your name" feels right | Full comma audit across all 20 prompts |
| C10 | Well | Second half: central water column "shoots up" like a rectangle, no containment | Kill the rectangular surge; water needs to feel held |
| C11 | Well | Runes sweep downstream — reads cheesy | Replace flow animation with runes that glow **in place** on the well stones |
| C12 | Bridge | Whole level | ✅ Solid |
| C13 | Library | Open book is squatter than wide at every stage | Book must be taller than wide at all stages |
| C14 | Library | Phase-2 books opening + runes flying | ✅ Awesome |
| C15 | Stones | "stand tall again, guardians of old" wants a comma | Apply in prompt audit |
| C16 | Stones | Animation | ✅ Really solid |
| C17 | Sanctum | Whole level | ✅ Love it, perfect |
| C18 | Tree | During "branches wider than sky" the branches appear bare before canopy — disliked | Canopy must fade in **with** branches, not after |
| C19 | Tree | Restoration / heart phase | ✅ Solid |
| C20 | Outro | During "stars remember, spirits sing" nothing references the sanctum spirits | Add 3 spirit figures on the far hill among trees |
| C21 | Outro | During "the ancient order is restored" the standing-stone guardians should return to the forest as nexuses spin up | Stone guardians visible during unity phase |
| C22 | Outro | The 8th / far-right vignette is just trees | Needs spirit icons (sanctum signature) |
| C23 | Outro | "The forest remembers" text sits inside the tree trunk; "Begin Again" collides too | Tree (and all tree content) shifts up; text reads in the clear |

"These are all tweaks, but it's awesome. Pretty proud of this." — Cody

---

## 1. Code Reviewer — Pressure Test

**C5 (wrong typing advances animation) is not polish — it's a correctness bug against the game's central contract.**

The root cause is in `src/store.ts` at `typeChar`:

```ts
typeChar: (value) => {
  const { completing } = get();
  const target = get().target();
  if (completing) return;
  if (value.length <= target.length) {
    set({ typed: value });           // accepts ANY characters
  }
},
```

And `src/store.ts` `levelProgress` drives scene progress off `typed.length`, not correctness:

```ts
const promptProgress = typed.length / target.length;
```

So every keystroke — right or wrong — advances the scene. The fix is a small, surgical change: gate forward motion on correctness, but still allow backspace/shortening so players can correct mistakes.

Recommended diff (conceptual):

```ts
typeChar: (value) => {
  const { typed, completing } = get();
  const target = get().target();
  if (completing) return;
  // Backspace / shortening always allowed
  if (value.length < typed.length) { set({ typed: value }); return; }
  // Forward motion only on a correct next character
  if (value.length > typed.length) {
    const nextChar = value[value.length - 1];
    const expected = target[typed.length];
    if (nextChar === expected) set({ typed: value });
    // else: drop the keystroke — scene stays put
  }
},
```

Side effects to handle:
- `playTypeClick()` in PlayingScreen fires for *any* new char. Move it so it plays only on accepted input — or add a distinct muted "wrong key" tick.
- `charStates` / the red "backspace to correct" hint becomes rarely triggered (because rejected keystrokes never reach state). Keep the hint but it will read less often — that's fine.
- Progress quantization + memo stays correct because `typed` won't advance.

Other Cody items are mostly art/animation work in scene files. No architectural concerns.

**Dead-code cleanup** from v11 (TitleScreen, GameWinScreen, palettes.ts, scenes/index.ts, unused primitives.tsx exports) is still outstanding but not the priority this round.

---

## 2. Narrative Director — Pressure Test

Cody's C5 isn't just a bug — it's a thematic restoration. The game's pitch is "typed words are incantations the world obeys." If gibberish summons the same magic, the metaphor is dead. Fixing C5 lifts every prompt's rating because the words finally *cost* something.

**Comma audit (C9/C15).** Half the prompts use vocative commas, half don't. Recommended normalized set:

| Lvl | Prompt | Current | Proposed |
|---|---|---|---|
| Garden | p1 | "wake now, sleeping roots" | unchanged ✓ |
| Garden | p2 | "bloom, every waiting flower" | unchanged ✓ |
| Cottage | p1 | "little candle burn bright" | **"little candle, burn bright"** |
| Cottage | p2 | "fill every room with warmth" | unchanged (no vocative) |
| Stars | p1 | "Orion Vega Sirius Lyra" | unchanged (names) |
| Stars | p2 | "burn again with ancient fire" | unchanged |
| Well | p1 | "deep water remember your name" | **"deep water, remember your name"** |
| Well | p2 | "rise and carry the old songs home" | unchanged |
| Bridge | p1 | "stone, recall the crossing" | unchanged ✓ |
| Bridge | p2 | "spirits, walk the old paths" | unchanged ✓ |
| Library | p1 | "open, sleeping pages" | unchanged ✓ |
| Library | p2 | "speak again, forgotten words" | unchanged ✓ |
| Stones | p1 | "stand tall again guardians of old" | **"stand tall again, guardians of old"** |
| Stones | p2 | "remember what was promised" | unchanged |
| Sanctum | p1 | "moonlight, gather where spirits convene" | unchanged ✓ |
| Sanctum | p2 | "return to your seats, ancient ones" | unchanged ✓ |
| Tree | p1 | "roots deeper than memory" | unchanged (descriptive) |
| Tree | p2 | "branches wider than sky" | unchanged |
| Tree | p3 | "awaken, heart of all things" | unchanged ✓ |
| World | p1-3 | existing | unchanged ✓ |

Rule the comma follows: **vocative address** (speaking TO something — "stand tall again, *guardians*") gets a comma; descriptive predicates don't. Applying this uncovers exactly the three Cody called out.

**Outro callbacks (C20/C21/C22):** Today the outro's skyP wisps are colored `#d0b870` (sanctum yellow) and the standing-stones silhouette only appears in skyP on the right edge. Cody is right that the three unity-phase beats don't land as "spirits sing" or "ancient order restored" — nothing visually sings, nothing visually stands. Promoting spirit figures + stone guardians into the WorldScene is a legitimate narrative requirement, not a nice-to-have.

---

## 3. UX Researcher — Pressure Test

**C1 (idle nudge).** The prompt box already pulses via `promptBoxPulsing` while `typed.length === 0`, and the sub-info says "type the phrase above." Cody still didn't feel nudged — which means the existing pulse is too subtle at first impression. Two cheap escalations:
- After ~2.5s of no input on the first prompt of a level, raise the pulse amplitude and/or add a second "↓ type here" glyph near the cursor.
- On subsequent prompts, the existing pulse is fine (player is in flow).

**C5 ripple effects for UX:** Once wrong keys are rejected, new players may momentarily think the keyboard "isn't working." Mitigations: keep the on-screen target visible with cursor at the current expected character (already present); optionally flash the expected character subtly on a rejected keystroke. Low priority — most players will self-correct immediately when they see the cursor isn't moving.

**C23 (outro text/tree overlap).** Confirmed from code: `textOverlay` sits at `bottom: 3rem` absolute; trunk path extends to y=220 of a 260 viewBox; on a typical landscape viewport the trunk's lower half and the "The forest remembers." body text occupy the same band. Fix = shift the tree group up ~20-30 units (viewBox coords) **and** raise the text overlay's bottom offset so it lives cleanly below the tree silhouette.

---

## 4. Design Director — Pressure Test

Grading the items Cody flagged as faults:

| Item | Current grade | Why |
|---|---|---|
| C4 Cottage candle glow box | **C** | Visible filter-bounds rectangle in the dark room — gold-standard scenes don't leak their filters |
| C6 Stars moon glow box | **C+** | Same failure on the A-scene's signature element. Single most visible blemish in the game |
| C7 Stars constellation over moon | **B-** | Physics violation that breaks the "map in the sky" read |
| C10 Well central column | **C** | "Rectangle filling" is exactly the v11 note. Needs containment — narrower shaft visibility + subtle meniscus |
| C11 Well flowing runes | **C** | Cheesy motion; the prompt says "carry the old songs home" but visual is literal rune-pinballs. In-place glow reads as "remembered" and supports the prompt better |
| C13 Library tome squat | **B-** | Currently ~50w × 34h post-spread. Books in real iconography are portrait. Flip to ~34w × 50h |
| C18 Tree bare-branches window | **B** | Narrative mismatch — branch-only reads as winter. Canopy should enter at 50-60% of branch phase, not wait for heart phase |
| C23 Outro composition | **C+** | The finale's hero shot has a type collision. Fixable with vertical shift |
| C2 Garden stationary clouds | **B+** | Minor; clouds are small but static animation stands out |
| C3 Cottage cat | **B** | Director has rejected it 5x already; trust the director |

**Biggest wins, ranked visually:** C6 (moon glow) and C23 (outro composition) are the two highest-leverage fixes — both affect "signature" moments players screenshot.

---

## 5. Product Lead — Pressure Test

Treat this as the **pre-public-release hardening pass**, not polish. Only C5 is an actual gameplay integrity bug; everything else is visual truth-telling.

- **Ship blockers (must fix):** C5, C23, C6.
- **Brand-defining (should fix this pass):** C10/C11 (Well second half), C18 (Tree canopy timing), C20/C21/C22 (outro callbacks).
- **Polish (nice-to-haves this pass):** C4, C7, C9/C15, C13, C2, C1.
- **Keep as-is (deferred):** C3 cat (6th pass needs dedicated session with reference image), dead-code cleanup (still on the queue, still not a blocker).

Nothing on this list is architectural. Total surface area = `store.ts` (~10 lines), `levels.ts` (3 prompts), 6 scene files, 1 outro component.

---

## 6. Alpha Tester Panel — Pressure Test

- **Cal** (patient explorer): "Cody found the moon glow box and the well column — I'd have found those on run two. The bare-branches moment did feel strange; I was waiting for leaves."
- **Alex** (fast typist): "Wait — I can just mash? That's the one that actually bugs me. Once I *know* I can mash, I lose all respect for the typing. Fix that first."
- **Dana** (impatient): "I want the outro to feel like a payoff. Right now the last screen has text sitting inside a tree trunk. That's a design bug, not a vibe."
- **Sam** (non-gamer on phone): "The idle nudge thing Cody mentioned would've helped me on mobile too — I sat there for 3 seconds not sure what happened after 'Begin.'"

Panel converges on the same three: C5 > C23 > C6/C10/C11 cluster.

---

## Priority Stack — v12 (Alpha-Test Driven)

Weighting: Cody's voice dominates ordering; persona pressure-test shapes grouping and rationale. "Cody-✓" means Cody called it out directly. All items are Cody's except where noted.

### P0 — Gameplay integrity (ship blocker)

| # | Item | Impact | Effort | Files |
|---|---|---|---|---|
| 1 | **Reject wrong keystrokes** — typing incorrect chars must not advance `typed` / scene progress. Backspace always allowed. (Cody-✓ C5) | Critical | S | `src/store.ts` (`typeChar`), `src/components/PlayingScreen.tsx` (`playTypeClick` gating) |

### P1 — Outro finale (signature moment)

| # | Item | Impact | Effort | Files |
|---|---|---|---|---|
| 2 | **Shift outro tree + content up** so "The forest remembers." and "Begin Again" never overlap the trunk or canopy. (Cody-✓ C23) | High | S | `src/components/OutroSequence.tsx`, `src/styles/Outro.module.css` |
| 3 | **Add 3 spirit figures on the far hill during "stars remember, spirits sing"** — the sanctum's signature visible in the panorama. (Cody-✓ C20) | High | S | `src/scenes/WorldScene.tsx` (skyP phase) |
| 4 | **Bring stone guardians back into the forest during "the ancient order is restored"** — standing-stone silhouettes rise as nexuses spin up. (Cody-✓ C21) | High | S | `src/scenes/WorldScene.tsx` (unityP phase — currently stones live in skyP and are tiny) |
| 5 | **Outro far-right Sanctum vignette needs spirit icons** — currently reads as just trees. (Cody-✓ C22) | High | S | `src/components/OutroSequence.tsx` (Sanctum vignette block) |

### P2 — Scene truth-telling (visible blemishes on gold-standard scenes)

| # | Item | Impact | Effort | Files |
|---|---|---|---|---|
| 6 | **Kill the moon's rectangular glow box** — `GlowFilter` bounds are showing behind the bright disc, exposing the dark crescent-forming circle. Use a soft radial gradient underlay instead of an SVG filter on the lit disc. (Cody-✓ C6) | High | S | `src/scenes/StarScene.tsx` |
| 7 | **Constellation lines must not cross the moon disc.** Reroute or drop any line whose segment intersects the moon circle at (320, moonY, r=18). (Cody-✓ C7) | Medium | S | `src/scenes/StarScene.tsx` (CONSTELLATIONS array — prune [7,20] or reroute) |
| 8 | **Well second half: contain the rising water** — the central shaft currently reads as a rectangle shooting up. Add a visible shaft edge / meniscus / column darker at the bounds so water feels held, not extruded. (Cody-✓ C10) | High | M | `src/scenes/WellScene.tsx` |
| 9 | **Well runes: replace "sweep downstream" with "glow in place"** — runes should activate/pulse on the cavern stones near the water rather than flying along the river. (Cody-✓ C11) | High | S | `src/scenes/WellScene.tsx` (remove `flowRunes`, expand `wallRunes` count + choreography) |
| 10 | **Tree canopy fades in WITH branches.** During branchPhase the canopy should begin to appear (start ~0.3 of branchPhase), not wait for heartPhase. Bare-branch window = 0. (Cody-✓ C18) | High | S | `src/scenes/TreeScene.tsx` |
| 11 | **Cottage candles: kill the rectangular glow box.** Swap the GlowFilter on flames for a radial gradient pool or widen filter region so bounds aren't visible in the dark room. (Cody-✓ C4) | Medium | S | `src/scenes/CottageScene.tsx` (`flameGlow` / `flameCore`) |
| 12 | **Library hero tome: taller than wide at every stage.** Flip current ~52×34 to ~34×52 (portrait). Adjust spread geometry + pedestal accordingly. (Cody-✓ C13) | Medium | M | `src/scenes/LibraryScene.tsx` (HERO TOME block ~L299-352) |

### P3 — Narrative + animation polish

| # | Item | Impact | Effort | Files |
|---|---|---|---|---|
| 13 | **Comma audit** — apply 3 targeted edits: `"little candle, burn bright"`, `"deep water, remember your name"`, `"stand tall again, guardians of old"`. (Cody-✓ C9/C15) | Medium | XS | `src/levels.ts` |
| 14 | **Animate garden clouds** — horizontal drift on the three cloud ellipses. (Cody-✓ C2) | Low | XS | `src/scenes/GardenScene.tsx` |
| 15 | **Idle nudge escalation** — after ~2.5s of no input on a fresh prompt, amplify the pulse and/or add a "↓" glyph near the cursor. (Cody-✓ C1) | Low | S | `src/components/PlayingScreen.tsx`, `styles/PlayingScreen.module.css` |

### Deferred (explicitly, with justification)

| Item | Why deferred |
|---|---|
| Cottage cat (Cody-✓ C3) | 6th iteration requires a dedicated session with a reference silhouette; batching with one-off tweaks dilutes it |
| Dead-code cleanup (Code Reviewer) | Not a player-visible issue; safe to bundle with a later cleanup pass |
| Audio preload, act-transition skip affordance (UX Researcher v11) | Unchanged from v11 — nothing in this alpha run flagged them |

---

## Implementation Notes (for whoever picks this up)

**#1 — Wrong-key rejection.** See the `typeChar` patch in §1. Also in `PlayingScreen.handleType`, only call `playTypeClick()` when the store actually accepted the keystroke (compare `typed.length` before/after, or have the store return a boolean). Consider a very quiet tick on rejection so the input doesn't feel dead — optional.

**#2 — Outro shift.** Two moves: (a) in `OutroSequence.tsx` translate the whole tree group up ~25 viewBox units (change trunk `M202 220 → M202 195`, branches + canopy + roots shift accordingly), and (b) in `Outro.module.css` raise `.textOverlay { bottom: 3rem → 5rem }`. Verify with screenshot at 20s, 22s, 24s.

**#3 — Spirits on far hill (WorldScene).** In the skyP block (~L306-322) adjacent to the wisps, add 3 small spirit figures (translucent upright silhouettes with a tiny head halo, referencing Sanctum's composition) anchored on the HILLS_FAR ridge near y≈95, spread across x=140-260. Reuse sanctum accent `#d0b870`.

**#4 — Stone guardians in unity phase.** Currently at `skyP > 0.4` a small 4-stone row is drawn on the right edge (`x=335-365`). Move/duplicate into the unity phase: 4-5 standing stones rising on the ground foreground across x=60-340 during `unityP > 0.1`, so they appear as the ley lines are drawn. Taller than the current 8-12px — aim 15-22px.

**#5 — Sanctum vignette (outro).** In `OutroSequence.tsx` the Sanctum vignette block (~L404-438) renders moonbeams only. Add 3 tiny spirit silhouettes at the clearing's base (v.x ± 6, y≈150), same halo motif as #3. Small — ~3-4px tall.

**#6 — Moon glow box.** Root cause: `<circle ... filter="url(#moonGlow)" />` applies a filter region that renders a visible bounding rectangle against the near-black sky. Replace with: a soft radial gradient disc (already have `moonRadial` — increase its contribution) **and** remove `filter="url(#moonGlow)"` from the bright disc. The crescent-forming dark circle should color-match the sky at that y exactly so it disappears; currently `fill="hsl(228, 50%, ...)"` with lightness drifting — lock it to the actual rendered sky color at moonY.

**#7 — Constellations and moon.** In `CONSTELLATIONS`, pairs that involve star index 7 (x=355, y=50) pass near the moon at (320, moonY≈45). Simplest fix: drop `[12, 7]` and `[7, 20]`, add a replacement pair that doesn't cross the moon (e.g., `[7, 14]` — star 14 is at x=390, y=60, a clean arc away from the moon).

**#8 — Well containment.** The central shaft rect at x=140 w=120 renders the whole channel as a solid color block. Options: (a) narrow the "visible column" to x=175-225 (matches the well shaft above) with darker side channels, (b) add a subtle inner shadow on the shaft walls, (c) clamp the visual water rise to a slower curve (easeOut) so it doesn't snap up. Combine all three.

**#9 — Wall runes in place.** Remove the `flowRunes` array entirely. Expand `wallRunes` to ~10 positions distributed along the cavern walls at the actual waterline range (y=135-205). Each rune fades in as water reaches its y (current `wet` check is right), then pulses gently instead of translating.

**#10 — Tree canopy with branches.** Currently `heartPhase = sub(p, 0.66, 0.34)` gates the canopy. Introduce a separate `canopyEarly = sub(p, 0.45, 0.55)` (starts mid-branch phase, ends at 1.0) and drive the canopy opacity off that at reduced strength (~0.5), then layer the existing heartPhase canopy on top for the climactic bloom.

**#11 — Cottage candle glow.** `GlowFilter` in `svg/filters.tsx` likely uses a default `filterUnits` that clips. Either widen x/y/width/height on the filter to `-50% -50% 200% 200%`, or replace the filter with a soft `<radialGradient>` pool centered on each flame.

**#12 — Library tome flip.** Swap the hero tome dimensions: spine currently `x=197 y=120 w=6 h=34`. Change to `x=197 y=108 w=6 h=52`. Pages spread width `pageW = spread * 45` → `pageW = spread * 32`. Book glow ellipse rx/ry flip. Pedestal widens slightly to support the taller book.

**#13 — Prompt commas.** Three one-character edits in `src/levels.ts`. Run the full test after — scene timing keys off length-ratio, so a single comma doesn't break alignment, but worth eyeballing.

**#14 — Cloud drift.** Inline `<style>` already exists in StarScene for parallax keyframes; mirror that pattern in GardenScene with a slow `translateX(-8px)` 20s cloud drift.

**#15 — Idle nudge.** Add an `idleMs` state tracked with a timer reset on each keystroke. When `idleMs > 2500 && typed.length === 0`, apply an `.idleNudge` class to the prompt box that raises pulse amplitude and fades in a small `↓` above the cursor.

---

## Session Summary

v12 is Cody-driven: a live alpha-test transcript re-sorted into a 15-item stack with one P0 gameplay-integrity fix, four outro-finale items, six scene truth-tellings, and four narrative/animation polish items. The C3 cat and v11's dead-code cleanup remain deferred — not because they don't matter, but because batching them dilutes the work that actually moves the needle for a public ship.

Biggest single lift: fixing `typeChar` so the central metaphor holds. Biggest single visible win: the outro finale, which is where people will screenshot and which currently has a type-on-trunk collision.



