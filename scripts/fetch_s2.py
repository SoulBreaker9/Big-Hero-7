#!/usr/bin/env python3
"""Fetch Sentinel-2 L2A (ESA Copernicus, open on AWS, no login) onto the NISAR ROI grid.

  python3 scripts/fetch_s2.py CACHE_DIR            needs numpy, rasterio

Per date: NDVI and MNDWI on a 512 x 512 grid (the same grid as one NISAR atlas tile), cloud-masked with the
scene classification, mosaicked over the four MGRS tiles that touch the ROI. Bands are read through a warped VRT,
over the 80 m COG overview, not the 10 m pixels: all we need is a 260 m grid.
"""
import json, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.vrt import WarpedVRT

ROI = json.load(open(os.path.join(os.path.dirname(__file__), "..", "src", "data", "passes.json")))["roi"]
G = 512
DST = from_bounds(*ROI, G, G)
CACHE = sys.argv[1]
# one date per stage of the Punjab rice calendar, plus the wheat peak that tells cropland from not
DATES = ["2026-02-25", "2026-06-02", "2026-06-17", "2026-06-27", "2026-07-15", "2026-09-18", "2026-10-25", "2026-11-04"]
BANDS = ["green", "red", "nir", "swir16", "scl"]
HOST = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/"


def stac(date):
    body = {"collections": ["sentinel-2-l2a"], "bbox": ROI, "limit": 50, "datetime": f"{date}T00:00:00Z/{date}T23:59:59Z"}
    r = urllib.request.Request("https://earth-search.aws.element84.com/v1/search", json.dumps(body).encode(), {"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=60))["features"]


def warp(job):
    href, kind = job
    href = href.replace("s3://sentinel-cogs/", HOST)
    for attempt in range(3):
        try:
            with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_TIMEOUT="60"), rasterio.open(href, overview_level=2) as ds, \
                 WarpedVRT(ds, crs="EPSG:4326", transform=DST, width=G, height=G, nodata=0,
                           resampling=Resampling.nearest if kind == "scl" else Resampling.average) as v:
                return v.read(1).astype(np.float32)
        except Exception as e:
            err = e
    raise RuntimeError(f"{href}: {err}")


if __name__ == "__main__":
    os.makedirs(CACHE, exist_ok=True)
    jobs, meta = [], []
    for d in DATES:
        if os.path.exists(os.path.join(CACHE, d + ".npz")):
            continue
        items = stac(d)
        assert items, f"no Sentinel-2 scenes on {d}"
        for it in items:
            for k in BANDS:
                jobs.append((it["assets"][k]["href"], k)); meta.append((d, it["id"], k))
    print(len(jobs), "band reads", flush=True)
    with ThreadPoolExecutor(24) as ex:
        res = list(ex.map(warp, jobs))
    by = {}
    for (d, iid, k), a in zip(meta, res):
        by.setdefault(d, {}).setdefault(iid, {})[k] = a
    for d, scenes in by.items():
        ndvi = np.full((G, G), np.nan, np.float32); mndwi = ndvi.copy()
        for b in scenes.values():
            ok = np.isin(b["scl"], [4, 5, 6]) & (b["nir"] > 0)           # vegetation, bare soil, water: not cloud, shadow, snow
            r = {k: b[k] / 10000 for k in BANDS[:4]}   # the STAC metadata says offset -0.1, but these 2026 scenes carry none: median red DN is 537, below the 1000 it would need
            nd = (r["nir"] - r["red"]) / (r["nir"] + r["red"] + 1e-6)
            mn = (r["green"] - r["swir16"]) / (r["green"] + r["swir16"] + 1e-6)
            fill = ok & np.isnan(ndvi)
            ndvi[fill], mndwi[fill] = nd[fill], mn[fill]
        np.savez_compressed(os.path.join(CACHE, d + ".npz"), ndvi=ndvi, mndwi=mndwi)
        print(d, "valid %.0f%%" % (100 * np.isfinite(ndvi).mean()), flush=True)
