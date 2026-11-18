-- The content schema of a project, pushed by the site with schema_push.
alter table projects add column schema jsonb;

-- Entries are globals by slug ("home") or collection items ("blog/hello"),
-- each an ordered list of sections. The spike entries (by path) are dropped.
drop table entries;

create table entries (
  project_id uuid not null references projects (id) on delete cascade,
  version text not null check (version in ('draft', 'live')),
  slug text not null,
  sections jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (project_id, version, slug)
);
