import { particleSystem } from '@/components/ParticleSystem'
import { COLORS } from '@/config/canvas'

interface MineAnimationState {
  isMining: boolean
  isSuccess: boolean
  centerX: number
  centerY: number
  surgeTimer: number
}

let state: MineAnimationState = {
  isMining: false,
  isSuccess: false,
  centerX: 0,
  centerY: 0,
  surgeTimer: 0,
}

export function startMining(centerX: number, centerY: number) {
  state = { isMining: true, isSuccess: false, centerX, centerY, surgeTimer: 0 }
}

export function triggerSuccess(centerX: number, centerY: number) {
  state.isMining = false
  state.isSuccess = true
  particleSystem.emitFirework(centerX, centerY, 50, COLORS.gold)
  particleSystem.emitFirework(centerX - 20, centerY - 10, 30, COLORS.green)
  particleSystem.emitFirework(centerX + 20, centerY - 10, 30, COLORS.cyan)
  setTimeout(() => { state.isSuccess = false }, 2000)
}

export function stopMining() {
  state.isMining = false
  state.isSuccess = false
}

export function updateMineAnimation(dt: number) {
  if (state.isMining) {
    state.surgeTimer += dt
    if (state.surgeTimer > 100) {
      state.surgeTimer = 0
      particleSystem.emitSurge(state.centerX, state.centerY, 8)
    }
  }
}
