'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '@/lib/actions/tasks'
import { FieldWrapper, TextInput, TextArea, Select, PrimaryButton, GhostButton } from './FormField'
import type { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  defaultCategoryId?: string
  onClose: () => void
}

// Convert a local datetime string (from datetime-local input) to UTC ISO string
function localToISO(local: string): string | undefined {
  if (!local) return undefined
  return new Date(local).toISOString()
}

export default function DeadlineForm({ categories, defaultCategoryId, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle]               = useState('')
  const [categoryId, setCategoryId]     = useState(defaultCategoryId ?? categories[0]?.id ?? '')
  const [description, setDescription]   = useState('')
  const [dateType, setDateType]         = useState<'scheduled' | 'due'>('due')
  const [scheduledAt, setScheduledAt]   = useState('')
  const [dueAt, setDueAt]               = useState('')
  const [duration, setDuration]         = useState('')

  // Inline checklist builder
  const [checklistInput, setChecklistInput] = useState('')
  const [checklist, setChecklist]           = useState<string[]>([])

  function addChecklistItem() {
    const label = checklistInput.trim()
    if (!label) return
    setChecklist(prev => [...prev, label])
    setChecklistInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (!categoryId) { setError('Select a category'); return }
    if (dateType === 'scheduled' && !scheduledAt) { setError('Pick a scheduled time'); return }
    if (dateType === 'due' && !dueAt) { setError('Pick a due date'); return }

    setLoading(true)
    setError(null)

    const result = await createTask({
      title,
      category_id: categoryId,
      description,
      task_type: 'deadline',
      scheduled_at: dateType === 'scheduled' ? localToISO(scheduledAt) : undefined,
      due_at:       dateType === 'due'       ? localToISO(dueAt + 'T23:59') : undefined,
      duration_minutes: duration ? parseInt(duration) : undefined,
      checklist_items: checklist,
    })

    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.refresh()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Title */}
      <FieldWrapper label="Title">
        <TextInput
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Client shoot — Mary & John"
          required
          autoFocus
        />
      </FieldWrapper>

      {/* Category */}
      <FieldWrapper label="Category">
        <Select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
          {categories.length === 0 && <option value="">No categories — create one first</option>}
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </FieldWrapper>

      {/* Date type radio */}
      <FieldWrapper label="When">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          {(['scheduled', 'due'] as const).map(type => (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="dateType"
                value={type}
                checked={dateType === type}
                onChange={() => setDateType(type)}
                style={{ marginTop: 2, accentColor: '#614E3A' }}
              />
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: 'var(--fg)' }}>
                {type === 'scheduled'
                  ? 'Scheduled at a time — shoot, meeting'
                  : 'Due by a date — delivery, draft'}
              </span>
            </label>
          ))}
        </div>

        {dateType === 'scheduled' ? (
          <TextInput
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            required
          />
        ) : (
          <TextInput
            type="date"
            value={dueAt}
            onChange={e => setDueAt(e.target.value)}
            required
          />
        )}
      </FieldWrapper>

      {/* Duration */}
      <FieldWrapper label="Estimated duration">
        <Select value={duration} onChange={e => setDuration(e.target.value)}>
          <option value="">No estimate</option>
          <option value="30">30 min</option>
          <option value="60">1 hr</option>
          <option value="120">2 hr</option>
          <option value="240">Half day</option>
          <option value="480">Full day</option>
        </Select>
      </FieldWrapper>

      {/* Description */}
      <FieldWrapper label="Notes (optional)">
        <TextArea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Additional context…"
          rows={3}
        />
      </FieldWrapper>

      {/* Checklist */}
      <FieldWrapper label="Checklist">
        {checklist.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {checklist.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 0',
                  borderBottom: '1px solid var(--border-hairline)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 1, border: '1px solid var(--border-emphasis)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: 'var(--fg)', flexGrow: 1 }}>{item}</span>
                <button
                  type="button"
                  onClick={() => setChecklist(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', color: '#9A9490', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <TextInput
            value={checklistInput}
            onChange={e => setChecklistInput(e.target.value)}
            placeholder="Add item…"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
            style={{ flexGrow: 1 }}
          />
          <button
            type="button"
            onClick={addChecklistItem}
            style={{
              background: 'none',
              border: '1px solid var(--border-emphasis)',
              borderRadius: 4,
              padding: '0 12px',
              color: '#9A9490',
              cursor: 'pointer',
              fontFamily: 'Jost, sans-serif',
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            Add
          </button>
        </div>
      </FieldWrapper>

      {error && (
        <p style={{ color: '#BC3B3B', fontFamily: 'Jost, sans-serif', fontSize: 11, marginBottom: 14 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton type="submit" loading={loading}>Create task</PrimaryButton>
      </div>
    </form>
  )
}
