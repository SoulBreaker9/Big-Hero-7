import type { CSSProperties } from 'react'
import data from './data/paddy.json'
import mapUrl from './data/paddy.webp'
import './paddy.css'

const { rice, perennial } = data.stats
const legend: [string, string][] = [['rice-like', '#b4148c'], ['perennial', '#609670'], ['bare, built-up', '#5a5060']]
const d = (n: number) => ({ '--d': n } as CSSProperties)

/** The crop test: does HH brighten on rice-like fields only? Numbers come from scripts/build_paddy.py. */
export default function Paddy() {
  const top = Math.round(data.topQuartileRise.riceShare * 100), base = Math.round(data.topQuartileRise.baseline * 100)
  return (
    <div className="paddy">
      <figure className="fx" style={d(3)}>
        <img src={mapUrl} width="256" height="256" alt="Map of the NISAR scene coloured by crop class from Sentinel-2" />
        <ul className="key">{legend.map(([n, c]) => <li key={n}><i style={{ background: c }} />{n}</li>)}</ul>
      </figure>
      <dl className="tiles">
        <div className="fx hot" style={d(4)}><dt>Rice-like fields, Jun → Sep</dt><dd>+{rice.riseHH}<small> HH</small></dd></div>
        <div className="fx" style={d(5)}><dt>Perennial vegetation</dt><dd>{perennial.riseHH}<small> HH</small></dd></div>
        <div className="fx" style={d(6)}><dt>Fastest-brightening quarter that is rice-like</dt><dd>{top}%<small> vs {base}%</small></dd></div>
      </dl>
      <p className="tag fx" style={d(7)}>Consistent with flooded paddy, not proof. Quicklook brightness, crop map from Sentinel-2.</p>
    </div>
  )
}
