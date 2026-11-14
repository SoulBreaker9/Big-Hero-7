# Saah — NASA Space Apps submission

**Team:** Big Hero 7
**Challenge recorded by the team:** Dancing with the SARs
**Reviewed against the repository:** 14 November 2026

Use sections 1–8 for the corresponding form fields. Copy only the answer text, not the editor notes. Section 9 is for the person submitting; section 10 records the factual review.

> **Form verification:** The field names, 1,500-character summary limit and demonstration format below come from the team's existing transcription of the submission form. The current 2026 guide and challenge page could not be independently retrieved during this review. Confirm the labels, limits and required declarations in the live form before submitting. Do not treat older Space Apps guides as the 2026 rules.

---

## 1. Project Name

Saah: Is Punjab's Ground Still Breathing?

**Editor note:** Saah (ਸਾਹ) means “breath” in Punjabi. Use **Big Hero 7** as the team name, rather than as a substitute for the project name.

## 2. Summary

**Paste this answer:**

Punjab's fields feed millions, but the water beneath them is running down. When groundwater returns, does the land recover too? Saah, Punjabi for “breath,” makes that question visible. Our interactive 3D story follows 24 NASA–ISRO NISAR radar passes over central Punjab, from November 2025 to November 2026. Visitors can move through the year, switch radar views and pin a location to explore its signal and source. We combine NISAR previews, an ESA Sentinel-2 crop-calendar proxy and published well records. Rice-like areas show about three times more increase in the HH radar channel than in HV, consistent with flooded paddy. An exploratory motion analysis tests seasonal recovery; it does not yet establish permanent compaction. Saah helps students, agricultural advisers and water planners understand the evidence and the next questions to investigate. The working app and analysis scripts are public.

**Editor note:** 906 characters including spaces; 138 whitespace-separated words. Recheck after edits against the live form's limit.

## 3. Project Demonstration

**Seven-slide presentation — view link:**
https://www.canva.com/d/prumJxSMPeqnyfM

**Local presentation files:** `deck/Saah-Editable.pptx` and `deck/Saah-Editorial.pdf`.

**Editor note:** The link above is the view URL returned for the latest editable seven-slide Canva deck. Check it in a signed-out/private browser before submission and enable public viewing if needed. A Canva view URL alone does not prove anonymous access. Use a public PDF alternative if the form or viewer cannot open it. Submit one finished demonstration in the format the live form requires.

The presentation covers the question and team, groundwater pressure, the Punjab/NISAR choice, the working explorer, crop-pattern findings, the exploratory motion test and intended impact.

### Optional 30-second video alternative

> Punjab's fields feed millions. What happens when the water beneath them runs down? Saah brings a year of NISAR radar into an interactive 3D landscape. Explore 24 passes, pin a location and trace its source. Compare rice-like crop patterns, exploratory ground-motion estimates and historic wells. Does the ground recover when water returns? We're building the evidence to test that question. Explore Saah. Follow the data.

**Editor note:** This is an unrecorded script, not an existing video. Time the actual recording, including the end card, against the live form's duration limit. Credit the sources and AI assistance in the selected demonstration.

## 4. Project

**Working application:**
https://saah-gamma.vercel.app/

**Source code and analysis pipeline:**
https://github.com/SoulBreaker9/Big-Hero-7

**Editor note:** Put the application URL in the Project field if it asks for the working solution. Include GitHub in Project Details as well. The repository contains a deployment workflow for pushes to `main`; this review did not trigger a deployment or change sharing settings.

## 5. Project Details

**Paste the following answer, retaining the headings if the form supports formatting.**

### The question beneath the fields

A field can look healthy while the groundwater supporting it is being depleted. Punjab's 2023 groundwater assessment reported 27.8 billion cubic metres extracted against 16.98 billion cubic metres of annual extractable resource: about 164%. As groundwater pressure falls, aquifer sediments can compress. Some movement can reverse when pressure recovers; inelastic compaction can permanently reduce storage space.

We built Saah around a question people can picture: **when water returns, does the land rise back?** Answering it requires more than seeing the surface sink. We need to distinguish seasonal movement, longer-term change and effects introduced by the radar observations themselves.

### Why Punjab, and why NISAR?

