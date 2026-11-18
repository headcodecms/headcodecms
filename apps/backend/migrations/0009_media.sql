-- Uploaded files of a project. The site stores them (Vercel Blob, or files
-- on disk) and registers them here; an image field holds a copy of
-- src, alt, width, height and blur, so sites render without a lookup.
create table media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  src text not null,
  pathname text not null,
  content_type text not null,
  size bigint not null,
  width integer,
  height integer,
  blur_data_url text,
  alt text not null default '',
  created_at timestamptz not null default now(),
  created_by text not null
);

create index media_project on media (project_id, created_at desc);
