import {
  getAccountAccess,
  permits,
  type AccountAccess,
} from "@/lib/accessControl";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLessonQuestionById, lessonQuestions } from "@/lib/lessonQuestions";
import {
  getReadingModule,
  readingReasoningContext,
  thinkingPaths,
} from "@/lib/thinkingPaths";
import { randomBytes } from "crypto";
import { teachingSchools, teachesAtSchool } from '@/lib/schoolAccess';

export class ClassroomError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function classroomDb() {
  if (!supabaseAdmin)
    throw new ClassroomError("Classroom storage is unavailable.", 503);
  return supabaseAdmin;
}
export async function classroomActor() {
  const access = await getAccountAccess();
  if (!access.userId)
    throw new ClassroomError("Sign in to use your classroom.", 401);
  return access;
}
export function requireResult<T extends { error: unknown }>(value: T) {
  if (value.error)
    throw new ClassroomError(
      "Classroom storage could not complete the request. Try again.",
      503,
    );
  return value;
}
export function classroomTarget(kind: string, id: string) {
  if (kind === "lesson") {
    const q = getLessonQuestionById(id);
    if (q)
      return {
        kind,
        id,
        category: q.category,
        question: q.source,
        title: q.source,
        translations: {
          en: q.source,
          es: q.translations.es?.text || q.source,
          fr: q.translations.fr?.text || q.source,
        },
        reading: null,
      };
  }
  if (kind === "reading") {
    const r = getReadingModule(id);
    if (r)
      return {
        kind,
        id,
        category: r.category,
        question: r.question.en,
        title: r.title.en,
        translations: r.question,
        reading: r,
      };
  }
  throw new ClassroomError("This assignment target is unavailable.", 404);
}
export function classroomCatalog() {
  return [
    ...lessonQuestions.map((q) => ({
      id: q.id,
      kind: "lesson",
      title: q.source,
      category: q.category,
    })),
    ...thinkingPaths.flatMap((p) =>
      p.readingPaths.flatMap((r) =>
        r.modules.map((m) => ({
          id: m.id,
          kind: "reading",
          title: `${m.title.en} — ${m.author}`,
          category: p.title.en,
        })),
      ),
    ),
  ];
}
export async function classAccess(access: AccountAccess, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new ClassroomError("Class not found.", 404);
  const db = classroomDb();
  const row = requireResult(
    await db.from("classroom_classes").select("*").eq("id", id).maybeSingle(),
  ).data;
  if (!row || row.archived) throw new ClassroomError("Class not found.", 404);
  const manage =
    access.role === "admin" ||
    (row.teacher_id === access.userId && (row.school_id
      ? await teachesAtSchool(access, row.school_id)
      : permits(access, "teacher")));
  const membership = requireResult(
    await db
      .from("classroom_members")
      .select("*")
      .eq("class_id", id)
      .eq("profile_id", access.userId!)
      .eq("active", true)
      .maybeSingle(),
  ).data;
  if (!manage && !membership)
    throw new ClassroomError("Class access denied.", 403);
  return { row, manage, membership };
}
export async function assignmentAccess(
  access: AccountAccess,
  id: string,
  learner = false,
) {
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new ClassroomError("Assignment not found.", 404);
  const assignment = requireResult(
    await classroomDb()
      .from("classroom_assignments")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
  ).data;
  if (!assignment) throw new ClassroomError("Assignment not found.", 404);
  const scope = await classAccess(access, assignment.class_id);
  if (learner && !scope.membership)
    throw new ClassroomError(
      "Join this class before answering its assignment.",
      403,
    );
  const submission = requireResult(
    await classroomDb()
      .from("classroom_submissions")
      .select("*")
      .eq("assignment_id", id)
      .eq("learner_id", access.userId!)
      .maybeSingle(),
  ).data;
  return {
    assignment,
    ...scope,
    submission,
    target: classroomTarget(assignment.kind, assignment.target_id),
  };
}
async function allRows(query: any): Promise<any[]> {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page =
      requireResult(await query.range(offset, offset + 999)).data || [];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}
