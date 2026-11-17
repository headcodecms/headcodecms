create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table entries (
  project_id uuid not null references projects (id) on delete cascade,
  version text not null check (version in ('draft', 'live')),
  path text not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (project_id, version, path)
);

-- Spike seed: one default tenant with one project and a home page in both versions.
with tenant as (
  insert into tenants (slug, name) values ('default', 'Default') returning id
), project as (
  insert into projects (tenant_id, slug, name)
  select id, 'demo', 'Demo' from tenant returning id
)
insert into entries (project_id, version, path, data)
select project.id, version, '/', '{"title": "Hello from Headcode"}'
from project, (values ('draft'), ('live')) as versions (version);
