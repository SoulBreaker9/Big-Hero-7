// Text motion. Rise and Count began as React Bits' SplitText and CountUp (github.com/DavidHDev/react-bits, MIT + Commons Clause,
// © David Haz). They are rebuilt here on React-rendered spans. A chapter's `.on` class drives them, so text enters and leaves with its chapter.
import { Children, createContext, useContext, useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { gsap, reduced } from './motion'
import { useStore } from './store'

const Here = createContext(0)
/** True while this chapter's text is the one on screen (the hero also waits for the loader). */
export const useOn = () => {
  const i = useContext(Here)
  return useStore((s) => s.ch === i && s.revealed)
}

/** One story chapter: a tall scroll track with a sticky, full-height stage for its text. */
export function Chapter({ i, id, className = '', children }: { i: number; id?: string; className?: string; children: ReactNode }) {
  const on = useStore((s) => s.ch === i && s.revealed)
  return (
    <Here.Provider value={i}>
      <section data-scene id={id} className={`chapter ${className}`}>
        <div className={on ? 'stage-text on' : 'stage-text'} inert={!on || undefined}>
          <div className="copy" style={{ '--n': `"${String(i).padStart(2, '0')}"` } as CSSProperties}>{children}</div>
        </div>
      </section>
    </Here.Provider>
  )
}

/** Headline whose words rise out of a mask when the chapter arrives and lift away when it leaves. */
export function Rise({ as: Tag = 'h2', children, className = '' }: { as?: ElementType; children: ReactNode; className?: string }) {
  const words = Children.toArray(children).flatMap((c) => (typeof c === 'string' ? c.split(/\s+/).filter(Boolean) : [c]))
  const label = Children.toArray(children).every((c) => typeof c === 'string') ? Children.toArray(children).join('') : undefined
  return (
    <Tag className={`rise ${className}`} aria-label={label}>
      {words.flatMap((w, i) => [<span key={i} className="w" style={{ '--i': i } as CSSProperties} aria-hidden={label ? true : undefined}><span>{w}</span></span>, ' '])}
    </Tag>
  )
}

/** A number that counts up each time its chapter arrives. The final value is in the markup from the start. */
export function Count({ from, to, digits = 0 }: { from: number; to: number; digits?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const on = useOn()
  useEffect(() => {
    if (!on || reduced) return
    const v = { n: from }
    const t = gsap.to(v, { n: to, duration: 2, ease: 'power3.out', onUpdate: () => { ref.current!.textContent = v.n.toFixed(digits) } })
    return () => { t.kill(); if (ref.current) ref.current.textContent = to.toFixed(digits) }
  }, [on, from, to, digits])
  return <span ref={ref}>{to.toFixed(digits)}</span>
}
