import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export const PALETTES = [
  { id: 'dark',   label: 'Escuro',   dark: true },
  { id: 'claude', label: 'Claude',   dark: false },
  { id: 'pastel', label: 'Pastel',   dark: false },
  { id: 'mono',   label: 'Preto & Branco', dark: false },
]

export function ThemeProvider({ children }) {
  const [palette, setPaletteState] = useState(() => localStorage.getItem('app-palette') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette)
    localStorage.setItem('app-palette', palette)
  }, [palette])

  const setPalette = (p) => setPaletteState(p)

  // Mantido por compatibilidade: alterna entre o último claro usado e o escuro
  const toggleTheme = () => setPaletteState((p) => (p === 'dark' ? 'claude' : 'dark'))

  const current = PALETTES.find((p) => p.id === palette) || PALETTES[0]

  return (
    <ThemeContext.Provider value={{ palette, setPalette, palettes: PALETTES, isDark: current.dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
