/** Tuning knobs — adjust feel here */
export const FIXED_DT = 1 / 60

/**
 * Star Castle–inspired vector palette: warm barriers, cyan player, yellow core, black void.
 */
export const COLORS = {
  bg: '#000000',
  /** Player ship, shots, HUD accent, shield bar */
  player: '#48e8ff',
  playerMuted: '#1a8a9e',
  /** Score / status text */
  hud: '#5cefff',
  /** Secondary UI, labels */
  hudMuted: '#4a7a88',
  /** Title / menu highlight (magenta like classic attract text) */
  accent: '#e060ff',
  /** Keep core & gun */
  core: '#fff200',
  coreSoft: '#ffe855',
  /** Bubble shield */
  shield: '#7af8ff',
  /** Mines & turret shots */
  turretShot: '#ff5038',
} as const

/** Outermost ring = red, then lime, then gold (matches classic layered shields) */
export const RING_PALETTE = [
  { hi: '#ff3a28', lo: '#6e1008' },
  { hi: '#b4ff2a', lo: '#355a0c' },
  { hi: '#ffe93d', lo: '#6b5c10' },
] as const

/** Canvas text — loaded from Google Fonts in index.html */
export const FONTS = {
  display: '"Orbitron", system-ui, sans-serif',
  ui: '"Share Tech Mono", "Courier New", monospace',
} as const

export const SHIP = {
  turnSpeed: 5.0,
  thrust: 480,
  maxSpeed: 440,
  friction: 0.988,
  radius: 12,
  bulletSpeed: 620,
  fireInterval: 0.14,
  maxBullets: 4,
} as const

export const SHIELD = {
  maxEnergy: 1,
  rechargePerSec: 0.32,
  drainPerSec: 0.52,
  contactDrain: 0.22,
  minToActivate: 0.08,
} as const

export const CASTLE = {
  /** Fraction of min(w,h) for outer ring radius */
  outerRadiusFrac: 0.2,
  ringSpacing: 36,
  thickness: 7,
  gapArc: 0.62,
  hitsPerRing: 10,
  coreRadius: 14,
  coreHits: 8,
  /** Spin multiplier per level */
  spinPerLevel: 0.12,
} as const

export const TURRET = {
  baseCooldown: 2.0,
  bulletSpeed: 260,
  minCooldown: 0.55,
} as const

export const MINE = {
  spawnInterval: 4.5,
  maxAlive: 5,
  radius: 9,
  accel: 140,
  maxSpeed: 115,
  score: 150,
} as const

export const SCORE = {
  ringHit: 12,
  coreHit: 80,
  castleClear: 800,
  mine: MINE.score,
} as const

export const GAME = {
  initialLives: 3,
  respawnInvuln: 2.6,
} as const

/** Core destroyed → next castle */
export const WAVE_CLEAR = {
  duration: 2.55,
  shockSpeed: 520,
  /** Extra radial burst count */
  particleBurst: 118,
} as const

export const STORAGE_KEY = 'vector-keep-high-score'
