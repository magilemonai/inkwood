# Inkwood 2 — Director's Pass and Scene Briefs

Written 2026-09-05 after the director approved the Cottage glow + feel slice and gave
free rein to improve every scene, the story, and the phrases. This is the shared brief
for the scene work. `SCENE_ART_GUIDE.md` is the law; this is the assignment.

Everything here ships behind the `?v2` gate. The live game stays v1.5 until the
director flips it.

---

## 1. The director's read (all ten scenes at climax, 2026-09-05)

The compositions are good and the paths are hand-drawn. Four things hold every scene
back, and the Glow layer fixes three of them without touching the art:

1. **No light model.** Flat fills; light sources don't illuminate their surroundings.
   → The Glow: manifest-declared lights with falloff and flicker.
2. **No air or texture.** Dark areas are flat hex colors; half of most frames is empty.
   → The Glow: haze bands, dust in the light, film grain.
3. **No idle life** between keystrokes. → Glow flicker/drift now; SMIL idle motion in the
   redraws (sway, flutter, ripple, twinkle).
4. **No depth.** One plane. → Redraws add receding layers (three tones: far, mid, near).

Then the structures that fail the house's own silhouette test and need real redraws.

| Scene | Grade today | Why | Verdict |
|---|---|---|---|
| Tree | C+ | Slab trunk (rounded rectangle), canopy is a green band, roots are ribbon tubes, heart is a flat oval | **Redraw** |
| Garden | B- | Flat green blob canopy with branch lines showing through, flat sun disc, blob cloud, pinwheel flowers, flat ground bands | **Redraw** |
| Well | B- | Boxy post-and-beam frame (rectangles), flat earth bands, water barely visible at 99% | **Redraw** |
| Library | B | Flat purple cavern, rounded-rect books, five stiff rays read as a victory beam | **Redraw** |
| Sanctum | B | Lollipop trees (ovals on sticks); spirits and moon are good | **Redraw the trees**, keep spirits |
| Bridge | B | At 99% the arch stones are illegible against the chasm; chasm is empty and flat | **Redraw** |
| Stones | A- | Flat trapezoids but strong composition | Light manifest + texture pass (later) |
| Cottage | A | Holds; glow done | Light manifest (done) |
| Stars | A | Gold standard; still 2D | Light manifest |
| World | B+ | Reads as a diagram | Rendering pass later; the 21-connection graph is defended territory. Light manifest now. |

---

## 2. The story (levels2.ts)

**The frame:** you are the new scribe. The one before you wrote this forest awake once,
then went quiet, and the world went dormant. Their journal, found in the Cottage, holds
the incantations half finished. You finish them. In the Great Tree you learn where the
old scribes go when the writing is done: into the heart, as small lights. The last line
is yours.