Our pilot covers the Malwa plain in central Punjab, between 75.20–76.60° E and 29.95–31.15° N. Heavy groundwater use, a pronounced crop cycle and available NISAR coverage make it a useful place to investigate the relationship between farming, water and surface change.

Radar observes Earth through clouds and at night. NISAR's longer-wavelength L-band can retain useful signals over vegetation that challenges shorter-wavelength radar, although changing crops can still cause problems. We use ascending track 156, frame 17: 24 backscatter passes from 21 November 2025 to 4 November 2026, plus 21 interferogram previews. The record has gaps; these are not 24 uninterrupted twelve-day observations.

### What someone can do with Saah

Saah starts as a guided story and opens into an explorer. Real radar imagery sits on a 3D block of Punjab; the underground layers, wells and water table illustrate the mechanism rather than represent a measured underground model.

A visitor can move through the dates, switch between radar brightness, interferograms and an exploratory motion view, and pin a location to chart its HH and HV brightness through the year. Backscatter is the strength of the radar echo. HH and HV are two transmit/receive polarization channels that respond differently to surface structure and vegetation. An interferogram compares radar phase between acquisitions and can contain ground-motion signals alongside atmospheric and other effects.

Each pass lists its acquisition date, release tier and NASA granule identifier. For example, an agricultural adviser can inspect the seasonal signal near Sangrur, compare it with the crop-pattern analysis and follow the source record. Students can use the same workflow without first learning a specialist SAR package.

### What we built, and what we found

**A traceable radar archive.** Our Python pipeline searches ASF's NISAR catalogue, selects releases, crops browse images to a consistent study area and packages them into image atlases for the browser. It records excluded passes and source identifiers. The previews are display products, so their grey levels are not calibrated backscatter or direct measurements of pumping.

**A crop-pattern test.** We used cloud-masked ESA Sentinel-2 observations to identify areas that were relatively bare in June, green in September and cleared by late October. These are “rice-like” areas, not a verified rice map. The brightness comparison uses 29,165 cells with locally consistent rice-like labels, alongside perennial-vegetation and barren-area controls.

After subtracting a broad spatial background, the rice-like sample shows an HH increase of 11.14 grey levels and an HV increase of 3.66: about three times greater in HH. These compare the available pre-July baseline with acquisitions from 24 August to 29 September. Perennial vegetation shows an HH decrease of 13.99 grey levels. The rice-like sample's HH then falls by 8.79 grey levels in the available post-harvest pass on 4 November. This pattern is consistent with flooded paddy scattering, but does not establish crop identity, flooding or groundwater withdrawal by itself.

**An exploratory motion analysis.** We decoded colour-mapped phase from 21 interferogram browse images, averaged it spatially, unwrapped it, removed a fitted plane and fitted a linear component plus an annual cycle to the pair differences. The output has a median seasonal amplitude of 14.1 mm in line-of-sight-equivalent units and a median pair-residual RMS of 12.85 mm. These describe the preview-based fit, not a validated displacement measurement. A fitted trend does not by itself identify permanent compaction, and the preview's phase-sign convention is unresolved. Plane removal also makes the result relative and can remove genuine broad-scale motion. The motion layer is a 128 × 128 grid across the study area; fitted browse-image registration has an approximately 1.8 km residual. These are regional exploratory views, not surveyed field boundaries or field-scale displacement measurements.

**A comparison with historic wells.** Published October water depths increased by 26.28 m in Sangrur, 23.32 m in Barnala and 20.04 m in Patiala between 1996 and 2018. We display these records beside radar summaries from 15 km windows around the district centres. They document historic groundwater decline and give context; they do not validate the 2025–26 radar signal or quantify permanent storage loss.

**An L-/S-band physics comparison.** Using wavelengths of 238 mm and 94 mm, we show why the same displacement produces 2.53 times more phase at S-band. This is a projection from L-band, not an observation of S-band data. It helps explain radar sensitivity without claiming that either band's real-world crop coherence or unwrapping performance has been validated here.

### How the solution works

