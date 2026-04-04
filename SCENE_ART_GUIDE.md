# Scene Art Guide — Lessons from the Garden Rebuild

This document captures what we learned rebuilding GardenScene from scratch. Every future scene rebuild should follow these principles.

---

## The Core Principle

**Complex paths, not primitive shapes.** A single `<path d="...">` with 20+ bezier control points looks more organic than 50 circles and ellipses combined. If you render the element as a black silhouette on white and it looks like clip art, the path needs more work.

---

## What Worked

### 1. One integrated trunk-and-limb shape
The trunk and main branches are **one continuous closed path** that forks. The trunk rises, tapers, then splits into two limbs. This looks natural because real trees don't have branches "attached" to a trunk — the wood is continuous.

**Do:** `M base → C curves up → splits left → curves back → splits right → curves back → Z`
**Don't:** Separate rectangle trunk + separate line branches stuck on top.

### 2. Canopy as a single complex silhouette
The canopy is ONE path with ~25 bezier curves creating an irregular, bumpy outline that suggests leaf clusters. No smooth ellipses. The bumps and indentations are what make it read as foliage.

**Do:** One path with many small directional changes (C curves alternating inward/outward).
**Don't:** Overlapping `<ellipse>` elements.

### 3. Canopy renders ON TOP of branches
The canopy is drawn AFTER the trunk/branches in SVG draw order, so it covers them. Its opacity is tied to progress — starts transparent (bare branches visible), fills in as the player types. This creates a natural "leafing out" 3D effect.

### 4. Terrain as hand-drawn contours
Each hill is a single path with 8-10 bezier curves creating natural undulation — gentle bumps and dips, not mathematical sine waves. Three layers (far, mid, near) at different vertical positions create depth.

### 5. Small secondary forks, not many branches
After trying 5 branches, then 5+5+8, then back to 3+3: **fewer is better**. The tree reads best with the main forking trunk shape + 3 small secondary forks. More branches = visual noise, not detail.

### 6. Petal-style flowers work at this scale
Five small ellipse petals arranged in a circle around a center dot reads clearly as a flower at 400×250 viewport scale. But they need:
- **Muted colors** (#d88090, not #e87090) — less saturated than you'd think
- **Small size** (5-7px, not 9-11px)
- **Soft stems** with a slight curve

### 7. Roots that glow with progress
Roots are thick bezier strokes spreading from the trunk base. At low progress they're dark wood color. As progress increases, a green glow line traces over them (using GlowFilter). This ties to the prompt "wake now, sleeping roots" — the player SEES the roots waking.

### 8. Clouds belong to the sky, not the tree
Clouds overlapping the tree canopy looked wrong. Position them in clear sky areas only.

---

## What Didn't Work

### 1. Geometric primitives for organic things
`<rect>`, `<ellipse>`, `<circle>` for trunks, canopies, terrain. These always look mechanical, no matter how many you stack.

### 2. Too many branches
5 main branches + 5 sub-branches + 8 twigs = a messy spider web. Branches crossing each other is visual chaos. The eye can't parse the structure.

### 3. Uniform-width stroked lines for branches
`strokeWidth={4}` on a path gives you a toothpick. Real branches taper from thick to thin. Use **closed tapered paths** (two edges converging) or integrate them into the trunk shape.

### 4. Branches emerging from one point
All branches radiating from the trunk crown looks like a palm tree or a fan. Real oaks have the trunk split into 2-3 main limbs at different heights.

### 5. Overly bright saturated flowers
#e87090 at size 10 against a naturalistic scene looks like clip art. Mute the colors and shrink the size.

### 6. Bird silhouette as a reward
Too small at this viewport size to read as anything but a blob. Don't add tiny reward elements that can't be parsed.

### 7. Procedural generation for art
`Hill()`, `GrassRow()`, `TreeSilhouette()` — these primitives generate acceptable filler but never good art. Hand-drawn paths with intentional character > algorithm with parameters.

---

## Animation Arc Template

Each scene should have a clear two-phrase animation mapping:

| Phrase | Visual Change | Technique |
|---|---|---|
| First phrase | The environment itself changes (terrain greens, structure appears, light shifts) | Color transitions, opacity changes, shape reveals |
| Second phrase | Life appears (flowers bloom, spirits manifest, details emerge) | Staggered element appearance, glow effects |

The player should be able to look at the scene and understand what their words DID.

---

## Rendering Order (bottom to top)

1. Sky gradient
2. Sun/moon + glow
3. Clouds (in clear sky, NOT overlapping main subject)
4. Far terrain (lowest opacity, simplest)
5. Mid terrain
6. **Main subject wood/stone structure** (trunk, branches, walls, etc.)
7. **Main subject covering layer** (canopy, roof, etc.) — fades in with progress
8. Near terrain / ground
9. Ground details (stones, grass tufts)
10. Small animated elements (flowers, spirits, etc.)
11. Atmospheric particles (pollen, dust, embers)

---

## Color Principles

- **Dormant (p=0):** Low saturation (5-10%), low lightness (10-15%), grey-brown tones
- **Alive (p=1):** Medium saturation (30-40%), medium lightness (20-28%), warm greens/golds
- **Never fully bright.** Even at p=1, the scene should feel like dusk/dawn, not noon. Max lightness ~28%.
- **Accent color** (from level definition) is used for glow effects and typed text, not for the scene itself.

---

## Checklist for Rebuilding a Scene

- [ ] Main structural element is a single complex bezier path (not primitives)
- [ ] Passes the "black silhouette on white" test — looks organic, not geometric
- [ ] Terrain is hand-drawn contours (3 layers minimum)
- [ ] Rendering order places covering layers (canopy, roof) AFTER structure
- [ ] Covering layer opacity tied to progress (bare→covered transition)
- [ ] Each prompt maps to a specific, visible visual change
- [ ] Colors transition from desaturated/dark to warmer/brighter
- [ ] Max 3-5 secondary elements (forks, details) — complexity through path quality, not element count
- [ ] Small details (stones, grass, motes) placed intentionally, not procedurally
- [ ] No primitives from `svg/primitives.tsx` for main elements (OK for Flower, particles)
