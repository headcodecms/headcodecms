-- The project's preview token: /preview/<token>/... on the site shows the
-- draft to everyone with the link. Created on first use, rotated by hand.
alter table projects add column preview_token text unique;
