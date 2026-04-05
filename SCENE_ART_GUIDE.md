# Scene Art Guide — Lessons from Rebuilding Scenes 1-5

This document captures what we've learned rebuilding GardenScene, CottageScene, StarScene, WellScene, and BridgeScene. Every future scene rebuild should follow these principles.

---

## The Core Principle

**Complex paths, not primitive shapes.** A single `<path d="...">` with 20+ bezier control points looks more organic than 50 circles and ellipses combined. If you render the element as a black silhouette on white and it looks like clip art, the path needs more work.

---

## Structural Lessons

### 1. Integrated structural shapes
The trunk and main branches should be **one continuous closed path** that forks. Walls and frames should be single paths with character. Don't attach separate shapes to each other — make them one continuous form.

**Garden tree:** trunk + two limbs = one path that starts at the base, rises, then splits.
**Cottage window:** frame is one path, not four rectangles.
**Well:** shaft walls are continuous with the rim.

### 2. Covering layers fade in with progress
The key technique that makes scenes feel alive: render the "alive" layer ON TOP of the "structure" layer, with opacity tied to progress.

**Garden:** bare branches visible at p=0 → canopy fades in on top, covering them by p=1.
**Cottage:** cold blue room → warm amber light overlay fades in on top.
**Well:** dry cavern → water rises as a covering layer, hiding dry stone.

### 3. Cross-section and unusual viewpoints
Don't default to "side view of a thing." The Well works because it's a cross-section — you see underground. The Bridge works because the bridge DOESN'T EXIST at p=0. Choose the viewpoint that best serves the animation arc.

### 4. Assembly animations > reveal animations
Things that BUILD themselves are more dramatic than things that FADE IN.

**Bridge:** stones float up from mist and lock into position. Each one glows briefly as it settles. This is more visually compelling than a bridge that fades from transparent to opaque.
**Well:** water rises to fill the channel, runes drift downstream. Motion, not just opacity.

### 5. The scene should start with ABSENCE
The most dramatic transformations start from nothing:
- Garden: bare branches, no leaves → full canopy
- Cottage: cold dark blue room → warm amber
- Bridge: two broken cliff stumps → complete arch
- Well: dry stone channel → flowing river

---

## Animation Arc Template

| Phrase | What changes | Best technique |
|---|---|---|
| First phrase | The STRUCTURE appears or transforms | Assembly, color shift, water/light rising |
| Second phrase | LIFE appears | Staggered small elements (flowers, spirits, runes, footprints) |

The player should be able to look at the scene and understand what their words DID. The Stones scene remains the gold standard: "stand tall again" → stones rise. "remember what was promised" → ley lines connect them.

---

## Element-Specific Lessons

### Trees
- Trunk + limbs as ONE integrated path that forks — not separate shapes
- Canopy as ONE complex irregular silhouette (~25 curves) — not overlapping ellipses
- Render order: branches first, canopy on top (fading in with progress)
- Secondary forks: max 3, small, inside the canopy bounds
- At this viewport scale, individual leaves are not visible — the canopy OUTLINE suggests foliage through its bumpiness

### Cats (and other small creatures)
- Head must be ~1/3 of body height. A small head looks alien.
- Use a reference silhouette and trace the proportions
- Ears as prominent triangular points
- Tail should follow the reference pose (curving up, wrapping around, etc.)
- One eye glint (amber) + subtle whiskers is enough detail at this scale
- Test the silhouette: if it reads as "cat" in solid black, it works

### Interior scenes
- Color temperature shift is the key dramatic element: cold blue (10,12,28) → warm amber (44,28,14)
- Position ALL interactive elements above y=170 (the typing overlay zone)
- Window is the scenic anchor — it shows the most dramatic color change
- Candle flames: ellipses are fine for fire (fire IS soft and round)
- Steam: asymmetric wispy bezier curves, 3 of different lengths. NOT mirror-symmetric.

### Water
- Water rising as a covering layer is inherently dramatic — use it
- Surface shimmer: a thin white ellipse at the water line
- Runes glowing when submerged: only show rune if `waterLevel < rune.y`
- Flowing runes: interpolate position from start to end, fade out as they travel

### Stone/cliff
- Hand-drawn cliff faces with irregular edges (many bezier curves)
- Stone texture: subtle horizontal lines at varying y positions, low opacity
- Broken stumps suggest history — something WAS here and is gone
- Assembly animation: stones rising from below with a brief glow lock

### Night sky
- Moon crescent: the dark masking circle must match the sky color at that y-position, not a hardcoded color (causes visible rectangle)
- Stars work as circles — they ARE dots. This is the one place primitives are correct.
- Constellation lines: use strokeDashoffset for drawing animation
- Shooting stars: more in the final 10% creates a climactic crescendo
- Tree tops catching moonlight: proximity-based glow (closer to moon = brighter)

---

## Rendering Order (bottom to top)

1. Sky gradient
2. Sun/moon + glow
3. Background elements (distant hills, clouds)
4. Main structure (trunk, walls, cliffs, well shaft)
5. **Covering/alive layer** (canopy, warm light, water) — fades in with progress
6. Ground / earth surface
7. Ground details (stones, grass tufts, broken stumps)
8. Small animated elements (flowers, spirits, lanterns, footprints, runes)
9. Atmospheric particles (pollen, dust, mist)
10. UI overlays (warm light wash)

---

## Color Principles

- **Dormant (p=0):** Low saturation (5-10%), low-medium lightness (8-15%), desaturated cool tones
- **Alive (p=1):** Medium saturation (25-40%), medium lightness (18-28%), warm or vivid accent
- **Temperature shift is the most powerful color tool.** Cold blue → warm amber (Cottage) is more dramatic than dark green → bright green (Garden).
- **Accent color** (from level definition) is for glow effects and typed text, not the scene base.

---

## Common Mistakes to Avoid

1. **Geometric primitives for organic things** — `<rect>`, `<ellipse>` for trunks, canopies, walls
2. **Too many small branches** — 13 crossing sticks = visual noise
3. **Uniform-width stroked lines** — toothpicks. Use closed tapered paths.
4. **Elements below y=170** — hidden behind the typing overlay
5. **Mirror-symmetric steam/smoke** — looks artificial
6. **Small creature heads** — head must be proportionally large (1/3 body)
7. **Hardcoded masking colors** — must match the background dynamically
8. **Side-view default** — consider cross-section, overhead, or absent-then-assembled approaches
9. **Rectangles with glow filters** — a glowing rectangle is never beautiful
10. **SVG paths extending past x=0-400** — causes spillover on wide screens

---

## Rebuild Checklist

- [ ] Main structural element is a complex bezier path (not primitives)
- [ ] Passes the "black silhouette on white" test
- [ ] Uses the covering-layer technique (alive fades in on top of structure)
- [ ] All interactive content above y=170 (visible above typing overlay)
- [ ] Each prompt maps to a specific, visible visual change
- [ ] Color transitions from desaturated/cool to warmer/vivid
- [ ] Assembly or motion animation (not just opacity fade)
- [ ] Scene starts with meaningful ABSENCE (not just a dim version)
- [ ] Max 3-5 secondary elements — quality over quantity
- [ ] `overflow="hidden"` and `preserveAspectRatio="xMidYMid slice"` on SVG
- [ ] No elements extending past x=0-400 range
- [ ] Small creatures tested against reference silhouette
