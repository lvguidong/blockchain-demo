import { useRef, useEffect, useCallback } from 'react'
import { AnimationLoop } from '@/utils/animations'

interface UseCanvasOptions {
  onStaticDraw?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  onAnimDraw?: (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void
  animate?: boolean
}

export function useCanvas({ onStaticDraw, onAnimDraw, animate = true }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const staticCanvasRef = useRef<HTMLCanvasElement>(null)
  const animLoopRef = useRef<AnimationLoop | null>(null)

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [])

  const redrawStatic = useCallback(() => {
    if (!staticCanvasRef.current || !onStaticDraw) return
    setupCanvas(staticCanvasRef.current)
    const ctx = staticCanvasRef.current.getContext('2d')
    if (!ctx) return
    const rect = staticCanvasRef.current.getBoundingClientRect()
    onStaticDraw(ctx, rect.width, rect.height)
  }, [onStaticDraw, setupCanvas])

  useEffect(() => {
    if (!animate || !onAnimDraw) return

    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const loop = new AnimationLoop((dt) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, rect.width, rect.height)
      onAnimDraw(ctx, rect.width, rect.height, dt)
    })

    animLoopRef.current = loop
    loop.start()

    return () => loop.stop()
  }, [onAnimDraw, animate])

  return { canvasRef, staticCanvasRef, redrawStatic }
}
