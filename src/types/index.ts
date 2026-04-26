export interface Block {
  id: number
  nonce: number
  data: string
  hash: string
  prevHash: string
  timestamp: number
  difficulty: number
  isTampered: boolean
}

export interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  timestamp: number
  fee: number
}

export interface Peer {
  id: number
  label: string
  x: number
  y: number
  blocks: Block[]
  isSynced: boolean
  syncStatus: 'synced' | 'delayed' | 'forked'
}

export type ParticleType = 'flow' | 'firework' | 'flight' | 'coin' | 'spark' | 'surge'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: ParticleType
  targetX?: number
  targetY?: number
  gravity?: number
  trail?: { x: number; y: number }[]
}

export interface Vector2D {
  x: number
  y: number
}

export type MiningStatus = 'idle' | 'mining' | 'success' | 'error'

export interface BroadcastPacket {
  id: string
  fromPeer: number
  toPeer: number
  block: Block
  progress: number
}

export interface Account {
  id: string
  name: string
  balance: number
  color: string
}
