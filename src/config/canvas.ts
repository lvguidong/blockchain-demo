export const COLORS = {
  bgPrimary: '#0a0e17',
  bgSurface: '#1a1f2e',
  bgSurfaceHover: '#252b3b',
  bgCard: '#1e2538',
  borderDefault: '#2d3748',
  borderMining: '#fbbf24',
  borderSuccess: '#22c55e',
  borderError: '#ef4444',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  gold: '#fbbf24',
  goldGlow: '#f59e0b',
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a855f7',
  cyan: '#06b6d4',
  pink: '#ec4899',
  orange: '#f97316',
  white: '#ffffff',
  arrowDefault: '#4a5568',
  arrowValid: '#22c55e',
  arrowInvalid: '#ef4444',
  nodeLine: '#2d3748',
  nodeLineActive: '#3b82f6',
}

export const PARTICLE_COUNTS = {
  flow: 8,
  firework: 40,
  flight: 15,
  coin: 10,
  spark: 6,
  surge: 20,
}

export const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)

export const PARTICLE_POOL_SIZE = 500

export const ANIMATION = {
  fireworkDuration: 1000,
  flightDuration: 800,
  coinDropDuration: 1200,
  flowDuration: 600,
  sparkDuration: 300,
  surgeDuration: 400,
}
