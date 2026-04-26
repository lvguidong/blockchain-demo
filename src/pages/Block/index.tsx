import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useBlockchainStore } from '@/store/blockchain'
import { useMiningStore } from '@/store/mining'
import { mineBlock } from '@/utils/mining'
import { computeSHA256 } from '@/utils/sha256'
import { particleSystem } from '@/components/ParticleSystem'
import { startMining, triggerSuccess, updateMineAnimation } from '@/components/MineAnimation'
import BlockCard from '@/components/BlockCard'
import DifficultySlider from '@/components/DifficultySlider'
import styles from './BlockPage.module.css'

const GENESIS_PREV_HASH = '0'.repeat(64)

const BlockPage: React.FC = () => {
  const { difficulty, setDifficulty, blocks, initChain, updateBlockData, updateBlockNonce } = useBlockchainStore()
  const { status, currentNonce, startMining: startMiningAction, finishMining } = useMiningStore()
  const cardRef = useRef<HTMLDivElement>(null)
  const nonceIntervalRef = useRef<number | null>(null)
  const [slotNonce, setSlotNonce] = useState(0)

  // Initialize single block
  useEffect(() => {
    initChain(1, difficulty)
  }, [])

  // Ensure we have a block
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

  const block = blocks[0]
  if (!block) return <div className={styles.loading}>Initializing...</div>

  // Mining nonce slot machine effect
  useEffect(() => {
    if (status === 'mining') {
      nonceIntervalRef.current = window.setInterval(() => {
        setSlotNonce(prev => prev + Math.floor(Math.random() * 1000))
      }, 50)
    } else {
      if (nonceIntervalRef.current) {
        clearInterval(nonceIntervalRef.current)
        nonceIntervalRef.current = null
      }
    }
    return () => {
      if (nonceIntervalRef.current) clearInterval(nonceIntervalRef.current)
    }
  }, [status])

  // Update mining animation
  useEffect(() => {
    if (status === 'mining' && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      startMining(cx, cy)
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

    // Mine with small batches, updating progress
    let startNonce = 0
    let result = null

    while (!result) {
      result = await mineBlock(
        currentBlock.data,
        currentBlock.prevHash,
        currentBlock.id,
        difficulty,
        startNonce,
        5000,
        (nonce) => {
          setSlotNonce(nonce)
        }
      )
      if (!result) {
        startNonce += 5000
      }
    }

    // Update the block with the found nonce and hash
    updateBlockNonce(blockId, result.nonce)
    finishMining()

    // Trigger success particles
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      triggerSuccess(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
  }, [difficulty, startMiningAction, finishMining, updateBlockNonce])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Block</h1>
      <p className={styles.description}>
        A block contains data, a nonce, and a hash. Mining means finding the right nonce so the hash starts with enough zeros.
      </p>

      <DifficultySlider difficulty={difficulty} onChange={(d) => {
        setDifficulty(d)
      }} />

      <div ref={cardRef} className={styles.cardWrapper}>
        <BlockCard
          block={block}
          difficulty={difficulty}
          miningStatus={status}
          currentNonce={slotNonce}
          onDataChange={handleDataChange}
          onNonceChange={handleNonceChange}
          onMine={handleMine}
        />
      </div>

      {status === 'success' && (
        <div className={styles.successMessage}>
          Nonce found! Hash starts with {difficulty} zeros. Try changing the data to see the chain break.
        </div>
      )}
    </div>
  )
}

export default BlockPage
