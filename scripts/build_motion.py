#!/usr/bin/env python3
"""Ground-motion layer from the 20 NISAR GUNW interferogram quicklooks (public, no login).

  python3 scripts/build_motion.py            needs numpy, scipy, scikit-image, matplotlib, Pillow
  python3 scripts/build_motion.py --selftest

The quicklooks are wrapped phase painted with matplotlib's cyclic `twilight` map, so the phase can be read back from the colour.
Steps, in MintPy's order, on what the quicklooks allow:
  1. colour -> wrapped phase (nearest point on the twilight curve), 4 x 4 multilook by complex mean (coherence = |mean|)
  2. 2-D unwrap each pair (skimage, Herraez), remove a best-fit plane (orbit + long-wavelength ionosphere/troposphere),
     reference to the median of the coherent pixels
  3. per pixel, weighted least squares of  d(t) = v t + a sin(wt) + b cos(wt)  straight onto the pair differences
     d(t2) - d(t1). No cumulative sum, so the gaps in the pair chain cost no bias.
  4. v = permanent trend (mm/yr), sqrt(a^2 + b^2) = seasonal, reversible amplitude (mm), peak = day of year of the maximum
Writes src/data/motion.webp (R trend, G seasonal amplitude, B quality, 128 x 128, lossless) and src/data/motion.json.

shortcuts, all stated on the site: no tropospheric (GACOS) or ionospheric split correction, since those need the GUNW HDF5 layers
and an Earthdata login; the sign convention of the quicklook phase is not documented, so the sign of v is not claimed.
"""
import json, os, sys
import numpy as np
from PIL import Image
from matplotlib import colormaps
from scipy.spatial import cKDTree
from skimage.restoration import unwrap_phase

OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data")
LAMBDA_MM = 238.0                      # NISAR L-band, 24 cm
MM_PER_RAD = LAMBDA_MM / (4 * np.pi)   # round-trip path, so one fringe (2 pi) is half a wavelength
N = 128
YEAR = 365.25


def decode(tile):
    """Wrapped phase in (-pi, pi] from a twilight-coloured tile."""
    lut = colormaps["twilight"](np.linspace(0, 1, 256))[:, :3]
    _, idx = cKDTree(lut).query(np.asarray(tile, np.float32).reshape(-1, 3) / 255)
    return (idx.reshape(tile.shape[:2]) / 255 * 2 * np.pi - np.pi)


def multilook(phi, k):
    z = np.exp(1j * phi)
    h = phi.shape[0] // k
    z = z[:h * k, :h * k].reshape(h, k, h, k).mean((1, 3))
    return np.angle(z), np.abs(z)


def deramp(u, coh):
    """Subtract the weighted best-fit plane, reference to the median of the coherent half."""
    y, x = np.mgrid[0:u.shape[0], 0:u.shape[1]] / u.shape[0]
    A = np.stack([np.ones(u.size), x.ravel(), y.ravel()], 1)
    w = coh.ravel() ** 2
    c = np.linalg.lstsq(A * w[:, None] ** .5, u.ravel() * w ** .5, rcond=None)[0]
    r = u - (A @ c).reshape(u.shape)
    return r - np.median(r[coh > np.median(coh)])


def invert(rows, days, coh):
    """rows: (P, n, n) mm per pair; days: (P, 2) acquisition days; coh: (P, n, n) weights. Returns v mm/yr, a, b mm, rms mm."""
    w0 = 2 * np.pi / YEAR
    t1, t2 = days[:, 0], days[:, 1]
    A = np.stack([(t2 - t1) / YEAR, np.sin(w0 * t2) - np.sin(w0 * t1), np.cos(w0 * t2) - np.cos(w0 * t1)], 1)   # (P, 3)
    W = coh ** 2
    AtWA = np.einsum("pi,pj,pyx->yxij", A, A, W)
    AtWy = np.einsum("pi,pyx,pyx->yxi", A, W, rows)
    m = np.linalg.solve(AtWA + 1e-9 * np.eye(3), AtWy[..., None])[..., 0]
    res = rows - np.einsum("pi,yxi->pyx", A, m)
    rms = np.sqrt((W * res ** 2).sum(0) / W.sum(0))
    return m[..., 0], m[..., 1], m[..., 2], rms


