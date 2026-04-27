# Inkwood — Persona Review Panel v15

Date: 2026-04-26 (post-launch)
Trigger: First full critique after v1.0 shipped to inkwood.codywymore.com with GoatCounter analytics. The v14 priority stack mostly cleared the same day it was written (Tree rebuild, Sanctum spirits, Garden sway, Wander rename, Mac/Linux paths, custom domain, mp4 trailer). 70 in-game scene shots + 6 intro shots + 6 outro shots regenerated this cycle. Code Reviewer verified via `eslint`, `tsc --noEmit`, and `vitest run` — all clean.

Headline: **Inkwood is in the wild.** The release-readiness question is settled. What v15 surfaces is that two scenes that the v14 stack didn't directly address — Library and World — now look behind the others, and one v14 bet (Tree's overlapping canopy puffs) reads quieter at climax than the prompts demand. The art ceiling is raising, not the floor.

---

## 1. Code Reviewer

**Build:** Zero ESLint errors. Zero TypeScript errors. All tests passing. Production bundle 345 KB JS (~104 KB gzipped) + 20 KB CSS. PWA precache 13 entries (~767 KB) — the trailer mp4 is correctly excluded from the glob.

| Strength | Notes |
|---|---|
| Analytics layer is thin and correct | `src/analytics.ts` wraps GoatCounter with a retry-until-loaded pattern. App.tsx subscribes to `screen` + `lvl` and emits semantic paths (`/play/garden`, `/win/cottage`, etc.). 27 lines of code total; no PII; no cookies. |
| Pageview wiring uses StrictMode-friendly effect | The effect runs on screen+lvl change. Double-fire under StrictMode in dev would double-count, but this is a dev-only concern and StrictMode warnings are silent there. Production single-fires cleanly. |
| `armTerminationSilence` lands the audio fix | `pagehide` and `visibilitychange` both ramp masterGain to zero with a 30 ms tail. The mobile sine-burst on tab-close is gone. |
| Service worker excludes the trailer | `globPatterns` whitelists js/css/html/svg/png/webmanifest only. trailer.webm and trailer.mp4 are not precached, so the 2.4 MB asset doesn't hammer first-visit bandwidth. |
| Chrome path detection generalized | `findChrome()` helper in screenshot/og-image/intro-outro scripts now scans both Mac and Linux Playwright caches. |

| Concern | Severity | Notes |
|---|---|---|
| `getUserVolume` exported but unused outside `audio.ts` | Low | Same finding as v14. Either delete it or document why it's kept. Two-minute fix. |
| `armAudioPreload` still odd | Low | Called from module-level App import. Works, but the side-effect-on-import pattern is a smell. A `useEffect(() => armAudioPreload(), [])` in App would read more clearly. Not a bug. |
| GoatCounter retry caps at 25 attempts × 200 ms = 5 s | Low | If the third-party CDN is slow or blocked (uBlock, Brave shields), the first pageview is dropped silently. Acceptable trade-off — analytics shouldn't block UX — but worth knowing. |
| `index.html` tracks `no_onload: true` then we count manually | Low | The current setup is correct for SPA usage, but the inline option in `index.html` and the manual call in `App.tsx` are decoupled — if a future contributor removes `no_onload` thinking it's redundant, every pageview will double-count. Add a one-line comment in `index.html`. |
| Final scene screenshot.png + iphone test screenshots/ folders are untracked at repo root | Low | Six untracked dirs/files left over from iteration. Not a bug; just clutter. Add to `.gitignore` or delete. |

**Verdict:** Code health is as good as v14. No release blockers and no new bugs introduced by the launch wiring.

---

## 2. Narrative Director

**Average prompt rating: 4.85/5.** No regression. The Wander → "Replay any level" rename trades poetry for clarity and is the right call now that the audience is wider.

