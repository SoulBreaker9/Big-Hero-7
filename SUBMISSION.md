# NASA Space Apps submission: paste-ready answers

Team: Big Hero 7. Challenge: "Dancing with the SARs" (NISAR). Every number below comes from a file in this repo
(`src/data/*.json`); re-check against the site before you paste.

---

## 1. Project Name

`Project Big Hero 7` is the team label already in the form. The site's own title is "Saah: is Punjab's ground still breathing?".
Recommended: **Saah: is Punjab's ground still breathing?** (name that describes the work, as the form asks). Keep the team name if
your team prefers it.

## 2. Summary (limit 1500 characters, suggested 50 to 200 words)

> Saah is a scroll story and 3D explorer that asks whether Punjab's ground is still breathing. India pumps more groundwater from under Punjab than rain refills, and an aquifer that is drained for good makes the land sink for good. We read 24 passes of NASA-ISRO NISAR L-band radar (track 156, 21 Nov 2025 to 4 Nov 2026) over Sangrur, Barnala and Patiala. A 3D block of the aquifer carries three layers: radar brightness, interferogram, and ground motion. We inverted 21 real interferograms into a permanent trend and a reversible seasonal swing for every pixel. A crop-calendar test using ESA Sentinel-2 asks whether the HH channel brightens on rice-like fields only: HH rises about 3 times more than HV there, and falls on year-round vegetation. We compare L-band with S-band, and set published well levels beside the radar. We state what is not proven: the sign of the trend, S-band measurements, and a station-level well test.

(927 characters, 156 words: inside both the 1500 cap and the 50 to 200 word suggestion.)

## 3. Project Demonstration (slides of 7 or fewer, OR a video of 30 seconds or less)

We have no finished deck or video yet except `scripts/build_deck.cjs`, which generates a 7-slide deck (`node scripts/build_deck.cjs`).
Regenerate it so it matches the points below, host it publicly (Google Slides or Drive, "anyone with the link"), and paste that URL.
The form says the link must work without a password or sign-in. Test it in a private window.

### Seven-slide outline (title counts as slide 1)

1. **Title and question.** Saah: is Punjab's ground still breathing? Team Big Hero 7, NISAR data, live site URL.
2. **The problem.** Punjab pumped 27.8 billion m3 from under it in 2023 against 17 billion recharge (Central Ground Water Board). Wells fell about 1 m a year: Sangrur 7.75 m to 34.03 m (1996 to 2018), Barnala 10.87 to 34.19, Patiala 10.24 to 30.28 (Sharma, Sidana and Kumari 2024).
3. **What NISAR gives us.** L-band, 24 cm, 12-day repeat, 24 usable passes. Backscatter (how bright) and interferograms (how far the ground moved). One slide on the 3D block with the three layers.
4. **Ground motion, our own inversion.** 21 interferograms, per-pixel fit of a linear trend plus a seasonal sine. Trend = permanent, seasonal swing = reversible. Scene median swing 14.1 mm, trend noise about 12.9 mm, so single pixels are noisy and we say so.
5. **Does HH brighten on rice?** Sentinel-2 crop calendar: bare in June, green in September, cleared by 25 Oct. 29,165 rice-like cells. HH +11.1 against HV +3.7 (about 3 times), perennial vegetation HH -14.0, and HH falls 8.8 after the October harvest. The brightest-rising quarter of the plain is 78% rice-like against 66% overall. Verdict: consistent with, not proof.
6. **L-band against S-band.** S-band (about 9.4 cm) turns the same motion into 2.53 times more phase (7.5 mm per radian against 18.9). Our largest neighbour step is 3.1 times under the limit where S-band would alias, so Punjab's slow motion unwraps at both. The part that really separates them, decorrelation over crops, needs S-band acquisitions. Projected, not measured.
7. **Wells against radar, and what is next.** Wells say the water is going. One year of radar cannot yet show the answer: district trends of +9 to +36 mm a year are not plausible and straddle zero, so we read them as leftover atmosphere. Next: raw GUNW HDF5 with GACOS and ionosphere layers, Bhoonidhi S-band, CGWB WIMS well series, an official paddy map. Credits: NASA/ISRO, ASF, ESA, CGWB, Claude (SI disclosure).

### 30-second video script (about 75 spoken words, one take over a screen recording of the site)

| Seconds | Screen | Voice |
|---|---|---|
| 0 to 5 | Scroll top of the site, 3D block | "Punjab pumps more water than rain gives back. Is the ground above it still breathing?" |
| 5 to 12 | Switch layers: brightness, interferogram, ground motion | "NISAR's radar sees the ground move. We turned 21 interferograms into a permanent trend and a seasonal swing for every pixel." |
| 12 to 20 | Paddy chart | "Rice fields brighten the HH channel three times more than HV, and fade after harvest. Consistent with flooded paddy, not proof." |
| 20 to 26 | Wells table | "Wells fall about a metre a year. One year of radar cannot yet confirm the sinking." |
| 26 to 30 | End card with URL and "Built with Claude" | "Saah. Open code, honest limits." |

