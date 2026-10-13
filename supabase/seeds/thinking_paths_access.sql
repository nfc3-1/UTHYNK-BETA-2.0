-- Additive registry entry. Existing grants and roles are untouched.
-- Admins already have all sections; other accounts need an in-app grant.
insert into public.restricted_sections (id, label)
values ('thinking_paths', 'Thinking Paths (beta)')
on conflict (id) do update set label = excluded.label;
