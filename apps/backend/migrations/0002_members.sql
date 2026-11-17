-- Members of a project. A row starts as an invitation by email (iss and sub
-- empty) and is bound to the token's (iss, sub) on the user's first request
-- with a verified email address.
create table members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'admin')),
  iss text,
  sub text,
  created_at timestamptz not null default now(),
  unique (project_id, iss, sub)
);

create unique index members_email on members (project_id, lower(email));

create table audit_log (
  id bigint generated always as identity primary key,
  project_id uuid not null references projects (id) on delete cascade,
  actor text not null,
  action text not null,
  detail jsonb not null default '{}',
  at timestamptz not null default now()
);
