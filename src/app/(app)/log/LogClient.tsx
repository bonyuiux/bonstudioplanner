'use client'

import { useState, useMemo } from 'react'
import TaskDetailPanel from '@/components/task/TaskDetailPanel'
import { Select } from '@/components/task/FormField'
import type { Category, TaskWithRelations } from '@/lib/types'

interface Props {
  tasks: TaskWithRelations[]
  categories: Category[]
}

type RangeKey = '7' | '30' | '90' | 'year' | 'all'

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: '7',    label: 'Last 7 days' },
  { key: '30',   label: 'Last 30 days' },
  { key: '90',   label: 'Last 90 days' },
  { key: 'year', label: 'This year' },
  { key: 'all',  label: 'All time' },
]

function rangeStart(key: RangeKey): Date | null {
  const now = new Date()
  if (key === 'all') return null
  if (key === 'year') return new Date(now.getFullYear(), 0, 1)
  return new Date(now.getTime() - parseInt(key) * 24 * 60 * 60 * 1000)
}

function weekLabel(completedAt: string, now: Date): string {
  const date = new Date(completedAt)
  const MS_WEEK = 7 * 24 * 60 * 60 * 1000

  // Monday of current week
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  startOfThisWeek.setHours(0, 0, 0, 0)

  const startOfLastWeek = new Date(startOfThisWeek.getTime() - MS_WEEK)
  const startOf2WeeksAgo = new Date(startOfThisWeek.getTime() - 2 * MS_WEEK)
  const startOf3WeeksAgo = new Date(startOfThisWeek.getTime() - 3 * MS_WEEK)

  if (date >= startOfThisWeek)  return 'This week'
  if (date >= startOfLastWeek)  return 'Last week'
  if (date >= startOf2WeeksAgo) return 'Two weeks ago'
  if (date >= startOf3WeeksAgo) return 'Three weeks ago'

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function relativeTime(completedAt: string, now: Date): string {
  const diff = now.getTime() - new Date(completedAt).getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'Jost, sans-serif',
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: '#9A9490',
        marginBottom: 4,
        display: 'block',
      }}
    >
      {children}
    </span>
  )
}

export default function LogClient({ tasks, categories }: Props) {
  const [selectedTask, setSelectedTask]     = useState<TaskWithRelations | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [rangeFilter, setRangeFilter]       = useState<RangeKey>('30')

  const now = useMemo(() => new Date(), [])

  const filtered = useMemo(() => {
    const start = rangeStart(rangeFilter)
    return tasks.filter(t => {
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false
      if (start && t.completed_at && new Date(t.completed_at) < start) return false
      return true
    })
  }, [tasks, categoryFilter, rangeFilter])

  // Group by week label, preserving order
  const grouped = useMemo(() => {
    const order: string[] = []
    const map: Record<string, TaskWithRelations[]> = {}
    for (const task of filtered) {
      const label = task.completed_at ? weekLabel(task.completed_at, now) : 'Unknown'
      if (!map[label]) { map[label] = []; order.push(label) }
      map[label].push(task)
    }
    return order.map(label => ({ label, tasks: map[label] }))
  }, [filtered, now])

  return (
    <div className="log-page">
      {/* Header */}
      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: '0 0 8px' }}>
        Archive
      </p>
      <h1 className="hero-display" style={{ fontFamily: 'Bodoni Moda, serif', fontSize: 48, fontWeight: 500, lineHeight: 1.1, color: 'var(--fg)', margin: '0 0 28px' }}>
        What you&apos;ve <em style={{ fontStyle: 'italic', fontWeight: 400 }}>shipped</em>
      </h1>

      {/* Filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <div>
          <FilterLabel>Category</FilterLabel>
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <FilterLabel>Range</FilterLabel>
          <Select
            value={rangeFilter}
            onChange={e => setRangeFilter(e.target.value as RangeKey)}
          >
            {RANGES.map(r => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, background: 'var(--card-bg)', border: '1px solid var(--border-hairline)', borderRadius: 6 }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: '#9A9490', fontStyle: 'italic', margin: 0 }}>
            No completed tasks in this range.
          </p>
        </div>
      )}

      {/* Week groups */}
      {grouped.map(({ label, tasks: groupTasks }) => (
        <div key={label} style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: '0 0 10px' }}>
            {label}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {groupTasks.map((task, i) => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  alignItems: 'center',
                  gap: 16,
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderTop: i === 0 ? '1px solid var(--border-hairline)' : 'none',
                  borderBottom: '1px solid var(--border-hairline)',
                  padding: '11px 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {/* Title + category */}
                <div>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 400, color: 'var(--fg)', margin: '0 0 2px', lineHeight: 1.3 }}>
                    {task.title}
                  </p>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: 0 }}>
                    {task.category?.name ?? '—'}
                  </p>
                </div>

                {/* Completion date */}
                {task.completed_at && (
                  <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9A9490', whiteSpace: 'nowrap' }}>
                    {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}

                {/* Relative time */}
                {task.completed_at && (
                  <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#9A9490', whiteSpace: 'nowrap', letterSpacing: '0.04em', minWidth: 80, textAlign: 'right' }}>
                    {relativeTime(task.completed_at, now)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Task detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
