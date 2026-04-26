# Inkwood — Persona Review Panel v14

Date: 2026-04-26
Trigger: First six-persona pass since v13 (2026-04-13). The intervening sessions shipped: singleton-input architecture (fixes iOS keyboard refocus), three-act layered audio + 30s trailer with title splash, rune brand pass on title and favicon, mobile portrait letterbox, em-dash audit, breaths-state cleanup, master volume slider, skip-intro for returning players, in-app share button, daily prompt rotation, and a hand-drawn treeline replacing the dormant-sky triangle row. 82 screenshots regenerated this cycle (10 scenes × 7 progress points + intro/outro timelapses). Code Reviewer verified via `eslint`, `tsc --noEmit`, and `vitest run` — 24/24 passing.

Headline: This is the first cycle where launch readiness is no longer the question — it's ready. The remaining work is opportunity, not debt. Two scenes (Tree, Sanctum) are a half-grade behind the rest; one bug (`armAudioPreload` is exported but never called) is real but inconsequential.

---

## 1. Code Reviewer

**Build:** Zero ESLint errors. Zero TypeScript errors. 24/24 tests passing. Production bundle 356 KB of assets (~107 KB gzipped including the rune favicon, OG image, trailer.webm at 2.4 MB shipped separately and not in the precache glob).

| Strength | Notes |
|---|---|
| Singleton input via React context | The architecture I'd reach for. PersistentInput owns the `<input>`, `InputContext` exposes `focusInput`/`blurInput`/`rejectTick`. Eight gesture-driven buttons (Begin, Continue, level cards, etc.) call `focusInput()` synchronously before dispatching state. Survives screen swaps cleanly. |
| Daily prompt rotation | Mulberry32 PRNG seeded from UTC date + level index. Deterministic within a day, rotates next. First-playthrough still uses canonical via the `inkwood-completed` gate. Tests pass. |
| Trailer pipeline | Playwright records → ffprobe measures → ffmpeg renders four-act layered audio (C/E2/D/G chords with cross-fades) → muxes with `-ss` crop. Repeatable from `node scripts/trailer.mjs`. |
| Em-dash audit | Card text and metadata both cleaned. The Stones winText was rewritten to break the contrastive pattern, not just swap a punctuation glyph. |

| Concern | Notes |
|---|---|
| `armAudioPreload` is dead | Exported from `audio.ts`, called once at `App.tsx` import time. But the function relies on `addEventListener({ once: true })` set up *before* any user gesture. Because module-level code runs before the React tree mounts, it does fire — but it's not exercised by the rest of the codebase except this one call. Not a bug, just confusing. The function fires its priming listener correctly and the AudioContext warms up on first interaction. |
| Mac path hardcoded in two scripts | `screenshot.mjs` and `trailer.mjs` both have `MAC_PATH` literal pointing at Cody's `~/Library/Caches`. Linux fallback exists. Anyone else cloning the repo and trying to run trailer/screenshot tooling will hit a "no such file" error and need to edit the script. Document or generalize. |
| Two unused exports | `getUserVolume` is imported but `setUserVolume` is the only one called outside `audio.ts`. Minor. |

**Verdict:** Code is in great shape. No release blockers.

---

## 2. Narrative Director

**Average prompt rating: still 4.8/5.** No regression since v13. The em-dash audit on win text only improved rhythm without changing meaning. Per-level rating:

| Lvl | Prompts | Rating | Note |
|---|---|---|---|
| Garden | wake now, sleeping roots / bloom, every waiting flower | 5/5 | Imperative, embodied, exact |
| Cottage | little candle, burn bright / fill every room with warmth | 5/5 | Direct address |
| Stars | Orion Vega Sirius Lyra / burn again with ancient fire | 5/5 | Star-naming as invocation; second prompt summons |
| Well | deep water, remember your name / rise and carry the old songs home | 5/5 | Animist; the water itself is asked to remember |
| Bridge | stone, recall the crossing / spirits, walk the old paths | 5/5 | Necromantic, two-step |
| Library | open, sleeping pages / speak again, forgotten words | 5/5 | Bibliomantic |
| Stones | stand tall again, guardians of old / remember what was promised | 5/5 | Ceremonial; second prompt has weight |
| Sanctum | moonlight, gather where spirits convene / return to your seats, ancient ones | 4/5 | Beautiful but the second prompt is the longest in the game (39 chars) — the new char-count font scaling lands it on one line, but it's at the edge of legibility |
| Tree | roots deeper than memory / branches wider than sky / awaken, heart of all things | 5/5 | Three-act incantation; "awaken, heart of all things" might be the strongest single phrase in the game |
| World | garden bloom, hearth burn bright / stars remember, spirits sing / the ancient order is restored | 5/5 | Refrain-of-refrains; closing benediction |

