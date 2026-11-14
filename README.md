# Saah (ਸਾਹ — “breath”)

**Is Punjab's ground still breathing?**

Saah is an interactive 3D story and satellite-data explorer built by **Big Hero 7** for the **NASA Space Apps Challenge 2026**. It follows a year of NASA–ISRO NISAR radar over central Punjab to explore a question beneath its farmland: when groundwater returns, does the land recover too?

**Deployed website:** [Explore Saah live](https://saah-gamma.vercel.app/)

**Problem statement:** [Dancing with the SARs — NASA Space Apps 2026](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/)

![Saah's interactive landscape](docs/hero.jpg)

## The problem

Punjab depends on groundwater to grow its crops, but extraction places heavy pressure on its aquifers. When pumping lowers groundwater pressure, the sediments beneath the fields can compress. Some movement reverses when water returns; other compaction can persist and reduce the space available to store water.

These changes are difficult to understand from the surface alone. Saah brings radar observations, crop patterns and historic well records into one experience, helping students, agricultural advisers and water planners explore the evidence without needing a specialist radar tool.

## What Saah does

The experience begins with a guided story about groundwater and opens into an explorer. Real radar imagery sits on a 3D landscape, with illustrated underground layers explaining what may happen beneath the fields.

- **Explore a year from orbit:** move through 24 NISAR radar passes from November 2025 to November 2026.
- **Switch perspectives:** view radar brightness, interferograms that compare radar phase between dates, and an exploratory ground-motion layer.
- **Inspect a location:** pin a place and chart its HH and HV radar-brightness signals over time.
- **Connect the observations:** compare rice-like crop patterns from Sentinel-2 with radar changes and published groundwater records.
- **Trace the data:** check acquisition dates, release levels and the source granule behind each image.

The crop analysis finds a seasonal radar pattern consistent with flooded paddy. The motion analysis is exploratory: it uses browse previews and does not yet establish permanent subsidence. Historic wells provide context rather than validation of the current radar signal.

## How it works

Python scripts retrieve and process the satellite previews, build image atlases and save the analysis results. React and Three.js render the landscape and explorer in the browser, while Blender generates the aquifer and satellite illustrations. GSAP and Lenis support the guided scroll experience.

The deployed application is a static site hosted on Vercel. Visitors can explore it without an account. The underground model is illustrative, not a measured reconstruction of Punjab's aquifer.

## Run locally

```bash
npm install
npm run dev
```

To check and build the application:

```bash
npm run lint
npm run build
```

The browser app uses the data already included in `src/data/`; rebuilding the scientific datasets is optional. See [PROJECT_EXPLAINED.md](PROJECT_EXPLAINED.md) for the architecture and processing commands.

## Data and documentation

Saah uses NASA–ISRO NISAR L-band GCOV/GUNW browse products through ASF DAAC, ESA Sentinel-2 imagery, CGWB figures and published district well records. The analysis scripts are in `scripts/`, and source identifiers accompany the radar record.

- [PROJECT_EXPLAINED.md](PROJECT_EXPLAINED.md) — how the application and data pipeline work.
- [HANDOFF.md](HANDOFF.md) — project context, sources and development history.

Saah is an independent hackathon project and is not affiliated with or endorsed by NASA or ISRO.

## Use of AI

The project originated from team-driven ideation, with concepts further refined through AI-assisted exploration. Claude (Anthropic, via Claude Code) and ChatGPT (OpenAI, via Codex) served as execution companions, supporting research, analysis, coding, and design. AI augmented the team's capabilities but never replaced human reasoning, creativity, or decision-making; all core ideas, technical judgments, and final decisions remained team-driven. All figures are backed by cited public sources, with reproducible analysis scripts available in `scripts/`.

## Team — Big Hero 7

| Team member | Role | Connect |
| :--- | :--- | :---: |
| 👑 **Parshva Shah** | ![Team Lead & Research](https://img.shields.io/badge/Team_Lead_%26_Research-713B9C?style=flat-square) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?logo=linkedin&logoColor=white&style=flat-square)](https://www.linkedin.com/in/parshva-shah-0473b3319/) |
| **Neal Daftary** | ![Remote Sensing & Data Analysis](https://img.shields.io/badge/Remote_Sensing_%26_Data_Analysis-248A82?style=flat-square) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?logo=linkedin&logoColor=white&style=flat-square)](https://www.linkedin.com/in/neal-daftary-45743731a/) |
| **Nandini Rathod** | ![Remote Sensing & Data Analysis](https://img.shields.io/badge/Remote_Sensing_%26_Data_Analysis-248A82?style=flat-square) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?logo=linkedin&logoColor=white&style=flat-square)](https://www.linkedin.com/in/nandini-rathod-43b18a37a/) |
| **Tirth Patel** | ![Web & 3D Development](https://img.shields.io/badge/Web_%26_3D_Development-3478B7?style=flat-square) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?logo=linkedin&logoColor=white&style=flat-square)](https://www.linkedin.com/in/tirthpatel-ai/) |
| **Priyanshu Doshi** | ![Web & 3D Development](https://img.shields.io/badge/Web_%26_3D_Development-3478B7?style=flat-square) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?logo=linkedin&logoColor=white&style=flat-square)](https://www.linkedin.com/in/iampriyanshudoshi/) |
| **Srishti Asrani** | ![Design & Storytelling](https://img.shields.io/badge/Design_%26_Storytelling-D94D91?style=flat-square) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?logo=linkedin&logoColor=white&style=flat-square)](https://www.linkedin.com/in/srishti-asrani-75aab1375/) |
