export async function computeSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function countLeadingZeros(hash: string): number {
  let count = 0
  for (const char of hash) {
    if (char === '0') count++
    else break
  }
  return count
}

export function hashMatchesDifficulty(hash: string, difficulty: number): boolean {
  const requiredZeros = difficulty
  return countLeadingZeros(hash) >= requiredZeros
}
