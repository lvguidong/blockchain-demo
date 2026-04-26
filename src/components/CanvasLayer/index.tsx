import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import styles from './CanvasLayer.module.css'
import { DPR } from '@/config/canvas'

interface CanvasLayerProps {
  onStaticDraw?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  onAnimDraw?: (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void
  className?: string
  children?: React.ReactNode
}

export interface CanvasLayerRef {
  redrawStatic: () => void
  container: HTMLDivElement | null
  staticCanvas: HTMLCanvasElement | null
  animCanvas: HTMLCanvasElement | null
}

const CanvasLayer = forwardRef<CanvasLayerRef, CanvasLayerProps>(
  ({ onStaticDraw, onAnimDraw, className, children }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const staticCanvasRef = useRef<HTMLCanvasElement>(null)
    const animCanvasRef = useRef<HTMLCanvasElement>(null)
    const animFrameRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)

    const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const cssWidth = rect.width
      const cssHeight = rect.height
      canvas.width = cssWidth * DPR
      canvas.height = cssHeight * DPR
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(DPR, DPR)
      }
    }, [])

    const redrawStatic = useCallback(() => {
      const canvas = staticCanvasRef.current
      if (!canvas || !onStaticDraw) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(DPR, DPR)
      onStaticDraw(ctx, rect.width, rect.height)
      ctx.restore()
    }, [onStaticDraw])

    useImperativeHandle(ref, () => ({
      redrawStatic,
      container: containerRef.current,
      staticCanvas: staticCanvasRef.current,
      animCanvas: animCanvasRef.current,
    }))

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const resizeObserver = new ResizeObserver(() => {
        if (staticCanvasRef.current) setupCanvas(staticCanvasRef.current)
        if (animCanvasRef.current) setupCanvas(animCanvasRef.current)
        if (onStaticDraw) {
          requestAnimationFrame(redrawStatic)
        }
      })
      resizeObserver.observe(container)

      return () => resizeObserver.disconnect()
    }, [setupCanvas, redrawStatic, onStaticDraw])

    useEffect(() => {
      if (!onAnimDraw) return

      const animate = (time: number) => {
        const dt = lastTimeRef.current ? time - lastTimeRef.current : 16
        lastTimeRef.current = time

        const canvas = animCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const rect = canvas.parentElement?.getBoundingClientRect()
        if (!rect) return

        ctx.clearRect(0, 0, rect.width, rect.height)
        onAnimDraw(ctx, rect.width, rect.height, dt)

        animFrameRef.current = requestAnimationFrame(animate)
      }

      animFrameRef.current = requestAnimationFrame(animate)

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      }
    }, [onAnimDraw])

    useEffect(() => {
      if (onStaticDraw) {
        const timer = setTimeout(redrawStatic, 50)
        return () => clearTimeout(timer)
      }
    }, [onStaticDraw, redrawStatic])

    return (
      <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
        <canvas
          ref={staticCanvasRef}
          className={`${styles.canvas} ${styles.canvasStatic}`}
        />
        <canvas
          ref={animCanvasRef}
          className={`${styles.canvas} ${styles.canvasAnimated}`}
        />
        <div className={styles.content}>{children}</div>
      </div>
    )
  }
)

CanvasLayer.displayName = 'CanvasLayer'

export default CanvasLayer
