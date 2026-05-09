'use client'

import { useMemo, useState } from 'react'
import { computeUrgency } from '@/lib/urgency'
import PriorityCard from './PriorityCard'
import type { TaskWithRelations } from '@/lib/types'

interface Props {
  tasks: TaskWithRelations[]
  onTaskClick: (task: TaskWithRelations) => void
}

const PAGE_SIZE = 3

export default function TasksToday({ tasks, onTaskClick }: Props) {
  const [page, setPage] = useState(0)
  const now = useMemo(() => new Date(), [])

  const priorityTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'done')
      .filter(t => {
        if (t.manual_priority_pin) return true
        const tier = computeUrgency(t, now)
        return tier === 'urgent' || tier === 'soon'
      })
      .sort((a, b) => {
        const tierOrder = { urgent: 0, soon: 1, cadence: 2, scheduled: 3, flexible: 4 }
        const ta = computeUrgency(a, now)
        const tb = computeUrgency(b, now)
        if (tierOrder[ta] !== tierOrder[tb]) return tierOrder[ta] - tierOrder[tb]
        // Within same tier: sort by earliest date
        const da = a.scheduled_at ?? a.due_at
        const db = b.scheduled_at ?? b.due_at
        if (da && db) return new Date(da).getTime() - new Date(db).getTime()
        return 0
      })
  }, [tasks, now])

  const totalPages = Math.ceil(priorityTasks.length / PAGE_SIZE)
  const visible = priorityTasks.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const hasMore = priorityTasks.length > PAGE_SIZE

  return (
    <section style={{ marginBottom: 40 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr 28px',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Left: hero label */}
        <div style={{ paddingTop: 4 }}>
          <p
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#9A9490',
              marginBottom: 4,
            }}
          >
            Now
          </p>
          <h2
            style={{
              fontFamily: 'Bodoni Moda, serif',
              fontSize: 44,
              fontWeight: 500,
              lineHeight: 1.05,
              color: 'var(--fg)',
              margin: 0,
            }}
          >
            Tasks{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>today</em>
          </h2>
        </div>

        {/* Center: cards */}
        {priorityTasks.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 100,
              background: 'var(--card-bg)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 6,
            }}
          >
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 11,
                color: '#9A9490',
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              Nothing urgent today — good time to tackle flexible work.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${visible.length}, 1fr)`,
              gap: 10,
              alignItems: 'stretch',
            }}
          >
            {visible.map(task => (
              <PriorityCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </div>
        )}

        {/* Right: prev/next arrows */}
        {hasMore ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: 24, height: 24,
                background: 'none',
                border: '1px solid var(--border-hairline)',
                borderRadius: 4,
                cursor: page === 0 ? 'default' : 'pointer',
                color: 'var(--fg)',
                opacity: page === 0 ? 0.2 : 0.6,
                fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ↑
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                width: 24, height: 24,
                background: 'none',
                border: '1px solid var(--border-hairline)',
                borderRadius: 4,
                cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                color: 'var(--fg)',
                opacity: page >= totalPages - 1 ? 0.2 : 0.6,
                fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ↓
            </button>
          </div>
        ) : (
          <div />
        )}
      </div>
    </section>
  )
}
