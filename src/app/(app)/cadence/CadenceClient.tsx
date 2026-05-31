'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleCadenceRuleActive, deleteCadenceRule } from '@/lib/actions/cadence'
import NewTaskModal from '@/components/task/NewTaskModal'
import type { CadenceRule, Category } from '@/lib/types'

interface Props {
  rules: CadenceRule[]
  categories: Category[]
}

const FREQ_LABELS: Record<string, (v: number) => string> = {
  per_week:      v => `${v}× per week`,
  every_n_days:  v => `every ${v} days`,
  weekly_on_day: v => `every ${'Sun Mon Tue Wed Thu Fri Sat'.split(' ')[v]}`,
}

export default function CadenceClient({ rules, categories }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  async function handleToggle(id: string, active: boolean) {
    await toggleCadenceRuleActive(id, !active)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this cadence rule? Active tasks spawned by it will remain.')) return
    await deleteCadenceRule(id)
    router.refresh()
  }

  return (
    <div className="app-page" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: '0 0 8px' }}>
          Recurring work
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="hero-display" style={{ fontFamily: 'Bodoni Moda, serif', fontSize: 40, fontWeight: 500, lineHeight: 1.1, color: 'var(--fg)', margin: 0 }}>
            Cadence <em style={{ fontStyle: 'italic', fontWeight: 400 }}>rules</em>
          </h1>
          <button
            onClick={() => setShowModal(true)}
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
            + New rule
          </button>
        </div>
      </div>

      {/* Rule list */}
      {rules.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, background: 'var(--card-bg)', border: '1px dashed var(--border-hairline)', borderRadius: 6, gap: 12 }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9A9490', fontStyle: 'italic', margin: 0 }}>
            No cadence rules yet.
          </p>
          <button onClick={() => setShowModal(true)} style={{ background: '#614E3A', color: '#F5F3F0', border: 'none', borderRadius: 4, padding: '10px 16px', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Create first rule
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.map(rule => {
            const category = categories.find(c => c.id === rule.category_id)
            const freqLabel = FREQ_LABELS[rule.frequency_type]?.(rule.frequency_value) ?? '—'
            const lastDone = rule.last_completed_at
              ? new Date(rule.last_completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Never'

            return (
              <div
                key={rule.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-hairline)',
                  borderLeft: `3px solid ${rule.active ? '#F1C76D' : 'rgba(154,148,144,0.3)'}`,
                  borderRadius: '0 6px 6px 0',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  opacity: rule.active ? 1 : 0.5,
                }}
              >
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 400, color: 'var(--fg)', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {rule.template_title}
                  </p>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#9A9490', margin: 0, letterSpacing: '0.04em' }}>
                    {category?.name ?? '—'} · {freqLabel} · Last done: {lastDone}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggle(rule.id, rule.active)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 4,
                      padding: '5px 10px',
                      fontFamily: 'Jost, sans-serif',
                      fontSize: 9,
                      fontWeight: 500,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#9A9490',
                      cursor: 'pointer',
                    }}
                  >
                    {rule.active ? 'Pause' : 'Resume'}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(rule.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(188,59,59,0.5)', fontSize: 16, lineHeight: 1, padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#BC3B3B')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(188,59,59,0.5)')}
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Back to board */}
      <div style={{ marginTop: 32 }}>
        <a
          href="/board"
          style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9A9490', textDecoration: 'none', letterSpacing: '0.04em' }}
        >
          ← Back to board
        </a>
      </div>

      {showModal && (
        <NewTaskModal
          categories={categories}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
