import { CASTLE, COLORS, FONTS, MINE, RING_PALETTE, SHIP } from '../game/constants.ts'
import type { Bullet, Castle, CastleRing, GamePhase, Mine, Particle, ParticleTint, Ship } from '../types.ts'
import { pointInRingGap } from '../entities/Castle.ts'

const TAU = Math.PI * 2

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.slice(1)
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => n.toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function lerpColor(a: string, b: string, t: number): string {
  const u = Math.min(1, Math.max(0, t))
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex(
    Math.round(A[0] + (B[0] - A[0]) * u),
    Math.round(A[1] + (B[1] - A[1]) * u),
    Math.round(A[2] + (B[2] - A[2]) * u),
  )
}

/** Outermost alive ring = 0 → red, then lime, then gold */
function ringPaletteRank(ring: CastleRing, castle: Castle): number {
  const alive = castle.rings.filter((r) => r.alive)
  const sorted = [...alive].sort((a, b) => b.radius - a.radius)
  const i = sorted.indexOf(ring)
  return i < 0 ? 0 : i
}

function fract(n: number): number {
  return n - Math.floor(n)
}

function starAt(
  i: number,
  w: number,
  h: number,
): { x: number; y: number; a: number; big: boolean } {
  const u = fract(Math.sin(i * 12.9898 + 78.233) * 43758.5453123)
  const v = fract(Math.sin(i * 78.233 + 19.9898) * 23421.631592)
  const a = fract(Math.sin(i * 45.164 + 94.615) * 31415.92653)
  return {
    x: u * w,
    y: v * h,
    a: 0.1 + a * 0.42,
    big: a > 0.82,
  }
}

export class CanvasRenderer {
  private stars: { x: number; y: number; a: number; big: boolean }[] = []
  private viewW = 800
  private viewH = 600
  private readonly ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  resize(width: number, height: number): void {
    this.viewW = width
    this.viewH = height
    this.stars = Array.from({ length: 160 }, (_, i) => starAt(i, width, height))
  }

