'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import EditPhaseSheet from './EditPhaseSheet'
import NextPhaseSheet from './NextPhaseSheet'
import { toggleAreaStar } from '@/lib/actions/areas'
import { toggleMilestone, startPhase } from '@/lib/actions/phases'
import { currentPhase, pastPhases, formatSignals, phaseRange, type AreaSignals } from '@/lib/overview'
import { accentText } from '@/lib/areaColors'
import { useTheme } from '@/components/ThemeProvider'
import Sheet, { heading, bodyCopy, primaryBtn, ghostBtn, fieldStyle } from './Sheet'
import type { AreaWithPhases } from '@/lib/types'

export default function AreaBand({
  area, signals, onOpenCarousel, onNudge, canUp, canDown, onOptimistic,
}: {
  area: AreaWithPhases
  signals: AreaSignals | undefined
  onOptimistic: (a: { type: 'star'; id: string } | { type: 'milestone'; id: string; done: boolean }) => void
  onOpenCarousel: (focusIndex: number | null) => void
  onNudge: (dir: -1 | 1) => void
  canUp: boolean
  canDown: boolean
}) {
  const router = useRouter()
  const { theme } = useTheme()
  // The raw swatch colour fails AA as text (2.4:1–3.7:1 on white). Same hue,
  // pushed just far enough to clear 4.5:1 against the card behind it.
  const accent = accentText(area.color, theme === 'dark')
  const [, start] = useTransition()
  const [sheet, setSheet] = useState<'edit' | 'next' | 'first' | null>(null)
  const [firstTitle, setFirstTitle] = useState('')

  const current = currentPhase(area.phases)
  const old = pastPhases(area.phases)
  const cleared = current?.phase_milestones.filter(m => m.done).length ?? 0

  function bandClick(e: React.MouseEvent) {
    if (sheet) return
    const t = e.target as HTMLElement
    if (t.closest('button, input, [role="checkbox"]')) return
    onOpenCarousel(null)
  }

  return (
    <section
      role="button"
      tabIndex={0}
      aria-label={`Open ${area.name} phase history`}
      onClick={bandClick}
      onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget && !sheet) onOpenCarousel(null) }}
      className="overview-band"
      style={{ borderTop: '1px solid var(--border-hairline)', cursor: 'pointer' }}
    >
      {/* header — name + signals left, controls right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Italiana, serif', fontSize: 27, letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.1, margin: 0, color: 'var(--fg)' }}>
            {area.name}
          </h2>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.05em', color: 'var(--fg-muted)', margin: '5px 0 0' }}>
            {formatSignals(signals)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button aria-label="Move up" disabled={!canUp} onClick={() => onNudge(-1)} style={{ ...nudgeBtn, opacity: canUp ? 1 : 0.3 }}>↑</button>
            <button aria-label="Move down" disabled={!canDown} onClick={() => onNudge(1)} style={{ ...nudgeBtn, opacity: canDown ? 1 : 0.3 }}>↓</button>
          </div>
          <button
            aria-label={`${area.starred_at ? 'Unstar' : 'Star'} ${area.name}`}
            aria-pressed={!!area.starred_at}
            onClick={() => start(async () => {
              onOptimistic({ type: 'star', id: area.id })
              await toggleAreaStar(area.id, !area.starred_at)
              router.refresh()
            })}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px',
              fontSize: 21, lineHeight: 1,
              color: area.starred_at ? '#F1C76D' : 'var(--border-emphasis)',
            }}
          >
            {area.starred_at ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* rail | current card | actions — the 1fr/card/1fr grid keeps the card
          dead-centre no matter how many closed phases exist */}
      <div className="overview-row">
        <div>
          {old.length > 0 ? (
            <div className="overview-rail">
              {old.map((p, k) => (
                <button
                  key={p.id}
                  onClick={() => onOpenCarousel(k)}
                  title={`${p.title} · ${phaseRange(p)}`}
                  style={{
                    flex: '0 0 auto', width: 112, minHeight: 70, padding: '10px 11px',
                    border: '1px solid var(--border-hairline)', borderRadius: 6,
                    background: 'var(--column-bg)', color: 'var(--fg-muted)',
                    fontFamily: 'Jost, sans-serif', fontSize: 11, lineHeight: 1.35,
                    display: 'flex', alignItems: 'flex-end', textAlign: 'left', cursor: 'pointer',
                    opacity: 0.55 + 0.45 * ((k + 1) / old.length),
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="overview-rail-empty">No closed phases yet</p>
          )}
        </div>

        {current ? (
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-hairline)',
              borderLeft: `3px solid ${accent}`,
              borderRadius: '0 6px 6px 0',
              padding: '18px 20px 18px 17px',
              cursor: 'default',
            }}
          >
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, margin: 0 }}>
              Current phase
            </p>
            <h3 style={{ fontFamily: 'Italiana, serif', fontSize: 22, letterSpacing: '0.02em', lineHeight: 1.2, margin: '7px 0 15px', color: 'var(--fg)' }}>
              {current.title}
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {current.phase_milestones.map(m => (
                <li
                  key={m.id}
                  role="checkbox"
                  aria-checked={m.done}
                  tabIndex={0}
                  onClick={() => start(async () => {
                    onOptimistic({ type: 'milestone', id: m.id, done: !m.done })
                    await toggleMilestone(m.id, !m.done)
                    router.refresh()
                  })}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      start(async () => {
                        onOptimistic({ type: 'milestone', id: m.id, done: !m.done })
                        await toggleMilestone(m.id, !m.done)
                        router.refresh()
                      })
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'Jost, sans-serif' }}
                >
                  <span style={{
                    width: 14, height: 14, flex: '0 0 14px', borderRadius: 3,
                    border: `1px solid ${m.done ? '#614E3A' : '#C8C5BE'}`,
                    background: m.done ? '#614E3A' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#F5F3F0',
                  }}>{m.done ? '✓' : ''}</span>
                  <span style={{ color: m.done ? 'var(--fg-muted)' : 'var(--fg)', textDecoration: m.done ? 'line-through' : 'none' }}>
                    {m.label}
                  </span>
                </li>
              ))}
            </ul>

            {current.phase_milestones.length === 0 && (
              <button
                onClick={() => setSheet('edit')}
                style={{
                  width: '100%', background: 'none', borderRadius: 4, cursor: 'pointer',
                  border: '1px dashed var(--border-emphasis)', padding: '12px 8px',
                  fontFamily: 'Jost, sans-serif', fontSize: 11, fontStyle: 'italic',
                  color: 'var(--fg-muted)', textAlign: 'center',
                }}
              >
                Add the first milestone
              </button>
            )}

            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-hairline)' }}>
              {cleared} of {current.phase_milestones.length} cleared · since{' '}
              {new Date(current.started_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        ) : (
          <button
            onClick={() => setSheet('first')}
            style={{
              background: 'none', border: `1px dashed ${accent}`, borderRadius: 6,
              padding: '34px 20px', cursor: 'pointer', color: 'var(--fg-muted)',
              fontFamily: 'Jost, sans-serif', fontSize: 11, fontStyle: 'italic', width: '100%',
            }}
          >
            No phase yet — name the one you&rsquo;re in
          </button>
        )}

        <div className="overview-actions">
          <button onClick={() => current && setSheet('edit')} disabled={!current} style={{ ...ghostBtn, width: '100%', opacity: current ? 1 : 0.4 }}>
            Edit phase
          </button>
          <button onClick={() => current && setSheet('next')} disabled={!current} style={{ ...primaryBtn, width: '100%', opacity: current ? 1 : 0.4 }}>
            Next phase
          </button>
        </div>
      </div>

      {sheet === 'edit' && current && <EditPhaseSheet phase={current} onClose={() => setSheet(null)} />}
      {sheet === 'next' && current && <NextPhaseSheet phase={current} areaId={area.id} onClose={() => setSheet(null)} />}
      {sheet === 'first' && (
        <Sheet onClose={() => setSheet(null)}>
          <h3 style={heading}>Name your current phase</h3>
          <p style={bodyCopy}>What are you actually in the middle of in {area.name}? One line.</p>
          <input
            autoFocus value={firstTitle} onChange={e => setFirstTitle(e.target.value)}
            placeholder="Building the safety net" style={fieldStyle} aria-label="Phase name"
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setSheet(null)} style={ghostBtn}>Cancel</button>
            <button
              onClick={() => start(async () => {
                if (!firstTitle.trim()) return
                await startPhase(area.id, firstTitle)
                setFirstTitle('')
                router.refresh()
                // hand straight over to the editor — an empty phase card is a
                // dead end, and this is the moment you know what goes in it
                setSheet('edit')
              })}
              style={primaryBtn}
            >Start phase</button>
          </div>
        </Sheet>
      )}
    </section>
  )
}

const nudgeBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 4, background: 'transparent',
  border: '1px solid var(--border-emphasis)', color: 'var(--fg-muted)',
  fontSize: 11, cursor: 'pointer',
}
