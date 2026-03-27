import type { Bullet } from '../types.ts'

export function createBullet(
  x: number,
  y: number,
  vx: number,
  vy: number,
  from: Bullet['from'],
  life = 1.4,
): Bullet {
  return { x, y, vx, vy, life, from }
}

export function updateBullet(b: Bullet, dt: number, width: number, height: number): void {
  b.x += b.vx * dt
  b.y += b.vy * dt
  b.life -= dt

  const wrap = (v: number, max: number) => {
    if (v < 0) return v + max
    if (v >= max) return v - max
    return v
  }
  b.x = wrap(b.x, width)
  b.y = wrap(b.y, height)
}
