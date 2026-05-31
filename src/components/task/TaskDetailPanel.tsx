'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { computeUrgency, URGENCY_COLOR, URGENCY_LABEL, formatDate, formatCountdown, DURATION_LABELS } from '@/lib/urgency'
import { updateTask, markTaskDone, reopenTask, deleteTask } from '@/lib/actions/tasks'
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem } from '@/lib/actions/checklist'
import { FieldWrapper, TextInput, TextArea, Select, PrimaryButton, GhostButton } from './FormField'
import type { TaskWithRelations, ChecklistItem, Category } from '@/lib/types'

interface Props {
  task: TaskWithRelations
  categories: Category[]
  onClose: () => void
  // Optional. If provided, called after the task is successfully marked done so
  // a parent (e.g. BoardClient) can keep showing it for the rest of the session.
  onMarkedDone?: (task: TaskWithRelations) => void
}

function ChecklistRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ChecklistItem
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 0',
        borderBottom: '1px solid var(--border-hairline)',
      }}
    >
      <button
        onClick={() => onToggle(item.id, !item.done)}
        style={{
          width: 14,
          height: 14,
          borderRadius: 2,
          border: item.done ? 'none' : '1px solid var(--border-emphasis)',
          background: item.done ? '#614E3A' : 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {item.done && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3l2.5 2.5L8 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 12,
          fontWeight: 300,
          color: 'var(--fg)',
          flexGrow: 1,
          textDecoration: item.done ? 'line-through' : 'none',
          opacity: item.done ? 0.5 : 1,
        }}
      >
        {item.label}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        style={{ background: 'none', border: 'none', color: '#9A9490', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.5 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
      >
        ×
      </button>
    </div>
  )
}

export default function TaskDetailPanel({ task, categories, onClose, onMarkedDone }: Props) {
  const router = useRouter()
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [newItem, setNewItem]     = useState('')

  // Edit field state (mirrors task)
  const [title, setTitle]         = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [categoryId, setCategoryId]   = useState(task.category_id)
  const [status, setStatus]       = useState(task.status)

  // Reset edit state when task changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setCategoryId(task.category_id)
    setStatus(task.status)
    setEditing(false)
  }, [task.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )
  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const now = new Date()
  const isDone = task.status === 'done'
  const tier = isDone ? null : computeUrgency(task, now)
  const countdown = !isDone ? formatCountdown(task, now) : null

  const doneCount = task.checklist_items?.filter(i => i.done).length ?? 0
  const totalCount = task.checklist_items?.length ?? 0

  async function handleSave() {
    setSaving(true)
    await updateTask(task.id, {
      title:       title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      status,
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleMarkDone() {
    const res = await markTaskDone(task.id)
    if (!res.error) onMarkedDone?.(task)
    router.refresh()
    onClose()
  }

  async function handleReopen() {
    await reopenTask(task.id)
    router.refresh()
    onClose()
  }

  async function handleDelete() {
    if (!confirm('Delete this task? This cannot be undone.')) return
    await deleteTask(task.id)
    router.refresh()
    onClose()
  }

  async function handleToggleChecklist(id: string, done: boolean) {
    await toggleChecklistItem(id, done)
    router.refresh()
  }

  async function handleDeleteChecklist(id: string) {
    await deleteChecklistItem(id)
    router.refresh()
  }

  async function handleAddChecklist() {
    const label = newItem.trim()
    if (!label) return
    setNewItem('')
    await addChecklistItem(task.id, label)
    router.refresh()
  }

  const dotColor = isDone ? '#9A9490' : tier ? URGENCY_COLOR[tier] : '#9A9490'
  const statusLabel = isDone
    ? 'DONE'
    : status === 'in_progress'
    ? 'IN PROGRESS'
    : tier
    ? URGENCY_LABEL[tier]
    : 'TO DO'

  return (
    /* Backdrop */
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(0,0,0,0.35)',
      }}
    >
      {/* Panel */}
      <div
        className="detail-panel"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          background: 'var(--bg)',
          borderLeft: '1px solid var(--border-emphasis)',
          padding: 28,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          animation: 'slideInPanel 200ms ease-out',
        }}
      >
        <style>{`
          @keyframes slideInPanel {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        `}</style>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
            <span
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: dotColor,
              }}
            >
              {statusLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isDone && !editing && (
              <button
                onClick={() => setEditing(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9A9490', padding: 0, letterSpacing: '0.04em' }}
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9490', fontSize: 20, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Category line */}
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#9A9490',
            margin: '0 0 10px',
          }}
        >
          {task.category?.name}
          {task.task_type !== 'flexible' ? ` · ${task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}` : ''}
        </p>

        {/* Title */}
        {editing ? (
          <FieldWrapper label="Title" style={{ marginBottom: 18 }}>
            <TextInput value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </FieldWrapper>
        ) : (
          <h2
            style={{
              fontFamily: 'Bodoni Moda, serif',
              fontSize: 26,
              fontWeight: 500,
              color: 'var(--fg)',
              margin: '0 0 20px',
              lineHeight: 1.25,
              textDecoration: isDone ? 'line-through' : 'none',
              opacity: isDone ? 0.7 : 1,
            }}
          >
            {task.title}
          </h2>
        )}

        {/* Meta grid */}
        <div
          style={{
            borderTop: '1px solid var(--border-hairline)',
            borderBottom: '1px solid var(--border-hairline)',
            padding: '12px 0',
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px 16px',
          }}
        >
          {(task.scheduled_at || task.due_at) && (
            <div>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: '0 0 3px' }}>
                {task.scheduled_at ? 'When' : 'Due'}
              </p>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: 'var(--fg)', margin: 0 }}>
                {formatDate(task.scheduled_at ?? task.due_at, !!task.scheduled_at)}
              </p>
              {countdown && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: dotColor, margin: '2px 0 0', letterSpacing: '0.04em' }}>
                  {countdown}
                </p>
              )}
            </div>
          )}

          {task.duration_minutes && (
            <div>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: '0 0 3px' }}>
                Duration
              </p>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: 'var(--fg)', margin: 0 }}>
                {DURATION_LABELS[task.duration_minutes] ?? `${task.duration_minutes} min`}
              </p>
            </div>
          )}

          {editing && (
            <div style={{ gridColumn: '1 / -1' }}>
              <FieldWrapper label="Status">
                <Select value={status} onChange={e => setStatus(e.target.value as typeof status)}>
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Category">
                <Select value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value || null)}>
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </FieldWrapper>
            </div>
          )}
        </div>

        {/* Description */}
        {(task.description || editing) && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: '0 0 8px' }}>
              Notes
            </p>
            {editing ? (
              <TextArea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
            ) : (
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300, color: 'var(--fg)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {task.description}
              </p>
            )}
          </div>
        )}

        {/* Checklist */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: 0 }}>
              Checklist
            </p>
            {totalCount > 0 && (
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#9A9490' }}>
                {doneCount} of {totalCount}
              </span>
            )}
          </div>

          {task.checklist_items?.map(item => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={handleToggleChecklist}
              onDelete={handleDeleteChecklist}
            />
          ))}

          {/* Add item */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <TextInput
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="Add item…"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklist() } }}
              style={{ flexGrow: 1, fontSize: 12 }}
            />
            <button
              onClick={handleAddChecklist}
              style={{
                background: 'none',
                border: '1px solid var(--border-emphasis)',
                borderRadius: 4,
                padding: '0 10px',
                color: '#9A9490',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'Jost, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Edit save/cancel */}
        {editing && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <PrimaryButton onClick={handleSave} loading={saving} style={{ flexGrow: 1 }}>
              Save changes
            </PrimaryButton>
            <GhostButton onClick={() => { setEditing(false); setTitle(task.title); setDescription(task.description ?? '') }}>
              Cancel
            </GhostButton>
          </div>
        )}

        {/* CTA buttons */}
        {!editing && (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isDone ? (
              <GhostButton onClick={handleReopen} style={{ width: '100%', textAlign: 'center' }}>
                Reopen task
              </GhostButton>
            ) : (
              <button
                onClick={handleMarkDone}
                style={{
                  width: '100%',
                  background: '#614E3A',
                  color: '#F5F3F0',
                  border: 'none',
                  borderRadius: 4,
                  padding: '13px 14px',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Mark as done
              </button>
            )}
            <button
              onClick={handleDelete}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(188,59,59,0.6)',
                cursor: 'pointer',
                fontFamily: 'Jost, sans-serif',
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '4px 0',
                textAlign: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#BC3B3B')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(188,59,59,0.6)')}
            >
              Delete task
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
