'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { phaseRange } from '@/lib/overview'
import { accentText, overlayPalette } from '@/lib/areaColors'
import { useTheme } from '@/components/ThemeProvider'
import type { AreaWithPhases, PhaseWithMilestones } from '@/lib/types'

export default function PhaseCarousel({
  area, ordered, focusIndex, onClose,
}: {
  area: AreaWithPhases
  ordered: PhaseWithMilestones[]
  focusIndex: number | null
  onClose: () => void
}) {
  const { theme } = useTheme()
  const onDark = theme === 'dark'
  const pal = overlayPalette(onDark)
  const accent = accentText(area.color, onDark)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = track.current
    if (!el) return
    const idx = focusIndex ?? ordered.findIndex(p => p.ended_at === null)
    const card = el.children[Math.max(idx, 0)] as HTMLElement | undefined
    if (card) el.scrollLeft = card.offsetLeft - el.offsetWidth / 2 + card.offsetWidth / 2
  }, [focusIndex, ordered])

  if (typeof document === 'undefined') return null

  // Portalled to document.body for the same reason as Sheet: rendered inline it
  // would sit inside a band and its clicks would re-trigger that band.
  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: pal.veil,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 0',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(940px, 92vw)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, padding: '0 4px' }}>
          <div>
            <h2 style={{
              fontFamily: 'Italiana, serif', fontSize: 34, letterSpacing: '0.04em',
              textTransform: 'uppercase', lineHeight: 1, margin: 0, color: pal.chrome,
            }}>
              {area.name}
            </h2>
            <p style={{
              fontFamily: 'Jost, sans-serif', fontSize: 11, letterSpacing: '0.14em',
              textTransform: 'uppercase', margin: '8px 0 0', color: pal.chrome,
            }}>
              Every phase, in order
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['←', -310, 'Older'], ['→', 310, 'Newer']] as const).map(([glyph, dx, aria]) => (
              <button
                key={aria} aria-label={aria}
                onClick={() => track.current?.scrollBy({ left: dx, behavior: 'smooth' })}
                style={arrowBtn}
              >{glyph}</button>
            ))}
            <button aria-label="Close" onClick={onClose} style={arrowBtn}>×</button>
          </div>
        </div>

        <div
          ref={track}
          style={{
            display: 'flex', gap: 14, overflowX: 'auto', padding: '4px 4px 14px',
            scrollSnapType: 'x mandatory',
          }}
        >
          {ordered.map(p => {
            const isCurrent = p.ended_at === null
            return (
              <article
                key={p.id}
                style={{
                  flex: '0 0 296px', scrollSnapAlign: 'center', borderRadius: 12, padding: 20,
                  minHeight: 270,
                  opacity: 1,
                  background: isCurrent ? pal.cardCurrent : pal.cardClosed,
                  boxShadow: '0 12px 34px rgba(0,0,0,0.22)',
                  border: `1px solid ${pal.cardBorder}`,
                  borderLeft: `3px solid ${isCurrent ? accent : pal.cardBorder}`,
                }}
              >
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, color: isCurrent ? accent : pal.muted }}>
                  {isCurrent ? 'Current phase' : 'Closed'}
                </p>
                <h4 style={{ fontFamily: 'Italiana, serif', fontSize: 20, letterSpacing: '0.02em', margin: '8px 0 4px', lineHeight: 1.2, color: pal.text }}>
                  {p.title}
                </h4>
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.06em', color: pal.muted, margin: '0 0 14px' }}>
                  {phaseRange(p)}
                </p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.phase_milestones.map(m => (
                    <li
                      key={m.id}
                      style={{
                        fontFamily: 'Jost, sans-serif', fontSize: 12,
                        color: m.done ? pal.text : pal.muted,
                        textDecoration: !m.done && !isCurrent ? 'line-through' : 'none',
                      }}
                    >
                      {m.done ? '✓' : isCurrent ? '○' : '—'} {m.label}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Overlay chrome always sits on the dark veil, so it is cream in both themes
// rather than following --fg.
const arrowBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 50, background: 'rgba(245,243,240,0.08)',
  border: '1px solid rgba(245,243,240,0.45)', color: '#F5F3F0',
  fontSize: 15, lineHeight: 1, cursor: 'pointer',
}