**Two voices, no new surfaces.** The flavor line above the prompt box is now the journal:
the previous scribe, first person, one sentence. The win text is the world answering.
The prompts stay the player's own incantations. Act cards become journal pages and run
9.5s so they can be read. The outro gains one line after "The forest remembers.":
"It remembers you." (the player's final incantation is "the forest remembers").

Acts: Kindling / The Old Paths / The Listening / The Last Line.

Phrase changes from v1 (everything else kept, it was rated 4.8/5):
- Library 2: "speak again, forgotten words" → "every voice, rise and speak as one"
  (the pair was redundant; now phrase 1 opens the tome, phrase 2 raises the chorus).
- Sanctum 1: "moonlight, gather where spirits convene" (39 chars, squeezed the font) →
  "moonlight, pour into the circle".
- Sanctum 2: "return to your seats, ancient ones" → "Oak, Alder, Yew, take your seats".
  The ancient ones are the elder trees; naming them is the summoning, as with the stars.
- World 3: "the ancient order is restored" → "the forest remembers" (echoed by the outro).

---

## 3. The Glow contract (every scene gets a manifest)

`src/scenes/manifests/<sceneKey>.ts`, default-exporting a `SceneManifest` (types in
`src/scenes/manifest.ts`). Auto-registered by filename. All coordinates in viewBox
units (0 0 400 250). Everything is a function of progress `p` so light arrives with
the incantation.

- `lights(p)`: up to 12. `{ x, y, radius, intensity, color: [r,g,b] 0–1, flicker 0–0.3,
  yScale?, core? }`. `yScale` 3 = flat floor pool; 0.4 = tall column. `core` = hot spot.
- `haze(p)`: one band `{ top, bottom, density ≤ 0.05, color }`. Air, not fog.
- `motes(p)`: up to 24 dust points in a region; they are only visible where the light
  reaches them. `{ x, y, width, height, count, size ≈ 1, color, speed, alpha }`.
- `grain`: 0.03–0.05.

**Tuning law from the Cottage:** whole-frame lights at or below 0.06 intensity; local
halos 0.3–0.4 with radius 35–50; haze density at or below 0.05. Break these and the dark
corners go milky and the light stops meaning anything. Hush over spectacle.

Mirror the scene's own `sub(p, start, duration)` timings so light and art arrive together.

---

## 4. Redraw briefs

Common to all six:

- File: `src/scenes/v2/<sceneKey>.tsx`, default export `memo(Component)`, signature
  `({ progress }: SceneProps)`. Start by copying the v1 scene file; keep what works.
- Root `<svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice">`.
  All meaningful content above y=170 (the typing overlay covers the bottom on desktop).
  Nothing past x 0–400.
- Every phrase maps to one visible transformation. The player must see what their
  words did. Dormant (p=0) is meaningful absence, not a dim version.
- Hand-drawn bezier paths with 15–30 control points for every organic form. No `rect`,
  `ellipse`, or `circle` for trunks, canopies, stones, walls, clouds, or creatures.
  Circles are allowed for stars, flames, and glow discs.
- Three tones per mass (shadow, mid, lit) and receding depth layers (far, mid, near).
- Idle life via SMIL `<animate>` / `<animateTransform>` on a few elements (sway,
  flicker, ripple, bob). Zero React re-renders for idle motion. Respect
  `prefers-reduced-motion` by keeping it subtle; global.css flattens CSS animations.
- `GlowFilter` at most twice per scene. Prefer radial gradients for halos.
- Silhouette test: rendered as black on white, the main forms must read as what they are.
- Write the scene's light manifest too (`src/scenes/manifests/<sceneKey>.ts`). Lights
  belong where the scene's own light sources are.
- Verify with screenshots at 0, 30, 60, 99% on desktop and 99% at `--mobile`, all with
  `--params=v2`. Look at them. Iterate at least twice. Grade yourself honestly against
  the table above; "better than v1" is the floor, not the target.

### Tree (`tree`)  — the weakest climax in the game

Prompts: "roots deeper than memory" (p 0–0.33: roots spread and glow, descending into ley
threads) / "branches wider than sky" (0.33–0.66: canopy grows up and out, the crown breaks
the top edge) / "awaken, heart of all things" (0.66–1: the heart in the trunk ignites;
inside it, small colored lights, one per scribe, using the ten level accents; glints
spread through the canopy).

Target: one continuous forking trunk path with bark ridges (two or three darker and
lighter bark paths inside it), a buttressed base flaring into 5–7 tapering roots that
fork and run toward the frame edges, ley threads emerging from the root tips. Canopy
as 5–7 overlapping foliage masses, each an irregular 20+ curve silhouette, three tones,
the crown reaching above y=15. A hollow in the trunk holds the heart: warm core, the
scribe-lights drifting slowly inside (SMIL). Depth: distant treeline silhouettes, ground
mist. Dormant: bare skeletal branches, no canopy, roots barely visible, heart dark.
References: the camphor tree in Totoro at night; the Spirit Tree in Ori.
Manifest: heart light (phrase 3, warm, core), root-tip lights (phrase 1, green-gold,
small), canopy glints as motes (phrase 2–3), low ground haze.

### Garden (`garden`)

Prompts: "wake now, sleeping roots" (roots glow, trunk warms, canopy fills) / "bloom,
every waiting flower" (flowers open across the bed, staggered).

Target: dawn. Sky from indigo to peach as p grows. Sun rising as a soft gradient disc
(the Glow draws its corona). Canopy as 4–6 overlapping foliage clumps with dappled
three-tone shading, hiding the branch structure by p=1 (covering layer). Trunk as one
forking path with bark. 7–9 flowers with five bezier petals each, curving stems, a leaf
or two, opening with a small scale animation. Ground: three receding hill bands, grass
tufts in the foreground. Cloud: one hand-drawn wisp or none. Keep the pollen particles.
Manifest: sun warmth (large, low intensity, rising), pollen motes in the sunbeam region,
dawn haze low on the horizon.

### Well (`well`)

Prompts: "deep water, remember your name" (water rises in the shaft; the cross-section
reveal at ~30% stays, it was the first "wow") / "rise and carry the old songs home"
(water reaches the surface, runes flow, ripples, the bucket lifts a little).

Target: a weathered stone well ring at the surface (irregular fitted stones), a wooden
A-frame with a hand-drawn shingled roof, rope and bucket. Below: earth strata as
irregular layered paths (3–4 tones), root threads, pebbles; shaft walls of fitted
stones. Water as a luminous column with a visible surface line, ripple (SMIL), and a
caustic shimmer; runes on the wet wall glow when submerged; rising bubbles. Above:
grass tufts, a few stars. Manifest: water column light (cyan, yScale ≈ 0.45), rune
lights (up to 6, arriving as they submerge), a surface pool, faint sky haze.

### Library (`library`)

Prompts: "open, sleeping pages" (the hero tome opens, pages glow) / "every voice, rise
and speak as one" (books lift and float, three soft voice-rays lift from the tome,
crystals pulse, glyph-embers rise).

