'use client'

import { useState, useMemo } from 'react'
import { computeUrgency, URGENCY_COLOR, URGENCY_LABEL, formatCountdown } from '@/lib/urgency'
import TaskDetailPanel from '@/components/task/TaskDetailPanel'
import type { Category, TaskWithRelations, UrgencyTier } from '@/lib/types'

interface Props {
  tasks: TaskWithRelations[]
  categories: Category[]
}

const TIER_ORDER: UrgencyTier[] = ['urgent', 'soon', 'cadence']

function TodayTaskRow({
  task,
  onClick,
}: {
  task: TaskWithRelations
  onClick: () => void
}) {
  const now = useMemo(() => new Date(), [])
  const tier = computeUrgency(task, now)
  const countdown = formatCountdown(task, now)

  return (
    <button
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        background: 'var(--card-bg)',
        border: `1px solid var(--border-hairline)`,
        borderLeft: `3px solid ${URGENCY_COLOR[tier]}`,
        borderRadius: '0 6px 6px 0',
        padding: '12px 16px 12px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,243,240,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--card-bg)')}
    >
      <div>
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#9A9490',
            margin: '0 0 4px',
          }}
        >
          {task.category?.name ?? '—'}
        </p>
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 13,
            fontWeight: 400,
            color: 'var(--fg)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </p>
      </div>

      {countdown && (
        <span
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: URGENCY_COLOR[tier],
            whiteSpace: 'nowrap',
          }}
        >
          {countdown}
        </span>
      )}
    </button>
  )
}

export default function TodayClient({ tasks, categories }: Props) {
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  const now = useMemo(() => new Date(), [])

  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  })

  // Group tasks by urgency tier (only urgent, soon, cadence + pinned)
  const grouped = useMemo(() => {
    const buckets: Record<UrgencyTier, TaskWithRelations[]> = {
      urgent:    [],
      soon:      [],
      cadence:   [],
      scheduled: [],
      flexible:  [],
    }

    for (const task of tasks) {
      const tier = task.manual_priority_pin ? 'urgent' : computeUrgency(task, now)
      if (TIER_ORDER.includes(tier) || task.manual_priority_pin) {
        buckets[tier].push(task)
      }
    }

    // Sort within each tier by earliest date
    for (const tier of TIER_ORDER) {
      buckets[tier].sort((a, b) => {
        const da = a.scheduled_at ?? a.due_at
        const db = b.scheduled_at ?? b.due_at
        if (da && db) return new Date(da).getTime() - new Date(db).getTime()
        return 0
      })
    }

    return buckets
  }, [tasks, now])

  const counts = TIER_ORDER.map(tier => ({
    tier,
    count: grouped[tier].length,
  })).filter(x => x.count > 0)

  const totalVisible = counts.reduce((s, x) => s + x.count, 0)

  return (
    <div className="app-page" style={{ maxWidth: 720 }}>
      {/* Header */}
      <p
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#9A9490',
          margin: '0 0 8px',
        }}
      >
        {dateLabel}
      </p>

      <h1
        className="hero-display"
        style={{
          fontFamily: 'Bodoni Moda, serif',
          fontSize: 48,
          fontWeight: 500,
          lineHeight: 1.1,
          color: 'var(--fg)',
          margin: '0 0 12px',
        }}
      >
        Today&apos;s <em style={{ fontStyle: 'italic', fontWeight: 400 }}>priorities</em>
      </h1>

      {/* Count summary */}
      {counts.length > 0 && (
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            fontWeight: 300,
            color: '#9A9490',
            margin: '0 0 36px',
            letterSpacing: '0.04em',
          }}
        >
          {counts.map(({ tier, count }, i) => (
            <span key={tier}>
              {i > 0 && <span style={{ opacity: 0.4 }}> · </span>}
              <span style={{ color: URGENCY_COLOR[tier] }}>
                {count} {URGENCY_LABEL[tier].toLowerCase()}
              </span>
            </span>
          ))}
        </p>
      )}

      {/* Empty state */}
      {totalVisible === 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 160,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 6,
          }}
        >
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: '#9A9490', fontStyle: 'italic', margin: 0 }}>
            Nothing urgent today — good time to tackle flexible work.
          </p>
        </div>
      )}

      {/* Tier groups */}
      {TIER_ORDER.map(tier => {
        const tierTasks = grouped[tier]
        if (tierTasks.length === 0) return null

        return (
          <div key={tier} style={{ marginBottom: 28 }}>
            {/* Tier header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: URGENCY_COLOR[tier],
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: URGENCY_COLOR[tier],
                }}
              >
                {URGENCY_LABEL[tier]}
              </span>
            </div>

            {/* Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tierTasks.map(task => (
                <TodayTaskRow
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </div>
        )
      })}

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
