# Inkwood — Persona Review Panel

Six specialist perspectives on the current state of Inkwood, a cozy typing puzzle (Vite/React/TypeScript/SVG) with 10 levels across 4 acts. Thematic watchwords: **numinous** and **nourishing**.

*Last updated after alpha testing round 2.*

---

## 1. Code Reviewer

**Role:** Correctness, performance, React patterns, SVG rendering efficiency.

### Assessment

The codebase is compact and readable. Zustand store is well-structured, component decomposition is clean, and the scene architecture (`progress: number` driving everything) is elegant. Key issues remain around rendering performance.

| Issue | Location | Status |
|---|---|---|
| RAF loop calls `setTime()` every frame (~60 Hz state updates) | `IntroSequence.tsx`, `OutroSequence.tsx` | **Open** — triggers full React reconciliation per frame for 15-28 seconds |
| Scene components are not wrapped in `React.memo` | `scenes/*.tsx` | **Open** — every keystroke re-renders the entire SVG tree |
| Store mixes derived functions with state | `store.ts:17-23` | **Open** — selectors can't skip renders for derived values |
| Completion timer uses `completingRef` guard for strict-mode | `PlayingScreen.tsx:40-48` | OK — works, intent is documented |
| SVG filter stack can compound on low-end GPUs | `svg/filters.tsx` | **Open** — untested on real devices |

### Top Priorities

1. **`React.memo`** on every scene component — keystrokes should only re-render when `progress` materially changes.
2. **Throttle RAF** in intro/outro to ~15 Hz, or use CSS animations for time-driven opacity.
3. **Profile SVG filters** on a real budget device. Set a budget: max 2 filters per scene.

---

## 2. Narrative Director

**Role:** Story arc, flavor text, typed phrases, mystical tone.

### Assessment

Text trimming in round 2 was a major improvement. Win texts are now punchy ("The nexus breathes." / "All one."). Flavor text is one sentence max. The game feels more numinous with less words.

| Level | Prompt ↔ Visual Alignment | Status |
|---|---|---|
| Garden | **Weak** — "warm summer rain" but `GardenScene` has rain that fades quickly; flowers are the real visual | **Needs fix** |
| Cottage | Good — "little candle burn bright" maps to candle lighting | OK |
| Night Sky | Good — "Orion Vega Sirius Lyra" names stars as they appear | OK |
| Dry Well | Good — "deep water remember your name" while water rises | OK |
| Bridge | OK — "spirits still walk" but no visible spirits during that phrase | **Could improve** |
| Library | OK — "let wisdom rise" while books float, but feels generic | **Could improve** |
| Stones | **Strong** — "stand tall again" → stones rise; "circle remembers" → ley lines | Model for others |
| Sanctum | **Strong** — moonbeams + spirits match both phrases perfectly | Model for others |
| Great Tree | **Strong** — three prompts build roots, branches, full radiance | Best pacing |
| Waking World | OK — callback phrases are nice but feel like summary | **Could improve** |

**Outro** currently has zero text — just dots and "Begin Again." The animation should speak for itself, but one poetic line (not a paragraph) would give emotional closure. Something like: *"The forest remembers."*

### Top Priorities

1. Fix Garden prompt: change "warm summer rain" to something that matches the flower-growth visual, or make rain a more prominent animation phase.
2. Add a single closing line to the outro.
3. Strengthen Bridge/Library/World prompts to be more visually specific.

---

## 3. UX Researcher

**Role:** Discoverability, flow state, accessibility.

### Assessment

Round 2 fixed several critical issues: keyboard navigation (space/enter on all screens), intro skip, text contrast. The golden pulse on the prompt box is an effective attention draw. Stacked layout ensures the scene is always visible.

