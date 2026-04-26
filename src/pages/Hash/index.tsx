import React, { useState, useCallback, useRef, useEffect } from 'react'
import { computeSHA256, countLeadingZeros } from '@/utils/sha256'
import HashDisplay from '@/components/HashDisplay'
import { particleSystem } from '@/components/ParticleSystem'
import { COLORS } from '@/config/canvas'
import { hexToRgba } from '@/utils/animations'
import styles from './HashPage.module.css'

const AVALANCHE_PAIRS = [
  { a: 'hello world', b: 'hello wordl' },
  { a: 'blockchain', b: 'blockchaiN' },
  { a: 'the quick brown fox', b: 'The quick brown fox' },
]

const HashPage: React.FC = () => {
  const [input, setInput] = useState('')
  const [hash, setHash] = useState('')
  const [prevHash, setPrevHash] = useState('')
  const [leadingZeros, setLeadingZeros] = useState(0)
  const [avalancheIndex, setAvalancheIndex] = useState(0)
  const [avalancheHash, setAvalancheHash] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleInput = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    setPrevHash(hash)
    const result = await computeSHA256(value)
    setHash(result)
    setLeadingZeros(countLeadingZeros(result))

    // Emit flow particles
    if (inputRef.current && outputRef.current && containerRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect()
      const outputRect = outputRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      const fromX = inputRect.left + inputRect.width / 2 - containerRect.left
      const fromY = inputRect.top + inputRect.height / 2 - containerRect.top
      const toX = outputRect.left + outputRect.width / 2 - containerRect.left
      const toY = outputRect.top + outputRect.height / 2 - containerRect.top

      particleSystem.emitFlow(fromX, fromY, toX, toY, 5)
    }
  }, [hash])

  // Handle avalanche demo
  useEffect(() => {
    const pair = AVALANCHE_PAIRS[avalancheIndex]
    computeSHA256(pair.b).then(setAvalancheHash)
  }, [avalancheIndex])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>SHA256 Hash</h1>
      <p className={styles.description}>
        Type anything to see its SHA256 hash. Notice how changing even one character produces a completely different hash.
      </p>

      <div className={styles.avalanche}>
        <span className={styles.avalancheLabel}>Avalanche Demo:</span>
        <div className={styles.avalancheButtons}>
          {AVALANCHE_PAIRS.map((pair, i) => (
            <button
              key={i}
              className={`${styles.avalancheBtn} ${avalancheIndex === i ? styles.avalancheBtnActive : ''}`}
              onClick={() => setAvalancheIndex(i)}
            >
              "{pair.a}" vs "{pair.b}"
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className={styles.container}>
        <div className={styles.column}>
          <label className={styles.label}>Input Data</label>
          <textarea
            ref={inputRef}
            className={styles.textarea}
            rows={8}
            value={input}
            onChange={handleInput}
            placeholder="Type anything here..."
          />
          <div className={styles.inputInfo}>
            <span className={styles.infoItem}>{input.length} characters</span>
            <span className={styles.infoItem}>{new TextEncoder().encode(input).length} bytes</span>
          </div>
        </div>

        <div className={styles.column}>
          <label className={styles.label}>SHA256 Hash</label>
          <div ref={outputRef} className={styles.hashOutput}>
            {hash ? (
              <HashDisplay hash={hash} difficulty={leadingZeros} previousHash={prevHash} animate />
            ) : (
              <span className={styles.placeholder}>Waiting for input...</span>
            )}
          </div>
          <div className={styles.hashInfo}>
            <span className={styles.infoItem}>Leading zeros: <strong className={styles.gold}>{leadingZeros}</strong></span>
            <span className={styles.infoItem}>64 hex characters (256 bits)</span>
          </div>
        </div>
      </div>

      {avalancheHash && (
        <div className={styles.avalancheResult}>
          <h3 className={styles.avalancheTitle}>Compare: One Character Changed</h3>
          <div className={styles.avalancheRow}>
            <div>
              <div className={styles.avalancheInput}>"{AVALANCHE_PAIRS[avalancheIndex].a}"</div>
              <HashDisplay hash={hash} difficulty={0} />
            </div>
            <div className={styles.versus}>vs</div>
            <div>
              <div className={styles.avalancheInput}>"{AVALANCHE_PAIRS[avalancheIndex].b}"</div>
              <HashDisplay hash={avalancheHash} difficulty={0} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HashPage
