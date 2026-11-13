"""
Builds blender/saah.blend from nothing: NISAR to published proportions and the Punjab aquifer diorama,
then exports what the website loads (src/data/saah.glb, src/data/strata.webp).

    blender -b -P blender/build.py              # .blend + web assets
    blender -b -P blender/build.py -- --render  # also docs/render-hero.jpg and docs/render-nisar.jpg (Cycles)

Everything is procedural and seeded, so the file is reproducible. Wells and clay lenses use the same
random sequence as src/scene/Scene.tsx, so the render and the site show the same underground.
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector, noise
from mathutils.kdtree import KDTree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, 'blender', 'textures')
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
SIZE, DEPTH, CRUST = 4.0, 1.5, 0.09  # must match Scene.tsx
SAT_X, SAT_Y = 3.0, 2.35  # reflector centre, right of and above the block
SAT_SCALE = 0.12  # the satellite is drawn far larger than life next to a 134 km block
WATER_Y = -0.85  # water table in the still: low enough that shallow wells are dry and upper clay is squeezed

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
os.makedirs(TEX, exist_ok=True)


# ---------------------------------------------------------------- textures (numpy, tileable)

def lin(c):
    """sRGB display value -> scene linear."""
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)


def save(name, rgb, colorspace='sRGB'):
    """rgb: float (h, w, 3) in the file's own encoding, row 0 at the top."""
    h, w, _ = rgb.shape
    img = bpy.data.images.new(name, w, h, alpha=False)
    px = np.ones((h, w, 4), np.float32)
    px[..., :3] = np.clip(rgb[::-1], 0, 1)
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = os.path.join(TEX, name + '.png')
    img.file_format = 'PNG'
    img.save()
    img.colorspace_settings.name = colorspace
    img.pack()
    return img


def fbm(w, h, base, octaves, seed, aspect=1.0):
    """Value-noise fbm in 0..1 that wraps in both directions. `base` cells across the width."""
    rng = np.random.default_rng(seed)
    out, amp, tot = np.zeros((h, w)), 1.0, 0.0
    for o in range(octaves):
        nx = base * 2 ** o
        ny = max(1, round(nx * h / w * aspect))
        g = rng.random((ny, nx))
        ys, xs = np.arange(h) / h * ny, np.arange(w) / w * nx
        y0, x0 = np.floor(ys).astype(int), np.floor(xs).astype(int)
        fy, fx = ys - y0, xs - x0
        fy, fx = (fy * fy * (3 - 2 * fy))[:, None], fx * fx * (3 - 2 * fx)
        y1, x1 = (y0 + 1) % ny, (x0 + 1) % nx
        out += amp * ((g[y0][:, x0] * (1 - fx) + g[y0][:, x1] * fx) * (1 - fy) + (g[y1][:, x0] * (1 - fx) + g[y1][:, x1] * fx) * fy)
        tot += amp
        amp *= 0.5
    return out / tot


def tex_foil(n=512):
    """Crinkled multi-layer insulation: every Voronoi cell is a flat facet with its own tilt."""
    rng = np.random.default_rng(1)
    yy, xx = np.mgrid[0:n, 0:n] / n
    slope = np.zeros((n, n, 2))
    for cells, tilt in ((70, 0.5), (420, 0.28)):
        pts, tilts = rng.random((cells, 2)), rng.normal(0, tilt, (cells, 2))
        kd = KDTree(cells * 9)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for i, p in enumerate(pts):
                    kd.insert((p[0] + dx, p[1] + dy, 0), i)
        kd.balance()
        idx = np.fromiter((kd.find((x, y, 0))[1] for x, y in zip(xx.ravel(), yy.ravel())), int, n * n)
        slope += tilts[idx].reshape(n, n, 2)
    for _ in range(2):  # soften the creases by a pixel so they do not alias
        slope = (slope + np.roll(slope, 1, 0) + np.roll(slope, -1, 0) + np.roll(slope, 1, 1) + np.roll(slope, -1, 1)) / 5
    nrm = np.dstack([-slope[..., 0], -slope[..., 1], np.ones((n, n))])
    return nrm / np.linalg.norm(nrm, axis=2, keepdims=True) * 0.5 + 0.5


