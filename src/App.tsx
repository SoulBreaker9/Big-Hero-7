import { Component, lazy, Suspense, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Chapter, Count, Rise } from './bits'
import Chart from './Chart'
import Explorer from './Explorer'
import Hud from './Hud'
import Loader from './Loader'
import Paddy from './Paddy'
import SBand from './SBand'
import Sources from './Sources'
import Wells from './Wells'
import { ScrollTrigger, startScroll } from './motion'
import Waves from './Waves'
import { LAST, pairOf, pairs, passes, useStore } from './store'

const Scene = lazy(() => import('./scene/Scene'))
const meanHH = passes.map((p) => p.hh), meanHV = passes.map((p) => p.hv)
const PEAK = meanHH.indexOf(Math.max(...meanHH))
export const CHAPTERS = 10 // hero, overdraft, sand and clay, blind spot, year, rice, method, S-band, wells, explorer

/** A device without WebGL still gets the whole story; it only loses the 3D block. */
class NoScene extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { useStore.setState({ ready: true }) } // release the loader: the story reads without the 3D block
  render() { return this.state.failed ? null : this.props.children }
}

/** Scroll position -> chapter, pass and pair. Per-frame values go to the store without rendering React. */
function useScrollStory() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-scene]')]
    const explore = els.length - 1
    let queued = 0
    const read = () => {
      queued = 0
      const mid = innerHeight / 2
      const rects = els.map((e) => e.getBoundingClientRect())
      const i = Math.max(rects.findLastIndex((r) => r.top <= mid), 0)
      const local = Math.min(Math.max((mid - rects[i].top) / rects[i].height, 0), 1)
      const run = Math.min(Math.max((local - 0.15) / 0.7, 0), 1) // scrub over the middle of a chapter
      const { userPass, ch } = useStore.getState()
      const pass = i === explore ? userPass : i < 4 ? 0 : i === 4 ? run * LAST : i === 5 ? PEAK : LAST
      const pair = i === explore ? pairOf(userPass) : i < 3 ? 0 : i === 3 ? run * (pairs.length - 1) : pairs.length - 1
      const sky = i < 2 ? 'night' : i < 4 ? 'dawn' : 'day' // NISAR crosses at 05:43: the page starts at night and day breaks
      if (document.documentElement.dataset.sky !== sky) document.documentElement.dataset.sky = sky
      const past = rects[explore].bottom < innerHeight * 0.35
      useStore.setState({ s: i + local - 0.5, pass, pair, covered: rects[explore].bottom < 0, ...(ch !== (past ? -1 : i) && { ch: past ? -1 : i }) })
    }
    const onScroll = () => { queued ||= requestAnimationFrame(read) }
    read()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(queued) }
  }, [])
}

/** The month on screen, set huge, following the scrubbed pass. Written straight to the DOM. */
function Month() {
  const ref = useRef<HTMLSpanElement>(null), hh = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let shown = -1
    const sync = () => {
      const i = Math.round(useStore.getState().pass)
      if (i === shown || !ref.current) return
      shown = i
      ref.current.textContent = new Date(passes[i].date).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
      hh.current!.textContent = String(Math.round(meanHH[i]))
    }
    sync()
    return useStore.subscribe(sync)
  }, [])
  return (
    <p className="month fx" style={d(2)} aria-hidden="true">
      <span ref={ref} className="mega outline" />
      <span className="month-hh"><b ref={hh} /> HH echo</span>
    </p>
  )
}

const d = (n: number) => ({ '--d': n } as CSSProperties)

