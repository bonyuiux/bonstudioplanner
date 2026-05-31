# BonPlanner — Build Specification

> A personal task planner for a freelance photographer & designer.
> Single user. Desktop-first. Dark mode default. Bon Studio design language.
>
> **This document is the single source of truth.** Reference it for any design choice, data model question, or feature implementation. Do not deviate from the design tokens, layout, or logic without explicit user approval.

---

## 1. Product summary

BonPlanner is a personal planning tool that solves multi-context juggling for a freelancer who runs three parallel work streams (a photography studio, freelance UI/UX design projects, and side video/print work for friends' organizations).

The user's pain point: pure to-do lists don't distinguish urgency tiers visually, calendar apps don't handle cadence-based work (e.g. "post 3× a week"), and manual priority-sorting requires constant maintenance.

BonPlanner solves this with **computed urgency tiers** (red/orange/yellow/walnut/grey) that update automatically based on time-to-deadline, plus three lenses on the same data: a **Board** (default landing, category-grouped columns), a **Today** view (flat priority list), and a **Log** (completed work archive).

---

## 2. Tech stack — locked

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS with custom Bon Studio design tokens
- **UI components**: shadcn/ui, customized to Bon Studio language
- **Auth + DB**: Supabase (free tier — Postgres + Auth + Row-Level Security)
- **Hosting**: Vercel (free tier, auto-deploy from GitHub)
- **Background jobs**: Supabase scheduled functions (for cadence task spawning)
- **Cost**: $0/year (free domain: `bonplanner.vercel.app`)

Stack is **final.** Do not substitute without explicit user approval.

---

## 3. Data model

All tables scoped by `user_id` (UUID, FK to `auth.users`) for multi-tenant readiness (single user now, multi-user possible later).

### `categories`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | references `auth.users` |
| name | text | e.g. "BonStudioHK" |
| subtitle | text nullable | e.g. "Photography" — shown under name in General view |
| sort_order | int | for column ordering on board |
| created_at | timestamptz | |

### `tasks`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| category_id | uuid fk | single category only |
| title | text | e.g. "Client shoot — Mary & John" |
| description | text nullable | longer notes |
| task_type | enum | `'deadline'` \| `'cadence'` \| `'flexible'` |
| scheduled_at | timestamptz nullable | for tasks AT a specific time |
| due_at | timestamptz nullable | for tasks DUE BY a date |
| duration_minutes | int nullable | optional estimate |
| status | enum | `'todo'` \| `'in_progress'` \| `'done'` \| `'archived'` |
| manual_priority_pin | bool default false | user override to force into Tasks today |
| sort_order | int not null default 0 | for drag-and-drop reordering |
| cadence_rule_id | uuid fk nullable | set when spawned by cadence rule |
| completed_at | timestamptz nullable | set when status → done |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `cadence_rules`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| category_id | uuid fk | |
| template_title | text | e.g. "Instagram post" |
| frequency_type | enum | `'per_week'` \| `'every_n_days'` \| `'weekly_on_day'` |
| frequency_value | int | per_week: count; every_n_days: N; weekly_on_day: 0–6 |
| last_completed_at | timestamptz nullable | updated when spawned task is completed |
| active | bool default true | |
| created_at | timestamptz | |

### `checklist_items`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| task_id | uuid fk | cascade delete |
| label | text | |
| done | bool default false | |
| sort_order | int | |

**Row-Level Security**: Enable RLS on all tables. Policy: `user_id = auth.uid()` for select/insert/update/delete.

---

## 4. Urgency computation logic

Urgency is **computed at read time** (not stored). Pure function: `computeUrgency(task, now): UrgencyTier`.

### Tiers and rules (first match wins)

| tier | color hex | conditions |
|---|---|---|
| `urgent` | `#BC3B3B` | `manual_priority_pin = true`, OR `scheduled_at` is today, OR `due_at` within 24hr, OR cadence task past limit |
| `soon` | `#DB7442` | `due_at` within 3 days (not urgent), OR cadence within 24hr of limit |
| `cadence` | `#F1C76D` | active cadence task on schedule (cadence type only) |
| `scheduled` | `#614E3A` | has date further than 3 days out |
| `flexible` | `rgba(154,148,144,0.3)` | no date (flexible type) |

### Cadence past limit
For each cadence rule, compute next-expected-completion from `last_completed_at` + frequency window:
- `per_week: 3` → window = 7/3 ≈ 2.33 days; if `now > last_completed_at + 2.33 days` → **urgent**
- `every_n_days: 5` → if `now > last_completed_at + 5 days` → **urgent**
- `weekly_on_day: 4` → if Thursday passed without completion → **urgent**

"Approaching" (→ `soon`) = within 24hr of urgent threshold.

### Tasks today filter
Shows tasks where urgency is `urgent` or `soon`, or `manual_priority_pin = true`.

Sorted by: urgent first, then soon; within each tier, by earliest `scheduled_at`/`due_at`.

If 0 tasks: show "Nothing urgent today — good time to tackle flexible work."
If 1–3: fill row evenly (1/3/33%).
If 4+: show 3, right-arrow slider reveals rest in batches of 3.

### General view filter
All `todo` and `in_progress` tasks grouped by category, plus tasks completed in last 7 days (strikethrough, 0.5 opacity). Completed 7+ days ago live only in Log.

---

## 5. Design tokens (Bon Studio — definitive)

**Non-negotiable.** Every component uses these tokens. Derive unknown values from the closest token — do not invent new colors.

### Colors
```ts
// tailwind.config.ts — extend theme.colors
{
  cream: '#F5F3F0',
  ink: '#111111',
  walnut: '#614E3A',
  'deep-brown': '#452900',
  mist: '#9A9490',
  stone: '#C8C5BE',
  yellow: '#F1C76D',   // cadence on-schedule
  orange: '#DB7442',   // soon
  'dark-red': '#BC3B3B', // urgent
  'bg-dark': '#1A1714',
  'bg-light': '#F5EDDF',
}
```

### Borders
- Dark mode: `rgba(245,243,240,0.08)` hairline, `rgba(245,243,240,0.12)` emphasis
- Light mode: `rgba(17,17,17,0.08)` hairline, `rgba(17,17,17,0.12)` emphasis

### Typography (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Italiana&family=Jost:wght@300;400;500&family=Bodoni+Moda:wght@400;500;700&display=swap" rel="stylesheet" />
```

| use | font | size | weight | letter-spacing |
|---|---|---|---|---|
| Display hero | Bodoni Moda | 38–56px | 500 (italic for emphasis) | -0.01em |
| Logo / category names | Italiana | 16–22px | regular | 0.02em |
| Section labels (UPPERCASE) | Jost | 9px | 500 | 0.22em |
| Field labels (UPPERCASE) | Jost | 8px | 500 | 0.22em |
| Body text | Jost | 13px | 300 | normal |
| Task titles | Jost | 13px | 400 | normal |
| Card meta | Jost | 10–11px | 300–400 | 0.04em |
| Buttons (UPPERCASE) | Jost | 11px | 500 | 0.18em |

**Casing rule**: Section labels, field labels, buttons = UPPERCASE. Everything else = sentence case.

### Spacing & radii
- Page padding: 32px horizontal
- Card padding: 14–18px (compact), 22–28px (panels)
- Card gap: 10–12px
- Border radius: 4px (most), 6px (cards), 12px (panels), 50px (pills/circles)

### Component patterns

**Card (default):**
```
background: rgba(245,243,240,0.04)
border: 1px solid rgba(245,243,240,0.12)
border-radius: 6px
```

**Category column (General view):**
```
background: rgba(245,243,240,0.025)
border: 1px solid rgba(245,243,240,0.06)
border-radius: 6px
padding: 12px
```

**Button (primary — walnut):**
```
background: #614E3A
color: #F5F3F0
border-radius: 4px
padding: 13–14px
font: Jost 11px / 500 / 0.18em uppercase
```

**Floating "+ New task":**
```
position: fixed bottom: 24px right: 24px
width/height: 52px
border-radius: 50%
background: #614E3A
content: '+' (26px, weight 300)
box-shadow: 0 4px 16px rgba(0,0,0,0.4)
```

**Theme toggle:**
- 48×24px pill, track #2A2520, hairline border
- Cream ball (18×18px) carries active mode icon (filled moon SVG dark, sun SVG light)
- Inactive icon faded on opposite side

---

## 6. Screen specifications (6 screens)

### 6.1 Login
- Centered 380px column
- "BonPlanner" wordmark (Italiana 38px)
- "A Bon Studio Workspace" subtitle (9px UPPERCASE letterspaced)
- "Welcome back." headline (Bodoni Moda italic 22px)
- Email + password fields (standard tokens)
- Walnut "Sign in" button (full-width)
- "Forgot your password?" link below
- Theme toggle floats top-right (24px from edges)
- No sign-up link (single user)
- Supabase email + password auth only

### 6.2 Board (default landing)
**Three vertical zones: ~10% top nav, ~20% Tasks today, ~70% General view**

**Top nav** — 3-column grid, 18px top padding, hairline bottom border:
- Left: "BonPlanner" (Italiana 22px) + date/time (10px UPPERCASE) stacked
- Center: Board / Today / Log tabs (Italiana 16px, boxed, walnut-tinted active)
- Right: theme toggle pill + 32px circular logout icon

**Tasks today** — 3-column layout (160px / 1fr / 24px):
- Left: "Now" label + "Tasks today" hero (Bodoni Moda 44px, italic "today")
- Middle: 1, 2, or 3 priority cards (horizontal); slider arrow right when 4+
  - Top: category name (UPPERCASE 9px mist)
  - Middle: task title (13px cream)
  - Bottom: status dot + label left (e.g. "● URGENT"), countdown right (e.g. "in 5h 48m")
- Card borders: urgent = `rgba(188,59,59,0.5)`, others = `rgba(245,243,240,0.12)`

**General view** — section label + 5-column grid of category blocks:
- Each block: wrapped surface (0.025 opacity bg, hairline border, 6px radius, 12px padding)
- Block header: category name (Italiana 16px) + subtitle (UPPERCASE 9px mist) + hairline divider
- Block body: vertical task rows with 2px left-border in urgency color
- Completed tasks (7 days): opacity 0.5, strikethrough title, neutral grey border

**Floating "+ New task"** — bottom-right, 24px from edges

### 6.3 Task detail panel
- 400px wide, slides in from right (faded board behind at 0.2 opacity)
- 28px padding
- Top row: status dot + label (left) | "Edit" + "×" (right)
- Category line (9px UPPERCASE mist)
- Title (Bodoni Moda 26px)
- Meta grid (When / Duration / Status) — 2 columns, hairline rules
- Description block
- Checklist block with "X of Y" progress, custom checkboxes (14×14px, walnut fill when checked)
- Bottom: walnut "Mark as done" button (full-width)
- Animation: slide in from right (200ms ease-out)

### 6.4 New task — Step 1
- Centered 540px modal
- "New task" label + "What kind of task?" hero (Bodoni Moda italic 26px) + helper
- 3 type cards (Deadline / Cadence / Flexible): calendar/refresh/list icons, Italiana 18px names
- Selected: walnut border; unselected: hairline border
- Click → Step 2 form (fields deferred to build-time iteration)

### 6.5 Today view
- Same top nav (Today tab active)
- Centered max-width 720px content
- Header: section label + "Today's *priorities*" hero (Bodoni Moda, italic "priorities") + count summary
- Tasks grouped by urgency tier with colored-dot section headers
- Each task row: hairline-bordered card, category UPPERCASE + title left, countdown right

### 6.6 Log view
- Same top nav (Log tab active)
- Centered max-width 760px content
- Header: section label + "What you've *shipped*" hero (Bodoni Moda, italic "shipped")
- Two filter pills: Category (All + each), Range (Last 7/30/90 days, This year, All time)
- Tasks grouped by week ("This week", "Last week", etc.)
- Each row: 3-column grid (title + category UPPERCASE / date / relative time), hairline divider
- No urgency colors (all equal weight in archive)

---

## 7. Step 2 forms (deferred to iteration)

User approved deferring exact field choices. Baseline fields:

### Deadline form
- Title (required), category (required), description (optional)
- Radio: ◯ Scheduled at a time ◯ Due by a date (reveals datetime or date picker)
- Estimated duration (dropdown: 30min / 1hr / 2hr / half-day / full-day, optional)
- Checklist (inline add, lightweight)

### Cadence form
- Template title (required), category (required)
- Frequency selector: radio for per-week / every-n-days / weekly-on-day
- Start spawning from (date, default today)

### Flexible form
- Title, category, description (same as deadline)
- Optional rough deadline ("nice to have by" date picker)
- Estimated duration

All: walnut "Create" + ghost "Cancel" buttons. Validation: title + category required, type-specific dates required where applicable.

---

## 8. Cadence task spawning logic

Supabase scheduled function running hourly:

For each `active = true` cadence rule:
1. Compute next-expected-completion from `last_completed_at` + frequency window
2. If task exists in `tasks` with `status IN ('todo', 'in_progress')` for this rule → skip
3. If next-expected is within 24hr of `now()` and no active task exists → **spawn**:
   - Copy `template_title`, `category_id`
   - Set `task_type = 'cadence'`, `cadence_rule_id` = rule id
   - Set `due_at` = rule's deadline
4. When spawned task marked done → update rule's `last_completed_at`

Keeps cadence work visible as real tasks on the board, not invisible reminders.

---

## 9. Current deployment status

**✅ LIVE**
- GitHub: `https://github.com/bonyuiux/bonstudioplanner`
- Vercel: `bonstudioplanner.vercel.app`
- Supabase: project active, schema deployed, RLS enabled
- User data: real tasks + completed records in production Supabase

**All 4 phases complete:**
- Phase 1 ✅ Skeleton (auth, shell, theme toggle)
- Phase 2 ✅ Core CRUD (Board, task creation, urgency logic)
- Phase 3 ✅ Cadence + Today + Log (full feature set)
- Phase 4 ✅ Polish (animations, mobile responsive, empty states)

---

## 10. For future development

### Bug fixes & enhancements
When working on improvements:
- Review spec Section 4 (urgency logic) for priority computation details
- Check Section 5 for exact color/typography tokens before designing changes
- Confirm any data model changes don't break existing user data
- Test all three views (Board / Today / Log) after any change
- Verify theme toggle still works (dark ↔ light)

### Adding features
- Keep design system locked (Section 5)
- New components must follow card/button/field patterns (Section 5)
- Cadence spawning is automated (Section 8) — do not require manual task creation
- Maintain single-category-per-task constraint
- RLS on any new tables scoped by `user_id`

### Breaking changes (require caution)
- Altering urgency computation logic — affects entire board display
- Changing data model (new/removed columns) — requires schema migration
- Modifying auth system — affects all users (none now, but prepare)
- Removing design tokens — breaks consistency

---

## 11. Reference assets

- `bon-studio-compositor-v3_3.html` — authoritative design system; reference for any ambiguity
- This spec — complete source of truth; supersedes ad-hoc decisions

---

## 12. Working agreement

- **Token efficiency**: Narrow decisions in conversation before code is written
- **Design fidelity**: Use exact hex values, font weights, letter-spacings from Section 5
- **Data safety**: Never modify Supabase schema without user approval; user has real data
- **When ambiguous**: Ask clarifying questions rather than speculating
- **Reference first**: Check this spec before assuming behavior

---

*End of spec. Locked as of May 2026.*
