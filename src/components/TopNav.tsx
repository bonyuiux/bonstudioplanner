'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const TABS = [
  { label: 'Board', href: '/board' },
  { label: 'Today', href: '/today' },
  { label: 'Log',   href: '/log'   },
]

function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      aria-label="Sign out"
      title="Sign out"
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'transparent',
        border: '1px solid var(--border-hairline)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--fg)',
        opacity: 0.6,
        flexShrink: 0,
        transition: 'opacity 150ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
    >
      {/* Door + arrow icon */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="7" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M9 5l3 2-3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="7" x2="6" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </button>
  )
}

function DateTimeDisplay() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase()

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase()

  return (
    <div style={{ lineHeight: 1.3 }}>
      <div
        style={{
          fontFamily: 'Italiana, serif',
          fontSize: 22,
          letterSpacing: '0.02em',
          color: 'var(--fg)',
        }}
      >
        BonPlanner
      </div>
      <div
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#9A9490',
          marginTop: 2,
        }}
      >
        {dateStr} · {timeStr}
      </div>
    </div>
  )
}

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav
      className="top-nav"
      style={{
        borderBottom: '1px solid var(--border-hairline)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg)',
      }}
    >
      {/* Left: logo + datetime */}
      <div className="top-nav-logo">
        <DateTimeDisplay />
      </div>

      {/* Center: tab group */}
      <div
        className="top-nav-tabs"
        style={{
          display: 'flex',
          background: 'rgba(97,78,58,0.12)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 6,
          padding: 3,
          gap: 2,
        }}
      >
        {TABS.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '6px 18px',
                borderRadius: 4,
                background: active ? '#614E3A' : 'transparent',
                color: active ? '#F5F3F0' : 'var(--fg)',
                opacity: active ? 1 : 0.5,
                transition: 'background 150ms ease, opacity 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Right: theme toggle + logout */}
      <div className="top-nav-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </nav>
  )
}
