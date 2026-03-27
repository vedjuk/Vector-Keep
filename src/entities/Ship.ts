import { SHIELD, SHIP } from '../game/constants.ts'
import type { InputSnapshot } from '../systems/Input.ts'
import type { Ship } from '../types.ts'

export function createShip(x: number, y: number): Ship {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    shieldEnergy: SHIELD.maxEnergy,
    shieldDrainBoost: 0,
  }
}

export function resetShip(ship: Ship, x: number, y: number): void {
  ship.x = x
  ship.y = y
  ship.vx = 0
  ship.vy = 0
  ship.angle = -Math.PI / 2
  ship.shieldDrainBoost = 0
}

export function updateShip(
  ship: Ship,
  input: InputSnapshot,
  dt: number,
  width: number,
  height: number,
  shieldHeld: boolean,
): void {
  if (input.left) ship.angle -= SHIP.turnSpeed * dt
  if (input.right) ship.angle += SHIP.turnSpeed * dt

  if (input.thrust) {
    ship.vx += Math.cos(ship.angle) * SHIP.thrust * dt
    ship.vy += Math.sin(ship.angle) * SHIP.thrust * dt
    const sp = Math.hypot(ship.vx, ship.vy)
    if (sp > SHIP.maxSpeed) {
      const s = SHIP.maxSpeed / sp
      ship.vx *= s
      ship.vy *= s
    }
  } else {
    ship.vx *= Math.pow(SHIP.friction, dt * 60)
    ship.vy *= Math.pow(SHIP.friction, dt * 60)
  }

  ship.x += ship.vx * dt
  ship.y += ship.vy * dt

  const wrap = (v: number, max: number) => {
    if (v < 0) return v + max
    if (v >= max) return v - max
    return v
  }
  ship.x = wrap(ship.x, width)
  ship.y = wrap(ship.y, height)

  ship.shieldDrainBoost = Math.max(0, ship.shieldDrainBoost - dt * 2)

  const active =
    shieldHeld && ship.shieldEnergy > SHIELD.minToActivate && ship.shieldEnergy > 0
  if (active) {
    ship.shieldEnergy -= (SHIELD.drainPerSec + ship.shieldDrainBoost) * dt
    if (ship.shieldEnergy < 0) ship.shieldEnergy = 0
  } else if (ship.shieldEnergy < SHIELD.maxEnergy) {
    ship.shieldEnergy = Math.min(
      SHIELD.maxEnergy,
      ship.shieldEnergy + SHIELD.rechargePerSec * dt,
    )
  }
}
