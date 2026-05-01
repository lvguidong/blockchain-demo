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
  cancelMining: () => void
  reset: () => void
}

let abortController: AbortController | null = null

export const useMiningStore = create<MiningState>(set => ({
  status: 'idle',
  currentNonce: 0,
  iterations: 0,
  activeBlockId: null,

  startMining: (blockId: number) => {
    abortController = new AbortController()
    set({ status: 'mining', currentNonce: 0, iterations: 0, activeBlockId: blockId })
  },

  updateNonce: (nonce: number, iterations: number) =>
    set({ currentNonce: nonce, iterations }),

  finishMining: () => {
    abortController = null
    set({ status: 'success', activeBlockId: null })
  },

  cancelMining: () => {
    abortController?.abort()
    abortController = null
    set({ status: 'idle', currentNonce: 0, iterations: 0, activeBlockId: null })
  },

  reset: () => {
    abortController = null
    set({ status: 'idle', currentNonce: 0, iterations: 0, activeBlockId: null })
  },
}))

export function getMineAbortSignal(): AbortSignal | undefined {
  return abortController?.signal
}
