'use client'

import TaskRow from './TaskRow'
import type { Category, TaskWithRelations } from '@/lib/types'

interface Props {
  category: Category
  tasks: TaskWithRelations[]
  onTaskClick: (task: TaskWithRelations) => void
  onAddTask: () => void
}

export default function CategoryColumn({ category, tasks, onTaskClick, onAddTask }: Props) {
  const activeTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks   = tasks.filter(t => t.status === 'done')

  return (
    <div
      style={{
        background: 'var(--column-bg)',
        border: '1px solid var(--column-border)',
        borderRadius: 6,
        padding: 12,
        minWidth: 0,
      }}
    >
      {/* Column header */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4,
          }}
        >
          <h3
            style={{
              fontFamily: 'Italiana, serif',
              fontSize: 16,
              letterSpacing: '0.02em',
              color: 'var(--fg)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {category.name}
          </h3>
          <button
            onClick={onAddTask}
            title="Add task"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9A9490',
              fontSize: 18,
              lineHeight: 1,
              padding: '0 0 0 4px',
              opacity: 0.6,
              flexShrink: 0,
              marginTop: -2,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
          >
            +
          </button>
        </div>

        {category.subtitle && (
          <p
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#9A9490',
              margin: '0 0 6px',
            }}
          >
            {category.subtitle}
          </p>
        )}

        <div style={{ borderTop: '1px solid var(--border-hairline)' }} />
      </div>

      {/* Active tasks */}
      <div>
        {activeTasks.map(task => (
          <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>

      {/* Done tasks (7-day window) */}
      {doneTasks.length > 0 && (
        <div style={{ marginTop: activeTasks.length > 0 ? 8 : 0 }}>
          {doneTasks.map(task => (
            <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <button
          onClick={onAddTask}
          style={{
            width: '100%',
            background: 'none',
            border: '1px dashed var(--border-hairline)',
            borderRadius: 4,
            padding: '12px 8px',
            cursor: 'pointer',
            fontFamily: 'Jost, sans-serif',
            fontSize: 10,
            color: '#9A9490',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          Add a task
        </button>
      )}
    </div>
  )
}
