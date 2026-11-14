# Saah, explained

## 1. In one sentence

A website that shows one real year of NISAR radar images over Punjab's farmland as a scroll-driven 3D story, lets anyone explore those images, and sets out how the same data can test whether the ground over Punjab's aquifer still rises back after the monsoon.

## 2. Simple explanation

Think of the ground as a kitchen sponge with a few slices of modelling clay pressed into it. Squeeze water out of the sponge and it shrinks; let it soak and it swells back. That is sand. Squeeze the clay and it stays flat for good. That is what happens when a clay layer underground is drained: the land above sinks and the room for water is gone for ever.

Punjab pumps far more groundwater than is replaced. Nobody has been able to watch its fields rise and fall, because older radar satellites cannot see through crops. A new satellite, NISAR, can, and it passes over every twelve days.

The site shows a block of Punjab floating in space. The top is a real radar picture. Underneath is a drawing of the sponge: wells, water, clay. As you scroll, the water drops, wells run dry, the clay flattens, and then the top plays through 24 real radar pictures, one per pass, where you can see the rice fields flood in August. At the end you can drag through the year yourself and click any spot to get a chart of how bright that spot looked on every pass.

What the site does not do yet is measure the sinking. It shows the pictures, the method and the limits.

## 3. How it works (technical)

### Architecture

```
 build time                                   run time (browser, static site)
 ──────────                                   ───────────────────────────────
 ASF search API ─┐                            index.html ─ main chunk (React, GSAP, Lenis, 130 KB gz)
 browse PNGs ────┤ scripts/build_data.py       │  App.tsx     9 chapters, scroll → store (ch)
                                               │  Loader      counter tied to real asset loading
                                               │  bits.tsx    Chapter, Rise, Count (text motion)
                                               │  Sources     challenge + research references
                                               │  motion.ts   Lenis on GSAP's ticker
                                               │  Waves       the two-wavelength diagram
                 ▼                             │  Hud.tsx     header + pass ruler
   src/data/backscatter.webp  (5×5 atlas)      │  Explorer    slider, layer, places, ledger
   src/data/phase.webp        (5×5 atlas)      │  Chart       SVG line chart
   src/data/passes.json       (dates, IDs)     │      ▲ ▼
                                               │   store.ts (Zustand)  ◄──►  probe.worker.ts
                                               │      ▲                      (OffscreenCanvas
                                               ▼      │ getState() per frame  pixel readback)
                                    lazy chunk: scene/Scene.tsx (three.js + R3F, 288 KB gz)

 Blender 5.2 ── blender/build.py ──►  blender/saah.blend   (NISAR + the aquifer block, Cycles stills)
                                      src/data/saah.glb    (NISAR, bedrock, one clay lens; 830 KB)
                                      src/data/strata.webp (the cut face of the aquifer)
```

There is no server. Vercel serves static files.

Terms: **R3F** is React Three Fiber, a React renderer for three.js. **Atlas** is many small images packed into one big one. **Zustand** is a small state store.

### One interaction traced: the user scrolls into "the year"

1. `src/App.tsx:useScrollStory` listens for `scroll`, and once per animation frame measures the ten `[data-scene]` chapters. It finds which one holds the middle of the screen and how far through it we are.
2. It writes `s` (chapter as a float), `pass` (0 to 23) and `pair` to the store with `useStore.setState`. No React component subscribes to these, so nothing re-renders. It also writes `ch`, the chapter whose text is on screen; only `Chapter` components select it, and only when it changes.
3. `src/scene/Scene.tsx:World` subscribed to the store with `useStore.subscribe(invalidate)`, so the write asks three.js for one frame. The canvas runs in `frameloop="demand"` mode and draws only when asked.
4. In `useFrame`, the scene reads `useStore.getState()`, eases its own copy of each value toward the target (`cur += (target - cur) * (1 - exp(-dt*5))`), interpolates the camera pose between the keyframes in `K`, and sets shader uniforms. If anything is still moving, it calls `invalidate()` again.
5. The slab's fragment shader (`slabFrag`) samples two neighbouring tiles of the atlas and crossfades by the fractional part of `pass`.
6. `src/Hud.tsx` and `src/Chart.tsx` also subscribe directly and move the ruler cursor and the chart marker by writing to the DOM.

### Second trace: the user clicks a field in the explorer

