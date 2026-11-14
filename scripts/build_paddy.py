#!/usr/bin/env python3
"""Test the crop hypothesis: does NISAR HH rise only over rice?

  python3 scripts/build_paddy.py S2_CACHE_DIR       S2_CACHE_DIR comes from scripts/fetch_s2.py
                                                    needs numpy, scipy, pillow

Rice map: no public Punjab paddy map was reachable, so we classify from the Sentinel-2 crop calendar. Punjab rice is
fallow in early June, transplanted mid June to early July, green through September and harvested in October.
rice          bare in June, green in September, harvest-cleared by 25 October (NDVI fell by 0.15 or more)
otherSummer   bare in June, green in September, still standing on 25 October (cotton, cane, fodder, orchards)
perennial     already green in June (trees, cane, gardens): vegetation that is never flooded
barren        not green in September (built-up, bare, fallow)
This cannot separate rice from maize or early cotton, so it is a proxy and the numbers say "rice-like".
HH and HV per pixel come from the NISAR GCOV browse atlas already shipped with the site (R = HH, G = HV, 0..255).
Writes src/data/paddy.json and src/data/paddy.webp (the class map).
"""
import glob, json, os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, uniform_filter

HERE = os.path.dirname(__file__)
DATA = os.path.join(HERE, "..", "src", "data")
meta = json.load(open(os.path.join(DATA, "passes.json")))
COLS, T = meta["cols"], 512
dates = [p["date"] for p in meta["passes"]]
CACHE = sys.argv[1]
s2 = {os.path.basename(f)[:-4]: np.load(f) for f in glob.glob(os.path.join(CACHE, "*.npz"))}
nd = lambda d: s2[d]["ndvi"]


def classify():
    jun, sep = np.fmin(nd("2026-06-02"), nd("2026-06-17")), nd("2026-09-18")   # the two June scenes cover the same half of the plain
    feb, oct = nd("2026-02-25"), nd("2026-10-25")
    ok = np.isfinite(jun) & np.isfinite(sep) & np.isfinite(oct)
    water = np.nan_to_num(s2["2026-09-18"]["mndwi"], nan=-1) > 0.2
    summer = ok & (jun < 0.30) & (sep > 0.55) & ~water
    drop = sep - oct
    rice = summer & (drop >= 0.15)
    other = summer & (drop < 0.05)
    perennial = ok & (jun >= 0.45) & (sep > 0.55)
    barren = ok & (sep <= 0.35)
    return ok, rice, other, perennial, barren


def pass_stack():
    sheet = np.asarray(Image.open(os.path.join(DATA, "backscatter.webp")).convert("RGB"), np.float32)
    out = np.empty((len(dates), 2, T, T), np.float32)
    for i in range(len(dates)):
        r, c = divmod(i, COLS)
        out[i] = sheet[r * T:(r + 1) * T, c * T:(c + 1) * T, :2].transpose(2, 0, 1)
    return out


def cohen_d(a, b):
    return float((a.mean() - b.mean()) / np.sqrt((a.var() + b.var()) / 2))


