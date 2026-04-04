# Inkwood — Persona Review Panel v3

Brutal, honest critique. The user says: *"the art is still very lacking. the narrative can be cleaner, tighter. we should be a LOT more creative with assets, art, and animation."*

Thematic watchwords: **numinous** and **nourishing**.

---

## 1. Code Reviewer

### Assessment

The architecture is sound. Real issues are subtle.

| Issue | Severity | Notes |
|---|---|---|
| `React.memo` on scenes is likely a no-op — `progress` is `typed.length / target.length`, which changes on EVERY keystroke | High | Fix: quantize progress to 0.01 increments before passing to scene |
| Store derived values (`level()`, `target()`) are functions, not selectors — forces callers to call them per render | Medium | Consider zustand `subscribe` with shallow equality |
| `completingRef` guard is correct but fragile — a future refactor could easily break it | Low | Extract to a `useCompletionTimer` hook |
| No error boundaries — a scene crash kills the entire app | Medium | Wrap `SceneComp` in an error boundary |

### Top 3

1. Quantize progress: `Math.round(rawProgress * 100) / 100` before passing to scenes. This makes `React.memo` actually work.
2. Error boundary around scene rendering.
3. Extract completion timer to a custom hook.

---

## 2. Narrative Director

### Prompt Power Rating (1-5)

Every prompt should feel like **casting a spell** — a command the world obeys. Not a fortune cookie.

| Level | Prompt | Rating | Problem | Proposed Rewrite |
|---|---|---|---|---|
| Garden | "green returns to sleeping roots" | 3 | Passive. Describes what happens, doesn't command it. | **"wake now, sleeping roots"** |
| Garden | "bloom now, every waiting flower" | 4 | Good — it's a command. "Every waiting" is slightly wordy. | **"bloom, every waiting flower"** |
| Cottage | "little candle burn bright" | 5 | Perfect. Intimate, commanding, specific. | — |
| Cottage | "amber glow fills every room" | 3 | Passive description, not a spell. | **"fill every room with warmth"** |
| Stars | "Orion Vega Sirius Lyra" | 5 | Brilliant. Naming as invocation. | — |
| Stars | "the sky blooms with ancient fire" | 4 | Beautiful but passive. | **"burn again with ancient fire"** |
| Well | "deep water remember your name" | 5 | Commanding and mystical. Best in the game. | — |
| Well | "rise and carry the old songs home" | 4 | Good command. | — |
| Bridge | "moss and stone recall the crossing" | 3 | Who's being commanded? Vague. | **"stone, recall the crossing"** |
| Bridge | "where old paths meet spirits still walk" | 2 | Fortune cookie. Not a spell. | **"spirits, walk the old paths"** |
| Library | "open the pages let wisdom rise" | 3 | Two commands mashed together. | **"open, sleeping pages"** |
| Library | "every old word finds its voice again" | 2 | Passive, generic. Weakest prompt. | **"speak again, forgotten words"** |
| Stones | "stand tall again guardians of old" | 5 | Perfect command. The gold standard. | — |
| Stones | "the circle remembers what was promised" | 4 | Evocative but not a command. | **"remember what was promised"** |
| Sanctum | "moonlight gathers where spirits convene" | 4 | Atmospheric. | — |
| Sanctum | "the ancient ones return to their seats" | 3 | Tells, doesn't command. | **"return to your seats, ancient ones"** |
| Tree | "roots deeper than memory" | 5 | Fragment as incantation. Powerful. | — |
| Tree | "branches wider than sky" | 5 | Same. Perfect escalation. | — |
| Tree | "nexus of all living things awaken" | 4 | Good but "nexus of all living things" is clunky. | **"awaken, heart of all things"** |
| World | "the garden blooms the hearth burns bright" | 3 | Callback, but reads like a list. | **"garden bloom, hearth burn bright"** |
| World | "every star remembers every spirit sings" | 3 | Same — list, not spell. | **"stars remember, spirits sing"** |
| World | "the ancient order is restored" | 4 | Declarative. Fitting finale. | — |

