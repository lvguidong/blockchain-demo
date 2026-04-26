import type { Particle, ParticleType } from '@/types'
import { COLORS, PARTICLE_COUNTS, PARTICLE_POOL_SIZE, ANIMATION } from '@/config/canvas'
import { lerp, clamp, hexToRgba } from '@/utils/animations'

class ParticleSystem {
  private pool: Particle[] = []
  private active: Particle[] = []

  constructor() {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.pool.push(this.createDeadParticle())
    }
  }

  private createDeadParticle(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1, size: 1,
      color: COLORS.white, type: 'flow',
    }
  }

  private spawn(
    x: number, y: number, type: ParticleType, color: string,
    vx = 0, vy = 0, duration = 500, size = 3,
    targetX?: number, targetY?: number, gravity = 0
  ): void {
    let p = this.pool.pop()
    if (!p) {
      // Pool exhausted, clean up dead ones from active
      this.active = this.active.filter(ap => ap.life > 0)
      // Recycle dead ones back to pool
      // Create a new particle if still no room
      p = this.createDeadParticle()
    }

    p.x = x
    p.y = y
    p.vx = vx
    p.vy = vy
    p.life = duration
    p.maxLife = duration
    p.size = size
    p.color = color
    p.type = type
    p.targetX = targetX
    p.targetY = targetY
    p.gravity = gravity
    p.trail = []

    this.active.push(p)
  }

  emitFlow(fromX: number, fromY: number, toX: number, toY: number, count = PARTICLE_COUNTS.flow): void {
    for (let i = 0; i < count; i++) {
      const dx = toX - fromX
      const dy = toY - fromY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const speed = dist / (ANIMATION.flowDuration / 16)
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3

      this.spawn(
        fromX, fromY, 'flow', COLORS.cyan,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        ANIMATION.flowDuration + Math.random() * 200,
        2 + Math.random() * 2,
        toX, toY
      )
    }
  }

  emitFirework(x: number, y: number, count = PARTICLE_COUNTS.firework, color = COLORS.gold): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2
      const speed = 1 + Math.random() * 4
      const colors = [color, COLORS.orange, COLORS.white, COLORS.pink]
      this.spawn(
        x, y, 'firework', colors[i % colors.length],
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        ANIMATION.fireworkDuration + Math.random() * 300,
        1.5 + Math.random() * 2,
        undefined, undefined, 0.05
      )
    }
  }

  emitFlight(fromX: number, fromY: number, toX: number, toY: number, count = PARTICLE_COUNTS.flight): void {
    // Main flight particle
    const dx = toX - fromX
    const dy = toY - fromY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const duration = ANIMATION.flightDuration

    this.spawn(
      fromX, fromY, 'flight', COLORS.blue,
      (dx / duration) * 16, (dy / duration) * 16,
      duration, 5, toX, toY
    )

    // Trailing sparks
    for (let i = 0; i < count; i++) {
      const t = i / count
      const sx = lerp(fromX, toX, t) + (Math.random() - 0.5) * 10
      const sy = lerp(fromY, toY, t) + (Math.random() - 0.5) * 10
      this.spawn(
        sx, sy, 'spark', COLORS.cyan,
        (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
        ANIMATION.sparkDuration, 1.5
      )
    }
  }

  emitCoinDrop(x: number, y: number, targetY: number, count = PARTICLE_COUNTS.coin): void {
    for (let i = 0; i < count; i++) {
      this.spawn(
        x + (Math.random() - 0.5) * 30, y, 'coin', COLORS.gold,
        (Math.random() - 0.5) * 3, -2 - Math.random() * 2,
        ANIMATION.coinDropDuration + Math.random() * 400,
        3 + Math.random() * 3,
        x, targetY, 0.15
      )
    }
  }

  emitSurge(x: number, y: number, count = PARTICLE_COUNTS.surge): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.5 + Math.random() * 1.5
      const colors = [COLORS.gold, COLORS.orange, COLORS.cyan]
      this.spawn(
        x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 40, 'surge',
        colors[i % colors.length],
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        ANIMATION.surgeDuration + Math.random() * 200,
        1 + Math.random() * 2
      )
    }
  }

  emitSparks(x: number, y: number, count = PARTICLE_COUNTS.spark): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      this.spawn(
        x, y, 'spark', COLORS.orange,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        ANIMATION.sparkDuration, 1 + Math.random()
      )
    }
  }

  update(dt: number): boolean {
    const survived: Particle[] = []

    for (const p of this.active) {
      if (p.life <= 0) continue

      p.life -= dt

      if (p.type === 'coin' && p.gravity) {
        p.vy += p.gravity * dt * 0.06
        p.x += p.vx * dt * 0.06
        p.y += p.vy * dt * 0.06

        // Bounce off bottom
        if (p.targetY !== undefined && p.y >= p.targetY) {
          p.y = p.targetY
          p.vy = -p.vy * 0.5
          p.vx *= 0.8
          if (Math.abs(p.vy) < 0.5) {
            p.vy = 0
          }
        }
      } else if (p.type === 'firework' && p.gravity) {
        p.vy += p.gravity * dt * 0.06
        p.x += p.vx * dt * 0.06
        p.y += p.vy * dt * 0.06
      } else if (p.type === 'flight' && p.targetX !== undefined && p.targetY !== undefined) {
        const t = 1 - p.life / p.maxLife
        const easedT = t * t * (3 - 2 * t) // smoothstep
        p.x = lerp(p.x, p.targetX, easedT * dt * 0.01)
        p.y = lerp(p.y, p.targetY, easedT * dt * 0.01)
      } else {
        p.x += p.vx * dt * 0.06
        p.y += p.vy * dt * 0.06
      }

      if (p.trail !== undefined && p.trail.length < 8) {
        p.trail.push({ x: p.x, y: p.y })
      }

      if (p.life > 0) {
        survived.push(p)
      }
    }

    this.active = survived
    return this.active.length > 0
  }

  draw(ctx: CanvasRenderingContext2D): boolean {
    const alive = this.active.filter(p => p.life > 0)

    for (const p of alive) {
      const lifeRatio = p.life / p.maxLife
      const alpha = p.type === 'surge' ? lifeRatio * 0.6 : lifeRatio

      // Draw trail for flight particles
      if (p.trail && p.trail.length > 1 && p.type === 'flight') {
        ctx.beginPath()
        ctx.moveTo(p.trail[0].x, p.trail[0].y)
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y)
        }
        ctx.lineTo(p.x, p.y)
        ctx.strokeStyle = hexToRgba(p.color, alpha * 0.4)
        ctx.lineWidth = p.size * 0.5
        ctx.stroke()
      }

      // Draw particle
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (p.type === 'surge' ? lifeRatio : 1), 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(p.color, alpha)
      ctx.fill()

      // Glow effect for firework and flight
      if (p.type === 'firework' || p.type === 'flight') {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2 * lifeRatio, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(p.color, alpha * 0.2)
        ctx.fill()
      }
    }

    return alive.length > 0
  }

  clear(): void {
    for (const p of this.active) {
      p.life = 0
    }
    this.active = []
  }

  hasActive(): boolean {
    return this.active.some(p => p.life > 0)
  }
}

export const particleSystem = new ParticleSystem()