If you add images or video made with an AI tool, put a visible "AI-generated" watermark on them. The rules require it.

## 4. Project (public link)

**https://saah-gamma.vercel.app** (checked: HTTP 200 when this file was written, no login).
Code: https://github.com/SoulBreaker9/Big-Hero-7 (public repo, deploys to Vercel on every push through `.github/workflows`).
Caveat: the Vercel project sits on one team member's account (see `HANDOFF.md`). If it ever shows a login wall, import the GitHub repo into
another Vercel account and paste the new URL. Which link goes in the form: the website. Put the GitHub link in "Project Details".

## 5. Project Details (rich text: paste as is, then add bold to the headings)

**What it does.** Saah is a story-first web explorer for NISAR, the NASA-ISRO radar satellite. It follows one question: Punjab's
groundwater is falling about a metre a year, so is the land above it breathing in and out with the seasons (reversible, elastic) or sinking
for good (permanent loss of storage)? A 3D block of the aquifer, modelled in Blender and rendered live in the browser, carries three layers
you can switch between: radar brightness (24 passes, 21 Nov 2025 to 4 Nov 2026), the interferogram, and ground motion. Click any spot on the block to see its brightness through the year in HH and HV.

**What is new in this version (four additions).**

1. *Ground motion, our own inversion.* We converted 21 NISAR GUNW interferogram browse images back to phase (they are painted with a cyclic colour map), unwrapped each pair, removed a plane, and fitted, per pixel, a linear trend plus an annual sine across the pair differences, in the order MintPy uses. Output: a permanent trend in mm a year (the irreversible part) and a seasonal amplitude in mm (the reversible part), shown as the third atlas in the 3D scene (`uMotion` alongside `uBack` and `uPhase`). Result: scene median trend -5.7 mm a year, median seasonal swing 14.1 mm (95th percentile 29.9 mm), residual noise about 12.9 mm, coherence 0.97. Honest limit: we used browse quicklooks, not the GUNW HDF5 files, so there is no tropospheric or ionospheric correction layer, and the sign of the trend is not claimed (the quicklook phase sign convention is undocumented).
2. *S-band comparison.* NISAR carries L-band (about 23.8 cm) and S-band (about 9.4 cm, ISRO). Phase is 4π times motion over wavelength, so S-band shows the same motion as 2.53 times more phase. We rescaled our 21 real L-band pairs and counted neighbouring cells where the step would pass π, the point where a 2-D unwrapper cannot tell a step from a wrap. The largest S-band step is 3.1 times under that limit, so Punjab's slow motion would unwrap at both bands. A qualitative table covers canopy penetration, flooded-paddy double bounce and coherence. Honest limit: this is projected from L-band, not measured. We did not receive ISRO Bhoonidhi S-band data, and decorrelation over crops, the real difference between the bands, needs it.
3. *Does HH rise only on rice?* No public Punjab paddy map was reachable in the time we had, so we classified fields from ESA Sentinel-2 L2A (open, no login) by crop calendar: bare in early June, green on 18 Sep, cleared by 25 Oct. That gives 29,165 "rice-like" 260 m cells (65.6% of the 113,165 usable). From June to September HH rises 11.1 grey levels there against 3.7 for HV (about 3 times); on year-round vegetation both fall (HH -14.0, HV -5.8); after the October harvest HH drops 8.8. The brightest-rising quarter of the plain is 78% rice-like against 65.6% overall, and HH rise tracks greening only weakly (r = 0.27). Honest verdict: consistent with flooded paddy, not proof. The classifier cannot separate rice from maize or early cotton, and only three small classes serve as controls.
4. *Ground truth from wells.* Published October water levels for Sangrur, Barnala and Patiala (Sharma, Sidana and Kumari 2024, Table 4, 1996 to 2018) show falls of 26.3, 23.3 and 20.0 m, about 1.2, 1.1 and 0.9 m a year. Beside them we show the radar numbers within 15 km of each district centre. Honest finding: wells prove storage is being lost, but one year of radar cannot yet test it. The district radar trends (+9 to +36 mm a year, ranges across zero) are not plausible over a falling aquifer, so we read them as residual atmosphere or orbit error. The seasonal swing of 9 to 15 mm is consistent with elastic breathing but equals the scene-wide median of 14.1 mm, so it is not specific to these districts. We did not obtain the CGWB station series for 2025 to 2026 (the portal was in maintenance mode when we tried).

