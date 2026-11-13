import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** Same split as the CSS: text beside the block (wide) or cards under it (tall). */
export const WIDE = '(min-aspect-ratio: 85/100)'

let lenis: Lenis | undefined

/** Smooth wheel scrolling on GSAP's ticker, so scroll, ScrollTrigger and tweens share one frame. Touch stays native. */
export function startScroll() {
  if (reduced) return () => {}
  const l = (lenis = new Lenis({ lerp: 0.09, anchors: true, autoRaf: false }))
  l.on('scroll', ScrollTrigger.update)
  const raf = (t: number) => l.raf(t * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  return () => { gsap.ticker.remove(raf); l.destroy(); lenis = undefined }
}

/** The page cannot be scrolled while the loader is up. */
export function lockScroll(on: boolean) {
  document.documentElement.classList.toggle('locked', on)
  if (on) lenis?.stop()
  else lenis?.start()
}

export { gsap, ScrollTrigger }
