'use client'

import { useState, useEffect } from 'react'
import DeadlineForm from './DeadlineForm'
import FlexibleForm from './FlexibleForm'
import CadenceForm from './CadenceForm'
import type { Category } from '@/lib/types'

type TaskKind = 'deadline' | 'flexible' | 'cadence'

interface Props {
  categories: Category[]
  defaultCategoryId?: string
  onClose: () => void
}

// Icon components
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ marginBottom: 10 }}>
      <rect x="2" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1.4" />
      <line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ marginBottom: 10 }}>
      <line x1="7" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" />
      <circle cx="3.5" cy="11" r="1" fill="currentColor" />
      <circle cx="3.5" cy="16" r="1" fill="currentColor" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ marginBottom: 10 }}>
      <path d="M4 11a7 7 0 0 1 7-7 7 7 0 0 1 5 2.1L18 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M18 11a7 7 0 0 1-7 7 7 7 0 0 1-5-2.1L4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <polyline points="18,4 18,8 14,8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="4,18 4,14 8,14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const TYPE_CARDS: Array<{
  kind: TaskKind
  icon: React.ReactNode
  name: string
  helper: string
}> = [
  {
    kind:   'deadline',
    icon:   <CalendarIcon />,
    name:   'Deadline',
    helper: 'A specific date or time. Shoots, deliveries, meetings.',
  },
  {
    kind:   'cadence',
    icon:   <RefreshIcon />,
    name:   'Cadence',
    helper: 'A recurring rhythm. Social posts, weekly reviews.',
  },
  {
    kind:   'flexible',
    icon:   <ListIcon />,
    name:   'Flexible',
    helper: 'No fixed date. Style guides, drafts, eventual work.',
  },
]

export default function NewTaskModal({ categories, defaultCategoryId, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedKind, setSelectedKind] = useState<TaskKind | null>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function selectKind(kind: TaskKind) {
    setSelectedKind(kind)
    setStep(2)
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: step === 1 ? 600 : 520,
          background: 'var(--bg)',
          border: '1px solid var(--border-emphasis)',
          borderRadius: 12,
          padding: '28px 28px 24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
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
              {step === 1 ? 'New task' : `New task · ${selectedKind}`}
            </p>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9490', fontSize: 20, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>

          {step === 1 && (
            <>
              <h2
                style={{
                  fontFamily: 'Bodoni Moda, serif',
                  fontSize: 26,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'var(--fg)',
                  margin: '0 0 6px',
                  lineHeight: 1.2,
                }}
              >
                What kind of task?
              </h2>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9A9490', margin: 0, fontWeight: 300 }}>
                Choose a type to get the right fields.
              </p>
            </>
          )}

          {step === 2 && selectedKind && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9490', fontSize: 11, fontFamily: 'Jost, sans-serif', padding: 0 }}
              >
                ← Back
              </button>
            </div>
          )}
        </div>

        {/* Step 1: type picker */}
        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {TYPE_CARDS.map(card => (
              <button
                key={card.kind}
                onClick={() => selectKind(card.kind)}
                style={{
                  background: 'var(--card-bg)',
                  border: `1px solid var(--border-emphasis)`,
                  borderRadius: 6,
                  padding: '22px 18px 18px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#614E3A')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
              >
                <div style={{ color: '#9A9490' }}>{card.icon}</div>
                <h3
                  style={{
                    fontFamily: 'Italiana, serif',
                    fontSize: 18,
                    letterSpacing: '0.02em',
                    color: 'var(--fg)',
                    margin: '0 0 6px',
                  }}
                >
                  {card.name}
                </h3>
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 300, color: '#9A9490', margin: 0, lineHeight: 1.5 }}>
                  {card.helper}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: form */}
        {step === 2 && selectedKind === 'deadline' && (
          <DeadlineForm
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            onClose={onClose}
          />
        )}
        {step === 2 && selectedKind === 'cadence' && (
          <CadenceForm
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            onClose={onClose}
          />
        )}
        {step === 2 && selectedKind === 'flexible' && (
          <FlexibleForm
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
