-- Earlier live states. Publish and rollback save live here before they
-- replace it, so every change of live can be rolled back.
create table snapshots (
  id bigint generated always as identity primary key,
  project_id uuid not null references projects (id) on delete cascade,
  reason text not null check (reason in ('publish', 'rollback')),
  -- [{ slug, sections, updated_at, updated_by }]
  entries jsonb not null,
  created_at timestamptz not null default now(),
  created_by text not null
);

create index snapshots_project on snapshots (project_id, id desc);
