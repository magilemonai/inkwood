# Inkwood — Persona Review Panel v4

The user's verdict: *"The art is still pretty limited to simple shapes. That tree at the end was not stunning, it looked kind of silly."* They are right. This document is a reckoning with why.

Thematic watchwords: **numinous** and **nourishing**.

---

## The Core Problem

We have been polishing a fundamentally limited approach. Adding particles to simple shapes gives you simple shapes with particles. Adding parallax to flat ellipses gives you flat ellipses that drift. The problem is not missing features — it's that **the shapes themselves are not beautiful**.

Every scene is built from the same toolkit: `<ellipse>`, `<rect>`, `<circle>`, `<line>`, and basic `<path>`. We use these to approximate real things (trees, stones, candles, buildings) but they never stop looking like approximations. The Tree — the visual climax of the entire game — is 5 `strokeLinecap="round"` lines radiating from a rectangle, topped with overlapping ellipses. That is what a child draws when you say "draw a tree." It is not what an artist draws.

**What we need is not more SVG elements. It is better SVG paths.** A single hand-crafted bezier path with 30 control points can look more beautiful than 200 circles and ellipses. The difference between "SVG art" and "SVG illustration" is path complexity and intentionality.

---

## 1. Code Reviewer

### Assessment

The code is now solid. Quantized progress, React.memo, error boundary, custom hook, localStorage save — all good engineering. No bugs found.

| Remaining Issue | Severity |
|---|---|
| The `useCompletionTimer` hook calls both `startCompletion()` AND has a separate useEffect for it — double state update on completion | Low |
| Parallax CSS animations add constant GPU compositing cost even when scene isn't changing | Low |
| 40 particle circles per scene × 10 scenes in memory (even if only 1 rendered) due to static imports in SceneRenderer | Low |

### Verdict
Code is not the bottleneck. Art is.

---

## 2. Narrative Director

### Assessment

The prompt rewrites were a significant improvement. "speak again, forgotten words" and "spirits, walk the old paths" feel like incantations. The one-sentence flavor texts are clean.

| Level | Prompts | Rating | Notes |
|---|---|---|---|
| Garden | "wake now, sleeping roots" / "bloom, every waiting flower" | 4 | Good commands. |
| Cottage | "little candle burn bright" / "fill every room with warmth" | 5 | Best pair in the game. |
| Stars | "Orion Vega Sirius Lyra" / "burn again with ancient fire" | 5 | Naming as invocation + command. |
| Well | "deep water remember your name" / "rise and carry the old songs home" | 5 | Mystical and specific. |
| Bridge | "stone, recall the crossing" / "spirits, walk the old paths" | 4 | Direct commands. |
| Library | "open, sleeping pages" / "speak again, forgotten words" | 4 | Concise. Feels sacred. |
| Stones | "stand tall again guardians of old" / "remember what was promised" | 5 | Gold standard. |
| Sanctum | "moonlight, gather where spirits convene" / "return to your seats, ancient ones" | 4 | Atmospheric. |
| Tree | "roots deeper than memory" / "branches wider than sky" / "awaken, heart of all things" | 5 | Perfect escalation. |
| World | "garden bloom, hearth burn bright" / "stars remember, spirits sing" / "the ancient order is restored" | 4 | Fitting callbacks. |

**Average: 4.5/5.** Narrative is no longer a problem. The words now feel like spells.

### Verdict
Narrative is strong. It deserves art that matches it.

---

## 3. UX Researcher

### Assessment

The mechanical UX is good now. Golden pulse, keyboard nav, save/resume, breathing pause — all working. The remaining issues are all downstream of the art problem:

| Finding | Root Cause |
|---|---|
| Players don't feel connected to the visual change | The visuals aren't detailed enough to show nuanced change |
| The "wow" moment never arrives | No scene is beautiful enough to provoke it |
| The outro feels flat | A silhouette tree against a gradient isn't an emotional payoff |
| Intro vignettes feel static despite CSS motion | The shapes being moved are too simple to benefit from motion |

### Verdict
UX is fine. The experience fails at the art layer, not the interaction layer.

---

## 4. Design Director

### THE FUNDAMENTAL PROBLEM

**We are drawing with geometric primitives when we should be drawing with illustration paths.**

Look at the tree screenshot. The branches are 5 `<path>` strokes radiating symmetrically from a point. The canopy is 7 overlapping `<ellipse>` elements. There is no:
- Irregular branching (real trees have asymmetric, crooked branches)
- Leaf texture (the canopy should have visible leaf clusters, not smooth ovals)
- Bark detail (the trunk should have visible grain, knots, character)
- Environmental interaction (branches should overlap the sky, roots should grip the earth)
- Scale cues (small details that make the tree feel MASSIVE)
- Light direction (one side should be lighter than the other)

**The same critique applies to every scene.** The cottage is rectangles. The well is rectangles. The bridge is a stroke. The library is rectangles with smaller rectangles.

### What "Good SVG Art" Actually Looks Like

Games like **Gris**, **Alto's Adventure**, and **Monument Valley** use simple color palettes but complex paths. A single mountain in Alto's is one `<path>` element — but it has 40+ control points creating an organic, flowing silhouette. Our mountains have 6 control points.

**The fix is not more elements. It is more complex individual paths.**

