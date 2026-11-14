import type { CSSProperties } from 'react'
import { Count, Rise } from './bits'
import data from './data/wells.json'
import './wells.css'

const d = data.districts
const names = Object.keys(d) as (keyof typeof d)[]
const DEEP = 40 // metres at the bottom of each column
const st = (n: number) => ({ '--d': n } as CSSProperties)

/** Published well depths for three districts in the scene: the water falling, set against what one year of radar can say. */
export default function Wells() {
  return (
    <>
      <p className="eyebrow fx" style={st(0)}>Ground truth</p>
      <Rise>The wells drop a metre every year</Rise>
      <div className="wells">
        {names.map((n, i) => (
          <figure key={n} className="fx" style={{ ...st(3 + i), '--a': d[n].waterM['1996'] / DEEP, '--b': d[n].waterM['2018'] / DEEP } as CSSProperties}>
            <div className="shaft" role="img" aria-label={`${n}: water ${d[n].waterM['1996']} m below ground in 1996, ${d[n].waterM['2018']} m in 2018`}><i /></div>
            <figcaption><b>−<Count from={0} to={d[n].fallM} /> m</b>{n}</figcaption>
          </figure>
        ))}
      </div>
      <p className="small fx" style={st(6)}>October water table, {data.years}. One year of radar cannot yet say how the ground answers. Three can.</p>
    </>
  )
}
