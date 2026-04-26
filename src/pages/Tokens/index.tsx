import React, { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Account, Transaction } from '@/types'
import { particleSystem } from '@/components/ParticleSystem'
import { COLORS } from '@/config/canvas'
import { hexToRgba } from '@/utils/animations'
import CanvasLayer, { type CanvasLayerRef } from '@/components/CanvasLayer'
import styles from './TokensPage.module.css'

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'alice', name: 'Alice', balance: 100, color: COLORS.blue },
  { id: 'bob', name: 'Bob', balance: 50, color: COLORS.green },
  { id: 'charlie', name: 'Charlie', balance: 25, color: COLORS.purple },
]

const TokensPage: React.FC = () => {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fromId, setFromId] = useState('alice')
  const [toId, setToId] = useState('bob')
  const [amount, setAmount] = useState(10)
  const [error, setError] = useState('')
  const canvasLayerRef = useRef<CanvasLayerRef | null>(null)

  const handleSend = useCallback(() => {
    setError('')

    const from = accounts.find(a => a.id === fromId)
    const to = accounts.find(a => a.id === toId)

    if (!from || !to) {
      setError(t('tokens.invalidSender'))
      return
    }

    if (fromId === toId) {
      setError(t('tokens.selfSend'))
      return
    }

    if (amount <= 0) {
      setError(t('tokens.positiveAmount'))
      return
    }

    if (from.balance < amount) {
      setError(t('tokens.insufficient', { name: from.name, balance: from.balance.toFixed(2) }))
      return
    }

    const container = canvasLayerRef.current?.container
    if (container) {
      const rect = container.getBoundingClientRect()
      const fromIdx = accounts.findIndex(a => a.id === fromId)
      const toIdx = accounts.findIndex(a => a.id === toId)
      const spacing = rect.width / (accounts.length + 1)
      const fromX = spacing * (fromIdx + 1)
      const toX = spacing * (toIdx + 1)

      particleSystem.emitFlight(fromX, rect.height * 0.3, toX, rect.height * 0.3)
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      from: fromId,
      to: toId,
      amount,
      timestamp: Date.now(),
      fee: 0.01,
    }

    setAccounts(prev =>
      prev.map(a => {
        if (a.id === fromId) return { ...a, balance: a.balance - amount }
        if (a.id === toId) return { ...a, balance: a.balance + amount }
        return a
      })
    )

    setTransactions(prev => [newTx, ...prev].slice(0, 10))
    setAmount(10)
  }, [fromId, toId, amount, accounts, t])

  // Static draw
  const onStaticDraw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const avatarY = height * 0.3
    const spacing = width / (accounts.length + 1)

    accounts.forEach((account, i) => {
      const x = spacing * (i + 1)

      ctx.beginPath()
      ctx.arc(x, avatarY, 32, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(account.color, 0.15)
      ctx.fill()
      ctx.strokeStyle = account.color
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = account.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(account.name[0], x, avatarY)

      ctx.font = '13px sans-serif'
      ctx.fillStyle = COLORS.textPrimary
      ctx.textBaseline = 'top'
      ctx.fillText(account.name, x, avatarY + 44)

      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = COLORS.gold
      ctx.fillText(`${account.balance.toFixed(2)}`, x, avatarY + 62)

      ctx.font = '10px sans-serif'
      ctx.fillStyle = COLORS.textMuted
      ctx.fillText(t('tokens.tokens'), x, avatarY + 80)
    })

    ctx.strokeStyle = hexToRgba(COLORS.borderDefault, 0.3)
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    for (let i = 0; i < accounts.length - 1; i++) {
      const fromX = spacing * (i + 1)
      const toX = spacing * (i + 2)
      ctx.beginPath()
      ctx.moveTo(fromX + 32, avatarY)
      ctx.lineTo(toX - 32, avatarY)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }, [accounts, t])

  // Animation draw
  const onAnimDraw = useCallback((ctx: CanvasRenderingContext2D, _width: number, _height: number, dt: number) => {
    particleSystem.update(dt)
    particleSystem.draw(ctx)
  }, [])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('tokens.title')}</h1>
      <p className={styles.description}>{t('tokens.description')}</p>

      <div className={styles.canvasWrapper}>
        <CanvasLayer
          ref={canvasLayerRef}
          onStaticDraw={onStaticDraw}
          onAnimDraw={onAnimDraw}
        />
      </div>

      <div className={styles.transferForm}>
        <div className={styles.formGroup}>
          <label className={styles.label}>{t('tokens.from')}</label>
          <select
            className={styles.select}
            value={fromId}
            onChange={e => setFromId(e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.balance.toFixed(2)})</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('tokens.amount')}</label>
          <input
            type="number"
            className={styles.input}
            value={amount}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            min="0.01"
            step="0.01"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('tokens.to')}</label>
          <select
            className={styles.select}
            value={toId}
            onChange={e => setToId(e.target.value)}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.balance.toFixed(2)})</option>
            ))}
          </select>
        </div>

        <button
          className={`${styles.sendBtn} ${error ? styles.sendBtnError : ''}`}
          onClick={handleSend}
        >
          {t('tokens.send')}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {transactions.length > 0 && (
        <div className={styles.txHistory}>
          <h3 className={styles.historyTitle}>{t('tokens.recentTx')}</h3>
          {transactions.map(tx => {
            const from = accounts.find(a => a.id === tx.from)
            const to = accounts.find(a => a.id === tx.to)
            return (
              <div key={tx.id} className={styles.txRow}>
                <span className={styles.txFrom} style={{ color: from?.color }}>
                  {from?.name}
                </span>
                <span className={styles.txArrow}>→</span>
                <span className={styles.txTo} style={{ color: to?.color }}>
                  {to?.name}
                </span>
                <span className={styles.txAmount}>{tx.amount.toFixed(2)} {t('tokens.tokens')}</span>
                <span className={styles.txFee}>({tx.fee} {t('tokens.fee')})</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TokensPage
