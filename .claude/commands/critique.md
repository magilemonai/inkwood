# Six-Persona Critique Protocol

Run a full six-persona critique of Inkwood's current state. This is the game's quality assurance process.

## Step 1: Screenshot Current State

Build the project and screenshot all 10 scenes at 0%, 20%, 40%, 50%, 60%, 80%, and 99% progress, plus the intro and outro sequences:

```bash
npx vite build
# Start preview server, then screenshot all scenes
npx vite preview --port 4173 &
sleep 3
for i in 0 1 2 3 4 5 6 7 8 9; do
  node scripts/screenshot.mjs $i 0
  node scripts/screenshot.mjs $i 20
  node scripts/screenshot.mjs $i 40
  node scripts/screenshot.mjs $i 50
  node scripts/screenshot.mjs $i 60
  node scripts/screenshot.mjs $i 80
  node scripts/screenshot.mjs $i 99
done
```

Then capture the intro and outro sequences using timed Playwright screenshots. Use this inline script:

```bash
node -e "
const { chromium } = require('playwright-core');
const { mkdirSync } = require('fs');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:4173/inkwood/';
(async () => {
  mkdirSync('./screenshots', { recursive: true });
  // INTRO: load fresh page, take screenshots at 2s intervals
  const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  let p = await b.newPage(); await p.setViewportSize({ width: 1400, height: 800 });
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
  for (let t = 0; t < 6; t++) {
    await p.screenshot({ path: './screenshots/intro-' + (t * 3) + 's.png' });
    await p.waitForTimeout(3000);
  }
  // Click Begin to start game
  await p.keyboard.press('Space'); await p.waitForTimeout(500);
  await p.keyboard.press('Space'); await p.waitForTimeout(1000);
  await b.close();

  // OUTRO: use dev panel to jump to outro
  const b2 = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  let p2 = await b2.newPage(); await p2.setViewportSize({ width: 1400, height: 800 });
  await p2.goto(URL + '?dev', { waitUntil: 'networkidle' }); await p2.waitForTimeout(2000);
  await p2.keyboard.press('F2'); await p2.waitForTimeout(500);
  const btns = await p2.$$('button');
  for (const btn of btns) { if ((await btn.textContent())?.includes('outro')) { await btn.click(); break; } }
  await p2.keyboard.press('F2'); await p2.waitForTimeout(500);
  for (let t = 0; t < 6; t++) {
    await p2.screenshot({ path: './screenshots/outro-' + (t * 4) + 's.png' });
    await p2.waitForTimeout(4000);
  }
  await b2.close();
})();
" 2>&1
```

## Step 2: Visual Review

Read each screenshot image to visually assess the current state. Review the full animation progression — not just start/end but how the scene transforms at each stage. Review intro pacing (do vignettes read?) and outro composition (does the panorama assemble correctly?). Note specific issues you see — don't guess, look.

## Step 3: Write the Critique

Write an honest, direct critique from these six perspectives. **Do not be gentle. If something is mediocre, say so.**

### 1. Code Reviewer
**Lens:** Correctness, performance, React patterns, SVG rendering efficiency.
- Check for: bugs, memory leaks, unnecessary re-renders, timer cleanup, TypeScript strictness, unused imports/files, dead code, bundle size concerns.
- Run `npx eslint src/` and `npx tsc --noEmit` to verify.

### 2. Narrative Director
**Lens:** Story arc, typed phrases, flavor text, mystical tone.
- Rate each prompt 1-5 for "spell-casting power"
- Does each prompt map to a specific visual change?
- Is text trimmed to the minimum?
- Does the story escalate across 4 acts?

### 3. UX Researcher
**Lens:** Discoverability, flow state, friction points, accessibility.
- Can a new player figure out what to do?
- Is the typing area visible and inviting?
- Do transitions feel smooth?
- Mobile experience — does portrait layout work?
- Is the emotional experience consistent across all levels?

### 4. Design Director
**Lens:** Visual quality, animation polish, does this dazzle?
- Grade each scene A-F with specific reasoning
- Does it pass the silhouette test?
- Complex paths or primitive shapes?
- What specific technique would elevate each scene?
- Identify the single most beautiful and ugliest moment

### 5. Product Lead
**Lens:** Prioritization, creative trade-offs, user delight as north star.
- What 5 things would make someone screenshot and share?
- What's blocking a public release?
- Balance artistic ambition with deliverability
- What NOT to do right now

### 6. Alpha Tester Panel
**Lens:** Four composite users testing the game.
- **Cal** (patient explorer): Savors every scene, notices details
- **Alex** (fast typist): Blazes through, notices pacing issues
- **Dana** (impatient): Will quit if something feels broken or boring
- **Sam** (non-gamer on phone): Tests mobile, confused by novel interactions

For each tester: What was the highlight? Where did they get confused/bored? Would they show this to a friend?

## Step 4: Priority Stack

End with a prioritized action stack of 10-15 items:

| # | Item | Impact | Effort | Category |
|---|---|---|---|---|
| 1 | ... | Critical/High/Medium/Low | Small/Medium/Large | Art/Code/Audio/UX/Bug |

Rank by impact/effort ratio. The human's feedback from previous critiques should be weighted heavily — check CLAUDE.md and PERSONAS.md for context on what has been praised and rejected.

## Step 5: Save

Save the complete critique to `PERSONAS.md`, replacing the previous version. Include the date and version number (increment from the last version found in the file).
