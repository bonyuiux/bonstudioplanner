'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { computeUrgency, URGENCY_COLOR, formatCountdown, formatDate } from '@/lib/urgency'
import { updateTask } from '@/lib/actions/tasks'
import type { TaskWithRelations } from '@/lib/types'

interface Props {
  task: TaskWithRelations
  onClick: () => void
}

export default function TaskRow({ task, onClick }: Props) {
  const router = useRouter()
  const now = useMemo(() => new Date(), [])
  const isDone = task.status === 'done'

  async function togglePin(e: React.MouseEvent) {
    e.stopPropagation()
    await updateTask(task.id, { manual_priority_pin: !task.manual_priority_pin })
    router.refresh()
  }

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

  const isStale = !isDone
    && task.task_type === 'flexible'
    && (now.getTime() - new Date(task.updated_at).getTime()) > 14 * 24 * 60 * 60 * 1000

  return (
    <div
      style={{ position: 'relative', marginBottom: 4 }}
      onMouseEnter={e => {
        const pin = e.currentTarget.querySelector<HTMLElement>('.pin-btn')
        if (pin) pin.style.opacity = '1'
      }}
      onMouseLeave={e => {
        const pin = e.currentTarget.querySelector<HTMLElement>('.pin-btn')
        if (pin && !task.manual_priority_pin) pin.style.opacity = '0'
      }}
    >
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
        padding: '9px 28px 9px 12px',
        cursor: 'pointer',
        opacity: isDone ? 0.5 : 1,
        transition: 'opacity 150ms ease',
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {dateLine ?? ''}
            {isStale && (
              <span style={{ color: '#DB7442', opacity: 0.7, fontSize: 9, letterSpacing: '0.06em' }}>
                stale
              </span>
            )}
          </span>
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

    {/* Priority pin — visible on hover or when pinned */}
    {!isDone && (
      <button
        className="pin-btn"
        onClick={togglePin}
        title={task.manual_priority_pin ? 'Unpin from Today' : 'Pin to Today'}
        style={{
          position: 'absolute',
          top: '50%',
          right: 6,
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          opacity: task.manual_priority_pin ? 1 : 0,
          transition: 'opacity 120ms ease',
          color: task.manual_priority_pin ? '#F1C76D' : '#9A9490',
          lineHeight: 1,
          fontSize: 11,
        }}
      >
        {/* Pin icon */}
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M9 1L11 3L7.5 5.5L8 9L6 7L4 9L4.5 5.5L1 3L3 1L6 3.5L9 1Z"
            fill={task.manual_priority_pin ? '#F1C76D' : 'currentColor'}
            stroke={task.manual_priority_pin ? '#F1C76D' : 'currentColor'}
            strokeWidth="0.5"
          />
        </svg>
      </button>
    )}
    </div>
  )
}
