-- Additive access control. Existing profile, progress and Studio tables are unchanged.
create table public.restricted_sections (
  id text primary key check (id ~ '^[a-z][a-z0-9_-]{0,49}$'),
  label text not null
);
insert into public.restricted_sections(id,label) values
  ('teacher','Teacher'), ('studio','Studio'), ('admin','Administration');

create table public.account_access (
  profile_id uuid primary key references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','teacher','admin')),
  section_grants jsonb not null default '{}'::jsonb check (jsonb_typeof(section_grants) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.user_profiles(id) on delete set null
);
create table public.access_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.user_profiles(id) on delete set null,
  target_id uuid references public.user_profiles(id) on delete set null,
  previous_access jsonb,
  new_access jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.restricted_sections enable row level security;
alter table public.account_access enable row level security;
alter table public.access_audit enable row level security;
revoke all on public.restricted_sections, public.account_access, public.access_audit from anon, authenticated;
grant select on public.account_access to authenticated;
create policy "Read own access" on public.account_access for select to authenticated
  using ((select auth.uid()) = auth_user_id);
grant all on public.restricted_sections, public.account_access, public.access_audit to service_role;
grant usage, select on sequence public.access_audit_id_seq to service_role;
create policy "Server manages sections" on public.restricted_sections to service_role using (true) with check (true);
create policy "Server manages access" on public.account_access to service_role using (true) with check (true);
create policy "Server manages audit" on public.access_audit to service_role using (true) with check (true);

-- Bootstrap only the inspected, confirmed existing Studio owner. No email/user-metadata allowlist.
insert into public.account_access(profile_id,auth_user_id,role,section_grants)
select p.id,p.auth_user_id,'admin',jsonb_build_object('studio',now(),'teacher',now())
from public.user_profiles p join auth.users u on u.id=p.auth_user_id
where p.id='78ed66eb-eb1d-46d5-8099-ed0d237bfe3f'
  and p.auth_user_id='d203664e-b673-4ee4-9a62-615c606d3126'
  and p.is_studio_admin=true and p.studio_role='owner' and u.email_confirmed_at is not null;

-- SECURITY INVOKER: callable only by the trusted server, never by browser roles.
-- The server derives actor_id from its signed Supabase-backed session, never the request body.
create function public.save_account_access(actor_id uuid,target_id uuid,next_role text,next_sections text[])
returns void language plpgsql security invoker set search_path = '' as $$
declare
  old_row public.account_access;
  target_auth uuid;
  grants jsonb := '{}'::jsonb;
  section_name text;
begin
  perform pg_advisory_xact_lock(882031974);
  if not exists (
    select 1 from public.account_access a join public.user_profiles p on p.id=a.profile_id
    join auth.users u on u.id=a.auth_user_id
    where a.profile_id=actor_id and a.role='admin' and p.auth_user_id=a.auth_user_id
      and (u.banned_until is null or u.banned_until <= now())
  ) then raise exception 'Administrator required'; end if;
  if actor_id=target_id then raise exception 'Self changes are prohibited'; end if;
  if next_role is null or next_role not in ('user','teacher','admin') or next_sections is null
    then raise exception 'Invalid role or sections'; end if;
  select p.auth_user_id into target_auth from public.user_profiles p join auth.users u on u.id=p.auth_user_id where p.id=target_id;
  if target_auth is null then raise exception 'Registered user required'; end if;
  select * into old_row from public.account_access where profile_id=target_id for update;
  if old_row.role='admin' and next_role<>'admin' and
    (select count(*) from public.account_access where role='admin') <= 1
    then raise exception 'Cannot remove last administrator'; end if;
  foreach section_name in array next_sections loop
    if section_name is null or section_name='admin' or not exists (select 1 from public.restricted_sections where id=section_name)
      then raise exception 'Invalid section'; end if;
    grants := grants || jsonb_build_object(section_name,coalesce(old_row.section_grants->section_name,to_jsonb(now())));
  end loop;
  if next_role='teacher' then grants := grants || jsonb_build_object('teacher',coalesce(old_row.section_grants->'teacher',to_jsonb(now()))); end if;
  insert into public.account_access(profile_id,auth_user_id,role,section_grants,updated_by)
  values(target_id,target_auth,next_role,grants,actor_id)
  on conflict(profile_id) do update set auth_user_id=excluded.auth_user_id,role=excluded.role,
    section_grants=excluded.section_grants,updated_at=now(),updated_by=actor_id;
  insert into public.access_audit(actor_id,target_id,previous_access,new_access)
  values(actor_id,target_id,to_jsonb(old_row),jsonb_build_object('role',next_role,'section_grants',grants));
end;
$$;
revoke all on function public.save_account_access(uuid,uuid,text,text[]) from public,anon,authenticated;
grant execute on function public.save_account_access(uuid,uuid,text,text[]) to service_role;