Python, NumPy, SciPy, scikit-image, rasterio, Pillow and Matplotlib support the analysis. React, TypeScript, Vite and Three.js render the explorer, with React Three Fiber, custom shaders and Zustand connecting the scene and controls. Blender generates the aquifer and satellite model; GSAP and Lenis support the guided story. Image atlases and a browser worker keep repeated image sampling off the main thread. The application is served as a static site on Vercel and requires no visitor account.

We considered access as well as appearance: the story respects reduced-motion preferences, offers preset locations for exploration, and retains text if the 3D scene fails. The project does not implement a trained AI model, and it does not ask visitors to submit personal data.

### Who it helps, and where we go next

Saah's immediate contribution is a working way to understand and investigate an invisible resource problem. It brings radar, crop context and groundwater history into one experience, with a route back to the source behind each observation.

The next scientific step is to process the calibrated NISAR science files with the appropriate corrections and reference checks, compare against contemporary well observations, validate the crop proxy and extend the time record. Measured S-band acquisitions would allow a real frequency comparison. With those checks, this approach could help water managers identify areas for closer monitoring and assess changes following interventions. It is not yet a recharge-allocation or well-failure prediction tool.

The same question matters in other pumped agricultural regions. The pipeline provides a starting point for adapting the investigation to another NISAR frame, with local crop calendars, groundwater records and validation. We begin with Punjab because it gives this global question a specific place, a visible farming cycle and people who stand to benefit from a clearer answer.

**Explore:** https://saah-gamma.vercel.app/
**Code and analysis:** https://github.com/SoulBreaker9/Big-Hero-7

## 6. Use of Super Intelligence (SI)

**Editor note:** Keep the terminology and choices shown in the live form. The selections below reflect the project documentation and this session; the team should confirm its actual use before submitting.

- [x] Ideation or Brainstorming
- [x] Research or Information Gathering
- [x] Data Analysis and Interpretation
- [ ] Building SI/ML Into the Project
- [x] Coding, Debugging, or Troubleshooting
- [x] Writing, Editing, or Translation
- [x] Visual Design or Image Creation
- [x] Presentation, Video, or Audio
- [ ] Other Project-Related SI Use
- [ ] None / Did not use SI

**Explanation, if the form provides a text field:**

We used Claude through Claude Code to support ideation, research, analysis implementation, code, visual design and writing. OpenAI's Codex assisted with subsequent presentation development, repository review and submission editing. AI is used in the development process; no trained AI model is part of the deployed application. The radar and Sentinel-2 images come from the cited public datasets, and the aquifer and satellite illustrations are generated by our Blender scripts. The analysis code and outputs are available for inspection in the repository.

**Editor note:** Confirm the origin of the team logo and any additional media before making an originality declaration. Disclose AI-created assets as required by the current guide; this review could not verify a specific 2026 watermark rule.

## 7. NASA Data

Use these as Link Text / Link URL entries. Describe the products actually used: **browse previews**, not calibrated HDF5 measurements.

| Link text | Link URL |
|---|---|
| NISAR L-band GCOV/GUNW browse products via ASF DAAC — track 156, frame 17; 21 Nov 2025–4 Nov 2026 | https://search.asf.alaska.edu/#/?dataset=NISAR |
| ASF search API — catalogue and browse-image discovery used by our pipeline | https://api.daac.asf.alaska.edu/services/search/param?platform=NISAR |
| NASA–ISRO NISAR mission — mission and radar background | https://nisar.jpl.nasa.gov/ |
| ASF NISAR Data User Guide — product and access documentation | https://nisar-docs.asf.alaska.edu/ |

**Editor note:** NASA Earthdata Search and other educational resources linked on the website are listed below as background links, not additional datasets analyzed.

## 8. Space Agency Partner and Other Data / Resources

### Data and research used

