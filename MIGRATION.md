# Migration 003 — the area layer and the Overview page

Everything here is additive. **No existing row is modified and `tasks` is never
touched**, so your Log returns identical results before and after.

---

## 0. Before anything — the leaked credentials

`Versel/recovery-codes.txt` is committed to a public repo.

1. Vercel → Account Settings → regenerate your recovery codes
2. `git rm -r --cached Versel && echo "Versel/" >> .gitignore`
3. Commit

Deleting the file does not remove it from git history. Regenerating is the step
that actually closes the hole.

---

## 1. Copy the files in

Unzip over your repo root. Paths already match.

**New files**

```
supabase/migrations/003_areas_and_phases.sql
src/lib/areaColors.ts
src/lib/overview.ts
src/lib/actions/areas.ts
src/lib/actions/phases.ts
src/app/(app)/overview/page.tsx
src/components/overview/Sheet.tsx
src/components/overview/OverviewClient.tsx
src/components/overview/AreaBand.tsx
src/components/overview/PhaseCarousel.tsx
src/components/overview/EditPhaseSheet.tsx
src/components/overview/NextPhaseSheet.tsx
src/components/overview/AreaManagerModal.tsx
```

**Modified files** — small, surgical edits. `git diff` after copying to see
exactly what changed:

| File | Change |
|---|---|
| `src/lib/types.ts` | added `Area`, `Phase`, `PhaseMilestone`, `PhaseWithMilestones`, `AreaWithPhases`; added `area_id` to `Category` |
| `src/app/globals.css` | appended the `.overview-*` grid rules |
| `src/components/TopNav.tsx` | one line — the Overview tab |
| `src/app/(app)/board/page.tsx` | fetches `areas` alongside categories |
| `src/components/board/BoardClient.tsx` | passes `areas` through |
| `src/components/board/GeneralView.tsx` | sorts categories by area order, unassigned last |
| `src/components/board/CategoryColumn.tsx` | area label above the project name, replacing the subtitle |

`PriorityCard`, `TasksToday`, `TaskRow`, `urgency.ts`, and both category modals
are untouched.

---

## 2. Run the SQL

Supabase dashboard → SQL Editor → New query → paste the whole of
`supabase/migrations/003_areas_and_phases.sql` → Run.

It is guarded with `if not exists` throughout and safe to re-run.

Verify in Table Editor: `areas`, `phases`, `phase_milestones` exist, and
`categories` has a new nullable `area_id` column that is `NULL` on every row.
That NULL is correct — nothing is assigned yet.

---

## 3. Preview locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/board`. Every column now reads **UNASSIGNED** above
its name. That is the expected intermediate state.

Then `http://localhost:3000/overview`:

1. Click **AREAS** (top right)
2. Type an area name, press Enter. Repeat for Finance, Career, Freelance, Health, Personal
3. Pick a colour dot for each
4. Under each area, click the category chips that belong to it
5. Close. Each band now offers *"No phase yet — name the one you're in"*
6. Name a phase, then **EDIT PHASE** to add three or four milestones

Go back to `/board`. The area names are now on the columns in their colours, and
the columns have regrouped.

Nothing above touched a single task row. If you hate it, drop the three new
tables and the one column and you are exactly where you started.

---

## 4. Ship it

```bash
git checkout -b area-layer
git add -A
git commit -m "Add area layer above categories, plus the Overview page"
git push -u origin area-layer
```

Vercel builds a preview deployment from the branch. **Run the SQL against
production Supabase before the preview loads** — if you use one Supabase project
for both, step 2 already did it. Verified locally with `npm run build`: compiles
clean, `/overview` registers as a dynamic route.

Merge to `main` when the preview looks right.

---

## What the code decides, and where to argue with it

**`categories` keeps its name.** Renaming it to `projects` would touch every
query for no functional gain. "Project" stays a UI word.

**One open phase per area, enforced by the database.** A partial unique index on
`phases(area_id) where ended_at is null`. `NEXT PHASE` closes and opens in one
action, so the invariant never breaks.

**Milestones are not tasks.** `phase_milestones` is its own table. Wiring them to
real tasks would drag project churn into a page meant to move slowly. If you
later want a milestone to auto-tick when a project completes, add a nullable
`category_id` to `phase_milestones` — the shape allows it.

**Signals are computed, never stored.** `computeSignals` in `src/lib/overview.ts`
derives last-activity and share-of-month from two columns of `tasks` at read
time, matching the philosophy in Section 4 of your build spec. The query pulls
only `category_id, completed_at` for the last 365 days.

**Area colours extend the palette.** `src/lib/areaColors.ts` holds seven
low-chroma earth tones, deliberately outside the urgency ramp, and area colour
only ever lands on an eyebrow label or a card border — never a task row. To stay
strictly on-palette instead, replace that list with five steps between
`--color-stone` and `--color-deep-brown`; areas get harder to distinguish, but no
new hues enter the system.

**`categories.subtitle` is now orphaned.** The board no longer renders it. Left
in place rather than dropped, so no data disappears. Delete the column when
you're sure, or repurpose it.

---

## Rollback

```sql
drop table if exists phase_milestones;
drop table if exists phases;
alter table categories drop column if exists area_id;
drop table if exists areas;
```

Then `git revert` the commit. Tasks, categories, cadence rules, and the Log are
untouched by all of it.
