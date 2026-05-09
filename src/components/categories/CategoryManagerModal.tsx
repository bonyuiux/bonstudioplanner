'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '@/lib/actions/categories'
import { TextInput, PrimaryButton } from '@/components/task/FormField'
import type { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  onClose: () => void
}

interface EditState {
  name: string
  subtitle: string
}

export default function CategoryManagerModal({ categories, onClose }: Props) {
  const router = useRouter()

  // Local ordered copy for optimistic reordering
  const [items, setItems] = useState<Category[]>([...categories])
  const [editing, setEditing] = useState<Record<string, EditState>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  // New category inline form
  const [newName, setNewName]         = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [addingNew, setAddingNew]     = useState(false)
  const [addLoading, setAddLoading]   = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Reorder ──────────────────────────────────────────────────────────────
  async function move(index: number, dir: -1 | 1) {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    await reorderCategories(next.map(c => c.id))
    router.refresh()
  }

  // ── Rename ───────────────────────────────────────────────────────────────
  function startEdit(cat: Category) {
    setEditing(prev => ({
      ...prev,
      [cat.id]: { name: cat.name, subtitle: cat.subtitle ?? '' },
    }))
  }

  function cancelEdit(id: string) {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  async function saveEdit(id: string) {
    const state = editing[id]
    if (!state?.name.trim()) return
    setSaving(prev => ({ ...prev, [id]: true }))
    await updateCategory(id, {
      name:     state.name.trim(),
      subtitle: state.subtitle.trim() || null,
    })
    setSaving(prev => ({ ...prev, [id]: false }))
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n })
    setItems(prev => prev.map(c =>
      c.id === id
        ? { ...c, name: state.name.trim(), subtitle: state.subtitle.trim() || null }
        : c
    ))
    router.refresh()
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Tasks in this category will lose their category assignment.`)) return
    setItems(prev => prev.filter(c => c.id !== id))
    await deleteCategory(id)
    router.refresh()
  }

  // ── Add new ──────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAddLoading(true)
    await createCategory({
      name:       newName.trim(),
      subtitle:   newSubtitle.trim() || undefined,
      sort_order: items.length,
    })
    setNewName('')
    setNewSubtitle('')
    setAddingNew(false)
    setAddLoading(false)
    router.refresh()
    // Refresh local list from router
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg)',
          border: '1px solid var(--border-emphasis)',
          borderRadius: 12,
          padding: '28px 28px 20px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: '0 0 6px' }}>
              General view
            </p>
            <h2 style={{ fontFamily: 'Bodoni Moda, serif', fontSize: 22, fontStyle: 'italic', fontWeight: 400, color: 'var(--fg)', margin: 0 }}>
              Categories
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9490', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Category list — scrollable */}
        <div style={{ overflowY: 'auto', flexGrow: 1, marginBottom: 16 }}>
          {items.length === 0 && !addingNew && (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9A9490', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
              No categories yet.
            </p>
          )}

          {items.map((cat, i) => {
            const isEditing = !!editing[cat.id]
            const isSaving  = saving[cat.id]
            const edit      = editing[cat.id]

            return (
              <div
                key={cat.id}
                style={{
                  borderBottom: '1px solid var(--border-hairline)',
                  padding: '12px 0',
                }}
              >
                {isEditing ? (
                  /* Edit mode */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <TextInput
                      value={edit.name}
                      onChange={e => setEditing(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], name: e.target.value } }))}
                      placeholder="Category name"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') cancelEdit(cat.id) }}
                    />
                    <TextInput
                      value={edit.subtitle}
                      onChange={e => setEditing(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], subtitle: e.target.value } }))}
                      placeholder="Subtitle (optional)"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => saveEdit(cat.id)}
                        disabled={isSaving}
                        style={{ background: '#614E3A', color: '#F5F3F0', border: 'none', borderRadius: 4, padding: '7px 14px', fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        {isSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => cancelEdit(cat.id)}
                        style={{ background: 'none', border: '1px solid var(--border-hairline)', borderRadius: 4, padding: '7px 14px', fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#9A9490', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Reorder arrows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: '#9A9490', opacity: i === 0 ? 0.2 : 0.5, fontSize: 10, lineHeight: 1, padding: '1px 3px' }}
                        onMouseEnter={e => i > 0 && (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = i === 0 ? '0.2' : '0.5')}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === items.length - 1}
                        aria-label="Move down"
                        style={{ background: 'none', border: 'none', cursor: i === items.length - 1 ? 'default' : 'pointer', color: '#9A9490', opacity: i === items.length - 1 ? 0.2 : 0.5, fontSize: 10, lineHeight: 1, padding: '1px 3px' }}
                        onMouseEnter={e => i < items.length - 1 && (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = i === items.length - 1 ? '0.2' : '0.5')}
                      >
                        ▼
                      </button>
                    </div>

                    {/* Name + subtitle */}
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Italiana, serif', fontSize: 16, letterSpacing: '0.02em', color: 'var(--fg)', margin: '0 0 1px', lineHeight: 1.2 }}>
                        {cat.name}
                      </p>
                      {cat.subtitle && (
                        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9A9490', margin: 0 }}>
                          {cat.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => startEdit(cat)}
                        style={{ background: 'none', border: '1px solid var(--border-hairline)', borderRadius: 4, padding: '5px 10px', fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A9490', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-hairline)')}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(188,59,59,0.5)', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#BC3B3B')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(188,59,59,0.5)')}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add new — inline form */}
          {addingNew ? (
            <form onSubmit={handleAdd} noValidate style={{ paddingTop: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TextInput
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Category name"
                  autoFocus
                />
                <TextInput
                  value={newSubtitle}
                  onChange={e => setNewSubtitle(e.target.value)}
                  placeholder="Subtitle (optional)"
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <PrimaryButton type="submit" loading={addLoading}>Add</PrimaryButton>
                  <button
                    type="button"
                    onClick={() => { setAddingNew(false); setNewName(''); setNewSubtitle('') }}
                    style={{ background: 'none', border: '1px solid var(--border-hairline)', borderRadius: 4, padding: '7px 14px', fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#9A9490', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              style={{ display: 'block', width: '100%', background: 'none', border: '1px dashed var(--border-hairline)', borderRadius: 4, padding: '10px 0', marginTop: 12, fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9A9490', cursor: 'pointer', letterSpacing: '0.04em' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-hairline)')}
            >
              + Add category
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, paddingTop: 8, borderTop: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ background: '#614E3A', color: '#F5F3F0', border: 'none', borderRadius: 4, padding: '10px 20px', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
