import type { Peer, BroadcastPacket, Vector2D } from '@/types'
import { COLORS } from '@/config/canvas'
import { hexToRgba } from '@/utils/animations'
import { lerp } from '@/utils/animations'

export function drawTopology(
  ctx: CanvasRenderingContext2D,
  peers: Peer[],
  packets: BroadcastPacket[],
  width: number,
  height: number,
  canvasOffset: { top: number; left: number }
) {
  if (peers.length === 0) return

  // Convert relative positions to canvas coordinates
  const nodePositions: Record<number, Vector2D> = {}

  for (const peer of peers) {
    const x = peer.x * width
    const y = peer.y * height
    nodePositions[peer.id] = { x, y }

    // Draw node circle
    ctx.beginPath()
    ctx.arc(x, y, 24, 0, Math.PI * 2)

    // Node color based on sync status
    let nodeColor = COLORS.green
    if (peer.syncStatus === 'delayed') nodeColor = COLORS.orange
    if (peer.syncStatus === 'forked') nodeColor = COLORS.red

    ctx.fillStyle = hexToRgba(nodeColor, 0.2)
    ctx.fill()
    ctx.strokeStyle = nodeColor
    ctx.lineWidth = 2
    ctx.stroke()

    // Node label
    ctx.fillStyle = COLORS.textPrimary
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(peer.label, x, y)
  }

  // Draw connection lines between peers
  for (let i = 0; i < peers.length; i++) {
    for (let j = i + 1; j < peers.length; j++) {
      const from = nodePositions[peers[i].id]
      const to = nodePositions[peers[j].id]
      if (!from || !to) continue

      const isBothSynced = peers[i].isSynced && peers[j].isSynced
      const lineColor = isBothSynced ? COLORS.arrowValid : COLORS.arrowInvalid

      ctx.beginPath()
      ctx.moveTo(from.x, from.y + 24)
      ctx.lineTo(to.x, to.y + 24)
      ctx.strokeStyle = hexToRgba(lineColor, 0.3)
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // Draw broadcast packets
  for (const packet of packets) {
    const fromPos = nodePositions[packet.fromPeer]
    const toPos = nodePositions[packet.toPeer]
    if (!fromPos || !toPos) continue

    const px = lerp(fromPos.x, toPos.x, packet.progress)
    const py = lerp(fromPos.y, toPos.y, packet.progress)

    // Packet glow
    ctx.beginPath()
    ctx.arc(px, py, 12, 0, Math.PI * 2)
    ctx.fillStyle = hexToRgba(COLORS.blue, 0.3)
    ctx.fill()

    // Packet core
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.blue
    ctx.fill()

    // Inner highlight
    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.white
    ctx.fill()
  }
}

export function getNodePosition(
  peer: Peer,
  width: number,
  height: number
): Vector2D {
  return { x: peer.x * width, y: peer.y * height }
}

export function getPeerBelowPosition(
  peer: Peer,
  width: number,
  height: number,
  blockIndex: number,
  totalBlocks: number
): Vector2D {
  const baseY = peer.y * height + 80
  const spacing = Math.min(80, (height - baseY - 40) / totalBlocks)
  return {
    x: peer.x * width,
    y: baseY + blockIndex * spacing,
  }
}
