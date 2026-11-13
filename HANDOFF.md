# Handoff: thinking, decisions, state, next steps

Written 13 Nov 2026, the day before the hackathon (14 to 15 Nov 2026). Anyone on the team should be able to pick this up from here.

## 1. Where things stand

| Thing | State |
|---|---|
| Website | Live at https://saah-gamma.vercel.app (Vercel project `saah`) |
| Repo | https://github.com/SoulBreaker9/Big-Hero-7, branch `main` |
| Deck | `deck/Saah-SpaceApps-2026.pptx`, 7 slides, built by `scripts/build_deck.cjs` |
| Real data on the site | 24 NISAR L-band backscatter passes and 21 twelve-day interferograms over central Punjab, 21 Nov 2025 to 4 Nov 2026 |
| Not done | No ground-motion measurement yet. The "breathing" test is described as a method, not shown as a result |

## 2. The competition

NASA Space Apps Challenge 2026, challenge **"Dancing with the SARs"** (Earth science, intermediate/advanced). The brief, paraphrased from the challenge page:

- Build an **interactive app** that uses **NISAR** radar data to follow and display at least one kind of surface change, anywhere.
- **Hypothesise the physical drivers** of what the radar shows, or fails to show.
- Encouraged: comparing polarisations or frequencies, multi-date time series, ancillary data, human drivers such as farming, storytelling, image sliders and web maps.
- Open source, usable by scientists, managers, educators and the public.

Submission facts we confirmed: teams of up to 6; submit between Sat 14 Nov 09:00 and Sun 15 Nov 23:59 local time; the demo is a 30 second video **or at most 7 slides** at a public link; AI use must be declared; no NASA logos. Older guides list the judging criteria as impact, creativity, validity, relevance and presentation. **The 2026 submission guide and the challenge's resource list were due to publish on 13 Nov and we had not seen them. Read both before submitting.**

## 3. How the idea was chosen

The team's brief was: do not build another satellite-data viewer; find something about Earth's changing surface that existing approaches cannot explain, where India has an edge and NISAR is uniquely useful.

Ten candidates, scored 1 to 5 by judgment (not a formal survey):

| # | Problem | Science | Novelty | Impact | Global | Feasible in 2 days | Total |
|---|---|---|---|---|---|---|---|
| 1 | **Elastic vs permanent aquifer compaction under Punjab's croplands** | 5 | 4 | 5 | 5 | 4 | **23** |
| 2 | Moraine-dam creep before glacial lake floods (South Lhonak, Sikkim) | 5 | 4 | 4 | 4 | 3 | 20 |
| 3 | Sundarbans: sinking embanked islands under mangrove | 4 | 4 | 4 | 4 | 3 | 19 |
| 4 | Slope creep under forest before monsoon landslides (Wayanad) | 4 | 3 | 4 | 4 | 3 | 18 |
| 5 | "The next Joshimath": towns on old landslide debris | 4 | 3 | 4 | 3 | 3 | 17 |
| 6 | Rice paddy flooding regime and methane | 4 | 4 | 3 | 4 | 3 | 18 |
| 7 | Flood extent under vegetation (Assam, Bihar) | 3 | 2 | 4 | 4 | 4 | 17 |
| 8 | Sinking megacities (Delhi, Kolkata, Chennai) | 4 | 1 | 4 | 4 | 4 | 17 |
| 9 | Jharia coal-fire subsidence | 3 | 3 | 2 | 2 | 3 | 13 |
| 10 | Soil moisture and drought forecasting | 3 | 1 | 4 | 4 | 3 | 15 |

Shortlist: 1, 2, 3. Why 1 won:

- **A real gap.** Radar has mapped India's sinking *cities* for years, because the older 5.6 cm C-band radar needs stable reflectors such as buildings. Over growing crops it loses coherence, so the maps thin out exactly where the pumping is. NISAR's 24 cm L-band passes through crops. Farmland subsidence in Punjab and Haryana is barely studied.
- **A sharp question.** Not "is it sinking" but "does it come back". Sand compaction is elastic and reverses when the aquifer refills. Clay compaction is permanent and destroys storage for good. A year of 12-day passes can separate the seasonal cycle from the steady drop.
- **A human driver the radar can also see.** The same data shows when the paddy fields flood, which is the pumping season.
- **It fits the brief word for word**: time series, two polarisations compared, a physical hypothesis, a human driver.
- **Data was actually there.** The ASF catalogue had a full year over Punjab, downloadable without a login.

## 4. What is verified, and where it came from

Checked against the source during research on 13 Nov 2026:

