import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNetworkStore } from '@/store/network'
import { useBlockchainStore } from '@/store/blockchain'
import { computeSHA256 } from '@/utils/sha256'
import type { Peer, Block } from '@/types'
import { particleSystem } from '@/components/ParticleSystem'
import { drawTopology, getNodePosition } from '@/components/Topology'
import { COLORS } from '@/config/canvas'
import { hexToRgba } from '@/utils/animations'
import { lerp } from '@/utils/animations'
import HashDisplay from '@/components/HashDisplay'
import styles from './DistributedPage.module.css'

const GENESIS_PREV_HASH = '0'.repeat(64)

async function computeBlockHash(block: Block): Promise<string> {
  return computeSHA256(`${block.id}${block.nonce}${block.data}${block.prevHash}`)
}

function createBlock(id: number, nonce: number, data: string, prevHash: string, difficulty: number): Block {
  return { id, nonce, data, hash: '', prevHash, timestamp: Date.now(), difficulty, isTampered: false }
}

const DistributedPage: React.FC = () => {
  const { t } = useTranslation()
  const { peers, packets, isSimulatingFork, initPeers, addBlockToPeer, startBroadcast, updatePacketProgress, removePacket, triggerFork, resolveFork, syncPeer } = useNetworkStore()
  const { difficulty } = useBlockchainStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const [blockCounts, setBlockCounts] = useState<Record<number, number>>({})

  // Initialize peers
  useEffect(() => {
    initPeers(difficulty)

    // Compute block hashes asynchronously
    const timer = setTimeout(async () => {
      const currentPeers = useNetworkStore.getState().peers
      const updatedPeers = currentPeers.map(peer => ({
        ...peer,
        blocks: peer.blocks.map(b => ({ ...b })),
      }))

      for (const peer of updatedPeers) {
        let prevHash = GENESIS_PREV_HASH
        for (let i = 0; i < peer.blocks.length; i++) {
          peer.blocks[i].prevHash = prevHash
          peer.blocks[i].hash = await computeBlockHash(peer.blocks[i])
          prevHash = peer.blocks[i].hash
        }
      }

      useNetworkStore.setState({ peers: updatedPeers })
      // Update block counts
      const counts: Record<number, number> = {}
      for (const peer of updatedPeers) {
        counts[peer.id] = peer.blocks.length
      }
      setBlockCounts(counts)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Animate broadcast packets
  useEffect(() => {
    const animate = () => {
      const currentPackets = useNetworkStore.getState().packets
      if (currentPackets.length === 0) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      for (const packet of currentPackets) {
        const newProgress = packet.progress + 0.02
        if (newProgress >= 1) {
          // Packet arrived - sync the peer
          syncPeer(packet.toPeer, packet.fromPeer)
          removePacket(packet.id)
          setBlockCounts(prev => {
            const targetPeer = useNetworkStore.getState().peers.find(p => p.id === packet.toPeer)
            if (targetPeer) {
              return { ...prev, [packet.toPeer]: targetPeer.blocks.length }
            }
            return prev
          })
        } else {
          updatePacketProgress(packet.id, newProgress)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleMineOnPeer = useCallback(async (peerId: number) => {
    const currentPeers = useNetworkStore.getState().peers
    const peer = currentPeers.find(p => p.id === peerId)
    if (!peer || peer.blocks.length === 0) return

    const lastBlock = peer.blocks[peer.blocks.length - 1]
    const newId = lastBlock.id + 1
    const newBlock = createBlock(newId, 0, `Block ${newId} Data`, lastBlock.hash, difficulty)
    newBlock.hash = await computeBlockHash(newBlock)

    // Add block to this peer
    addBlockToPeer(peerId, newBlock)

    // Broadcast to other peers
    for (const otherPeer of currentPeers) {
      if (otherPeer.id !== peerId) {
        startBroadcast(peerId, otherPeer.id, newBlock)
      }
    }

    setBlockCounts(prev => ({
      ...prev,
      [peerId]: (prev[peerId] || 0) + 1,
    }))

    // Emit flight particles from source to targets
    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      const fromPos = getNodePosition(peer, rect.width, rect.height)
      for (const otherPeer of currentPeers) {
        if (otherPeer.id !== peerId) {
          const toPos = getNodePosition(otherPeer, rect.width, rect.height)
          particleSystem.emitFlight(fromPos.x, fromPos.y + 30, toPos.x, toPos.y + 30)
        }
      }
    }
  }, [difficulty, addBlockToPeer, startBroadcast])

  const handleTriggerFork = useCallback(() => {
    triggerFork()
    // Simulate: Peer A and B mine different blocks simultaneously
    handleMineOnPeer(1)
    setTimeout(() => handleMineOnPeer(2), 100)
  }, [handleMineOnPeer])

  const handleResolveFork = useCallback(() => {
    resolveFork()
    // Sync all to the longest chain (peer with most blocks)
    const currentPeers = useNetworkStore.getState().peers
    const longest = currentPeers.reduce((max, p) => p.blocks.length > max.blocks.length ? p : max, currentPeers[0])
    for (const peer of currentPeers) {
      if (peer.id !== longest.id) {
        syncPeer(peer.id, longest.id)
      }
    }
    setBlockCounts(prev => {
      const newCounts = { ...prev }
      for (const peer of useNetworkStore.getState().peers) {
        newCounts[peer.id] = peer.blocks.length
      }
      return newCounts
    })
  }, [])

  // Static draw: topology
  const onStaticDraw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const currentPeers = useNetworkStore.getState().peers
    const currentPackets = useNetworkStore.getState().packets
    drawTopology(ctx, currentPeers, currentPackets, width, height, { top: 0, left: 0 })

    // Draw block stacks below each peer
    for (const peer of currentPeers) {
      const baseY = peer.y * height + 70
      const blockCount = Math.max(peer.blocks.length, blockCounts[peer.id] || 0)
      const spacing = Math.min(36, (height - baseY - 20) / blockCount)

      for (let i = 0; i < Math.min(blockCount, 5); i++) {
        const bx = peer.x * width - 40
        const by = baseY + i * spacing

        // Mini block rectangle
        const isTampered = peer.blocks[i]?.isTampered
        ctx.fillStyle = isTampered ? hexToRgba(COLORS.red, 0.2) : hexToRgba(COLORS.bgSurface, 0.8)
        ctx.fillRect(bx, by, 80, spacing - 4)
        ctx.strokeStyle = isTampered ? COLORS.red : COLORS.borderDefault
        ctx.lineWidth = 1
        ctx.strokeRect(bx, by, 80, spacing - 4)

        // Block number label
        ctx.font = '10px sans-serif'
        ctx.fillStyle = COLORS.textSecondary
        ctx.textAlign = 'center'
        ctx.fillText(`#${peer.blocks[i]?.id || i + 1}`, bx + 40, by + (spacing - 4) / 2 + 3)
      }

      // Peer label
      ctx.font = 'bold 12px sans-serif'
      ctx.fillStyle = COLORS.textPrimary
      ctx.textAlign = 'center'
      ctx.fillText(`Peer ${peer.label}`, peer.x * width, peer.y * height + 50)
    }
  }, [blockCounts])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('distributed.title')}</h1>
      <p className={styles.description}>{t('distributed.description')}</p>

      <div className={styles.controls}>
        {peers.map(peer => (
          <button
            key={peer.id}
            className={styles.mineBtn}
            onClick={() => handleMineOnPeer(peer.id)}
          >
            {t('distributed.mine', { label: peer.label })}
          </button>
        ))}
        <button className={styles.forkBtn} onClick={handleTriggerFork} disabled={isSimulatingFork}>
          {t('distributed.simulateFork')}
        </button>
        <button className={styles.resolveBtn} onClick={handleResolveFork} disabled={!isSimulatingFork}>
          {t('distributed.resolveConsensus')}
        </button>
      </div>

      <div ref={containerRef} className={styles.topology}>
        <div className={styles.canvasContainer}>
          <canvas className={styles.canvas} />
        </div>
      </div>

      <div className={styles.peerDetails}>
        {peers.map(peer => (
          <div key={peer.id} className={styles.peerCard}>
            <div className={styles.peerHeader}>
              <span className={styles.peerLabel}>{t('distributed.peer')} {peer.label}</span>
              <span className={`${styles.peerStatus} ${
                peer.syncStatus === 'synced' ? styles.statusSynced :
                peer.syncStatus === 'delayed' ? styles.statusDelayed :
                styles.statusForked
              }`}>
                {peer.syncStatus === 'synced' ? t('distributed.synced') :
                 peer.syncStatus === 'delayed' ? t('distributed.delayed') :
                 t('distributed.forked')}
              </span>
            </div>
            <div className={styles.blockCount}>
              {peer.blocks.length} {t('distributed.blocks')}
            </div>
            {peer.blocks.slice(-3).map(block => (
              <div key={block.id} className={styles.miniBlock}>
                <span className={styles.miniBlockId}>#{block.id}</span>
                <span className={styles.miniBlockNonce}>{t('distributed.nonce')}: {block.nonce}</span>
                <HashDisplay hash={block.hash} difficulty={difficulty} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DistributedPage
