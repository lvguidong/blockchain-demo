import { create } from 'zustand'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark'

export const useThemeStore = create<ThemeState>((set) => ({
  theme: savedTheme,
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return { theme: next }
    })
  },
}))

// Apply theme on module load
document.documentElement.setAttribute('data-theme', savedTheme)