1. The slab mesh's `onClick` in `Scene.tsx` converts the hit point to scene coordinates `u, v` and calls `store.ts:pick`.
2. `pick` stores the pin and posts `{u, v}` to `src/probe.worker.ts`, created on first use.
3. The worker fetches the atlas (from the HTTP cache), decodes it with `createImageBitmap`, draws it to an `OffscreenCanvas` once, then reads a 3×3 pixel block from each of the 24 tiles and returns mean red (HH) and green (HV).
4. `pick` ignores stale replies by ticket number and stores the series. `Explorer.tsx` selects `series` and renders a `Chart`.

### Data model

`src/data/passes.json`:

- `passes[]`: `date`, `time` (UTC), `granule` (NASA file name), `tier` (release level), `hh` and `hv` (mean quicklook brightness of the cropped area), `pair` (index of the interferogram that starts on this date, or -1).
- `pairs[]`: `ref`, `sec` (the two dates), `granule`, `tier`.
- `roi`: `[lon0, lat0, lon1, lat1]`. `cols`, `rows`: atlas grid.

State lives in one Zustand store (`src/store.ts`). Per-frame fields (`s`, `pass`, `pair`, `hover`, `covered`) are read imperatively; UI fields (`userPass`, `layer`, `pin`, `series`, `ready`) are selected by components.

## 4. Tech stack and why

| Choice | Why | Alternative rejected and why |
|---|---|---|
| Vite + React 19 + TypeScript | Static site, fast builds, the team's checklist named Vite | Next.js: no server rendering or routes needed |
| three.js via React Three Fiber + drei | Declarative scene, `frameloop="demand"`, ready-made adaptive helpers | Raw three.js: more wiring for the same result |
| Custom GLSL shaders for the block | Atlas crossfade, the dry-well and squeezed-clay logic, the water table and the wet band on the walls all run on the GPU for free | Standard lit materials: cannot do the per-instance logic |
| Blender model + PBR for the satellite | NISAR is built by a bpy script from the published numbers (12 m reflector, F/D 0.75, 9 m boom) and lit by a small studio environment, so the gold foil and solar cells look like the real thing | Primitives with baked vertex colours (the first version): read as a toy. NASA's own model: heavier, and not our work |
| Zustand | Transient reads without re-rendering React | React context: would re-render the tree on every scroll frame |
| Lenis + GSAP + CSS transitions | Smooth wheel scrolling (Lenis), count-up numbers (GSAP), and chapter text that enters and leaves on a CSS class (`.on`), so the browser runs the text motion off the main thread. Lenis runs on GSAP's ticker so scroll, tweens and the camera share one frame. Touch stays native. About 52 KB gzipped in the main chunk | The earlier native scroll plus damped lerp: no smoothing, no choreography. Framer Motion: a second animation library for nothing |
| React Bits, adapted (`src/bits.tsx`) | `SplitText`, `ScrollReveal` and `CountUp` cut to about 60 lines on React-rendered spans, because the originals are 1,300 lines and GSAP's SplitText rewrites DOM that React owns. Credited in the file header (MIT + Commons Clause) | Pasting the originals: more code, and `CountUp` needs the `motion` package |
| WebP atlases | One request and one texture per layer for 24 images | 24 separate files: 24 requests and texture switches. KTX2: no encoder on the build machine |
| Web worker + OffscreenCanvas | Decoding a 2560² image and reading pixels stays off the main thread | Main-thread canvas: a visible stall on first click |
| Python + Pillow pipeline | Runs anywhere, no login, no geospatial stack | rasterio/GDAL: heavier, and quicklooks have no georeferencing to read anyway |
| Self-hosted Anek variable fonts | Width axis for condensed headlines, Gurmukhi from the same family, no third-party request | Google Fonts CDN: extra origin and a privacy cost |
| Vercel static hosting | Brotli and CDN by default, one command to deploy | GitHub Pages: no custom cache headers |

## 5. Key decisions and trade-offs

- **Real quicklooks now, over calibrated data later.** Optimised for something true on screen before the hackathon. Given up: calibrated numbers and any measured ground motion.
- **One fitted geotransform for all dates** instead of per-image georeferencing. Simple and consistent to about 1.8 km. Given up: sub-pixel alignment between dates.
- **Illustrated underground.** It explains the mechanism at a glance. Given up: scale. It is labelled as an illustration wherever it appears.
- **Continuous ambient motion** (the satellite keeps passing) means the canvas renders most frames while visible. It stops when the tab is hidden, when the closing sections cover it, or when the user prefers reduced motion.
- **No mipmaps on the atlases**, because mip levels would bleed between tiles. Given up: some shimmer at shallow angles.

