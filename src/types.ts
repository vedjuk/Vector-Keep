export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover'

export interface Ship {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  shieldEnergy: number
  shieldDrainBoost: number
}

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  from: 'player' | 'turret'
}

export interface CastleRing {
  radius: number
  thickness: number
  angle: number
  spin: number
  /** Gap start in ring-local radians (opening rotates with the ring) */
  gap0: number
  gapArc: number
  hp: number
  maxHp: number
  alive: boolean
  /** Seconds of hit flash for feedback */
  hitFlash: number
}

export interface Castle {
  cx: number
  cy: number
  rings: CastleRing[]
  coreHp: number
  coreMax: number
  turretCd: number
  mineCd: number
  /** Core hit flash (seconds) */
  coreFlash: number
}

export interface Mine {
  x: number
  y: number
  vx: number
  vy: number
  alive: boolean
}

export type ParticleTint = 0 | 1 | 2

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  /** 0 vector green, 1 core orange, 2 white */
  tint?: ParticleTint
  /** Half-size in px (default 1 → 2×2 rect) */
  size?: number
}
