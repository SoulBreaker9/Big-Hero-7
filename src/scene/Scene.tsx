import { AdaptiveDpr, AdaptiveEvents, Environment, Lightformer, PerformanceMonitor, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import backUrl from '../data/backscatter.webp'
import phaseUrl from '../data/phase.webp'
import motionUrl from '../data/motion.webp'
import modelUrl from '../data/saah.glb?url'
import strataUrl from '../data/strata.webp'
import { LAST, N, pairs, pick, useStore } from '../store'

// The satellite, bedrock, clay lens and strata texture are made by blender/build.py. These must match it.
const SIZE = 4 // the 134 km scene, in scene units
const DEPTH = 1.5 // drawn depth of the underground section (illustration, not to scale)
const CRUST = 0.09 // thickness of the soil slab that carries the radar image
const SINK = 0.16 // how far the surface drops when the clay is fully squeezed (exaggerated)
const SAT = [3.0, 2.35] // centre of NISAR's reflector, right of and above the block
const SAT_SCALE = 0.12 // scene units per metre: far larger than life next to a 134 km block

// One camera/underground state per story section. The block alternates sides, always opposite the text panel (see data-side in App).
// azimuth°, polar°, distance, water table y, layer, sink, breath, x offset (share of width, negative = block on the right), look-at y
const K = [
  [35, 60, 16.5, -0.3, 0, 0, 0.25, -0.2, -0.55], // hero: block right
  [-28, 76, 13.5, -0.98, 0, 0, 0, 0.2, -0.75], // overdraft: block left, closer, water falls
  [24, 82, 11.5, -1.08, 0, 1, 0, -0.2, -0.7], // sand and clay: block right, closest
  [34, 40, 15.5, -1.08, 1, 1, 0, 0.27, -0.55], // blind spot: interferograms on top
  [0, 26, 15, -1.08, 0, 1, 0, -0.2, -0.55], // the year: block right
  [-38, 70, 16.5, -0.7, 0, 0.5, 1, 0.2, -0.55], // the test: block left, breathing
  [0, 2, 14, -0.7, 0, 0.5, 0, -0.2, -0.55], // explorer: straight down, block right
]
const INTRO = [80, 34, 34, -0.3, 0, 0, 0.25, -0.2, -0.55] // where the camera waits behind the loader

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = window.matchMedia('(pointer: coarse)').matches
const stats = new URLSearchParams(location.search).has('stats')
const ramp = (t: number) => t * t * (3 - 2 * t)

// the loader reads these: the code has arrived, and how much of the model and images has been fetched
// (total grows as the glTF's embedded textures are found, so the share can dip; Loader never counts backwards)
useStore.setState({ chunk: true })
THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => useStore.setState({ load: loaded / total })
const smooth = (t: number) => { const x = Math.min(Math.max((t - 0.25) / 0.5, 0), 1); return x * x * (3 - 2 * x) }
// custom shaders write display values straight through, so their colours are plain sRGB triplets
const rgb = (hex: number) => new THREE.Vector3((hex >> 16) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255)
const INK = 0x2a1533, MOON = 0xf1ecf3, WATER = 0x2c6fc4, PADDY = 0xb4148c, CLAY = 0x9d8076, SQUEEZED = 0x5c3f4d, STEEL = 0xb9b4bb
const INK_C = new THREE.Color(INK), MOON_C = new THREE.Color(MOON)

// one sun and a sky for everything drawn by hand, matching the studio the satellite is lit in
const lit = /* glsl */ `
const vec3 SUN = vec3(-0.42, 0.72, 0.55);
vec3 lit(vec3 albedo, vec3 n) { return albedo * (0.5 + 0.22 * n.y + 0.5 * max(dot(n, SUN), 0.0)); }`

const instVert = /* glsl */ `
uniform float uWater;
varying float vK; varying float vY; varying vec3 vN;
void main() {
  vec3 p = position, n = normal;
  vec3 s = vec3(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz), dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz));
  #ifdef CLAY
    // a lens the water table has dropped below gets squeezed, and stays squeezed
    vK = smoothstep(0.0, 0.15, instanceMatrix[3].y - uWater);
    float k = mix(1.0, 0.4, vK);
    p.y *= k; s.y *= k * k;
  #else
    // a well is dry once its foot is above the water table
    vK = step(uWater, -sqrt(s.y));
  #endif
  vY = p.y * sqrt(s.y);
  vN = normalize(mat3(instanceMatrix) * (n / s));
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}`
const instFrag = /* glsl */ `
uniform vec3 uA, uB; uniform float uWater;
varying float vK; varying float vY; varying vec3 vN;
${lit}
void main() {
  vec3 col = mix(uA, uB, vK);
  #ifndef CLAY
    col *= 1.0 + 0.35 * (1.0 - vK) * step(vY, uWater); // the stretch of pipe standing in water
  #endif
  gl_FragColor = vec4(lit(col, vN), 1.0);
}`

// u runs once round the block per 8 units, v is depth: the same mapping as perimeter_uv() in build.py
const strata = /* glsl */ `
uniform sampler2D uStrata;
vec3 strata(vec3 p, vec3 n) {
  float s = n.z < -0.5 ? p.x + 2.0 : n.x > 0.5 ? 6.0 + p.z : n.z > 0.5 ? 10.0 - p.x : 14.0 - p.z;
  return texture2D(uStrata, vec2(s / 8.0, 1.0 + p.y / ${DEPTH.toFixed(1)})).rgb;
}`

const slabVert = /* glsl */ `
varying vec3 vP; varying vec3 vN;
void main() { vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const slabFrag = /* glsl */ `
uniform sampler2D uBack, uPhase, uMotion;
uniform float uPass, uPair, uLayer, uKind, uScan;
uniform vec2 uPin, uHover;
varying vec3 vP; varying vec3 vN;
${lit}${strata}
// the third layer: R permanent trend (mm/yr, +-60), G seasonal amplitude (0 to 30 mm), B how well the pairs agree
vec3 motion(vec2 uv) {
  vec3 m = texture2D(uMotion, clamp(uv, 0.002, 0.998)).rgb;
  vec3 mid = vec3(0.93, 0.9, 0.94), down = vec3(0.71, 0.08, 0.55), up = vec3(0.17, 0.44, 0.77);
  float t = m.r * 2.0 - 1.0; // sinking is magenta, rising is blue
  vec3 trend = mix(mid, t < 0.0 ? down : up, pow(abs(t), 0.7));
  vec3 season = mix(vec3(0.95, 0.93, 0.9), vec3(0.1, 0.55, 0.45), smoothstep(0.0, 0.8, m.g)); // flat is pale, strong breathing is green
  return mix(vec3(0.5), mix(trend, season, uKind), 0.35 + 0.65 * smoothstep(0.3, 0.9, m.b)); // greyed where the radar lost track
}
vec3 tile(sampler2D t, float i, vec2 uv) {
  uv = clamp(uv, 0.002, 0.998); // stay off the neighbouring tile
  return texture2D(t, vec2((mod(i, 5.0) + uv.x) / 5.0, (4.0 - floor(i / 5.0) + uv.y) / 5.0)).rgb;
}
void main() {
  if (vN.y < -0.5) { gl_FragColor = vec4(0.13, 0.09, 0.07, 1.0); return; }
  if (vN.y < 0.5) { gl_FragColor = vec4(lit(strata(vP, vN), vN), 1.0); return; } // the soil the image sits on
  vec2 uv = vec2(vP.x / ${SIZE}.0 + 0.5, 0.5 - vP.z / ${SIZE}.0); // north is -z
  float a = floor(uPass), b = floor(uPair);
  vec3 back = mix(tile(uBack, a, uv), tile(uBack, min(a + 1.0, ${LAST}.0), uv), fract(uPass));
  vec3 phase = mix(tile(uPhase, b, uv), tile(uPhase, min(b + 1.0, ${pairs.length - 1}.0), uv), fract(uPair));
  vec3 col = uLayer > 1.0 ? mix(phase, motion(uv), uLayer - 1.0) : mix(back, phase, uLayer);
  float d = uv.y - uScan; // the radar's footprint passing over, with the strip it has just imaged still glowing
  col += smoothstep(0.012, 0.0, abs(d)) * 0.5 + vec3(0.71, 0.08, 0.55) * 0.22 * smoothstep(0.14, 0.0, -d) * step(d, 0.0);
  col = mix(col, vec3(1.0), smoothstep(0.004, 0.0, abs(distance(uv, uPin) - 0.02)));
  vec2 h = abs(uv - uHover);
  col = mix(col, vec3(1.0), 0.55 * max(smoothstep(0.002, 0.0, h.x), smoothstep(0.002, 0.0, h.y)));
  gl_FragColor = vec4(col, 1.0);
}`

// The cut faces of the aquifer. Drawn back-side only, so you always look past the near walls into the block.
const wallFrag = /* glsl */ `
uniform float uWater, uTop;
varying vec3 vP; varying vec3 vN;
${lit}${strata}
void main() {
  if (abs(vN.y) > 0.5 || vP.y > uTop) discard; // no lid, no floor, and the walls shorten as the ground sinks
  vec3 col = lit(strata(vP, vN), -vN) * (0.7 + 0.25 * smoothstep(0.0, 0.3, uTop - vP.y)); // darker up under the crust
  float wet = smoothstep(0.03, -0.03, vP.y - uWater); // saturated sediment is darker
  col = mix(col, col * vec3(0.6, 0.7, 0.86), wet);
  col += vec3(0.35, 0.55, 0.8) * 0.5 * smoothstep(0.014, 0.0, abs(vP.y - uWater)); // the water table itself
  gl_FragColor = vec4(col, 1.0);
}`

const waterVert = /* glsl */ `
varying vec3 vW; varying vec3 vN;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`
const waterFrag = /* glsl */ `
uniform vec3 uA; uniform float uT, uLevel;
varying vec3 vW; varying vec3 vN;
void main() {
  vec3 v = normalize(cameraPosition - vW);
  if (vN.y < 0.5) { // the side of the water body: deeper is denser
    float deep = clamp((uLevel - vW.y) / 1.1, 0.0, 1.0);
    gl_FragColor = vec4(mix(uA * 1.25, uA * 0.8, deep), mix(0.2, 0.4, deep));
    return;
  }
  vec2 q = vW.xz * 2.6; // the water table: slow ripples, sky reflection, a glint of sun
  vec3 n = normalize(vec3(0.05 * sin(q.x * 2.1 + uT * 1.3) + 0.035 * sin((q.x + q.y) * 3.7 - uT * 1.7), 1.0, 0.05 * cos(q.y * 2.6 - uT * 1.1) + 0.035 * sin((q.x - q.y) * 4.3 + uT * 1.9)));
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 r = reflect(-v, n);
  vec3 sky = mix(vec3(0.72, 0.8, 0.9), vec3(1.0), smoothstep(0.0, 0.9, r.y));
  float glint = pow(max(dot(r, normalize(vec3(-0.42, 0.72, 0.55))), 0.0), 90.0);
  gl_FragColor = vec4(mix(uA * 1.1, sky, 0.18 + 0.7 * fresnel) + glint, 0.6 + 0.35 * fresnel);
}`

const beamVert = /* glsl */ `varying float vT; void main() { vT = -position.y / ${SAT[1].toFixed(2)}; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const beamFrag = /* glsl */ `
uniform vec3 uA; uniform float uT, uOn;
varying float vT;
void main() {
  float pulse = smoothstep(0.75, 1.0, sin(vT * 26.0 - uT * 5.0)); // chirps running down to the ground
  gl_FragColor = vec4(uA, uOn * (0.05 + 0.1 * vT) * (1.0 + 1.4 * pulse));
}`

const shadowFrag = /* glsl */ `
uniform vec3 uA; uniform float uOn; varying vec3 vP;
void main() { gl_FragColor = vec4(uA, uOn * 0.3 * smoothstep(1.0, 0.25, length(vP.xy) / 3.6)); }`

/** Seeded so the illustration is the same on every load. blender/build.py runs the same sequence. */
function mulberry(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function World() {
  const [back, phase, motion, strataTex] = useLoader(THREE.TextureLoader, [backUrl, phaseUrl, motionUrl, strataUrl])
  const { nodes } = useGLTF(modelUrl, false, false) as unknown as { nodes: Record<'NISAR' | 'Bedrock' | 'ClayLens', THREE.Mesh> }
  const { camera, invalidate, size, gl } = useThree()
  const regress = useThree((s) => s.performance.regress)
  const slab = useRef<THREE.Group>(null!)
  const water = useRef<THREE.Mesh>(null!)
  const sat = useRef<THREE.Group>(null!)
  const cur = useRef({ k: [...INTRO], pass: 0, pair: 0, t: 0, frames: 0, intro: 0, night: 1, px: 0, py: 0 })
  const pointer = useRef([0, 0])

  // geometries and materials are built once and shared
  const g = useMemo(() => {
    for (const t of [back, phase, motion]) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter } // an atlas would bleed across tiles in its mips
    strataTex.wrapS = THREE.RepeatWrapping
    const shader = (vertexShader: string, fragmentShader: string, uniforms: Record<string, unknown>, rest: THREE.ShaderMaterialParameters = {}) =>
      new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: Object.fromEntries(Object.entries(uniforms).map(([k, value]) => [k, { value }])), ...rest })
    const rand = mulberry(7)
    const wells = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.009, 0.009, 1, 6, 1, true).translate(0, -0.5, 0),
      shader(instVert, instFrag, { uWater: 0, uA: rgb(WATER), uB: rgb(STEEL) }),
      260,
    )
    const m = new THREE.Matrix4()
    for (let i = 0; i < wells.count; i++)
      wells.setMatrixAt(i, m.makeScale(1, 0.35 + rand() ** 1.6 * 0.95, 1).setPosition((rand() - 0.5) * SIZE * 0.96, 0, (rand() - 0.5) * SIZE * 0.96))
    const clay = new THREE.InstancedMesh(nodes.ClayLens.geometry, shader(instVert, instFrag, { uWater: 0, uA: rgb(CLAY), uB: rgb(SQUEEZED) }, { defines: { CLAY: '' } }), 12)
    for (let i = 0; i < clay.count; i++) {
      const w = 0.5 + rand() * 0.9, d = 0.5 + rand() * 0.9
      clay.setMatrixAt(i, m.makeScale(w, 1, d).setPosition((rand() - 0.5) * (SIZE - w), -0.4 - rand() * 0.9, (rand() - 0.5) * (SIZE - d)))
    }
    const ink = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.4, toneMapped: false })
    return {
      wells, clay,
      slabGeo: new THREE.BoxGeometry(SIZE, CRUST, SIZE).translate(0, -CRUST / 2, 0),
      slabMat: shader(slabVert, slabFrag, { uBack: back, uPhase: phase, uMotion: motion, uStrata: strataTex, uPass: 0, uPair: 0, uLayer: 0, uKind: 0, uScan: -1, uPin: new THREE.Vector2(-9, -9), uHover: new THREE.Vector2(-9, -9) }),
      wallGeo: new THREE.BoxGeometry(SIZE, DEPTH, SIZE).translate(0, -DEPTH / 2, 0),
      wallMat: shader(slabVert, wallFrag, { uStrata: strataTex, uWater: 0, uTop: 0 }, { side: THREE.BackSide }),
      // the fixed outline is the ground level before pumping, so the sinking slab leaves a visible gap under it
      frame: new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE, DEPTH, SIZE).translate(0, -DEPTH / 2, 0)), ink),
      waterGeo: new THREE.BoxGeometry(SIZE * 0.995, 1, SIZE * 0.995).translate(0, -0.5, 0),
      waterMat: shader(waterVert, waterFrag, { uA: rgb(WATER), uT: 0, uLevel: 0 }, { transparent: true, depthWrite: false }),
      beamGeo: new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, -SIZE / 2 - SAT[0], -SAT[1], 0, SIZE / 2 - SAT[0], -SAT[1], 0]), 3)),
      beamMat: shader(beamVert, beamFrag, { uA: rgb(PADDY), uT: 0, uOn: 1 }, { transparent: true, side: THREE.DoubleSide, depthWrite: false }),
      shadowMat: shader(slabVert, shadowFrag, { uA: rgb(INK), uOn: 1 }, { transparent: true, depthWrite: false }),
    }
  }, [back, phase, motion, strataTex, nodes])

  // objects made by hand are not owned by the reconciler, so release them ourselves (the lens geometry belongs to the glTF cache)
  useEffect(() => () => { g.wells.geometry.dispose(); g.frame.geometry.dispose(); for (const o of [g.wells, g.clay, g.frame]) (o.material as THREE.Material).dispose() }, [g])

  // demand rendering: any state change or a returning tab asks for one frame
  useEffect(() => {
    const wake = () => invalidate()
    const off = useStore.subscribe(wake)
    document.addEventListener('visibilitychange', wake)
    // frames must be produced while the loader is up, so ready can mean "frames are on screen"
    invalidate()
    const move = (e: PointerEvent) => { pointer.current = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]; invalidate() }
    if (!coarse && !reducedMotion) addEventListener('pointermove', move, { passive: true })
    return () => { off(); document.removeEventListener('visibilitychange', wake); removeEventListener('pointermove', move) }
  }, [invalidate])

  const hud = useMemo(() => (stats ? document.getElementById('stats') : null), [])
  const fps = useRef({ n: 0, t: 0, v: 0 })

  useFrame((_, delta) => {
    const st = useStore.getState()
    const c = cur.current
    const dt = Math.min(delta, 0.05) // a frame after an idle spell must not jump
    // frames on screen: after the third, the loader may finish
    if (c.frames < 3 && ++c.frames === 3) requestAnimationFrame(() => useStore.setState({ ready: true }))
    if (st.revealed && c.intro < 1) c.intro = reducedMotion ? 1 : Math.min(c.intro + dt / 2.4, 1) // the fly-in, eased slowly then normally
    const ease = 1 - Math.exp(-dt * (reducedMotion ? 5 : 1.8 + 3.2 * ramp(c.intro)))
    const f = Math.min(Math.max(st.s, 0), K.length - 1)
    const i = Math.min(Math.floor(f), K.length - 2)
    const mix = smooth(f - i)
    const exploring = f > K.length - 1.5
    let moving = 0
    for (let j = 0; j < 9; j++) {
      let target = K[i][j] + (K[i + 1][j] - K[i][j]) * mix
      if (j === 4 && exploring) target = st.layer
      if (!st.revealed) target = INTRO[j]
      moving = Math.max(moving, Math.abs(target - c.k[j]) / (j < 3 ? 40 : 1))
      c.k[j] += (target - c.k[j]) * ease
    }
    moving = Math.max(moving, Math.abs(st.pass - c.pass) / N, Math.abs(st.pair - c.pair) / N)
    c.pass += (st.pass - c.pass) * ease
    c.pair += (st.pair - c.pair) * ease
    const ambient = !reducedMotion && !st.covered && document.visibilityState === 'visible'
    if (ambient) c.t += dt

    const [az0, pol0, dist, waterY, layer, sink, breath, ox, ty] = c.k
    // never still: a slow sway and a nudge toward the pointer, switched off while the map is being read
    const alive = reducedMotion || exploring ? 0 : 1
    c.px += (pointer.current[0] - c.px) * ease
    c.py += (pointer.current[1] - c.py) * ease
    const az = az0 + alive * (2.5 * Math.sin(c.t * 0.3) + c.px * 3), pol = pol0 + alive * c.py * 1.5
    const portrait = size.width < size.height * 0.85
    const r = dist * (portrait ? 1.55 : 1), a = (az * Math.PI) / 180, p = (pol * Math.PI) / 180
    camera.position.set(r * Math.sin(p) * Math.sin(a), r * Math.cos(p) + ty, r * Math.sin(p) * Math.cos(a))
    camera.lookAt(0, ty, 0)
    // keep the block clear of the text: opposite the panel on wide screens, up top on tall ones
    ;(camera as THREE.PerspectiveCamera).setViewOffset(size.width, size.height, portrait ? 0 : ox * size.width, portrait ? 0.2 * size.height : 0, size.width, size.height)

    // parts 0 and 1 are night: the outline turns moonlight and the ground shadow goes
    c.night += ((f < 3.5 ? 1 : 0) - c.night) * ease
    ;(g.frame.material as THREE.LineBasicMaterial).color.copy(INK_C).lerp(MOON_C, c.night)
    g.shadowMat.uniforms.uOn.value = 1 - c.night

    const swell = breath * Math.sin(c.t * 1.1) // the seasonal rise and fall, sped up
    const top = (slab.current.position.y = -SINK * sink + 0.05 * swell)
    const w = waterY + 0.14 * swell
    water.current.position.y = w
    water.current.scale.y = w + DEPTH
    g.clay.material.uniforms.uWater.value = w
    g.wells.material.uniforms.uWater.value = w - top // wells hang from the slab
    g.wallMat.uniforms.uWater.value = w
    g.wallMat.uniforms.uTop.value = top
    g.waterMat.uniforms.uLevel.value = w
    g.waterMat.uniforms.uT.value = g.beamMat.uniforms.uT.value = c.t

    const z = reducedMotion ? 0 : 5 - ((c.t * 0.07) % 1) * 10 // south to north, like the real ascending pass
    sat.current.position.z = z
    sat.current.visible = !exploring // it would fly across the map being read
    g.beamMat.uniforms.uOn.value = THREE.MathUtils.smoothstep(SIZE / 2 + 0.25 - Math.abs(z), 0, 0.5) // the radar is only on over the block
    const su = g.slabMat.uniforms
    su.uPass.value = c.pass
    su.uPair.value = c.pair
    su.uLayer.value = layer
    su.uKind.value = st.kind
    su.uScan.value = reducedMotion || exploring ? -1 : 0.5 - z / SIZE
    su.uPin.value.set(...(st.pin ?? [-9, -9]))
    su.uHover.value.set(...(st.hover ?? [-9, -9]))

    if (moving > 0.02 && c.intro >= 1) regress() // drop resolution while the camera travels, AdaptiveDpr restores it
    if (ambient || moving > 0.0005 || c.frames < 3 || (st.revealed && c.intro < 1) || Math.abs(c.night - (f < 3.5 ? 1 : 0)) > 0.002) invalidate()
    if (hud) {
      const s = fps.current
      if (++s.n && performance.now() - s.t > 500) { s.v = Math.round((s.n * 1000) / (performance.now() - s.t)); s.n = 0; s.t = performance.now() }
      hud.textContent = `${gl.info.render.calls} draw calls, ${gl.info.render.triangles} triangles, ${s.v} fps, dpr ${gl.getPixelRatio().toFixed(2)}`
    }
  })

  const uvOf = (e: ThreeEvent<PointerEvent | MouseEvent>): [number, number] => {
    const q = slab.current.worldToLocal(e.point.clone())
    return [q.x / SIZE + 0.5, 0.5 - q.z / SIZE]
  }
  const exploring = () => useStore.getState().s > K.length - 1.5

  return (
    <>
      {/* a studio for the satellite and the rock to reflect: warm key, cool fill, plum bounce from below */}
      <Environment resolution={256}>
        <color attach="background" args={['#9aa3a3']} />
        <Lightformer form="rect" intensity={7} color="#fff1dc" position={[-7, 9, 7]} scale={9} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.5} color="#dce8ff" position={[10, 3, 4]} scale={[6, 12, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, 4, -10]} scale={[14, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} color="#b7a3c2" position={[0, -8, 0]} scale={20} target={[0, 0, 0]} />
      </Environment>
      <directionalLight position={[-4.2, 7.2, 5.5]} intensity={2.2} color="#fff3e0" />
      <group ref={slab}>
        <mesh
          geometry={g.slabGeo}
          material={g.slabMat}
          onPointerMove={(e) => exploring() && e.face!.normal.y > 0.5 && useStore.setState({ hover: uvOf(e) })}
          onPointerOut={() => useStore.setState({ hover: null })}
          onClick={(e) => exploring() && e.face!.normal.y > 0.5 && pick(...uvOf(e))}
        />
        <primitive object={g.wells} />
      </group>
      <mesh geometry={g.wallGeo} material={g.wallMat} />
      <primitive object={nodes.Bedrock} />
      <primitive object={g.clay} />
      <primitive object={g.frame} />
      <mesh ref={water} geometry={g.waterGeo} material={g.waterMat} renderOrder={1} />
      <mesh position-y={-DEPTH - 1} rotation-x={-Math.PI / 2} material={g.shadowMat} renderOrder={-1}>
        <planeGeometry args={[9, 9]} />
      </mesh>
      <group ref={sat} position={[SAT[0], SAT[1], 0]}>
        {/* the model's beam leaves 45° off its own vertical: turn it to face the block, then swing it onto the centre line */}
        <group rotation-z={Math.atan2(-SAT[1], -SAT[0]) - (5 * Math.PI) / 4}>
          <primitive object={nodes.NISAR} rotation-y={Math.PI} scale={SAT_SCALE} />
        </group>
        <mesh geometry={g.beamGeo} material={g.beamMat} renderOrder={2} />
      </group>
    </>
  )
}

export default function Scene() {
  const [cap, setCap] = useState(1.5)
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, cap]}
      performance={{ min: 0.7 }}
      gl={{ powerPreference: 'high-performance', antialias: !coarse, alpha: true }}
      camera={{ fov: 28, near: 0.5, far: 60 }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setCap(1)} onIncline={() => setCap(1.5)} flipflops={3} onFallback={() => setCap(1)} />
      <AdaptiveDpr />
      <AdaptiveEvents />
      <World />
    </Canvas>
  )
}
