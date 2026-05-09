'use client'

import { useState } from 'react'
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

export default function BoardClient({ categories, tasks }: Props) {
  const [selectedTask, setSelectedTask]           = useState<TaskWithRelations | null>(null)
  const [showNewTask, setShowNewTask]             = useState(false)
  const [newTaskCategory, setNewTaskCategory]     = useState<string | undefined>()
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  function openNewTask(categoryId?: string) {
    setNewTaskCategory(categoryId)
    setShowNewTask(true)
  }

  function closeNewTask() {
    setShowNewTask(false)
    setNewTaskCategory(undefined)
  }

  return (
    <div style={{ padding: '32px 32px 96px', minHeight: 'calc(100vh - 63px)' }}>
      {/* Tasks today */}
      <TasksToday tasks={tasks} onTaskClick={setSelectedTask} />

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border-hairline)', marginBottom: 24 }} />

      {/* General view */}
      <GeneralView
        categories={categories}
        tasks={tasks}
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
