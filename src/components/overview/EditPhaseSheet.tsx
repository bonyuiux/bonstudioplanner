'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Sheet, { label, heading, bodyCopy, primaryBtn, ghostBtn, fieldStyle } from './Sheet'
import { renamePhase, saveMilestones, deletePhase } from '@/lib/actions/phases'
import type { PhaseWithMilestones } from '@/lib/types'

interface Draft { id?: string; label: string; done: boolean }

export default function EditPhaseSheet({
  phase, onClose,
}: { phase: PhaseWithMilestones; onClose: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [title, setTitle] = useState(phase.title)
  const [items, setItems] = useState<Draft[]>(
    phase.phase_milestones.map(m => ({ id: m.id, label: m.label, done: m.done }))
  )
  const [adding, setAdding] = useState('')
  const [error, setError] = useState<string | null>(null)

  function patch(i: number, next: Partial<Draft>) {
    setItems(prev => prev.map((it, k) => (k === i ? { ...it, ...next } : it)))
  }

  function add() {
    const v = adding.trim()
    if (!v) return
    setItems(prev => [...prev, { label: v, done: false }])
    setAdding('')
  }

  function save() {
    setError(null)
    start(async () => {
      const cleaned = items.filter(i => i.label.trim())
      if (title.trim() && title.trim() !== phase.title) {
        const r = await renamePhase(phase.id, title)
        if (r?.error) { setError(r.error); return }
      }
      const r = await saveMilestones(phase.id, cleaned)
      if (r?.error) { setError(r.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <Sheet onClose={onClose}>
      <h3 style={heading}>Edit phase</h3>
      <p style={bodyCopy}>
        Rename the phase, reword or remove milestones, tick what&rsquo;s cleared.
        Nothing saves until you hit save.
      </p>

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={fieldStyle}
        aria-label="Phase name"
      />

      <p style={{ ...label, margin: '0 0 6px' }}>Milestones</p>

      {items.length === 0 && (
        <p style={{ ...bodyCopy, fontStyle: 'italic', margin: '8px 0' }}>No milestones yet</p>
      )}

      {items.map((it, i) => (
        <div
          key={it.id ?? `new-${i}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          <button
            role="checkbox"
            aria-checked={it.done}
            aria-label={`Mark ${it.label} ${it.done ? 'not done' : 'done'}`}
            onClick={() => patch(i, { done: !it.done })}
            style={{
              width: 14, height: 14, flex: '0 0 14px', borderRadius: 3, cursor: 'pointer',
              border: `1px solid ${it.done ? '#614E3A' : '#C8C5BE'}`,
              background: it.done ? '#614E3A' : 'transparent',
              color: '#F5F3F0', fontSize: 9, lineHeight: 1, padding: 0,
            }}
          >
            {it.done ? '✓' : ''}
          </button>
          <input
            type="text"
            value={it.label}
            onChange={e => patch(i, { label: e.target.value })}
            aria-label={`Milestone ${i + 1}`}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300,
              padding: '4px 0',
              color: it.done ? 'var(--fg-muted)' : 'var(--fg)',
              textDecoration: it.done ? 'line-through' : 'none',
            }}
          />
          <button
            onClick={() => setItems(prev => prev.filter((_, k) => k !== i))}
            aria-label={`Remove ${it.label}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 14, padding: '2px 4px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#BC3B3B')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-muted)')}
          >
            ×
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
        <input
          value={adding}
          onChange={e => setAdding(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add a milestone"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: '1px solid var(--border-emphasis)', color: 'var(--fg)',
            fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300,
            padding: '7px 0', outline: 'none',
          }}
        />
        <button onClick={add} style={ghostBtn}>Add</button>
      </div>

      {error && <p style={{ ...bodyCopy, color: '#BC3B3B', marginTop: 14 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 22 }}>
        <button
          onClick={() => {
            if (confirm(`Delete "${phase.title}" and its milestones? This cannot be undone. To keep the history instead, use Next phase.`)) {
              start(async () => {
                const r = await deletePhase(phase.id)
                if (r?.error) { setError(r.error); return }
                router.refresh()
                onClose()
              })
            }
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)',
            fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.18em', textTransform: 'uppercase', padding: '11px 0',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#BC3B3B')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-muted)')}
        >
          Delete phase
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={onClose} style={ghostBtn}>Cancel</button>
        <button onClick={save} disabled={pending} style={{ ...primaryBtn, opacity: pending ? 0.6 : 1 }}>
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Sheet>
  )
}
