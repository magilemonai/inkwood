# Inkwood — Persona Review Panel v6

Fresh critique based on full visual review of all 10 scenes at 10% progress increments, plus code review. April 2026.

---

## 1. Code Reviewer

### Assessment

Codebase is clean and stable. No blocking bugs. A few things to tighten before public release.

| Strength | Notes |
|---|---|
| Progress quantization + React.memo | Scenes skip re-renders correctly |
| Error boundary around scenes | Safety net works |
| localStorage save/resume | Persists and clears correctly |
| useCompletionTimer strict-mode guard | Correct pattern |
| Store architecture (Zustand) | Clean derived helpers, good separation |

| Issue | Severity | Notes |
|---|---|---|
| Dev panel (F2) in production builds | Medium | Must gate behind URL param before public release |
| `inkwood.tsx` (1117 lines) in root | Low | Legacy single-file version. Dead code. Delete it. |
| `svg/palettes.ts` only covers 3 scenes | Low | 7 scenes hardcode colors. Either expand or remove the abstraction |
| `TitleScreen.module.css` orphaned | Low | No matching component exists |
| `WinScreens.module.css` has unused classes | Low | `.gameWinHeading`, `.dotRow`, `.logo` etc. never referenced |
| PlayingScreen `getCharStates()` not memoized | Low | Recalculates every render, but it's cheap |
| No ARIA labels on hidden input | Low | Accessibility gap for screen readers |
| No tests exist | Low | Playwright installed but unused |

### Verdict
Code is not the bottleneck. Art and animation quality are. Ship-ready for alpha after gating the dev panel.

---

## 2. Narrative Director

### Prompt Ratings

| Level | Prompts | Spell Power | Prompt-to-Visual Alignment |
|---|---|---|---|
| Garden | "wake now, sleeping roots" / "bloom, every waiting flower" | 4/5 | **Decent** — roots don't visibly wake, but canopy + flowers do respond |
| Cottage | "little candle burn bright" / "fill every room with warmth" | 5/5 | **Strong** — candles light one by one, warmth floods in |
| Stars | "Orion Vega Sirius Lyra" / "burn again with ancient fire" | 5/5 | **Strong** — stars appear, constellations draw themselves |
| Well | "deep water remember your name" / "rise and carry the old songs home" | 5/5 | **Excellent** — water rises, runes flow downstream |
| Bridge | "stone, recall the crossing" / "spirits, walk the old paths" | 5/5 | **Excellent** — stones assemble, footprints walk |
| Library | "open, sleeping pages" / "speak again, forgotten words" | 4/5 | **Good** — books float, tome glows, but "sleeping pages" opening isn't literal enough |
| Stones | "stand tall again guardians of old" / "remember what was promised" | 5/5 | **Excellent** — stones rise, ley lines connect. Best prompt-to-visual in the game. |
| Sanctum | "moonlight, gather where spirits convene" / "return to your seats, ancient ones" | 4/5 | **Good** — moon appears, spirits materialize. "Return to your seats" is slightly awkward. |
| Tree | "roots deeper than memory" / "branches wider than sky" / "awaken, heart of all things" | 5/5 | **Strong** — three-phase matches three prompts. Roots glow, branches spread, canopy blooms. |
| World | "garden bloom, hearth burn bright" / "stars remember, spirits sing" / "the ancient order is restored" | 4/5 | **OK** — nodes light up, but the connection to the specific words is abstract. Typing "garden bloom" should make you SEE the garden, not a dot. |

**Average: 4.6/5.** Prompts are strong across the board. The weak link is World — the finale's prompts reference specific scenes but the visuals show abstract nodes instead of those scenes. This is the biggest narrative missed opportunity.

### Story Arc
The four-act structure works. Awakening → Discovery → Nexus → Restoration is a clean escalation. The win text is appropriately terse. No changes needed to the narrative structure itself.

---

## 3. UX Researcher

### Assessment

| Finding | Status |
|---|---|
| First-time player experience | **Problem** — Garden 0-15% progress looks identical. You type 3+ words before anything visibly changes. First impression is "is this broken?" |
| Typing overlay visibility | Good — prompt text is clear, char states visible |
| 1.5s breathing pause | Perfect — rewards watching the animation |
| Save/resume | Works correctly |
| Mobile keyboard | **Unknown** — never tested on real devices |
| "type the phrase above" hint | Good for first-timers, doesn't overstay |
| Progress dots in header | Subtle but effective |
| Scene transitions (Framer Motion) | Smooth |
| Dev panel in production | Must be hidden before public release |

### Critical UX Issue: Animation Pacing

Several scenes have a **dead zone** at 0-10% where typing produces no visible change:
- **Garden:** 0-15% — nothing moves
- **Stones:** 0-10% — empty field, stones haven't started rising
- **World:** 0-10% — just scattered particles, no nodes yet

Compare to the Well and Bridge, where typing immediately produces visible change (water starts rising, mist starts parting). The difference in felt responsiveness is dramatic.