| Lvl | Prompts | Rating | Note |
|---|---|---|---|
| Garden | wake now, sleeping roots / bloom, every waiting flower | 5/5 | Imperative + embodied + exact. Still the model. |
| Cottage | little candle, burn bright / fill every room with warmth | 5/5 | Direct address. The new "Call the warmth home." flavor reads better than "the hearth is cold." |
| Stars | Orion Vega Sirius Lyra / burn again with ancient fire | 5/5 | Naming-as-summoning. Untouched. |
| Well | deep water, remember your name / rise and carry the old songs home | 5/5 | The new flavor — "The stones still remember the sound of water." — is one of the strongest lines in the game. Animist, specific, sad. |
| Bridge | stone, recall the crossing / spirits, walk the old paths | 5/5 | Two-step necromancy. |
| Library | open, sleeping pages / speak again, forgotten words | 4.5/5 | Strong but pair feels redundant with each other; both are about waking text. The visual escalation between phrase 1 and phrase 2 is also subtle (see Design Director). |
| Stones | stand tall again, guardians of old / remember what was promised | 5/5 | Ceremonial. The win text rewrite still lands. |
| Sanctum | moonlight, gather where spirits convene / return to your seats, ancient ones | 4.5/5 | Beautiful. Phrase 2 is still the longest phrase in the game (39 chars) — not a regression, but the char-count font scaling makes it visibly smaller than other prompts. |
| Tree | roots deeper than memory / branches wider than sky / awaken, heart of all things | 5/5 | Three-act incantation. "Awaken, heart of all things" remains the strongest single phrase. |
| World | garden bloom, hearth burn bright / stars remember, spirits sing / the ancient order is restored | 5/5 | Refrain-of-refrains. Closing benediction. |

**Flavor text:** Single sentences throughout. Tonally consistent. "The stones still remember the sound of water" (Well) and "Moonlight pools where the spirits once gathered" (Sanctum) carry the most weight.

**Win text:** Em-dashes still cleaned. One small note: most win cards are functional ("well done", "type the phrase above") rather than narrative. There's a missed opportunity for one or two more poetic mid-phrase echoes — but adding more text contradicts the meditative-economy principle, so this is a creative tradeoff, not a defect.

**Story arc:** Awakening → Discovery → The Nexus → Restoration. Visible escalation. The act-transition cards are the single longest text exposure in the game and they earn their length. None to cut.

**Verdict:** Narrative is done. The only Director-grade opportunity is rewriting Library prompt 2 to escalate from prompt 1 (currently both "wake the words"). Optional.

---

## 3. UX Researcher

| Strength | Notes |
|---|---|
| Per-screen analytics will tell the funnel story | `/intro` → `/play/garden` → … → `/outro` is now a queryable funnel. First-day data will reveal where players drop off. This is the single most valuable thing v1.0 added beyond the URL itself. |
| iOS keyboard refocus survives every transition | The singleton-input architecture still holds. No regressions visible in the current build. |
| Skip-intro logic intact | `hasCompleted` correctly short-circuits the dormant animation for returning players. Verified by inspection of IntroSequence.tsx behavior across the timelapse. |
| Mobile portrait letterbox holds | 8:5 aspect-ratio scene container with auto-height in portrait media query. Begin button reachable. Wander screen scrolls. |
| GoatCounter is privacy-friendly | No cookies, no fingerprinting, no PII. Aligns with the project's "meditative, no-leaderboards" ethos. |

| Friction | Severity | Notes |
|---|---|---|
| First impression on the title screen leans dormant-grey | Medium | The intro lands at a flat grey palette with stick-figure trees and a small rune. It reads as serious and intentional — but for someone arriving from a tweet expecting "cozy typing game," the entry frame is more austere than the gameplay it leads to. The 50% Garden screenshot is what should set expectations. |
| Stale "tap to skip" caption visible on title screen | Low | The intro skip caption persists at the bottom of the title frame even after the Begin button has appeared (see intro-15s.png). Should fade out once interactive elements are live, or move it onto the Begin row. |
| Library at 99% is ~95% of Library at 50% | Medium | Visually almost no escalation past the mid-point. A player who reaches phrase 2 expects more, gets the same. See Design Director note. |
| World at 99% reads as a network diagram | High | Same v13/v14 finding still unaddressed. The ley lines + ground halos + over-bright call-back canopy collide visually. Outro panorama is the showstopper; the in-game World is currently the weakest endgame moment. |
| Volume slider on desktop header | Low | On wide viewports the slider sits inline next to the Inkwood wordmark and is the first interactive thing a new player sees. It's not labeled — could read as a progress bar. Consider an icon-only mute on desktop too, with hover-to-reveal slider. |
| `phrase 1 of 2` indicator | Low | Useful but not visible when the prompt overlay is collapsed on mobile. Acceptable. |

