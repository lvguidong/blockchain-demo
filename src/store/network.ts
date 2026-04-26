import { create } from 'zustand'
import type { Peer, BroadcastPacket, Block } from '@/types'
import { computeSHA256 } from '@/utils/sha256'

const GENESIS_PREV_HASH = '0'.repeat(64)

function createDefaultBlocks(difficulty: number): Block[] {
  const blocks: Block[] = []
  let prevHash = GENESIS_PREV_HASH
  const nonces = [11316, 35230, 12937, 35990, 56265]

  for (let i = 0; i < 5; i++) {
    const block: Block = {
      id: i + 1,
      nonce: nonces[i],
      data: `Block ${i + 1} Data`,
      hash: '',
      prevHash,
      timestamp: Date.now(),
      difficulty,
      isTampered: false,
    }
    blocks.push(block)
    prevHash = block.hash // will be computed below
  }

  // Compute actual hashes
  let pHash = GENESIS_PREV_HASH
  for (const block of blocks) {
    block.prevHash = pHash
    block.hash = computeSHA256Sync(`${block.id}${block.nonce}${block.data}${block.prevHash}`)
    pHash = block.hash
  }

  return blocks
}

// Sync version of sha256 for initial data (using Web Crypto is async, so we compute lazily)
function computeSHA256Sync(input: string): string {
  // Since Web Crypto is async, we'll use a simple approach for initial state
  // In practice, blocks will be computed asynchronously when needed
  return '0'.repeat(64) // placeholder - will be computed properly when page loads
}

interface NetworkState {
  peers: Peer[]
  packets: BroadcastPacket[]
  isSimulatingFork: boolean
  difficulty: number
  initPeers: (difficulty: number) => void
  addBlockToPeer: (peerId: number, block: Block) => void
  startBroadcast: (fromPeer: number, toPeer: number, block: Block) => void
  updatePacketProgress: (packetId: string, progress: number) => void
  removePacket: (packetId: string) => void
  triggerFork: () => void
  resolveFork: () => void
  syncPeer: (peerId: number, sourcePeerId: number) => void
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  peers: [],
  packets: [],
  isSimulatingFork: false,
  difficulty: 2,

  initPeers: async (difficulty: number) => {
    // Create 3 peers with default blocks - hashes will be computed async in the page
    const baseBlocks: Block[] = []
    let prevHash = GENESIS_PREV_HASH
    const nonces = [11316, 35230, 12937, 35990, 56265]

    for (let i = 0; i < 5; i++) {
      baseBlocks.push({
        id: i + 1,
        nonce: nonces[i],
        data: `Block ${i + 1} Data`,
        hash: '',
        prevHash,
        timestamp: Date.now(),
        difficulty,
        isTampered: false,
      })
    }

    const peers: Peer[] = [
      { id: 1, label: 'A', x: 0.2, y: 0.15, blocks: baseBlocks.map(b => ({ ...b })), isSynced: true, syncStatus: 'synced' },
      { id: 2, label: 'B', x: 0.5, y: 0.15, blocks: baseBlocks.map(b => ({ ...b })), isSynced: true, syncStatus: 'synced' },
      { id: 3, label: 'C', x: 0.8, y: 0.15, blocks: baseBlocks.map(b => ({ ...b })), isSynced: true, syncStatus: 'synced' },
    ]

    set({ peers, difficulty })
  },

  addBlockToPeer: (peerId: number, block: Block) => {
    set(state => ({
      peers: state.peers.map(p =>
        p.id === peerId ? { ...p, blocks: [...p.blocks, block] } : p
      ),
    }))
  },

  startBroadcast: (fromPeer: number, toPeer: number, block: Block) => {
    const packet: BroadcastPacket = {
      id: `pkt-${Date.now()}-${Math.random()}`,
      fromPeer,
      toPeer,
      block,
      progress: 0,
    }
    set(state => ({ packets: [...state.packets, packet] }))
  },

  updatePacketProgress: (packetId: string, progress: number) => {
    set(state => ({
      packets: state.packets.map(p =>
        p.id === packetId ? { ...p, progress } : p
      ),
    }))
  },

  removePacket: (packetId: string) => {
    set(state => ({
      packets: state.packets.filter(p => p.id !== packetId),
    }))
  },

  triggerFork: () => {
    set({ isSimulatingFork: true })
  },

  resolveFork: () => {
    set({ isSimulatingFork: false })
  },

  syncPeer: (peerId: number, sourcePeerId: number) => {
    set(state => {
      const source = state.peers.find(p => p.id === sourcePeerId)
      if (!source) return state
      return {
        peers: state.peers.map(p =>
          p.id === peerId ? { ...p, blocks: source.blocks.map(b => ({ ...b })), isSynced: true, syncStatus: 'synced' as const } : p
        ),
      }
    })
  },
}))
