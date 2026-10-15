-- Independent tenant roles; a district administrator is never a platform admin.
create table public.school_districts (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 120), created_at timestamptz not null default now()
);
create table public.schools (
 id uuid primary key default gen_random_uuid(), district_id uuid references public.school_districts(id),
 name text not null check(length(trim(name)) between 1 and 120), created_at timestamptz not null default now()
);
create index schools_district_idx on public.schools(district_id);
create table public.district_administrators (
 district_id uuid not null references public.school_districts(id), profile_id uuid not null references public.user_profiles(id),
 active boolean not null default true, primary key(district_id,profile_id)
);
create index district_administrator_profile_idx on public.district_administrators(profile_id,district_id) where active;
create table public.school_staff (
 school_id uuid not null references public.schools(id), profile_id uuid not null references public.user_profiles(id),
 role text not null check(role in ('teacher','school_admin')), active boolean not null default true,
 primary key(school_id,profile_id)
);
create index school_staff_profile_idx on public.school_staff(profile_id,school_id) where active;
create table public.school_access_audit (
 id bigint generated always as identity primary key, actor_id uuid not null references public.user_profiles(id),
 action text not null, school_id uuid references public.schools(id), district_id uuid references public.school_districts(id),
 target_profile_id uuid references public.user_profiles(id), created_at timestamptz not null default now()
);
alter table public.classroom_classes add column school_id uuid references public.schools(id);
create index classroom_school_idx on public.classroom_classes(school_id,teacher_id) where not archived;
-- Default deny for browser roles, even when project default grants are enabled.
alter table public.school_districts enable row level security;
alter table public.schools enable row level security;
alter table public.district_administrators enable row level security;
alter table public.school_staff enable row level security;
alter table public.school_access_audit enable row level security;
revoke all on public.school_districts,public.schools,public.district_administrators,public.school_staff,public.school_access_audit from public,anon,authenticated;
grant all on public.school_districts,public.schools,public.district_administrators,public.school_staff,public.school_access_audit to service_role;
grant usage,select on sequence public.school_access_audit_id_seq to service_role;

-- These helpers are SECURITY INVOKER and service-role-only. The server supplies
-- the actor from a freshly verified session, not from a client-controlled ID.
create function public.school_platform_admin(actor uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.account_access a where a.profile_id=actor and a.role='admin');
$$;
create function public.manages_district(actor uuid, district uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select public.school_platform_admin(actor) or exists(select 1 from public.district_administrators a where a.district_id=district and a.profile_id=actor and a.active);
$$;
create function public.manages_school(actor uuid, school uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select public.school_platform_admin(actor) or exists(select 1 from public.schools s where s.id=school and
 (exists(select 1 from public.district_administrators a where a.district_id=s.district_id and a.profile_id=actor and a.active)
 or exists(select 1 from public.school_staff t where t.school_id=s.id and t.profile_id=actor and t.active and t.role='school_admin')));
$$;
create function public.teaching_schools(actor uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name) order by s.name,s.id),'[]'::jsonb)
 from public.schools s where public.school_platform_admin(actor) or exists(select 1 from public.school_staff t where t.school_id=s.id and t.profile_id=actor and t.active);
