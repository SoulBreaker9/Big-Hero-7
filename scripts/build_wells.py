#!/usr/bin/env python3
"""Put published district water levels next to what NISAR measured over the same districts.

Wells: Table 4 of Sharma, Sidana and Kumari (2024), October water level (m below ground), 1996 and 2018.
Radar: median of src/data/motion.webp (R trend, G seasonal amplitude, B quality) within RADIUS_KM of each district centre.
Writes src/data/wells.json. Run: python scripts/build_wells.py
"""
import json, math, os
import numpy as np
from PIL import Image

DATA = os.path.join(os.path.dirname(__file__), "..", "src", "data")
RADIUS_KM = 15
M = json.load(open(os.path.join(DATA, "motion.json")))
ROI = json.load(open(os.path.join(DATA, "passes.json")))["roi"]      # lon0, lat0, lon1, lat1

# centres are approximate town coordinates, good to a few km: the window is 15 km, so that is fine
DISTRICTS = {
    "Sangrur": dict(lon=75.84, lat=30.25, w96=7.75, w18=34.03, rice96=70.59, rice18=90.15),
    "Barnala": dict(lon=75.55, lat=30.38, w96=10.87, w18=34.19, rice96=73.23, rice18=91.12),
    "Patiala": dict(lon=76.39, lat=30.34, w96=10.24, w18=30.28, rice96=73.34, rice18=90.66),
}
YEARS = 2018 - 1996

img = np.asarray(Image.open(os.path.join(DATA, "motion.webp")).convert("RGB"), np.float32)
N = img.shape[0]
assert img.shape[:2] == (N, N) and N == M["n"], "motion.webp does not match motion.json"
trend = (img[..., 0] / 255 * 2 - 1) * M["trendRange"]       # mm/yr, negative is away from the satellite
amp = img[..., 1] / 255 * M["ampRange"]                      # mm
good = img[..., 2] / 255 > 0.5                               # pairs agree

# row 0 is the north edge, as in every atlas tile
lon = ROI[0] + (np.arange(N) + 0.5) / N * (ROI[2] - ROI[0])
lat = ROI[3] - (np.arange(N) + 0.5) / N * (ROI[3] - ROI[1])
LON, LAT = np.meshgrid(lon, lat)

out = {"radiusKm": RADIUS_KM, "years": f"1996 to 2018", "roi": ROI, "districts": {}}
for name, d in DISTRICTS.items():
    assert ROI[0] <= d["lon"] <= ROI[2] and ROI[1] <= d["lat"] <= ROI[3], f"{name} is outside the radar scene"
    km = np.hypot((LON - d["lon"]) * 111.32 * math.cos(math.radians(d["lat"])), (LAT - d["lat"]) * 110.57)
    m = (km <= RADIUS_KM) & good
    assert m.sum() > 100, f"{name}: too few good cells"
    out["districts"][name] = {
        "lon": d["lon"], "lat": d["lat"],
        "waterM": {"1996": d["w96"], "2018": d["w18"]}, "fallM": round(d["w18"] - d["w96"], 2),
        "fallMPerYr": round((d["w18"] - d["w96"]) / YEARS, 2),
        "riceShare": {"1996": d["rice96"], "2018": d["rice18"]},
        "radar": {"cells": int(m.sum()), "trendMmYr": round(float(np.median(trend[m])), 1),
                  "trendIqr": [round(float(x), 1) for x in np.percentile(trend[m], [25, 75])],
                  "seasonalMm": round(float(np.median(amp[m])), 1),
                  "seasonalIqr": [round(float(x), 1) for x in np.percentile(amp[m], [25, 75])]},
    }

# Scale gap, not a measurement: compaction = Sk * head change. Sk (skeletal storage, m of compaction per m of head) is
# unmeasured here, so show the range a reader can check, 1e-4 to 1e-2, applied to the observed mean fall in head.
out["scaleGap"] = {"sk": [1e-4, 1e-2], "note": "illustrative range, not measured for these districts"}
mean_fall = float(np.mean([v["fallMPerYr"] for v in out["districts"].values()]))
out["scaleGap"]["meanFallMPerYr"] = round(mean_fall, 2)
out["scaleGap"]["impliedMmPerYr"] = [round(mean_fall * s * 1000, 2) for s in out["scaleGap"]["sk"]]
out["scene"] = {k: M[k] for k in ("trendMedian", "ampMedian", "noiseMm", "pairs")}

json.dump(out, open(os.path.join(DATA, "wells.json"), "w"), indent=1)
for k, v in out["districts"].items():
    print(k, v["waterM"], "fall %.2f m/yr" % v["fallMPerYr"], "radar trend", v["radar"]["trendMmYr"], v["radar"]["trendIqr"], "seasonal", v["radar"]["seasonalMm"], "cells", v["radar"]["cells"])
print("implied", out["scaleGap"]["impliedMmPerYr"], "mm/yr from a", out["scaleGap"]["meanFallMPerYr"], "m/yr fall")