**Average: 3.6/5.** Six prompts are at or below 3. These should all be commands — the player is a scribe whose words have power. Passive descriptions ("every old word finds its voice") break the spell.

### Top 3

1. Rewrite all prompts rated 2-3 as direct commands.
2. Flavor text for Garden still has two sentences. Make it one: "Breathe life back into the garden."
3. The escalation from Act I to IV should feel like growing power. Currently Act II prompts are no more powerful than Act I.

---

## 3. UX Researcher

### Assessment

| Finding | Severity |
|---|---|
| Overlay layout hides bottom ~30% of scene. If any scene has critical animation in the lower third (ground-level flowers, roots, water), the player can't see it. | High |
| "tap here to begin typing" is wrong on desktop — should be "click anywhere to type" or just auto-focus more aggressively | Medium |
| 1.5s breathing pause is good on first play but may frustrate on replay. Consider reducing to 1s after first completion. | Low |
| No skip for levels already completed (save restores position but can't jump ahead) | Medium |
| The golden pulse stops after first character on the first phrase only — it should pulse on EVERY new phrase start until first character typed | Medium |
| Progress diamonds are still tiny and unlabeled | Low |

### Top 3

1. Audit every scene's bottom third — ensure no key animations happen below y=170 in the SVG viewport (the typing overlay zone).
2. Golden pulse should activate at the start of every phrase, not just the first.
3. Context-aware focus hint: "click anywhere" on desktop, "tap to type" on mobile.

---

## 4. Design Director

### Scene Grades

| Scene | Grade | Best Moment | Worst Moment | What Would Elevate It |
|---|---|---|---|---|
| Garden | C+ | Flowers blooming with staggered delays | Flat hill shapes, no depth | **Parallax**: 3 hill layers moving at different rates. **Particles**: pollen/petals drifting. **Depth-of-field**: blur on distant hills. |
| Cottage | C | Candle flame glow radiating | Rectangular walls, no warmth feeling | **Warm color wash** across entire scene as candles light. **Flickering shadow play** using animated opacity on dark shapes. **Smoke/dust particles**. |
| Stars | B- | Stars appearing one-by-one with glow halos | Flat treeline triangles | **Twinkling**: subtle opacity oscillation on placed stars. **Shooting star** as a surprise reward at completion. **Milky Way band** needs more luminosity. |
| Well | C+ | Water rising with rune glow | Rectangular well structure | **Water reflection**: mirror the sky in the water surface. **Ripple animation**: concentric circles when water reaches each rune. |
| Bridge | C | Spirit lanterns lighting | Flat cliff faces, no depth to chasm | **Mist parallax**: multiple mist layers at different speeds. **Depth haze**: distant elements blurred/faded. |
| Library | C+ | Crystal formations growing | Still too rectangular. Not sacred enough. | **Volumetric light shafts** through the vault. **Floating particle dust** catching the light. **Book pages fluttering** as they rise. |
| Stones | B+ | Ley lines racing between stones | Ground could be richer | The best scene. Model for others. Could add **wind grass animation** and **sky drama**. |
| Sanctum | B | Spirit figures in moonlight | Clearing feels empty | **Fireflies**. **Ground mandala glowing**. **Leaf fall** from surrounding trees. |
| Tree | B- | Three-phase root/branch/crown build | Trunk is still too geometric | **Bark detail**: visible texture lines. **Leaf particles**: individual leaves appearing in canopy. **Root glow pulse**: traveling light along roots. |
| World | C | Concept of connecting all locations | It's a network diagram, not a landscape | Needs complete rethink — should feel like **looking down at a living map**, not a data visualization. |

**Average: C+.** No scene is genuinely beautiful yet. They're competent SVG illustrations. To reach "numinous," we need:

### Techniques We Haven't Used

1. **CSS parallax on SVG groups**: Wrap background/midground/foreground in groups, apply `transform: translateY()` animations for subtle depth movement.
2. **strokeDashoffset line-drawing**: Constellation lines, ley lines, rune patterns should DRAW themselves, not just fade in.
3. **clipPath reveal**: Instead of opacity fade, reveal elements through expanding clip masks — like a curtain pulling back.
4. **Particle density**: Most scenes have 5-8 atmospheric particles. Journey has hundreds. Even 30-50 tiny dots drifting would transform the feeling.
5. **Color temperature shifts**: The entire SVG should shift warmth as progress increases — not just individual elements, but the whole palette rotating via a CSS filter.
6. **Animated SVG patterns**: `<pattern>` fills for water, stone, wood — instead of flat colors.

### Top 3

1. Add parallax depth movement to every scene (3 layers minimum).
2. Triple the particle count in every scene — wisps, dust, pollen, embers, snowflakes.
3. Use strokeDashoffset line-drawing for all ley lines and constellation lines.

---

## 5. Product Lead

### 5 Changes That Would Make Someone Screenshot This

1. **One hero scene that's genuinely breathtaking.** Pick the Tree or Sanctum and pour everything into it — parallax, particles, color shifts, line-drawing animations. If one level makes people say "wow," they'll play the rest to see what else is coming.
2. **Particle atmosphere everywhere.** The single cheapest way to make SVG art feel alive. 30-50 floating particles per scene. Pollen, dust, embers, fireflies, snow, starlight. Different per scene.
3. **The intro needs to MOVE.** Three static desaturated images crossfading is not cinematic. A slow pan, a parallax drift, something that says "this is alive even in its dormancy."
4. **Sound.** Even one ambient loop per scene (rain, fire crackle, night crickets, water dripping, wind) would double the atmosphere. This is the single highest-impact addition possible.
5. **The outro dawn.** The tree silhouette against a warming sky is the right idea. But it needs to be GORGEOUS — layered clouds, god rays, color that takes your breath away. This is the screenshot moment.

---

## 6. Alpha Tester Panel

### Level-by-Level Emotional Map

| Level | First Impression | Emotional Peak | Would Show a Friend? |
|---|---|---|---|
| Garden | "It's growing" | Flowers blooming | Maybe — it's pleasant |
| Cottage | "Oh, candles" | Cat appearing | No — too flat |
| Stars | "Pretty" | Naming stars as they appear | Yes — the naming conceit is clever |
| Well | "Interesting" | Runes surfacing | Maybe |
| Bridge | "Atmospheric" | Lanterns lighting | No — chasm has no depth |
| Library | "Mysterious" | Crystals growing | No — not sacred enough |
| Stones | "Powerful" | Ley lines racing between stones | **Yes** — this is the one |
| Sanctum | "Beautiful" | Spirits appearing in moonlight | **Yes** — genuinely atmospheric |
| Tree | "Impressive" | Crown glow at completion | Yes — satisfying build |
| World | "Abstract" | Connections forming | No — too diagrammatic |

**Emotional arc:** Starts pleasant (1-3), dips in the middle (4-6), peaks at Stones/Sanctum (7-8), satisfying finale (9). The mid-game sag is the problem — levels 4-6 need to be as strong as 7-8.

---

## Priority Stack — Top 10

| # | Change | Impact | Effort |
|---|---|---|---|
| 1 | Rewrite all 2-3 rated prompts as commands | Huge — transforms typing from "filling forms" to "casting spells" | Small |
| 2 | Add 30-50 particles per scene (wisps, dust, pollen, embers) | Huge — instant atmosphere upgrade | Medium |
| 3 | Parallax depth on all scenes (3 layers, subtle CSS transform animation) | Large — makes flat SVGs feel 3D | Medium |
| 4 | strokeDashoffset line-drawing for ley lines and constellations | Large — makes connections feel magical, not instant | Small |
| 5 | Quantize progress for effective React.memo | Medium — performance fix enables more complex scenes | Small |
| 6 | Audit scene bottom thirds for overlay occlusion | Medium — ensures players see what they earned | Small |
| 7 | One ambient sound per scene | Huge — doubles atmosphere | Medium |
| 8 | Make intro MOVE (slow parallax pan, not static crossfade) | Large — first impression is everything | Medium |
| 9 | Golden pulse on every phrase start, not just first | Small — but improves flow for every level | Small |
| 10 | Hero-polish the Tree scene as the visual showcase | Large — gives the game its "wow" moment | Large |