**Win text:** All cleaned of em-dashes. The rewritten Stones win ("Light races between the stones. Conduits, all of them.") avoids the contrastive trap and reads cleaner.

**Flavor text:** All single sentences. Tonally consistent. Nothing to cut.

**Story arc:** Awakening → Discovery → The Nexus → Restoration. Visible escalation. Each act bridges with a 7s interstitial. Tonal/audio shifts are now wired into the trailer too.

**Verdict:** Narrative work is done.

---

## 3. UX Researcher

| Strength | Notes |
|---|---|
| iOS keyboard never blinks out between levels | The biggest UX bug in the project's history is fixed. Real. |
| Skip-intro for returning players | `hasCompleted` short-circuits the 14s dormant animation. Removes friction for replays. |
| Share button | Native `navigator.share` on mobile, clipboard fallback on desktop, "Link copied" microcopy with timed reset. Subtle bottom-of-overlay placement. |
| Daily prompt rotation | Recurring-visit hook; same prompts within a UTC day, rotates fresh tomorrow. No leaderboards, no streaks — Wordle-y feeling without Wordle's competitive lean. |
| Master volume slider | Replaces binary mute. Persisted. Slider is visible only on the playing screen; mute icon still works as a quick toggle. |
| Mobile portrait letterbox | Scene plays at natural 8:5 ratio so no Garden-tree gets clipped. Title/outro text sit close beneath. |
| Wander scroll on mobile | Container has constrained height + overflow-y now. Was a real bug; fixed. |

| Friction | Notes |
|---|---|
| Volume slider is small on iPhone | ~48 px wide. Touchable but not pleasant. Could grow to ~80 px or expose a popover. |
| Long-prompt font scales down meaningfully | Sanctum prompt 2 lands at ~0.78 rem on a 393-px viewport. Legible but visibly smaller than other prompts. Acceptable trade for staying on one line. |
| Wander button label is enigmatic | "Wander the woods" — only the player who's completed the game once knows what it does. Tooltip or single-line explainer below could help; tradeoff is more chrome on the title screen. |
| Idle nudge hidden on portrait | The "↓ type here" caption was suppressed on portrait this session because it collided with flavor text. Pulsing border still nudges. Acceptable. |
| The 1.5 s breathing pause between phrases | Intentional but Alex (the fast typist) noticed. Won't change. |

**Verdict:** UX is solid. The two real polish items: bigger volume slider on touch, and possibly a "what is wander?" affordance.

---

## 4. Design Director

**Grading rubric:** A = breathtaking thumbnail, B = good but not signature, C = competent, D = phoned in. Plus/minus 0.3 grade.

