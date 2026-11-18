-- Where the project's site is told about a new live state (publish and
-- rollback), and the secret that signs those requests.
alter table projects add column revalidate_url text, add column revalidate_secret text;
