-- Add sort_order to tasks table for manual drag-to-reorder within category columns
alter table tasks add column if not exists sort_order int not null default 0;
