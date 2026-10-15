begin;
do $test$
declare district_a uuid; district_b uuid; school_a uuid; school_b uuid; school_c uuid;
 da uuid:=gen_random_uuid(); sa uuid:=gen_random_uuid(); teacher uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); class_a uuid; class_b uuid; assignment uuid; r jsonb; blocked boolean;
begin
 insert into public.user_profiles(id,email,username) values
 (da,da::text||'@qa.invalid','QA district admin'),(sa,sa::text||'@qa.invalid','QA school admin'),
 (teacher,teacher::text||'@qa.invalid','QA teacher'),(outsider,outsider::text||'@qa.invalid','QA other district'),(learner,learner::text||'@qa.invalid','QA learner');
 insert into public.school_districts(name) values('QA district A') returning id into district_a;
 insert into public.school_districts(name) values('QA district B') returning id into district_b;
 insert into public.schools(name,district_id) values('QA school A',district_a) returning id into school_a;
 insert into public.schools(name,district_id) values('QA school B',district_a) returning id into school_b;
 insert into public.schools(name,district_id) values('QA school C',district_b) returning id into school_c;
 insert into public.district_administrators(district_id,profile_id) values(district_a,da),(district_b,outsider);
 insert into public.school_staff(school_id,profile_id,role) values(school_a,sa,'school_admin'),(school_a,teacher,'teacher'),(school_b,teacher,'teacher'),(school_c,outsider,'school_admin');
 insert into public.classroom_classes(title,teacher_id,school_id,join_code) values('QA class A',teacher,school_a,upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))) returning id into class_a;
 insert into public.classroom_classes(title,teacher_id,school_id,join_code) values('QA class B',teacher,school_b,upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))) returning id into class_b;
 insert into public.classroom_members(class_id,profile_id,display_name) values(class_a,learner,'QA learner');
 insert into public.classroom_assignments(class_id,title,kind,target_id) values(class_a,'QA assignment','lesson','qa-target') returning id into assignment;
 insert into public.classroom_submissions(assignment_id,learner_id,session_id,language,first_answer,perspective,secondary_question,second_answer,synthesis,completed_at)
 values(assignment,learner,'qa-school-session','en','Private learner answer','Private coach text','Question?','Private second answer','Private synthesis',now());
 r:=public.school_dashboard(sa,school_a);
 if jsonb_array_length(r->'schools')<>1 or jsonb_array_length(r->'classes')<>1 or r->'classes'->0->>'completed'<>'1' then raise exception 'School scope or actual metrics failed'; end if;
 if r::text like '%Private learner answer%' or r::text like '%Private synthesis%' or r::text like '%join_code%' then raise exception 'Dashboard disclosed protected class details'; end if;
 blocked:=false; begin perform public.school_dashboard(sa,school_b); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'School admin accessed another school in same district'; end if;
 blocked:=false; begin perform public.school_dashboard(sa,school_c); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'School admin accessed another district'; end if;
 r:=public.school_dashboard(da,school_b);
 if jsonb_array_length(r->'schools')<>2 or jsonb_array_length(r->'districts')<>1 then raise exception 'District scope failed'; end if;
 blocked:=false; begin perform public.school_dashboard(da,school_c); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'District admin accessed another district'; end if;
 blocked:=false; begin perform public.school_dashboard(teacher,school_a); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Teacher received school-wide administration'; end if;
 blocked:=false; begin perform public.manage_school(sa,jsonb_build_object('action','school_staff','schoolId',school_b,'profileId',teacher,'role','teacher')); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'School admin mutated another school'; end if;
 blocked:=false; begin perform public.manage_school(sa,jsonb_build_object('action','school_staff','schoolId',school_a,'profileId',teacher,'role','school_admin')); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'School admin elevated a teacher'; end if;
 blocked:=false; begin perform public.manage_school(da,jsonb_build_object('action','district_admin','districtId',district_a,'profileId',da)); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'District admin granted district privileges'; end if;
 blocked:=false; begin perform public.manage_school(da,jsonb_build_object('action','create_school','districtId',district_b,'name','Stolen scope')); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'District admin created school in another district'; end if;
 blocked:=false; begin perform public.manage_school(sa,jsonb_build_object('action','place_class','schoolId',school_a,'classId',class_b)); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'School admin pulled another school class into scope'; end if;
 -- Revocation must take effect without changing the global account role.
 perform public.manage_school(sa,jsonb_build_object('action','school_staff','schoolId',school_a,'profileId',teacher,'role','teacher','active',false));
 if exists(select 1 from jsonb_array_elements(public.teaching_schools(teacher)) s where s->>'id'=school_a::text) then raise exception 'Revoked teacher retained school access'; end if;
 if not exists(select 1 from jsonb_array_elements(public.teaching_schools(teacher)) s where s->>'id'=school_b::text) then raise exception 'Revocation removed unrelated school access'; end if;
 blocked:=false; begin insert into public.classroom_classes(title,teacher_id,school_id,join_code) values('QA invalid class',teacher,school_a,upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Revoked teacher could create school class'; end if;
 if not exists(select 1 from public.classroom_submissions where assignment_id=assignment and first_answer='Private learner answer') then raise exception 'Staff revocation removed learner history'; end if;
 update public.district_administrators set active=false where district_id=district_a and profile_id=da;
 blocked:=false; begin perform public.school_dashboard(da,school_b); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Revoked district admin retained school access'; end if;
 if has_table_privilege('anon','public.school_staff','select') or has_table_privilege('authenticated','public.schools','select') or has_table_privilege('authenticated','public.reasoning_calibration_runs','select') then raise exception 'Client role can read protected organization records'; end if;
 if has_function_privilege('authenticated','public.manage_school(uuid,jsonb)','execute') or has_function_privilege('anon','public.school_dashboard(uuid,uuid)','execute') then raise exception 'Client role can forge organization actors'; end if;
 if not exists(select 1 from public.school_access_audit where actor_id=sa and target_profile_id=teacher) then raise exception 'Staff change was not audited'; end if;
end $test$;
select 'PASS: cross-school/cross-district reads and mutations denied; real aggregate totals; no learner answer/code disclosure; revoked staff/district access denied; retained learner history; no client-role grants; audit saved. All QA records rolled back.' as result;
rollback;