A tree trunk should be ONE path with 20+ bezier control points — bulges, knots, tapering, character. Not a rectangle with `rx="4"`. A canopy should be ONE complex path following an irregular, organic edge — not 7 overlapping ellipses.

### Scene Grades (Revised — Honest)

| Scene | Grade | Core Problem |
|---|---|---|
| Garden | D+ | Hills are smooth sine waves. Flowers are the only good element (Flower primitive uses real petals). Everything else is flat. |
| Cottage | D | Interior is entirely rectangles. No warmth, no character. Candle flames are ellipses. |
| Stars | C+ | Stars and moon work. The treeline is triangles. Best scene only because stars are SUPPOSED to be dots. |
| Well | D | The well is rectangles stacked. Water is a rectangle. No stone texture despite having a TextureFilter available. |
| Bridge | D+ | The arch is a single stroke. Cliffs are StoneBlock primitives (slightly irregular rectangles). |
| Library | D+ | Vaulted ceiling is one bezier — good idea, but the rest is rectangles. Crystals are polygons. |
| Stones | C | The stones use actual bezier paths — best structural art in the game. But the ground and sky are flat. |
| Sanctum | C | Spirit figures are the most complex bezier work. Moon and trees are basic. |
| Tree | D | SEE SCREENSHOT. Sticks + blobs. The game's climactic moment looks like clip art. |
| World | D | Network diagram. Abstract nodes and lines. |

**Average: D+**. We've been giving ourselves C's and B's. That was dishonest.

### What Must Change

1. **Every major element needs a hand-crafted complex path.** Not `<ellipse>`. Not `<rect>`. A `<path d="...">` with 15-40 control points that looks organic and intentional.

2. **Silhouettes first.** Before adding filters, particles, or glow — the BASE SHAPES must look beautiful as solid-color silhouettes. If a tree doesn't look like a tree as a black shape on white, no amount of glow will fix it.

3. **Reference real SVG illustration.** Study how SVG artists on sites like CodePen create trees, landscapes, and buildings. They use detailed `d=""` paths, not primitives.

4. **Reduce element count, increase path complexity.** 50 simple circles < 5 complex paths. Quality over quantity.

### Verdict
The art approach is fundamentally wrong. We need to stop adding features to simple shapes and start drawing complex shapes.

---

## 5. Product Lead

### Assessment

We've built excellent engineering around mediocre art. The narrative is now strong. The UX is polished. The code is clean. But the game's entire value proposition — "watch the world come alive" — fails because the world doesn't look like a world. It looks like a programmer's approximation of a world.

### The 5 Things That Would Actually Fix This

1. **Hire an SVG illustrator** (or spend 10x more time on paths). Every scene needs its key elements redrawn with complex, intentional bezier paths. This is not a code problem — it's a drawing problem.

2. **Start with silhouettes.** Before any color, filter, or animation, create a black-and-white silhouette version of each scene. If it looks like clip art, the colored version will too.

3. **One scene at a time, done right.** Stop spreading effort across all 10 scenes. Take the Garden and make it genuinely beautiful. Then use that as the template for the rest.

4. **Use the SVG viewBox more intentionally.** Our 400×250 viewport is small. Every pixel matters. Fill it with detail.

5. **Accept that procedural generation has limits.** Functions that compute ellipse positions will never produce art. The beautiful parts of this game will be hand-authored `d=""` strings, not algorithms.

---

## 6. Alpha Tester Panel

### Session Notes

**Alex (fast typist):** "The breathing pause is better. I can actually see the animations now. But the animations themselves... I mean, the flowers are nice. The rest is kind of flat. The tree at the end was a letdown."

**Cal (patient explorer):** "The words are much better — they feel like spells now. But when I cast 'awaken, heart of all things' and see... that tree... the gap between the words and the visuals is enormous. The words promise numinous. The art delivers adequate."

**Dana (impatient):** "Save works, great. But I still got bored in the middle. The levels all look the same — dark background, some shapes, type type type. Where's the variety?"

---

## Priority Stack — v4

| # | Change | Impact | Effort | Notes |
|---|---|---|---|---|
| 1 | Rewrite TreeScene with complex hand-crafted paths | Huge | Large | The climax must be the best scene. 1 complex trunk path, organic branching, detailed canopy edge, NOT ellipses |
| 2 | Rewrite GardenScene with organic landscape paths | Huge | Large | First scene = first impression. Rolling terrain, detailed tree silhouettes, layered depth |
| 3 | Rewrite CottageScene as a warm interior | Large | Large | Needs to feel like a room, not a diagram. Curved walls, visible hearth, wood grain |
| 4 | Rewrite OutroSequence tree with the improved TreeScene paths | Large | Small | Reuse the better tree art in the outro |
| 5 | Add real stone shapes to Well and Bridge | Large | Medium | Replace rectangles with irregular hand-drawn stone paths |
| 6 | Create a visual style guide with silhouette tests | Medium | Small | Every element must pass the "black on white" test |
| 7 | Audio — even one ambient loop per act | Huge | Medium | Deferred too long. Sound doubles atmosphere instantly |
| 8 | Reduce total scene count if quality can't be maintained | Medium | N/A | 7 great scenes > 10 mediocre ones |
| 9 | Consider importing pre-made SVG art as static assets | Huge | Medium | Draw in Figma/Inkscape, export as SVG, import as components |
| 10 | Test on real devices before any more feature work | Medium | Small | We've never tested on a real phone |
