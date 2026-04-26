export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export function easeInCubic(t: number): number {
  return t * t * t
}

export function linear(t: number): number {
  return t
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export class AnimationLoop {
  private rafId: number | null = null
  private lastTime = 0
  private callback: (dt: number) => void

  constructor(callback: (dt: number) => void) {
    this.callback = callback
  }

  start() {
    this.lastTime = performance.now()
    const loop = (time: number) => {
      const dt = time - this.lastTime
      this.lastTime = time
      this.callback(dt)
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  isRunning(): boolean {
    return this.rafId !== null
  }
}
