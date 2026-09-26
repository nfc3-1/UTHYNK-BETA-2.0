-- Run inside a transaction and roll back. No test records survive.
do $$
declare
  owner_id uuid := '78ed66eb-eb1d-46d5-8099-ed0d237bfe3f';
  target uuid := gen_random_uuid();
  target_auth uuid := gen_random_uuid();
  rejected boolean;
begin
  insert into auth.users(id,email) values(target_auth,target_auth::text || '@access-test.invalid');
  insert into public.user_profiles(id,auth_user_id,email,username) values(target,target_auth,target_auth::text || '@access-test.invalid','Access test');
  if has_function_privilege('authenticated','public.save_account_access(uuid,uuid,text,text[])','EXECUTE')
    or has_function_privilege('anon','public.save_account_access(uuid,uuid,text,text[])','EXECUTE')
    then raise exception 'Client roles can execute admin mutation'; end if;
  if has_table_privilege('authenticated','public.account_access','UPDATE')
    or has_table_privilege('authenticated','public.account_access','INSERT')
    or has_table_privilege('anon','public.account_access','SELECT')
    then raise exception 'Unsafe table privileges'; end if;
  perform public.save_account_access(owner_id,target,'teacher',array['teacher']);
  if not exists(select 1 from public.account_access where profile_id=target and role='teacher' and section_grants ? 'teacher')
    then raise exception 'Grant failed'; end if;
  rejected := false;
  begin perform public.save_account_access(target,target,'admin',array[]::text[]);
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Teacher escalated privileges'; end if;
  perform public.save_account_access(owner_id,target,'user',array[]::text[]);
  if not exists(select 1 from public.account_access where profile_id=target and role='user' and section_grants='{}'::jsonb)
    then raise exception 'Revoke failed'; end if;
  rejected := false;
  begin perform public.save_account_access(target,target,'teacher',array['teacher']);
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Standard user granted access'; end if;
  rejected := false;
  begin perform public.save_account_access(owner_id,owner_id,'user',array[]::text[]);
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Owner self-demoted'; end if;
  if (select count(*) from public.access_audit where target_id=target) <> 2 then raise exception 'Missing audit records'; end if;
end $$;
-- Ordinary authenticated callers can read only their own access row through RLS.
set local role authenticated;
select set_config('request.jwt.claim.sub','d203664e-b673-4ee4-9a62-615c606d3126',true);
do $$ begin
  if (select count(*) from public.account_access) <> 1 then raise exception 'RLS exposes other accounts'; end if;
end $$;
reset role;
select 'access grant/revoke, escalation, self-demotion, audit, privileges and RLS passed' as result;
