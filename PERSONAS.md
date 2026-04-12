# Inkwood — Persona Review Panel v11

Date: 2026-04-09
Post-polish critique after full priority stack execution across sessions. All 10 scenes rebuilt or polished. Audio system with three layers. Physics particles in 5 scenes. Mobile responsive. /critique skill created.

---

## 1. Code Reviewer

### Assessment

**Build:** Zero lint errors, zero TypeScript errors. Clean deploys to GitHub Pages.

**Bundle:** 449KB (138KB gzip). Reasonable for a 10-scene game with synthesized audio and particle physics. No lazy-loading needed at this size.

| Strength | Notes |
|---|---|
| Quantized progress + React.memo | Scenes only re-render on 0.01 increments — working correctly |
| useSyncExternalStore for particles | Correct pattern, avoids setState-in-effect |
| Audio module architecture | Clean exports: startAmbient, stopAmbient, playCompletionSweep, startIntroDrone, startTexture |
| Shared sub() utility | Extracted from 10 duplicate definitions to scenes/util.ts |
| Portrait-responsive layout | Flex column + aspect-ratio scene + dvh units |
| Error boundary | Safety net around scene rendering |

| Issue | Severity |
|---|---|
| Dead files: TitleScreen.tsx, GameWinScreen.tsx, TitleScreen.module.css, palettes.ts, scenes/index.ts | Low — 500+ lines of dead code |
| Star is the only primitive still imported (StarScene) — the rest of svg/primitives.tsx (310 lines) is dead | Low |
| Audio: 5 oscillators in Act II on budget Android — untested | Low |
| No audio preload — AudioContext created on first interaction, may cause brief stutter | Low |

### Verdict
Ship-ready. Clean the dead files before public release but nothing is blocking.

---

## 2. Narrative Director

### Assessment

| Level | Prompts | Rating | Prompt↔Visual Alignment |
|---|---|---|---|
| Garden | "wake now, sleeping roots" / "bloom, every waiting flower" | 4/5 | **Strong** — roots glow, canopy covers branches, flowers bloom with organic petals |
| Cottage | "little candle burn bright" / "fill every room with warmth" | 5/5 | **Excellent** — candles light sequentially, amber floods the room, cat appears |
| Stars | "Orion Vega Sirius Lyra" / "burn again with ancient fire" | 5/5 | **Excellent** — stars appear by name, constellations draw with dash animation |
| Well | "deep water remember your name" / "rise and carry the old songs home" | 5/5 | **Excellent** — water rises through full cavern channel, runes flow downstream |
| Bridge | "stone, recall the crossing" / "spirits, walk the old paths" | 5/5 | **Excellent** — stones float to cliff-tops, lanterns ignite, footprints walk |
| Library | "open, sleeping pages" / "speak again, forgotten words" | 4/5 | **Strong** — tome opens, runes rise. Floating books don't connect to prompts directly. |
| Stones | "stand tall again guardians of old" / "remember what was promised" | 5/5 | **Excellent** — stones rise, ley lines connect, ritual circle manifests |
| Sanctum | "moonlight, gather where spirits convene" / "return to your seats, ancient ones" | 4/5 | **Strong** — moon + beams + spirits visible. Firefly particles add atmosphere. |
| Tree | "roots deeper than memory" / "branches wider than sky" / "awaken, heart of all things" | 5/5 | **Excellent** — three-phase glow, canopy blooms with leaf sparks, heart pulses |
| World | "garden bloom, hearth burn bright" / "stars remember, spirits sing" / "the ancient order is restored" | 5/5 | **Excellent** — landscape assembles, callbacks to each level, ley lines connect |

**Average: 4.8/5.** Up from 4.6.

**Audio is now a genuine narrative layer.** Three-layer synthesis (tonal pad + nature texture + completion sweep) with per-scene variation and act-transition bridging. The intro drone sets mood before gameplay. The silence during level-win screens functions as a breath between incantations.

---

## 3. UX Researcher

### Assessment

| Finding | Status |
|---|---|
| Mobile portrait layout | **Working** — flex column, aspect-ratio scene, compact typing |
| iOS keyboard accessory bar | **Accepted** — system feature, cannot be removed in pure web |
| Typing hint discoverability | **Improved** — pulsing "tap here" animation |
| Save/resume | **Working** — invisible, localStorage-based |
| 1.5s breathing pause | **Correct** — confirmed by testers |
| Scene content above y=170 | **Fixed** — ritual circle, spirits, mandala all raised |
| "well done" bounce | **Fixed** — checkmark removed |
| Intro on mobile | **Fixed** — landscape aspect ratio container |
| Outro on mobile | **Fixed** — landscape aspect ratio container |

**Remaining gaps:**
- Act transition screen (7s) has no skip affordance beyond low-contrast "space to skip" text
- No overall progress indicator (by design — meditative pace)
- Audio context created on first interaction — may stutter briefly on some devices

---

## 4. Design Director

### Scene Grades

