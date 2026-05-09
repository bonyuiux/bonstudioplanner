import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TodayClient from './TodayClient'
import type { Category, TaskWithRelations } from '@/lib/types'

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tasks }, { data: categories }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, category:categories(*), checklist_items(*)')
      .in('status', ['todo', 'in_progress'])
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ])

  return (
    <TodayClient
      tasks={(tasks as TaskWithRelations[]) ?? []}
      categories={(categories as Category[]) ?? []}
    />
  )
}
