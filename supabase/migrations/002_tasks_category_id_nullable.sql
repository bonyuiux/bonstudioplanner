-- Allow tasks.category_id to be NULL so that ON DELETE SET NULL on the FK
-- can actually fire when a category is deleted. The original NOT NULL +
-- ON DELETE SET NULL combination was contradictory and caused category
-- deletes to silently fail whenever the category still had tasks.
alter table tasks alter column category_id drop not null;
