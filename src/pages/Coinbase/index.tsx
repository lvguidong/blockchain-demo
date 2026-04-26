import React, { useState, useCallback, useRef, useEffect } from 'react'
import { computeSHA256 } from '@/utils/sha256'
import { particleSystem } from '@/components/ParticleSystem'
import { COLORS } from '@/config/canvas'
import { hexToRgba } from '@/utils/animations'
import { easeOutElastic } from '@/utils/animations'
import styles from './CoinbasePage.module.css'

const HALVING_SCHEDULE = [50, 25, 12.5, 6.25, 3.125, 1.5625]
const BLOCKS_PER_HALVING = 10 // Simplified: 10 blocks per halving for demo

interface CoinParticle {
  x: number
  y: number
  vy: number
  vx: number
  rotation: number
  landed: boolean
}

const CoinbasePage: React.FC = () => {
  const [minerBalance, setMinerBalance] = useState(0)
  const [totalBlocksMined, setTotalBlocksMined] = useState(0)
  const [isMining, setIsMining] = useState(false)
  const [lastReward, setLastReward] = useState(0)
  const [coinParticles, setCoinParticles] = useState<CoinParticle[]>([])
  const [gearRotation, setGearRotation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const gearAngleRef = useRef(0)

  const currentReward = HALVING_SCHEDULE[Math.min(
    Math.floor(totalBlocksMined / BLOCKS_PER_HALVING),
    HALVING_SCHEDULE.length - 1
  )]

  const blocksUntilHalving = BLOCKS_PER_HALVING - (totalBlocksMined % BLOCKS_PER_HALVING)
  const halvingProgress = 1 - blocksUntilHalving / BLOCKS_PER_HALVING

  const handleMine = useCallback(async () => {
    if (isMining) return
    setIsMining(true)

    // Simulate mining with a short delay
    const startTime = Date.now()
    const mineDuration = 1500

    // Animate gear rotation during mining
    const animateGear = () => {
      gearAngleRef.current += 3
      setGearRotation(gearAngleRef.current)

      // Emit surge particles
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        particleSystem.emitSurge(rect.width * 0.3, rect.height * 0.3, 3)
      }

      if (Date.now() - startTime < mineDuration) {
        animFrameRef.current = requestAnimationFrame(animateGear)
      }
    }
    animFrameRef.current = requestAnimationFrame(animateGear)

    await new Promise(resolve => setTimeout(resolve, mineDuration))

    // Mining complete - award coins
    setMinerBalance(prev => prev + currentReward)
    setTotalBlocksMined(prev => prev + 1)
    setLastReward(currentReward)
    setIsMining(false)

    // Emit coin drop particles
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      particleSystem.emitCoinDrop(rect.width * 0.3, rect.height * 0.3, rect.height * 0.7, 8)
    }

    // Create custom coin particles for the animation
    const newCoins: CoinParticle[] = []
    const canvasEl = canvasRef.current
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect()
      for (let i = 0; i < 5; i++) {
        newCoins.push({
          x: rect.width * 0.3 + (Math.random() - 0.5) * 40,
          y: rect.height * 0.3,
          vy: -3 - Math.random() * 3,
          vx: (Math.random() - 0.5) * 4,
          rotation: Math.random() * 360,
          landed: false,
        })
      }
    }
    setCoinParticles(prev => [...prev, ...newCoins])
  }, [isMining, currentReward])

  // Animate custom coin particles
  useEffect(() => {
    if (coinParticles.length === 0) return

    let frameId: number
    const animate = () => {
      setCoinParticles(prev => {
        const updated = prev.map(p => {
          if (p.landed) return p

          const vy = p.vy + 0.15
          const y = p.y + vy
          const x = p.x + p.vx
          const rotation = p.rotation + 10

          if (y >= 250) {
            return {
              ...p,
              y: 250,
              vy: -vy * 0.4,
              vx: p.vx * 0.7,
              rotation,
              landed: Math.abs(vy) < 0.5,
            }
          }

          return { ...p, x, y, vy, rotation }
        })

        return updated.filter(p => !p.landed || p.y < 300)
      })

      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [coinParticles.length > 0])

  // Draw static + animated content on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    let frameId: number

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Draw mining rig (gear icon)
      const rigX = rect.width * 0.3
      const rigY = rect.height * 0.3
      const gearSize = 40

      ctx.save()
      ctx.translate(rigX, rigY)
      ctx.rotate((gearRotation * Math.PI) / 180)

      // Gear body
      ctx.beginPath()
      const teeth = 8
      const outerR = gearSize
      const innerR = gearSize * 0.7
      for (let i = 0; i < teeth * 2; i++) {
        const angle = (Math.PI * 2 * i) / (teeth * 2)
        const r = i % 2 === 0 ? outerR : innerR
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()

      ctx.fillStyle = isMining ? hexToRgba(COLORS.gold, 0.3) : hexToRgba(COLORS.textMuted, 0.2)
      ctx.fill()
      ctx.strokeStyle = isMining ? COLORS.gold : COLORS.textMuted
      ctx.lineWidth = 2
      ctx.stroke()

      // Gear center hole
      ctx.beginPath()
      ctx.arc(0, 0, gearSize * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(COLORS.bgPrimary, 0.8)
      ctx.fill()

      ctx.restore()

      // Draw wallet
      const walletX = rect.width * 0.7
      const walletY = rect.height * 0.7

      ctx.beginPath()
      ctx.roundRect(walletX - 40, walletY - 20, 80, 40, 8)
      ctx.fillStyle = hexToRgba(COLORS.gold, 0.1)
      ctx.fill()
      ctx.strokeStyle = COLORS.gold
      ctx.lineWidth = 2
      ctx.stroke()

      // Wallet label
      ctx.font = '11px sans-serif'
      ctx.fillStyle = COLORS.textMuted
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('WALLET', walletX, walletY - 8)

      // Wallet balance
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = COLORS.gold
      ctx.fillText(`${minerBalance.toFixed(2)}`, walletX, walletY + 8)

      // Draw coin particles
      for (const coin of coinParticles) {
        ctx.save()
        ctx.translate(coin.x, coin.y)
        ctx.rotate((coin.rotation * Math.PI) / 180)

        // Coin circle
        ctx.beginPath()
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.fillStyle = COLORS.gold
        ctx.fill()
        ctx.strokeStyle = hexToRgba(COLORS.goldGlow, 0.5)
        ctx.lineWidth = 1
        ctx.stroke()

        // Dollar sign
        ctx.font = 'bold 10px sans-serif'
        ctx.fillStyle = COLORS.bgPrimary
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('$', 0, 0)

        ctx.restore()
      }

      // Draw reward label
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = COLORS.gold
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(`+${currentReward} BTC`, rigX, rigY + gearSize + 16)

      // Draw arrow from rig to wallet
      const arrowStartX = rigX + gearSize
      const arrowStartY = rigY
      const arrowEndX = walletX - 40
      const arrowEndY = walletY

      ctx.beginPath()
      ctx.moveTo(arrowStartX, arrowStartY)
      ctx.quadraticCurveTo((arrowStartX + arrowEndX) / 2, Math.min(arrowStartY, arrowEndY) - 40, arrowEndX, arrowEndY)
      ctx.strokeStyle = hexToRgba(COLORS.gold, 0.3)
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameId)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [gearRotation, minerBalance, isMining, coinParticles, currentReward])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Coinbase</h1>
      <p className={styles.description}>
        Mining creates new coins as a reward. The reward halves periodically (Bitcoin halving). Mine blocks to earn coins!
      </p>

      <div className={styles.canvasWrapper}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.mineBtn} ${isMining ? styles.mineBtnActive : ''}`}
          onClick={handleMine}
          disabled={isMining}
        >
          {isMining ? 'Mining...' : `Mine Block (+${currentReward} BTC)`}
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Miner Balance</div>
          <div className={styles.statValue} style={{ color: COLORS.gold }}>
            {minerBalance.toFixed(2)} BTC
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Blocks Mined</div>
          <div className={styles.statValue}>{totalBlocksMined}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Current Reward</div>
          <div className={styles.statValue} style={{ color: COLORS.gold }}>
            {currentReward} BTC
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Next Halving</div>
          <div className={styles.statValue}>{blocksUntilHalving} blocks</div>
        </div>
      </div>

      <div className={styles.halvingSection}>
        <div className={styles.halvingLabel}>Halving Progress</div>
        <div className={styles.halvingBar}>
          <div
            className={styles.halvingFill}
            style={{ width: `${halvingProgress * 100}%` }}
          />
        </div>
        <div className={styles.halvingInfo}>
          <span>Reward: {currentReward} → {HALVING_SCHEDULE[Math.min(
            Math.floor(totalBlocksMined / BLOCKS_PER_HALVING) + 1,
            HALVING_SCHEDULE.length - 1
          )]} BTC</span>
        </div>
      </div>

      {lastReward > 0 && !isMining && (
        <div className={styles.rewardNotification}>
          Successfully mined! Earned {lastReward} BTC.
        </div>
      )}
    </div>
  )
}

export default CoinbasePage
