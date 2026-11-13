#!/usr/bin/env python3
"""Build the site's texture atlases from public NISAR browse quicklooks (ASF DAAC).

  python3 scripts/build_data.py [cache_dir]

No login needed: the ASF search API and the browse PNGs are public. Needs Pillow only.
These are 8-bit quicklooks, not calibrated science data; the site says so wherever they appear.
"""
import json, os, re, sys, urllib.request
from PIL import Image

API = "https://api.daac.asf.alaska.edu/services/search/param?dataset=NISAR&output=jsonlite&maxResults=250"
TRACK, FRAME = 156, 17                    # ascending pass over central Punjab
POINT = "POINT(76.0+30.3)"
ROI = (75.20, 29.95, 76.60, 31.15)        # lon0, lat0, lon1, lat1: Malwa plain, inside every pass (asserted below)
TILE, COLS = 512, 5
RANK = {"V1": 3, "PROVISIONAL_V1": 2, "BETA_V1": 1}   # prefer validated > provisional > beta
CACHE = sys.argv[1] if len(sys.argv) > 1 else ".cache/nisar"
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data")
S = 8                                     # mask cell size, px
SKIP = {"2026-07-07": "partial acquisition, edge of swath cuts the area",
        "2026-09-05": "quicklook is smeared, unlike every other pass"}
Image.MAX_IMAGE_PIXELS = None


def search(level):
    url = f"{API}&processingLevel={level}&relativeOrbit={TRACK}&intersectsWith={POINT}"
    rows = json.load(urllib.request.urlopen(url, timeout=90))["results"]
    best = {}
    for r in rows:
        if r.get("frame") != FRAME:
            continue
        date = r["startTime"][:10]
        rank = RANK.get(r["collectionName"].split(level + "_")[-1], 0)
        if date not in best or rank > best[date][0]:
            best[date] = (rank, r)
    return [best[d][1] for d in sorted(best)]


def fetch(row, kind):
    path = os.path.join(CACHE, f"{kind}{TRACK}", row["startTime"][:10] + ".png")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        url = next(u for u in row["browse"] if u.endswith("_LATLON.png"))
        urllib.request.urlretrieve(url, path)
    return Image.open(path)


def mask(im):
    """Coarse grid of cells that hold data (nodata is black in GCOV, transparent in GUNW)."""
    m = im.getchannel("A") if im.mode == "RGBA" else im.convert("L")
    m = m.resize((im.width // S, im.height // S), Image.BOX)
    w, h = m.size
    px = m.load()
    return [[px[x, y] > 0 for x in range(w)] for y in range(h)]


def corners(m, wkt):
    """Pair the 4 corners of the data footprint (pixels) with the 4 corners of the frame polygon (degrees)."""
    h, w = len(m), len(m[0])
    cols = [x for x in range(w) if any(m[y][x] for y in range(h))]
    rows = [y for y in range(h) if any(m[y])]
    mean = lambda v: sum(v) / len(v)
    west = (cols[0] * S, mean([y for y in range(h) if m[y][cols[0]]]) * S)
    east = ((cols[-1] + 1) * S, mean([y for y in range(h) if m[y][cols[-1]]]) * S)
    north = (mean([x for x in range(w) if m[rows[0]][x]]) * S, rows[0] * S)
    south = (mean([x for x in range(w) if m[rows[-1]][x]]) * S, (rows[-1] + 1) * S)
    nums = list(map(float, re.findall(r"-?\d+\.\d+", wkt)))
    pts = list(zip(nums[0::2], nums[1::2]))[:4]
    geo = [min(pts), max(pts, key=lambda p: p[1]), max(pts), min(pts, key=lambda p: p[1])]
    return list(zip([west, north, east, south], geo))


def fit(xs, ys):
    """Least-squares line y = a + b x."""
    n, mx, my = len(xs), sum(xs) / len(xs), sum(ys) / len(ys)
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    return my - b * mx, b


def load(level, kind):
    """Images of one product type share a fixed pixel grid, so one geotransform fits them all:
    regress pixel position on longitude and latitude over every footprint corner of every date."""
    rows = search(level)
    ims = [fetch(r, kind) for r in rows]
    masks = [mask(im) for im in ims]
    area = [sum(map(sum, m)) for m in masks]
    keep = [i for i in range(len(rows)) if area[i] > 0.9 * max(area) and rows[i]["startTime"][:10] not in SKIP]
    pairs = [c for i in keep for c in corners(masks[i], rows[i]["wkt"])]
    ax, bx = fit([g[0] for _, g in pairs], [p[0] for p, _ in pairs])       # x = ax + bx * lon
    ay, by = fit([g[1] for _, g in pairs], [p[1] for p, _ in pairs])       # y = ay + by * lat
    rms = (sum((ax + bx * g[0] - p[0]) ** 2 + (ay + by * g[1] - p[1]) ** 2 for p, g in pairs) / len(pairs)) ** 0.5
    box = tuple(round(v) for v in (ax + bx * ROI[0], ay + by * ROI[3], ax + bx * ROI[2], ay + by * ROI[1]))
    print(f"{level}: {len(keep)} images, {1 / bx * 111.32 * 0.86:.3f} km/px, corner fit rms {rms:.1f} px, crop {box}")
    for i in keep:                                                          # ROI must hold data on every date
        c = [masks[i][y][x] for y in range(box[1] // S, box[3] // S) for x in range(box[0] // S, box[2] // S)]
        assert all(c), f"ROI leaves the footprint on {rows[i]['startTime'][:10]} ({sum(c) / len(c):.1%} valid)"
    return [(rows[i], ims[i].crop(box)) for i in keep]


def atlas(tiles, name, quality):
    rows = -(-len(tiles) // COLS)
    sheet = Image.new("RGB", (COLS * TILE, rows * TILE))
    for i, t in enumerate(tiles):
        sheet.paste(t.convert("RGB").resize((TILE, TILE), Image.LANCZOS), (i % COLS * TILE, i // COLS * TILE))
    sheet.save(os.path.join(OUT, name), quality=quality, method=6)
    return rows


passes, tiles = [], []
for row, t in load("GCOV", "gcov"):
    hh, hv = (sum(t.getchannel(c).histogram()[v] * v for v in range(256)) / (t.width * t.height) for c in "RG")
    passes.append({"date": row["startTime"][:10], "time": row["startTime"][11:16], "granule": row["granuleName"],
                   "tier": row["collectionName"], "hh": round(hh, 1), "hv": round(hv, 1), "pair": -1})
    tiles.append(t)                        # browse composite is R=HH, G=HV, B=HH
assert len(passes) >= 20, "expected a year of passes"
rows = atlas(tiles, "backscatter.webp", 62)

pairs, ptiles = [], []
index = {p["date"]: i for i, p in enumerate(passes)}
for row, t in load("GUNW", "gunw"):
    ref, sec = (f"{d[:4]}-{d[4:6]}-{d[6:8]}" for d in re.findall(r"(\d{8})T\d{6}", row["granuleName"])[0::2][:2])
    if ref not in index:
        continue
    passes[index[ref]]["pair"] = len(pairs)
    pairs.append({"ref": ref, "sec": sec, "granule": row["granuleName"], "tier": row["collectionName"]})
    ptiles.append(t)
prows = atlas(ptiles, "phase.webp", 70)

json.dump({"track": TRACK, "frame": FRAME, "roi": ROI, "skipped": SKIP, "cols": COLS, "rows": rows, "pairRows": prows,
           "passes": passes, "pairs": pairs}, open(os.path.join(OUT, "passes.json"), "w"), separators=(",", ":"))
print(len(passes), "passes,", len(pairs), "pairs")
