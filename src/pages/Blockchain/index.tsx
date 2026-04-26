import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlockchainStore } from '@/store/blockchain'
import { useMiningStore } from '@/store/mining'
import { mineBlock } from '@/utils/mining'
import { particleSystem } from '@/components/ParticleSystem'
import { startMining, triggerSuccess, updateMineAnimation } from '@/components/MineAnimation'
import { COLORS } from '@/config/canvas'
import { hexToRgba } from '@/utils/animations'
import CanvasLayer, { type CanvasLayerRef } from '@/components/CanvasLayer'
import BlockCard from '@/components/BlockCard'
import DifficultySlider from '@/components/DifficultySlider'
import styles from './BlockchainPage.module.css'

const INITIAL_BLOCK_COUNT = 4

const BlockchainPage: React.FC = () => {
  const { t } = useTranslation()
  const { difficulty, setDifficulty, blocks, initChain, updateBlockData, updateBlockNonce, tamperBlock, fixChain } = useBlockchainStore()
  const { status, startMining: startMiningAction, finishMining } = useMiningStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [fixingChain, setFixingChain] = useState(false)
  const canvasLayerRef = useRef<CanvasLayerRef | null>(null)

  // Initialize chain
  useEffect(() => {
    initChain(INITIAL_BLOCK_COUNT, difficulty)
  }, [])

  const handleDataChange = useCallback((blockId: number, data: string) => {
    updateBlockData(blockId, data)
  }, [updateBlockData])

  const handleNonceChange = useCallback((blockId: number, nonce: number) => {
    updateBlockNonce(blockId, nonce)
  }, [updateBlockNonce])

  const handleTamper = useCallback((blockId: number) => {
    tamperBlock(blockId)
  }, [tamperBlock])

  const handleFixChain = useCallback(async () => {
    if (fixingChain) return
    setFixingChain(true)
    const tamperedBlock = useBlockchainStore.getState().blocks.find(b => b.isTampered)
    if (tamperedBlock) {
      await fixChain(tamperedBlock.id, difficulty)
    }
    setFixingChain(false)
  }, [fixingChain, fixChain, difficulty])

  const handleMine = useCallback(async (blockId: number) => {
    const block = useBlockchainStore.getState().blocks.find(b => b.id === blockId)
    if (!block) return

    startMiningAction(blockId)

    let startNonce = 0
    let result = null

    while (!result) {
      result = await mineBlock(
        block.data,
        block.prevHash,
        block.id,
        difficulty,
        startNonce,
        5000
      )
      if (!result) {
        startNonce += 5000
      }
    }

    updateBlockNonce(blockId, result.nonce)
    finishMining()

    const cardEl = cardRefs.current.get(blockId)
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect()
      triggerSuccess(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
  }, [difficulty, startMiningAction, finishMining, updateBlockNonce])

  const handleAddBlock = useCallback(() => {
    useBlockchainStore.getState().addBlock()
  }, [])

  // Static draw: arrows between blocks
  const onStaticDraw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const canvasLayer = canvasLayerRef.current
    if (!canvasLayer?.container) return

    const containerRect = canvasLayer.container.getBoundingClientRect()
    const currentBlocks = useBlockchainStore.getState().blocks

    for (let i = 0; i < currentBlocks.length - 1; i++) {
      const fromCard = cardRefs.current.get(currentBlocks[i].id)
      const toCard = cardRefs.current.get(currentBlocks[i + 1].id)

      if (!fromCard || !toCard) continue

      const fromRect = fromCard.getBoundingClientRect()
      const toRect = toCard.getBoundingClientRect()

      const fromX = fromRect.right - containerRect.left
      const fromY = fromRect.top + fromRect.height * 0.6 - containerRect.top
      const toX = toRect.left - containerRect.left
      const toY = toRect.top + toRect.height * 0.6 - containerRect.top

      const isTampered = currentBlocks[i].isTampered || currentBlocks[i + 1].isTampered
      const lineColor = isTampered ? COLORS.red : COLORS.green

      // Draw arrow line
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      const midX = (fromX + toX) / 2
      ctx.quadraticCurveTo(midX, fromY - 15, toX, toY)
      ctx.strokeStyle = hexToRgba(lineColor, isTampered ? 0.9 : 0.5)
      ctx.lineWidth = isTampered ? 2.5 : 2
      if (isTampered) ctx.setLineDash([6, 4])
      ctx.stroke()
      ctx.setLineDash([])

      // Arrowhead
      const angle = Math.atan2(toY - (fromY - 15), toX - midX)
      const arrowSize = 8
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - arrowSize * Math.cos(angle - 0.4), toY - arrowSize * Math.sin(angle - 0.4))
      ctx.lineTo(toX - arrowSize * Math.cos(angle + 0.4), toY - arrowSize * Math.sin(angle + 0.4))
      ctx.closePath()
      ctx.fillStyle = hexToRgba(lineColor, 0.9)
      ctx.fill()

      // Label
      if (isTampered) {
        ctx.font = 'bold 10px sans-serif'
        ctx.fillStyle = hexToRgba(COLORS.red, 0.9)
        ctx.textAlign = 'center'
        ctx.fillText('BROKEN CHAIN', midX, fromY - 22)
      }
    }
  }, [])

  // Animation draw
  const onAnimDraw = useCallback((ctx: CanvasRenderingContext2D, _width: number, _height: number, dt: number) => {
    updateMineAnimation(dt)
    particleSystem.update(dt)
    particleSystem.draw(ctx)
  }, [])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('blockchain.title')}</h1>
      <p className={styles.description}>{t('blockchain.description')}</p>

      <div className={styles.controls}>
        <DifficultySlider difficulty={difficulty} onChange={setDifficulty} />
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleAddBlock}>
            {t('blockchain.addBlock')}
          </button>
          {blocks.some(b => b.isTampered) && (
            <button
              className={`${styles.actionBtn} ${styles.fixBtn}`}
              onClick={handleFixChain}
              disabled={fixingChain}
            >
              {fixingChain ? t('blockchain.fixing') : t('blockchain.fixChain')}
            </button>
          )}
        </div>
      </div>

      <CanvasLayer
        ref={canvasLayerRef}
        onStaticDraw={onStaticDraw}
        onAnimDraw={onAnimDraw}
        className={styles.canvasWrapper}
      >
        <div ref={containerRef} className={styles.chainContainer}>
          {blocks.map(block => (
            <div
              key={block.id}
              ref={el => { if (el) cardRefs.current.set(block.id, el) }}
              className={styles.cardSlot}
            >
              <BlockCard
                block={block}
                difficulty={difficulty}
                miningStatus={status === 'mining' && useMiningStore.getState().activeBlockId === block.id ? status : 'idle'}
                onDataChange={handleDataChange}
                onNonceChange={handleNonceChange}
                onMine={handleMine}
                onTamper={handleTamper}
                showTamperButton={!block.isTampered}
              />
            </div>
          ))}
        </div>
      </CanvasLayer>
    </div>
  )
}

export default BlockchainPage
