'use client'

import CategoryColumn from './CategoryColumn'
import type { Category, TaskWithRelations } from '@/lib/types'

interface Props {
  categories: Category[]
  tasks: TaskWithRelations[]
  onTaskClick: (task: TaskWithRelations) => void
  onAddTask: (categoryId?: string) => void
  onAddCategory: () => void
}

export default function GeneralView({
  categories,
  tasks,
  onTaskClick,
  onAddTask,
  onAddCategory,
}: Props) {
  const tasksByCategory = Object.fromEntries(
    categories.map(c => [c.id, tasks.filter(t => t.category_id === c.id)])
  )

  return (
    <section>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#9A9490',
            margin: 0,
          }}
        >
          General view
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={onAddCategory}
            style={{
              background: 'none',
              border: '1px solid var(--border-hairline)',
              borderRadius: 4,
              padding: '5px 10px',
              cursor: 'pointer',
              fontFamily: 'Jost, sans-serif',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#9A9490',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-hairline)')}
          >
            + Category
          </button>
          <a
            href="/cadence"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#9A9490',
              textDecoration: 'none',
              opacity: 0.6,
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}
          >
            Cadence rules
          </a>
        </div>
      </div>

      {categories.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            background: 'var(--column-bg)',
            border: '1px dashed var(--border-hairline)',
            borderRadius: 6,
            gap: 12,
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
            No categories yet.
          </p>
          <button
            onClick={onAddCategory}
            style={{
              background: '#614E3A',
              color: '#F5F3F0',
              border: 'none',
              borderRadius: 4,
              padding: '10px 16px',
              fontFamily: 'Jost, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
            alignItems: 'start',
          }}
        >
          {categories.map(cat => (
            <CategoryColumn
              key={cat.id}
              category={cat}
              tasks={tasksByCategory[cat.id] ?? []}
              onTaskClick={onTaskClick}
              onAddTask={() => onAddTask(cat.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
