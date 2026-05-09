import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CadenceClient from './CadenceClient'
import type { CadenceRule, Category } from '@/lib/types'

export default async function CadencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rules }, { data: categories }] = await Promise.all([
    supabase
      .from('cadence_rules')
      .select('*')
      .order('created_at', { ascending: true }),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ])

  return (
    <CadenceClient
      rules={(rules as CadenceRule[]) ?? []}
      categories={(categories as Category[]) ?? []}
    />
  )
}
