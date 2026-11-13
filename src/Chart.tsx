import { memo, useEffect, useRef, useState } from 'react'
import { fmtDate, passes, useStore } from './store'

const W = 560, H = 230, L = 34, R = 44, T = 14, B = 26
const t0 = Date.parse(passes[0].date), t1 = Date.parse(passes[passes.length - 1].date)
const xs = passes.map((p) => L + ((Date.parse(p.date) - t0) / (t1 - t0)) * (W - L - R))
const y = (v: number) => T + (1 - v / 255) * (H - T - B)
const months = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2025, 11 + i, 1)))
const line = (v: number[]) => v.map((d, i) => `${i ? 'L' : 'M'}${xs[i].toFixed(1)} ${y(d).toFixed(1)}`).join('')

/** HH and HV quicklook brightness across the 24 passes. Shares one 0-255 axis. */
export default memo(function Chart({ hh, hv, title }: { hh: number[]; hv: number[]; title: string }) {
  const marker = useRef<SVGGElement>(null)
  const [at, setAt] = useState<number | null>(null)

  // the "pass on screen" rule follows scroll without re-rendering the chart
  useEffect(() => {
    const move = () => {
      const p = useStore.getState().pass, i = Math.min(Math.floor(p), xs.length - 2)
      marker.current?.setAttribute('transform', `translate(${xs[i] + (xs[i + 1] - xs[i]) * (p - i)} 0)`)
    }
    move()
    return useStore.subscribe(move)
  }, [])

  const nearest = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - box.left) / box.width) * W
    setAt(xs.reduce((best, v, i) => (Math.abs(v - x) < Math.abs(xs[best] - x) ? i : best), 0))
  }

  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. HH rises from ${hh[0]} on ${fmtDate(passes[0].date)} to a peak of ${Math.max(...hh)}; HV stays between ${Math.min(...hv)} and ${Math.max(...hv)}.`} onPointerMove={nearest} onPointerLeave={() => setAt(null)}>
        {[0, 85, 170, 255].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        {months.map((m) => {
          const x = L + ((+m - t0) / (t1 - t0)) * (W - L - R)
          return <text key={+m} x={x} y={H - 6}>{m.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</text>
        })}
        <g ref={marker}><line y1={T} y2={H - B} className="now" /></g>
        <path d={line(hv)} className="hv" />
        <path d={line(hh)} className="hh" />
        <text x={W - R + 6} y={y(hh[hh.length - 1]) + 4} className="label">HH</text>
        <text x={W - R + 6} y={y(hv[hv.length - 1]) + (Math.abs(hh[hh.length - 1] - hv[hv.length - 1]) < 14 ? 16 : 4)} className="label">HV</text>
        {at !== null && (
          <g>
            <line x1={xs[at]} x2={xs[at]} y1={T} y2={H - B} className="grid" />
            <circle cx={xs[at]} cy={y(hh[at])} r="4" className="dot-hh" />
            <circle cx={xs[at]} cy={y(hv[at])} r="4" className="dot-hv" />
          </g>
        )}
      </svg>
      <p className="readout" aria-live="polite">
        {at === null ? 'Solid line is HH, dashed is HV. Point at the chart for values.' : `${fmtDate(passes[at].date)}: HH ${hh[at]}, HV ${hv[at]}`}
      </p>
    </figure>
  )
})
