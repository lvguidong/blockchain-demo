import React, { useMemo } from 'react'
import styles from './HashDisplay.module.css'

interface HashDisplayProps {
  hash: string
  difficulty: number
  previousHash?: string
  animate?: boolean
  onClick?: () => void
}

const HashDisplay: React.FC<HashDisplayProps> = ({ hash, difficulty, previousHash, animate = false, onClick }) => {
  const chars = useMemo(() => {
    if (!hash) return []
    return hash.split('')
  }, [hash])

  const prevChars = useMemo(() => {
    if (!previousHash) return []
    return previousHash.split('')
  }, [previousHash])

  if (!hash) return null

  return (
    <div className={styles.container} onClick={onClick}>
      {chars.map((char, i) => {
        const isLeadingZero = i < difficulty
        const isChanged = animate && prevChars[i] !== undefined && prevChars[i] !== char
        return (
          <span
            key={i}
            className={`${styles.char} ${isLeadingZero ? styles.leadingZero : ''} ${isChanged ? styles.changed : ''}`}
          >
            {char}
          </span>
        )
      })}
    </div>
  )
}

export default HashDisplay
