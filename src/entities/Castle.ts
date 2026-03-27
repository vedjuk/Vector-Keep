import { CASTLE, TURRET } from '../game/constants.ts'
import type { Bullet } from '../types.ts'
import type { Castle, CastleRing } from '../types.ts'
import { createBullet } from './Bullet.ts'

const TAU = Math.PI * 2

function normAngle(a: number): number {
  return ((a % TAU) + TAU) % TAU
}

/** Point angle `theta` lies in arc [start, start+arc] wrapping around circle */
function inOpenArc(theta: number, start: number, arc: number): boolean {
  if (arc >= TAU - 0.0001) return true
  const L = normAngle(theta)
  const S = normAngle(start)
  const E = normAngle(S + arc)
  if (S < E) return L >= S && L <= E
  return L >= S || L <= E
}

/** Gap in ring-local space: open from gap0 to gap0+gapArc */
export function pointInRingGap(ring: CastleRing, worldTheta: number): boolean {
  const local = normAngle(worldTheta - ring.angle)
  return inOpenArc(local, ring.gap0, ring.gapArc)
}

export function createCastle(cx: number, cy: number, minDim: number, level: number): Castle {
  const scale = 1 + Math.min(level - 1, 8) * 0.02
  const baseR = minDim * CASTLE.outerRadiusFrac * scale
  const rings: CastleRing[] = []
  for (let i = 0; i < 3; i++) {
    const radius = baseR - i * CASTLE.ringSpacing
    if (radius < CASTLE.coreRadius + 16) break
    const spinSign = i % 2 === 0 ? 1 : -1
    const spinBase = (0.35 + i * 0.08) * spinSign
    const spin = spinBase * (1 + (level - 1) * CASTLE.spinPerLevel)
    rings.push({
      radius,
      thickness: CASTLE.thickness,
      angle: Math.random() * TAU,
      spin,
      gap0: (i * TAU) / 3 + Math.random() * 0.4,
      gapArc: CASTLE.gapArc,
      hp: CASTLE.hitsPerRing,
      maxHp: CASTLE.hitsPerRing,
      alive: true,
      hitFlash: 0,
    })
  }
  return {
    cx,
    cy,
    rings,
    coreHp: CASTLE.coreHits,
    coreMax: CASTLE.coreHits,
    turretCd: 0.8,
    mineCd: 2,
    coreFlash: 0,
  }
}

export function updateCastleRings(castle: Castle, dt: number): void {
  for (const r of castle.rings) {
    if (!r.alive) continue
    r.angle = normAngle(r.angle + r.spin * dt)
  }
}

export function decayCastleFx(castle: Castle, dt: number): void {
  castle.coreFlash = Math.max(0, castle.coreFlash - dt)
  for (const r of castle.rings) {
    r.hitFlash = Math.max(0, r.hitFlash - dt)
  }
}

export function allRingsDestroyed(castle: Castle): boolean {
  return castle.rings.every((r) => !r.alive)
}

export function coreExposed(castle: Castle): boolean {
  return allRingsDestroyed(castle)
}

export type CastleBulletHit = 'none' | 'ring' | 'core'

export function damageCastleFromPlayerBullet(castle: Castle, bx: number, by: number): CastleBulletHit {
  const dx = bx - castle.cx
  const dy = by - castle.cy
  const dist = Math.hypot(dx, dy)
  const theta = Math.atan2(dy, dx)

  if (coreExposed(castle) && castle.coreHp > 0) {
    if (dist < CASTLE.coreRadius + 4) {
      castle.coreHp -= 1
      castle.coreFlash = Math.max(castle.coreFlash, 0.28)
      return 'core'
    }
    return 'none'
  }

  const sorted = castle.rings
    .map((r, i) => ({ r, i }))
    .filter((x) => x.r.alive)
    .sort((a, b) => b.r.radius - a.r.radius)

  const hitSlop = 4
  for (const { r } of sorted) {
    const band = r.thickness / 2 + hitSlop
    if (Math.abs(dist - r.radius) > band) continue
    if (pointInRingGap(r, theta)) return 'none'
    r.hp -= 1
    r.hitFlash = Math.max(r.hitFlash, 0.22)
    if (r.hp <= 0) r.alive = false
    return 'ring'
  }
  return 'none'
}

/** Ship center vs ring solid — for collision damage */
export function shipTouchesRingSolid(
  castle: Castle,
  sx: number,
  sy: number,
  shipRadius: number,
): boolean {
  const dx = sx - castle.cx
  const dy = sy - castle.cy
  const dist = Math.hypot(dx, dy)
  const theta = Math.atan2(dy, dx)

  for (const r of castle.rings) {
    if (!r.alive) continue
    const band = r.thickness / 2 + shipRadius
    if (Math.abs(dist - r.radius) > band) continue
    if (pointInRingGap(r, theta)) continue
    return true
  }
  return false
}

export function shipTouchesCore(castle: Castle, sx: number, sy: number, shipRadius: number): boolean {
  if (!coreExposed(castle) || castle.coreHp <= 0) return false
  const dx = sx - castle.cx
  const dy = sy - castle.cy
  return Math.hypot(dx, dy) < CASTLE.coreRadius + shipRadius
}

export function tryTurretFire(
  castle: Castle,
  targetX: number,
  targetY: number,
  level: number,
  dt: number,
): Bullet | null {
  castle.turretCd -= dt
  if (castle.turretCd > 0) return null
  const cd = Math.max(
    TURRET.minCooldown,
    TURRET.baseCooldown / (1 + (level - 1) * 0.08),
  )
  castle.turretCd = cd + Math.random() * 0.25
  const dx = targetX - castle.cx
  const dy = targetY - castle.cy
  const len = Math.hypot(dx, dy)
  if (len < 1) return null
  const ux = dx / len
  const uy = dy / len
  const muzzle = CASTLE.coreRadius + 6
  return createBullet(
    castle.cx + ux * muzzle,
    castle.cy + uy * muzzle,
    ux * TURRET.bulletSpeed,
    uy * TURRET.bulletSpeed,
    'turret',
    2.4,
  )
}
