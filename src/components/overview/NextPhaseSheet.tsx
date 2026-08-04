'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Sheet, { heading, bodyCopy, primaryBtn, ghostBtn, fieldStyle } from './Sheet'
import { closeAndStartNext } from '@/lib/actions/phases'
import type { PhaseWithMilestones } from '@/lib/types'

type Verdict = 'carry' | 'drop'

/**
 * Closing a phase is the one nag in the whole page: every unfinished milestone
 * has to be carried or dropped before the phase freezes. Nothing is deleted
 * silently.
 */
export default function NextPhaseSheet({
  phase, areaId, onClose,
}: { phase: PhaseWithMilestones; areaId: string; onClose: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const open = phase.phase_milestones.filter(m => !m.done)

  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(
    Object.fromEntries(open.map(m => [m.id, 'carry' as Verdict]))
  )
  const [step, setStep] = useState<'decide' | 'name'>(open.length ? 'decide' : 'name')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const carried = open.filter(m => verdicts[m.id] === 'carry').map(m => m.label)
  const dropped = open.filter(m => verdicts[m.id] === 'drop').map(m => m.id)

  function go() {
    const t = title.trim()
    if (!t) return
    setError(null)
    start(async () => {
      const r = await closeAndStartNext(phase.id, areaId, t, carried, dropped)
      if (r?.error) { setError(r.error); return }
      router.refresh()
      onClose()
    })
  }

  if (step === 'decide') {
    return (
      <Sheet onClose={onClose}>
        <h3 style={heading}>Close this phase?</h3>
        <p style={bodyCopy}>
          {open.length} milestone{open.length > 1 ? 's' : ''} in &ldquo;{phase.title}&rdquo;{' '}
          {open.length > 1 ? 'are' : 'is'} still open. Decide once — closed phases are frozen.
        </p>

        {open.map(m => (
          <div
            key={m.id}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border-hairline)',
            }}
          >
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: 'var(--fg)' }}>
              {m.label}
            </span>
            <div style={{ display: 'flex', border: '1px solid var(--border-emphasis)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              {(['carry', 'drop'] as Verdict[]).map(v => (
                <button
                  key={v}
                  onClick={() => setVerdicts(prev => ({ ...prev, [m.id]: v }))}
                  style={{
                    background: verdicts[m.id] === v ? '#614E3A' : 'transparent',
                    color: verdicts[m.id] === v ? '#F5F3F0' : 'var(--fg-muted)',
                    border: 'none', cursor: 'pointer', padding: '6px 11px',
                    fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={() => setStep('name')} style={primaryBtn}>Continue</button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet onClose={onClose}>
      <h3 style={heading}>Name the next phase</h3>
      <p style={bodyCopy}>
        {carried.length > 0 && `${carried.length} milestone${carried.length > 1 ? 's' : ''} will carry over. `}
        One line. You can rename it any time.
      </p>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') go() }}
        placeholder="Building the safety net"
        style={fieldStyle}
        aria-label="Next phase name"
      />
      {error && <p style={{ ...bodyCopy, color: '#BC3B3B' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={ghostBtn}>Cancel</button>
        <button onClick={go} disabled={pending || !title.trim()} style={{ ...primaryBtn, opacity: pending || !title.trim() ? 0.6 : 1 }}>
          {pending ? 'Starting…' : 'Start phase'}
        </button>
      </div>
    </Sheet>
  )
}
