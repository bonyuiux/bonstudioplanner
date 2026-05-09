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

export default function FlexibleForm({ categories, defaultCategoryId, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const [title, setTitle]           = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? '')
  const [description, setDescription] = useState('')
  const [niceToHaveBy, setNiceToHaveBy] = useState('')
  const [duration, setDuration]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (!categoryId) { setError('Select a category'); return }

    setLoading(true)
    setError(null)

    const result = await createTask({
      title,
      category_id:  categoryId,
      description,
      task_type:    'flexible',
      due_at:       niceToHaveBy ? new Date(niceToHaveBy + 'T23:59').toISOString() : undefined,
      duration_minutes: duration ? parseInt(duration) : undefined,
    })

    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.refresh()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldWrapper label="Title">
        <TextInput
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Update client style guide"
          required
          autoFocus
        />
      </FieldWrapper>

      <FieldWrapper label="Category">
        <Select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
          {categories.length === 0 && <option value="">No categories — create one first</option>}
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </FieldWrapper>

      <FieldWrapper label="Notes (optional)">
        <TextArea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Context, references, links…"
          rows={3}
        />
      </FieldWrapper>

      <FieldWrapper label="Nice to have done by (optional)">
        <TextInput
          type="date"
          value={niceToHaveBy}
          onChange={e => setNiceToHaveBy(e.target.value)}
        />
      </FieldWrapper>

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