Target: shelves carved into rock walls receding left and right in perspective (three
depths), books as irregular spines with visible page edges, the tome on a lectern with
curling pages, three rays instead of five and softer, floating books at varied tilt with
faint page flutter (SMIL), ceiling crystals, glyphs rising like embers. Keep the dust
particles. Manifest: tome light (phrase 1, warm gold, core), crystal lights (phrase 2,
violet), dust motes in the rays' region, cavern haze near the ceiling.

### Sanctum (`sanctum`)

Prompts: "moonlight, pour into the circle" (beams pour down, the clearing floor pools
with silver) / "Oak, Alder, Yew, take your seats" (the spirits take their seats around
the ring, staggered, each turning toward the center).

Target: a ring of ancient trees with irregular silhouettes, conifers and broadleaf, in
three depth tones. Five low seat-stones around the ring. Keep the translucent teardrop
spirits and their SMIL pulse from v1 (they were praised); they arrive at the seats.
Moon above; soft SVG beams, the Glow does the real moonlight. Keep the fireflies.
Manifest: moon light, five spirit lights (arriving with each spirit), a moonbeam haze
band, firefly motes.

### Bridge (`bridge`)

Prompts: "stone, recall the crossing" (stones rise from the mist and lock into the arch;
each glows briefly as it settles) / "spirits, walk the old paths" (lanterns light, spirit
footprints cross left to right, staggered).

Target: cliff faces with strata and irregular edges (keep the concept), arch stones that
catch the lantern light (lighter local tone, warm rim), moss on the deck, five lanterns
with warm light, mist rolling in the chasm (SVG mist ellipses at low opacity plus the
Glow haze), a river glint or waterfall thread at the chasm floor, footprints as faint
glowing prints. Keep the mist particles. Manifest: five lantern lights, a dense cool
chasm haze, moonlight from above.