| Finding | Severity | Status |
|---|---|---|
| Mobile keyboard may never appear (programmatic `.focus()` blocked) | Critical | **Open** |
| "tap to skip" on intro is wrong word on desktop | Medium | **Open** — should say "press any key" on desktop |
| ~~Hands must leave keyboard to click Continue~~ | ~~High~~ | **Fixed** — space/enter now works |
| ~~Text too dark to read~~ | ~~High~~ | **Fixed** — contrast bumped |
| ~~Typing area covering the scene~~ | ~~High~~ | **Fixed** — stacked layout |
| No pause, no back, no level revisit | Medium | **Open** |
| No ARIA labels on prompt or progress indicators | Low | **Open** |
| Color-only error indication (red for mistype) | Low | **Open** |

### Top Priorities

1. **Mobile keyboard focus**: Add a visible "Tap to begin" overlay on first `playing` screen entry, wired to a real touch event that calls `.focus()`.
2. Adaptive skip hint: "press any key" on desktop, "tap to skip" on mobile.
3. Add `aria-label` to prompt box and progress indicators.

---

## 4. Design Director

**Role:** Visual quality, animation polish. Does this dazzle?

### Assessment

The scene quality gap is the biggest design problem. `StonesScene`, `SanctumScene`, and `TreeScene` are genuinely atmospheric — organic shapes, staggered reveals, filter-driven glow. Meanwhile `CottageScene` and `LibraryScene` feel like diagrams.

**What works:**
- Stones — 7-stone perspective arc with bezier shapes, rune glyphs, ley-line animation
- Sanctum — moonbeam pooling, hand-drawn forest framing, translucent spirit bezier figures
- Tree — three-phase build with ley glow through roots, crown radiance
- Intro vignettes — moody, properly dark-but-visible after round 2 fix
- Golden pulse on prompt box — effective, subtle, on-brand

**What needs work:**
- **Cottage** — flat rectangles, basic window cross, cat is just circles. Needs organic warmth, wood texture, firelight play on surfaces.
- **Library** — the user specifically asked for it to feel "sacred, powerful, controlled." Currently it's rectangles floating. Needs: vaulted ceiling, crystalline light, reverence.
- **Outro** — circles-and-lines network diagram where there should be a living landscape. This is the last thing the player sees.
- **No ambient motion** — scenes are dead until the player types. Subtle idle animation (parallax drift, particle float, gentle color breathing) would make the world feel alive.

### Top Priorities

1. **Rebuild Cottage and Library** to match Stones/Sanctum quality standard.
2. **Redesign outro** as a visual showpiece — not abstract, but painterly.
3. **Add ambient idle motion** to all scenes — the world should breathe even when the player pauses.

---

## 5. Product Lead

**Role:** Prioritization, creative trade-offs, user delight as north star.

### Assessment

The game is significantly improved after round 2: keyboard flow, text economy, visible intro, stacked layout. The core experience when it works (Stones, Sanctum, Tree) is genuinely moving. The problem is inconsistency — three great levels, four good levels, three forgettable ones.

**Remaining risks:**

| Risk | Impact | Mitigation |
|---|---|---|
| Level quality gap | Players disengage mid-game, never reach best content | Rebuild Cottage + Library before any new features |
| No save state | 20-min game with no resume is hostile | `localStorage` save (lvl + promptIdx), small effort |
| Mobile broken | Can't ship to mobile without keyboard fix | Test + fix before any public release |
| Outro flat | Last impression is the weakest | One poetic line + visual redesign |
| Untested performance | SVG filters may destroy frame rate on budget devices | Test on 3 real devices |

**What NOT to build yet:** Audio, level select, achievements, sharing, difficulty tiers. Foundation first.

### Top Priorities

1. **Quality parity**: Cottage and Library rebuild.
2. **Save/resume** via `localStorage`.
3. **Mobile keyboard fix** — gate any public release on this.

---

## 6. Alpha Tester Panel

**Role:** Composite user testing across skill, device, and patience spectrums.

### Profiles

| Tester | Device | Typing Speed | Style |
|---|---|---|---|
| Alex | Desktop, Chrome | 90+ WPM | Fast, competitive |
| Bea | iPhone SE, Safari | 30 WPM | Non-gamer, curious |
| Cal | Desktop, Firefox | 50 WPM | Patient, art-lover |
| Dana | Android tablet | 60 WPM | Impatient, low attention |

