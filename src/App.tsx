import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import Chart from './Chart'
import Explorer from './Explorer'
import Hud from './Hud'
import { LAST, pairOf, pairs, passes, useStore } from './store'

const Scene = lazy(() => import('./scene/Scene'))
const meanHH = passes.map((p) => p.hh), meanHV = passes.map((p) => p.hv)
const peak = passes[meanHH.indexOf(Math.max(...meanHH))]

/** A device without WebGL still gets the whole story; it only loses the 3D block. */
class NoScene extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
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
  const [mount, setMount] = useState(false)
  useScrollStory()
  // the headline paints first; three.js is fetched only once the browser is idle
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200))
    idle(() => setMount(true))
  }, [])

  return (
    <>
      <Hud />
      <div className={ready ? 'stage on' : 'stage'}>
        {mount && <NoScene><Suspense fallback={null}><Scene /></Suspense></NoScene>}
      </div>
      {!ready && <p className="loading note" role="status">Loading 4 MB of radar images and the NISAR model</p>}

      <main id="top">
        <section data-scene className="hero">
          <div className="panel">
            <p className="gloss"><span lang="pa" className="breath">ਸਾਹ</span> saah, Punjabi for breath</p>
            <h1>Is Punjab’s ground still breathing?</h1>
            <p className="lede">Every twelve days since November 2025, the NISAR radar satellite has crossed the fields of Punjab just before dawn. This is one year of what it saw, and the question it can finally answer: when the monsoon refills the aquifer, does the land rise back?</p>
            <p className="actions"><a className="button" href="#year">Watch the year</a><a href="#explore">Open the explorer</a></p>
            <p className="note">The top of the block is a real NISAR image, 134 km across. The underground is an illustration, not to scale.</p>
          </div>
        </section>

        <section data-scene>
          <div className="panel">
            <h2>Punjab pumps 164 litres for every 100 it can replace</h2>
            <p>India’s Central Ground Water Board counted 27.8 billion cubic metres pumped from under Punjab in 2023, against 17 billion that rain and canals can safely put back. Most of it irrigates rice and wheat.</p>
            <p>Across north India about 450 cubic kilometres of groundwater disappeared between 2002 and 2021. As the water table falls, shallow wells run dry and farmers drill deeper to follow it.</p>
            <p className="note">Blue wells still reach water. Grey ones have run dry.</p>
          </div>
        </section>

        <section data-scene>
          <div className="panel">
            <h2>Sand springs back. Clay does not.</h2>
            <p>An aquifer is layers of sand with lenses of clay between them. Drain the sand and it relaxes; refill it and it swells again, so the ground above rises and falls with the seasons like a chest.</p>
            <p>Drain a clay layer and it is squeezed flat for good. The land sinks and that storage space never comes back, however much it rains. Worldwide about 17 cubic kilometres of aquifer are lost this way every year, and roughly 60% of the sinking land is cropland.</p>
            <p className="note">The outline marks the old ground level. Sinking is exaggerated so you can see it.</p>
          </div>
        </section>

        <section data-scene className="tall">
          <div className="panel">
            <h2>Radar watched India’s cities sink. It could not see the fields.</h2>
            <p>Older radar satellites use a 5.6 cm wave. It found Kapashera, beside Delhi’s airport, sinking about 17 cm a year. But a wave that short is scrambled by growing crops, so those maps go blank where the farms begin, which is where the water is pumped.</p>
            <p>NISAR’s L-band wave is 24 cm long and passes through the crop to the soil. Keep scrolling: these are 21 real twelve-day comparisons of this farmland, and the colour bands run unbroken across it in every one.</p>
            <p className="note">One full colour cycle is about 12 cm along the radar’s line of sight. Most of what you see is atmosphere and orbit, not ground motion. Telling them apart is the work.</p>
          </div>
        </section>

        <section data-scene className="taller" id="year">
          <div className="panel">
            <h2>From orbit, you can watch the pumping season arrive</h2>
            <p>Scroll through all 24 passes. Until July the plain is dark. From mid-August it turns magenta: the HH echo climbs from about {Math.round(meanHH[0])} to {Math.round(Math.max(...meanHH))} by {new Date(peak.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}, while the HV echo barely moves.</p>
            <p>Our reading: rice stems standing in flooded fields bounce the wave off the water and straight back, which brightens HH and not HV. It fades with the October harvest. Those are the months the tubewells run hardest.</p>
            <Chart hh={meanHH} hv={meanHV} title="Average brightness of the whole scene, 0 to 255" />
          </div>
        </section>

        <section data-scene>
          <div className="panel">
            <h2>One year of passes, one question for every field</h2>
            <ol>
              <li>Stack the interferograms into a record of ground height for each 80 m of land.</li>
              <li>Remove the atmosphere and ionosphere, using the correction layers NISAR ships with each file.</li>
              <li>Split what is left into a seasonal rise and fall, which is sand breathing, and a steady drop, which is clay lost for good.</li>
              <li>Line that up with when each field was flooded and with the Board’s well records.</li>
            </ol>
            <p>The result is a map of where Punjab’s aquifer can still be refilled and where the room is already gone. In Dwarka, Delhi, the ground stopped sinking and began to rise after rainwater harvesting was enforced. Recovery is possible, and visible from space.</p>
          </div>
        </section>

        <section data-scene className="explore" id="explore">
          <Explorer />
        </section>

        <div className="ground">
          <section>
            <h2>What this does not show yet</h2>
            <ul>
              <li><b>No sinking has been measured here.</b> The breathing test above is our method, not a result. It needs the full NISAR science files, which need a free NASA Earthdata login.</li>
              <li><b>These are quicklook images.</b> Brightness is a display value from 0 to 255, not calibrated backscatter, and NASA may stretch each image differently. The monsoon rise must be confirmed on the calibrated files.</li>
              <li><b>One year cannot separate a trend from a slow cycle.</b> Two to three years are needed. NISAR’s planned mission is three.</li>
              <li><b>One viewing direction.</b> Vertical and sideways motion cannot be told apart without the descending track, which also covers this area.</li>
              <li><b>No S-band comparison.</b> NISAR’s second radar is processed by ISRO and published separately on Bhoonidhi.</li>
              <li><b>Two passes are left out</b> (7 July, cut off at the swath edge; 5 September, smeared), and NISAR recorded nothing from 27 July to 10 August 2026.</li>
            </ul>
          </section>
          <section>
            <h2>Sources</h2>
            <ul className="sources">
              <li>NISAR L-band GCOV and GUNW browse products, track 156 frame 17, 21 Nov 2025 to 4 Nov 2026. NASA/ISRO, distributed by the <a href="https://search.asf.alaska.edu/#/?dataset=NISAR">Alaska Satellite Facility DAAC</a>.</li>
              <li>Central Ground Water Board, <cite>Dynamic Ground Water Resources of India, 2023</cite>. <a href="https://cgwb.gov.in">cgwb.gov.in</a></li>
              <li>Mishra et al. 2024, <cite>Earth’s Future</cite>. Groundwater loss in north India, 2002 to 2021. <a href="https://doi.org/10.1029/2024EF004516">doi:10.1029/2024EF004516</a></li>
              <li>Hasan et al. 2023, <cite>Nature Communications</cite> 14:6180. Global subsidence and permanent aquifer storage loss. <a href="https://doi.org/10.1038/s41467-023-41933-z">doi:10.1038/s41467-023-41933-z</a></li>
              <li>Garg et al. 2022, <cite>Scientific Reports</cite> 12:651. Subsidence and recovery in Delhi. <a href="https://doi.org/10.1038/s41598-021-04193-9">doi:10.1038/s41598-021-04193-9</a></li>
              <li>Galloway, Jones and Ingebritsen 1999, <cite>Land Subsidence in the United States</cite>, USGS Circular 1182. Elastic and inelastic compaction.</li>
            </ul>
            <p className="note">Built by team Big Hero 7 for the 2026 NASA Space Apps Challenge, “Dancing with the SARs”. Code and data pipeline are open on <a href="https://github.com/SoulBreaker9/Big-Hero-7">GitHub</a>. An AI assistant (Claude) helped write the code and edit the text; every figure is cited above. Not affiliated with or endorsed by NASA or ISRO.</p>
          </section>
        </div>
      </main>
    </>
  )
}