| Link text | Link URL |
|---|---|
| ESA Copernicus Sentinel-2 L2A — crop-calendar proxy; accessed through Earth Search and AWS COGs | https://registry.opendata.aws/sentinel-2-l2a-cogs/ |
| Element 84 Earth Search STAC API — Sentinel-2 scene discovery | https://earth-search.aws.element84.com/v1/ |
| CGWB, Dynamic Ground Water Resources of India 2023 — Punjab extraction and annual extractable resource | https://cgwb.gov.in/ |
| Sharma, Sidana & Kumari (2024), Groundwater Exploitation in Punjab: A Zone-wise Analysis — Table 4, historic October water depths | https://doi.org/10.63066/23220457.34.1.002 |
| Hasan et al. (2023), Global land subsidence mapping reveals widespread loss of aquifer storage capacity | https://doi.org/10.1038/s41467-023-41933-z |
| Garg et al. (2022), Tracking hidden crisis in India's capital from space: implications of unsustainable groundwater use | https://doi.org/10.1038/s41598-021-04193-9 |
| Mishra et al. (2024), Summer Monsoon Drying Accelerates India's Groundwater Depletion Under Climate Change | https://doi.org/10.1029/2024EF004516 |
| USGS Circular 1182, Land Subsidence in the United States — elastic and inelastic compaction | https://pubs.usgs.gov/circ/circ1182/ |

### Software, fonts and development tools

| Resource | Link URL |
|---|---|
| React | https://react.dev/ |
| TypeScript | https://www.typescriptlang.org/ |
| Vite | https://vite.dev/ |
| Three.js | https://threejs.org/ |
| React Three Fiber | https://github.com/pmndrs/react-three-fiber |
| Drei | https://github.com/pmndrs/drei |
| Zustand | https://github.com/pmndrs/zustand |
| GSAP / React integration | https://gsap.com/resources/React/ |
| Lenis | https://github.com/darkroomengineering/lenis |
| React Bits — adapted text animation concepts; attribution in src/bits.tsx | https://github.com/DavidHDev/react-bits |
| Blender | https://www.blender.org/ |
| NumPy | https://numpy.org/ |
| SciPy | https://scipy.org/ |
| scikit-image | https://scikit-image.org/ |
| rasterio | https://rasterio.readthedocs.io/ |
| Pillow | https://pillow.readthedocs.io/ |
| Matplotlib | https://matplotlib.org/ |
| Anek Latin | https://fontsource.org/fonts/anek-latin |
| Anek Gurmukhi | https://fontsource.org/fonts/anek-gurmukhi |
| Google Fonts — Anek font files used for the presentation | https://github.com/google/fonts |
| PptxGenJS — existing presentation generator | https://github.com/gitbrent/PptxGenJS |
| FontTools — editable presentation preparation | https://github.com/fonttools/fonttools |
| Vercel — application hosting | https://vercel.com/ |
| Canva — presentation preparation | https://www.canva.com/ |
| Claude Code — development assistance | https://code.claude.com/docs/ |
| OpenAI Codex — presentation and submission assistance | https://developers.openai.com/codex/ |
| Project repository | https://github.com/SoulBreaker9/Big-Hero-7 |

### Educational and catalogue links shown on the website

These are background or exploration resources. Saah does **not** claim to have analyzed UAVSAR, RADARSAT, SAOCOM or measured S-band data.

| Resource | Link URL |
|---|---|
| NASA Earthdata Search | https://search.earthdata.nasa.gov/ |
| NASA introduction to remote sensing | https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing |
| NASA introduction to SAR | https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar |
| NASA ARSET training | https://www.earthdata.nasa.gov/data/projects/arset |
| NISAR StoryMaps | https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/ |
| NISAR applications / societal benefits | https://nisar.jpl.nasa.gov/applications/societal-benefit |
| UAVSAR Postcards | https://uavsar.jpl.nasa.gov/education/postcards.html |
| CSA RADARSAT Constellation Mission catalogue | https://donnees-data.asc-csa.gc.ca/en/dataset |
| CSA SAR Python tutorial | https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial |
| CSA RADARSAT-1 catalogue | https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1 |
| CONAE SAOCOM catalogue | https://catalog.saocom.conae.gov.ar/catalog/#/ |
| CONAE catalogue registration | https://catalogos.conae.gov.ar/catalogo/catalogo.html |
| ISRO Bhoonidhi — proposed source for future S-band acquisitions | https://bhoonidhi.nrsc.gov.in/ |

**Editor note:** These entries identify the project's sources and links, not a claim that every destination was reachable during this review. Check the selected form URLs before submitting. `package.json`, script imports and the attribution in `src/bits.tsx` remain the detailed software record.

## 9. Final checks for the person submitting

