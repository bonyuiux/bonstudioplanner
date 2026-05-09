'use client'

import { useTheme } from './ThemeProvider'

// Moon SVG for dark mode indicator
function MoonIcon({ faded }: { faded?: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      className={faded ? 'opacity-30' : 'opacity-90'}
    >
      <path
        d="M8.5 6.5A4 4 0 0 1 3.5 1.5a4 4 0 1 0 5 5z"
        fill="currentColor"
      />
    </svg>
  )
}

// Sun SVG for light mode indicator
function SunIcon({ faded }: { faded?: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      className={faded ? 'opacity-30' : 'opacity-90'}
    >
      <circle cx="5" cy="5" r="2" fill="currentColor" />
      <line x1="5" y1="0.5" x2="5" y2="2"   stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="5" y1="8"   x2="5" y2="9.5"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="0.5" y1="5" x2="2"   y2="5"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="8"   y1="5" x2="9.5" y2="5"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="1.8" y1="1.8" x2="2.9" y2="2.9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="7.1" y1="7.1" x2="8.2" y2="8.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="7.1" y1="1.8" x2="8.2" y2="2.9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="1.8" y1="7.1" x2="2.9" y2="8.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        width: 48,
        height: 24,
        borderRadius: 50,
        background: '#2A2520',
        border: '1px solid rgba(245,243,240,0.12)',
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        flexShrink: 0,
      }}
    >
      {/* Inactive icon (opposite side) */}
      <span
        style={{
          position: 'absolute',
          left: isDark ? 'auto' : 6,
          right: isDark ? 6 : 'auto',
          color: '#F5F3F0',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {isDark ? <SunIcon faded /> : <MoonIcon faded />}
      </span>

      {/* Ball with active icon */}
      <span
        style={{
          position: 'absolute',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#F5F3F0',
          left: isDark ? 26 : 4,
          transition: 'left 200ms ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1A1714',
        }}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}