export default function App() {
  const ready = useStore((s) => s.ready)
  useScrollStory()
  useEffect(() => {
    if (!location.hash) { history.scrollRestoration = 'manual'; scrollTo(0, 0) } // the fly-in is always seen from the top
    const off = startScroll()
    document.fonts.ready.then(() => ScrollTrigger.refresh())
    return off
  }, [])

  return (
    <>
      <Loader />
      <div className="sky" aria-hidden="true"><i className="night" /><i className="dawn" /><i className="day" /></div>
      <div className="grain" aria-hidden="true" />
      <Hud />
      <div className={ready ? 'stage on' : 'stage'}>
        <NoScene><Suspense fallback={null}><Scene /></Suspense></NoScene>
      </div>

      <main id="top">
        <Chapter i={0} className="hero">
          <p className="kicker fx" style={d(0)}><span lang="pa" className="breath">ਸਾਹ</span><span>saah<br />Punjabi for breath</span></p>
          <Rise as="h1">Is Punjab’s ground still breathing?</Rise>
          <p className="lede fx" style={d(3)}>One year of NISAR radar. 134 km of farmland. 24 passes before dawn.</p>
          <p className="actions fx" style={d(4)}><a className="button" href="#year">Watch the year</a><a className="link" href="#explore">Open the explorer →</a></p>
          <p className="cue fx" style={d(6)} aria-hidden="true"><i />Scroll</p>
        </Chapter>

        <Chapter i={1}>
          <p className="eyebrow fx" style={d(0)}>The overdraft</p>
          <p className="mega fx" style={d(1)}><Count from={100} to={164} /></p>
          <Rise>litres pumped for every 100 that come back</Rise>
          <div className="bars fx" style={d(4)} aria-label="Punjab, 2023: 27.8 billion cubic metres pumped, 17 billion recharged">
            <span style={{ '--v': 1 } as CSSProperties}><i />Pumped<b>27.8 bn m³</b></span>
            <span style={{ '--v': 17 / 27.8 } as CSSProperties}><i />Recharged<b>17 bn m³</b></span>
          </div>
          <p className="small fx" style={d(5)}>Punjab, 2023. Central Ground Water Board.</p>
        </Chapter>

        <Chapter i={2}>
          <p className="eyebrow fx" style={d(0)}>Under the fields</p>
          <Rise>Sand springs back. Clay doesn’t.</Rise>
          <div className="strata fx" style={d(3)} aria-hidden="true">
            <div className="sand"><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="clay"><i /></div>
            <span>Sand · breathes with the monsoon</span><span>Clay · squeezed flat for good</span>
          </div>
          <p className="small fx" style={d(4)}>Drain a clay layer and the land sinks. That storage never comes back.</p>
        </Chapter>

        <Chapter i={3} className="tall">
          <p className="eyebrow fx" style={d(0)}>The blind spot</p>
          <Rise>Old radar saw cities sink. Not the fields.</Rise>
          <Waves />
          <p className="small fx" style={d(5)}>21 real NISAR interferograms of this farmland, scrolling now. The bands run unbroken through the crops.</p>
        </Chapter>

        <Chapter i={4} id="year" className="taller">
          <p className="eyebrow fx" style={d(0)}>Nov 2025 → Nov 2026</p>
          <Rise>Watch the monsoon arrive from orbit</Rise>
          <Month />
          <div className="fx" style={d(3)}><Chart hh={meanHH} hv={meanHV} title="Whole-scene brightness, 24 passes" /></div>
        </Chapter>

        <Chapter i={5}>
          <p className="eyebrow fx" style={d(0)}>The rice test</p>
          <Rise>Flooded paddy lights up. Nothing else does.</Rise>
          <Paddy />
        </Chapter>

        <Chapter i={6}>
          <p className="eyebrow fx" style={d(0)}>The method</p>
          <Rise>One question for every field</Rise>
          <ol className="steps">
            {['Stack 21 interferograms', 'Strip out the atmosphere', 'Split breathing from sinking', 'Check against crops and wells'].map((s, i) => (
              <li key={s} className="fx" style={d(3 + i)}><b>0{i + 1}</b>{s}</li>
            ))}
          </ol>
          <p className="small fx" style={d(7)}>In Delhi’s Dwarka, the ground began to rise once rainwater harvesting was enforced. Recovery is visible from space.</p>
        </Chapter>

        <Chapter i={7}><SBand /></Chapter>
        <Chapter i={8} id="wells"><Wells /></Chapter>

        <section data-scene id="explore" className="chapter explore">
          <Explorer />
        </section>

        <Sources />
      </main>
    </>
  )
}
