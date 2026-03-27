import * as Sound from '../audio/Sound.ts'
import { createBullet, updateBullet } from '../entities/Bullet.ts'
import {
  allRingsDestroyed,
  createCastle,
  damageCastleFromPlayerBullet,
  decayCastleFx,
  shipTouchesCore,
  shipTouchesRingSolid,
  tryTurretFire,
  updateCastleRings,
} from '../entities/Castle.ts'
import { createMine, updateMine } from '../entities/Mine.ts'
import { createShip, resetShip, updateShip } from '../entities/Ship.ts'
import { CanvasRenderer } from '../render/CanvasRenderer.ts'
import { circlesOverlap } from '../systems/Collision.ts'
import type { InputSystem } from '../systems/Input.ts'
import type { Bullet, Castle, Mine, Particle, ParticleTint } from '../types.ts'
import {
  CASTLE,
  GAME,
  MINE,
  SCORE,
  SHIELD,
  SHIP,
  STORAGE_KEY,
  WAVE_CLEAR,
} from './constants.ts'

export class Game {
  width = 800
  height = 600
  phase: 'title' | 'playing' | 'paused' | 'gameover' = 'title'
  level = 1
  score = 0
  lives = GAME.initialLives
  highScore = 0

  ship = createShip(400, 300)
  castle: Castle
  bullets: Bullet[] = []
  enemyBullets: Bullet[] = []
  mines: Mine[] = []
  particles: Particle[] = []

  fireCooldown = 0
  invuln = 0
  thrustSfxTimer = 0

  /** >0 while core-explosion celebration runs (seconds remaining) */
  waveClearT = 0
  explosionWaveR = 0