- [ ] Confirm the challenge title, field labels, character limits and demonstration format in the live 2026 form.
- [ ] Open the application, repository and selected presentation while signed out. Confirm the presentation is seven slides and does not require edit access.
- [ ] Confirm the six team members in the portal: Parshva Shah (Team Leader), Neal Daftary, Priyanshu Doshi, Tirth Patel, Nandini Rathod and Srishti Asrani.
- [ ] Confirm the AI-use selections, team-logo provenance and external-resource credits reflect what the team actually used.
- [ ] Read the live terms and originality declaration, then make the required attestations yourself. This document does not make them on the team's behalf.
- [ ] Use the precise claims in this document when answering judges; some website and older-slide wording is stronger than the implemented evidence supports. See section 10.

## 10. Review notes — do not paste into the form

### Corrections made

| Previous wording | Correction and evidence |
|---|---|
| “Permanent trend” / “trend = irreversible compaction” | A linear fit is not a physical diagnosis. The preview analysis is relative, uncorrected and has an unresolved sign convention. `scripts/build_motion.py`. |
| “Coherence 0.97” as measurement quality | The code calculates local concentration of decoded colour-phase vectors, not the science product's interferometric coherence. Removed as a validation claim. `multilook()` in `scripts/build_motion.py`. |
| 29,165 rice-like cells = 65.6% of 113,165 | The 29,165 sample is filtered for locally consistent labels; 65.6% is the unfiltered rice-like mask's share of valid cells. They have different denominators. `scripts/build_paddy.py`. |
| HH +11.1 / HV +3.7 “June to September” | Actual baseline: all 16 available passes before July, beginning November 2025. Peak: 24 Aug, 17 Sep and 29 Sep 2026. The change is spatially background-subtracted. Post-harvest sample: 4 Nov only. `scripts/build_paddy.py`, `passes.json`. |
| 21 twelve-day comparisons | `passes.json` contains pair separations of 12, 24 and 36 days. Use “21 interferogram previews.” |
| Historic wells validate radar or prove permanent storage loss | The well data cover 1996–2018 and the radar covers 2025–26. Water-depth decline alone does not quantify storage loss or identify inelastic compaction. Table 4 checked against the original journal PDF. |
| District radar ranges all cross zero | These are interquartile spatial ranges, not confidence intervals; Barnala's stored range is +6.4 to +60.0 mm/year. No validation claim is based on them. `wells.json`. |
| S-band “would unwrap cleanly” | Scaling an already-unwrapped L-band estimate cannot test unseen S-band decorrelation or recover missed phase cycles. Retained only the wavelength-sensitivity projection. `scripts/build_sband.py`. |
| Rain-only recharge / 17 billion m³ recharged | Use the reported **annual extractable groundwater resource**, not a rain-only recharge estimate. |
| No finished presentation; Claude-only disclosure | Added the current seven-slide view link and included OpenAI's subsequent presentation/review assistance. |
| Every number comes from repo JSON / every URL checked | External groundwater figures require research sources. Reachability and form-rule verification are stated explicitly rather than assumed. |

### Wording to align before submission

This review changes `SUBMISSION.md`; it does not alter the application or earlier presentations. In particular, the live-source copy still contains “Flooded paddy lights up. Nothing else does,” “Strip out the atmosphere,” and “The wells drop a metre every year” (`src/App.tsx`, `src/Wells.tsx`). The S-band component also says it would unwrap cleanly (`src/SBand.tsx`). Treat these as simplified or overstated labels, and use the qualified explanations above in the submission. A future copy pass should align the website with them.

### What was verified

- Counts, dates, study area and saved results against `src/data/passes.json`, `motion.json`, `paddy.json`, `sband.json` and `wells.json`.
- Statistical definitions, date windows, sample filters and processing steps against the corresponding scripts.
- The well-depth values and October-over-October definition against [the publisher's original Table 4](https://www.isadp.in/publication/download-pdf/272); paper metadata against its DOI record. Research titles checked against DOI metadata where accessible.
- Current presentation URL and seven-slide count from the completed Canva work in this session.

This was a documentation and saved-output audit. The scientific pipeline was not rerun, no new field validation was performed, and the current official 2026 form/guide and anonymous presentation access remain for the submitter to confirm.