**Verdict:** UX is solid. The two real polish items: World's in-game climax visual, and a "what is this game" hook for first-time desktop visitors arriving cold.

---

## 4. Design Director

**Grading rubric:** A = breathtaking thumbnail, B = good but not signature, C = competent. ± 0.3 grade.

| Scene | Grade | Most beautiful moment | Most ugly moment |
|---|---|---|---|
| Garden | A- | The 50% mid-bloom — round canopy + sun + cloud + hill, the dormant-to-alive transition is the cleanest in the game | The 0% silhouette: trunk reads as a hollow rectangular log with three sticks on top, not a sleeping tree. Could use a tapered base. |
| Cottage | A | 99% with the cat in the window + steam from cup + three lit candles + warm window glow. Cozy literally rendered. | None. Best-composed scene in the game. |
| Stars | A | 50% — moon crescent + named constellations connecting + treeline silhouette emerging | None significant. 99% gets dense with side-edge stars but it reads as abundance, not noise. |
| Well | A | The 50% "bucket descending into the underground column" moment. The cross-section reveal is the game's most original composition. | The grass-tuft texture above ground is faint at all progress points; the over/under transition line could be more articulated. |
| Bridge | A | 99% — five lit lanterns above the assembled stone arch with grass tufts. Reads as a votive. | The cliff silhouettes on the edges still feel structural rather than carved (straight verticals). |
| Library | B+ | 50% — central tome opening, floating books in arc, candles below | **The whole scene barely changes between 50% and 99%.** No second act. The arc of books is set, the tome is open, the crystals are placed — there's no climax beyond. Highest-impact polish remaining. |
| Stones | A- | 50% — six standing stones with carved runes, varied silhouettes, ritual fog | The runes still read as vector glyphs rather than weathered carvings. v14 noted this; not yet addressed. |
| Sanctum | A- | 50% — moonbeam shafts through the canopy, stars pinpointing, halo arrangement preparing | The teardrop spirits at 99% are smaller than the moonbeams — they read as fireflies more than presences. Could grow ~30% in size or pulse more visibly. |
| Tree | B+ | 50% — the trunk is properly thick, bark detail visible, branches starting to fill out | 80%/99% — the canopy is wide horizontally but flat vertically, sitting like a topiary cap rather than spreading like an axis mundi. The trunk-to-canopy proportion improved over v14, but the canopy still doesn't dominate the frame the way "branches wider than sky" promises. |
| World | B | The night sky + crescent moon + distant cottage with warm window, around 50-60% | **99% is busy and confused.** Three diagonal yellow ley lines cross the frame like laser beams; an oversized green canopy overlays the back hill; ground halos compete with the building lights. The reference moment is the outro panorama — but the *in-game* World scene still doesn't deliver it, because the player sees it accumulate over their typing rather than as a finished tableau. Either dial back the ley-line intensity or stagger them so they don't all peak at 99%. |
| Intro | B+ | 9s — sky vignette: crescent moon + conifer treeline silhouettes. Painterly. | The opening dormant-trees vignette has a stick-figure trunk pair with branches that read as flat paint strokes. Compared to the conifers at 9s, the trees here look unfinished. |
| Title | B | The rune logo + "Inkwood" wordmark + Begin pairing is clean | The dormant trees that frame the title are the same austere stick-figures from the dormant intro. The title screen is the marketing surface — a hint of color or one-glow-of-life accent (a single yellow leaf? a faint sunrise behind the horizon?) would soften the "is this finished?" first impression. |
| Outro | A | 16s — full panorama with all 10 dot-row indicators lit + every vignette glowing + ley lines connecting | The mid-build phase (8-12s) has a stretch where the panorama is sparse — the tree hasn't grown, the right-side vignettes haven't appeared yet. Not ugly, just empty-feeling. |

**Average grade:** A- across the 10 scenes (vs. A- in v14). Library and World drag the average down; Cottage and Stars and Well hold it up.

**Verdict:** Eight scenes at A- or above. Two (Library, World) at B+/B with concrete fixes. Tree's climax is improved but not at the level its prompts deserve.

---

## 5. Product Lead

**Launch readiness:** Shipped. Live at inkwood.codywymore.com. GoatCounter watching the funnel.

