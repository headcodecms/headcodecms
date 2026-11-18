-- Every section gets a stable id (new sections get one on save).
update entries set sections = (
  select coalesce(jsonb_agg(
    case when s ? 'id' then s else jsonb_build_object('id', gen_random_uuid()::text) || s end
    order by position), '[]')
  from jsonb_array_elements(sections) with ordinality as t (s, position)
);