def selftest():
    rng = np.random.default_rng(1)
    days = np.array([[d, d + 12] for d in range(0, 340, 12) if d not in (96, 192, 264)], float)   # gaps like the real chain
    v, a, b = 20.0, 6.0, -4.0                                   # mm/yr, mm, mm
    d = lambda t: v * t / YEAR + a * np.sin(2 * np.pi * t / YEAR) + b * np.cos(2 * np.pi * t / YEAR)
    y = (d(days[:, 1]) - d(days[:, 0]))[:, None, None] + rng.normal(0, 0.5, (len(days), 4, 4))
    vv, aa, bb, _ = invert(y, days, np.ones_like(y))
    assert abs(vv.mean() - v) < 2.5 and abs(aa.mean() - a) < 1.5 and abs(bb.mean() + 4) < 1.5, (vv.mean(), aa.mean(), bb.mean())
    ph = np.add.outer(np.linspace(-9, 9, 64), np.linspace(-6, 6, 64))                           # ramp with several fringes
    wrapped = decode((colormaps["twilight"]((np.angle(np.exp(1j * ph)) + np.pi) / (2 * np.pi))[..., :3] * 255).astype(np.uint8))
    err = np.abs(np.angle(np.exp(1j * (wrapped - np.angle(np.exp(1j * ph))))))
    assert err.max() < 0.1, err.max()                           # colour -> phase round trip, within 256-level quantisation
    print("selftest ok: v %.1f a %.1f b %.1f, colour round trip %.3f rad" % (vv.mean(), aa.mean(), bb.mean(), err.max()))


def day(iso):
    return (np.datetime64(iso) - np.datetime64("2026-01-01")).astype(int)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest(); sys.exit()
    meta = json.load(open(os.path.join(OUT, "passes.json")))
    atlas = np.asarray(Image.open(os.path.join(OUT, "phase.webp")).convert("RGB"))
    T, cols = atlas.shape[1] // meta["cols"], meta["cols"]
    k = T // N
    rows, coh, days = [], [], []
    for i, p in enumerate(meta["pairs"]):
        tile = atlas[(i // cols) * T:(i // cols + 1) * T, (i % cols) * T:(i % cols + 1) * T]
        phi, c = multilook(decode(tile), k)
        u = unwrap_phase(phi)
        rows.append(deramp(u, c) * MM_PER_RAD); coh.append(c); days.append([day(p["ref"]), day(p["sec"])])
    rows, coh, days = np.array(rows), np.array(coh), np.array(days, float)
    v, a, b, rms = invert(rows, days, coh)
    amp = np.hypot(a, b)
    peak = (np.degrees(np.arctan2(a, b)) / 360 * YEAR) % YEAR            # day of year of the sine maximum
    quality = coh.mean(0)
    print("pairs %d | trend median %.1f mm/yr, p5..p95 %.1f..%.1f | seasonal median %.1f mm, p95 %.1f | residual rms median %.1f mm | coherence %.2f"
          % (len(rows), np.median(v), *np.percentile(v, [5, 95]), np.median(amp), np.percentile(amp, 95), np.median(rms), quality.mean()))
    VR, AR = 60.0, 30.0                                                      # encoded ranges: trend +-60 mm/yr, seasonal 0..30 mm
    img = np.stack([(np.clip(v / VR, -1, 1) * .5 + .5) * 255, np.clip(amp / AR, 0, 1) * 255, np.clip(quality, 0, 1) * 255], -1).astype(np.uint8)
    Image.fromarray(img).save(os.path.join(OUT, "motion.webp"), lossless=True)
    json.dump({"n": N, "trendRange": VR, "ampRange": AR, "pairs": len(rows), "mmPerRad": round(MM_PER_RAD, 2),
               "trendMedian": round(float(np.median(v)), 2), "trendP5": round(float(np.percentile(v, 5)), 1), "trendP95": round(float(np.percentile(v, 95)), 1),
               "ampMedian": round(float(np.median(amp)), 2), "ampP95": round(float(np.percentile(amp, 95)), 1),
               "noiseMm": round(float(np.median(rms)), 2), "coherence": round(float(quality.mean()), 2),
               "peakDoy": round(float(np.median(peak[amp > np.percentile(amp, 75)])))},
              open(os.path.join(OUT, "motion.json"), "w"), separators=(",", ":"))