**Five things that would make someone screenshot:**
1. **Outro panorama at peak** with all 10 dot-row indicators lit (~22s in). Most likely organic share.
2. **Stars at 50%** — the named constellations forming with the moon crescent.
3. **Cottage at 99%** — the cat in the window with steam from the cup.
4. **Well at 50%** — the underground reveal with the bucket descending.
5. **Bridge at 99%** — the five lanterns above the assembled stone arch.

**Top blockers for next round of public sharing:** None hard. Two soft:
- **World scene in-game finale** is the weakest endgame visual moment. If a high-profile share lands a player in that screen, it underdelivers compared to everything before.
- **Title-screen first impression** for desktop visitors arriving cold. Currently reads austere; could use one warmth accent without breaking the dormant-world setup.

**What NOT to do right now:**
- Don't add features chasing engagement metrics. The meditative pacing is the brand. If GoatCounter shows drop-off at level 5, the answer is to make level 5 more striking, not to add a streak counter.
- Don't redesign Cottage, Stars, Well, or Bridge. They're at A and they're working. Polish *Library* and *World*.
- Don't push the trailer harder yet. Let v1.0 sit in the wild for a week, watch the analytics, then decide whether the trailer or a static screenshot is the better share asset.
- Don't add more prompts. The pool sampling is calibrated.

**Verdict:** Ship is shipped. Watch the funnel for a week, then prioritize Library/World based on what the data says about where players actually drop off.

---

## 6. Alpha Tester Panel

### Cal — patient explorer
- **Highlight:** The Well cross-section, *again*. Also pauses at Stars 50% to count constellations. Notices the cat blinks in Cottage.
- **Confusion:** None.
- **Bored:** No.
- **Would they share?** Yes — sends the URL to two friends with a one-line "you'll like this."

### Alex — fast typist
- **Highlight:** The completion sweep audio + 1.5s breathing pause has now clicked as deliberate; treats it like a meter rather than friction.
- **Confusion:** None.
- **Bored:** Only at the World finale: "I typed three things and the screen got busy and then it ended." The build-up doesn't pay off in real time the way the outro does.
- **Would they share?** Posts the URL to Bluesky with one line.

### Dana — impatient
- **Highlight:** The Outro panorama, like always. Closed the tab once before reaching it on first try (got distracted at Library because nothing visibly changed past phrase 1).
- **Confusion:** Library — "is it broken? did I do it?"
- **Bored:** Library phrase 2.
- **Would they share?** Sends URL to one friend; doesn't say anything about it.

### Sam — non-gamer on phone
- **Highlight:** Cottage cat. Bridge lanterns. The fact that the keyboard "just stays open" between levels, even though they didn't notice it as a feature.
- **Confusion:** First arrival on the title screen on iPhone — "is it loading? what do I do?" The grey palette + small rune + "Begin" button reads as a placeholder until they tap. After tapping, fine.
- **Bored:** No.
- **Would they share?** Yes — to one specific person.

### Panel consensus
The game is in a real public state. Two specific gripes are now reproducible across multiple testers: (a) Library phrase 2 doesn't deliver, (b) World finale is busy. Title screen first impression is a third, smaller issue. Nothing else is a regression and the game continues to land emotionally on the testers it's meant for.

---

## Priority Stack — v15

Twelve items, ranked by impact-to-effort ratio. Heavy weight given to the human's prior pattern: art polish on the highest-leverage moments, mistrust of geometric/network looks, and a strong preference for visible payoff per typed phrase.

