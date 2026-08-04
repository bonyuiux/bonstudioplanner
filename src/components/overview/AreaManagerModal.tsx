'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Sheet, { label, heading, bodyCopy, primaryBtn, ghostBtn } from './Sheet'
import { AREA_COLORS } from '@/lib/areaColors'
import { createArea, updateArea, deleteArea, assignCategoryToArea } from '@/lib/actions/areas'
import type { Area, Category } from '@/lib/types'

/**
 * The only place areas are created, coloured, deleted, and matched to your
 * existing categories. Deliberately separate from CategoryManagerModal so the
 * board's category editing stays exactly as it was.
 */
export default function AreaManagerModal({
  areas, categories, onClose,
}: { areas: Area[]; categories: Category[]; onClose: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error?: string } | void>) =>
    start(async () => {
      setError(null)
      const r = await fn()
      if (r && 'error' in r && r.error) { setError(r.error); return }
      router.refresh()
    })

  return (
    <Sheet onClose={onClose} width={560}>
      <h3 style={heading}>Areas</h3>
      <p style={bodyCopy}>
        Areas sit above your categories. Assigning a category here changes nothing
        about its tasks — it only decides which area the category is shown under.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newName.trim()) {
              run(() => createArea({ name: newName, color: AREA_COLORS[areas.length % AREA_COLORS.length].value, sort_order: areas.length }))
              setNewName('')
            }
          }}
          placeholder="New area — Finance, Health…"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: '1px solid var(--border-emphasis)', color: 'var(--fg)',
            fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300,
            padding: '7px 0', outline: 'none',
          }}
        />
        <button
          style={ghostBtn}
          disabled={!newName.trim() || pending}
          onClick={() => {
            run(() => createArea({ name: newName, color: AREA_COLORS[areas.length % AREA_COLORS.length].value, sort_order: areas.length }))
            setNewName('')
          }}
        >Add</button>
      </div>

      {areas.map(a => {
        const mine = categories.filter(c => c.area_id === a.id)
        return (
          <div key={a.id} style={{ padding: '14px 0', borderTop: '1px solid var(--border-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 50, background: a.color, flexShrink: 0 }} />
              <input
                defaultValue={a.name}
                onBlur={e => {
                  const v = e.target.value.trim()
                  if (v && v !== a.name) run(() => updateArea(a.id, { name: v }))
                }}
                aria-label={`${a.name} name`}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'Italiana, serif', fontSize: 18, color: 'var(--fg)',
                  letterSpacing: '0.02em',
                }}
              />
              <button
                onClick={() => {
                  if (confirm(`Delete "${a.name}"? Its phases go with it. Categories and every task stay exactly where they are — they just become unassigned.`)) {
                    run(() => deleteArea(a.id))
                  }
                }}
                aria-label={`Delete ${a.name}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: 15, padding: '2px 4px' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#BC3B3B')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-muted)')}
              >×</button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {AREA_COLORS.map(c => (
                <button
                  key={c.value}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => run(() => updateArea(a.id, { color: c.value }))}
                  style={{
                    width: 18, height: 18, borderRadius: 50, background: c.value, cursor: 'pointer',
                    border: a.color === c.value ? '2px solid var(--fg)' : '1px solid var(--border-hairline)',
                  }}
                />
              ))}
            </div>

            <p style={{ ...label, margin: '0 0 6px' }}>
              Categories ({mine.length})
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map(c => {
                const on = c.area_id === a.id
                return (
                  <button
                    key={c.id}
                    onClick={() => run(() => assignCategoryToArea(c.id, on ? null : a.id))}
                    style={{
                      borderRadius: 50, padding: '5px 11px', cursor: 'pointer',
                      fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 300,
                      background: on ? a.color + '22' : 'transparent',
                      border: `1px solid ${on ? a.color : 'var(--border-hairline)'}`,
                      color: on ? 'var(--fg)' : 'var(--fg-muted)',
                    }}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {error && <p style={{ ...bodyCopy, color: '#BC3B3B', marginTop: 16 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
        <button onClick={onClose} style={primaryBtn}>Done</button>
      </div>
    </Sheet>
  )
}