## 6. Folder map

| Path | What it is |
|---|---|
| `index.html` | Shell, meta tags, font preload |
| `src/main.tsx` | React entry |
| `src/App.tsx` | The nine chapters, scroll-to-store logic, lazy scene mount, WebGL error boundary |
| `src/bits.tsx` | `Chapter` (fixed text stage shown only while active), `Rise`, `Count` |
| `src/Sources.tsx` | Every challenge resource (NASA, CSA, CONAE) with the NASA non-endorsement line, then our data and papers |
| `src/store.ts` | Zustand store, coordinate helpers, `pick()` and the worker wiring |
| `src/scene/Scene.tsx` | The whole 3D scene: camera keyframes, shaders, instancing, render loop |
| `src/Hud.tsx` | Fixed header and the ruler of real pass dates |
| `src/Explorer.tsx` | Slider, layer switch, preset places, pass ledger |
| `src/Chart.tsx` | SVG line chart of HH and HV |
| `src/probe.worker.ts` | Pixel readback off the main thread |
| `src/index.css` | Design tokens and all styles |
| `src/data/` | The two atlases and `passes.json` (generated by `build_data.py`); `saah.glb` and `strata.webp` (generated by `blender/build.py`) |
| `blender/build.py` | Builds the Blender file, the web model and the Cycles stills. `blender/build.sh` (Linux, macOS) and `blender/build.ps1` (Windows) find Blender and run it |
| `blender/saah.blend` | The scene, textures packed. Open it in Blender 5.2 or later |
| `scripts/build_data.py` | Downloads NASA quicklooks and builds `src/data/` |
| `scripts/build_motion.py` | Reads phase back from the 21 interferogram quicklooks, unwraps, fits trend + seasonal sine per pixel. Writes `motion.webp` and `motion.json`. `--selftest` recovers a planted signal |
| `scripts/fetch_s2.py`, `scripts/build_paddy.py` | Fetch Sentinel-2 (ESA, open) onto the radar grid; classify rice-like fields and test HH and HV on them. Write `paddy.json` and `paddy.webp` |
| `scripts/build_sband.py` | Rescales the 21 L-band pairs to S-band phase and counts steps that would alias. Writes `sband.json` |
| `scripts/build_wells.py` | Joins published district well levels with the radar numbers. Writes `wells.json` |
| `src/Paddy.tsx`, `src/SBand.tsx`, `src/Wells.tsx` | The three sections that show those results |
| `SUBMISSION.md` | Paste-ready answers for the Space Apps form |
| `scripts/build_deck.cjs` | Generates the 7-slide deck from `docs/deck-*.jpg` (frames of the live site) |
| `vercel.json` | Immutable cache header for hashed assets |
| `HANDOFF.md` | Reasoning, sources, next steps |

## 7. Run, test, deploy

```bash
npm install
npm run dev            # http://localhost:5173  (?stats shows draw calls and fps)
npm run build          # tsc type-check, then Vite build to dist/
npm run lint           # oxlint
python3 scripts/build_data.py            # rebuild src/data from NASA (a few hundred MB download, cached in .cache/)
node scripts/build_deck.cjs              # rebuild the deck (needs pptxgenjs)
npx vercel deploy --prod                 # deploy
```

No environment variables or secrets. Tests: the TypeScript build is the type check, and the data script asserts that it found at least 20 passes and that the cropped area holds data on every date. There are no unit or browser tests.

## 8. Limits and next steps

- Ground motion is a first pass: it comes from colour browse images, not the GUNW HDF5 files, so there is no troposphere or ionosphere correction layer, noise (about 12.9 mm) is as large as the signal, and the sign of the trend is not claimed. See section 11.
- S-band is projected from L-band, not measured. The rice test uses a Sentinel-2 proxy, not an official paddy map. The well data are published district figures for 1996 to 2018, not the Board's station series.
- Brightness values are display numbers, not calibrated backscatter.
- 3 MB of textures load up front. At 10× the passes this approach fails; switch to tiled or per-date loading and GPU-compressed textures.
- Frame rate on real hardware is unmeasured; all checks ran in a headless browser with a software renderer.
- The chart has no table view of its own; the pass ledger covers the scene-average series only.
- Security: static site, no user input stored or sent, no secrets. The worker only fetches the site's own atlas.

