import { create } from 'zustand'
import type { MiningStatus } from '@/types'

interface MiningState {
  status: MiningStatus
  currentNonce: number
  iterations: number
  activeBlockId: number | null
  startMining: (blockId: number) => void
  updateNonce: (nonce: number, iterations: number) => void
  finishMining: () => void
  reset: () => void
}

export const useMiningStore = create<MiningState>(set => ({
  status: 'idle',
  currentNonce: 0,
  iterations: 0,
  activeBlockId: null,

  startMining: (blockId: number) =>
    set({ status: 'mining', currentNonce: 0, iterations: 0, activeBlockId: blockId }),

  updateNonce: (nonce: number, iterations: number) =>
    set({ currentNonce: nonce, iterations }),

  finishMining: () =>
    set({ status: 'success', activeBlockId: null }),

  reset: () =>
    set({ status: 'idle', currentNonce: 0, iterations: 0, activeBlockId: null }),
}))