**Benefits and intended impact.** It makes a slow, invisible resource problem readable by farmers' advisers, students and policymakers without
a SAR background, and it shows an honest workflow: each claim sits beside its source and its limit. If the rice-HH pattern holds with an official paddy map, HH
could flag paddy extent from space and help target water-saving programmes. The same pipeline reruns on any NISAR frame.

**Tools, languages, hardware, software.** TypeScript, React 19, Vite, three.js with react-three-fiber, custom GLSL shaders, GSAP and Lenis for motion, Zustand for state, Blender (the aquifer block, rendered in Cycles) for the 3D model, Python (numpy, scipy, scikit-image, rasterio, Pillow, matplotlib) for the data pipeline, Node for the slide deck. Built on a Linux laptop, no special hardware. Hosted on Vercel, source on GitHub.

**How it is creative.** The data tells a story you scroll through: a 3D block of Punjab's ground sinks and swells with the layers you choose, the loader
tracks the real load, and every claim shows its uncertainty. We combined three public sources (NISAR, Sentinel-2, published well records) rather than relying on one.

**Factors we considered.** Honesty first: browse images are not calibrated data, so we say so. The sign of the motion is not claimed. Controls (perennial
vegetation and barren cells) sit beside every crop result. The site has a no-WebGL fallback and a reduced-motion mode. No user data is collected.

**Limitations (stated on the site and here).** Not done: inversion of the raw GUNW HDF5 with ionosphere and troposphere layers (needs Earthdata login and many GB); S-band measurements (needs Bhoonidhi registration); an official paddy map (we used a Sentinel-2 proxy); CGWB station-level 2025 to 2026 well series. One year of radar cannot separate seasonal from long-term motion with confidence.

Code and data pipeline: https://github.com/SoulBreaker9/Big-Hero-7

## 6. Use of Super Intelligence (SI): tick the options that apply

Tick these (all true for this project, based on the repo history and `HANDOFF.md`; remove any your team did not actually do):

- [x] Ideation or Brainstorming (the storyline and the four-point improvement plan were shaped with Claude)
- [x] Research or Information Gathering (finding the CGWB, Sharma et al. and Sentinel-2 sources)
- [x] Data Analysis and Interpretation (the motion inversion, the rice test, the S-band projection were written and run with Claude Code)
- [ ] Building SI/ML Into the Project: **leave unticked.** No model runs inside the site or the pipeline. (Tick only if you added one.)
- [x] Coding, Debugging, or Troubleshooting (Claude Code wrote and debugged most of the code)
- [x] Writing, Editing, or Translation (site text, docs and this file were drafted or edited with Claude)
- [x] Visual Design or Image Creation (layout and shaders with Claude; the 3D model was built in Blender by script. If any image came from an image generator, tick and watermark it.)
- [x] Presentation, Video, or Audio (the deck and the video script)
- [ ] Other Project-Related SI Use: leave unticked unless you used it elsewhere.
- [ ] None / Did not use SI: **do not tick** (it contradicts the above).

**Where the use is acknowledged.** The footer of the site already says: "An AI assistant (Claude) helped write the code and edit the text; every figure is cited above."
Strengthen it with this visible text (for the main agent to put in `src/App.tsx` footer, and in the repo README):

