export type TaskType = 'deadline' | 'cadence' | 'flexible'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived'
export type FrequencyType = 'per_week' | 'every_n_days' | 'weekly_on_day'
export type UrgencyTier = 'urgent' | 'soon' | 'cadence' | 'scheduled' | 'flexible'

export interface Area {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  starred_at: string | null
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  subtitle: string | null
  area_id: string | null
  sort_order: number
  created_at: string
}

export interface PhaseMilestone {
  id: string
  phase_id: string
  label: string
  done: boolean
  sort_order: number
}

export interface Phase {
  id: string
  user_id: string
  area_id: string
  title: string
  started_at: string
  ended_at: string | null
  created_at: string
}

export interface PhaseWithMilestones extends Phase {
  phase_milestones: PhaseMilestone[]
}

export interface AreaWithPhases extends Area {
  phases: PhaseWithMilestones[]
}

export interface Task {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  task_type: TaskType
  scheduled_at: string | null
  due_at: string | null
  duration_minutes: number | null
  status: TaskStatus
  manual_priority_pin: boolean
  sort_order: number
  cadence_rule_id: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  task_id: string
  label: string
  done: boolean
  sort_order: number
}

export interface CadenceRule {
  id: string
  user_id: string
  category_id: string
  template_title: string
  frequency_type: FrequencyType
  frequency_value: number
  last_completed_at: string | null
  active: boolean
  created_at: string
}

export interface TaskWithRelations extends Task {
  category: Category | null
  checklist_items: ChecklistItem[]
}