def tex_solar(n=512):
    rng = np.random.default_rng(2)
    img = np.full((n, n, 3), (0.5, 0.5, 0.54))
    cw, ch = n // 8, n // 4
    for j in range(4):
        for i in range(8):
            cell = img[j * ch + 2:(j + 1) * ch - 2, i * cw + 2:(i + 1) * cw - 2]
            cell[:] = np.array([0.03, 0.045, 0.13]) * (0.8 + 0.4 * rng.random())
            cell[:, cw // 3 - 2] = cell[:, 2 * cw // 3 - 2] = (0.42, 0.44, 0.5)  # busbars
    img[::3] *= 0.93  # collector fingers
    return img


LAYERS = [  # depth where the layer starts (0..1 of DEPTH), display colour
    (0.00, (0.22, 0.15, 0.10)),  # topsoil
    (0.045, (0.43, 0.31, 0.20)),  # loam
    (0.13, (0.76, 0.63, 0.43)),  # sand
    (0.27, (0.50, 0.45, 0.45)),  # clay
    (0.33, (0.80, 0.68, 0.48)),  # sand
    (0.50, (0.62, 0.52, 0.38)),  # silt
    (0.57, (0.58, 0.53, 0.46)),  # gravel
    (0.68, (0.74, 0.62, 0.44)),  # sand
    (0.84, (0.45, 0.42, 0.44)),  # clay
    (0.91, (0.36, 0.33, 0.33)),  # weathered rock
]


def tex_strata(w=2048, h=512):
    """The cut face of an alluvial aquifer. Wraps in u so it can run round all four walls."""
    rng = np.random.default_rng(3)
    v = np.linspace(0, 1, h)[:, None]
    vv = v + 0.085 * (fbm(w, h, 4, 4, 3) - 0.5) * np.minimum(v * 12, 1) + 0.012 * (fbm(w, h, 48, 3, 4) - 0.5)
    idx = np.clip(np.searchsorted([l[0] for l in LAYERS], vv, 'right') - 1, 0, len(LAYERS) - 1)
    col = np.array([l[1] for l in LAYERS])[idx]
    lam = fbm(w, h, 3, 5, 5, aspect=40)  # thin beds
    grain = rng.random((h, w))
    grain = (grain + np.roll(grain, 1, 1)) / 2
    shade = 0.74 + 0.34 * lam + 0.2 * (grain - 0.5) + 0.2 * (fbm(w, h, 6, 4, 6) - 0.5)
    pebbles = fbm(w, h, 520, 2, 7, aspect=0.6)
    gravel = (idx == 6) | (idx == 9)
    shade = np.where(gravel & (pebbles > 0.6), shade * 1.22, np.where(gravel & (pebbles < 0.4), shade * 0.8, shade))
    col = col * shade[..., None]
    return (col + np.roll(col, 1, 0) + np.roll(col, -1, 0)) / 3


def tex_rock(n=1024):
    base, fine, crack = fbm(n, n, 6, 7, 8), fbm(n, n, 96, 3, 10), np.abs(2 * fbm(n, n, 7, 6, 9) - 1)
    shade = (0.72 + 0.4 * base + 0.22 * (fine - 0.5)) * np.clip(0.72 + crack * 5, 0.72, 1)
    return np.array([0.4, 0.37, 0.37]) * shade[..., None]


T_FOIL = save('foil_normal', tex_foil(), 'Non-Color')
T_SOLAR = save('solar_cells', tex_solar())
T_STRATA = save('strata', tex_strata())
T_ROCK = save('rock', tex_rock())
T_RADAR = bpy.data.images.load(os.path.join(ROOT, 'src', 'data', 'backscatter.webp'))
T_RADAR.pack()


# ---------------------------------------------------------------- materials

def mat(name, color=(0.8, 0.8, 0.8), metallic=0.0, rough=0.5, tex=None, normal=None, alpha=1.0, cull=True, emit=0.0, backface_only=False, bump=0.0, glow=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out, b = nt.nodes.new('ShaderNodeOutputMaterial'), nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*lin(color), 1)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    b.inputs['Alpha'].default_value = alpha
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = tex
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if emit:  # data: show the image's own colours, lit by nothing
            nt.links.remove(b.inputs['Base Color'].links[0])
            b.inputs['Base Color'].default_value = (0, 0, 0, 1)
            nt.links.new(t.outputs['Color'], b.inputs['Emission Color'])
            b.inputs['Emission Strength'].default_value = emit
    if normal:
        t, nm = nt.nodes.new('ShaderNodeTexImage'), nt.nodes.new('ShaderNodeNormalMap')
        t.image = normal
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if glow:
        b.inputs['Emission Color'].default_value = (*lin(color), 1)
        b.inputs['Emission Strength'].default_value = glow
    if bump:  # render-only ripples, never exported
        n, bp = nt.nodes.new('ShaderNodeTexNoise'), nt.nodes.new('ShaderNodeBump')
        n.inputs['Scale'].default_value = 9
        bp.inputs['Strength'].default_value = bump
        nt.links.new(n.outputs['Fac'], bp.inputs['Height'])
        nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    if backface_only:
        # A wall the camera only sees from inside the block, so the near walls never hide the aquifer.
        # Light ignores it altogether, otherwise the block would be a closed, dark box.
        geo, path, both = nt.nodes.new('ShaderNodeNewGeometry'), nt.nodes.new('ShaderNodeLightPath'), nt.nodes.new('ShaderNodeMath')
        both.operation = 'MULTIPLY'
        nt.links.new(geo.outputs['Backfacing'], both.inputs[0])
        nt.links.new(path.outputs['Is Camera Ray'], both.inputs[1])
        nt.links.new(both.outputs[0], b.inputs['Alpha'])
    nt.links.new(b.outputs[0], out.inputs['Surface'])
    m.use_backface_culling = cull
    if alpha < 1 or backface_only:
        m.surface_render_method = 'BLENDED'
    return m


GOLD = mat('MLI gold foil', (1.0, 0.66, 0.2), 1.0, 0.24, normal=T_FOIL)
BLACK = mat('Black kapton', (0.035, 0.035, 0.04), 0.2, 0.45)
WHITE = mat('Radiator white', (0.93, 0.93, 0.9), 0.1, 0.3)
ALU = mat('Aluminium', (0.78, 0.79, 0.82), 1.0, 0.32)
CELLS = mat('Solar cells', metallic=0.0, rough=0.22, tex=T_SOLAR, cull=False)
PANEL = mat('Panel substrate', (0.1, 0.1, 0.11), 0.0, 0.6, cull=False)
TRUSS = mat('Carbon truss', (0.05, 0.05, 0.055), 0.3, 0.38)
NET = mat('Kevlar net', (0.34, 0.28, 0.2), 0.0, 0.6)
MESH = mat('Gold mesh reflector', (0.86, 0.7, 0.42), 0.85, 0.42, alpha=0.42, cull=False)
PATCH_L = mat('L-band patches', (0.9, 0.87, 0.78), 0.0, 0.5)
PATCH_S = mat('S-band patches', (0.86, 0.56, 0.24), 1.0, 0.35)
ROCK = mat('Bedrock', rough=0.92, tex=T_ROCK)
CLAY = mat('Clay', (0.6, 0.5, 0.48), 0.0, 0.85)
CLAY_SQUEEZED = mat('Clay squeezed', (0.36, 0.25, 0.3), 0.0, 0.9)
STRATA = mat('Aquifer wall', rough=0.95, tex=T_STRATA, cull=False, backface_only=True)
SOIL = mat('Topsoil', rough=0.95, tex=T_STRATA)
RADAR = mat('NISAR image', rough=0.35, tex=T_RADAR, emit=1.0)
WATER = mat('Groundwater', (0.42, 0.66, 0.95), 0.0, 0.03, alpha=0.2, cull=False, bump=0.1)
WELL_WET = mat('Well in water', (0.17, 0.4, 0.75), 0.7, 0.3)
WELL_DRY = mat('Well dry', (0.7, 0.67, 0.7), 0.7, 0.45)
BEAM = mat('Radar beam', (0.71, 0.08, 0.55), 0.0, 1.0, alpha=0.13, cull=False, glow=1.5)
FLOOR = mat('Studio floor', (0.87, 0.89, 0.86), 0.0, 0.9)


# ---------------------------------------------------------------- mesh helper

class Part:
    """One mesh built up from primitives, each tagged with a material and box-projected UVs."""

    def __init__(self, name):
        self.name, self.bm, self.mats = name, bmesh.new(), []
        self.uv = self.bm.loops.layers.uv.new('UVMap')

    def tag(self, faces, m, smooth=False, uv=1.0, planar=None):
        if m not in self.mats:
            self.mats.append(m)
        for f in faces:
            f.material_index, f.smooth = self.mats.index(m), smooth
            f.normal_update()
            a = max(range(3), key=lambda k: abs(f.normal[k]))
            for l in f.loops:
                c = l.vert.co
                if planar:
                    q = ((c - planar[0]).dot(planar[1]), (c - planar[0]).dot(planar[2]))
                else:
                    q = (c.y, c.z) if a == 0 else (c.x, c.z) if a == 1 else (c.x, c.y)
                l[self.uv].uv = (q[0] * uv, q[1] * uv)
        return faces

    def _made(self, r, m, **kw):
        return self.tag(list({f for v in r['verts'] for f in v.link_faces}), m, **kw)

    def box(self, size, loc, m, rot=Matrix(), **kw):
        return self._made(bmesh.ops.create_cube(self.bm, size=1, matrix=Matrix.Translation(loc) @ rot @ Matrix.Diagonal((*size, 1))), m, **kw)

    def cyl(self, r1, r2, depth, loc, m, rot=Matrix(), segs=16, caps=True, **kw):
        return self._made(bmesh.ops.create_cone(self.bm, cap_ends=caps, segments=segs, radius1=r1, radius2=r2, depth=depth, matrix=Matrix.Translation(loc) @ rot), m, smooth=True, **kw)

    def strut(self, a, b, r, m, segs=4):
        d = b - a
        return self.cyl(r, r, d.length, (a + b) / 2, m, d.to_track_quat('Z', 'Y').to_matrix().to_4x4(), segs, caps=False)

    def finish(self, collection):
        me = bpy.data.meshes.new(self.name)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me)
        collection.objects.link(ob)
        return ob