| Claim on the site or deck | Source |
|---|---|
| Punjab extracted 27.8 billion m³ against 16.98 extractable in 2023, stage of extraction 163.76%; Haryana 135.74%, Rajasthan 148.77%, India 59.26% | CGWB 2023 assessment, as given in a Rajya Sabha reply of 2 Dec 2024 and reported by The Tribune on 5 Dec 2024 |
| North India lost about 450 km³ of groundwater, 2002 to 2021 | Mishra et al. 2024, Earth's Future, doi:10.1029/2024EF004516 |
| About 17 km³ of aquifer storage lost permanently each year worldwide; about 60% of mapped subsidence is on cropland | Hasan et al. 2023, Nature Communications 14:6180 |
| Kapashera near Delhi airport sinking about 11 cm/yr (2014 to 16) rising to about 17 cm/yr (2016 to 18); Dwarka went from 3.5 cm/yr sinking to uplift after rainwater harvesting (the authors call this a hypothesis) | Garg et al. 2022, Scientific Reports 12:651, doi:10.1038/s41598-021-04193-9 |
| NISAR: launched 30 July 2025, 12-day repeat, L-band 24 cm (NASA), S-band about 9 cm (ISRO), 05:43 IST pass over Punjab | NASA/ISRO mission pages; pass time from the granule timestamps (00:13 UTC) |
| NISAR recorded nothing 27 July to 10 Aug 2026; validated products start 21 Oct 2026; S-band products are on ISRO Bhoonidhi | ASF NISAR docs, availability overview |
| Scene brightness (HH) rises from about 94 to 176 between November and 17 September, HV stays roughly 77 to 108 | Computed by `scripts/build_data.py` from the quicklooks; values are in `src/data/passes.json` |

**Not verified, check before relying on them:**

- The DOI for Hasan et al. (`10.1038/s41467-023-41933-z`) was written from memory. Open the link once.
- "80 m" as the interferogram grid spacing in the method section is from memory of the product spec.
- The share of Punjab's blocks classed over-exploited: secondary sources disagree (114 of 150 vs 117 of 153), so the site does not quote it.
- The rice double-bounce explanation for the HH rise is our **hypothesis**. It matches rice radar behaviour in the literature, but we have not tested it against crop maps.

## 5. How the data pipeline was worked out

`scripts/build_data.py`, Pillow only, no login:

1. Query the public ASF search API for NISAR GCOV (backscatter) and GUNW (interferogram) products on track 156, frame 17 over `POINT(76.0 30.3)`.
2. Keep the best release per date (validated > provisional > beta) and download each product's `_LATLON.png` quicklook.
3. **Georeferencing.** The quicklooks carry no coordinates. All images of one product type share one fixed pixel grid, with margins, so the frame polygon's bounding box is *not* the image extent (the first attempt assumed it was and put cities in the wrong place). The fix: find the four corners of the valid-data footprint in every image, pair them with the four corners of that frame's polygon, and fit one linear lon/lat to pixel transform over all dates. Residual is about 10 px (about 1.8 km). Checked by eye: Ludhiana, Patiala, Sangrur and others land on their bright spots.
4. Crop a fixed area (75.20 to 76.60 E, 29.95 to 31.15 N, about 134 km) and assert it holds data on every date.
5. Skip two bad passes with stated reasons (7 July 2026 cut by the swath edge, 5 Sept 2026 smeared).
6. Pack tiles into two 5×5 atlases (`backscatter.webp`, `phase.webp`) and write `passes.json` with granule names so every image is traceable.

Limit to be honest about: quicklooks are 8-bit display images. The colour composite is R=HH, G=HV, B=HH, and NASA may stretch each image differently, so brightness is not calibrated backscatter.

## 6. Design decisions

- **Name**: Saah, ਸਾਹ, Punjabi for breath. The whole story is one metaphor: an aquifer that breathes or has stopped.
- **One bold thing**: a floating cutaway block. The top is the real radar image; underneath is an illustrated aquifer with wells, a water table and clay lenses. Everything else is quiet. Since 14 Nov it is built as a physical exhibit: sediment layers on the cut faces, bedrock underneath, water with a surface, and NISAR modelled in Blender to its published proportions (`blender/build.py`, see PROJECT_EXPLAINED.md).
- **The page starts at night and day breaks** (14 Nov): NISAR crosses at 05:43, so parts 0 and 1 sit on a night sky, parts 2 and 3 on dawn, parts 4 to 6 on day. Ink flips from light to plum between parts 3 and 4, hidden by the panel fade. The block alternates sides, always opposite the text, and drifts and follows the pointer slightly. A loader with a real 000 to 100 counter covers the first load and lifts only once the scene has drawn frames.
- **Palette comes from the data**: the quicklooks are magenta (HH) and green (HV) on black, so the page is cool haze with plum ink, magenta for HH and green for HV.
- **Type**: Anek Latin (variable width axis, condensed for headlines) with Anek Gurmukhi for the wordmark. An Indian type family for an Indian subject.
- **Inspiration gathered in Chrome** from current Awwwards sites of the day: ZIRKA Interceptor (instrument-strip header, tick ruler as progress), Igloo Inc (one object floating in fog), Lusion, Chartogne-Taillet, Cyera AI Guardian. What was taken: the HUD strip, the ruler of real pass dates, the single floating diorama.
- **Honesty is part of the design**: every illustration is labelled as one, and a "What this does not show yet" section sits above the sources.