  clear(width: number, height: number): void {
    const { ctx } = this
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, width, height)
  }

  drawStarfield(width: number, height: number): void {
    const { ctx } = this
    for (const s of this.stars) {
      if (s.x > width || s.y > height) continue
      const cool = s.big ? '230,248,255' : '200,230,255'
      ctx.fillStyle = `rgba(${cool},${s.a * 0.95})`
      const sz = s.big ? 2 : 1
      ctx.fillRect(s.x, s.y, sz, sz)
    }
  }

  drawCastle(castle: Castle): void {
    const { ctx } = this
    const { cx, cy } = castle
    const segs = 56
    const nowSec = performance.now() / 1000

    for (const ring of castle.rings) {
      if (!ring.alive) continue
      const rank = ringPaletteRank(ring, castle)
      const pal = RING_PALETTE[Math.min(rank, RING_PALETTE.length - 1)]
      const hpFrac = ring.maxHp > 0 ? ring.hp / ring.maxHp : 0
      const worn = lerpColor(pal.lo, pal.hi, 0.08 + hpFrac * 0.92)
      const flashAmt = Math.min(1, ring.hitFlash / 0.16)
      const strokeCol = flashAmt > 0.005 ? lerpColor(worn, '#ffffff', flashAmt * 0.92) : worn
      const lineW = ring.thickness * (1 + 0.55 * flashAmt)
      ctx.strokeStyle = strokeCol
      ctx.lineWidth = lineW
      ctx.lineCap = 'round'
      for (let i = 0; i < segs; i++) {
        const t0 = (i / segs) * TAU
        const t1 = ((i + 1) / segs) * TAU
        const mid = (t0 + t1) / 2
        if (pointInRingGap(ring, ring.angle + mid)) continue
        const x0 = cx + Math.cos(ring.angle + t0) * ring.radius
        const y0 = cy + Math.sin(ring.angle + t0) * ring.radius
        const x1 = cx + Math.cos(ring.angle + t1) * ring.radius
        const y1 = cy + Math.sin(ring.angle + t1) * ring.radius
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
    }

    if (castle.coreHp <= 0) return

    const shielded = castle.rings.some((r) => r.alive)

    if (shielded) {
      const rGun = CASTLE.coreRadius * 0.52
      const pulse = 0.62 + 0.18 * Math.sin(nowSec * 3.4)
      const br = nowSec * 1.1
      ctx.save()
      ctx.globalAlpha = pulse
      ctx.fillStyle = 'rgba(255, 230, 60, 0.2)'
      ctx.beginPath()
      ctx.arc(cx, cy, rGun + 4, 0, TAU)
      ctx.fill()
      ctx.globalAlpha = 0.9
      ctx.strokeStyle = COLORS.coreSoft
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, rGun, 0, TAU)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(br) * 2.5, cy + Math.sin(br) * 2.5)
      ctx.lineTo(cx + Math.cos(br) * (rGun + 7), cy + Math.sin(br) * (rGun + 7))
      ctx.stroke()
      ctx.globalAlpha = 0.55
      ctx.beginPath()
      ctx.moveTo(cx - 4, cy)
      ctx.lineTo(cx + 4, cy)
      ctx.moveTo(cx, cy - 4)
      ctx.lineTo(cx, cy + 4)
      ctx.stroke()
      ctx.restore()
      return
    }

    const f = Math.min(1, castle.coreFlash / 0.2)
    ctx.save()
    ctx.strokeStyle = lerpColor(COLORS.core, '#fffef0', f * 0.9)
    ctx.lineWidth = 2 + f * 4
    ctx.beginPath()
    ctx.arc(cx, cy, CASTLE.coreRadius, 0, TAU)
    ctx.stroke()
    ctx.globalAlpha = 0.2 + f * 0.35
    ctx.fillStyle = COLORS.core
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(4, CASTLE.coreRadius - 3), 0, TAU)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.lineWidth = 2
    ctx.strokeStyle = lerpColor(COLORS.core, '#ffffff', f * 0.5)
    ctx.beginPath()
    ctx.moveTo(cx - 7, cy)
    ctx.lineTo(cx + 7, cy)
    ctx.moveTo(cx, cy - 7)
    ctx.lineTo(cx, cy + 7)
    ctx.stroke()
    ctx.restore()
  }

  drawMine(m: Mine): void {
    if (!m.alive) return
    const { ctx } = this
    ctx.strokeStyle = COLORS.turretShot
    ctx.lineWidth = 2
    ctx.beginPath()
    const r = MINE.radius
    ctx.moveTo(m.x - r, m.y - r)
    ctx.lineTo(m.x + r, m.y + r)
    ctx.moveTo(m.x + r, m.y - r)
    ctx.lineTo(m.x - r, m.y + r)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(m.x, m.y, r * 0.45, 0, TAU)
    ctx.stroke()
  }

  drawShip(
    ship: Ship,
    shieldActive: boolean,
    invulnerable: boolean,
    blinkOn: boolean,
  ): void {
    if (invulnerable && !blinkOn) return
    const { ctx } = this
    ctx.save()
    ctx.translate(ship.x, ship.y)
    ctx.rotate(ship.angle)
    ctx.strokeStyle = COLORS.player
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(SHIP.radius * 1.45, 0)
    ctx.lineTo(SHIP.radius * -0.82, SHIP.radius * 0.78)
    ctx.lineTo(SHIP.radius * -0.55, 0)
    ctx.lineTo(SHIP.radius * -0.82, -SHIP.radius * 0.78)
    ctx.closePath()
    ctx.stroke()

    if (shieldActive && ship.shieldEnergy > 0.02) {
      ctx.strokeStyle = COLORS.shield
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.35 + ship.shieldEnergy * 0.45
      ctx.beginPath()
      ctx.arc(0, 0, SHIP.radius + 14 + Math.sin(performance.now() / 120) * 2, 0, TAU)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }

  drawBullet(b: Bullet): void {
    const { ctx } = this
    ctx.fillStyle = b.from === 'turret' ? COLORS.turretShot : COLORS.player
    ctx.fillRect(b.x - 2, b.y - 2, 4, 4)
  }

  drawParticle(p: Particle): void {
    const { ctx } = this
    const maxL = p.maxLife > 0 ? p.maxLife : Math.max(p.life, 0.001)
    const fade = Math.max(0, p.life / maxL)
    const a = Math.min(1, fade * 1.15)
    const tint: ParticleTint = p.tint ?? 0
    const sz = p.size ?? 1
    let r: number
    let g: number
    let b: number
    if (tint === 2) {
      r = 255
      g = 252
      b = 245
    } else if (tint === 1) {
      r = 255
      g = 190
      b = 90
    } else {
      r = 72
      g = 232
      b = 255
    }
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`
    ctx.fillRect(p.x - sz, p.y - sz, sz * 2, sz * 2)
  }

  /** Expanding rings + white bloom after core destruction */
  drawCoreExplosionFx(
    cx: number,
    cy: number,
    shockRadius: number,
    viewMin: number,
    elapsed: number,
  ): void {
    const { ctx } = this
    const maxR = viewMin * 0.58
    const t = Math.min(1, shockRadius / maxR)

    ctx.save()
    const bloom = Math.max(0, 0.42 - elapsed * 1.15)
    if (bloom > 0.02) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.85)
      g.addColorStop(0, `rgba(255, 250, 230, ${bloom * 0.35})`)
      g.addColorStop(0.35, `rgba(255, 200, 120, ${bloom * 0.2})`)
      g.addColorStop(1, 'rgba(255, 200, 120, 0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, this.viewW, this.viewH)
    }

    const a1 = Math.max(0, (1 - t) * 0.72)
    if (a1 > 0.03 && shockRadius > 4) {
      ctx.strokeStyle = `rgba(255, 248, 220, ${a1})`
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(cx, cy, shockRadius, 0, TAU)
      ctx.stroke()
    }

    const r2 = shockRadius * 0.78
    const a2 = Math.max(0, (1 - t * 1.05) * 0.45)
    if (a2 > 0.03 && r2 > 4) {
      ctx.strokeStyle = `rgba(80, 235, 255, ${a2})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, r2, 0, TAU)
      ctx.stroke()
    }

    const r3 = shockRadius * 0.42
    const a3 = Math.max(0, (1 - t * 1.2) * 0.35)
    if (a3 > 0.04 && r3 > 2) {
      ctx.strokeStyle = `rgba(255, 184, 77, ${a3})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, r3, 0, TAU)
      ctx.stroke()
    }
    ctx.restore()
  }

  drawWaveClearBanner(levelCompleted: number): void {
    const { ctx } = this
    const w = this.viewW
    const h = this.viewH
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 26px ${FONTS.display}`
    ctx.shadowColor = 'rgba(255, 100, 40, 0.75)'
    ctx.shadowBlur = 14
    ctx.fillStyle = COLORS.coreSoft
    ctx.fillText('KEEP DESTROYED', w / 2, h / 2 - 18)
    ctx.shadowBlur = 0
    ctx.font = `16px ${FONTS.ui}`
    ctx.fillStyle = COLORS.hud
    ctx.fillText(`LEVEL ${levelCompleted} CLEAR`, w / 2, h / 2 + 14)
    ctx.restore()
  }

  drawHud(
    phase: GamePhase,
    score: number,
    lives: number,
    level: number,
    high: number,
    ship: Ship,
  ): void {
    const { ctx } = this
    ctx.save()
    ctx.fillStyle = COLORS.hud
    ctx.font = `16px ${FONTS.ui}`
    ctx.textBaseline = 'top'
    if (phase === 'playing' || phase === 'paused') {
      ctx.fillText(`SCORE ${score}`, 16, 14)
      ctx.fillText(`HI ${high}`, 16, 34)
      ctx.fillText(`LEVEL ${level}`, 16, 54)
      ctx.fillText(`SHIPS ${lives}`, 16, 74)
      const bw = 120
      ctx.strokeStyle = COLORS.hudMuted
      ctx.strokeRect(16, 96, bw, 8)
      ctx.fillStyle = COLORS.player
      ctx.fillRect(17, 97, Math.max(0, (bw - 2) * ship.shieldEnergy), 6)
    }
    ctx.restore()
  }

  drawTitle(): void {
    const { ctx } = this
    const w = this.viewW
    const h = this.viewH
    const cx = w / 2
    const cy = h / 2
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const titlePx = Math.max(28, Math.min(52, Math.floor(w * 0.1)))
    ctx.font = `900 ${titlePx}px ${FONTS.display}`
    const tw = titlePx * 7.2
    const g = ctx.createLinearGradient(cx - tw / 2, cy - 120, cx + tw / 2, cy - 120)
    g.addColorStop(0, '#ff6a18')
    g.addColorStop(0.45, '#ffd030')
    g.addColorStop(1, '#ff4810')
    ctx.shadowColor = 'rgba(255, 120, 30, 0.9)'
    ctx.shadowBlur = 22
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(120, 30, 0, 0.85)'
    ctx.strokeText('VECTOR KEEP', cx, cy - 120)
    ctx.fillStyle = g
    ctx.fillText('VECTOR KEEP', cx, cy - 120)
    ctx.shadowBlur = 0
    ctx.font = `15px ${FONTS.ui}`
    ctx.fillStyle = COLORS.accent
    ctx.fillText('Star Castle–style vector siege — fan tribute', cx, cy - 72)
    ctx.fillStyle = COLORS.hud
    ctx.font = `15px ${FONTS.ui}`
    const line = 26
    let y = cy - 28
    ctx.fillText('[SPACE] or [ENTER] — START GAME', cx, y)
    y += line
    ctx.fillText('[P] — PAUSE / RESUME', cx, y)
    y += line
    ctx.fillText('[SHIFT] — SHIELD (energy bar)', cx, y)
    y += line
    ctx.fillText('[←] [→] — ROTATE     [↑] — THRUST', cx, y)
    y += line
    ctx.fillText('[SPACE] — FIRE (shoot gaps, then the core)', cx, y)
    y += line + 8
    ctx.fillStyle = COLORS.hudMuted
    ctx.font = `13px ${FONTS.ui}`
    ctx.fillText('Also: [A][D] rotate, [W] thrust', cx, y)
    ctx.restore()
  }

  drawPaused(): void {
    const { ctx } = this
    const w = this.viewW
    const h = this.viewH
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, w, h)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 32px ${FONTS.display}`
    ctx.shadowColor = 'rgba(80, 220, 255, 0.5)'
    ctx.shadowBlur = 12
    ctx.fillStyle = COLORS.hud
    ctx.fillText('PAUSED', w / 2, h / 2)
    ctx.shadowBlur = 0
    ctx.font = `16px ${FONTS.ui}`
    ctx.fillStyle = COLORS.hudMuted
    ctx.fillText('[P] RESUME', w / 2, h / 2 + 36)
    ctx.restore()
  }

  drawGameOver(score: number, high: number): void {
    const { ctx } = this
    const w = this.viewW
    const h = this.viewH
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, w, h)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 34px ${FONTS.display}`
    ctx.shadowColor = 'rgba(255, 80, 60, 0.55)'
    ctx.shadowBlur = 14
    ctx.fillStyle = COLORS.turretShot
    ctx.fillText('GAME OVER', w / 2, h / 2 - 28)
    ctx.shadowBlur = 0
    ctx.font = `18px ${FONTS.ui}`
    ctx.fillStyle = COLORS.hud
    ctx.fillText(`SCORE ${score}`, w / 2, h / 2 + 12)
    ctx.fillText(`HI SCORE ${high}`, w / 2, h / 2 + 40)
    ctx.fillStyle = COLORS.hudMuted
    ctx.fillText('[R] OR SPACE TO RESTART', w / 2, h / 2 + 76)
    ctx.restore()
  }

  drawHelpFooter(): void {
    const { ctx } = this
    ctx.save()
    ctx.fillStyle = COLORS.hudMuted
    ctx.font = `12px ${FONTS.ui}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    const bottomPad = 24
    ctx.fillText(
      'Inspired by classic vector coin-ops — not affiliated.',
      this.viewW / 2,
      this.viewH - bottomPad,
    )
    ctx.restore()
  }
}
