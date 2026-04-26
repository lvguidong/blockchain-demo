import React, { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import i18n from '@/i18n'
import styles from './Navbar.module.css'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

const Navbar: React.FC = () => {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useThemeStore()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLangChange = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setLangOpen(false)
  }

  const navItems = [
    { path: '/hash', label: t('nav.hash') },
    { path: '/block', label: t('nav.block') },
    { path: '/blockchain', label: t('nav.blockchain') },
    { path: '/distributed', label: t('nav.distributed') },
    { path: '/tokens', label: t('nav.tokens') },
    { path: '/coinbase', label: t('nav.coinbase') },
  ]

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <NavLink to="/" className={styles.brand}>
          {t('nav.title')}
        </NavLink>
        <div className={styles.links}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.linkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className={styles.controls}>
          {/* Language selector */}
          <div className={styles.langWrap} ref={langRef}>
            <button
              className={styles.langBtn}
              onClick={() => setLangOpen(!langOpen)}
              aria-label="Select language"
            >
              <span>{currentLang.flag}</span>
              <span className={styles.langLabel}>{currentLang.label}</span>
              <svg className={styles.chevron} viewBox="0 0 12 12" width="12" height="12">
                <path d="M3 5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {langOpen && (
              <div className={styles.langDropdown}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`${styles.langOption} ${lang.code === i18n.language ? styles.langOptionActive : ''}`}
                    onClick={() => handleLangChange(lang.code)}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