| Scene | Grade | Most beautiful moment | Most ugly moment |
|---|---|---|---|
| Garden | A- | The flower row at 99% — bezier petals catch the late light | The hand-drawn flowers feel slightly stuck-on against the smooth tree silhouette |
| Cottage | A | Cat on the windowsill with one peeking eye + steam from cup | None — composition is cohesive |
| Stars | A | Moon crescent + constellation drawing + treeline silhouette at climax | Side-edge stars at 99% are dense; can read busy |
| Well | A | The cross-section reveal at ~30% — the underground appears | Background grass texture above ground is faint; ground feels thin |
| Bridge | A- | Five lit lanterns above the assembled stones — looks like an offering | Lower portion of stones is somewhat lost in the dark dell at the bottom |
| Library | A- | Central tome opening to two visible pages, with floating books in arc | Background cavern walls are very dark, robbing the books of contrast |
| Stones | A- | Ley lines + rune symbols on tall standing stones | The rune symbols on the stones look too clean / vector-perfect, not carved |
| Sanctum | B+ | Moonbeams shafts angling down into the clearing with the cone-figure halo arrangement | The "spirit figures" read as solid cones rather than translucent, glowing presences |
| Tree | B | Glow ring around trunk during root-phase | At 99% the canopy is a single big green ellipse-stack; the trunk is thin relative to the canopy; missing the "axis mundi" gravitas the prompts demand |
| World | B+ | Outro reveal: panorama assembling vignette by vignette is the showstopper | At 99% in-game the ley-line web is dense and intersecting; reads as a network diagram, not a vista |
| Intro | A- | New treeline silhouettes — painterly conifers replacing triangles | None significant; the dormant garden trees would still benefit from filled-bezier branches with taper rather than constant-width strokes |
| Outro | A | The full panorama at peak with all dot row lit + ley energy + Begin Again + Wander + share | Mid-build phase has a quiet 6-9 s window where the tree is growing but the text hasn't appeared yet — empty-feeling on portrait |

**Tree scene** is the single highest-impact remaining art bet. It's the climax level, the prompts demand cosmic weight, and the canopy reads cartoonish at peak. Either thicken the trunk dramatically, give the canopy more layered shapes (overlapping ellipses with varied tones), or both.

**Sanctum spirits** are the second-highest. Currently rendered as solid cones with halo arrangement — should be ghostly silhouettes with internal glow, more "presence" than "object."

**Verdict:** Eight scenes at A- or above. Two (Tree, Sanctum) at B+/B.

---

## 5. Product Lead

**Launch readiness: ready.** The trailer ships, the OG image renders correctly on Twitter/iMessage, the share button works, mobile is solid, audio is dynamic, the singleton input fix removed the last critical friction point.

**Five things that would make someone screenshot:**
1. The full outro panorama with all 10 dots lit (already happens — the most likely organic share)
2. Stars at climax (constellation web + crescent moon + treeline)
3. Well at 50% — the underground reveal moment
4. Bridge with the five lanterns lit
5. The new rune logo on the title screen

**Top blockers for public release:** None.

**Soft blockers / would-be-nice:**
- Custom domain (`inkwood.fun` or similar) — buy + DNS + CNAME file
- Trailer in .mp4 alongside .webm for platforms that won't autoplay webm (one ffmpeg command)

**What NOT to do right now:**
- Don't add more scenes. The 10-level structure is calibrated.
- Don't add achievements, streaks, or leaderboards. Would betray the meditative tone.
- Don't redesign anything that's at A-/A. Tree and Sanctum yes; the rest no.
- Don't pursue audio composition beyond the in-game synthesis. The drone-as-trailer-audio works.

**Verdict:** Ship. Address Tree + Sanctum + custom domain after the first round of public sharing if the feedback says so.

---

## 6. Alpha Tester Panel

### Cal — patient explorer
- **Highlight:** The Well cross-section at ~30% progress — pauses to read the runes appearing one by one. Calls out the new dormant treeline silhouettes as "actually pretty."
- **Confusion:** None.
- **Bored:** No.
- **Would they share?** Yes. To one specific friend who likes Journey.

### Alex — fast typist
- **Highlight:** The completion sweep when finishing a phrase. Crisp.
- **Confusion:** None.
- **Bored:** The 1.5 s breathing pause between phrases registers as friction. Notices it but accepts it as intentional once the rhythm clicks.
- **Would they share?** Posts the OG image on Bluesky with one line.

### Dana — impatient
- **Highlight:** The Outro panorama assembly is the only thing that gets a smile. Big enough payoff for the time invested.
- **Confusion:** Initially typed before tapping the prompt box on first run; once focus landed, they were fine. The singleton-input fix means this only happens once.
- **Bored:** First-run intro felt long. Skip-intro on second visit fixes the replay case.
- **Would they share?** Probably not. Sends the URL to one person with "hey try this."

### Sam — non-gamer on phone
- **Highlight:** "It's pretty." Specifically the Cottage cat. Loved Bridge.
- **Confusion:** Initially didn't know what to do. The "type here" idle nudge caught them in time on first prompt. The new singleton-input means subsequent levels just work without re-tapping.
- **Bored:** No.
- **Would they share?** Yes — sends to a younger sibling.

