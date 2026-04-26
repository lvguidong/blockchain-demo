import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './DifficultySlider.module.css'

interface DifficultySliderProps {
  difficulty: number
  onChange: (difficulty: number) => void
  min?: number
  max?: number
}

const DifficultySlider: React.FC<DifficultySliderProps> = ({
  difficulty,
  onChange,
  min = 1,
  max = 6,
}) => {
  const { t } = useTranslation()
  const estimatedIterations = Math.pow(16, difficulty)
  const formattedIterations = estimatedIterations >= 1e9
    ? `${(estimatedIterations / 1e9).toFixed(1)}B`
    : estimatedIterations >= 1e6
    ? `${(estimatedIterations / 1e6).toFixed(1)}M`
    : estimatedIterations >= 1e3
    ? `${(estimatedIterations / 1e3).toFixed(1)}K`
    : `${estimatedIterations}`

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>{t('block.difficulty')}</span>
        <span className={styles.value}>{difficulty}</span>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        value={difficulty}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
      <div className={styles.footer}>
        <span className={styles.muted}>~{formattedIterations} {t('block.attempts')}</span>
        <span className={styles.target}>{t('block.target')}: {'0'.repeat(difficulty)}...</span>
      </div>
    </div>
  )
}

export default DifficultySlider
