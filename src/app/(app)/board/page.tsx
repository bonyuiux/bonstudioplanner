import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardClient from '@/components/board/BoardClient'
import type { Area, Category, TaskWithRelations } from '@/lib/types'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Done tasks intentionally NOT fetched — completion is session-only on the
  // board. Marking a task done shows strikethrough until refresh; the Log
  // page is the durable history view.
  const [{ data: areas }, { data: categories }, { data: active }] = await Promise.all([
    supabase
      .from('areas')
      .select('*')
      .order('sort_order', { ascending: true }),

    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),

    supabase
      .from('tasks')
      .select('*, category:categories(*), checklist_items(*)')
      .in('status', ['todo', 'in_progress'])
      .order('created_at', { ascending: false }),
  ])

  const tasks: TaskWithRelations[] = (active as TaskWithRelations[]) ?? []

  return (
    <BoardClient
      areas={(areas as Area[]) ?? []}
      categories={(categories as Category[]) ?? []}
      tasks={tasks}
    />
  )
}
