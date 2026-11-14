#!/usr/bin/env python3
"""What the same ground motion would look like to an S-band radar. Projected from L-band, NOT S-band measurements.

  python3 scripts/build_sband.py            needs what build_motion.py needs
  python3 scripts/build_sband.py --selftest

Phase is 4 pi d / lambda, so a shorter wavelength turns the same displacement into more radians: x lambda_L / lambda_S.
We take the 21 real, unwrapped, de-ramped NISAR L-band pairs (same steps as build_motion.py), rescale their phase to S-band
and count neighbouring cells whose phase step would exceed pi, where a 2-D unwrapper can no longer tell a step from a wrap.
Decorrelation over crops, the thing that really separates the bands, is not in this: it needs S-band data.
Writes src/data/sband.json.
"""
import json, os, sys
import numpy as np
from PIL import Image
from skimage.restoration import unwrap_phase
import build_motion as bm

OUT = bm.OUT
LAMBDA_L = bm.LAMBDA_MM                   # 238 mm, same constant the motion layer uses
LAMBDA_S = 94.0                           # NISAR S-band, 3.2 GHz; ISRO's S-band channel spans a range, so this is a centre value
K = LAMBDA_L / LAMBDA_S                   # phase multiplier, L to S
MIN_COH = 0.5                             # unwrapping on near-noise cells is not a measurement
BINS = 16


def step_stats(phase_steps):
    """phase_steps: |neighbour phase difference| in L-band radians. Returns fractions that would alias at L and at S."""
    a = np.asarray(phase_steps)
    return float((a * 1 > np.pi).mean()), float((a * K > np.pi).mean())


def selftest():
    assert abs(LAMBDA_L / 2 - 119) < 1e-9 and abs(LAMBDA_S / 2 - 47) < 1e-9          # mm per fringe
    s = np.array([0.5, 1.0, 1.3, 2.0, 3.0])                                          # L-band steps in rad
    fl, fs = step_stats(s)
    assert fl == 0 and abs(fs - 0.6) < 1e-9, (fl, fs)                                 # 1.3, 2.0, 3.0 rad x 2.53 pass pi, 1.0 x 2.53 = 2.53 does not
    print("selftest ok: k %.2f, fringe %.0f mm L / %.0f mm S" % (K, LAMBDA_L / 2, LAMBDA_S / 2))


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest(); sys.exit()
    meta = json.load(open(os.path.join(OUT, "passes.json")))
    atlas = np.asarray(Image.open(os.path.join(OUT, "phase.webp")).convert("RGB"))
    T, cols = atlas.shape[1] // meta["cols"], meta["cols"]
    k = T // bm.N
    steps, per_pair = [], []
    for i, p in enumerate(meta["pairs"]):
        tile = atlas[(i // cols) * T:(i // cols + 1) * T, (i % cols) * T:(i % cols + 1) * T]
        phi, c = bm.multilook(bm.decode(tile), k)
        u = bm.deramp(unwrap_phase(phi), c) / bm.MM_PER_RAD                            # unwrapped L-band phase, rad
        s = []
        for d, m in ((np.diff(u, axis=0), np.minimum(c[1:], c[:-1])), (np.diff(u, axis=1), np.minimum(c[:, 1:], c[:, :-1]))):
            s.append(np.abs(d[m > MIN_COH]))
        s = np.concatenate(s); steps.append(s)
        per_pair.append(step_stats(s)[1])
    s = np.concatenate(steps)
    fl, fs = step_stats(s)
    hist = np.histogram(np.clip(s, 0, np.pi - 1e-6), bins=BINS, range=(0, np.pi))[0] / len(s)
    lat = (meta["roi"][1] + meta["roi"][3]) / 2
    cell_km = (meta["roi"][2] - meta["roi"][0]) * 111.32 * np.cos(np.radians(lat)) / bm.N
    out = {"pairs": len(steps), "steps": int(len(s)), "minCoherence": MIN_COH, "cellKm": round(float(cell_km), 2),
           "lambdaMm": {"L": LAMBDA_L, "S": LAMBDA_S}, "phaseMultiplier": round(K, 2),
           "mmPerRad": {"L": round(bm.MM_PER_RAD, 2), "S": round(LAMBDA_S / (4 * np.pi), 2)},
           "mmPerFringe": {"L": LAMBDA_L / 2, "S": LAMBDA_S / 2},
           "maxStepMm": {"L": LAMBDA_L / 4, "S": LAMBDA_S / 4},                       # largest displacement difference between neighbours before a step reads as a wrap
           "aliasFraction": {"L": round(fl, 4), "S": round(fs, 4)},
           "aliasFractionByPairS": {"min": round(min(per_pair), 3), "median": round(float(np.median(per_pair)), 3), "max": round(max(per_pair), 3)},
           "stepRadL": {"median": round(float(np.median(s)), 3), "p95": round(float(np.percentile(s, 95)), 3), "p999": round(float(np.percentile(s, 99.9)), 3), "max": round(float(s.max()), 3)},
           # shortcut: steps come from an unwrapper that already assumes |step| < pi, so aliasFraction can only undercount; headroom is the honest number
           "headroomS": round(float(np.pi / (s.max() * K)), 1),
           "maxGradientMmPerYr": {"L": round(LAMBDA_L / 4 / 12 * 365), "S": round(LAMBDA_S / 4 / 12 * 365)},   # one-cell step per 12-day pair, scaled to a year
           "stepMmL": {"median": round(float(np.median(s)) * bm.MM_PER_RAD, 1), "p95": round(float(np.percentile(s, 95)) * bm.MM_PER_RAD, 1)},
           "hist": [round(float(h), 4) for h in hist]}
    json.dump(out, open(os.path.join(OUT, "sband.json"), "w"), separators=(",", ":"))
    print(json.dumps({k: v for k, v in out.items() if k != "hist"}, indent=1))