**Recommendation:** Every scene should have something visibly respond within the first 5% of progress. Even a color shift, a glow, a slight movement. The player needs to know their typing is doing something.

### Accessibility Gaps
- Hidden input has no ARIA label
- No focus-visible styles
- No reduced-motion support
- Skip hint says "tap to skip" on desktop (should be device-aware)

---

## 4. Design Director

### Scene Grades

| Scene | Grade | Dormant State (0%) | Transformation | Final State (99%) | Animation Pacing |
|---|---|---|---|---|---|
| **Garden** | **B** | Good — bare tree has character | Canopy covers branches, flowers bloom | Pleasant but not breathtaking | Slow start (0-15% dead), fast middle |
| **Cottage** | **B+** | Excellent — cold blue room, lonely | Temperature shift is the best color work in the game | Warm, alive, the cat reads well | Good — candles light sequentially |
| **Stars** | **B+** | Good — dark sky with faint dots | Moon, stars, constellations draw in | Beautiful — comets in final 10% are great | Good — steady build |
| **Well** | **A-** | Excellent — dry underground cross-section | Water rising is inherently dramatic | Runes flowing downstream — best visual storytelling | Excellent — immediate response |
| **Bridge** | **B+** | Excellent — two broken cliffs, pure absence | Stones assembling is the most dramatic moment | Spirit lanterns + footprints — evocative | Good — stones appear steadily |
| **Library** | **B-** | Atmospheric — dark cavern with bookshelves | Books float, crystals grow, tome glows | Decent but noisy — too many competing textures | OK — the parallax rock texture is distracting |
| **Stones** | **B** | Very dark — almost nothing visible | Stones rise with rune glow — excellent concept | Ley lines connecting is satisfying | Slow start, then rewarding |
| **Sanctum** | **B** | Dark forest columns — atmospheric | Moon rises, forest fills in, spirits gather | Spiritual, quiet — appropriate mood | Good — moon early, spirits late |
| **Tree** | **B-** | Dark trunk with faint root lines | Roots glow → branches spread → canopy blooms | Gems + bark detail work. But canopy is thin. | Three-phase is smart but each phase is subtle |
| **World** | **C+** | Nearly empty — just scattered particles | Nodes appear, lines connect between them | Network diagram. Functional, not beautiful. | OK — sequential node reveals work |

**Average: B.** Up from the D+ average of the pre-rebuild era. The rebuilt scenes (Garden through Bridge) are solid B to A- range. The back half has been significantly improved since the v5 critique — Library, Stones, Sanctum, and Tree are no longer D-grade. But World remains the weakest scene and it's the finale.

### What's Working
1. **The covering-layer technique** — canopy over branches, warmth over cold, water over dry. This is the signature visual language.
2. **Absence-to-presence** — Bridge's empty gap, Well's dry shaft, Garden's bare branches. Starting from nothing is more dramatic.
3. **The Cottage temperature shift** — cold blue to warm amber is the single most emotionally effective animation in the game.
4. **Stones ley lines** — the moment the lines connect between the risen stones is genuinely magical.
5. **Well cross-section** — the underground view remains the most novel visual concept.

### What's Not Working
1. **World is a network diagram.** Colored dots and lines. This is the finale — the player should feel like the world is coming alive, not like they're looking at a system architecture slide. The prompts literally reference "garden bloom, hearth burn bright" — where is the garden? Where is the hearth?
2. **Stars moon glow is too rectangular/harsh.** The GlowFilter produces a boxy bloom that breaks the atmosphere. Needs a softer radial gaussian blur instead.
3. **Garden cloud is static.** It sits motionless. Even a gentle drift across the sky would add atmospheric life.
4. **Tree canopy is underwhelming for the climax.** The three-phase concept is smart (roots→branches→canopy), but the canopy itself is thin and doesn't fill the frame with life the way the Garden canopy does. For the penultimate scene, this should be the most impressive tree in the game.
5. **Library rock texture is noisy.** The parallax stone walls have a fractal/noise filter that looks procedural and distracting. It's the only scene where a texture filter dominates the visual.
6. **Bridge mist reads as grey blobs.** The cliffs are good but the mist between them is flat ellipses, not atmospheric fog.

### Single Best Moment
The Well water rising at 25-50% — you can see the underground chamber filling. It's the only moment where the scene literally reveals a hidden world.

### Single Worst Moment
World at 0% — scattered particles on a black background. The finale opens with nothing, and not the dramatic "absence" kind. Just... emptiness.

---

## 5. Product Lead

### Assessment

The game is in a much better state than v5. The quality cliff after level 5 has been softened — Library, Stones, Sanctum, and Tree are now solid B-range scenes instead of D+. But two problems remain:

**Problem 1: The finale doesn't land.** World (level 10) is a network diagram. The player has spent 9 levels bringing beautiful, specific scenes to life — a garden, a cottage, a night sky, an underground well. Then the finale shows them... dots and lines. The emotional payoff is missing.