### Session Notes (Round 2)

**Alex (fast typist):** The golden pulse drew his eye. He started typing immediately — but blew through each prompt so fast the animations blurred past. The 700ms completion delay is the only breathing room and it's not enough. Said: "I wish I could see what I just did." Wants a 1-2 second hold between prompts.

**Bea (phone):** Still can't reliably trigger the keyboard. On iOS Safari, the hidden input doesn't receive focus from programmatic `.focus()`. She tapped the golden-pulsing prompt box and nothing happened. This is a blocker.

**Cal (patient explorer):** Much happier with the stacked layout — scene is fully visible. Loved the trimmed text. Said the Stones level was "meditative." Was disappointed the outro was just dots and a button. Wants to linger on completed scenes. Keyboard advance (space/enter) was "perfect."

**Dana (impatient):** Pressed Enter to skip intro immediately (keyboard nav works!). Got through 4 levels in 3 minutes. Closed the tab, came back, had to start over. Said: "This is pretty but I don't have time to replay it."

### Top Priorities

1. **Breathing pause** (1-2s) between prompts so fast typists see what they earned.
2. **Mobile keyboard fix** — visible tap target.
3. **`localStorage` save** — Dana will never finish without it.
4. **Scene linger** — brief (3s) non-interactive hold on completed scenes before win overlay.

---

## Summary: Priority Stack

| # | Priority | Owner | Effort | Status |
|---|---|---|---|---|
| 1 | ~~Fix mobile keyboard focus~~ | ~~UX / Code~~ | ~~Small~~ | **Done** — tap overlay + onFocus/onBlur |
| 2 | ~~`React.memo` on scene components~~ | ~~Code~~ | ~~Small~~ | **Done** — all 10 scenes wrapped |
| 3 | ~~Save/resume via `localStorage`~~ | ~~Product / Code~~ | ~~Small~~ | **Done** — persists lvl + promptIdx |
| 4 | ~~Breathing pause between prompts~~ | ~~UX / Code~~ | ~~Small~~ | **Done** — 1.5s delay |
| 5 | ~~Rebuild Cottage scene~~ | ~~Design~~ | ~~Large~~ | **Done** — bezier walls, tapered flames, organic cat |
| 6 | ~~Rebuild Library scene~~ | ~~Design~~ | ~~Large~~ | **Done** — vaulted ceiling, crystals, Chronicle tome |
| 7 | ~~Fix Garden prompt alignment~~ | ~~Narrative~~ | ~~Small~~ | **Done** — "green returns to sleeping roots" |
| 8 | ~~Add poetic line to outro~~ | ~~Narrative~~ | ~~Small~~ | **Done** — "The forest remembers." |
| 9 | ~~Throttle RAF in intro/outro~~ | ~~Code~~ | ~~Small~~ | **Done** — ~15Hz |
| 10 | ~~Redesign outro as showpiece~~ | ~~Design~~ | ~~Large~~ | **Done** — panoramic landscape with vignettes |
| 11 | ~~Add ambient idle motion~~ | ~~Design~~ | ~~Medium~~ | **Done** — CSS brightness/saturation breath |
| 12 | Performance test on real devices | Product | Medium | **Open** |
| — | ~~Keyboard navigation (space/enter)~~ | ~~UX~~ | ~~Small~~ | **Done** |
| — | ~~Text contrast / WCAG compliance~~ | ~~Design~~ | ~~Small~~ | **Done** |
| — | ~~Intro visibility (too dark)~~ | ~~Design~~ | ~~Small~~ | **Done** |
| — | ~~Layout: scene covered by typing area~~ | ~~UX~~ | ~~Medium~~ | **Done** |
| — | ~~Trim flavor/win text~~ | ~~Narrative~~ | ~~Small~~ | **Done** |
| — | ~~Level title flash during transitions~~ | ~~Code~~ | ~~Small~~ | **Done** |
