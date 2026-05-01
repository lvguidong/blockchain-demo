import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlockchainStore } from '@/store/blockchain'
import { useMiningStore } from '@/store/mining'
import { mineBlock } from '@/utils/mining'
import { getMineAbortSignal } from '@/store/mining'
import { computeSHA256 } from '@/utils/sha256'
import { startMining, triggerSuccess } from '@/components/MineAnimation'
import BlockCard from '@/components/BlockCard'
import DifficultySlider from '@/components/DifficultySlider'
import styles from './BlockPage.module.css'

const GENESIS_PREV_HASH = '0'.repeat(64)

const BlockPage: React.FC = () => {
  const { t } = useTranslation()
  const { difficulty, setDifficulty, blocks, initChain, updateBlockData, updateBlockNonce } = useBlockchainStore()
  const { status, startMining: startMiningAction, finishMining, cancelMining } = useMiningStore()
  const cardRef = useRef<HTMLDivElement>(null)
  const [slotNonce, setSlotNonce] = useState(0)

  useEffect(() => {
    initChain(1, difficulty)
  }, [])

  useEffect(() => {
    if (blocks.length === 0 && difficulty) {
      const block = {
        id: 1,
        nonce: 0,
        data: 'Hello, Blockchain!',
        hash: '',
        prevHash: GENESIS_PREV_HASH,
        timestamp: Date.now(),
        difficulty,
        isTampered: false,
      }
      computeSHA256(`10Hello, Blockchain!${GENESIS_PREV_HASH}`).then(hash => {
        block.hash = hash
        useBlockchainStore.setState({ blocks: [block] })
      })
    }
  }, [blocks.length])

  useEffect(() => {
    if (status === 'mining') {
      const id = window.setInterval(() => {
        setSlotNonce(prev => prev + Math.floor(Math.random() * 1000))
      }, 50)
      return () => clearInterval(id)
    }
  }, [status])

  useEffect(() => {
    if (status === 'mining' && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      startMining(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
  }, [status])

  const handleDataChange = useCallback((blockId: number, data: string) => {
    updateBlockData(blockId, data)
  }, [updateBlockData])

  const handleNonceChange = useCallback((blockId: number, nonce: number) => {
    updateBlockNonce(blockId, nonce)
  }, [updateBlockNonce])

  const handleMine = useCallback(async (blockId: number) => {
    const currentBlock = useBlockchainStore.getState().blocks[0]
    if (!currentBlock) return

    startMiningAction(blockId)

    let startNonce = 0
    let result = null

    while (!result && !getMineAbortSignal()?.aborted) {
      result = await mineBlock(
        currentBlock.data,
        currentBlock.prevHash,
        currentBlock.id,
        difficulty,
        startNonce,
        100000,
        (nonce) => setSlotNonce(nonce),
        getMineAbortSignal()
      )
      if (!result) startNonce += 100000
    }

    if (result) {
      updateBlockNonce(blockId, result.nonce)
      finishMining()
    }

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      triggerSuccess(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
  }, [difficulty, startMiningAction, finishMining, updateBlockNonce])

  const block = blocks[0]
  if (!block) return <div className={styles.loading}>{t('block.loading')}</div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('block.title')}</h1>
      <p className={styles.description}>{t('block.description')}</p>

      <DifficultySlider difficulty={difficulty} onChange={setDifficulty} />

      <div ref={cardRef} className={styles.cardWrapper}>
        <BlockCard
          block={block}
          difficulty={difficulty}
          miningStatus={status}
          currentNonce={slotNonce}
          onDataChange={handleDataChange}
          onNonceChange={handleNonceChange}
          onMine={handleMine}
          onCancelMine={cancelMining}
        />
      </div>

      {status === 'success' && (
        <div className={styles.successMessage}>
          {t('block.success', { difficulty })}
        </div>
      )}
    </div>
  )
}

export default BlockPage