## 7. The performance checklist, item by item

Applied: `frameloop="demand"` with `invalidate()`; instanced wells and clay; Suspense and lazy-loaded scene; `PerformanceMonitor`, `AdaptiveDpr`, `AdaptiveEvents`; `dpr` clamped to 1 to 1.5; satellite merged into one mesh in Blender; shared geometries and materials in `useMemo`; hand-written lighting in the block's shaders, one light and one small environment map for the satellite, no shadow maps, no post-processing; refs mutated in `useFrame`, never `setState`; manual disposal; a web worker with `OffscreenCanvas` for pixel readback; `powerPreference: high-performance`, antialias off on touch devices; code splitting with `React.lazy`; `React.memo` on the chart; Zustand with selectors and transient subscriptions; Vite with minification; Brotli and immutable cache headers on hashed assets (confirmed on the live site); font preload; WebP images; canvas mounted after first paint.

Also applied (14 Nov): Lenis for wheel scrolling and GSAP ScrollTrigger for text motion, on one shared ticker (+52 KB gzipped in the main chunk). Not added: Framer Motion, a second WebGL canvas, animated blur.

Skipped, with reasons:

| Item | Why skipped |
|---|---|
| Draco, Meshopt, KTX2, gltfjsx, `useGLTF.preload` | The one glTF (`src/data/saah.glb`, from `blender/build.py`) is 830 KB with WebP textures. Draco would need its decoder fetched from a third-party CDN or bundled, for a file smaller than either radar atlas |
| `<Bvh>`, `<Detailed>` LOD | One object on screen, one flat face to raycast |
| Rendering in a worker | Scroll and DOM overlays must stay in step with the camera; the library for it is unmaintained. The worker is used for pixel readback instead |
| Virtualised lists | The longest list is 24 rows |
| `useTransition` / `useDeferredValue` | Nothing on the page is slow to render |
| Preconnect | No third-party origins; fonts are self-hosted |

Measured: 130 KB gzipped JS before the 3D chunk (78 KB before Lenis and GSAP), 289 KB for the 3D chunk, 8 to 21 draw calls, about 19,500 triangles, 60 fps at 1600×900 in headless Chromium on a laptop RTX 4050 (14 Nov, after the Blender model went in; the Lighthouse figures that follow are from before it). Lighthouse mobile on the live site: accessibility 100, best practices 100, LCP 1.2 s, CLS 0.02. Total blocking time was 2.5 s, but that run used a software renderer with 4× CPU throttling and is not a real-device number. **Frame rate on a real GPU has not been measured.**

## 8. What to do during the hackathon, in order

1. **Read the 2026 submission guide and the challenge resource list** (both due 13 Nov). Adjust the deck if the rules changed.
2. **Open the site on a real laptop and a phone.** Add `?stats` to the URL to see draw calls and fps. This has only been seen in a headless browser.
3. **Get the real measurement.** This is what turns the project from a method into a finding:
   - Create a free NASA Earthdata login.
   - Download the GUNW HDF5 files listed in `src/data/passes.json` (`pairs[].granule`) from ASF. Track 34 frame 73 is the descending view of the same area.
   - Build a displacement time series from the unwrapped phase (MintPy does this), applying the ionosphere and troposphere layers in each file.
   - Per pixel, fit a seasonal sinusoid plus a linear trend. Map the seasonal amplitude (elastic) and the trend (permanent).
   - Put that map on the block as a third layer. `Scene.tsx` already blends two atlases; a third is one more uniform.
4. **Test the paddy hypothesis** on the calibrated GCOV files: does HH minus HV rise only on rice fields? A crop map or Sentinel-2 would settle it.
5. **Add S-band** from ISRO Bhoonidhi (registration needed) for a true two-frequency comparison, which the brief explicitly rewards.
6. **Ground truth**: CGWB well levels for Sangrur, Barnala and Patiala districts.
7. Record a 30 second screen capture as a backup demo.

## 9. Things that can bite

- The site downloads 3 MB of radar images. On a slow connection the block appears late; a loading note covers the wait.
- `saah-gamma.vercel.app` is on one team member's Vercel account. Redeploy with `npx vercel deploy --prod` from that account, or import the GitHub repo into another.
- Do not claim subsidence was measured. The judges' validity criterion is exactly where an overclaim would hurt.