---

## 5. Signature passes for the scenes that keep their art

The director asked how the non-redrawn scenes stay special. Answer: every scene gets
the light manifest, the journal voice, and an idle-life pass; each of these four also
gets one **signature beat** that only it has. Keep the v1 composition and coordinates
(the manifests are tuned to them); change what's named here.

### Stars (`stars`) — "the constellations you name are the ones that draw"

Phrase 1 is now four constellation names: "Orion Lyra Cygnus Cassiopeia" (the pool only
permutes these four). The scene receives `wordsDone` (SceneProps): the finished words
of the current phrase, e.g. "Orion Lyra". **Each constellation draws itself the moment
its name is finished**, in whatever order the player types them; by the end of phrase 1
all four are up. Phrase 2 ("burn again with ancient fire") is the sky igniting: every
star brightens, the milky way blooms, the meteor climax stays.

Target: re-plot the sky so the four figures sit in distinct regions with recognizable
stylized shapes (Orion: belt of three + two shoulders + two feet, lower left; Lyra: small
parallelogram hanging from bright Vega, upper center; Cygnus: the cross with Deneb at the
head, upper right, clear of the moon; Cassiopeia: the W, left of center high). Background
stars stay scattered. Lines draw with stroke-dashoffset from the named star outward;
a faint label-free glow lingers on the figure's brightest star. Idle life: per-star
twinkle via SMIL opacity with phase offsets (not all stars, ~a third). Keep the moon
crescent (its dark disc must keep matching the sky color), the treeline, the horizon
haze. The Glow manifest (`manifests/stars.ts`) already exists: update its ANCHORS to
the four figures' brightest stars and gate each anchor on its constellation being drawn
(the manifest gets only `p`, so gate on the phrase-1 progress window instead).

### Stones (`stones`) — "light travels between the stones"

Keep the seven stone positions and rune centers (the manifest is tuned to them). Redraw
each stone as an irregular chipped silhouette (weathered edges, a notch or two) with a
lichen patch or two and a shadowed side; not a trapezoid. Phrase 2's ley lines become
**conduits**: once a line has drawn, a small pulse of light travels along it toward the
center stone (SMIL stroke-dasharray/offset on a short dash over the line path),
staggered per line so the ring breathes. The ritual circle keeps its ring; add a faint
rune ring on the ground. Grass tufts sway. The aurora becomes a soft curtain
(two or three long wavering paths with slow SMIL, low opacity), never a wash.

### Cottage (`cottage`) — "the journal falls open"

The story now turns on this book. On phrase 2 the journal, currently a spine on the
shelf, lies open on the windowsill beside the cat: two page shapes as paths, a few faint
handwritten lines (short wavering strokes) that brighten to warm gold, and at 99% one
page lifts and settles (SMIL). Idle life: candle flames flicker (SMIL scale/opacity on
the flame paths, subtle), steam drifts upward and fades on a loop, the cat breathes
(slow scaleY 1.0–1.015 over 4s from its base) and flicks an ear every ~8s. Manifest:
add a small warm light on the open journal for phrase 2.

### World (`world`) — options first

The 21-connection graph is defended territory. Rendering options come to the director
as screenshots after the new Tree lands: ley lines as ink threads with traveling light
and staggered peaks; softer nodes; three-tone hills with mist; callbacks redrawn to
match the v2 scenes; dawn breaking at the last phrase ("the forest remembers").

## 6. Not in this pass (director decisions or later phases)

Cottage hearth; act cards as painterly journal pages (text is in, art is v1); the
planting finale and keepsake; Stars 3D spike; the depth stage.

---

## 7. The frame: Waking World, Intro, Outro (director's note, 2026-09-06)

