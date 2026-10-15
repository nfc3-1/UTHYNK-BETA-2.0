begin;
do $test$
declare teacher uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); stranger uuid:=gen_random_uuid(); class uuid; assignment uuid; result jsonb; blocked boolean:=false;
begin
 insert into public.user_profiles(id,email,username) values
 (teacher,teacher::text||'@qa.invalid','QA teacher'),(learner,learner::text||'@qa.invalid','QA learner'),(stranger,stranger::text||'@qa.invalid','QA outsider');
 insert into public.classroom_classes(title,teacher_id,join_code) values('Transactional QA class',teacher,upper(substr(replace(teacher::text,'-',''),1,12))) returning id into class;
 perform public.join_classroom(learner,upper(substr(replace(teacher::text,'-',''),1,12)),'QA learner');
 insert into public.classroom_assignments(class_id,title,kind,target_id) values(class,'QA assignment','lesson','qa-target') returning id into assignment;
 begin
  perform public.save_classroom_submission(stranger,assignment,'qa-session','follow_up','{}');
 exception when others then blocked:=true; end;
 if not blocked then raise exception 'Outsider submission was accepted'; end if;
 result:=public.save_classroom_submission(learner,assignment,'qa-session','follow_up',jsonb_build_object('language','en','first_answer','First actual test answer','perspective','Test perspective','secondary_question','Test question?','assessment',jsonb_build_object('earned',12,'possible',20)));
 if result->>'saved'<>'true' then raise exception 'First answer was not saved'; end if;
 result:=public.save_classroom_submission(learner,assignment,'qa-session','synthesis',jsonb_build_object('language','fr','second_answer','Second actual test answer','synthesis','Test synthesis','assessment',jsonb_build_object('earned',16,'possible',20)));
 if not exists(select 1 from public.classroom_submissions where assignment_id=assignment and learner_id=learner and first_answer='First actual test answer' and second_answer='Second actual test answer' and completed_at is not null and assessment->>'earned'='16') then raise exception 'Submission restoration failed'; end if;
 result:=public.save_classroom_submission(learner,assignment,'qa-session','synthesis','{}');
 if result->>'already_completed'<>'true' then raise exception 'Duplicate completion was not idempotent'; end if;
 insert into public.classroom_comments(assignment_id,learner_id,teacher_id,body) values(assignment,learner,teacher,'Actual QA feedback');
 if (select count(*) from public.classroom_submissions where assignment_id=assignment and completed_at is not null)<>1 then raise exception 'Leaderboard completion count incorrect'; end if;
 update public.classroom_members set active=false where class_id=class and profile_id=learner;
 blocked:=false;
 begin perform public.join_classroom(learner,upper(substr(replace(teacher::text,'-',''),1,12)),'QA learner'); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Removed membership reactivated itself'; end if;
 if has_table_privilege('anon','public.classroom_submissions','select') or has_table_privilege('authenticated','public.classroom_submissions','select') then raise exception 'Client role can bypass API scope'; end if;
 if has_function_privilege('authenticated','public.save_classroom_submission(uuid,uuid,text,text,jsonb)','execute') then raise exception 'Client role can forge submission actors'; end if;
end $test$;
select 'PASS: saved first/second answers, comment, actual completion count, duplicate prevention, outsider denial, removed-member denial, client-role denial. All QA records rolled back.' as result;
rollback;
