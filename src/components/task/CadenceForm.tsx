'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCadenceRule } from '@/lib/actions/cadence'
import { FieldWrapper, TextInput, Select, PrimaryButton, GhostButton } from './FormField'
import type { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  defaultCategoryId?: string
  onClose: () => void
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type FreqType = 'per_week' | 'every_n_days' | 'weekly_on_day'

export default function CadenceForm({ categories, defaultCategoryId, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [templateTitle, setTemplateTitle] = useState('')
  const [categoryId, setCategoryId]       = useState(defaultCategoryId ?? categories[0]?.id ?? '')
  const [freqType, setFreqType]           = useState<FreqType>('per_week')
  const [timesPerWeek, setTimesPerWeek]   = useState(3)
  const [everyNDays, setEveryNDays]       = useState(7)
  const [weeklyOnDay, setWeeklyOnDay]     = useState(1)  // Monday default

  const today = new Date().toISOString().split('T')[0]
  const [startFrom, setStartFrom] = useState(today)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!templateTitle.trim()) return
    if (!categoryId) { setError('Select a category'); return }

    let frequencyValue: number
    switch (freqType) {
      case 'per_week':      frequencyValue = timesPerWeek; break
      case 'every_n_days':  frequencyValue = everyNDays;   break
      case 'weekly_on_day': frequencyValue = weeklyOnDay;  break
    }

    setLoading(true)
    setError(null)

    const result = await createCadenceRule({
      category_id:     categoryId,
      template_title:  templateTitle,
      frequency_type:  freqType,
      frequency_value: frequencyValue,
      start_from:      startFrom,
    })

    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.refresh()
    onClose()
  }

  const freqLabel = {
    per_week:      `${timesPerWeek}× per week`,
    every_n_days:  `every ${everyNDays} days`,
    weekly_on_day: `every ${DAYS[weeklyOnDay]}`,
  }[freqType]

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldWrapper label="Task title (template)">
        <TextInput
          value={templateTitle}
          onChange={e => setTemplateTitle(e.target.value)}
          placeholder="e.g. Instagram post"
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

      {/* Frequency type */}
      <FieldWrapper label="Frequency">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* per_week */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="radio"
              name="freqType"
              checked={freqType === 'per_week'}
              onChange={() => setFreqType('per_week')}
              style={{ accentColor: '#614E3A' }}
            />
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: 'var(--fg)', flexShrink: 0 }}>
              Times per week
            </span>
            {freqType === 'per_week' && (
              <input
                type="number"
                min={1}
                max={7}
                value={timesPerWeek}
                onChange={e => setTimesPerWeek(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
                style={{
                  width: 52,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-emphasis)',
                  borderRadius: 4,
                  padding: '5px 8px',
                  color: 'var(--fg)',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 12,
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
            )}
          </label>

          {/* every_n_days */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="radio"
              name="freqType"
              checked={freqType === 'every_n_days'}
              onChange={() => setFreqType('every_n_days')}
              style={{ accentColor: '#614E3A' }}
            />
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: 'var(--fg)', flexShrink: 0 }}>
              Every N days
            </span>
            {freqType === 'every_n_days' && (
              <input
                type="number"
                min={1}
                max={365}
                value={everyNDays}
                onChange={e => setEveryNDays(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: 60,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-emphasis)',
                  borderRadius: 4,
                  padding: '5px 8px',
                  color: 'var(--fg)',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 12,
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
            )}
          </label>

          {/* weekly_on_day */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="radio"
              name="freqType"
              checked={freqType === 'weekly_on_day'}
              onChange={() => setFreqType('weekly_on_day')}
              style={{ accentColor: '#614E3A' }}
            />
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: 'var(--fg)', flexShrink: 0 }}>
              Weekly on
            </span>
            {freqType === 'weekly_on_day' && (
              <Select
                value={weeklyOnDay}
                onChange={e => setWeeklyOnDay(parseInt(e.target.value))}
                style={{ width: 130, padding: '5px 28px 5px 8px', fontSize: 12 }}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </Select>
            )}
          </label>
        </div>

        {/* Preview */}
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#9A9490', marginTop: 10, fontStyle: 'italic' }}>
          First task spawns {freqLabel} from start date.
        </p>
      </FieldWrapper>

      <FieldWrapper label="Start spawning from">
        <TextInput
          type="date"
          value={startFrom}
          onChange={e => setStartFrom(e.target.value)}
        />
      </FieldWrapper>

      {error && (
        <p style={{ color: '#BC3B3B', fontFamily: 'Jost, sans-serif', fontSize: 11, marginBottom: 14 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton type="submit" loading={loading}>Create rule</PrimaryButton>
      </div>
    </form>
  )
}
