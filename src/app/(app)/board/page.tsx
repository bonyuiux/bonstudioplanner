import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardClient from '@/components/board/BoardClient'
import type { Category, TaskWithRelations } from '@/lib/types'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: categories }, { data: active }, { data: recentDone }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),

    supabase
      .from('tasks')
      .select('*, category:categories(*), checklist_items(*)')
      .in('status', ['todo', 'in_progress'])
      .order('created_at', { ascending: false }),

    supabase
      .from('tasks')
      .select('*, category:categories(*), checklist_items(*)')
      .eq('status', 'done')
      .gte('completed_at', sevenDaysAgo)
      .order('completed_at', { ascending: false }),
  ])

  const tasks: TaskWithRelations[] = [
    ...((active as TaskWithRelations[]) ?? []),
    ...((recentDone as TaskWithRelations[]) ?? []),
  ]

  return (
    <BoardClient
      categories={(categories as Category[]) ?? []}
      tasks={tasks}
    />
  )
}
