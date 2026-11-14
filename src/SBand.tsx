import type { CSSProperties } from 'react'
import { Rise } from './bits'
import s from './data/sband.json'
import './sband.css'

const d = (n: number) => ({ '--d': n } as CSSProperties)

/** Section 2 of the brief: L-band against S-band, projected from our L-band pairs because no S-band data was available. */
export default function SBand() {
  return (
    <>
      <p className="eyebrow fx" style={d(0)}>The second radar</p>
      <Rise>{`S-band would feel the same motion ${s.phaseMultiplier}× harder`}</Rise>
      <div className="duel" aria-label={`One fringe of colour is ${s.mmPerFringe.L} mm of motion at L-band and ${s.mmPerFringe.S} mm at S-band`}>
        <div className="fx" style={d(3)}>
          <span className="band">L-band · {s.lambdaMm.L / 10} cm</span>
          <b>{s.mmPerFringe.L}<small>mm</small></b>
          <svg viewBox="0 0 200 24" aria-hidden="true"><path d="M0 12 Q 25 -2 50 12 T 100 12 T 150 12 T 200 12" /></svg>
        </div>
        <div className="fx s" style={d(4)}>
          <span className="band">S-band · {s.lambdaMm.S / 10} cm</span>
          <b>{s.mmPerFringe.S}<small>mm</small></b>
          <svg viewBox="0 0 200 24" aria-hidden="true"><path d="M0 12 Q 10 -2 20 12 T 40 12 T 60 12 T 80 12 T 100 12 T 120 12 T 140 12 T 160 12 T 180 12 T 200 12" /></svg>
        </div>
      </div>
      <p className="small fx" style={d(5)}>per colour fringe. Punjab moves slowly and smoothly, so S-band would still unwrap cleanly: {(s.aliasFraction.S * 100).toFixed(1)}% of {s.steps.toLocaleString('en')} steps break.</p>
      <p className="tag fx" style={d(6)}>Projected from {s.pairs} L-band pairs. No S-band data yet (ISRO, <a href="https://bhoonidhi.nrsc.gov.in" target="_blank" rel="noreferrer">Bhoonidhi</a>).</p>
    </>
  )
}
