-- BonPlanner — Supabase schema
-- Run this entire file in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Execute once on a fresh database. Safe to re-run if you use the IF NOT EXISTS guards below.

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type task_type_enum   as enum ('deadline', 'cadence', 'flexible');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status_enum as enum ('todo', 'in_progress', 'done', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type frequency_type_enum as enum ('per_week', 'every_n_days', 'weekly_on_day');
exception when duplicate_object then null; end $$;

-- ─── categories ───────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  subtitle    text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories: own rows" on categories
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── cadence_rules ────────────────────────────────────────────────────────────
create table if not exists cadence_rules (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  category_id        uuid not null references categories(id) on delete cascade,
  template_title     text not null,
  frequency_type     frequency_type_enum not null,
  frequency_value    int  not null,
  last_completed_at  timestamptz,
  active             bool not null default true,
  created_at         timestamptz not null default now()
);

alter table cadence_rules enable row level security;

create policy "cadence_rules: own rows" on cadence_rules
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── tasks ────────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  category_id          uuid not null references categories(id) on delete set null,
  title                text not null,
  description          text,
  task_type            task_type_enum   not null,
  scheduled_at         timestamptz,
  due_at               timestamptz,
  duration_minutes     int,
  status               task_status_enum not null default 'todo',
  manual_priority_pin  bool not null default false,
  cadence_rule_id      uuid references cadence_rules(id) on delete set null,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- a task cannot have both scheduled_at and due_at
  constraint one_date_max check (
    not (scheduled_at is not null and due_at is not null)
  )
);

alter table tasks enable row level security;

create policy "tasks: own rows" on tasks
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute procedure update_updated_at();

-- ─── checklist_items ──────────────────────────────────────────────────────────
create table if not exists checklist_items (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  label       text not null,
  done        bool not null default false,
  sort_order  int  not null default 0
);

alter table checklist_items enable row level security;

-- checklist RLS: inherit task ownership via join
create policy "checklist_items: own rows" on checklist_items
  using (
    exists (
      select 1 from tasks
      where tasks.id = checklist_items.task_id
        and tasks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from tasks
      where tasks.id = checklist_items.task_id
        and tasks.user_id = auth.uid()
    )
  );

-- ─── user_preferences (optional, for future use) ─────────────────────────────
-- theme is stored in localStorage for v1; this table is a placeholder for v2.
create table if not exists user_preferences (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  theme      text not null default 'dark',
  updated_at timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "user_preferences: own row" on user_preferences
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_tasks_user_status        on tasks(user_id, status);
create index if not exists idx_tasks_user_category      on tasks(user_id, category_id);
create index if not exists idx_tasks_cadence_rule       on tasks(cadence_rule_id) where cadence_rule_id is not null;
create index if not exists idx_cadence_rules_user       on cadence_rules(user_id) where active = true;
create index if not exists idx_checklist_task           on checklist_items(task_id);