export async function classroomSnapshot(
  access: AccountAccess,
  requested?: string | null,
) {
  const db = classroomDb();
  const schools = await teachingSchools(access);
  const canTeach = permits(access, 'teacher') || schools.length > 0;
  const memberships =
    requireResult(
      await db
        .from("classroom_members")
        .select("class_id")
        .eq("profile_id", access.userId!)
        .eq("active", true),
    ).data || [];
  let query = db
    .from("classroom_classes")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (access.role !== "admin")
    query = query.or(
      `teacher_id.eq.${access.userId},id.in.(${memberships.map((m) => m.class_id).join(",") || "00000000-0000-0000-0000-000000000000"})`,
    );
  const rows = requireResult(await query).data || [];
  const classes = rows
    .filter(
      (c) =>
        access.role === 'admin' ||
        (c.teacher_id === access.userId && (c.school_id ? schools.some(s => s.id === c.school_id) : permits(access, 'teacher'))) ||
        memberships.some((m) => m.class_id === c.id),
    )
    .map((c) => ({
      ...c,
      join_code:
        c.teacher_id === access.userId || access.role === "admin"
          ? c.join_code
          : undefined,
    }));
  const selected = requested || classes[0]?.id;
  if (!selected)
    return {
      classes,
      selected: null,
      manage: false,
      members: [],
      assignments: [],
      submissions: [],
      comments: [],
      leaderboard: [],
      canTeach, teachingSchools: schools, canCreateIndependent: permits(access, 'teacher'),
    };
  const scope = await classAccess(access, selected);
  const members =
    requireResult(
      await db
        .from("classroom_members")
        .select("profile_id,display_name,active")
        .eq("class_id", selected),
    ).data || [];
  const assignments =
    requireResult(
      await db
        .from("classroom_assignments")
        .select("*")
        .eq("class_id", selected)
        .order("created_at", { ascending: false }),
    ).data || [];
  let submissionsQuery = db
    .from("classroom_submissions")
    .select("*")
    .in(
      "assignment_id",
      assignments.map((a) => a.id).length
        ? assignments.map((a) => a.id)
        : ["00000000-0000-0000-0000-000000000000"],
    );
  const all = await allRows(submissionsQuery);
  const submissions = scope.manage
    ? all
    : all.filter((s) => s.learner_id === access.userId);
  let commentsQuery = db
    .from("classroom_comments")
    .select("*")
    .in(
      "assignment_id",
      assignments.map((a) => a.id).length
        ? assignments.map((a) => a.id)
        : ["00000000-0000-0000-0000-000000000000"],
    );
  if (!scope.manage)
    commentsQuery = commentsQuery.eq("learner_id", access.userId!);
  const comments =
    requireResult(await commentsQuery.order("created_at", { ascending: false }))
      .data || [];
  // Only actual completed assignment records count. No generated names or grades.
  const leaderboard = members
    .filter((m) => m.active)
    .map((m) => ({
      name: m.display_name,
      completed: all.filter(
        (s) => s.learner_id === m.profile_id && s.completed_at,
      ).length,
    }))
    .sort((a, b) => b.completed - a.completed || a.name.localeCompare(b.name));
  return {
    classes,
    selected,
    manage: scope.manage,
    members: scope.manage ? members : [],
    assignments,
    submissions,
    comments,
    leaderboard,
    canTeach, teachingSchools: schools, canCreateIndependent: permits(access, 'teacher'),
  };
}
export async function classroomMutation(access: AccountAccess, body: any) {
  const db = classroomDb();
  const actor = access.userId!;
  if (body.action === "create_class") {
    const schoolId = body.schoolId || null;
    const allowed = schoolId ? await teachesAtSchool(access, schoolId) : permits(access, 'teacher');
    if (!allowed)
      throw new ClassroomError("Teacher access required.", 403);
    const title = String(body.title || "").trim();
    if (!title || title.length > 100)
      throw new ClassroomError("Enter a class name up to 100 characters.");
    const result = requireResult(
      await db
        .from("classroom_classes")
        .insert({
          title,
          teacher_id: actor,
          school_id: schoolId,
          join_code: randomBytes(6).toString("hex").toUpperCase(),
        })
        .select("*")
        .single(),
    ).data;
    return { classId: result.id };
  }
  if (body.action === "join") {
    const code = String(body.code || "")
      .trim()
      .toUpperCase();
    const name = String(body.name || "").trim();
    if (!name || name.length > 60 || !/^[A-F0-9]{12}$/.test(code))
      throw new ClassroomError(
        "Enter the class code and a display name up to 60 characters.",
      );
    const row = requireResult(
      await db
        .from("classroom_classes")
        .select("id")
        .eq("join_code", code)
        .eq("archived", false)
        .maybeSingle(),
    ).data;
    if (!row) throw new ClassroomError("Class code not found.", 404);
    const joined = await db.rpc("join_classroom", {
      actor,
      code,
      display_name: name,
    });
    if (joined.error?.message.includes("Class access was removed"))
      throw new ClassroomError(
        "Your class access was removed. Ask your teacher to restore it.",
        403,
      );
    requireResult(joined);
    return { classId: joined.data };
  }
  const scope = await classAccess(access, String(body.classId || ""));
  if (!scope.manage)
    throw new ClassroomError("Only this class teacher may change it.", 403);
  if (body.action === "assign") {
    const target = classroomTarget(body.kind, body.targetId);
    if (target.kind === "reading" && !permits(access, "thinking_paths"))
      throw new ClassroomError(
        "Thinking Paths access is required to assign readings.",
        403,
      );
    const date = body.dueDate || null;
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new ClassroomError("Invalid due date.");
    requireResult(
      await db
        .from("classroom_assignments")
        .insert({
          class_id: scope.row.id,
          title: target.title.slice(0, 160),
          kind: target.kind,
          target_id: target.id,
          due_date: date,
        }),
    );
    return { saved: true };
  }
  if (body.action === "remove_member" || body.action === "restore_member") {
    requireResult(
      await db
        .from("classroom_members")
        .update({ active: body.action === "restore_member" })
        .eq("class_id", scope.row.id)
        .eq("profile_id", body.learnerId),
    );
    return { saved: true };
  }
  if (body.action === "comment") {
    const assignment = await assignmentAccess(access, body.assignmentId);
    if (assignment.assignment.class_id !== scope.row.id)
      throw new ClassroomError(
        "Assignment does not belong to this class.",
        403,
      );
    const comment = String(body.comment || "").trim();
    if (!comment || comment.length > 4000)
      throw new ClassroomError("Enter a comment up to 4000 characters.");
    requireResult(
      await db
        .from("classroom_comments")
        .insert({
          assignment_id: body.assignmentId,
          learner_id: body.learnerId,
          teacher_id: actor,
          body: comment,
        }),
    );
    return { saved: true };
  }
  throw new ClassroomError("Unknown classroom action.");
}
export async function saveAssignmentTurn(
  access: AccountAccess,
  assignmentId: string,
  sessionId: string,
  phase: string,
  body: any,
  feedback: any,
) {
  const result = requireResult(
    await classroomDb().rpc("save_classroom_submission", {
      actor: access.userId,
      assignment: assignmentId,
      session_key: sessionId,
      phase,
      payload: {
        language: body.language || "en",
        first_answer: body.response,
        perspective: feedback.perspectiveExpansion,
        secondary_question: feedback.secondaryQuestion,
        second_answer: body.secondUserAnswer || body.response,
        synthesis: feedback.finalSynthesis,
        assessment: feedback.assessment,
      },
    }),
  );
  return result.data as { already_completed?: boolean; saved?: boolean };
}
export function assignmentPrompt(target: ReturnType<typeof classroomTarget>) {
  return target.reading
    ? readingReasoningContext(target.reading)
    : target.question;
}