> Built with Claude (Anthropic's AI assistant, via Claude Code). Claude helped with ideation, research, data analysis, code, text, visual design and the slide deck. All figures come from the cited public sources, and the analysis scripts in `scripts/` are open so every number can be re-run. No NASA logos or branding are used.

Also add the same sentence to the deck's last slide and the video's end card. Code and data are acknowledged in descriptive text (here, the README and the site footer), which is what the rules ask for.

## 7. NASA Data (Link Text, Link URL)

I checked each URL with `curl`. The asf.alaska.edu mission page returned 403 to a script, so it is left out.

| Link Text | Link URL |
|---|---|
| NISAR L-band GCOV and GUNW products, track 156 frame 17, 21 Nov 2025 to 4 Nov 2026 (Alaska Satellite Facility DAAC, NASA Earthdata) | https://search.asf.alaska.edu/#/?dataset=NISAR |
| ASF DAAC search API, used by `scripts/build_data.py` to list and fetch the NISAR browse images | https://api.daac.asf.alaska.edu/services/search/param?platform=NISAR |
| NASA Earthdata (login and data access for NISAR files) | https://www.earthdata.nasa.gov/ |
| NASA-ISRO SAR Mission (NISAR) mission page (wavelengths, 12-day repeat, S-band) | https://nisar.jpl.nasa.gov/ |

Do not list Sentinel-2 here: it is ESA data, so it goes in the next table.

## 8. Space Agency Partner and Other Data (Link Text, Link URL)

| Link Text | Link URL |
|---|---|
| ESA Copernicus Sentinel-2 L2A (open, via Element84 Earth Search STAC and the AWS Open Data COGs) | https://earth-search.aws.element84.com/v1/ |
| Sentinel-2 L2A COGs on the AWS Open Data registry | https://registry.opendata.aws/sentinel-2-l2a-cogs/ |
| Sharma, Sidana and Kumari (2024), Groundwater exploitation in Punjab: a zone-wise analysis, J. Agricultural Development and Policy 34(1), Table 4 (district water levels) | https://doi.org/10.63066/23220457.34.1.002 |
| Central Ground Water Board, India (2023 extraction and recharge totals; WIMS portal not reachable when we built the page) | https://cgwb.gov.in/ |
| ISRO Bhoonidhi (S-band data portal; registered interest only, no data used) | https://bhoonidhi.nrsc.gov.in/ |
| Hasan et al. (2023), Global land subsidence mapping reveals widespread loss of aquifer storage capacity, Nature Communications 14:6180 | https://doi.org/10.1038/s41467-023-41933-z |
| Garg et al. (2022), Tracking hidden crisis in India's capital from space: implications of unsustainable groundwater use, Scientific Reports 12:651 | https://doi.org/10.1038/s41598-021-04193-9 |
| Mishra et al. (2024), Summer Monsoon Drying Accelerates India's Groundwater Depletion Under Climate Change, Earth's Future (title as the DOI registry gives it; the site describes it as "Groundwater loss in north India, 2002 to 2021", please check that description against the paper) | https://doi.org/10.1029/2024EF004516 |
| three.js | https://threejs.org |
| react-three-fiber | https://github.com/pmndrs/react-three-fiber |
| React | https://react.dev |
| Vite | https://vite.dev |
| Zustand | https://github.com/pmndrs/zustand |
| GSAP | https://gsap.com |
| Lenis (smooth scroll) | https://lenis.darkroom.engineering |
| Blender (3D model and renders) | https://www.blender.org |
| NumPy | https://numpy.org |
| SciPy | https://scipy.org |
| scikit-image (phase unwrapping) | https://scikit-image.org |
| rasterio (Sentinel-2 reading) | https://rasterio.readthedocs.io |
| Pillow | https://pillow.readthedocs.io |
| matplotlib (twilight colour map used to read phase back from the quicklooks) | https://matplotlib.org |
| Anek Latin and Anek Gurmukhi fonts via Fontsource (SIL Open Font License) | https://fontsource.org/fonts/anek-latin |
| Project source code | https://github.com/SoulBreaker9/Big-Hero-7 |

Before you submit, open `src/App.tsx` (the sources list) and `package.json` and make sure every library and paper there is in this table. The form requires
every external resource to be listed. Remove the ISRO row if the team prefers to list only what was actually used.

## 9. Project Submission Verification (you must tick these yourself)

Both boxes are the team's legal statements, so a person on the team must read and tick them. Do not tick them on someone's behalf. What they need from you:

1. **Agree to Terms and Conditions.** Read the Space Apps Project Submission Guide, the Participant Terms and Conditions and the Privacy Policy (linked in the form).
2. **Confirm all work is original.** Before ticking, make sure:
   - every library, dataset, paper, font and image used is in the two tables above (section 7 and 8);
   - you hold permission for any image, music, text or font that is not your own (Anek fonts are SIL OFL; three.js, React and the other libraries are open source; NISAR and Sentinel-2 data are open);
   - no NASA logo, flag or mission identifier is used or altered in the site, deck or video (the site says it is not affiliated with NASA or ISRO);
   - any image, video or audio made by an AI tool carries a visible watermark or a description saying so;
   - the 3D model and renders were built by the team (Blender script in `blender/`); if any asset came from elsewhere (for example a downloaded model or texture), list it.

## 10. What is NOT done (say this to judges if asked)

| Brief item | Status |
|---|---|
| Real ground motion from GUNW HDF5 with ionosphere and troposphere layers, MintPy | **Not done.** Inversion runs on browse quicklooks (same maths, no correction layers, sign of trend not claimed). Needs Earthdata login and the HDF5 files. |
| S-band measurement from ISRO Bhoonidhi | **Not done.** Projection from L-band plus a physics table. Needs registration and S-band acquisitions. |
| Official Punjab paddy map | **Not done.** Sentinel-2 crop-calendar proxy, cannot separate rice from maize or cotton. |
| CGWB station-level well levels, 2025 to 2026 | **Not done.** Used published 1996 to 2018 district figures. CGWB portal was in maintenance mode. |
