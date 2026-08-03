import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OverviewClient from '@/components/overview/OverviewClient'
import { computeSignals, sinceISO, type Completion } from '@/lib/overview'
import type { Area, Category, PhaseWithMilestones, AreaWithPhases } from '@/lib/types'

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = sinceISO(365)

  const [{ data: areas }, { data: categories }, { data: phases }, { data: completions }] =
    await Promise.all([
      supabase.from('areas').select('*').order('sort_order', { ascending: true }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase
        .from('phases')
        .select('*, phase_milestones(*)')
        .order('started_at', { ascending: true }),
      // Only two columns, and only completed rows — this is the whole cost of
      // the Overview's computed signals.
      supabase
        .from('tasks')
        .select('category_id, completed_at')
        .not('completed_at', 'is', null)
        .gte('completed_at', since),
    ])

  const areaList = (areas as Area[]) ?? []
  const categoryList = (categories as Category[]) ?? []
  const phaseList = (phases as PhaseWithMilestones[]) ?? []

  const byArea = new Map<string, PhaseWithMilestones[]>()
  for (const p of phaseList) {
    const list = byArea.get(p.area_id) ?? []
    list.push({ ...p, phase_milestones: [...(p.phase_milestones ?? [])].sort((a, b) => a.sort_order - b.sort_order) })
    byArea.set(p.area_id, list)
  }

  const withPhases: AreaWithPhases[] = areaList.map(a => ({
    ...a,
    phases: byArea.get(a.id) ?? [],
  }))

  const signals = computeSignals(
    areaList,
    categoryList,
    (completions as Completion[]) ?? [],
  )

  return (
    <OverviewClient
      areas={withPhases}
      categories={categoryList}
      signals={signals}
    />
  )
}
