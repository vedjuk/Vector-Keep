import { FIXED_DT } from './constants.ts'

export type TickFn = (dt: number) => void
export type DrawFn = () => void

export function runGameLoop(tick: TickFn, draw: DrawFn): () => void {
  let raf = 0
  let last = performance.now()
  let acc = 0
  const maxCatchUp = FIXED_DT * 5

  const frame = (now: number) => {
    let elapsed = (now - last) / 1000
    last = now
    if (elapsed > 0.25) elapsed = 0.25
    acc += elapsed
    while (acc >= FIXED_DT) {
      tick(FIXED_DT)
      acc -= FIXED_DT
      if (acc > maxCatchUp) acc = maxCatchUp
    }
    draw()
    raf = requestAnimationFrame(frame)
  }

  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
