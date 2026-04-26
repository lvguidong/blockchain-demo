import React, { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Account, Transaction } from '@/types'
import { particleSystem } from '@/components/ParticleSystem'
import { COLORS } from '@/config/canvas'
import { hexToRgba } from '@/utils/animations'
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
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSend = useCallback(() => {
    setError('')

    const from = accounts.find(a => a.id === fromId)
    const to = accounts.find(a => a.id === toId)

    if (!from || !to) {
      setError('Invalid sender or receiver')
      return
    }

    if (fromId === toId) {
      setError('Cannot send to yourself')
      return
    }

    if (amount <= 0) {
      setError('Amount must be positive')
      return
    }

    if (from.balance < amount) {
      setError(`Insufficient funds. ${from.name} has ${from.balance} tokens.`)
      // Shake animation effect via CSS
      return
    }

    // Emit flight particles
    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      const fromIdx = accounts.findIndex(a => a.id === fromId)
      const toIdx = accounts.findIndex(a => a.id === toId)
      const fromX = ((fromIdx + 1) / (accounts.length + 1)) * rect.width
      const toX = ((toIdx + 1) / (accounts.length + 1)) * rect.width

      particleSystem.emitFlight(fromX, rect.height * 0.3, toX, rect.height * 0.3)
    }

    // Update balances
    const newTransactions: Transaction = {
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

    setTransactions(prev => [newTransactions, ...prev].slice(0, 10))
    setAmount(10)
  }, [fromId, toId, amount, accounts])

  // Static draw: account avatars on canvas
  const onStaticDraw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const avatarY = height * 0.3
    const spacing = width / (accounts.length + 1)

    accounts.forEach((account, i) => {
      const x = spacing * (i + 1)

      // Avatar circle
      ctx.beginPath()
      ctx.arc(x, avatarY, 32, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(account.color, 0.15)
      ctx.fill()
      ctx.strokeStyle = account.color
      ctx.lineWidth = 2
      ctx.stroke()

      // Avatar initial
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = account.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(account.name[0], x, avatarY)

      // Name label
      ctx.font = '13px sans-serif'
      ctx.fillStyle = COLORS.textPrimary
      ctx.textBaseline = 'top'
      ctx.fillText(account.name, x, avatarY + 44)

      // Balance
      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = COLORS.gold
      ctx.fillText(`${account.balance.toFixed(2)}`, x, avatarY + 62)

      // Token label
      ctx.font = '10px sans-serif'
      ctx.fillStyle = COLORS.textMuted
      ctx.fillText('tokens', x, avatarY + 80)
    })

    // Connection lines between accounts
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
  }, [accounts])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('tokens.title')}</h1>
      <p className={styles.description}>{t('tokens.description')}</p>

      <div ref={containerRef} className={styles.canvasWrapper}>
        <canvas className={styles.canvas} />
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