  private readonly renderer: CanvasRenderer
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly input: InputSystem

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    input: InputSystem,
  ) {
    this.canvas = canvas
    this.ctx = ctx
    this.input = input
    this.renderer = new CanvasRenderer(ctx)
    this.highScore = this.loadHighScore()
    const iw = window.innerWidth
    const ih = window.innerHeight
    this.castle = createCastle(iw / 2, ih / 2, Math.min(iw, ih), 1)
    this.applySize()
    window.addEventListener('resize', () => this.applySize())
  }

  private applySize(): void {
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    this.canvas.width = Math.floor(w * dpr)
    this.canvas.height = Math.floor(h * dpr)
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.width = w
    this.height = h
    this.renderer.resize(w, h)
    this.castle.cx = w / 2
    this.castle.cy = h / 2
  }

  private loadHighScore(): number {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v == null) return 0
      const n = Number.parseInt(v, 10)
      return Number.isFinite(n) ? n : 0
    } catch {
      return 0
    }
  }

  private saveHighScore(): void {
    if (this.score <= this.highScore) return
    this.highScore = this.score
    try {
      localStorage.setItem(STORAGE_KEY, String(this.highScore))
    } catch {
      /* ignore */
    }
  }

  private startPlaying(): void {
    Sound.resumeAudio()
    this.phase = 'playing'
    this.level = 1
    this.score = 0
    this.lives = GAME.initialLives
    this.bullets = []
    this.enemyBullets = []
    this.mines = []
    this.particles = []
    resetShip(this.ship, this.width * 0.22, this.height / 2)
    this.invuln = GAME.respawnInvuln
    this.fireCooldown = 0
    this.thrustSfxTimer = 0
    this.waveClearT = 0
    this.explosionWaveR = 0
    this.castle = createCastle(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height),
      this.level,
    )
  }

  private beginWaveClear(): void {
    this.waveClearT = WAVE_CLEAR.duration
    this.explosionWaveR = 0
    this.score += SCORE.castleClear
    this.saveHighScore()
    Sound.playCoreDestroyed()
    this.spawnCoreExplosion(this.castle.cx, this.castle.cy)
    this.bullets = []
    this.enemyBullets = []
    this.mines = []
  }

  private finishWaveClear(): void {
    this.level += 1
    this.castle = createCastle(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height),
      this.level,
    )
    this.mines = []
    this.enemyBullets = []
    this.waveClearT = 0
    this.explosionWaveR = 0
    Sound.playCastleClear()
  }

  private spawnParticles(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 40 + Math.random() * 220
      const life = 0.35 + Math.random() * 0.35
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        maxLife: life,
      })
    }
  }

  private spawnCoreExplosion(cx: number, cy: number): void {
    const n = WAVE_CLEAR.particleBurst
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 55 + Math.random() * 440
      const life = 0.5 + Math.random() * 0.95
      const roll = Math.random()
      const tint: ParticleTint = roll > 0.7 ? 2 : roll > 0.34 ? 1 : 0
      const size = roll > 0.86 ? 2 : 1
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 14,
        y: cy + (Math.random() - 0.5) * 14,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        maxLife: life,
        tint,
        size,
      })
    }
    for (let j = 0; j < 40; j++) {
      const a = Math.random() * Math.PI * 2
      const dist = 18 + Math.random() * 48
      const life = 0.85 + Math.random() * 0.75
      this.particles.push({
        x: cx + Math.cos(a) * dist,
        y: cy + Math.sin(a) * dist,
        vx: -Math.cos(a) * (25 + Math.random() * 70),
        vy: -Math.sin(a) * (25 + Math.random() * 70),
        life,
        maxLife: life,
        tint: 1,
        size: 1,
      })
    }
  }

  private hitShip(): void {
    if (this.invuln > 0) return
    const shieldOn =
      this.input.snapshot().shield &&
      this.ship.shieldEnergy > SHIELD.minToActivate &&
      this.ship.shieldEnergy > 0
    if (shieldOn) {
      this.ship.shieldEnergy = Math.max(0, this.ship.shieldEnergy - 0.45)
      this.ship.shieldDrainBoost = 1.2
      Sound.playShieldHit()
      return
    }
    Sound.playExplosion()
    this.spawnParticles(this.ship.x, this.ship.y, 28)
    this.lives -= 1
    if (this.lives <= 0) {
      this.phase = 'gameover'
      this.saveHighScore()
      return
    }
    resetShip(this.ship, this.width * 0.22, this.height / 2)
    this.invuln = GAME.respawnInvuln
    this.bullets = []
  }

  update(dt: number): void {
    const inp = this.input.snapshot()

    if (this.phase === 'title') {
      if (this.input.confirmEdge()) this.startPlaying()
      return
    }

    if (this.phase === 'gameover') {
      if (this.input.confirmEdge() || this.input.restartEdge()) this.startPlaying()
      return
    }

    if (this.input.pauseEdge() && this.waveClearT <= 0) {
      if (this.phase === 'playing') this.phase = 'paused'
      else if (this.phase === 'paused') this.phase = 'playing'
    }

    if (this.phase === 'paused') return
    if (this.phase !== 'playing') return

    if (this.waveClearT > 0) {
      this.waveClearT -= dt
      this.explosionWaveR += dt * WAVE_CLEAR.shockSpeed
      const shieldHeld = inp.shield
      updateShip(this.ship, inp, dt, this.width, this.height, shieldHeld)
      if (inp.thrust && this.thrustSfxTimer <= 0) {
        this.thrustSfxTimer = 0.09
        Sound.playThrust()
      }
      this.thrustSfxTimer -= dt
      for (const p of this.particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dt
        p.vx *= 1 - 0.35 * dt
        p.vy *= 1 - 0.35 * dt
      }
      this.particles = this.particles.filter((p) => p.life > 0)
      if (this.waveClearT <= 0) this.finishWaveClear()
      return
    }

    this.fireCooldown = Math.max(0, this.fireCooldown - dt)
    this.invuln = Math.max(0, this.invuln - dt)
    this.thrustSfxTimer -= dt

    const shieldHeld = inp.shield
    updateShip(this.ship, inp, dt, this.width, this.height, shieldHeld)

    if (inp.thrust && this.thrustSfxTimer <= 0) {
      this.thrustSfxTimer = 0.09
      Sound.playThrust()
    }

    updateCastleRings(this.castle, dt)
    decayCastleFx(this.castle, dt)

    if (
      inp.fire &&
      this.fireCooldown <= 0 &&
      this.bullets.filter((b) => b.from === 'player').length < SHIP.maxBullets
    ) {
      this.fireCooldown = SHIP.fireInterval
      const vx = Math.cos(this.ship.angle) * SHIP.bulletSpeed + this.ship.vx
      const vy = Math.sin(this.ship.angle) * SHIP.bulletSpeed + this.ship.vy
      this.bullets.push(
        createBullet(
          this.ship.x + Math.cos(this.ship.angle) * (SHIP.radius + 4),
          this.ship.y + Math.sin(this.ship.angle) * (SHIP.radius + 4),
          vx,
          vy,
          'player',
        ),
      )
      Sound.playShoot()
    }

    const turretBullet = tryTurretFire(
      this.castle,
      this.ship.x,
      this.ship.y,
      this.level,
      dt,
    )
    if (turretBullet) this.enemyBullets.push(turretBullet)

    this.castle.mineCd -= dt
    if (this.castle.mineCd <= 0) {
      const alive = this.mines.filter((m) => m.alive).length
      if (alive < MINE.maxAlive) {
        const interval = Math.max(1.8, MINE.spawnInterval - (this.level - 1) * 0.25)
        this.castle.mineCd = interval + Math.random() * 1.2
        const outer = this.castle.rings.find((r) => r.alive)
        const r =
          outer?.radius ?? Math.min(this.width, this.height) * CASTLE.outerRadiusFrac
        const a = Math.random() * Math.PI * 2
        const mx = this.castle.cx + Math.cos(a) * (r + 14)
        const my = this.castle.cy + Math.sin(a) * (r + 14)
        this.mines.push(createMine(mx, my))
        Sound.playMineSpawn()
      } else {
        this.castle.mineCd = 0.5
      }
    }
    for (const m of this.mines) {
      if (m.alive) updateMine(m, dt, this.ship.x, this.ship.y, this.width, this.height)
    }

    for (const b of this.bullets) updateBullet(b, dt, this.width, this.height)
    for (const b of this.enemyBullets) updateBullet(b, dt, this.width, this.height)

    const shieldActive =
      shieldHeld &&
      this.ship.shieldEnergy > SHIELD.minToActivate &&
      this.ship.shieldEnergy > 0

    for (const b of this.bullets) {
      if (b.from !== 'player' || b.life <= 0) continue
      const hit = damageCastleFromPlayerBullet(this.castle, b.x, b.y)
      if (hit === 'none') continue
      b.life = 0
      if (hit === 'ring') {
        Sound.playRingHit()
        this.score += SCORE.ringHit
      } else {
        if (this.castle.coreHp > 0) Sound.playCoreHit()
        this.score += SCORE.coreHit
      }
      this.saveHighScore()
    }

    if (
      this.castle.coreHp <= 0 &&
      allRingsDestroyed(this.castle) &&
      this.waveClearT <= 0
    ) {
      this.beginWaveClear()
    }

    for (const b of this.bullets) {
      if (b.from !== 'player' || b.life <= 0) continue
      const mi = this.mines.findIndex(
        (m) => m.alive && circlesOverlap(b.x, b.y, 3, m.x, m.y, MINE.radius),
      )
      if (mi >= 0) {
        b.life = 0
        this.mines[mi].alive = false
        this.score += SCORE.mine
        this.spawnParticles(this.mines[mi].x, this.mines[mi].y, 12)
        Sound.playExplosion()
        this.saveHighScore()
      }
    }

    for (const b of this.enemyBullets) {
      if (circlesOverlap(b.x, b.y, 3, this.ship.x, this.ship.y, SHIP.radius)) {
        b.life = 0
        if (this.invuln <= 0) {
          const sh =
            shieldHeld &&
            this.ship.shieldEnergy > SHIELD.minToActivate &&
            this.ship.shieldEnergy > 0
          if (sh) {
            this.ship.shieldEnergy = Math.max(0, this.ship.shieldEnergy - 0.35)
            Sound.playShieldHit()
          } else {
            this.hitShip()
          }
        }
      }
    }

    this.bullets = this.bullets.filter((b) => b.life > 0)
    this.enemyBullets = this.enemyBullets.filter((b) => b.life > 0)

    if (this.invuln <= 0) {
      if (shipTouchesRingSolid(this.castle, this.ship.x, this.ship.y, SHIP.radius)) {
        if (shieldActive) {
          this.ship.shieldEnergy = Math.max(0, this.ship.shieldEnergy - SHIELD.contactDrain * 10 * dt)
          Sound.playShieldHit()
        } else {
          this.hitShip()
        }
      } else if (shipTouchesCore(this.castle, this.ship.x, this.ship.y, SHIP.radius)) {
        if (shieldActive) {
          this.ship.shieldEnergy = Math.max(0, this.ship.shieldEnergy - 0.4 * dt * 10)
          Sound.playShieldHit()
        } else {
          this.hitShip()
        }
      }
    }

    for (const m of this.mines) {
      if (!m.alive || this.invuln > 0) continue
      if (circlesOverlap(this.ship.x, this.ship.y, SHIP.radius, m.x, m.y, MINE.radius)) {
        if (shieldActive) {
          this.ship.shieldEnergy = Math.max(0, this.ship.shieldEnergy - 0.55)
          m.alive = false
          this.spawnParticles(m.x, m.y, 14)
          Sound.playExplosion()
        } else {
          this.hitShip()
        }
        break
      }
    }

    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  render(): void {
    const w = this.width
    const h = this.height
    this.renderer.clear(w, h)
    this.renderer.drawStarfield(w, h)

    if (this.phase === 'title') {
      this.renderer.drawTitle()
      this.renderer.drawHelpFooter()
      return
    }

    this.renderer.drawCastle(this.castle)
    if (this.waveClearT > 0) {
      const elapsed = WAVE_CLEAR.duration - this.waveClearT
      this.renderer.drawCoreExplosionFx(
        this.castle.cx,
        this.castle.cy,
        this.explosionWaveR,
        Math.min(w, h),
        elapsed,
      )
      this.renderer.drawWaveClearBanner(this.level)
    }
    for (const m of this.mines) this.renderer.drawMine(m)
    for (const b of this.bullets) this.renderer.drawBullet(b)
    for (const b of this.enemyBullets) this.renderer.drawBullet(b)
    for (const p of this.particles) this.renderer.drawParticle(p)

    const blink = Math.floor(performance.now() / 100) % 2 === 0
    const shieldVisual =
      this.input.snapshot().shield && this.ship.shieldEnergy > 0.02
    this.renderer.drawShip(this.ship, shieldVisual, this.invuln > 0, blink)

    this.renderer.drawHud(
      this.phase,
      this.score,
      this.lives,
      this.level,
      this.highScore,
      this.ship,
    )

    if (this.phase === 'paused') this.renderer.drawPaused()
    if (this.phase === 'gameover') {
      this.renderer.drawGameOver(this.score, Math.max(this.highScore, this.score))
    }
    this.renderer.drawHelpFooter()
  }

  dispose(): void {
    this.input.dispose()
  }
}