$$;
create function public.school_capabilities(actor uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('schoolAdmin',public.school_platform_admin(actor)
 or exists(select 1 from public.district_administrators a where a.profile_id=actor and a.active)
 or exists(select 1 from public.school_staff t where t.profile_id=actor and t.active and t.role='school_admin'),
 'schoolTeacher',exists(select 1 from public.school_staff t where t.profile_id=actor and t.active));
$$;
create function public.school_dashboard(actor uuid, requested_school uuid default null) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare platform boolean:=public.school_platform_admin(actor); school_ids uuid[]; selected uuid; school_rows jsonb; district_rows jsonb; staff_rows jsonb; class_rows jsonb; district_staff jsonb;
begin
 if actor is null or not ((public.school_capabilities(actor)->>'schoolAdmin')::boolean) then
  raise exception 'School access denied' using errcode='42501'; end if;
 select array_agg(s.id order by s.name,s.id),coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'district_id',s.district_id) order by s.name,s.id),'[]'::jsonb)
 into school_ids,school_rows from public.schools s where public.manages_school(actor,s.id);
 if requested_school is not null and not public.manages_school(actor,requested_school) then raise exception 'School access denied' using errcode='42501'; end if;
 selected:=coalesce(requested_school,school_ids[1]);
 select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'name',d.name,'canManage',public.manages_district(actor,d.id)) order by d.name,d.id),'[]'::jsonb)
 into district_rows from public.school_districts d where public.manages_district(actor,d.id) or exists(select 1 from public.schools s where s.district_id=d.id and s.id=any(school_ids));
 -- Names of staff in the selected school only. Never expose an account directory.
 select coalesce(jsonb_agg(jsonb_build_object('profile_id',t.profile_id,'name',p.username,'role',t.role,'active',t.active) order by p.username,t.profile_id),'[]'::jsonb)
 into staff_rows from public.school_staff t join public.user_profiles p on p.id=t.profile_id where t.school_id=selected;
 select coalesce(jsonb_agg(jsonb_build_object('district_id',a.district_id,'profile_id',a.profile_id,'name',p.username,'active',a.active) order by p.username,a.profile_id),'[]'::jsonb)
 into district_staff from public.district_administrators a join public.user_profiles p on p.id=a.profile_id where public.manages_district(actor,a.district_id);
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'teacher',p.username,'school_id',c.school_id,
 'assignments',(select count(*) from public.classroom_assignments a where a.class_id=c.id),
 'learners',(select count(*) from public.classroom_members m where m.class_id=c.id and m.active),
 'completed',(select count(*) from public.classroom_submissions r join public.classroom_assignments a on a.id=r.assignment_id join public.classroom_members m on m.class_id=c.id and m.profile_id=r.learner_id and m.active where a.class_id=c.id and r.completed_at is not null)) order by c.created_at,c.id),'[]'::jsonb)
 into class_rows from public.classroom_classes c join public.user_profiles p on p.id=c.teacher_id where not c.archived and c.school_id=selected;
 return jsonb_build_object('platformAdmin',platform,'districts',district_rows,'districtAdmins',district_staff,'schools',school_rows,'selected',selected,'staff',staff_rows,'classes',class_rows);
end $$;