def collection(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c


def rot(deg, axis):
    return Matrix.Rotation(math.radians(deg), 4, axis)


# ---------------------------------------------------------------- NISAR, in metres

# Offset-fed paraboloid from the published numbers: 12 m aperture, F/D 0.75. The feed sits at the focus on top of
# the instrument structure, the reflector hangs above it, and the beam leaves along `AXIS`, 45° off the feed line,
# so the spacecraft stays out of its own beam. With those three numbers the boom comes out 8.3 m (published: ~9 m).
FOCAL, APERTURE, BAYS, RINGS, DRUM = 9.0, 12.0, 36, 6, 1.9
FEED = Vector((1.0, 0, 1.0))
S45 = math.sqrt(0.5)
AXIS, E1 = Vector((S45, 0, -S45)), Vector((S45, 0, S45))
OFFSET = 2 * FOCAL / (1 - Z.dot(AXIS)) * Z.dot(E1)


def dish(p, q):
    """Point of the reflector surface above aperture coordinates (p, q), |(p, q)| <= 6."""
    lateral = (OFFSET + p) * E1 + q * Y
    return FEED + lateral + (lateral.length_squared - 4 * FOCAL * FOCAL) / (4 * FOCAL) * AXIS


BEAM_ORIGIN = dish(0, 0)


def build_nisar(col):
    P = Part('NISAR')
    foil = dict(uv=0.55)

    # spacecraft bus (ISRO I3K) and what is bolted to it
    P.box((2.0, 1.8, 1.9), (-1.0, 0, 0), GOLD, **foil)
    for s in (1, -1):
        P.box((1.5, 0.03, 1.2), (-1.0, s * 0.91, -0.2), WHITE)
        P.box((0.5, 0.25, 0.4), (-1.55, s * 0.6, 1.05), GOLD, **foil)
        P.cyl(0.07, 0.07, 0.32, (-0.35, s * 0.55, 1.08), BLACK, rot(s * -28, 'X'), 10)  # star trackers
        for z in (0.8, -0.8):
            P.cyl(0.03, 0.08, 0.16, (-2.08, s * 0.75, z), BLACK, rot(90, 'Y'), 8)  # thrusters
    P.box((0.03, 1.3, 1.3), (-2.01, 0, 0), WHITE)
    P.cyl(0.74, 0.74, 0.2, (-2.1, 0, 0), ALU, rot(90, 'Y'), 28)  # launch adapter ring
    P.box((0.55, 0.55, 0.28), (-1.25, 0, 0.98), BLACK)  # boom root

    # radar instrument structure: an octagonal prism along +X with the feed on its top flat
    ris_len, ris_r = 3.2, 1.0
    flat = ris_r * math.cos(math.pi / 8)
    P.cyl(ris_r, ris_r, ris_len, (ris_len / 2, 0, 0), GOLD, rot(22.5, 'X') @ rot(90, 'Y'), 8, **foil)
    for f in P.bm.faces:
        f.smooth = False
    for k in (1, 2, 3, 5, 6, 7):  # radiators on six flats; top is the feed, bottom carries the antenna mast
        r = rot(-45 * k, 'X')
        for x in (0.6, 1.6, 2.6):
            P.box((0.9, 0.56, 0.03), Vector((x, 0, 0)) + (r @ Z) * (flat + 0.015), WHITE, r)
    P.cyl(0.8, 0.8, 0.4, (ris_len + 0.2, 0, 0), GOLD, rot(22.5, 'X') @ rot(90, 'Y'), 8, **foil)  # S-band electronics
    P.box((0.3, 0.9, 0.5), (ris_len + 0.5, 0, -0.1), GOLD, **foil)
    P.box((3.0, 0.84, 0.06), (1.6, 0, flat + 0.03), BLACK)  # feed aperture
    for i in range(12):  # 24 L-band patches, 12 per polarisation
        for y in (-0.31, -0.09):
            P.box((0.19, 0.19, 0.02), (1.6 + (i - 5.5) * 0.24, y, flat + 0.07), PATCH_L)
    for i in range(24):  # 48 S-band patches
        for y in (0.17, 0.29):
            P.box((0.085, 0.085, 0.02), (1.6 + (i - 11.5) * 0.12, y, flat + 0.07), PATCH_S)

    # Ka-band downlink dish on a short lattice mast under the instrument structure
    top, foot = Vector((1.0, 0, -flat)), Vector((1.0, 0, -2.3))
    for s in (1, -1):
        P.strut(top + Y * 0.16 * s, foot + Y * 0.16 * s, 0.022, ALU)
    for i in range(6):
        za, zb = top.z - i * 0.23, top.z - (i + 1) * 0.23
        s = 1 if i % 2 else -1
        P.strut(Vector((1.0, 0.16 * s, za)), Vector((1.0, -0.16 * s, zb)), 0.014, ALU, 3)
    P.cyl(0.42, 0.06, 0.16, foot - Z * 0.08, WHITE, segs=24)

    # solar arrays: two wings of three panels along the flight direction
    tilt = rot(-28, 'Y')
    wide, nrm = tilt @ X, tilt @ Z
    for s in (1, -1):
        root = Vector((-1.0, s * 0.9, 0.1))
        P.cyl(0.1, 0.1, 0.3, root + Y * s * 0.15, ALU, rot(90, 'X'), 12)
        for k in range(3):
            c = root + Y * s * (1.65 + k * 1.8)
            for f in P.box((2.2, 1.75, 0.035), c, PANEL, tilt):
                if f.normal.dot(nrm) > 0.9:
                    P.tag([f], CELLS, uv=1 / 0.55, planar=(c, wide, Y))
            for e in (0.75, -0.75):
                if k == 0:
                    P.strut(root + Y * s * 0.3, c - Y * s * 0.875 + wide * e, 0.03, ALU)  # yoke
                else:
                    P.cyl(0.04, 0.04, 0.22, c - Y * s * 0.9 + wide * e, ALU, tilt @ rot(90, 'Y'), 8)  # hinge

    # reflector nodes: ring m has 6m nodes, so the outer ring lands exactly on the 36 truss bays
    front = [[dish(0, 0)]] + [[dish(*(APERTURE / 2 * m / RINGS * Vector((math.cos(t), math.sin(t))))) for t in (2 * math.pi * j / (6 * m) for j in range(6 * m))] for m in range(1, RINGS + 1)]
    lo, hi = front[RINGS][BAYS // 2], front[RINGS][0]
    n = (hi - lo).normalized().cross(Y)  # rim plane normal, towards the feed
    n = -n if n.z > 0 else n
    # the rear net mirrors the front one inside the drum, as in an AstroMesh
    rear = [[x + (1.6 * (lo - x).dot(n) - DRUM) * n for x in ring] for ring in front]

    tris = []
    for m in range(RINGS):
        ni, no = max(6 * m, 1), 6 * (m + 1)
        for sector in range(6):
            for j in range(m + 1):
                o0, o1, i0 = (sector * (m + 1) + j) % no, (sector * (m + 1) + j + 1) % no, (sector * m + j) % ni
                tris.append(((m + 1, o0), (m + 1, o1), (m, i0)))
                if j < m:
                    tris.append(((m, i0), (m + 1, o1), (m, (sector * m + j + 1) % ni)))
    verts = {(m, j): P.bm.verts.new(x) for m, ring in enumerate(front) for j, x in enumerate(ring)}
    faces = [P.bm.faces.new([verts[k] for k in t]) for t in tris]
    bmesh.ops.recalc_face_normals(P.bm, faces=faces)
    P.tag(faces, MESH)
    for a, b in {tuple(sorted(e)) for t in tris for e in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0]))}:
        P.strut(front[a[0]][a[1]], front[b[0]][b[1]], 0.02, NET, 3)
        P.strut(rear[a[0]][a[1]], rear[b[0]][b[1]], 0.02, NET, 3)
    for m in range(RINGS):
        for j in range(len(front[m])):
            P.strut(front[m][j], rear[m][j], 0.012, NET, 3)  # tension ties

    # perimeter truss
    fr, rr = front[RINGS], rear[RINGS]
    for k in range(BAYS):
        k1 = (k + 1) % BAYS
        P.strut(fr[k], fr[k1], 0.055, TRUSS, 5)
        P.strut(rr[k], rr[k1], 0.055, TRUSS, 5)
        P.strut(fr[k], rr[k], 0.045, TRUSS, 5)
        P.strut(*((fr[k], rr[k1]) if k % 2 else (rr[k], fr[k1])), 0.03, TRUSS)
        for x in (fr[k], rr[k]):
            P.box((0.17, 0.17, 0.17), x, ALU)

    # boom: four hinged segments from the bus to the low side of the drum
    base, tip = Vector((-1.25, 0, 1.1)), (lo + rr[BAYS // 2]) / 2
    ctrl = (base + tip) / 2 + Vector((-0.6, 0, -0.25))
    pts = [(1 - t) ** 2 * base + 2 * t * (1 - t) * ctrl + t * t * tip for t in (0, 0.27, 0.54, 0.8, 1)]
    for a, b in zip(pts, pts[1:]):
        d = b - a
        P.box((0.21, 0.21, d.length - 0.12), (a + b) / 2, GOLD, d.to_track_quat('Z', 'Y').to_matrix().to_4x4(), **foil)
        P.box((0.3, 0.3, 0.3), b, BLACK, d.to_track_quat('Z', 'Y').to_matrix().to_4x4())
        P.cyl(0.13, 0.13, 0.4, b, ALU, rot(90, 'X'), 12)
    up = (pts[-1] - pts[-2]).normalized()
    P.strut(tip, tip + up * 0.5, 0.03, ALU)
    P.cyl(0.16, 0.16, 0.04, tip + up * 0.5, WHITE, up.to_track_quat('Z', 'Y').to_matrix().to_4x4(), 16)  # GPS antenna
    P.bm.transform(Matrix.Translation(-BEAM_ORIGIN))  # origin = centre of the reflector, where the beam leaves
    return P.finish(col)


# ---------------------------------------------------------------- the block of Punjab

def mulberry(seed):
    """Same generator as Scene.tsx."""
    M, s = 0xFFFFFFFF, [seed]

    def rand():
        s[0] = (s[0] + 0x6D2B79F5) & M
        t = s[0]
        t = ((t ^ (t >> 15)) * (t | 1)) & M
        t = ((t + (((t ^ (t >> 7)) * (t | 61)) & M)) & M) ^ t
        return ((t ^ (t >> 14)) & M) / 4294967296
    return rand


def perimeter_uv(P, faces):
    """u runs once round the block per 8 units, v is depth: the same mapping as the wall shader on the site."""
    h = SIZE / 2
    for f in faces:
        f.normal_update()
        nx, ny = round(f.normal.x), round(f.normal.y)
        for l in f.loops:
            c = l.vert.co
            s = c.x + h if ny > 0 else SIZE + h - c.y if nx > 0 else 2 * SIZE + h - c.x if ny < 0 else 3 * SIZE + h + c.y
            l[P.uv].uv = (s / 8, 1 + c.z / DEPTH)


def build_bedrock(col):
    P, thick = Part('Bedrock'), 0.38
    bmesh.ops.create_cube(P.bm, size=1, matrix=Matrix.Translation((0, 0, -DEPTH - thick / 2)) @ Matrix.Diagonal((SIZE, SIZE, thick, 1)))
    bmesh.ops.subdivide_edges(P.bm, edges=P.bm.edges[:], cuts=14, use_grid_fill=True)
    for v in P.bm.verts:
        d = min(1.0, max(0.0, (-DEPTH - v.co.z) / thick))  # 0 on the flat top, 1 at the underside
        if d:
            v.co.z -= d * (0.26 + 0.3 * noise.fractal(Vector((v.co.x, v.co.y, 0)) * 0.9, 1.0, 2.0, 4))
            k = 1 - d * (0.05 + 0.05 * noise.noise(v.co * 2.3))
            v.co.x *= k
            v.co.y *= k
    P.tag(P.bm.faces[:], ROCK, uv=0.6)
    return P.finish(col)


def build_lens(col):
    """One clay lens, 1 x 1 x 0.09. The site instances and squeezes it."""
    P = Part('ClayLens')
    bmesh.ops.create_icosphere(P.bm, subdivisions=3, radius=0.5)
    for v in P.bm.verts:
        r = 1 + 0.16 * noise.noise(v.co * 2.6) + 0.06 * noise.noise(v.co * 7)
        v.co = Vector((v.co.x * r, v.co.y * r, v.co.z * 0.09 * (1 + 0.5 * noise.noise(v.co * 3 + Vector((5, 0, 0))))))
    P.tag(P.bm.faces[:], CLAY, smooth=True)
    return P.finish(col)


def build_diorama(col, lens):
    # crust: the radar image on top of a thin slab of soil
    P = Part('Crust')
    faces = P.box((SIZE, SIZE, CRUST), (0, 0, -CRUST / 2), SOIL)
    perimeter_uv(P, [f for f in faces if abs(f.normal.z) < 0.5])
    top = [f for f in faces if f.normal.z > 0.5]
    P.tag(top, RADAR)
    tile = 19  # 17 Sept 2026, the monsoon peak
    for l in top[0].loops:  # atlas of 5 x 5 tiles, tile 0 top left, north up
        l[P.uv].uv = ((tile % 5 + l.vert.co.x / SIZE + 0.5) / 5, (4 - tile // 5 + l.vert.co.y / SIZE + 0.5) / 5)
    P.finish(col)

    P = Part('AquiferWalls')
    faces = [f for f in P.box((SIZE, SIZE, DEPTH), (0, 0, -DEPTH / 2), STRATA) if abs(f.normal.z) < 0.5]
    bmesh.ops.delete(P.bm, geom=[f for f in P.bm.faces if f not in faces], context='FACES')
    perimeter_uv(P, P.bm.faces[:])
    P.finish(col)

    P = Part('Groundwater')
    P.box((SIZE * 0.995, SIZE * 0.995, WATER_Y + DEPTH), (0, 0, (WATER_Y - DEPTH) / 2), WATER)
    P.finish(col)

    rand = mulberry(7)
    P = Part('Tubewells')
    for _ in range(260):
        length, x, z = 0.35 + rand() ** 1.6 * 0.95, (rand() - 0.5) * SIZE * 0.96, (rand() - 0.5) * SIZE * 0.96
        P.cyl(0.009, 0.009, length, (x, -z, -length / 2), WELL_WET if -length < WATER_Y else WELL_DRY, segs=6)
    P.finish(col)
    for i in range(12):
        w, d = 0.5 + rand() * 0.9, 0.5 + rand() * 0.9
        x, y, z = (rand() - 0.5) * (SIZE - w), -0.4 - rand() * 0.9, (rand() - 0.5) * (SIZE - d)
        squeezed = y > WATER_Y  # drained clay is squeezed flat and stays that way
        ob = bpy.data.objects.new(f'ClayLens.{i:02}', lens.data.copy() if squeezed else lens.data)
        if squeezed:
            ob.data.materials[0] = CLAY_SQUEEZED
        ob.location, ob.scale = (x, -z, y), (w, d, 0.4 if squeezed else 1)
        col.objects.link(ob)


def place_satellite(sat, col, along=1.2):
    """Where the site flies it: reflector centre right of and above the block, beam down onto the surface."""
    pos = Vector((SAT_X, -along, SAT_Y))
    aim = 45 - math.degrees(math.atan2(SAT_X, SAT_Y))  # swing the 45° beam axis onto the block's centre line
    sat.matrix_world = Matrix.Translation(pos) @ rot(180, 'Z') @ rot(aim, 'Y') @ Matrix.Scale(SAT_SCALE, 4)
    P = Part('RadarBeam')
    P.tag([P.bm.faces.new([P.bm.verts.new(v) for v in (pos, Vector((-SIZE / 2, -along, 0.004)), Vector((SIZE / 2, -along, 0.004)))])], BEAM)
    P.finish(col)


def studio(col):
    P = Part('Floor')
    P.box((300, 300, 0.1), (0, 0, -3.2), FLOOR)
    P.finish(col).is_shadow_catcher = True
    for name, kind, loc, aim, energy, size, tint in (
        ('Sun', 'SUN', (-7, -6, 10), (0, 0, 0), 2.6, math.radians(5), (1.0, 0.95, 0.88)),
        ('Softbox', 'AREA', (9, -9, 2.5), (0, 0, -0.6), 1700, 10, (0.95, 0.97, 1.0)),
        ('Rim', 'AREA', (4, 9, 6), (1.5, 0, 1.5), 600, 6, (1.0, 0.9, 0.8)),
    ):
        data = bpy.data.lights.new(name, kind)
        data.energy, data.color = energy, tint
        if kind == 'SUN':
            data.angle = size
        else:
            data.size = size
        ob = bpy.data.objects.new(name, data)
        ob.location = loc
        ob.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        col.objects.link(ob)
    world = bpy.data.worlds.new('Haze')
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    # the camera sees the site's flat haze; everything else is lit by a soft sky-to-ground gradient
    out, bg, ramp, sep, geo, path, mix = (nt.nodes.new(t) for t in ('ShaderNodeOutputWorld', 'ShaderNodeBackground', 'ShaderNodeValToRGB', 'ShaderNodeSeparateXYZ', 'ShaderNodeNewGeometry', 'ShaderNodeLightPath', 'ShaderNodeMix'))
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[1].position = 0.35, 0.75
    ramp.color_ramp.elements[0].color, ramp.color_ramp.elements[1].color = (*lin((0.5, 0.53, 0.53)), 1), (*lin((0.85, 0.89, 0.92)), 1)
    mapr = nt.nodes.new('ShaderNodeMapRange')
    mapr.inputs['From Min'].default_value = -1
    mix.data_type = 'RGBA'
    mix.inputs['B'].default_value = (*lin((0.894, 0.91, 0.89)), 1)
    nt.links.new(geo.outputs['Incoming'], sep.inputs[0])
    nt.links.new(sep.outputs['Z'], mapr.inputs['Value'])
    nt.links.new(mapr.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], mix.inputs['A'])
    nt.links.new(path.outputs['Is Camera Ray'], mix.inputs['Factor'])
    nt.links.new(mix.outputs['Result'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 1.0
    nt.links.new(bg.outputs[0], out.inputs[0])
    scene.world = world


def camera(name, eye, target, fov=28):
    data = bpy.data.cameras.new(name)
    data.sensor_fit, data.angle_y, data.clip_start, data.clip_end = 'VERTICAL', math.radians(fov), 0.1, 500
    ob = bpy.data.objects.new(name, data)
    ob.location = eye
    ob.rotation_euler = (Vector(target) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(ob)
    return ob


# ---------------------------------------------------------------- build, export, save

c_sat, c_block, c_studio = collection('NISAR'), collection('Punjab aquifer'), collection('Studio')
nisar, bedrock, lens = build_nisar(c_sat), build_bedrock(c_block), build_lens(c_block)

for ob in scene.objects:
    ob.select_set(ob in (nisar, bedrock, lens))
bpy.ops.export_scene.gltf(
    filepath=os.path.join(ROOT, 'src', 'data', 'saah.glb'), export_format='GLB', use_selection=True, export_yup=True,
    export_apply=True, export_image_format='WEBP', export_cameras=False, export_lights=False,
)
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.quality = 86
scene.view_settings.view_transform = 'Standard'
T_STRATA.save_render(os.path.join(ROOT, 'src', 'data', 'strata.webp'), scene=scene)

lens.hide_render = lens.hide_viewport = True  # the instances below are what you see
build_diorama(c_block, lens)
place_satellite(nisar, c_block)
studio(c_studio)
cam_hero = camera('Camera hero', (7.4, -10.4, 5.4), (0.75, 0, -0.25), 30)
cam_sat = camera('Camera NISAR', (7.0, -5.6, 2.3), (2.95, -1.2, 1.72), 22)
scene.camera = cam_hero

scene.render.engine = 'CYCLES'
scene.cycles.samples = 256
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality = 92
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'blender', 'saah.blend'), compress=True)
print('tris', {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in (nisar, bedrock, lens)})

if '--render' in ARGS or '--preview' in ARGS:
    try:  # GPU if there is one
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'OPTIX'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = 'GPU'
    except Exception as e:
        print('rendering on CPU:', e)
    if '--preview' in ARGS:
        scene.cycles.samples, scene.render.resolution_percentage = 48, 50
    for cam, out in ((cam_hero, 'render-hero'), (cam_sat, 'render-nisar')):
        scene.camera = cam
        scene.render.filepath = os.path.join(ARGS[ARGS.index('--out') + 1] if '--out' in ARGS else os.path.join(ROOT, 'docs'), out)
        bpy.ops.render.render(write_still=True)
