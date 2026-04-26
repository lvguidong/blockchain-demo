import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
  { path: '/hash', label: 'Hash' },
  { path: '/block', label: 'Block' },
  { path: '/blockchain', label: 'Blockchain' },
  { path: '/distributed', label: 'Distributed' },
  { path: '/tokens', label: 'Tokens' },
  { path: '/coinbase', label: 'Coinbase' },
]

const Navbar: React.FC = () => {
  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <NavLink to="/" className={styles.brand}>
          Blockchain Demo
        </NavLink>
        <div className={styles.links}>
          {NAV_ITEMS.map(item => (
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
      </div>
    </nav>
  )
}

export default Navbar
