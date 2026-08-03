'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { overlayPalette } from '@/lib/areaColors'
import { useTheme } from '@/components/ThemeProvider'

/**
 * Shared modal shell.
 *
 * Rendered through a portal into document.body — NOT inline. When a sheet was
 * a DOM child of the area band, every click inside it bubbled up to the band's
 * own onClick and fired the phase carousel behind it. The portal makes the
 * sheet a sibling of the app instead of a descendant of the band, so nothing
 * it emits can reach the band. Clicks are also stopped at the sheet edge as a
 * second line of defence.
 */
export default function Sheet({
  children,
  onClose,
  width = 460,
}: {
  children: React.ReactNode
  onClose: () => void
  width?: number
}) {
  const { theme } = useTheme()
  const pal = overlayPalette(theme === 'dark')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    // stop the page scrolling behind the sheet
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: pal.veil,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '36px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: pal.sheet,
          border: `1px solid ${pal.cardBorder}`,
          borderRadius: 12,
          padding: '26px 28px',
          width: `min(${width}px, 92vw)`,
          maxHeight: '84vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 16,
            width: 30, height: 30, borderRadius: 50,
            background: 'transparent', border: `1px solid ${pal.cardBorder}`,
            color: pal.text, fontSize: 15, lineHeight: 1, cursor: 'pointer',
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export const label: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500,
  letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--fg-muted)',
}

export const heading: React.CSSProperties = {
  fontFamily: "'Bodoni Moda', serif", fontSize: 22, fontWeight: 500,
  fontStyle: 'italic', margin: '0 34px 6px 0', color: 'var(--fg)',
}

export const bodyCopy: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif', fontSize: 12, color: 'var(--fg-muted)',
  margin: '0 0 18px', lineHeight: 1.6,
}

export const primaryBtn: React.CSSProperties = {
  background: '#614E3A', color: '#F5F3F0', border: 'none', borderRadius: 4,
  padding: '11px 16px', fontFamily: 'Jost, sans-serif', fontSize: 11,
  fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
}

export const ghostBtn: React.CSSProperties = {
  ...primaryBtn, background: 'transparent', color: 'var(--fg)',
  border: '1px solid var(--border-emphasis)',
}

export const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--border-emphasis)', color: 'var(--fg)',
  fontFamily: "'Bodoni Moda', serif", fontSize: 19, padding: '8px 0',
  marginBottom: 20, outline: 'none',
}
