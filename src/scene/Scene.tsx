import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import backUrl from '../data/backscatter.webp'
import phaseUrl from '../data/phase.webp'
import { LAST, N, pairs, pick, useStore } from '../store'

const SIZE = 4 // the 134 km scene, in scene units
const DEPTH = 1.5 // drawn depth of the underground section (illustration, not to scale)
const SINK = 0.16 // how far the surface drops when the clay is fully squeezed (exaggerated)

// One camera/underground state per story section: azimuth°, polar°, distance, water table y, layer, sink, breath
const K = [
  [35, 60, 16.5, -0.3, 0, 0, 0.25], // hero
  [22, 78, 15, -0.98, 0, 0, 0], // pumps: side on, water falls
  [-24, 80, 14.5, -1.08, 0, 1, 0], // clay: squeezed, surface sinks
  [-12, 38, 15.5, -1.08, 1, 1, 0], // blind spot: interferograms on top
  [0, 26, 15, -1.08, 0, 1, 0], // the year
  [38, 70, 16.5, -0.7, 0, 0.5, 1], // the test: breathing
  [0, 2, 14, -0.7, 0, 0.5, 0], // explorer: straight down, north up
]

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = window.matchMedia('(pointer: coarse)').matches
const stats = new URLSearchParams(location.search).has('stats')
const smooth = (t: number) => { const x = Math.min(Math.max((t - 0.25) / 0.5, 0), 1); return x * x * (3 - 2 * x) }
// custom shaders write display values straight through, so their colours are plain sRGB triplets
const rgb = (hex: number) => new THREE.Vector3((hex >> 16) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255)
const INK = 0x2a1533, WATER = 0x2c5fa8, PADDY = 0xb4148c, CLAY = 0xb9a3b0, SQUEEZED = 0x6b4a5e, FADED = 0xbfb9c0

const instVert = /* glsl */ `
uniform float uWater;
varying float vK;
void main() {
  vec3 p = position;
  #ifdef CLAY
    // a lens the water table has dropped below gets squeezed, and stays squeezed
    vK = smoothstep(0.0, 0.15, instanceMatrix[3].y - uWater);
    p.y *= mix(1.0, 0.4, vK);
  #else
    // a well is dry once its foot is above the water table
    vK = step(uWater, -length(instanceMatrix[1].xyz));
  #endif
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}`
const instFrag = /* glsl */ `
uniform vec3 uA, uB;
varying float vK;
void main() { gl_FragColor = vec4(mix(uA, uB, vK), 1.0); }`

