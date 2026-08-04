-- BonPlanner — migration 003
-- Adds the area layer above categories, plus phases and their milestones.
--
-- SAFETY NOTE: this migration is purely additive. No existing row is modified,
-- no column is dropped, and `tasks` is not touched at all. Every historical
-- task keeps its category_id, so the Log view returns identical results before
-- and after. Categories start with area_id = NULL and surface as "Unassigned"
-- until you assign them from the Overview page.

-- ─── areas ────────────────────────────────────────────────────────────────────
create table if not exists areas (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#614E3A',
  sort_order  int  not null default 0,
  starred_at  timestamptz,          -- null = not starred; newest star sorts first
  created_at  timestamptz not null default now()
);

alter table areas enable row level security;

do $$ begin
  create policy "areas: own rows" on areas
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ─── categories.area_id ───────────────────────────────────────────────────────
alter table categories
  add column if not exists area_id uuid references areas(id) on delete set null;

-- ─── phases ───────────────────────────────────────────────────────────────────
create table if not exists phases (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  area_id     uuid not null references areas(id) on delete cascade,
  title       text not null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,          -- null = the current phase
  created_at  timestamptz not null default now()
);

alter table phases enable row level security;

do $$ begin
  create policy "phases: own rows" on phases
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- an area can only ever have one open phase
create unique index if not exists idx_phases_one_open
  on phases(area_id) where ended_at is null;

-- ─── phase_milestones ─────────────────────────────────────────────────────────
create table if not exists phase_milestones (
  id          uuid primary key default uuid_generate_v4(),
  phase_id    uuid not null references phases(id) on delete cascade,
  label       text not null,
  done        bool not null default false,
  sort_order  int  not null default 0
);

alter table phase_milestones enable row level security;

-- inherit ownership through the phase, same pattern as checklist_items
do $$ begin
  create policy "phase_milestones: own rows" on phase_milestones
    using (
      exists (select 1 from phases
              where phases.id = phase_milestones.phase_id
                and phases.user_id = auth.uid())
    )
    with check (
      exists (select 1 from phases
              where phases.id = phase_milestones.phase_id
                and phases.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_areas_user            on areas(user_id);
create index if not exists idx_categories_area       on categories(area_id) where area_id is not null;
create index if not exists idx_phases_area           on phases(area_id);
create index if not exists idx_phase_milestones      on phase_milestones(phase_id);
create index if not exists idx_tasks_completed       on tasks(user_id, completed_at) where completed_at is not null;
