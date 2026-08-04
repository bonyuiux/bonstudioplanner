'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TaskRow from './TaskRow'
import { reorderTasks } from '@/lib/actions/tasks'
import { accentText } from '@/lib/areaColors'
import { useTheme } from '@/components/ThemeProvider'
import type { Area, Category, TaskWithRelations } from '@/lib/types'

interface Props {
  category: Category
  area: Area | null
  tasks: TaskWithRelations[]
  onTaskClick: (task: TaskWithRelations) => void
  onAddTask: () => void
}

export default function CategoryColumn({ category, area, tasks, onTaskClick, onAddTask }: Props) {
  const router = useRouter()
  const { theme } = useTheme()

  // Ordered IDs override — only set during/after a drag; cleared when props refresh
  const [overrideIds, setOverrideIds] = useState<string[] | null>(null)
  const [dragOverId, setDragOverId]   = useState<string | null>(null)
  const dragId                        = useRef<string | null>(null)

  const propActive = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => a.sort_order - b.sort_order)

  const doneTasks = tasks.filter(t => t.status === 'done')

  // Clear the drag override whenever parent props refresh with new task data
  useEffect(() => {
    setOverrideIds(null)
  }, [tasks])

  // Build the display list: override order if dragging, else prop order
  const activeTasks = overrideIds
    ? overrideIds.flatMap(id => {
        const t = propActive.find(t => t.id === id)
        return t ? [t] : []
      })
    : propActive

  function onDragStart(id: string) {
    dragId.current = id
  }

  function onDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault()
    if (dragId.current !== overId) setDragOverId(overId)
  }

  function onDragLeave() {
    setDragOverId(null)
  }

  async function onDrop(e: React.DragEvent, overId: string) {
    e.preventDefault()
    setDragOverId(null)
    const fromId = dragId.current
    if (!fromId || fromId === overId) return

    const next = [...activeTasks]
    const fromIdx = next.findIndex(t => t.id === fromId)
    const toIdx   = next.findIndex(t => t.id === overId)
    if (fromIdx < 0 || toIdx < 0) return

    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    const newIds = next.map(t => t.id)
    setOverrideIds(newIds)

    await reorderTasks(newIds)
    router.refresh()
  }

  function onDragEnd() {
    dragId.current = null
    setDragOverId(null)
  }

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
        {/* Area label — replaces the old subtitle and sits above the name */}
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: area ? accentText(area.color, theme === 'dark') : 'var(--fg-muted)',
            margin: '0 0 3px',
            opacity: area ? 1 : 0.6,
          }}
        >
          {area ? area.name : 'Unassigned'}
        </p>
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

        <div style={{ borderTop: '1px solid var(--border-hairline)' }} />
      </div>

      {/* Active tasks — draggable */}
      <div>
        {activeTasks.map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task.id)}
            onDragOver={e => onDragOver(e, task.id)}
            onDragLeave={onDragLeave}
            onDrop={e => onDrop(e, task.id)}
            onDragEnd={onDragEnd}
            style={{
              cursor: 'grab',
              outline: dragOverId === task.id
                ? '1px dashed rgba(154,148,144,0.5)'
                : 'none',
              borderRadius: 4,
              transition: 'outline 80ms ease',
            }}
          >
            <TaskRow task={task} onClick={() => onTaskClick(task)} />
          </div>
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
