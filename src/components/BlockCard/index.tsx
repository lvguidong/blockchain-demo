import React, { useRef, useCallback } from 'react'
import type { Block } from '@/types'
import type { MiningStatus } from '@/types'
import HashDisplay from '@/components/HashDisplay'
import styles from './BlockCard.module.css'

interface BlockCardProps {
  block: Block
  difficulty: number
  miningStatus?: MiningStatus
  currentNonce?: number
  onDataChange?: (blockId: number, data: string) => void
  onNonceChange?: (blockId: number, nonce: number) => void
  onMine?: (blockId: number) => void
  onTamper?: (blockId: number) => void
  showTamperButton?: boolean
}

const BlockCard: React.FC<BlockCardProps> = ({
  block,
  difficulty,
  miningStatus = 'idle',
  currentNonce,
  onDataChange,
  onNonceChange,
  onMine,
  onTamper,
  showTamperButton = false,
}) => {
  const dataRef = useRef<HTMLTextAreaElement>(null)
  const nonceRef = useRef<HTMLInputElement>(null)

  const handleDataChange = useCallback(() => {
    if (dataRef.current && onDataChange) {
      onDataChange(block.id, dataRef.current.value)
    }
  }, [block.id, onDataChange])

  const handleNonceChange = useCallback(() => {
    if (nonceRef.current && onNonceChange) {
      const val = parseInt(nonceRef.current.value, 10)
      if (!isNaN(val)) {
        onNonceChange(block.id, val)
      }
    }
  }, [block.id, onNonceChange])

  const handleMine = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onMine?.(block.id)
  }, [block.id, onMine])

  const handleTamper = useCallback(() => {
    onTamper?.(block.id)
  }, [block.id, onTamper])

  const cardClass = `${styles.card} ${
    miningStatus === 'mining' ? styles.cardMining :
    miningStatus === 'success' ? styles.cardSuccess :
    block.isTampered ? styles.cardTampered :
    ''
  }`

  return (
    <div className={cardClass} data-block-id={block.id}>
      <div className={styles.header}>
        <span className={styles.blockNumber}>#{block.id}</span>
        {miningStatus === 'mining' && <span className={styles.miningBadge}>⛏ Mining</span>}
        {miningStatus === 'success' && <span className={styles.successBadge}>✓ Found</span>}
        {block.isTampered && <span className={styles.tamperBadge}>⚠ Tampered</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Nonce</label>
        <input
          ref={nonceRef}
          className={styles.input}
          type="number"
          value={miningStatus === 'mining' ? currentNonce ?? block.nonce : block.nonce}
          onChange={handleNonceChange}
          disabled={miningStatus === 'mining'}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Data</label>
        <textarea
          ref={dataRef}
          className={styles.textarea}
          rows={3}
          defaultValue={block.data}
          onChange={handleDataChange}
          disabled={miningStatus === 'mining'}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Prev Hash</label>
        <HashDisplay hash={block.prevHash} difficulty={0} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Hash</label>
        <HashDisplay hash={block.hash} difficulty={difficulty} />
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.mineBtn} ${miningStatus === 'mining' ? styles.mineBtnActive : ''}`}
          onClick={handleMine}
          disabled={miningStatus === 'mining'}
        >
          {miningStatus === 'mining' ? 'Mining...' : 'Mine'}
        </button>
        {showTamperButton && !block.isTampered && (
          <button className={styles.tamperBtn} onClick={handleTamper}>
            Tamper
          </button>
        )}
      </div>
    </div>
  )
}

export default BlockCard