| # | Item | Impact | Effort | Category |
|---|---|---|---|---|
| 1 | **Library scene phrase-2 escalation.** Currently 99% looks like 50%. Add a second wave — the open tome's pages flutter, glyph-light lifts off the pages and joins the floating books, the cavern lights brighten, crystals pulse. Highest user-visible regression in the game right now (multiple testers noticed). | High | Medium | Art |
| 2 | **World scene in-game finale rebalance.** Currently 99% reads as a network diagram with three laser-bright ley lines and an oversized callback canopy. Stagger the ley lines so they don't all peak together, dim them ~40%, and shrink the upper-canopy callback. Goal: make the in-game World scene look like a 1400×800 frame from the outro panorama, not a different diagram. | High | Medium | Art |
| 3 | **Title screen warmth accent.** One small detail to soften the dormant first-impression — a single yellow leaf falling, a faint sunrise glow on the horizon, or a single firefly drifting near the rune. Don't break the "dormant world" theme; just wink at the warmth that's coming. | High | Small | Art |
| 4 | **Tree canopy at 99% — verticality.** The rebuild widened the trunk and added overlapping puffs but the canopy still reads as a flattish hat. Add 2-3 puffs that extend higher and break the upper edge silhouette, plus a faint upward gradient so the canopy feels heaven-touching. The prompts say "branches wider than sky" — the visual should disagree with itself by a hair (canopy reaches up *and* out). | Medium | Small | Art |
| 5 | **Sanctum spirit-figure scale.** Translucent teardrops are correct in concept but smaller than the moonbeams at 99%. Grow ~30% and add a slow pulse opacity (0.6 → 0.9 → 0.6 over 4s) so they feel breathing. | Medium | Small | Art |
| 6 | **Garden dormant-trunk silhouette.** The 0% silhouette is a thick rectangular base with three skeletal branches on top — reads as a hollow log, not a sleeping tree. Taper the base and curve the branch attachment so the silhouette resolves to a tree even at full dormancy. | Medium | Small | Art |
| 7 | **Intro dormant-tree silhouettes.** Same finding as the Garden trunk but in the intro frame. The conifer treeline (intro-9s) is painterly; the opening trunk pair (intro-0s) is not yet at that level. Either retire them in favor of more conifer silhouettes, or upgrade the trunks to match. | Medium | Medium | Art |
| 8 | **Library tome glow at 99%.** Even after the phrase-2 escalation in #1, the tome itself could radiate more light at full progress — the open pages currently sit at the same brightness as 50%. | Medium | Small | Art |
| 9 | **Cottage floor light pool.** Carried over from v14. Soft floor light pool when candles are lit; floor stays uniformly dark currently. Small but adds depth. | Low | Small | Art |
| 10 | **Title-screen "tap to skip" caption.** Persists into the title frame after the Begin button is interactive (visible in intro-15s.png). Fade out or remove once Begin is live. | Low | Small | Bug |
| 11 | **Stones rune carving texture.** Runes still read vector-perfect rather than weathered. v14 noted this; not yet addressed. Add a subtle filter or hand-jitter to the path data. | Low | Medium | Art |
| 12 | **GoatCounter funnel-watch + first-week response.** Wait one week, pull the funnel, and use the data to re-prioritize this list. If players drop off at Library, that's #1's confirmation. If they drop off at the title screen, that's #3's. Don't rebuild blindly — let the funnel speak. | High | Small | Process |

**Launch verdict:** Inkwood is live. Next bet should be #1 (Library phrase-2 escalation) and #2 (World in-game finale) — both target moments where multiple testers noticed underdelivery. After that, watch the analytics for a week before committing to more art work.

---

## What Changed Since v14

The same-day cleanup of v14's priority stack:

- ✅ **Tree scene rebuild** — widened trunk with bark detail, six overlapping canopy puffs (still room to escalate at 99%, see #4 above)
- ✅ **Sanctum spirit figures** — translucent teardrops with radial-gradient pearls + halos (now propagated to World and Outro for consistency)
- ✅ **Custom domain** — inkwood.codywymore.com via CNAME in `public/`, base path `/`
- ✅ **Trailer .mp4 export** — appended to scripts/trailer.mjs
- ✅ **Mac/Linux Chrome paths** — `findChrome()` helper across screenshot/og-image/intro-outro scripts
- ✅ **Garden flowers — bezier petals with sway** — `<animateTransform>` on each flower
- ✅ **Wander → "Replay any level" rename** — clarity over poetry
- ✅ **Volume slider** — compacted to icon-only on mobile
- ✅ **Audio termination silence** — `armTerminationSilence()` on `pagehide` / `visibilitychange`, kills mobile sine-burst on tab-close
- ✅ **PWA + analytics** — service worker, manifest, GoatCounter per-screen pageviews
- ✅ **v1.0 launch (2026-04-26)** — site is live

**Average grade v14 → v15:** A- → **A-** (held steady; Library and World drag, the rest hold).

The remaining work is making the climax scenes (Library, World, Tree at 99%) match the rest, and listening to what the launch funnel says before committing to more.
