import { useGSAP } from '@gsap/react'
import { Component, lazy, Suspense, useEffect, type CSSProperties, type ReactNode } from 'react'
import { Count, Read, Rise } from './bits'
import Chart from './Chart'
import Explorer from './Explorer'
import Hud from './Hud'
import Loader from './Loader'
import Paddy from './Paddy'
import SBand from './SBand'
import Wells from './Wells'
import { gsap, ScrollTrigger, startScroll, WIDE } from './motion'
import Waves from './Waves'
import { LAST, pairOf, pairs, passes, useStore } from './store'

const Scene = lazy(() => import('./scene/Scene'))
const meanHH = passes.map((p) => p.hh), meanHV = passes.map((p) => p.hv)
const peak = passes[meanHH.indexOf(Math.max(...meanHH))]

/** A device without WebGL still gets the whole story; it only loses the 3D block. */
class NoScene extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { useStore.setState({ ready: true }) } // release the loader: the story reads without the 3D block
  render() { return this.state.failed ? null : this.props.children }
}

/** Scroll position -> which section, which pass. Written to the store without rendering React. */
function useScrollStory() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-scene]')]
    let queued = 0
    const read = () => {
      queued = 0
      const mid = innerHeight / 2
      const rects = els.map((e) => e.getBoundingClientRect())
      const i = Math.max(rects.findLastIndex((r) => r.top <= mid), 0)
      const local = Math.min(Math.max((mid - rects[i].top) / rects[i].height, 0), 1)
      const run = Math.min(Math.max((local - 0.2) / 0.6, 0), 1) // scrub over the middle of a section
      const { userPass } = useStore.getState()
      const explore = i === els.length - 1
      const pass = explore ? userPass : i < 4 ? 0 : i === 4 ? run * LAST : LAST
      const pair = explore ? pairOf(userPass) : i < 3 ? 0 : i === 3 ? run * (pairs.length - 1) : pairs.length - 1
      const sky = i < 2 ? 'night' : i < 4 ? 'dawn' : 'day' // NISAR crosses at 05:43: the page starts at night and day breaks
      if (document.documentElement.dataset.sky !== sky) document.documentElement.dataset.sky = sky
      useStore.setState({ s: i + local - 0.5, pass, pair, covered: rects[els.length - 1].bottom < 0 })
    }
    const onScroll = () => { queued ||= requestAnimationFrame(read) }
    read()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(queued) }
  }, [])
}

