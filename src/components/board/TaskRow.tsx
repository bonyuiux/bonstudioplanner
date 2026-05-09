'use client'

import { useMemo } from 'react'
import { computeUrgency, URGENCY_COLOR, formatCountdown, formatDate } from '@/lib/urgency'
import type { TaskWithRelations } from '@/lib/types'

interface Props {
  task: TaskWithRelations
  onClick: () => void
}

export default function TaskRow({ task, onClick }: Props) {
  const now = useMemo(() => new Date(), [])
  const isDone = task.status === 'done'

  const tier = useMemo(
    () => (isDone ? null : computeUrgency(task, now)),
    [task, now, isDone]
  )

  const borderColor = isDone
    ? 'rgba(154,148,144,0.25)'
    : tier
    ? URGENCY_COLOR[tier]
    : 'transparent'

  const countdown = !isDone && (task.scheduled_at || task.due_at)
    ? formatCountdown(task, now)
    : null

  const dateLine = isDone && task.completed_at
    ? `Done ${formatDate(task.completed_at)}`
    : task.scheduled_at
    ? formatDate(task.scheduled_at, true)
    : task.due_at
    ? `Due ${formatDate(task.due_at)}`
    : null

  const doneCount = task.checklist_items?.filter(i => i.done).length ?? 0
  const totalCount = task.checklist_items?.length ?? 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'var(--card-bg)',
        border: 'none',
        borderLeft: `2px solid ${borderColor}`,
        borderRadius: '0 4px 4px 0',
        padding: '9px 10px 9px 12px',
        cursor: 'pointer',
        opacity: isDone ? 0.5 : 1,
        transition: 'opacity 150ms ease',
        marginBottom: 4,
      }}
      onMouseEnter={e => !isDone && (e.currentTarget.style.background = 'rgba(245,243,240,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--card-bg)')}
    >
      <div
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 11,
          fontWeight: 400,
          color: 'var(--fg)',
          marginBottom: dateLine || countdown ? 3 : 0,
          textDecoration: isDone ? 'line-through' : 'none',
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </div>

      {(dateLine || countdown || totalCount > 0) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'Jost, sans-serif',
            fontSize: 10,
            fontWeight: 300,
            color: '#9A9490',
            letterSpacing: '0.04em',
          }}
        >
          <span>{dateLine ?? ''}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {totalCount > 0 && (
              <span>{doneCount}/{totalCount}</span>
            )}
            {countdown && (
              <span style={{ color: tier ? URGENCY_COLOR[tier] : '#9A9490' }}>
                {countdown}
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  )
}
