'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('bp-theme') as Theme | null
    if (stored === 'light' || stored === 'dark') setTheme(stored)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '')
    localStorage.setItem('bp-theme', theme)
  }, [theme, mounted])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  // NOTE: this used to `return null` until mounted, which meant the server HTML
  // was thrown away and the whole app painted blank until JS loaded, hydrated,
  // and this effect ran. The theme is now applied pre-paint by an inline script
  // in the root layout, so children render immediately and there is still no
  // flash. This is the single biggest first-load win in the app.
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
