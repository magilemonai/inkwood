# Inkwood — Persona Review Panel v5

Post-rebuild critique after scenes 1-5 (Garden, Cottage, Stars, Well, Bridge) were overhauled with hand-crafted paths and new visual concepts. Scenes 6-10 (Library, Stones, Sanctum, Tree, World) have NOT been rebuilt yet.

---

## 1. Code Reviewer

### Assessment

The codebase is stable and clean. No bugs found in this pass.

| Strength | Notes |
|---|---|
| Quantized progress with React.memo | Working correctly — scenes only re-render on 0.01 increments |
| Error boundary around scenes | Safety net in place |
| localStorage save/resume | Persists correctly, clears on game completion |
| Dev panel (F2) in all builds | Critical for testing, working well |
| useCompletionTimer hook | Clean extraction of the strict-mode guard pattern |

| Remaining Issue | Severity |
|---|---|
| Dev panel in production builds — should be behind a URL param or removed before launch | Low |
| Some scenes still import unused filters (old agent code in scenes 6-10) | Low |
| `useCompletionTimer` calls `startCompletion` inside PlayingScreen's effect AND inside the hook — double state update | Low |
| No performance profiling done on real devices | Medium |

### Verdict
Code is not the bottleneck. Ship-ready for beta testing after removing the dev panel gate.

---

## 2. Narrative Director

### Assessment

Prompts are strong — average 4.5/5 as incantations. Text is trimmed. The narrative arc across 10 levels is sound.

| Level | Prompts | Rating | Prompt↔Visual Alignment |
|---|---|---|---|
| Garden | "wake now, sleeping roots" / "bloom, every waiting flower" | 4 | **Strong** — roots glow, then flowers bloom |
| Cottage | "little candle burn bright" / "fill every room with warmth" | 5 | **Strong** — candles light, then warmth spreads |
| Stars | "Orion Vega Sirius Lyra" / "burn again with ancient fire" | 5 | **Strong** — stars appear by name, then constellations |
| Well | "deep water remember your name" / "rise and carry the old songs home" | 5 | **Excellent** — water rises, then runes flow downstream |
| Bridge | "stone, recall the crossing" / "spirits, walk the old paths" | 5 | **Excellent** — stones assemble, then footprints walk across |
| Library | "open, sleeping pages" / "speak again, forgotten words" | 4 | **Untested** — scene not rebuilt yet |
| Stones | "stand tall again guardians of old" / "remember what was promised" | 5 | **Strong** — stones rise, ley lines connect |
| Sanctum | "moonlight, gather where spirits convene" / "return to your seats, ancient ones" | 4 | **Strong** — moonbeams, then spirits appear |
| Tree | "roots deeper than memory" / "branches wider than sky" / "awaken, heart of all things" | 5 | **Untested** — scene not rebuilt yet |
| World | "garden bloom, hearth burn bright" / "stars remember, spirits sing" / "the ancient order is restored" | 4 | **Untested** — scene not rebuilt yet |

**The Well and Bridge now have the best prompt↔visual alignment in the game.** The water rising = "remember your name" and stones assembling = "recall the crossing" are the most satisfying cause-and-effect moments.

### Top Priorities

1. Rebuild Tree scene with hand-crafted paths — it's the climax and currently the weakest art (sticks + ellipses).
2. Library needs a strong visual concept like the Well cross-section or Bridge assembly.
3. The World scene (level 10) needs to feel like a culmination, not a network diagram.

---

## 3. UX Researcher

### Assessment

| Finding | Status |
|---|---|
| ~~Garden ground spills past edges~~ | **Fixed** — overflow hidden on all scenes |
| ~~Cat unrecognizable~~ | **Improved** — proportions from reference, needs final validation |
| ~~Moon rectangle visible~~ | **Fixed** — dynamic HSL matching |
| Dev panel (F2) works in production | Working — essential for testing |
| Typing overlay hides bottom 30% of scene | **Accepted** — all rebuilt scenes place content above y=170 |
| Mobile keyboard still untested on real devices | **Open** |
| 1.5s breathing pause feels right on first play | Confirmed by testing |
| Save/resume works across sessions | Confirmed |