"The Waking World, the intro, and the outro all need the same kind of attention and
care that the individual scenes got." So: full redraws, not passes. Reference art for
all three is the finished v2 scene set, screenshot at 99% on desktop and mobile in
`/Users/cody/Desktop/Games/Inkwood/screenshots/v2-sweep/` (absolute path; read them).
The miniatures in the World and the Outro must read as those scenes.

### 7a. The Waking World (`src/scenes/v2/world.tsx`, `src/scenes/manifests/world.ts`)

Replace the A/B/C variant switch with one finished scene. Non-negotiable: `LEY_POINTS`
and `LEY_CONNECTIONS` stay byte-identical to `src/scenes/WorldScene.tsx` (7 nodes, 21
lines; diff them in the report). The three-phrase structure stays: earth 0–0.33 (hills
green up, garden blooms, cottage window lights), sky 0.33–0.66 (stars, moon, spirit
wisps), unity 0.66–1 (the Great Tree rises, the web completes, dawn).

Landscape: three depths (far ridge, mid hills, foreground meadow), each in three tones,
mist banked between them, a path or stream leading the eye in. Callbacks redrawn as
miniatures of the v2 scenes, placed so each sits on its LEY_POINT: garden tree at
(45,172) with the new bare-then-crowned silhouette; cottage at (312,112) with lit window
and chimney smoke; the constellation cluster at (280,55) as small real figures; the well
at (95,128) as stone ring plus A-frame; the bridge at (165,126) as a segmental arch; the
stones at (350,165) as seven chipped stones; the Great Tree at (200,40) with the new
clustered crown reaching the top edge and the heart glowing on phrase 3. Add the sanctum
and library as small non-node callbacks if they fit (a ring of trees with a moon pool; a
cavern mouth with a warm glow).

Lines: the ink-thread rendering from variant A (hair-thin stroke over a soft halo, each
thread flaring as it draws then settling, a small mote traveling toward the tree on a
staggered SMIL dash), with the draw schedule completing all 21 by unity 0.9. Nodes are
soft halos sized by weight (tree largest).

Dawn: phrase 3 ("the forest remembers") brings the dawn as the default ending: horizon
swelling peach to gold behind the far ridge, violet deepening at the top, moon paling,
low stars washing out, long soft shadows from the callbacks, threads turning gold-white.
Keep a `?worldvariant=night` switch (dev-only, read once at module init) that keeps the
night sky and skips the dawn, so the director can compare; default is dawn. Nothing
else differs between the two.

Manifest: rewrite `manifests/world.ts` to the new art: callback lights arriving with
their phrases, ley-node glows on unity, the tree heart, a dawn band on phrase 3 (whole-
frame light ≤0.05), thin valley mist (≤0.03), a few spirit motes over the valley.

### 7b. The Intro (`src/components/v2/Intro.tsx`, `src/styles/Intro2.module.css`)

The file is a copy of the shipped intro; the stylesheet is its own copy. Keep the
structure and behavior: title and Begin appear immediately; three dormant vignettes
(garden → cottage → sky) crossfade behind them on a 24-second loop (`CYCLE_LEN`,
`LOOP_PHASES`, the wrap-safe opacity sampling); the intro drone; the gesture-driven
`focusInput()` on Begin; the share link; the returning-player affordance. Defended, do
not change: the bordered Begin button; the dormant trees drawn as STROKED branches with
delicate twigs (a filled-silhouette version was rejected); the ogham rune logo and the
"Inkwood" wordmark.

Redraw the three vignettes in the v2 art language, at the 15–25% lightness floor (a
too-dark intro was fixed three times; check pixel values, not impressions):
- Dormant garden: the v2 Garden's bare branching tree over its receding hills at
  dormancy, stroked-branch style for the near tree, hills in three tones, latent buds.
- Dark cottage: the v2 Cottage's room at p=0, cold blue, the journal closed on the shelf,
  the window dark, no cat (it arrives when the room warms).
- Night sky: the v2 Stars' field with the figures NOT drawn (the stars are there, the
  lines are not), the moon low.