### Panel consensus
The game has crossed the threshold from "interesting prototype" to "thing you actually send to a friend." Two specific reservations: the Tree scene at climax doesn't deliver the gravitas the prompts promise, and the Sanctum spirit figures read flat. Neither is a release blocker.

---

## Priority Stack — v14

Eight items, ranked by impact-to-effort ratio.

| # | Item | Impact | Effort | Category |
|---|---|---|---|---|
| 1 | **Tree scene (level 9) climax rebuild.** Thicker trunk, layered overlapping canopy (multiple bezier ellipses with subtle tonal variance), more visible diagonal roots. The prompts say "axis mundi" — the art currently says "shrub on stick." Highest-leverage remaining art item. | High | Medium | Art |
| 2 | **Sanctum spirit figures.** Currently solid cones at the clearing center. Reframe as translucent glowing presences — soft inner light, faint robe outline, slight bob. Needs a particle or filter pass, not a full rebuild. | Medium | Small | Art |
| 3 | **Custom domain.** External purchase + CNAME file in repo root + four URL updates in `index.html` (og:url, twitter:url, og:image, twitter:image). Cheap, real signal of seriousness. | High | External | Marketing |
| 4 | **Trailer .mp4 export.** One additional ffmpeg command appended to `scripts/trailer.mjs` (`-c:v libx264 -pix_fmt yuv420p -c:a aac trailer.mp4`). Some social platforms still prefer mp4 over webm. | Medium | Small | Code |
| 5 | **Volume slider touch target.** Grow from 48 px to ~72 px on portrait, or move to a click-to-expand popover. Currently fiddly to drag precisely on iPhone. | Low | Small | UX |
| 6 | **Generalize Mac/Linux Chrome paths** in `screenshot.mjs` and `trailer.mjs`. Currently embed `/Users/cody/...` literal. Use `process.env.HOME` or `os.homedir()` so anyone cloning can run the tooling. | Low | Small | Code |
| 7 | **Garden flowers — bezier petals with sway.** Currently five flower silhouettes at fixed Y. Add tiny rotation animation (±3° wobble) or subtle vertical bob so they don't feel pasted onto the hill. | Low | Small | Art |
| 8 | **Wander button explainer (or rename).** "Wander the woods" is poetic but opaque. Either show a one-line description on hover/tap, or rename to "Replay any scene." Tradeoff: prose vs. clarity. Decide. | Low | Small | UX |

**Launch verdict:** Inkwood is shippable now. Items 1-2 are recommended before a high-profile public post (HN, indie game subreddits), 3-4 are recommended for any campaign that crosses platforms, 5-8 are ongoing polish. None are blockers.

---

## What Changed Since v13

In rough chronological order across the intervening sessions:

- ✅ **iOS keyboard refocus across interstitials** — singleton input architecture
- ✅ **Outro redesign** — top-center dot row, removed disconnected canopy stubs, three-button footer (Begin Again / Wander / Share)
- ✅ **Mobile portrait layout** — letterboxed scenes at natural 8:5, prompt font auto-scales by character count
- ✅ **Rune logo + favicon** — Ogham-style stave with three diagonals replaces the old stick-tree
- ✅ **OG image regenerated** — Stars climax + wordmark + tagline
- ✅ **Em-dash audit** — card text and share metadata
- ✅ **Breaths state stripped** — was dead since outro redesign
- ✅ **Master volume slider** — beside the existing mute toggle in the playing header
- ✅ **Skip-intro for returning players** — `hasCompleted` short-circuits the dormant animation
- ✅ **In-app share button** — `navigator.share` with clipboard fallback
- ✅ **Daily prompt rotation** — Mulberry32 PRNG seeded from UTC date
- ✅ **Trailer (v6 shipped)** — 30s, three layered act-pads cross-fading, no dev-panel pop, clean black at start, title splash at end
- ✅ **Dormant intro treeline rebuild** — hand-drawn conifer silhouettes replace the triangle row

**Average grade v13 → v14:** A-/A → **A.**

The remaining work is making the climax scenes (Tree, Sanctum) match the rest, and pushing out into the world.
