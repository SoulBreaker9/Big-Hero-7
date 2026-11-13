import { useEffect, useRef } from 'react'
import Chart from './Chart'
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
  const pin = useStore((s) => s.pin)
  const series = useStore((s) => s.series)
  const probeError = useStore((s) => s.probeError)
  const hover = useRef<HTMLParagraphElement>(null)
  const pair = pairs[pairOf(userPass)]

  // cursor position changes every frame, so it bypasses React
  useEffect(() => useStore.subscribe((s) => { if (hover.current) hover.current.textContent = s.hover ? 'Cursor at ' + where(s.hover) : 'Click the scene, or pick a place, to plot it through the year.' }), [])

  return (
    <div className="panel explorer">
      <h2>Look for yourself</h2>
      <p>Every image here is a real NISAR pass over the same 134 km of Punjab. Drag through the year, switch what the radar measured, and pin any spot.</p>

      <div className="seg" role="group" aria-label="What to show">
        <button aria-pressed={layer === 0} onClick={() => useStore.setState({ layer: 0 })}>Backscatter</button>
        <button aria-pressed={layer === 1} onClick={() => useStore.setState({ layer: 1 })}>Interferogram</button>
      </div>

      <label className="slider">
        <span>{layer ? `${fmtDate(pair.ref)} to ${fmtDate(pair.sec)}` : fmtDate(passes[userPass].date)}</span>
        <input type="range" min={0} max={LAST} step={1} value={userPass} onChange={(e) => show(+e.target.value)} aria-valuetext={fmtDate(passes[userPass].date)} />
      </label>
      <p className="note">
        {layer
          ? 'One full colour cycle is about 12 cm of change along the radar’s line of sight. Most of it here is atmosphere and orbit, not ground motion.'
          : 'Magenta means the HH echo is stronger than HV; green means volume scattering from tree canopy; white is buildings.'}
      </p>

      <div className="places">
        {places.map(([name, lon, lat]) => <button key={name} onClick={() => pick(...toUV(lon, lat))}>{name}</button>)}
      </div>
      <p ref={hover} className="note" />
      {probeError && <p className="note" role="alert">{probeError}</p>}
      {pin && series && <Chart hh={series.hh} hv={series.hv} title={`Brightness at ${where(pin)}`} />}

      <details>
        <summary>All {N} passes and their source files</summary>
        <div className="ledger">
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