def main():
    ok, rice, other, perennial, barren = classify()
    px = pass_stack()
    hh, hv = px[:, 0], px[:, 1]
    i_pre = [i for i, d in enumerate(dates) if d < "2026-07-01"]
    i_peak = [i for i, d in enumerate(dates) if "2026-08-20" <= d <= "2026-10-05"]
    i_post = [i for i, d in enumerate(dates) if d >= "2026-10-28"]
    wide = lambda x: x - gaussian_filter(x, 40)      # drop the scene-wide gradient (incidence angle, soil moisture)
    d_hh, d_hv = wide(hh[i_peak].mean(0) - hh[i_pre].mean(0)), wide(hv[i_peak].mean(0) - hv[i_pre].mean(0))
    f_hh = wide(hh[i_post].mean(0) - hh[i_peak].mean(0))      # change after the October harvest

    # only trust 260 m cells that are almost all one class: a 3 x 3 window of the same label
    pure = lambda m: m & (uniform_filter(m.astype(np.float32), 3) > 0.99)
    classes = {"rice": pure(rice), "otherSummer": pure(other), "perennial": pure(perennial), "barren": pure(barren)}
    classes = {k: m for k, m in classes.items() if m.sum() >= 30}      # a class with a handful of cells says nothing (otherSummer has 1)
    R = classes["rice"]
    mean = lambda x, m: round(float(x[m].mean()), 2) if m.any() else None

    series = {k: {"hh": [round(float(hh[i][m].mean()), 1) for i in range(len(dates))],
                  "hv": [round(float(hv[i][m].mean()), 1) for i in range(len(dates))]} for k, m in classes.items() if m.any()}
    stats = {k: {"cells": int(m.sum()), "riseHH": mean(d_hh, m), "riseHV": mean(d_hv, m), "afterHarvestHH": mean(f_hh, m),
                 "shareRisingOver10": round(float((d_hh[m] > 10).mean()), 2)} for k, m in classes.items()}
    d = {k: round(cohen_d(d_hh[R], d_hh[m]), 2) for k, m in classes.items() if k != "rice" and m.sum() > 30}
    dv = {k: round(cohen_d(d_hv[R], d_hv[m]), 2) for k, m in classes.items() if k != "rice" and m.sum() > 30}
    veg = nd("2026-09-18") - np.fmin(nd("2026-06-02"), nd("2026-06-17"))
    use = ok & np.isfinite(veg)
    top = ok & (d_hh > np.percentile(d_hh[ok], 75))
    rt = np.corrcoef(series["rice"]["hh"], series["rice"]["hv"])[0, 1]

    # dose-response inside rice-like cells: if HH tracks flooded, leafy paddy, greener September cells should rise more
    sep = nd("2026-09-18"); q = np.percentile(sep[R], [0, 20, 40, 60, 80, 100])
    dose = [{"ndvi": round(float(sep[R & (sep >= lo) & (sep <= hi)].mean()), 2), "riseHH": mean(d_hh, R & (sep >= lo) & (sep <= hi)),
             "riseHV": mean(d_hv, R & (sep >= lo) & (sep <= hi))} for lo, hi in zip(q[:-1], q[1:])]
    rr = round(float(np.corrcoef(sep[R], d_hh[R])[0, 1]), 2)

    out = {"s2dates": sorted(s2), "cells": int(ok.sum()), "riceShare": round(float(rice.sum() / ok.sum()), 3), "stats": stats, "series": series,
           "cohenD": {"hh": d, "hv": dv}, "dose": dose, "doseR": rr,
           "r": {"riseHHvsGreening": round(float(np.corrcoef(d_hh[use], veg[use])[0, 1]), 2),
                 "riseHVvsGreening": round(float(np.corrcoef(d_hv[use], veg[use])[0, 1]), 2), "riceHHvsHVOverTime": round(float(rt), 2)},
           "topQuartileRise": {"riceShare": round(float((top & rice).sum() / top.sum()), 2), "baseline": round(float(rice.sum() / ok.sum()), 3)}}
    json.dump(out, open(os.path.join(DATA, "paddy.json"), "w"), separators=(",", ":"), allow_nan=False)   # raises on NaN rather than shipping invalid JSON

    img = np.full((T, T, 3), 38, np.uint8)
    img[barren] = (90, 80, 96); img[perennial] = (96, 150, 110); img[other] = (216, 205, 170); img[rice] = (180, 20, 140)
    img[~ok] = (20, 12, 28)
    Image.fromarray(img).resize((256, 256), Image.NEAREST).save(os.path.join(DATA, "paddy.webp"), lossless=True)
    print(json.dumps({k: v for k, v in out.items() if k != "series"}, indent=1))


if __name__ == "__main__":
    main()
