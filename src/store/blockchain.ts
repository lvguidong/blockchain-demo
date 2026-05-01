import { create } from 'zustand'
import type { Block } from '@/types'
import { computeSHA256 } from '@/utils/sha256'
import { mineBlock } from '@/utils/mining'

const GENESIS_PREV_HASH = '0'.repeat(64)

function createBlock(id: number, nonce: number, data: string, prevHash: string, difficulty: number): Block {
  return { id, nonce, data, hash: '', prevHash, timestamp: Date.now(), difficulty, isTampered: false }
}

async function computeBlockHash(block: Block): Promise<string> {
  return computeSHA256(`${block.id}${block.nonce}${block.data}${block.prevHash}`)
}

interface BlockchainState {
  blocks: Block[]
  difficulty: number
  initialized: boolean
  addBlock: () => Promise<void>
  updateBlockData: (blockId: number, data: string) => Promise<void>
  updateBlockNonce: (blockId: number, nonce: number) => Promise<void>
  tamperBlock: (blockId: number) => Promise<void>
  fixChain: (fromBlockId: number, difficulty: number) => Promise<boolean>
  setDifficulty: (difficulty: number) => void
  reset: () => void
  initChain: (count: number, difficulty: number) => Promise<void>
}

export const useBlockchainStore = create<BlockchainState>((set, get) => ({
  blocks: [],
  difficulty: 2,
  initialized: false,

  initChain: async (count: number, difficulty: number) => {
    const blocks: Block[] = []
    let prevHash = GENESIS_PREV_HASH

    for (let i = 1; i <= count; i++) {
      const nonce = 0
      const block = createBlock(i, nonce, `Block ${i} Data`, prevHash, difficulty)
      block.hash = await computeBlockHash(block)
      blocks.push(block)
      prevHash = block.hash
    }

    set({ blocks, difficulty, initialized: true })
  },

  addBlock: async () => {
    const { blocks, difficulty } = get()
    if (blocks.length === 0) return

    const lastBlock = blocks[blocks.length - 1]
    const newId = lastBlock.id + 1
    const block = createBlock(newId, 0, `Block ${newId} Data`, lastBlock.hash, difficulty)
    block.hash = await computeBlockHash(block)

    set({ blocks: [...blocks, block] })
  },

  updateBlockData: async (blockId: number, data: string) => {
    const { blocks } = get()
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx === -1) return

    const newBlocks = [...blocks]
    newBlocks[idx] = { ...newBlocks[idx], data }
    newBlocks[idx].hash = await computeBlockHash(newBlocks[idx])
    newBlocks[idx].isTampered = false

    // Invalidate all subsequent blocks
    for (let i = idx + 1; i < newBlocks.length; i++) {
      newBlocks[i] = { ...newBlocks[i], prevHash: newBlocks[i - 1].hash }
      newBlocks[i].hash = await computeBlockHash(newBlocks[i])
      newBlocks[i].isTampered = true
    }

    set({ blocks: newBlocks })
  },

  updateBlockNonce: async (blockId: number, nonce: number) => {
    const { blocks } = get()
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx === -1) return

    const newBlocks = [...blocks]
    newBlocks[idx] = { ...newBlocks[idx], nonce }
    newBlocks[idx].hash = await computeBlockHash(newBlocks[idx])
    newBlocks[idx].isTampered = false

    // Invalidate all subsequent blocks
    for (let i = idx + 1; i < newBlocks.length; i++) {
      newBlocks[i] = { ...newBlocks[i], prevHash: newBlocks[i - 1].hash }
      newBlocks[i].hash = await computeBlockHash(newBlocks[i])
      newBlocks[i].isTampered = true
    }

    set({ blocks: newBlocks })
  },

  tamperBlock: async (blockId: number) => {
    const { blocks } = get()
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx === -1) return

    const newBlocks = [...blocks]
    // Tamper by prepending "TAMPERED" to data
    newBlocks[idx] = {
      ...newBlocks[idx],
      data: 'TAMPERED: ' + newBlocks[idx].data,
    }
    newBlocks[idx].hash = await computeBlockHash(newBlocks[idx])
    newBlocks[idx].isTampered = true

    // Invalidate all subsequent blocks
    for (let i = idx + 1; i < newBlocks.length; i++) {
      newBlocks[i] = { ...newBlocks[i], prevHash: newBlocks[i - 1].hash }
      newBlocks[i].hash = await computeBlockHash(newBlocks[i])
      newBlocks[i].isTampered = true
    }

    set({ blocks: newBlocks })
  },

  fixChain: async (fromBlockId: number, difficulty: number) => {
    const { blocks } = get()
    const idx = blocks.findIndex(b => b.id === fromBlockId)
    if (idx === -1) return false

    const target = '0'.repeat(difficulty)
    const newBlocks = [...blocks]

    // Set the tampered block's data back (remove TAMPERED prefix)
    if (newBlocks[idx].data.startsWith('TAMPERED: ')) {
      newBlocks[idx] = { ...newBlocks[idx], data: newBlocks[idx].data.slice(10) }
    }
    newBlocks[idx].isTampered = false

    // Mine each block from this point forward using the same batched approach
    for (let i = idx; i < newBlocks.length; i++) {
      if (i > 0) {
        newBlocks[i] = { ...newBlocks[i], prevHash: newBlocks[i - 1].hash }
      }

      const result = await mineBlock(
        newBlocks[i].data,
        newBlocks[i].prevHash,
        newBlocks[i].id,
        difficulty,
        0,
        100000
      )

      if (result) {
        newBlocks[i] = { ...newBlocks[i], nonce: result.nonce, hash: result.hash, isTampered: false }
      }
    }

    set({ blocks: newBlocks })
    return true
  },

  setDifficulty: (difficulty: number) => {
    set({ difficulty })
  },

  reset: () => {
    set({ blocks: [], difficulty: 2, initialized: false })
  },
}))
