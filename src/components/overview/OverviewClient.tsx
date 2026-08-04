'use client'

import { useState, useMemo, useTransition, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import AreaBand from './AreaBand'
import PhaseCarousel from './PhaseCarousel'
import AreaManagerModal from './AreaManagerModal'
import { orderAreas, pastPhases, currentPhase, type AreaSignals } from '@/lib/overview'
import { swapStarOrder, reorderAreas } from '@/lib/actions/areas'
import type { AreaWithPhases, Category } from '@/lib/types'

interface Props {
  areas: AreaWithPhases[]
  categories: Category[]
  signals: Record<string, AreaSignals>
}

export default function OverviewClient({ areas, categories, signals }: Props) {
  const router = useRouter()
  const [, start] = useTransition()
  const [manager, setManager] = useState(false)
  const [open, setOpen] = useState<{ area: AreaWithPhases; focus: number | null } | null>(null)

  /**
   * Ticking a milestone used to mean: server round trip, then router.refresh(),
   * then a full re-fetch before the checkbox moved. useOptimistic paints the
   * change on the next frame and lets the network catch up behind it.
   */
  type Optimistic =
    | { type: 'star'; id: string }
    | { type: 'milestone'; id: string; done: boolean }

  const [view, applyOptimistic] = useOptimistic(
    areas,
    (state: AreaWithPhases[], action: Optimistic) => {
      if (action.type === 'star') {
        return state.map(a => a.id === action.id
          ? { ...a, starred_at: a.starred_at ? null : new Date().toISOString() }
          : a)
      }
      return state.map(a => ({
        ...a,
        phases: a.phases.map(ph => ({
          ...ph,
          phase_milestones: ph.phase_milestones.map(m =>
            m.id === action.id ? { ...m, done: action.done } : m),
        })),
      }))
    },
  )

  const ordered = useMemo(() => orderAreas(view), [view])

  /**
   * Reorder only ever moves an area within its own group. Letting an unstarred
   * area jump above a starred one would make the star meaningless.
   */
  function nudge(area: AreaWithPhases, dir: -1 | 1) {
    const group = ordered.filter(a => !!a.starred_at === !!area.starred_at)
    const i = group.findIndex(a => a.id === area.id)
    const j = i + dir
    if (j < 0 || j >= group.length) return

    start(async () => {
      if (area.starred_at) {
        await swapStarOrder(area.id, group[j].id)
      } else {
        const ids = group.map(a => a.id)
        ;[ids[i], ids[j]] = [ids[j], ids[i]]
        await reorderAreas(ids)
      }
      router.refresh()
    })
  }

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const starredCount = ordered.filter(a => a.starred_at).length

  return (
    <div className="overview-page" style={{ minHeight: 'calc(100vh - 63px)' }}>
      {/* Header — same three-part structure as the Today page */}
      <div className="overview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <p style={{
            fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--fg-muted)', margin: '0 0 8px',
          }}>
            {dateLabel}
          </p>

          <h1
            className="hero-display"
            style={{
              fontFamily: 'Bodoni Moda, serif', fontSize: 48, fontWeight: 500,
              lineHeight: 1.1, color: 'var(--fg)', margin: '0 0 12px',
            }}
          >
            Overview
          </h1>

          {ordered.length > 0 && (
            <p style={{
              fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 300,
              letterSpacing: '0.04em', color: 'var(--fg-muted)', margin: '0 0 36px',
            }}>
              {ordered.length} area{ordered.length > 1 ? 's' : ''}
              {starredCount > 0 && (
                <>
                  <span style={{ opacity: 0.4 }}> · </span>
                  <span style={{ color: '#F1C76D' }}>{starredCount} starred</span>
                </>
              )}
            </p>
          )}
        </div>

        <button
          onClick={() => setManager(true)}
          style={{
            background: 'none', border: '1px solid var(--border-hairline)', borderRadius: 4,
            padding: '5px 12px', cursor: 'pointer', fontFamily: 'Jost, sans-serif',
            fontSize: 9, fontWeight: 500, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--fg-muted)',
          }}
        >
          Areas
        </button>
      </div>

      {ordered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: 240, gap: 12, margin: '0 32px',
          background: 'var(--column-bg)', border: '1px dashed var(--border-hairline)', borderRadius: 6,
        }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: 'var(--fg-muted)', fontStyle: 'italic', margin: 0 }}>
            No areas yet. Start with the parts of your life that never finish.
          </p>
          <button
            onClick={() => setManager(true)}
            style={{
              background: '#614E3A', color: '#F5F3F0', border: 'none', borderRadius: 4,
              padding: '10px 16px', fontFamily: 'Jost, sans-serif', fontSize: 11,
              fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Create your first area
          </button>
        </div>
      ) : (
        ordered.map(a => {
          const group = ordered.filter(x => !!x.starred_at === !!a.starred_at)
          const gi = group.findIndex(x => x.id === a.id)
          return (
            <AreaBand
              key={a.id}
              area={a}
              onOptimistic={applyOptimistic}
              signals={signals[a.id]}
              canUp={gi > 0}
              canDown={gi < group.length - 1}
              onNudge={dir => nudge(a, dir)}
              onOpenCarousel={focus => { if (!open && !manager) setOpen({ area: a, focus }) }}
            />
          )
        })
      )}

      {open && (
        <PhaseCarousel
          area={open.area}
          ordered={[...pastPhases(open.area.phases), ...(currentPhase(open.area.phases) ? [currentPhase(open.area.phases)!] : [])]}
          focusIndex={open.focus}
          onClose={() => setOpen(null)}
        />
      )}

      {manager && (
        <AreaManagerModal
          areas={areas}
          categories={categories}
          onClose={() => setManager(false)}
        />
      )}
    </div>
  )
}