**New finding:** The Well cross-section and Bridge assembly are the first scenes where the typing genuinely feels like casting a spell. The visual response is specific, dramatic, and directly tied to the words. This is the UX standard every scene should meet.

### Top Priorities

1. Test on real mobile devices (iOS Safari, Android Chrome).
2. Validate the cat silhouette reads clearly at small viewport sizes.
3. Consider adding a very subtle sound effect on prompt completion (even just a soft chime) — the visual-only feedback may not be enough for some users.

---

## 4. Design Director

### Scene Grades (Revised)

| Scene | Grade | Change | Assessment |
|---|---|---|---|
| **Garden** | B | ↑ from D+ | Integrated trunk-limb path works. Canopy silhouette is organic. Covering-layer technique (canopy fading in over branches) is the template for all scenes. Flowers still slightly cartoonish but acceptable. |
| **Cottage** | B- | ↑ from D | Color temperature shift (cold blue → warm amber) is the standout. Candles work. Cat improved but still needs validation. The room is sparse — could use one more piece of furniture or a rug. |
| **Stars** | B+ | ↑ from C+ | Best it's ever been. Moon crescent fixed. Tree glow in moonlight adds atmosphere. Extra comets in final 10% create a crescendo. The treeline primitives (TreeSilhouette) are still the weakest element. |
| **Well** | A- | ↑ from D | **The cross-section concept is a breakthrough.** Seeing underground is unique in the game. Water rising = satisfying. Runes flowing downstream = beautiful visual storytelling. First scene that genuinely feels numinous. |
| **Bridge** | B+ | ↑ from D+ | **Stones assembling from nothing is the most dramatic moment in the game.** The brief green glow as each stone locks into place is a lovely detail. Spirit footprints walking across are evocative. The cliff paths need more complexity — still somewhat geometric. |
| Library | D+ | No change | Not rebuilt. Rectangles. Not sacred enough. |
| Stones | C+ | No change | Not rebuilt. Original bezier stones are decent but ground/sky are flat. |
| Sanctum | C+ | No change | Not rebuilt. Spirit figures and moonbeams work. Trees are primitive blobs. |
| **Tree** | D | No change | **Still the weakest scene — sticks + ellipses for the game's climax.** Must be rebuilt next. |
| World | D | No change | Network diagram. Must become something meaningful. |

**Average rebuilt scenes: B+. Average un-rebuilt scenes: D+.** The quality gap is now dramatic in the other direction — the rebuilt scenes make the old ones look worse by comparison.

### What Made the Rebuilds Work

1. **Novel viewpoints** — cross-section (Well), assembly-from-nothing (Bridge) are more interesting than "side view of a thing"
2. **Hand-crafted bezier paths** — cliffs, cavern walls, ground surfaces all feel natural
3. **Covering layer technique** — canopy over branches, warm light over cold room, water over dry stone
4. **Absence → presence** — starting from nothing is more dramatic than starting from a dim version
5. **Tight prompt↔visual coupling** — when you type "recall" and stones literally recall themselves into position, the game feels magical

### What Still Needs Work

1. **Tree (level 9) is the #1 priority.** It's the climax. Currently the worst art in the game. Needs the same level of care as Garden/Well/Bridge.
2. **Library (level 6)** needs a breakthrough concept like the Well cross-section. What if it's a vertical view — books rising from floor to ceiling? Or a single enormous tome that opens?
3. **World (level 10)** needs to feel like a living landscape, not a data visualization.
4. **Stones and Sanctum** are OK but should be rebuilt to match the new standard once the weaker scenes are addressed.
5. **StarScene treeline** still uses the `TreeSilhouette` primitive. Should be hand-drawn.

---

## 5. Product Lead

### Assessment

The game is now split into two tiers:
- **Rebuilt scenes (1-5):** Genuinely compelling. The Well and Bridge would make someone pause and say "that's beautiful." The Garden tree has character. The Cottage warmth shift is satisfying.
- **Original scenes (6-10):** Feel like they're from a different, worse game. This inconsistency is the #1 problem.

