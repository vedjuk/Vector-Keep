import { MINE } from '../game/constants.ts'
import type { Mine } from '../types.ts'

export function createMine(x: number, y: number): Mine {
  return { x, y, vx: 0, vy: 0, alive: true }
}

export function updateMine(m: Mine, dt: number, px: number, py: number, width: number, height: number): void {
  if (!m.alive) return
  const dx = px - m.x
  const dy = py - m.y
  const len = Math.hypot(dx, dy)
  if (len > 0.5) {
    const ax = (dx / len) * MINE.accel * dt
    const ay = (dy / len) * MINE.accel * dt
    m.vx += ax
    m.vy += ay
    const sp = Math.hypot(m.vx, m.vy)
    if (sp > MINE.maxSpeed) {
      const s = MINE.maxSpeed / sp
      m.vx *= s
      m.vy *= s
    }
  }
  m.x += m.vx * dt
  m.y += m.vy * dt

  const wrap = (v: number, max: number) => {
    if (v < 0) return v + max
    if (v >= max) return v - max
    return v
  }
  m.x = wrap(m.x, width)
  m.y = wrap(m.y, height)
}