Idle life via SMIL: star twinkle on a third of the stars, the amber firefly mote's
drift (keep it), a slow grass sway, a slow cloud drift. Keep the dawn glow at the
horizon under the title.

The Glow: mount `GlowSurface` (`src/components/GlowSurface.tsx`) inside the same
`position: relative` container as the vignette SVG, with a local manifest whose lights
follow the cycle: `progressOf` returns `(time % CYCLE_LEN) / CYCLE_LEN`; in the sky
phase a moon halo, in the cottage phase a faint cold window, always a low warm dawn
band at the horizon (≤0.04) and the firefly mote as a tiny warm light. The manifest is
a `SceneManifest` (types in `src/scenes/manifest.ts`, tuning law in its header).

One new line under the title, small italic, in the journal's voice: "Someone wrote
this forest awake once." (The director may cut it; make it one element.)

Portrait: the intro letterboxes the SVG; the title block sits below it. Verify at
390×844.

Screenshot method (there is no screenshot.mjs mode for the intro; use this inline):
```bash
node --input-type=module -e "
import { createRequire } from 'module';
const { chromium } = createRequire('/Users/cody/Desktop/Games/Inkwood/package.json')('playwright-core');
import { readdirSync } from 'fs'; import { homedir } from 'os'; import { resolve } from 'path';
const cache = resolve(homedir(), 'Library/Caches/ms-playwright');
const v = readdirSync(cache).filter(d => d.startsWith('chromium-')).sort().reverse()[0];
const CHROME = resolve(cache, v, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const PORT = process.env.PORT ?? '4191';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox','--disable-gpu','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const mobile of [false, true]) {
  const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1400, height: 800 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:' + PORT + '/?v2&glowprobe=off', { waitUntil: 'networkidle' });
  for (const t of [1, 9, 17]) { await p.waitForTimeout(t === 1 ? 1000 : 8000); await p.screenshot({ path: './screenshots/intro-v2-' + t + 's' + (mobile ? '-mobile' : '') + '.png' }); }
  await ctx.close();
}
await b.close();
"
```
(Clear localStorage state is assumed: a fresh headless context starts on the intro.)

### 7c. The Outro (`src/components/v2/Outro.tsx`, `src/styles/Outro2.module.css`)

The file is a copy of the shipped outro; the stylesheet is its own copy. Keep the
structure and behavior: the timed phases (horizon draws → vignettes bloom left to right
→ the Great Tree grows and its roots connect every place → radiance → text and buttons),
the top dot row, "The forest remembers." then "It remembers you.", the bordered "Begin
Again" and "Replay any level" buttons, the share link, space/enter restart, and the loop
that never ends. Keep the `<PlantWord />` mount exactly where it is (after the two
lines, before the buttons); it is being built in parallel in its own file.

Redraw the panorama: the eight vignettes as miniatures of the v2 scenes (same
silhouette language as the World callbacks; both of you read the v2-sweep screenshots),
sky/far/mid/near depth with mist, the Great Tree as the new clustered crown with the
heart, roots as ink threads flowing to each vignette with traveling motes (SMIL). Dawn
continuity: the finale ends at dawn, so the outro assembles in first light (a warm band
low, violet high) rather than in the dark. Glow via `GlowSurface` with a local
manifest and `progressOf = () => Math.min(1, elapsed / 25)`: vignette lights arriving
as they bloom, the tree heart, a low dawn band (≤0.05).

Portrait: the outro letterboxes the panorama at the top with the text block below;
verify at 390×844 that the text and buttons still fit above the fold.

Screenshot method: as the intro snippet, but go to `'/?v2&dev&glowprobe=off'`, then
press F2, click the button whose text is exactly `outro`, press F2 again, and screenshot
at 4, 12, 20, 28 s (`intro-v2-…` → `outro-v2-…`). Port 4192.