create function public.manage_school(actor uuid, payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare action text:=payload->>'action'; school uuid:=(payload->>'schoolId')::uuid; district uuid:=(payload->>'districtId')::uuid;
 target uuid; created uuid; target_class public.classroom_classes; new_role text:=payload->>'role'; is_active boolean:=coalesce((payload->>'active')::boolean,true); label text:=trim(payload->>'name');
begin
 if actor is null then raise exception 'School access denied' using errcode='42501'; end if;
 if action='create_district' then
  if not public.school_platform_admin(actor) then raise exception 'Platform access required' using errcode='42501'; end if;
  if label is null or length(label) not between 1 and 120 then raise exception 'Enter a name up to 120 characters.' using errcode='22023'; end if;
  insert into public.school_districts(name) values(label) returning id into district;
 elsif action='create_school' then
  if not public.school_platform_admin(actor) and not public.manages_district(actor,district) then raise exception 'District access denied' using errcode='42501'; end if;
  if label is null or length(label) not between 1 and 120 then raise exception 'Enter a name up to 120 characters.' using errcode='22023'; end if;
  insert into public.schools(name,district_id) values(label,district) returning id into school;
 elsif action in ('school_staff','district_admin') then
  if action='district_admin' and not public.school_platform_admin(actor) then raise exception 'Platform access required' using errcode='42501'; end if;
  if action='school_staff' then
   if school is null or not public.manages_school(actor,school) then raise exception 'School access denied' using errcode='42501'; end if;
   -- A school admin may manage teachers, but only district/platform admins may
   -- appoint, remove, or demote another school administrator.
   select s.district_id into district from public.schools s where s.id=school;
   if new_role not in ('teacher','school_admin') or new_role is null then raise exception 'Choose a school role.' using errcode='22023'; end if;
  elsif not exists(select 1 from public.school_districts d where d.id=district) then raise exception 'Choose a district.' using errcode='22023'; end if;
  if payload->>'profileId' is not null then
   -- IDs are accepted only for an already listed member in this exact scope.
   select p.id into target from public.user_profiles p where p.id=(payload->>'profileId')::uuid and
    ((action='school_staff' and exists(select 1 from public.school_staff t where t.school_id=school and t.profile_id=p.id)) or
     (action='district_admin' and exists(select 1 from public.district_administrators t where t.district_id=district and t.profile_id=p.id)));
  else
   select p.id into target from public.user_profiles p where lower(p.email)=lower(trim(payload->>'email')) and p.auth_user_id is not null;
  end if;
  if target is null then raise exception 'No eligible registered account found. Ask the person to sign up first.' using errcode='22023'; end if;
  if action='school_staff' then
   if not public.manages_district(actor,district) and
    (new_role='school_admin' or exists(select 1 from public.school_staff t where t.school_id=school and t.profile_id=target and t.role='school_admin'))
    then raise exception 'District or platform access required for school administrators' using errcode='42501'; end if;
   insert into public.school_staff(school_id,profile_id,role,active) values(school,target,new_role,is_active)
    on conflict(school_id,profile_id) do update set role=excluded.role,active=excluded.active;
  else
   insert into public.district_administrators(district_id,profile_id,active) values(district,target,is_active)
    on conflict(district_id,profile_id) do update set active=excluded.active;
  end if;
 elsif action='place_class' then
  if school is null or not public.manages_school(actor,school) then raise exception 'School access denied' using errcode='42501'; end if;
  select * into target_class from public.classroom_classes c where c.id=(payload->>'classId')::uuid and not c.archived for update;
  if target_class.id is null then raise exception 'Class unavailable.' using errcode='22023'; end if;
  -- Tenant reassignment affects student data: only the platform owner may place
  -- an existing class. School/district admins cannot pull a class into their scope.
  if not public.school_platform_admin(actor) then raise exception 'Platform access required to place existing classes' using errcode='42501'; end if;
  if not exists(select 1 from public.school_staff t where t.school_id=school and t.profile_id=target_class.teacher_id and t.active)
   then raise exception 'Add the class teacher to the target school first.' using errcode='22023'; end if;
  if target_class.school_id is not null then raise exception 'This class is already assigned to a school. Transfers require a separate review.' using errcode='22023'; end if;
  update public.classroom_classes set school_id=school where id=target_class.id;
 else raise exception 'Unknown school action.' using errcode='22023'; end if;
 insert into public.school_access_audit(actor_id,action,school_id,district_id,target_profile_id) values(actor,action,school,district,target);
 return jsonb_build_object('saved',true,'schoolId',school,'districtId',district);
end $$;

revoke all on function public.school_platform_admin(uuid),public.manages_district(uuid,uuid),public.manages_school(uuid,uuid),public.teaching_schools(uuid),public.school_capabilities(uuid),public.school_dashboard(uuid,uuid),public.manage_school(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.school_platform_admin(uuid),public.manages_district(uuid,uuid),public.manages_school(uuid,uuid),public.teaching_schools(uuid),public.school_capabilities(uuid),public.school_dashboard(uuid,uuid),public.manage_school(uuid,jsonb) to service_role;

-- Reject an insert racing a school-staff revocation. Existing class records and
-- learner submissions remain intact when a staff member is removed.
create function public.guard_classroom_school() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.school_id is not null and not public.school_platform_admin(new.teacher_id) and not exists(
  select 1 from public.school_staff t where t.school_id=new.school_id and t.profile_id=new.teacher_id and t.active
 ) then raise exception 'Active school staff required' using errcode='42501'; end if;
 return new;
end $$;
revoke all on function public.guard_classroom_school() from public,anon,authenticated;
grant execute on function public.guard_classroom_school() to service_role;
create trigger classroom_school_guard before insert or update of school_id,teacher_id on public.classroom_classes for each row execute function public.guard_classroom_school();

-- Operator calibration uses authored fixtures, never student submissions.
create table public.reasoning_calibration_runs (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.user_profiles(id),
 report jsonb not null, created_at timestamptz not null default now()
);
alter table public.reasoning_calibration_runs enable row level security;
revoke all on public.reasoning_calibration_runs from public,anon,authenticated;
grant all on public.reasoning_calibration_runs to service_role;