### The 5 Most Impactful Next Steps

1. **Rebuild TreeScene (level 9).** It's 3 levels from the end. It's supposed to be the visual climax. Currently it's the worst scene. This is the highest-impact single change.

2. **Rebuild LibraryScene (level 6).** The mid-game sag (levels 4-6 used to be the weakest) is now fixed for 4 and 5. Library is the last weak link before Act III.

3. **Rebuild WorldScene (level 10).** The finale. Needs to feel like culmination, not a network diagram.

4. **Sound design.** Even one ambient loop per act would double the atmosphere. The visual work is reaching diminishing returns without audio support.

5. **Real device testing.** We've never tested on a phone. Mobile is either working or completely broken — we don't know which.

### What NOT to Do Yet

- Don't rebuild Stones or Sanctum — they're C+ and acceptable while D-grade scenes exist.
- Don't add new features (level select, achievements, sharing).
- Don't optimize performance until we test on real devices and find actual bottlenecks.

---

## 6. Alpha Tester Panel

### Level-by-Level Emotional Map (Updated)

| Level | First Impression | Emotional Peak | Would Show Friend? |
|---|---|---|---|
| Garden | "The tree has character" | Canopy filling in over bare branches | Yes — the tree is genuinely nice |
| Cottage | "It's so blue and cold!" | The warm amber flooding in | Yes — the temperature shift is satisfying |
| Stars | "Beautiful night sky" | Comets streaking at the end | Yes — the naming-stars conceit is clever |
| Well | "Whoa, I can see underground" | Runes flowing downstream | **Yes — first genuine "wow"** |
| Bridge | "Wait, there's nothing there" | Stones floating into place | **Yes — most dramatic moment** |
| Library | "This looks flat" | Crystals growing (barely) | No |
| Stones | "The stones are cool" | Ley lines connecting | Maybe |
| Sanctum | "Atmospheric" | Spirit figures appearing | Maybe |
| Tree | "This is... sticks?" | Crown glow (underwhelming) | **No — the climax disappoints** |
| World | "Abstract nodes" | Connections forming | No |

**The game now has a quality cliff after level 5.** The first five levels are good-to-excellent. Then it drops sharply. This needs to be addressed before any public release.

### Session Notes

**Cal (patient explorer):** "The Well blew my mind. I didn't expect to see underground. And the runes flowing with the water — that's the most beautiful thing in the game. Then I got to the Library and it felt like I went backwards in time."

**Alex (fast typist):** "The Bridge is amazing. Watching the stones assemble as I type is the first time I actually WANTED to slow down and watch. The 1.5s pause after each phrase is perfect now."

**Dana (impatient):** "Save works, thank god. The first 5 levels kept me hooked. Then the Library hit and I almost quit. The quality drop is jarring."

---

## Priority Stack — v5

| # | Change | Impact | Effort |
|---|---|---|---|
| 1 | Rebuild TreeScene with hand-crafted paths | **Critical** — the climax must not be the worst scene | Large |
| 2 | Rebuild LibraryScene with a breakthrough concept | High — closes the mid-game quality gap | Large |
| 3 | Rebuild WorldScene as a visual culmination | High — the finale must land | Large |
| 4 | Hand-draw StarScene treeline (replace TreeSilhouette primitive) | Medium — the last primitive-dependent element in rebuilt scenes | Small |
| 5 | Sound design — even one ambient drone per act | **High** — doubles atmosphere, visual-only has diminishing returns | Medium |
| 6 | Real device testing (iOS Safari, Android Chrome) | Medium — unknown mobile state | Small |
| 7 | Rebuild StonesScene to match new standard | Medium — decent but below the rebuilt average | Medium |
| 8 | Rebuild SanctumScene to match new standard | Medium — same as above | Medium |
| 9 | Remove dev panel from production builds before public release | Small | Small |
| 10 | Performance profiling on real low-end device | Small — enables more complex future scenes | Small |
