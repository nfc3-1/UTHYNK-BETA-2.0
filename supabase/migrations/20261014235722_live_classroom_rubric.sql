-- Classroom records are reachable only through verified, scoped server routes.
create table public.classroom_classes (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 100),
 teacher_id uuid not null references public.user_profiles(id),
 join_code text not null unique check(length(join_code) between 8 and 20),
 archived boolean not null default false, created_at timestamptz not null default now()
);
create index classroom_teacher_idx on public.classroom_classes(teacher_id);
create table public.classroom_members (
 class_id uuid not null references public.classroom_classes(id) on delete cascade,
 profile_id uuid not null references public.user_profiles(id),
 display_name text not null check(length(display_name) between 1 and 60),
 active boolean not null default true, joined_at timestamptz not null default now(),
 primary key(class_id,profile_id)
);
create index classroom_member_profile_idx on public.classroom_members(profile_id,class_id);
create table public.classroom_assignments (
 id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classroom_classes(id),
 title text not null check(length(title) between 1 and 160), kind text not null check(kind in ('lesson','reading')),
 target_id text not null, due_date date, created_at timestamptz not null default now()
);
create index classroom_assignment_class_idx on public.classroom_assignments(class_id,created_at);
create table public.classroom_submissions (
 assignment_id uuid not null references public.classroom_assignments(id),
 learner_id uuid not null references public.user_profiles(id), session_id text not null,
 language text not null check(language in ('en','es','fr')), first_answer text not null,
 perspective text not null, secondary_question text not null, second_answer text,
 synthesis text, assessment jsonb, completed_at timestamptz, updated_at timestamptz not null default now(),
 primary key(assignment_id,learner_id)
);
create index classroom_submission_learner_idx on public.classroom_submissions(learner_id,assignment_id);
create table public.classroom_comments (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null,
 learner_id uuid not null, teacher_id uuid not null references public.user_profiles(id),
 body text not null check(length(body) between 1 and 4000), created_at timestamptz not null default now(),
 foreign key(assignment_id,learner_id) references public.classroom_submissions(assignment_id,learner_id)
);
create index classroom_comment_submission_idx on public.classroom_comments(assignment_id,learner_id,created_at);
create table public.reasoning_assessments (
 fingerprint text primary key, profile_id uuid references public.user_profiles(id),
 rubric_version text not null, model text not null, assessment jsonb not null,
 created_at timestamptz not null default now()
);
create index reasoning_assessment_profile_idx on public.reasoning_assessments(profile_id,created_at);
-- No client role has direct access. All ownership/membership checks are server-side,
-- with a second membership check inside the atomic submission function.
alter table public.classroom_classes enable row level security;
alter table public.classroom_members enable row level security;
alter table public.classroom_assignments enable row level security;
alter table public.classroom_submissions enable row level security;
alter table public.classroom_comments enable row level security;
alter table public.reasoning_assessments enable row level security;
revoke all on public.classroom_classes,public.classroom_members,public.classroom_assignments,
 public.classroom_submissions,public.classroom_comments,public.reasoning_assessments from anon,authenticated;
grant all on public.classroom_classes,public.classroom_members,public.classroom_assignments,
 public.classroom_submissions,public.classroom_comments,public.reasoning_assessments to service_role;

create function public.save_classroom_submission(actor uuid, assignment uuid, session_key text, phase text, payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare previous public.classroom_submissions; target_class uuid;
begin
 select a.class_id into target_class from public.classroom_assignments a join public.classroom_classes c on c.id=a.class_id where a.id=assignment and not c.archived;
 if target_class is null or not exists(select 1 from public.classroom_members m where m.class_id=target_class and m.profile_id=actor and m.active)
 then raise exception 'Active class membership required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(assignment::text || actor::text,0));
 select * into previous from public.classroom_submissions where assignment_id=assignment and learner_id=actor for update;
 if previous.session_id is not null and previous.session_id<>session_key then raise exception 'Resume the existing assignment attempt'; end if;
 if previous.completed_at is not null then return jsonb_build_object('already_completed',true); end if;
 if phase='follow_up' then
  if previous.first_answer is not null then return jsonb_build_object('already_saved',true); end if;
  insert into public.classroom_submissions(assignment_id,learner_id,session_id,language,first_answer,perspective,secondary_question,assessment)
   values(assignment,actor,session_key,payload->>'language',payload->>'first_answer',payload->>'perspective',payload->>'secondary_question',payload->'assessment');
 elsif phase='synthesis' then
  if previous.first_answer is null then raise exception 'First answer must be saved before synthesis'; end if;
  update public.classroom_submissions set second_answer=payload->>'second_answer',synthesis=payload->>'synthesis',
   assessment=payload->'assessment',language=payload->>'language',completed_at=now(),updated_at=now()
   where assignment_id=assignment and learner_id=actor;
 else raise exception 'Invalid submission phase'; end if;
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.save_classroom_submission(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_classroom_submission(uuid,uuid,text,text,jsonb) to service_role;

create function public.join_classroom(actor uuid,code text,display_name text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare target uuid; joined uuid;
begin
 select id into target from public.classroom_classes where join_code=code and not archived;
 if target is null then raise exception 'Class code not found'; end if;
 insert into public.classroom_members(class_id,profile_id,display_name) values(target,actor,display_name)
 on conflict(class_id,profile_id) do update set display_name=excluded.display_name
 where public.classroom_members.active returning class_id into joined;
 if joined is null then raise exception 'Class access was removed; contact your teacher'; end if;
 return joined;
end $$;
revoke all on function public.join_classroom(uuid,text,text) from public,anon,authenticated;
grant execute on function public.join_classroom(uuid,text,text) to service_role;