export default function App() {
  const ready = useStore((s) => s.ready)
  const revealed = useStore((s) => s.revealed)
  useScrollStory()
  useEffect(() => {
    if (!location.hash) { history.scrollRestoration = 'manual'; scrollTo(0, 0) } // the fly-in is always seen from the top
    const off = startScroll()
    document.fonts.ready.then(() => ScrollTrigger.refresh()) // headline metrics change when Anek arrives
    return off
  }, [])

  // text panels: each fades in as its section arrives and out as it leaves, so one thought is on screen at a time.
  // Enter and exit animate different elements, because two scrubbed tweens on one opacity fight.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(`${WIDE} and (prefers-reduced-motion: no-preference)`, () => {
      gsap.utils.toArray<HTMLElement>('[data-scene]').forEach((sec, i, all) => {
        const panel = sec.querySelector('.panel')!, body = sec.querySelector('.panel-body')!
        if (i) gsap.fromTo(body, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 62%', end: 'top 30%', scrub: true } })
        if (i < all.length - 1) gsap.fromTo(panel, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, ease: 'none', immediateRender: false, scrollTrigger: { trigger: sec, start: 'bottom 85%', end: 'bottom 52%', scrub: true } })
      })
    })
    mm.add(`not ${WIDE} and (prefers-reduced-motion: no-preference)`, () => {
      gsap.utils.toArray<HTMLElement>('[data-scene] .panel').forEach((p, i) => { if (i) gsap.from(p, { autoAlpha: 0, y: 40, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } }) })
    })
  })

  const peakDate = new Date(peak.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  const year = `Scroll through all 24 passes. Until July the plain is dark. From mid-August it turns magenta: the HH echo climbs from about ${Math.round(meanHH[0])} to ${Math.round(Math.max(...meanHH))} by ${peakDate}, while the HV echo barely moves.`
  const fade = (d: number): CSSProperties => ({ '--d': d } as CSSProperties)

  return (
    <>
      <Loader />
      <div className="sky" aria-hidden="true"><i className="night" /><i className="dawn" /><i className="day" /></div>
      <Hud />
      <div className={ready ? 'stage on' : 'stage'}>
        <NoScene><Suspense fallback={null}><Scene /></Suspense></NoScene>
      </div>

      <main id="top" className={revealed ? 'revealed' : undefined}>
        <section data-scene data-side="left" className="hero">
          <div className="panel"><div className="panel-body">
            <p className="gloss fade" style={fade(0)}><span lang="pa" className="breath">ਸਾਹ</span> saah, Punjabi for breath</p>
            <Rise as="h1" play={revealed}>Is Punjab’s ground still breathing?</Rise>
            <p className="lede">Every twelve days since November 2025, the NISAR radar satellite has crossed the fields of Punjab just before dawn. This is one year of what it saw, and the question it can finally answer: when the monsoon refills the aquifer, does the land rise back?</p>
            <p className="actions fade" style={fade(1)}><a className="button" href="#year">Watch the year</a><a href="#explore">Open the explorer</a></p>
            <p className="note fade" style={fade(2)}>The top of the block is a real NISAR image, 134 km across. The underground is an illustration, not to scale.</p>
            <p className="cue note fade" style={fade(3)}>Scroll to follow one year of passes</p>
          </div></div>
        </section>

        <section data-scene data-side="right">
          <div className="panel"><div className="panel-body">
            <Rise>Punjab pumps <Count from={100} to={164} /> litres for every 100 it can replace</Rise>
            <Read>India’s Central Ground Water Board counted 27.8 billion cubic metres pumped from under Punjab in 2023, against 17 billion that rain and canals can safely put back. Most of it irrigates rice and wheat.</Read>
            <p>Across north India about 450 cubic kilometres of groundwater disappeared between 2002 and 2021. As the water table falls, shallow wells run dry and farmers drill deeper to follow it.</p>
            <p className="note">Blue wells still reach water. Grey ones have run dry.</p>
          </div></div>
        </section>

        <section data-scene data-side="left">
          <div className="panel"><div className="panel-body">
            <Rise>Sand springs back. Clay does not.</Rise>
            <Read>An aquifer is layers of sand with lenses of clay between them. Drain the sand and it relaxes; refill it and it swells again, so the ground above rises and falls with the seasons like a chest.</Read>
            <p>Drain a clay layer and it is squeezed flat for good. The land sinks and that storage space never comes back, however much it rains. Worldwide about 17 cubic kilometres of aquifer are lost this way every year, and roughly 60% of the sinking land is cropland.</p>
            <p className="note">The outline marks the old ground level. Sinking is exaggerated so you can see it.</p>
          </div></div>
        </section>

        <section data-scene data-side="right" className="tall">
          <div className="panel"><div className="panel-body">
            <Rise>Radar watched India’s cities sink. It could not see the fields.</Rise>
            <Read>Older radar satellites use a 5.6 cm wave. It found Kapashera, beside Delhi’s airport, sinking about 17 cm a year. But a wave that short is scrambled by growing crops, so those maps go blank where the farms begin, which is where the water is pumped.</Read>
            <p>NISAR’s L-band wave is 24 cm long and passes through the crop to the soil. Keep scrolling: these are 21 real twelve-day comparisons of this farmland, and the colour bands run unbroken across it in every one.</p>
            <Waves />
            <p className="note">One full colour cycle is about 12 cm along the radar’s line of sight. Most of what you see is atmosphere and orbit, not ground motion. Telling them apart is the work.</p>
          </div></div>
        </section>

        <section data-scene data-side="left" className="taller" id="year">
          <div className="panel"><div className="panel-body">
            <Rise>From orbit, you can watch the pumping season arrive</Rise>
            <Read>{year}</Read>
            <p>Our reading: rice stems standing in flooded fields bounce the wave off the water and straight back, which brightens HH and not HV. It fades with the October harvest. Those are the months the tubewells run hardest.</p>
            <Chart hh={meanHH} hv={meanHV} title="Average brightness of the whole scene, 0 to 255" />
            <Paddy />
          </div></div>
        </section>

        <section data-scene data-side="right">
          <div className="panel"><div className="panel-body">
            <Rise>One year of passes, one question for every field</Rise>
            <ol>
              <li>Stack the interferograms into a record of ground height for each 80 m of land.</li>
              <li>Remove the atmosphere and ionosphere, using the correction layers NISAR ships with each file.</li>
              <li>Split what is left into a seasonal rise and fall, which is sand breathing, and a steady drop, which is clay lost for good.</li>
              <li>Line that up with when each field was flooded and with the Board’s well records.</li>
            </ol>
            <Read>The result is a map of where Punjab’s aquifer can still be refilled and where the room is already gone. In Dwarka, Delhi, the ground stopped sinking and began to rise after rainwater harvesting was enforced. Recovery is possible, and visible from space.</Read>
          </div></div>
        </section>

        <section data-scene data-side="left" className="explore" id="explore">
          <Explorer />
        </section>

        <section data-scene data-side="right">
          <div className="panel"><div className="panel-body">
            <SBand />
          </div></div>
        </section>

        <Wells />

        <div className="ground">
          <section>
            <h2>What this does not show yet</h2>
            <ul>
              <li><b>The ground-motion layer is a first pass, not a survey.</b> We unwrapped the 21 browse interferograms and fitted a straight line plus a yearly cycle to each pixel, but the browse images are colour pictures of phase, not the full GUNW files with their ionosphere and troposphere layers. The noise (about 13 mm) is as large as the signal, so most of that map is atmosphere. The full files need a free NASA Earthdata login.</li>
              <li><b>These are quicklook images.</b> Brightness is a display value from 0 to 255, not calibrated backscatter, and NASA may stretch each image differently. The monsoon rise must be confirmed on the calibrated files.</li>
              <li><b>One year cannot separate a trend from a slow cycle.</b> Two to three years are needed. NISAR’s planned mission is three.</li>
              <li><b>One viewing direction.</b> Vertical and sideways motion cannot be told apart without the descending track, which also covers this area.</li>
              <li><b>No S-band data.</b> NISAR’s second radar is published separately on Bhoonidhi. The S-band section projects our L-band motion to the shorter wavelength; it does not measure S-band.</li>
              <li><b>The rice test is a proxy.</b> Rice is picked from the Sentinel-2 crop calendar, not an official paddy map, and it cannot tell rice from maize. It is consistent with the idea, not proof.</li>
              <li><b>No well time series.</b> The Board’s portal was down, so the wells are district figures from a published paper, 1996 to 2018.</li>
              <li><b>Two passes are left out</b> (7 July, cut off at the swath edge; 5 September, smeared), and NISAR recorded nothing from 27 July to 10 August 2026.</li>
            </ul>
          </section>
          <section>
            <h2>Sources</h2>
            <ul className="sources">
              <li>NISAR L-band GCOV and GUNW browse products, track 156 frame 17, 21 Nov 2025 to 4 Nov 2026. NASA/ISRO, distributed by the <a href="https://search.asf.alaska.edu/#/?dataset=NISAR">Alaska Satellite Facility DAAC</a>.</li>
              <li>Central Ground Water Board, <cite>Dynamic Ground Water Resources of India, 2023</cite>. <a href="https://cgwb.gov.in">cgwb.gov.in</a></li>
              <li>Mishra et al. 2024, <cite>Earth’s Future</cite>. Summer monsoon drying accelerates India’s groundwater depletion under climate change. <a href="https://doi.org/10.1029/2024EF004516">doi:10.1029/2024EF004516</a></li>
              <li>Hasan et al. 2023, <cite>Nature Communications</cite> 14:6180. Global subsidence and permanent aquifer storage loss. <a href="https://doi.org/10.1038/s41467-023-41933-z">doi:10.1038/s41467-023-41933-z</a></li>
              <li>Garg et al. 2022, <cite>Scientific Reports</cite> 12:651. Subsidence and recovery in Delhi. <a href="https://doi.org/10.1038/s41598-021-04193-9">doi:10.1038/s41598-021-04193-9</a></li>
              <li>ESA Copernicus Sentinel-2 L2A surface reflectance (crop calendar for the rice test), via <a href="https://registry.opendata.aws/sentinel-2-l2a-cogs/">AWS Open Data</a> and the <a href="https://earth-search.aws.element84.com/v1">Earth Search STAC API</a>.</li>
              <li>Sharma, Sidana and Kumari 2024, <cite>Journal of Agricultural Development and Policy</cite> 34(1):12-21. District water levels in Punjab, 1996 to 2018. <a href="https://doi.org/10.63066/23220457.34.1.002">doi:10.63066/23220457.34.1.002</a></li>
              <li>Galloway, Jones and Ingebritsen 1999, <cite>Land Subsidence in the United States</cite>, USGS Circular 1182. Elastic and inelastic compaction.</li>
            </ul>
            <p className="note">Built by team Big Hero 7 for the 2026 NASA Space Apps Challenge, “Dancing with the SARs”. Code and data pipeline are open on <a href="https://github.com/SoulBreaker9/Big-Hero-7">GitHub</a>. An AI assistant (Claude) helped write the code and edit the text; every figure is cited above. Not affiliated with or endorsed by NASA or ISRO.</p>
          </section>
        </div>
      </main>
    </>
  )
}
