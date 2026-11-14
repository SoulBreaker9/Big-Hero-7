import { useEffect, useRef, useState } from 'react'
import { lockScroll } from './motion'
import { useStore } from './store'

/**
 * Covers the page until the 3D scene has drawn real frames. The number is driven by what has actually arrived
 * (code, then radar images and the model, then the first frames) and cannot reach 100 before `ready`.
 */
export default function Loader() {
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null), num = useRef<HTMLSpanElement>(null), bar = useRef<HTMLElement>(null), step = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    lockScroll(true)
    let shown = 0, raf = 0, last = performance.now(), timer = 0
    const tick = (now: number) => {
      const { chunk, load, ready } = useStore.getState()
      const target = ready ? 100 : 5 + (chunk ? 15 : 0) + load * 72
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      shown += Math.max(0, Math.min(target - shown, dt * (ready ? 90 : 45))) // count at a pace the eye can follow, never backwards
      num.current!.textContent = String(Math.floor(shown)).padStart(3, '0')
      bar.current!.style.transform = `scaleX(${shown / 100})`
      step.current!.textContent = ready ? 'First light over Punjab' : load >= 1 ? 'Drawing the first frame' : chunk ? 'Receiving 24 radar passes and the NISAR model' : 'Waking the renderer'
      if (shown < 100) return void (raf = requestAnimationFrame(tick))
      useStore.setState({ revealed: true })
      lockScroll(false)
      root.current!.classList.add('out')
      timer = window.setTimeout(() => setGone(true), 1300)
    }
    raf = requestAnimationFrame(tick)
    const giveUp = window.setTimeout(() => useStore.setState({ ready: true }), 25000) // a slow GPU or network still gets the story
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); clearTimeout(giveUp); lockScroll(false) }
  }, [])

  if (gone) return null
  return (
    <div ref={root} className="loader" role="status" aria-label="Loading the radar images and the 3D model">
      <span lang="pa" className="breath" aria-hidden="true">ਸਾਹ</span>
      <span ref={num} className="loader-num" aria-hidden="true">000</span>
      <p ref={step} className="note" aria-hidden="true" />
      <i ref={bar} />
    </div>
  )
}