**Problem 2: No audio.** The visual work has reached diminishing returns. Every scene is now decent-to-good. But the experience is silent. A single ambient drone per act, plus a soft chime on prompt completion, would double the atmosphere. This is the biggest zero-to-one opportunity left.

### The 5 Changes That Would Make Someone Screenshot and Share

1. **Rebuild World as a visual culmination** — show miniature versions of each scene lighting up as their names are spoken. When you type "garden bloom," show the garden. When you type "stars remember," show constellations. Make the finale a love letter to the journey.

2. **Add ambient audio** — one drone per act, crossfading at transitions. Plus a soft resonant chime when each prompt completes. The Well water rising WITH a deep reverberant tone would be transcendent.

3. **Fix Garden animation pacing** — the first scene must reward typing within the first 2-3 characters. A subtle color shift, a root glow, anything. "Is this broken?" cannot be the first impression.

4. **Elevate Tree canopy** — the penultimate scene's tree should be the most impressive organic shape in the game. Bigger, more complex canopy that fills the upper frame.

5. **Polish the Cottage cat** — it reads as a cat now, but barely. At the small viewport scale, the silhouette could be slightly larger with more prominent ears.

### What NOT to Do
- Don't add features (level select, achievements, sharing). The game is 10 levels and done. That's its strength.
- Don't rebuild Stones or Sanctum. They're B-grade now. Focus on World.
- Don't optimize performance until testing on real devices reveals actual bottlenecks.

---

## 6. Alpha Tester Panel

### Level-by-Level Emotional Map

| Level | First Impression | Emotional Peak | Would Show Friend? |
|---|---|---|---|
| Garden | "Oh, a bare tree" | Canopy filling in | Yes — nice opening |
| Cottage | "So cold and dark!" | Warmth flooding in | **Yes** — temperature shift is satisfying |
| Stars | "Beautiful sky" | Comets at the end | Yes — naming stars is clever |
| Well | "Whoa, underground!" | Runes flowing downstream | **Yes — wow moment** |
| Bridge | "There's nothing there" | Stones assembling | **Yes — most dramatic** |
| Library | "Kind of noisy visually" | Floating books + tome glow | Maybe — cool but cluttered |
| Stones | "The stones rising is cool" | Ley lines connecting | Yes — feels ancient |
| Sanctum | "Atmospheric" | Spirits appearing in moonlight | Yes — quiet and mystical |
| Tree | "Big trunk, interesting" | Gems appearing in bark | Maybe — expected more for the climax |
| World | "Dots and lines?" | All nodes connected | **No — the finale is abstract** |

### Session Notes

**Cal (patient explorer):** "The first 8 levels are a great journey now. Stones and Sanctum are much better than before. But the Tree should have made me gasp — it's the climax and I just thought 'oh, nice trunk.' And then World... I typed 'garden bloom, hearth burn bright' and nothing bloomed. I wanted to see the garden again."

**Alex (fast typist):** "The pacing in Garden bugs me. I typed 'wake now, sl' and nothing happened. Then suddenly the canopy popped in. The Well is the opposite — every character makes the water rise a little. That's the standard."

**Dana (impatient):** "I finished the game. The silence bothers me now that the visuals are good. It feels like watching a movie on mute. Even low ambient noise would help."

**Morgan (phone user):** "Can't test this. Nobody's tested on mobile. This is a risk."

---

## Priority Stack — v6

| # | Change | Impact | Effort | Notes |
|---|---|---|---|---|
| 1 | **Rebuild WorldScene** — show scene miniatures, not network nodes | **Critical** — finale must land | Large | When you type "garden bloom," the garden should bloom |
| 2 | **Fix animation pacing** — every scene must respond within first 5% of progress | **High** — first impressions matter | Small | Garden and Stones are the worst offenders |
| 3 | **Add ambient audio** — one drone per act + prompt-completion chime | **High** — biggest zero-to-one | Medium | Visual-only has hit diminishing returns |
| 4 | **Elevate Tree canopy** — bigger, more complex, fills the frame | Medium | Medium | Climax scene should have the most impressive tree |
| 5 | **Fix Stars moon glow** — too rectangular/harsh. Replace GlowFilter with soft radial gaussian blur | Small | Small | Boxy bloom breaks the atmosphere |
| 5b | **Add Garden cloud drift** — cloud is static, should move gently across the sky | Small | Small | Easy life for no effort |
| 6 | **Clean up Library textures** — reduce noise filter, let the concept breathe | Medium | Small | The floating-books concept is good but the rock walls are distracting |
| 7 | **Real device testing** — iOS Safari, Android Chrome | Medium | Small | Mobile is completely untested |
| 8 | **Gate dev panel** — URL param or remove from production | Small | Small | Before public release |
| 9 | **Delete dead code** — `inkwood.tsx`, orphaned CSS, unused palettes | Small | Small | Housekeeping |
| 10 | **Add minimal accessibility** — ARIA labels, focus styles, reduced-motion | Small | Small | Low-hanging fruit |
