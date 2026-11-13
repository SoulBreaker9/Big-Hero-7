import { create } from 'zustand'
import data from './data/passes.json'
import atlas from './data/backscatter.webp'

export const { passes, pairs, roi } = data
export const N = passes.length
export const LAST = N - 1

export type Series = { hh: number[]; hv: number[] }

type State = {
  // per-frame values: read with getState()/subscribe, never with a hook
  s: number // section index as a float, x.0 = centre of section x
  pass: number // pass shown, float so neighbours crossfade
  pair: number // interferogram shown
  covered: boolean // canvas is behind the opaque closing sections
  hover: [number, number] | null
  // low-frequency UI state: fine to select in components
  chunk: boolean // the 3D code has arrived
  load: number // share of the 3D assets fetched, 0 to 1
  ready: boolean // the scene has drawn real frames (or cannot: no WebGL)
  revealed: boolean // the loader has lifted
  userPass: number
  layer: 0 | 1 // 0 backscatter, 1 interferogram
  pin: [number, number] | null // u, v on the scene, v = 0 at the south edge
  series: Series | null
  probeError: string | null
}

export const useStore = create<State>(() => ({
  s: 0, pass: 0, pair: 0, covered: false, hover: null,
  chunk: false, load: 0, ready: false, revealed: false, userPass: LAST, layer: 0, pin: null, series: null, probeError: null,
}))

/** Interferogram that starts at this pass, or the nearest earlier one. */
export const pairOf = (pass: number) => {
  for (let i = Math.round(pass); i >= 0; i--) if (passes[i].pair >= 0) return passes[i].pair
  return 0
}

export const lonLat = (u: number, v: number) => [roi[0] + u * (roi[2] - roi[0]), roi[1] + v * (roi[3] - roi[1])]
export const toUV = (lon: number, lat: number): [number, number] => [(lon - roi[0]) / (roi[2] - roi[0]), (lat - roi[1]) / (roi[3] - roi[1])]

let worker: Worker | undefined
let ticket = 0

/** Pin a point and read its 24-pass series off the atlas in a worker. */
export function pick(u: number, v: number) {
  useStore.setState({ pin: [u, v], probeError: null })
  if (!worker) {
    worker = new Worker(new URL('./probe.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<Series & { id: number; error?: string }>) => {
      if (e.data.id !== ticket) return // a newer click is pending
      if (e.data.error) useStore.setState({ series: null, probeError: e.data.error })
      else useStore.setState({ series: { hh: e.data.hh, hv: e.data.hv } })
    }
    worker.onerror = () => useStore.setState({ probeError: 'This browser cannot read the scene pixels.' })
  }
  worker.postMessage({ id: ++ticket, url: atlas, n: N, cols: data.cols, u, v })
}

export const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
