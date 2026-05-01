export interface MineResult {
  nonce: number
  hash: string
  iterations: number
}

export async function mineBlock(
  data: string,
  prevHash: string,
  blockNumber: number,
  difficulty: number,
  startNonce = 0,
  batchSize = 100000,
  onProgress?: (nonce: number) => void,
  signal?: AbortSignal
): Promise<MineResult | null> {
  const target = '0'.repeat(difficulty)
  const maxNonce = startNonce + batchSize

  for (let nonce = startNonce; nonce < maxNonce; nonce++) {
    if (signal?.aborted) return null

    const input = `${blockNumber}${nonce}${data}${prevHash}`
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (hash.startsWith(target)) {
      return { nonce, hash, iterations: nonce - startNonce + 1 }
    }

    if (onProgress && nonce % 5000 === 0) {
      onProgress(nonce)
    }
  }

  // Yield to event loop so UI can render between batches
  await new Promise<void>(resolve => setTimeout(resolve, 0))

  onProgress?.(maxNonce)
  return null
}

export function getTargetPrefix(difficulty: number): string {
  return '0'.repeat(difficulty)
}

export function getEstimatedIterations(difficulty: number): number {
  return Math.pow(16, difficulty)
}
