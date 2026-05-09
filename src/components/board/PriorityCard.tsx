'use client'

import { useMemo } from 'react'
import {
  computeUrgency,
  URGENCY_COLOR,
  URGENCY_LABEL,
  URGENCY_CARD_BORDER,
  formatCountdown,
} from '@/lib/urgency'
import type { TaskWithRelations } from '@/lib/types'

interface Props {
  task: TaskWithRelations
  onClick: () => void
}

export default function PriorityCard({ task, onClick }: Props) {
  const now = useMemo(() => new Date(), [])
  const tier = useMemo(() => computeUrgency(task, now), [task, now])
  const countdown = formatCountdown(task, now)

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 100,
        background: 'var(--card-bg)',
        border: `1px solid ${URGENCY_CARD_BORDER[tier]}`,
        borderRadius: 6,
        padding: '14px 16px 0',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 150ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,243,240,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--card-bg)')}
    >
      {/* Category label */}
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
        {task.category?.name ?? '—'}
      </p>

      {/* Task title */}
      <p
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 13,
          fontWeight: 400,
          color: 'var(--fg)',
          margin: '0 0 auto',
          lineHeight: 1.45,
          paddingBottom: 12,
          flexGrow: 1,
        }}
      >
        {task.title}
      </p>

      {/* Bottom row — urgency + countdown */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-hairline)',
          paddingTop: 8,
          paddingBottom: 10,
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: URGENCY_COLOR[tier],
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: URGENCY_COLOR[tier],
            }}
          >
            {URGENCY_LABEL[tier]}
          </span>
        </div>

        {countdown && (
          <span
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: '0.04em',
              color: '#9A9490',
            }}
          >
            {countdown}
          </span>
        )}
      </div>
    </button>
  )
}