| Scene | Grade | Animation Arc Assessment |
|---|---|---|
| **Garden** | **B+** | 0→20%: bare tree, muted greens. 40%: canopy appearing, sun rising. 60%: first flower, grass tufts. 80-99%: full canopy, bezier petal flowers, physics pollen. Covering-layer technique works. Canopy bumps improved. |
| **Cottage** | **A-** | 0%: cold blue room. 20%: first candle lit. 40-50%: amber spreading. 60-80%: cat, journal, herbs. 99%: full warmth, rug. Temperature shift is the signature. |
| **Stars** | **A** | 0%: dark sky. 20%: moon crescent. 40-50%: bright stars, treeline. 60-80%: constellation lines drawing. 99%: full constellations, comets. The gold standard. |
| **Well** | **B+** | 0%: dry cross-section. 20%: water starting. 40-60%: rising with runes, flow lines. 99%: runes downstream. Central shaft still reads as rectangle filling. |
| **Bridge** | **A-** | 0%: cliffs, mist particles. 20%: stones floating up. 40-50%: arch at cliff-tops. 60%: nearly complete. 99%: lanterns, footprints, vegetation. Dramatic sky. |
| **Library** | **A-** | 0%: cavern, archway, closed tome, altars, crystals. 40%: tome open, light spilling. 60%: floating books, dust. 99%: runes rising, full glow, wisps. Rich. |
| **Stones** | **B+** | 0%: dark moorland. 20-40%: stones rising. 50-60%: ley lines. 99%: ritual circle, aurora, wisps. Moss patches warm the ground. |
| **Sanctum** | **A-** | 0%: dark clearing. 20%: moon rising. 40-50%: forest framed, mandala. 60-80%: spirits, fireflies. 99%: full ceremony, golden light. Varied tree shapes. |
| **Tree** | **A-** | 0%: dark trunk. 20-40%: roots glowing diagonally. 50-60%: branches glowing. 80%: canopy bloom. 99%: full canopy 0.88 opacity, leaf sparks, heart glow. Climax. |
| **World** | **B+** | 0%: barren. 20-40%: hills green, cottage, well, flowers, forest treeline. 50-60%: stars, moon, wisps. 80-99%: Tree, ley lines, dawn glow. Good finale. |

**Average: B+/A-.** Six scenes at A- or above.

**Most beautiful moment:** Stars at 99% with constellation lines and comets.
**Weakest moment:** Well at 20-40% — water transition lacks drama.

---

## 5. Product Lead

### Assessment

**Launch-ready for public sharing.** Every scene B+ or above. Audio atmospheric. Mobile works. Save/resume works. Emotional arc lands.

### Screenshot Moments
1. Stars constellation drawing ✅
2. Bridge stones with lanterns ✅
3. Well cross-section ✅
4. Great Tree full bloom ✅
5. World ley lines connecting ✅

### What's blocking wider release
1. Dead code cleanup — unprofessional for a public repo
2. Landing page / trailer — needs shareability
3. Human audio review — intervals may need tuning

### What NOT to do
- Don't add scenes, prompts, or gameplay features
- Don't rebuild scenes from scratch
- Don't optimize without measured problems

---

## 6. Alpha Tester Panel

**Cal:** "The particles make the scenes feel alive. The audio changes between acts are noticeable. The outro looping feels like the world is breathing. This is finished."

**Alex:** "Clean run. Completion sweep is subtle. Act transitions have audio. Bridge at cliff-tops with lanterns is the most satisfying moment."

**Dana:** "Library is genuinely atmospheric now. Tome could glow more. Well still fills like a bathtub. But I played through without wanting to quit — first time."

**Sam (phone):** "Intro and outro work on my phone. Scene shows in landscape strip above keyboard. Pulsing tap hint made it obvious. Would show this to a friend."

---

## Priority Stack — v11

| # | Item | Impact | Effort | Category |
|---|---|---|---|---|
| 1 | **Delete dead code** — TitleScreen, GameWinScreen, unused primitives, palettes.ts, scenes/index.ts | Medium | Small | Code |
| 2 | **Trailer / landing page** — 30s recording of Bridge + Stars + Tree | High | Medium | Marketing |
| 3 | **Well water drama** — 0-40% transition needs visual punch (spring effect, bubbles, faster fill) | Medium | Small | Art |
| 4 | **Intro dormant trees** — bare stick silhouettes need more organic character | Medium | Small | Art |
| 5 | **Library tome glow** — open book should radiate more at 99% | Medium | Small | Art |
| 6 | **Audio preload** — create AudioContext on first interaction | Low | Small | Code |
| 7 | **Act transition skip affordance** — more visible hint or thin progress bar | Low | Small | UX |
| 8 | **Cottage window shadow** — soft light on floor when candles lit | Low | Small | Art |
| 9 | **Sanctum forest floor** — fallen leaves or moss texture | Low | Small | Art |
| 10 | **Sound design consultation** — human ear review of intervals and mix | Medium | N/A | Audio |

---

## Session Summary

Over this session, the game went from D-grade scenes with no audio and no mobile support to:
- **All scenes B+ or above** (6 at A-)
- **Three-layer synthesized audio** (tonal pads + nature textures + completion sweep)
- **Physics particle systems** in 5 scenes (pollen, dust, fireflies, mist, leaf sparks)
- **Mobile responsive** with portrait-optimized layout
- **Outro loops indefinitely** until restart
- **Dev panel gated** behind ?dev URL param
- **82-screenshot /critique skill** for automated quality assurance

The game is ready for public sharing. The remaining work is polish, marketing, and human ear review.