## 9. Questions a developer will ask

**Why not Next.js?** Nothing here needs a server. A static Vite build is smaller and the checklist asked for Vite.

**How do you keep scroll from re-rendering React?** Scroll writes to Zustand; no component selects those fields. The scene reads `getState()` inside `useFrame`, and the HUD and chart subscribe and write to the DOM directly.

**What does `frameloop="demand"` buy you if the satellite always moves?** Rendering stops when the tab is hidden, when the canvas is covered by the closing sections, and for reduced-motion users, who get frames only on scroll or input.

**How many draw calls?** 8 with the satellite hidden, about 21 with it, read from `gl.info.render.calls` with `?stats`: slab, walls, bedrock, wells (260 instances), clay (12 instances), frame lines, water, shadow, beam, and one call per satellite material (11). About 19,500 triangles.

**Where does the 3D model come from?** `blender/build.py` builds everything from nothing in Blender 5.2: textures in numpy, meshes in bmesh, then it saves `blender/saah.blend`, exports `src/data/saah.glb` and can render the stills in `docs/` with Cycles. Nothing is modelled by hand, so the file is reproducible. The reflector is a true offset paraboloid; with a 12 m aperture and F/D 0.75 the boom comes out 8.3 m against the published 9 m. Detail on the bus is illustrative.

**Why can you see into the block?** The aquifer walls are drawn back-side only (`side: BackSide`), so the two walls nearest the camera are never drawn and the far two always are, from any angle. The Blender file does the same with `Backfacing × Is Camera Ray` on the wall material's alpha.

**Why custom shaders instead of standard materials?** The atlas crossfade needs one. The well and clay shaders read each instance's depth from its matrix and compare it with the water level, so "dry" and "squeezed" cost nothing on the CPU.

**How are the images georeferenced?** The quicklooks have no coordinates. The script finds the four corners of valid data in every image, pairs them with the frame polygon corners from the catalogue, and least-squares fits one linear transform for all dates. Residual is about 10 px.

**Is the monsoon signal real?** The rise in HH is in the pixels: fields go from about 35 to about 205, cities stay near 245. Why it rises is our hypothesis (rice double bounce). The quicklooks may be stretched per image, so it needs confirming on calibrated files.

**What happens without WebGL?** `NoScene`, an error boundary in `App.tsx`, renders nothing in place of the canvas. All text, the chart and the ledger still work.

**What happens if the worker fails?** `pick()` sets `probeError`, shown in the explorer with `role="alert"`. Stale replies are dropped by ticket number.

**Complexity of the core logic?** Per frame: constant work, a handful of uniforms. Per click: 24 reads of 9 pixels. The data script is linear in pixels processed.

**How does it scale?** As a static site it scales with the CDN. The limit is the client: two 2560² textures use about 50 MB of GPU memory.

**Accessibility?** Lighthouse scores it 100. The canvas is `aria-hidden`; every control is a native button, range input or details element; preset places give keyboard users the same chart as clicking the map; reduced motion is respected.

**What would you change with more time?** Add the measured elastic and permanent maps as a third layer, load the interferogram atlas only when needed, compress textures to KTX2, and add a Playwright smoke test.

## 10. Glossary

- **NISAR**: NASA-ISRO Synthetic Aperture Radar satellite, launched July 2025.
- **SAR**: radar that builds images from its own microwave pulses; works at night and through cloud.
- **L-band / S-band / C-band**: radar wavelengths of about 24 cm, 9 cm and 5.6 cm.
- **HH / HV**: transmit horizontal, receive horizontal or vertical. HV is strong over vegetation volume.
- **Backscatter**: how much radar energy returns to the satellite.
- **Double bounce**: a wave reflecting off water then a vertical stem (or wall) straight back; brightens HH.
- **Interferogram**: the phase difference between two passes; shows change in distance to the ground.
- **Coherence**: how well two passes still match; lost when the surface changes.
- **GCOV / GUNW**: NISAR's geocoded backscatter and geocoded unwrapped interferogram products.
- **Granule**: one data file in NASA's catalogue.
- **Quicklook / browse image**: a small preview picture of a product.
- **Elastic / inelastic compaction**: reversible squeezing of sand vs permanent squeezing of clay.
- **Stage of extraction**: groundwater pumped as a percentage of what can be safely replaced.
- **Draw call**: one instruction to the GPU to draw a batch of triangles.
- **Instancing**: drawing many copies of one shape in a single draw call.
- **dpr**: device pixel ratio; how many screen pixels per CSS pixel are rendered.
- **LCP / CLS / TBT**: largest contentful paint, cumulative layout shift, total blocking time; page-speed measures.