const slabVert = /* glsl */ `
varying vec3 vP; varying vec3 vN;
void main() { vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const slabFrag = /* glsl */ `
uniform sampler2D uBack, uPhase;
uniform float uPass, uPair, uLayer, uScan;
uniform vec2 uPin, uHover;
uniform vec3 uInk;
varying vec3 vP; varying vec3 vN;
vec3 tile(sampler2D t, float i, vec2 uv) {
  uv = clamp(uv, 0.002, 0.998); // stay off the neighbouring tile
  return texture2D(t, vec2((mod(i, 5.0) + uv.x) / 5.0, (4.0 - floor(i / 5.0) + uv.y) / 5.0)).rgb;
}
void main() {
  if (vN.y < 0.5) { gl_FragColor = vec4(uInk * (abs(vN.x) > 0.5 ? 0.8 : 1.0), 1.0); return; }
  vec2 uv = vec2(vP.x / ${SIZE}.0 + 0.5, 0.5 - vP.z / ${SIZE}.0); // north is -z
  float a = floor(uPass), b = floor(uPair);
  vec3 back = mix(tile(uBack, a, uv), tile(uBack, min(a + 1.0, ${LAST}.0), uv), fract(uPass));
  vec3 phase = mix(tile(uPhase, b, uv), tile(uPhase, min(b + 1.0, ${pairs.length - 1}.0), uv), fract(uPair));
  vec3 col = mix(back, phase, uLayer);
  col += smoothstep(0.012, 0.0, abs(uv.y - uScan)) * 0.45; // the radar's footprint passing over
  col = mix(col, vec3(1.0), smoothstep(0.004, 0.0, abs(distance(uv, uPin) - 0.02)));
  vec2 h = abs(uv - uHover);
  col = mix(col, vec3(1.0), 0.55 * max(smoothstep(0.002, 0.0, h.x), smoothstep(0.002, 0.0, h.y)));
  gl_FragColor = vec4(col, 1.0);
}`

const tintVert = /* glsl */ `varying vec3 vN; void main() { vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const tintFrag = /* glsl */ `uniform vec3 uA; varying vec3 vN; void main() { gl_FragColor = vec4(uA, vN.y > 0.5 ? 0.5 : 0.2); }`

/** Seeded so the illustration is the same on every load. */
function mulberry(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** NISAR as a few boxes and a dish, merged into one draw call with the lighting baked into vertex colours. */
function satelliteGeometry() {
  const part = (g: THREE.BufferGeometry, hex: number, m: THREE.Matrix4) => {
    g = g.toNonIndexed().applyMatrix4(m)
    g.computeVertexNormals()
    const n = g.getAttribute('normal'), c = new Float32Array(n.count * 3), base = new THREE.Color(hex), light = new THREE.Vector3(0.4, 0.8, 0.45).normalize()
    for (let i = 0; i < n.count; i++) {
      const k = 0.62 + 0.38 * Math.max(0, light.dot(new THREE.Vector3().fromBufferAttribute(n, i)))
      c.set([base.r * k, base.g * k, base.b * k], i * 3)
    }
    return g.setAttribute('color', new THREE.BufferAttribute(c, 3))
  }
  const at = (x: number, y: number, z: number, rz = 0) => new THREE.Matrix4().makeRotationZ(rz).setPosition(x, y, z)
  const parts = [
    part(new THREE.BoxGeometry(0.2, 0.2, 0.34), 0xd9c9a0, at(0, 0, 0)), // bus
    part(new THREE.BoxGeometry(0.02, 0.3, 0.7), WATER, at(0.12, 0, 0)), // solar array
    part(new THREE.BoxGeometry(0.7, 0.02, 0.02), INK, at(-0.3, 0.2, 0, -0.5)), // boom
    part(new THREE.CylinderGeometry(0.46, 0.46, 0.015, 28), 0xf3f5f1, at(-0.62, 0.42, 0, 0.9)), // 12 m mesh reflector
  ]
  const merged = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return merged
}

function World() {
  const [back, phase] = useLoader(THREE.TextureLoader, [backUrl, phaseUrl])
  const { camera, invalidate, size, gl } = useThree()
  const regress = useThree((s) => s.performance.regress)
  const slab = useRef<THREE.Group>(null!)
  const water = useRef<THREE.Mesh>(null!)
  const sat = useRef<THREE.Group>(null!)
  const cur = useRef({ k: [...K[0]], pass: 0, pair: 0, t: 0 })

  // geometries and materials are built once and shared
  const g = useMemo(() => {
    for (const t of [back, phase]) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter } // an atlas would bleed across tiles in its mips
    const rand = mulberry(7)
    const wells = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.007, 0.007, 1, 5).translate(0, -0.5, 0),
      new THREE.ShaderMaterial({ vertexShader: instVert, fragmentShader: instFrag, uniforms: { uWater: { value: 0 }, uA: { value: rgb(WATER) }, uB: { value: rgb(FADED) } } }),
      260,
    )
    const m = new THREE.Matrix4()
    for (let i = 0; i < wells.count; i++)
      wells.setMatrixAt(i, m.makeScale(1, 0.35 + rand() ** 1.6 * 0.95, 1).setPosition((rand() - 0.5) * SIZE * 0.96, 0, (rand() - 0.5) * SIZE * 0.96))
    const clay = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 0.09, 1),
      new THREE.ShaderMaterial({ vertexShader: instVert, fragmentShader: instFrag, defines: { CLAY: '' }, uniforms: { uWater: { value: 0 }, uA: { value: rgb(CLAY) }, uB: { value: rgb(SQUEEZED) } } }),
      12,
    )
    for (let i = 0; i < clay.count; i++) {
      const w = 0.5 + rand() * 0.9, d = 0.5 + rand() * 0.9
      clay.setMatrixAt(i, m.makeScale(w, 1, d).setPosition((rand() - 0.5) * (SIZE - w), -0.4 - rand() * 0.9, (rand() - 0.5) * (SIZE - d)))
    }
    const ink = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.45 })
    return {
      wells, clay,
      slabGeo: new THREE.BoxGeometry(SIZE, 0.05, SIZE).translate(0, -0.025, 0),
      slabMat: new THREE.ShaderMaterial({
        vertexShader: slabVert, fragmentShader: slabFrag,
        uniforms: { uBack: { value: back }, uPhase: { value: phase }, uPass: { value: 0 }, uPair: { value: 0 }, uLayer: { value: 0 }, uScan: { value: -1 }, uPin: { value: new THREE.Vector2(-9, -9) }, uHover: { value: new THREE.Vector2(-9, -9) }, uInk: { value: rgb(INK) } },
      }),
      // the fixed outline is the ground level before pumping, so the sinking slab leaves a visible gap under it
      frame: new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE, DEPTH, SIZE).translate(0, -DEPTH / 2, 0)), ink),
      waterGeo: new THREE.BoxGeometry(SIZE * 0.995, 1, SIZE * 0.995).translate(0, -0.5, 0),
      waterMat: new THREE.ShaderMaterial({ vertexShader: tintVert, fragmentShader: tintFrag, transparent: true, depthWrite: false, uniforms: { uA: { value: rgb(WATER) } } }),
      satGeo: satelliteGeometry(),
      satMat: new THREE.MeshBasicMaterial({ vertexColors: true }),
      beamGeo: new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, -SIZE / 2 - 2.7, -2.3, 0, SIZE / 2 - 2.7, -2.3, 0]), 3)),
      beamMat: new THREE.MeshBasicMaterial({ color: PADDY, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }),
    }
  }, [back, phase])

  // objects made by hand are not owned by the reconciler, so release them ourselves
  useEffect(() => () => { for (const o of [g.wells, g.clay, g.frame]) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } }, [g])

  // demand rendering: any state change or a returning tab asks for one frame
  useEffect(() => {
    const wake = () => invalidate()
    const off = useStore.subscribe(wake)
    document.addEventListener('visibilitychange', wake)
    useStore.setState({ ready: true })
    return () => { off(); document.removeEventListener('visibilitychange', wake) }
  }, [invalidate])

  const hud = useMemo(() => (stats ? document.getElementById('stats') : null), [])
  const fps = useRef({ n: 0, t: 0, v: 0 })

  useFrame((_, delta) => {
    const st = useStore.getState()
    const c = cur.current
    const dt = Math.min(delta, 0.05) // a frame after an idle spell must not jump
    const ease = 1 - Math.exp(-dt * 5)
    const f = Math.min(Math.max(st.s, 0), K.length - 1)
    const i = Math.min(Math.floor(f), K.length - 2)
    const mix = smooth(f - i)
    const exploring = f > K.length - 1.5
    let moving = 0
    for (let j = 0; j < 7; j++) {
      let target = K[i][j] + (K[i + 1][j] - K[i][j]) * mix
      if (j === 4 && exploring) target = st.layer
      moving = Math.max(moving, Math.abs(target - c.k[j]) / (j < 3 ? 40 : 1))
      c.k[j] += (target - c.k[j]) * ease
    }
    moving = Math.max(moving, Math.abs(st.pass - c.pass) / N, Math.abs(st.pair - c.pair) / N)
    c.pass += (st.pass - c.pass) * ease
    c.pair += (st.pair - c.pair) * ease
    const ambient = !reducedMotion && !st.covered && document.visibilityState === 'visible'
    if (ambient) c.t += dt

    const [az, pol, dist, waterY, layer, sink, breath] = c.k
    const portrait = size.width < size.height * 0.85
    const r = dist * (portrait ? 1.55 : 1), a = (az * Math.PI) / 180, p = (pol * Math.PI) / 180
    camera.position.set(r * Math.sin(p) * Math.sin(a), r * Math.cos(p) - 0.55, r * Math.sin(p) * Math.cos(a))
    camera.lookAt(0, -0.55, 0)
    // keep the block clear of the text: to the right on wide screens, up top on tall ones
    ;(camera as THREE.PerspectiveCamera).setViewOffset(size.width, size.height, portrait ? 0 : -0.2 * size.width, portrait ? 0.2 * size.height : 0, size.width, size.height)

    const swell = breath * Math.sin(c.t * 1.1) // the seasonal rise and fall, sped up
    slab.current.position.y = -SINK * sink + 0.05 * swell
    const w = waterY + 0.14 * swell
    water.current.position.y = w
    water.current.scale.y = w + DEPTH
    ;(g.clay.material as THREE.ShaderMaterial).uniforms.uWater.value = w
    ;(g.wells.material as THREE.ShaderMaterial).uniforms.uWater.value = w - slab.current.position.y // wells hang from the slab

    const z = reducedMotion ? 0 : 5 - ((c.t * 0.07) % 1) * 10 // south to north, like the real ascending pass
    sat.current.position.z = z
    sat.current.visible = !exploring // it would fly across the map being read
    const su = g.slabMat.uniforms
    su.uPass.value = c.pass
    su.uPair.value = c.pair
    su.uLayer.value = layer
    su.uScan.value = reducedMotion || exploring ? -1 : 0.5 - z / SIZE
    su.uPin.value.set(...(st.pin ?? [-9, -9]))
    su.uHover.value.set(...(st.hover ?? [-9, -9]))

    if (moving > 0.02) regress() // drop resolution while the camera travels, AdaptiveDpr restores it
    if (ambient || moving > 0.0005) invalidate()
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
      <primitive object={g.clay} />
      <primitive object={g.frame} />
      <mesh ref={water} geometry={g.waterGeo} material={g.waterMat} renderOrder={1} />
      <group ref={sat} position={[2.7, 2.3, 0]}>
        <mesh geometry={g.satGeo} material={g.satMat} />
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
      flat
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
