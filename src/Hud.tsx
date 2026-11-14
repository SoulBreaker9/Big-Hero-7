import { useEffect, useRef } from 'react'
import { fmtDate, N, passes, useStore } from './store'

const DAY = 864e5
const t0 = Date.parse(passes[0].date), t1 = Date.parse(passes[N - 1].date)
const have = new Set(passes.map((p) => p.date))
// every 12-day slot of the repeat cycle, so the passes NISAR missed show up as gaps
const slots = Array.from({ length: Math.round((t1 - t0) / DAY / 12) + 1 }, (_, i) => new Date(t0 + i * 12 * DAY).toISOString().slice(0, 10))
const PARTS = ['NISAR L-band · track 156 · 05:43 IST', '01 The overdraft', '02 Under the fields', '03 The blind spot', '04 One year from orbit', '05 The rice test', '06 The method', '07 The second radar', '08 Ground truth', '09 Look for yourself']
const pct = (iso: string) => ((Date.parse(iso) - t0) / (t1 - t0)) * 100

/** Fixed instrument strip: what is on screen right now, written straight to the DOM on scroll. */
export default function Hud() {
  const label = useRef<HTMLSpanElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const mid = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let shown = -1, part = -1
    const sync = () => {
      const { pass, s } = useStore.getState(), i = Math.round(pass), p = Math.min(Math.max(Math.round(s), 0), PARTS.length - 1)
      if (p !== part && mid.current) mid.current.textContent = PARTS[(part = p)]
      const a = Math.min(Math.floor(pass), N - 2)
      if (cursor.current) cursor.current.style.left = pct(passes[a].date) + (pct(passes[a + 1].date) - pct(passes[a].date)) * (pass - a) + '%'
      if (i !== shown && label.current) label.current.textContent = `Pass ${(shown = i) + 1} of ${N}, ${fmtDate(passes[i].date)}`
    }
    sync()
    return useStore.subscribe(sync)
  }, [])

  return (
    <>
      <header className="hud">
        <a href="#top" className="mark"><span lang="pa">ਸਾਹ</span> Saah</a>
        <span ref={mid} className="hud-mid">{PARTS[0]}</span>
        <span ref={label} className="hud-pass" />
      </header>
      <div className="ruler" aria-hidden="true">
        <span>Nov 2025</span>
        <div className="ticks">
          {slots.map((d) => <i key={d} className={have.has(d) ? '' : 'gap'} style={{ left: pct(d) + '%' }} />)}
          <div ref={cursor} className="cursor" />
        </div>
        <span>Nov 2026</span>
      </div>
      <output id="stats" className="stats" />
    </>
  )
}
