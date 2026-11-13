# Story and motion rework: execution plan

Written 14 Nov 2026 for whoever (person or model) finishes this work. It is self-contained: read this, then start at section 5.

## 1. What the owner asked for

In their words, condensed:

- The scroll is not smooth. The way content comes up has no wow factor.
- The flow does not tell a story. The 3D model is "stuck at a place".
- A loader must come up first and reach 100% **only when the model and everything is rendered**, then leave the screen.
- Add components (they pointed at https://github.com/DavidHDev/react-bits) so the site has a feel static sites miss.
- Animation, highlights and colour theme should make judges want to read. It must run smoothly on mobile and be efficient.

Judges are NASA Space Apps 2026 ("Dancing with the SARs"). Validity is a judging criterion, so **do not change any fact, number or claim in the text**. Only the presentation changes.

## 2. The design, decided

One idea carries the redesign: **NISAR crosses Punjab at 05:43, just before dawn, so the page starts at night and day breaks as the story unfolds.** Everything else stays quiet around that and the 3D block.

| Element | Decision |
|---|---|
| Sky | Three fixed full-screen layers (night, dawn, day) crossfaded by opacity. `html[data-sky]` picks one. Sections 0-1 night, 2-3 dawn, 4-6 day |
| Ink | Light text on night and dawn, plum ink on day. Done by overriding the CSS variables under `html[data-sky='night'], html[data-sky='dawn']`, so every component follows |
| Loader | Night-coloured cover with the ਸਾਹ wordmark breathing, a 000 to 100 counter, a status line and a progress line. Lifts like a curtain |
| Smooth scroll | Lenis for wheel, native for touch, driven by GSAP's ticker |
| Headlines | Words rise out of a mask, arrive magenta, settle to ink (`Rise`) |
| First paragraph of each part | Lights up word by word as you scroll, each word flashing magenta as it is reached (`Read`). This is the "forces you to read" device |
| "164 litres" headline | The number counts 100 to 164 inside the headline (`Count`). No separate stat blocks |
| 3D block | Travels: alternates screen side per part, changes distance and look-at height, sways slowly, follows the pointer slightly, and flies in from far away when the loader lifts |
| Text panels | Alternate sides opposite the block. Each fades in as its section arrives and out as it leaves, so one thought is on screen at a time |
| HUD middle | Shows which part you are in ("Part 2 of 6: sand and clay"). The parts are a real sequence, so numbering is honest |
| Part 3 | Gets a small diagram: the 5.6 cm and 24 cm waves drawn to the same scale meeting a crop (`Waves`) |

Palette (day values exist in `src/index.css` today; night values are new):

| Token | Day | Night and dawn |
|---|---|---|
| `--ink` | `#2a1533` | `#f1ecf3` |
| `--soft` | `#5a4763` | `#b9a9c2` |
| `--paper` | `#f3f5f1` | `#1d0f26` |
| `--rule` | `rgb(42 21 51 / 0.2)` | `rgb(241 236 243 / 0.22)` |
| `--paddy` (accent) | `#b4148c` | `#ef5fc6` |
| `--canopy` | `#2f7d4f` | `#5fc48a` |
| `--water` | `#2c5fa8` | `#6ea8f0` |
| `--bar` (HUD and ruler background, new) | `rgb(237 240 236 / 0.82)` | `rgb(21 10 28 / 0.7)` |
| `--card` (mobile card background, new) | `rgb(243 245 241 / 0.94)` | `rgb(29 15 38 / 0.9)` |

Sky gradients: night `linear-gradient(#0d0613, #1c0e26 55%, #2a1533)` plus a sparse star pattern made of `radial-gradient` dots (no canvas, no second WebGL context). Dawn `linear-gradient(#150a1d, #33163c 55%, #7a2a5e 88%, #d98a5c 112%)`, kept dark enough in the upper two thirds for light text. Day is the existing haze gradient `linear-gradient(#edf0ec, #e4e8e3 60%, #d6dcd6)`.

Type stays Anek Latin and Anek Gurmukhi. Things deliberately **not** added: all-caps eyebrow labels, card grids, a chapter rail of dots, a noise overlay, any second WebGL canvas.

## 3. Why react-bits is adapted, not pasted

The upstream `SplitText`, `ScrollReveal` and `CountUp` are about 1,300 lines with hover springs, loops and options this page does not use. `CountUp` also needs the `motion` package, and GSAP's SplitText rewrites DOM that React owns (a problem when a counting number sits inside a split headline). So `src/bits.tsx` holds three slim versions (about 60 lines) built on React-rendered word spans, credited to React Bits in the file header. The licence is MIT + Commons Clause, which allows use as part of a website. If the owner wants the originals verbatim, they are at `src/ts-default/TextAnimations/<Name>/` in that repo (raw.githubusercontent.com works; a full clone is slow).

## 4. State of the working tree right now

Last commit is `8b2c81e` on `main` (the Blender model work). Uncommitted:

| File | State |
|---|---|
| `package.json`, `package-lock.json` | `lenis`, `gsap`, `@gsap/react` added. The lock file also carries an older unrelated change (package renamed `nasa` to `saah`) that was there before this work |
| `src/store.ts` | Done. New fields `chunk`, `load`, `ready` (meaning changed, see below), `revealed` |
| `src/motion.ts` | Done. Registers ScrollTrigger, exports `reduced`, `WIDE`, `startScroll()`, `lockScroll()`, `gsap`, `ScrollTrigger` |
| `src/bits.tsx` | Done, untested in a browser. `Rise`, `Read`, `Count` |
| `src/Loader.tsx` | Done, untested in a browser |
| `src/Waves.tsx` | Done, untested in a browser |
| `src/App.tsx`, `src/Hud.tsx`, `src/Explorer.tsx`, `src/index.css`, `src/scene/Scene.tsx`, `index.html` | **Not touched yet.** Nothing new is wired in |

`npx tsc -b` passes in this state. The site still behaves exactly as at `8b2c81e` because nothing imports the new files.

## 5. Work left, in order

Do the steps in this order; each leaves the site working.

### 5.1 `index.html`

- `<html lang="en" data-sky="night">` so the first paint is already night.
- `theme-color` to `#150a1c`.

### 5.2 `src/scene/Scene.tsx`

Read the file first. It is one component, `World`, with camera keyframes `K`, hand-written shaders and a `useFrame` loop.

1. **Report loading.** At module top level, after the imports:
   ```ts
   useStore.setState({ chunk: true })
   THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => useStore.setState({ load: loaded / total })
   ```
   `total` grows as the glTF's embedded textures are discovered, so `load` can dip. `Loader` already never counts backwards.
2. **`ready` means "frames are on screen".** Remove `useStore.setState({ ready: true })` from the effect. In `useFrame`, count frames in a ref and on the third one call `requestAnimationFrame(() => useStore.setState({ ready: true }))`. Keep the `invalidate()` in the effect so demand rendering produces those frames while the loader is up.
3. **Keyframes gain two columns**: `ox` (horizontal view offset as a share of width; negative puts the block on the right) and `ty` (look-at height). Loop `j < 9` instead of `7`. Proposed values, tune by screenshot:
   ```ts
   // azimuth°, polar°, distance, water table y, layer, sink, breath, x offset, look-at y
   const K = [
     [35, 60, 16.5, -0.3, 0, 0, 0.25, -0.2, -0.55],  // hero: block right
     [-28, 76, 13.5, -0.98, 0, 0, 0, 0.2, -0.75],    // overdraft: block left, closer, water falls
     [24, 82, 11.5, -1.08, 0, 1, 0, -0.2, -0.7],     // sand and clay: block right, closest
     [-18, 40, 15.5, -1.08, 1, 1, 0, 0.2, -0.55],    // blind spot: block left, interferograms on top
     [0, 26, 15, -1.08, 0, 1, 0, -0.2, -0.55],       // the year: block right
     [-38, 70, 16.5, -0.7, 0, 0.5, 1, 0.2, -0.55],   // the test: block left, breathing
     [0, 2, 14, -0.7, 0, 0.5, 0, -0.2, -0.55],       // explorer: straight down, block right
   ]
   const INTRO = [80, 34, 34, -0.3, 0, 0, 0.25, -0.2, -0.55] // where the camera waits behind the loader
   ```
   Use them: `setViewOffset(w, h, portrait ? 0 : ox * w, portrait ? 0.2 * h : 0, w, h)` and `camera.lookAt(0, ty, 0)`, with `ty` also replacing the `- 0.55` in the camera's y.
4. **Fly-in.** Start `cur.k` at `INTRO`. While `!st.revealed`, the target is `INTRO`. After reveal, ease slowly then normally: keep `intro` (0 to 1 over about 2.4 s) in the ref and use `rate = 1.8 + 3.2 * smoothstep(intro)` in `1 - Math.exp(-dt * rate)`. Do not call `regress()` while `intro < 1`, or the first impression is rendered at reduced resolution.
5. **Never still.** Add to the azimuth and polar angle after easing, scaled to zero while exploring (picking needs a steady map) and under `reducedMotion`:
   - sway: `az += 2.5 * Math.sin(c.t * 0.3)`
   - pointer: one `pointermove` listener on `window` (only when `!coarse`) storing `-1..1` in a ref; ease it and add `az += px * 3`, `pol += py * 1.5`
6. **Night.** `const night = f < 3.5 ? 1 : 0`, eased in the ref. Use it to:
   - lerp the outline (`g.frame.material.color`) between `INK` and `0xf1ecf3`;
   - multiply the shadow blob's alpha by `1 - night` (add a `uOn` uniform to `shadowFrag`).
   Everything else in the scene already reads well on dark.
7. Existing behaviour that must survive: explorer hover and click (`uvOf`, `pick`), the `?stats` readout, `frameloop="demand"`, manual disposal, reduced motion.

### 5.3 `src/index.css`

Rewrite around the token table in section 2. Keep every existing rule that still applies. New or changed:

- `html { scroll-behavior: smooth }` **must go**: it fights Lenis. `html.locked, html.locked body { overflow: hidden }` for the loader.
- `body`: no background (the sky layers are the background); `color: var(--ink)`; `transition: color 0.9s`.
- `.sky { position: fixed; inset: 0; z-index: -1 }`, `.sky i { position: absolute; inset: 0; opacity: 0; transition: opacity 1.4s }`, and `html[data-sky='night'] .sky .night { opacity: 1 }` etc.
- `.hud, .ruler` use `var(--bar)` and transition `background-color`, `border-color`.
- `.loader`: fixed, inset 0, `z-index: 10`, night background, content centred. `.loader-num` large condensed Anek (`font-stretch: 78%`, about `clamp(5rem, 16vw, 11rem)`, tabular numbers). `.loader i` is the progress line: `position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; background: var(--paddy); transform-origin: left; transform: scaleX(0)`. `.loader.out { transform: translateY(-100%); transition: transform 1.1s cubic-bezier(0.76, 0, 0.24, 1) }`. `Loader.tsx` unmounts it after 1.3 s.
- Rise: `.rise .w { display: inline-block; overflow: hidden; vertical-align: bottom; padding: 0.1em 0 0.18em; margin: -0.1em 0 -0.18em }` (the padding stops descenders being clipped at line-height 0.98), `.rise .w > span { display: inline-block; color: var(--paddy) }`, `.rise.lit .w > span { color: inherit; transition: color 0.9s calc(0.3s + var(--i) * 45ms) }`. Under reduced motion the spans are `color: inherit` from the start.
- Sides: `section[data-side='right'] .panel { margin-left: auto }`.
- `.panel-body` is a plain wrapper (see 5.4). `.cue` is the hero's scroll hint, bottom of the first viewport.
- `.waves` figure: `.c` and `.l` paths `fill: none; stroke-width: 2`, `.c { stroke: var(--soft) }`, `.l { stroke: var(--paddy) }`, both `stroke-dasharray: 7 5; animation: march 1.1s linear infinite` with `@keyframes march { to { stroke-dashoffset: -12 } }`; `.lost { opacity: 0.45 }`; `.stalk { stroke: var(--canopy); opacity: 0.5 }`; `.soil { stroke: var(--ink); stroke-width: 3 }`; text `fill: var(--soft); font-size: 12px`.
- `.count { color: var(--paddy) }`.
- Mobile cards (`@media (max-aspect-ratio: 85/100)`): `background: var(--card)`.
- `.ground` keeps `background: var(--paper)`; by then the sky is day.
- Reduced motion block: also `.sky i, body, .hud, .ruler { transition: none }`, `.waves path { animation: none }`.
- CTA: give `.button` a slow light travelling round its border (the react-bits StarBorder idea in CSS only): a `::before` with a `conic-gradient` in `var(--paddy)` behind a 2 px inset, rotated by a `@property --a` angle animation. Skip it if it costs more than 20 lines.

### 5.4 `src/App.tsx`

1. Imports: `Loader`, `Waves`, `{ Rise, Read, Count }` from `./bits`, `{ gsap, startScroll, WIDE, reduced }` from `./motion`, `useGSAP`.
2. Mount the scene immediately (delete the `requestIdleCallback` delay and the old `.loading` note). The loader now covers the wait.
3. `NoScene` (the error boundary) must release the loader when WebGL or an asset fails: add `componentDidCatch() { useStore.setState({ ready: true }) }`.
4. `useEffect(() => startScroll(), [])`. On mount, if there is no `location.hash`: `history.scrollRestoration = 'manual'; scrollTo(0, 0)`, so the fly-in is always seen from the top.
5. In `useScrollStory`'s `read()`, after computing `i`: `const sky = i < 2 ? 'night' : i < 4 ? 'dawn' : 'day'` and write `document.documentElement.dataset.sky` only when it changes.
6. Markup:
   ```tsx
   <Loader />
   <div className="sky" aria-hidden="true"><i className="night" /><i className="dawn" /><i className="day" /></div>
   <Hud />
   <div className={ready ? 'stage on' : 'stage'}>…Scene…</div>
   <main id="top">
     <section data-scene data-side="left" className="hero">
       <div className="panel"><div className="panel-body">…</div></div>
     </section>
     …
   ```
   Sides by section: left, right, left, right, left, right, left (always opposite the block's `ox` in `K`). `Explorer.tsx` renders its own `.panel`; wrap its children in `.panel-body` too and add `data-lenis-prevent` to its `.ledger` (otherwise Lenis swallows the wheel inside that scrolling table).
7. Text treatment per section. **Copy the existing sentences exactly.**
   - Hero: `<Rise as="h1" play={revealed}>Is Punjab’s ground still breathing?</Rise>`; lede as a normal `<p className="lede">`; the gloss, actions and note fade in with a CSS class set when `revealed` (stagger with `transition-delay`). Add `<p className="cue note">Scroll to follow one year of passes</p>`.
   - Part 1: `<Rise>Punjab pumps <Count from={100} to={164} /> litres for every 100 it can replace</Rise>`; first paragraph in `<Read>`; the rest plain.
   - Parts 2 to 5: headline in `<Rise>`, first paragraph in `<Read>`, the rest plain. Part 3 gets `<Waves />` between its paragraphs and its note. Part 4 keeps `<Chart>`; its first paragraph contains computed numbers, so build the string first and pass it to `<Read>` (it takes a string child only).
   - The closing "What this does not show yet" and "Sources" sections are unchanged.
8. Panel choreography, one `useGSAP` in `App`:
   ```ts
   const mm = gsap.matchMedia()
   mm.add(`${WIDE} and (prefers-reduced-motion: no-preference)`, () => {
     gsap.utils.toArray<HTMLElement>('[data-scene]').forEach((sec, i, all) => {
       const panel = sec.querySelector('.panel')!, body = sec.querySelector('.panel-body')!
       if (i) gsap.fromTo(body, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 62%', end: 'top 30%', scrub: true } })
       if (i < all.length - 1) gsap.fromTo(panel, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, ease: 'none', immediateRender: false, scrollTrigger: { trigger: sec, start: 'bottom 85%', end: 'bottom 52%', scrub: true } })
     })
   })
   mm.add(`not ${WIDE} and (prefers-reduced-motion: no-preference)`, () => {
     gsap.utils.toArray<HTMLElement>('[data-scene] .panel').forEach((p, i) => { if (i) gsap.from(p, { autoAlpha: 0, y: 40, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } }) })
   })
   ```
   Enter and exit animate **different elements** (`.panel-body` and `.panel`) on purpose: two scrubbed tweens on the same element's opacity fight each other. The exit fade is also what hides the one moment (between parts 3 and 4) where the ink flips from light to dark.
9. Call `ScrollTrigger.refresh()` once fonts are ready (`document.fonts.ready.then(...)`), because the headline metrics change when Anek loads.

### 5.5 `src/Hud.tsx`

In the existing `sync()`, also track the part: `const part = Math.min(Math.max(Math.round(useStore.getState().s), 0), 6)`, and when it changes write the middle label:

```ts
const PARTS = ['NISAR L-band radar, track 156, frame 17, 05:43 IST', 'Part 1 of 6: the overdraft', 'Part 2 of 6: sand and clay', 'Part 3 of 6: the blind spot', 'Part 4 of 6: one year from orbit', 'Part 5 of 6: the test', 'Part 6 of 6: look for yourself']
```

### 5.6 Docs

Update `PROJECT_EXPLAINED.md` (tech stack row for Lenis and GSAP with the reason; the "Native scroll + damped lerp" row is no longer true; bundle sizes; folder map for the new files) and `HANDOFF.md` section 6 (the dawn idea) and section 7 (Lenis and GSAP move from "skipped" to "applied", with the measured size). Refresh `docs/hero.jpg`.

## 6. How to verify (do all of it before saying it is done)

Tools on this machine:

- Dev server: `npx vite --port 5199 --strictPort` (one may still be running).
- Real-GPU headless screenshots: install `playwright-core` in a scratch folder and launch with `executablePath: ~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` and args `['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist']`. The npx-cached Playwright is broken. Add `?stats` to the URL to read draw calls and fps from `#stats`.
- To scroll a section into view in a test, measure `document.querySelectorAll('[data-scene]')[i]` and call `window.scrollTo`, then wait about 2.5 s for the camera to settle. Lenis only smooths the wheel, so `scrollTo` jumps straight there.
- Blender (only if the model changes): `blender/build.sh`, Blender is at `~/.local/opt/blender-5.2.4-linux-x64/blender`.

Checks:

1. **Loader is honest.** Throttle the network in Playwright (`page.route` with a delay on `**/*.webp` and `**/*.glb`, or CDP `Network.emulateNetworkConditions`) and record the counter over time: it must climb in steps, sit below 100 while assets are pending, and reach 100 only after `#stats` shows frames. Also block the `.glb` entirely: the error boundary must still release the loader and the story must be readable without 3D.
2. **Cached reload**: the loader still shows briefly and does not flash.
3. Screenshot all seven sections at 1600×900 and at 390×844 (device scale 2). Look at each one. Text must never sit on top of the block or the satellite on desktop; light text must never be on the day sky or dark on night.
4. Scroll slowly across the part 3 to part 4 boundary and capture several frames: no unreadable text mid-transition.
5. Explorer: click the block, a chart appears, zero console errors. The ledger table scrolls with the wheel.
6. `?stats` shows about 60 fps on desktop during scroll. Draw calls should stay near 21.
7. Emulate `prefers-reduced-motion: reduce`: no Lenis, no fly-in, all text visible at full opacity, sky still changes (instantly).
8. `npm run lint` (existing `react(immutability)` warnings in `Scene.tsx` are expected, they are three.js objects mutated in `useFrame`) and `npm run build`. Note the new gzip sizes of the main and Scene chunks.

## 7. Risks and things that bit already

- **Do not add `motion`/Framer Motion.** GSAP plus Lenis already covers everything; a second animation library costs about 30 KB gzipped for nothing.
- **Do not animate `filter: blur`** on text. It is the first thing to drop frames on phones.
- **`Rise` hides its words at mount** (`gsap.from` renders immediately). If a headline never appears, its ScrollTrigger never fired: check the section has `data-scene` and that `ScrollTrigger.refresh()` ran after fonts loaded.
- **React StrictMode** mounts effects twice in development. `startScroll()` returns its own cleanup; keep it that way.
- **Sticky panels and ScrollTrigger**: a sticky element does not move while stuck, so always trigger on the section (`scene()` in `bits.tsx` does this).
- The satellite sits 3 units east of the block. When the block is on the left and the camera azimuth is negative, check the satellite does not fly behind the text column on the right. If it does, reduce `|ox|` or the azimuth for that part.
- The page weight is about 4 MB before this work. The loader makes that wait visible, so do not add more assets.
- `package-lock.json` had an unrelated modification before any of this. Commit it together with the dependency change or the lock file will not match `package.json`.

## 8. Rules of engagement

- Do not commit, push or deploy unless the owner asks. The live site (`saah-gamma.vercel.app`) deploys from one team member's Vercel account.
- Do not edit the facts, numbers, sources or the "What this does not show yet" list.
- Report honestly: what was tested, what was not (a real phone has never been tested), and any check from section 6 that failed.
