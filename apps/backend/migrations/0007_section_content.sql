-- The sections of an entry without their ids, to compare draft and live by
-- content (ids may differ, e.g. after a rollback to an older snapshot).
create function section_content(sections jsonb) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_agg(s - 'id' order by position), '[]')
  from jsonb_array_elements(sections) with ordinality as t (s, position)
$$;
