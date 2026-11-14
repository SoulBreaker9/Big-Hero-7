import { passes } from './store'
import data from './data/paddy.json'
import mapUrl from './data/paddy.webp'
import './paddy.css'

const W = 560, H = 230, L = 34, R = 56, T = 12, B = 26
const t = passes.map((p) => Date.parse(p.date))
const x = (i: number) => L + ((t[i] - t[0]) / (t[t.length - 1] - t[0])) * (W - L - R)
const y = (v: number) => T + (1 - v / 255) * (H - T - B)
const line = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('')
const months = [...new Set(passes.map((p) => p.date.slice(0, 7)))].filter((_, i) => i % 2 === 0)
const { rice, perennial } = data.stats, s = data.series

const legend: [string, string][] = [['rice-like', '#b4148c'], ['perennial vegetation', '#609670'], ['barren, built-up', '#5a5060'], ['no clear Sentinel-2 view', '#140c1c']]

/** The crop test: does HH brighten on rice-like fields only? Numbers come from scripts/build_paddy.py. */
export default function Paddy() {
  const top = Math.round(data.topQuartileRise.riceShare * 100), base = Math.round(data.topQuartileRise.baseline * 100)
  return (
    <div className="paddy">
      <figure>
        <img src={mapUrl} width="256" height="256" alt="Map of the NISAR area coloured by crop class" />
        <ul className="key">{legend.map(([n, c]) => <li key={n}><i style={{ background: c }} />{n}</li>)}</ul>
      </figure>
      <figure className="chart">
        <figcaption>Average HH and HV by crop class, 0 to 255</figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`HH on rice-like cells climbs ${rice.riseHH} grey levels from June to September while HV climbs ${rice.riseHV}; on perennial vegetation both fall.`}>
          {[0, 85, 170, 255].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid" /><text x={L - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
          {months.map((m) => { const i = passes.findIndex((p) => p.date.startsWith(m)); return <text key={m} x={x(i)} y={H - 6}>{new Date(m + '-01').toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</text> })}
          <path d={line(s.perennial.hv)} className="hv g" /><path d={line(s.perennial.hh)} className="hh g" />
          <path d={line(s.rice.hv)} className="hv" /><path d={line(s.rice.hh)} className="hh" />
          <text x={W - R + 6} y={y(s.rice.hh[23]) + 4} className="label">rice HH</text>
          <text x={W - R + 6} y={y(s.rice.hv[23]) + 4} className="label">rice HV</text>
          <text x={W - R + 6} y={y(s.perennial.hh[23]) + (Math.abs(s.perennial.hh[23] - s.rice.hh[23]) < 14 ? 16 : 4)}>other HH</text>
        </svg>
        <p className="readout">Solid is HH, dashed is HV. Strong lines are rice-like cells, faint lines are perennial vegetation.</p>
      </figure>
      <dl className="nums">
        <div><dt>Rice-like, June to September</dt><dd>HH +{rice.riseHH}, HV +{rice.riseHV}</dd></div>
        <div><dt>Perennial vegetation</dt><dd>HH {perennial.riseHH}, HV {perennial.riseHV}</dd></div>
        <div><dt>HH rise vs how much a cell greened</dt><dd>r = {data.r.riseHHvsGreening} (HV: {data.r.riseHVvsGreening})</dd></div>
        <div><dt>Brightest-rising quarter of the plain</dt><dd>{top}% rice-like, against {base}% overall</dd></div>
        <div><dt>After the October harvest</dt><dd>HH {rice.afterHarvestHH} on rice-like cells</dd></div>
        <div><dt>Among rice-like cells, greener September</dt><dd>HH rise {data.dose[0].riseHH} to {data.dose[3].riseHH} over the first four fifths, but per cell r = {data.doseR}: weak</dd></div>
      </dl>
      <p className="verdict"><strong>Consistent with, not proof.</strong> HH rises about {(rice.riseHH / rice.riseHV).toFixed(1)} times more than HV on rice-like cells, falls where the ground stays vegetated all year, and drops again after harvest. That is the pattern flooded paddy should leave. It is a crop-calendar guess from Sentinel-2 (bare in June, green in September, cleared by 25 October), not a survey map, so it cannot separate rice from maize or early cotton. The control we wanted, summer crops that are not rice, came out empty: the whole plain was harvested by 25 October. HH and HV here are the 0 to 255 quicklook stretch, not calibrated backscatter. Confirming it needs a district paddy map and calibrated NISAR data.</p>
    </div>
  )
}
