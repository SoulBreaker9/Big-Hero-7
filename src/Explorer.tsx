import { useEffect, useRef, type CSSProperties } from 'react'
import Chart from './Chart'
import motion from './data/motion.json'
import { fmtDate, LAST, lonLat, N, pairOf, pairs, passes, pick, toUV, useStore } from './store'

const places: [string, number, number][] = [
  ['Paddy fields west of Sangrur', 75.7, 30.28],
  ['Fields north of Nabha', 76.15, 30.5],
  ['Ludhiana city', 75.857, 30.901],
  ['Sutlej river', 75.87, 30.975],
]
const tier = (t: string) => (t.includes('PROVISIONAL') ? 'Provisional' : t.includes('BETA') ? 'Beta' : 'Validated')
const show = (i: number) => useStore.setState({ userPass: i, pass: i, pair: pairOf(i) })
const where = ([u, v]: [number, number]) => { const [lon, lat] = lonLat(u, v); return `${lat.toFixed(3)}° N, ${lon.toFixed(3)}° E` }

export default function Explorer() {
  const userPass = useStore((s) => s.userPass)
  const layer = useStore((s) => s.layer)
  const kind = useStore((s) => s.kind)
  const pin = useStore((s) => s.pin)
  const series = useStore((s) => s.series)
  const probeError = useStore((s) => s.probeError)
  const hover = useRef<HTMLParagraphElement>(null)
  const pair = pairs[pairOf(userPass)]

  // cursor position changes every frame, so it bypasses React
  useEffect(() => useStore.subscribe((s) => { if (hover.current) hover.current.textContent = s.hover ? 'Cursor at ' + where(s.hover) : 'Click the scene, or pick a place, to plot it through the year.' }), [])

  return (
    <div className="explorer">
      <p className="eyebrow" style={{ '--n': '"09"' } as CSSProperties}>Look for yourself</p>
      <h2>Every pixel is a real NISAR pass. Pin any field.</h2>

      <div className="seg" role="group" aria-label="What to show">
        <button aria-pressed={layer === 0} onClick={() => useStore.setState({ layer: 0 })}>Backscatter</button>
        <button aria-pressed={layer === 1} onClick={() => useStore.setState({ layer: 1 })}>Interferogram</button>
        <button aria-pressed={layer === 2} onClick={() => useStore.setState({ layer: 2 })}>Ground motion</button>
      </div>
      {layer === 2 && (
        <div className="seg" role="group" aria-label="Which motion">
          <button aria-pressed={kind === 0} onClick={() => useStore.setState({ kind: 0 })}>Sinking for good</button>
          <button aria-pressed={kind === 1} onClick={() => useStore.setState({ kind: 1 })}>Breathing</button>
        </div>
      )}

      {layer < 2 && <label className="slider">
        <span>{layer ? `${fmtDate(pair.ref)} to ${fmtDate(pair.sec)}` : fmtDate(passes[userPass].date)}</span>
        <input type="range" min={0} max={LAST} step={1} value={userPass} onChange={(e) => show(+e.target.value)} aria-valuetext={fmtDate(passes[userPass].date)} />
      </label>}
      <p className="note">
        {layer === 2
          ? kind
            ? `Green rises and falls each year, up to ${motion.ampP95} mm. A lead, not a finding: atmosphere is seasonal too.`
            : `Magenta sank, blue rose. Slope over ${motion.pairs} browse pairs; noise is about ${motion.noiseMm} mm, so broad blobs are mostly atmosphere.`
          : layer
          ? 'One colour cycle ≈ 12 cm along the radar’s line of sight. Mostly atmosphere and orbit.'
          : 'Magenta: strong HH echo. Green: tree canopy. White: buildings.'}
      </p>

      <div className="places">
        {places.map(([name, lon, lat]) => <button key={name} onClick={() => pick(...toUV(lon, lat))}>{name}</button>)}
      </div>
      <p ref={hover} className="note" />
      {probeError && <p className="note" role="alert">{probeError}</p>}
      {pin && series && <Chart hh={series.hh} hv={series.hv} title={`Brightness at ${where(pin)}`} />}

      <details>
        <summary>All {N} passes and source granules</summary>
        <div className="ledger" data-lenis-prevent>
          <table>
            <thead><tr><th>Date</th><th>Release</th><th>HH</th><th>HV</th><th>NISAR granule</th></tr></thead>
            <tbody>
              {passes.map((p, i) => (
                <tr key={p.date} aria-current={i === userPass || undefined}>
                  <td><button onClick={() => show(i)}>{fmtDate(p.date)}</button></td>
                  <td>{tier(p.tier)}</td><td>{p.hh}</td><td>{p.hv}</td><td>{p.granule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
