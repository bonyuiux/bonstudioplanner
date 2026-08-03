'use client'

import { useMemo } from 'react'
import CategoryColumn from './CategoryColumn'
import TaskRow from './TaskRow'
import { orderAreas } from '@/lib/overview'
import type { Area, Category, TaskWithRelations } from '@/lib/types'

interface Props {
  areas: Area[]
  categories: Category[]
  tasks: TaskWithRelations[]
  onTaskClick: (task: TaskWithRelations) => void
  onAddTask: (categoryId?: string) => void
  onManageCategories: () => void
}

export default function GeneralView({
  areas,
  categories,
  tasks,
  onTaskClick,
  onAddTask,
  onManageCategories,
}: Props) {
  const { tasksByCategory, uncategorized } = useMemo(() => {
    const byCat: Record<string, TaskWithRelations[]> = {}
    for (const c of categories) byCat[c.id] = []
    const orphans: TaskWithRelations[] = []
    for (const t of tasks) {
      if (t.category_id && byCat[t.category_id]) byCat[t.category_id].push(t)
      else if (t.category_id == null) orphans.push(t)
    }
    return { tasksByCategory: byCat, uncategorized: orphans }
  }, [categories, tasks])

  // Categories are grouped by area in the same order the Overview shows them,
  // so starring an area pulls its projects to the front here too. Categories
  // with no area sort last, under an "Unassigned" label.
  const areaById = useMemo(
    () => new Map(areas.map(a => [a.id, a])),
    [areas],
  )

  const sortedCategories = useMemo(() => {
    const rank = new Map(orderAreas(areas).map((a, i) => [a.id, i]))
    return [...categories].sort((a, b) => {
      const ra = a.area_id ? rank.get(a.area_id) ?? 998 : 999
      const rb = b.area_id ? rank.get(b.area_id) ?? 998 : 999
      return ra - rb || a.sort_order - b.sort_order
    })
  }, [areas, categories])

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
            onClick={onManageCategories}
            style={{
              background: 'none',
              border: '1px solid var(--border-hairline)',
              borderRadius: 4,
              padding: '5px 12px',
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
            Categories
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
            onClick={onManageCategories}
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
          {sortedCategories.map(cat => (
            <CategoryColumn
              key={cat.id}
              category={cat}
              area={cat.area_id ? areaById.get(cat.area_id) ?? null : null}
              tasks={tasksByCategory[cat.id] ?? []}
              onTaskClick={onTaskClick}
              onAddTask={() => onAddTask(cat.id)}
            />
          ))}

          {uncategorized.length > 0 && (
            <div
              style={{
                background: 'var(--column-bg)',
                border: '1px dashed var(--border-hairline)',
                borderRadius: 6,
                padding: 12,
                minWidth: 0,
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <h3
                  style={{
                    fontFamily: 'Italiana, serif',
                    fontSize: 16,
                    fontStyle: 'italic',
                    letterSpacing: '0.02em',
                    color: '#9A9490',
                    margin: '0 0 4px',
                    lineHeight: 1.2,
                  }}
                >
                  Uncategorized
                </h3>
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
                  Reassign via task detail
                </p>
                <div style={{ borderTop: '1px solid var(--border-hairline)' }} />
              </div>
              {uncategorized.map(task => (
                <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
