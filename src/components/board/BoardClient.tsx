'use client'

import { useState, useMemo } from 'react'
import TasksToday from './TasksToday'
import GeneralView from './GeneralView'
import NewTaskModal from '@/components/task/NewTaskModal'
import TaskDetailPanel from '@/components/task/TaskDetailPanel'
import CategoryManagerModal from '@/components/categories/CategoryManagerModal'
import type { Category, TaskWithRelations } from '@/lib/types'

interface Props {
  categories: Category[]
  tasks: TaskWithRelations[]
}

const STALE_MS = 14 * 24 * 60 * 60 * 1000

export default function BoardClient({ categories, tasks }: Props) {
  const [selectedTask, setSelectedTask]           = useState<TaskWithRelations | null>(null)
  const [showNewTask, setShowNewTask]             = useState(false)
  const [newTaskCategory, setNewTaskCategory]     = useState<string | undefined>()
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [staleDismissed, setStaleDismissed]       = useState(false)

  // Session-only completed tasks. Server no longer returns recently-done
  // tasks; instead we snapshot the task on completion and keep showing it
  // with strikethrough until the user refreshes the page.
  const [sessionDone, setSessionDone] = useState<Record<string, TaskWithRelations>>({})

  const now = useMemo(() => new Date(), [])

  const displayTasks = useMemo(() => {
    const liveIds = new Set(tasks.map(t => t.id))
    const overridden = tasks.map(t => sessionDone[t.id] ?? t)
    const orphaned   = Object.values(sessionDone).filter(d => !liveIds.has(d.id))
    return [...overridden, ...orphaned]
  }, [tasks, sessionDone])

  function handleMarkedDone(task: TaskWithRelations) {
    setSessionDone(prev => ({
      ...prev,
      [task.id]: { ...task, status: 'done', completed_at: new Date().toISOString() },
    }))
  }

  const staleCount = useMemo(() => displayTasks.filter(t =>
    t.status !== 'done'
    && t.task_type === 'flexible'
    && (now.getTime() - new Date(t.updated_at).getTime()) > STALE_MS
  ).length, [displayTasks, now])

  function openNewTask(categoryId?: string) {
    setNewTaskCategory(categoryId)
    setShowNewTask(true)
  }

  function closeNewTask() {
    setShowNewTask(false)
    setNewTaskCategory(undefined)
  }

  return (
    <div className="board-page" style={{ minHeight: 'calc(100vh - 63px)' }}>
      {/* Stale task nudge banner */}
      {staleCount > 0 && !staleDismissed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'rgba(219,116,66,0.08)',
            border: '1px solid rgba(219,116,66,0.22)',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 24,
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            color: '#DB7442',
          }}
        >
          <span>
            {staleCount === 1
              ? '1 flexible task hasn\'t been updated in 14+ days — worth revisiting.'
              : `${staleCount} flexible tasks haven't been updated in 14+ days — worth revisiting.`}
          </span>
          <button
            onClick={() => setStaleDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DB7442', opacity: 0.6, fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
          >
            ×
          </button>
        </div>
      )}

      {/* Tasks today */}
      <TasksToday tasks={displayTasks} onTaskClick={setSelectedTask} />

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border-hairline)', marginBottom: 24 }} />

      {/* General view */}
      <GeneralView
        categories={categories}
        tasks={displayTasks}
        onTaskClick={setSelectedTask}
        onAddTask={openNewTask}
        onManageCategories={() => setShowCategoryManager(true)}
      />

      {/* Floating "+ New task" button */}
      <button
        onClick={() => openNewTask()}
        aria-label="New task"
        title="New task"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#614E3A',
          border: 'none',
          color: '#F5F3F0',
          fontSize: 26,
          fontWeight: 300,
          lineHeight: 1,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.07)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)'
        }}
      >
        +
      </button>

      {/* Modals / panel */}
      {showNewTask && (
        <NewTaskModal
          categories={categories}
          defaultCategoryId={newTaskCategory}
          onClose={closeNewTask}
        />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
          onMarkedDone={handleMarkedDone}
        />
      )}

      {showCategoryManager && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  )
}