## 11. The four additions (14 Nov 2026)

### Simple version

Think of the ground as a mattress under a sleeper. When the sleeper (water) leaves a spring-filled mattress, it rises a little and sinks again when they return: that is breathing. If the springs get crushed, the dent stays: that is permanent loss. The radar takes a "photo" every 12 days that can show tiny height changes. We did four things with it. (1) For every spot we separated the dent that stays from the breathing that comes back. (2) We asked what a second radar with a shorter wavelength would see. (3) We checked whether the brightness jump we saw in July is really flooded rice fields. (4) We put the well-water numbers beside the radar to see if they tell the same story. Each result is shown with what it cannot prove.

### Technical version

| Addition | Method | Result | Limit |
|---|---|---|---|
| Motion layer | `build_motion.py`: colour to wrapped phase (nearest point on matplotlib's cyclic `twilight` curve), 4 x 4 complex multilook (coherence = abs of mean), Herraez 2-D unwrap (scikit-image), best-fit plane removed, reference to median of coherent pixels, then per-pixel weighted least squares of d(t) = v t + a sin(wt) + b cos(wt) fitted directly to the 21 pair differences d(t2) - d(t1), so gaps in the pair chain add no bias. v is permanent trend, sqrt(a2 + b2) is reversible amplitude. Packed as R trend, G amplitude, B quality in a 128 x 128 lossless webp | Median trend -5.7 mm/yr, median seasonal swing 14.1 mm (p95 29.9), residual rms 12.9 mm, coherence 0.97 | Browse images, no GACOS or ionosphere layer, sign of trend unclaimed, one year |
| Third atlas | `Scene.tsx` already blended backscatter and phase atlases. We added `uMotion` sampler, `uKind` uniform (trend or breathing) and a `motion()` shader function; `layer = 2` selects it; pixels with low quality fade to grey | Third button in Explorer, plus a trend/breathing switch | None beyond the data |
| S-band | `build_sband.py`: phase = 4 pi d / lambda, so S (94 mm) gives 2.53 times more phase than L (238 mm). Multiply the 21 unwrapped L pairs by 2.53 and count neighbour steps over pi | 681,755 steps, none alias at L or S; the largest S step is 3.1 times under the pi limit; 7.5 mm per radian against 18.9 | Projected, not measured. Decorrelation over crops (the real band difference) needs S-band data |
| Rice test | `fetch_s2.py` pulls Sentinel-2 L2A COG overviews in parallel onto the 260 m radar grid, masks cloud with SCL; `build_paddy.py` labels cells by crop calendar (bare in June, green 18 Sep, cleared by 25 Oct = rice-like), keeps cells whose 3 x 3 window is one class, removes the scene-wide gradient, compares June-to-September change in HH and HV | 29,165 rice-like cells: HH +11.1, HV +3.7; perennial HH -14.0, HV -5.8; after harvest HH -8.8; top-quartile HH risers are 78% rice-like vs 65.6% base; HH rise vs greening r = 0.27, doseR 0.04 | A proxy: cannot split rice from maize or cotton. Consistent with, not proof |
| Wells | `build_wells.py`: Sharma, Sidana and Kumari 2024 Table 4 (October depth to water, 1996 and 2018) beside the radar trend and swing within 15 km of each district centre | Falls 26.3 m (Sangrur), 23.3 (Barnala), 20.0 (Patiala), about 1.2, 1.1, 0.9 m/yr; radar district trends +9 to +36 mm/yr straddle zero; swing 9.4 to 15.4 mm vs scene median 14.1 | Not a test. District figures end in 2018; the CGWB WIMS portal was in maintenance mode. Radar trends are read as residual atmosphere |

Stack choices for these: scikit-image over writing our own unwrapper (well tested, one call); a quicklook inversion because the GUNW HDF5 files need an Earthdata login and many GB we did not have time for (rejected alternative: MintPy proper, which needs those files and its own setup); Sentinel-2 over a paddy map because it is open, global and reachable without registration (rejected: a state paddy map, none was reachable); COG overviews because full-resolution reads ran at about 60 KB/s and one overview band is enough for a 260 m grid.

How to run: `python3 scripts/build_motion.py --selftest`, then each build script; each writes its JSON into `src/data/`.

### Likely developer questions

**Is this really MintPy?** No. It follows MintPy's steps (unwrap, de-ramp, reference, time-series fit) on browse images and fits the parameters directly on pair differences. The real GUNW files plus troposphere and ionosphere layers are the planned upgrade, and the site says so.

**Why trust the phase read back from colours?** The quicklooks use matplotlib's `twilight` map, which is cyclic and one-to-one with phase, and the self-test plants a signal (v 18.7, a 6.2, b -4.0) and recovers it with a 0.03 rad colour round-trip error. Quantisation to 8 bits is a noise floor. We do not claim the sign of the trend because the colour-to-sign convention is undocumented.

**Your district trends are positive over a falling aquifer. Isn't that wrong?** Yes, physically, and we say so. Their ranges cross zero and the scene median is -5.7 mm/yr, so we read them as leftover atmosphere or orbit error, not uplift.

**Does the rice test prove HH brightens on paddy?** No. Rice-like cells show a 3 times larger HH than HV rise, perennial vegetation falls, and HH drops after harvest, which is the flooded-paddy pattern. But the label is a crop-calendar guess, the controls are small (2,240 perennial and 152 barren cells), and the per-cell link between greening and HH is weak (r = 0.27). It needs an official paddy map.

**Is the S-band comparison real data?** No. It is a projection of real L-band pairs through the phase equation. It shows Punjab's slow motion would unwrap at S-band, and it does not measure decorrelation over crops, which is what actually separates the bands.

**Why not use well data for 2025 to 2026?** The CGWB portal was in maintenance mode when we tried. The wells are published district figures for 1996 to 2018, so the comparison shows direction and size of storage loss but cannot test the radar.

**What did AI do?** Claude (via Claude Code) helped with ideation, research, analysis code, site code, text and the deck. This is disclosed in the site footer and in `SUBMISSION.md`.

## 12. The motion redesign (14 Nov 2026)

### Simple version

The old page read like a report: long paragraphs, and text from two sections on screen together, sometimes with the satellite flying across it. Now it plays like a short film. Each chapter shows one idea, usually one big number or one small drawing, beside the 3D block, and the old chapter clears before the next one arrives. Think of slides in a projector: one slide at a time, never two on the screen together.

### Technical version

- **One stage per chapter.** Each `Chapter` (`src/bits.tsx`) is a tall, empty scroll track. Its text sits on a `position: fixed` stage. `useScrollStory` writes the active chapter to `store.ch`, and only the stage whose index matches gets `.on`. Inactive stages are `visibility: hidden` and `inert`, so they cannot be seen, clicked or tabbed to.
- **No overlap by timing.** Leaving text fades in 0.2 s. Entering text starts after 0.35 s, so two chapters never show at once (`src/index.css`, `.fx`).
- **Camera and satellite.** `K` in `Scene.tsx` has one keyframe per chapter, and every frame puts the block right of centre, because the text is always on the left. The satellite flies only over the block and grows in and out at the ends of its pass instead of popping.
- **Text budget.** Each chapter has a headline, one visual and at most one short line. Detail moved into the visuals: bars for pumped against recharged water, a sand-and-clay diagram, the wave drawing, a scrubbing month, and well-depth gauges.
- **Removed:** the "What this does not show yet" section. Its caveats live on in short notes next to the claims they qualify, and in section 8 of this file.
- **Sources** list every resource the challenge names, each with its link and the NASA non-endorsement statement.
- **Loader safety.** If the 3D scene has neither drawn nor failed after 25 seconds, the loader lifts anyway and the story reads without waiting (`Loader.tsx`).
- **Phones (taller than wide).** The block sits at the top and each chapter becomes one glass card at the bottom. The card scrolls inside itself if it is too long.

### Likely developer questions

- **Why fixed stages instead of normal flowing sections?** Flowing sections overlap while they scroll past each other and the 3D block. One fixed stage shown at a time makes overlap impossible by construction, not by careful spacing.
- **Is the hidden text accessible?** Only the active chapter is in the accessibility tree (`inert` on the rest). Headlines keep their full text as an `aria-label`, so the split words are not read one by one. With reduced motion, the transitions become plain fades.
- **How was it checked?** By type check, production build, and screenshots of every chapter at 1440×900 and 390×844. A scripted fast-scroll check once caught two chapters readable at the same moment, so the fade timings above were separated. The check was not rerun after that: software 3D rendering overloaded the laptop.
