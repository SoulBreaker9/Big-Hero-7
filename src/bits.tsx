// Text motion adapted from React Bits (github.com/DavidHDev/react-bits, MIT + Commons Clause, © David Haz):
// SplitText -> Rise, ScrollReveal -> Read, CountUp -> Count. Cut down to what this page uses and rebuilt on
// React-rendered spans, so nothing rewrites the DOM behind React and the text re-wraps freely on resize.
import { useGSAP } from '@gsap/react'
import { Children, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { gsap, reduced, ScrollTrigger, WIDE } from './motion'

const split = (children: ReactNode, wrap: (word: ReactNode, i: number) => ReactNode) =>
  Children.toArray(children)
    .flatMap((c) => (typeof c === 'string' ? c.split(/\s+/).filter(Boolean) : [c]))
    .flatMap((w, i) => [wrap(w, i), ' '])
/** A panel sticks while its section scrolls, so scroll effects are timed by the section, not the element. */
const scene = (el: Element) => el.closest('[data-scene]') ?? el

/** Headline whose words rise out of a mask, arriving in the accent colour and settling to ink. `play` overrides the scroll trigger. */
export function Rise({ as: Tag = 'h2', play, children }: { as?: ElementType; play?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const tween = useRef<gsap.core.Tween>(null)
  useGSAP(() => {
    if (reduced) return
    tween.current = gsap.from(ref.current!.querySelectorAll('.w > span'), {
      yPercent: 118, duration: 1.05, ease: 'expo.out', stagger: 0.045,
      onStart: () => ref.current!.classList.add('lit'), // the colour settles in CSS, so it follows the sky's ink
      paused: play !== undefined,
      scrollTrigger: play === undefined ? { trigger: scene(ref.current!), start: 'top 52%', once: true } : undefined,
    })
  }, { scope: ref })
  useGSAP(() => { if (play) tween.current?.play() }, [play])
  const plain = typeof children === 'string'
  return (
    <Tag ref={ref} className="rise" aria-label={plain ? children : undefined}>
      {split(children, (w, i) => <span key={i} className="w" style={{ '--i': i } as CSSProperties} aria-hidden={plain || undefined}><span>{w}</span></span>)}
    </Tag>
  )
}

/** Paragraph that lights up word by word as you scroll through it, each word flashing the accent as it is reached. */
export function Read({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useGSAP(() => {
    if (reduced) return
    const words = [...ref.current!.querySelectorAll<HTMLElement>('span')], span = 6, last = new Float32Array(words.length).fill(-1)
    const paint = (progress: number) => {
      const head = progress * (words.length + span)
      words.forEach((w, i) => {
        const t = Math.min(Math.max((head - i) / span, 0), 1)
        if (t === last[i]) return // most words are fully lit or fully dim on any given frame
        last[i] = t
        const glow = t <= 0 || t >= 1 ? 0 : Math.sin(t * Math.PI)
        w.style.opacity = t >= 1 ? '' : (0.24 + 0.76 * t).toFixed(3)
        w.style.color = glow > 0.01 ? `color-mix(in srgb, var(--paddy) ${(glow * 85).toFixed(0)}%, currentColor)` : ''
      })
    }
    const mm = gsap.matchMedia()
    const watch = (trigger: Element, start: string, end: string) => { paint(0); ScrollTrigger.create({ trigger, start, end, onUpdate: (s) => paint(s.progress), onRefresh: (s) => paint(s.progress) }) }
    mm.add(WIDE, () => watch(scene(ref.current!), 'top 46%', '+=42%'))
    mm.add(`not ${WIDE}`, () => watch(ref.current!, 'top 88%', 'top 42%'))
  }, { scope: ref })
  return <p ref={ref} className={className}>{split(children, (w, i) => <span key={i}>{w}</span>)}</p>
}

/** A number that counts up to its value once its section arrives. The final value is in the markup from the start. */
export function Count({ from, to }: { from: number; to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    if (reduced) return
    const v = { n: from }
    gsap.to(v, { n: to, duration: 2.2, ease: 'power2.out', onUpdate: () => { ref.current!.textContent = String(Math.round(v.n)) }, scrollTrigger: { trigger: scene(ref.current!), start: 'top 52%', once: true } })
  }, { scope: ref })
  return <span ref={ref} className="count">{to}</span>
}
