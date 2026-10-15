import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  classAccess,
  classroomCatalog,
  classroomMutation,
  classroomSnapshot,
  assignmentAccess,
} from "../lib/classroom";
const state = vi.hoisted(() => ({
  rows: {} as Record<string, any[]>,
  writes: [] as any[],
}));
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table: string) {
      let rows = state.rows[table] || [];
      const query: any = {
        select() {
          return query;
        },
        range() {
          return query;
        },
        eq(k: string, v: unknown) {
          rows = rows.filter((r) => r[k] === v);
          return query;
        },
        in(k: string, v: any[]) {
          rows = rows.filter((r) => v.includes(r[k]));
          return query;
        },
        order() {
          return query;
        },
        or() {
          return query;
        },
        maybeSingle: async () => ({ data: rows[0] || null, error: null }),
        single: async () => ({ data: rows[0] || null, error: null }),
        insert(value: any) {
          state.writes.push({ table, value });
          return query;
        },
        update(value: any) {
          state.writes.push({ table, value });
          return query;
        },
        then(resolve: any) {
          resolve({ data: rows, error: null });
        },
      };
      return query;
    },
    rpc: async (name: string, args: any) => ({ data: name === "teaching_schools" ? (state.rows.school_staff || []).filter(s => s.profile_id === args.actor && s.active).map(s => ({ id: s.school_id, name: "Assigned school" })) : "joined-class", error: null }),
  },
}));
const classId = "11111111-1111-4111-8111-111111111111",
  otherId = "22222222-2222-4222-8222-222222222222",
  assignmentId = "33333333-3333-4333-8333-333333333333";
const teacher = {
    role: "teacher" as const,
    sections: ["thinking_paths"],
    userId: "teacher-a",
  },
  student = { role: "user" as const, sections: [], userId: "student-a" };
beforeEach(() => {
  state.writes = [];
  state.rows = {
    classroom_classes: [
      {
        id: classId,
        title: "First class",
        teacher_id: "teacher-a",
        archived: false,
        join_code: "ABCDEF123456",
      },
      {
        id: otherId,
        title: "Other school class",
        teacher_id: "teacher-b",
        archived: false,
        join_code: "123456ABCDEF",
      },
    ],
    classroom_members: [
      {
        class_id: classId,
        profile_id: "student-a",
        display_name: "Actual learner",
        active: true,
      },
    ],
    classroom_assignments: [
      {
        id: assignmentId,
        class_id: classId,
        kind: "reading",
        target_id: "reading-plato-republic-473",
        title: "Read Plato",
      },
    ],
    classroom_submissions: [
      {
        assignment_id: assignmentId,
        learner_id: "student-a",
        first_answer: "Actual answer",
        completed_at: "2026-10-15T00:00:00Z",
      },
      {
        assignment_id: assignmentId,
        learner_id: "student-b",
        first_answer: "Private answer",
        completed_at: null,
      },
    ],
    classroom_comments: [],
  };
});
describe("classroom authorization and actual records", () => {
  it("denies another teacher, unrelated learners and revoked memberships", async () => {
    await expect(
      classAccess({ ...teacher, userId: "teacher-b" }, classId),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      classAccess({ ...student, userId: "student-b" }, classId),
    ).rejects.toMatchObject({ status: 403 });
    state.rows.classroom_members[0].active = false;
    await expect(classAccess(student, classId)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("requires the actual class teacher for assignments and comments", async () => {
    await expect(
      classroomMutation(student, {
        action: "assign",
        classId,
        kind: "reading",
        targetId: "reading-plato-republic-473",
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      classroomMutation(
        { ...teacher, userId: "teacher-b" },
        {
          action: "assign",
          classId,
          kind: "reading",
          targetId: "reading-plato-republic-473",
        },
      ),
    ).rejects.toMatchObject({ status: 403 });
    await classroomMutation(teacher, {
      action: "assign",
      classId,
      kind: "reading",
      targetId: "reading-plato-republic-473",
    });
    expect(state.writes[0].value).toMatchObject({
      class_id: classId,
      target_id: "reading-plato-republic-473",
    });
  });
  it("returns only the learner’s own answers and uses real completion records for the board", async () => {
    const data = await classroomSnapshot(student, classId);
    expect(data.submissions).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain("Private answer");
    expect(data.members).toEqual([]);
    expect(data.leaderboard).toEqual([
      { name: "Actual learner", completed: 1 },
    ]);
  });
  it("resolves assigned source and first-answer history from server records", async () => {
    const data = await assignmentAccess(student, assignmentId, true);
    expect(data.target.id).toBe("reading-plato-republic-473");
    expect(data.submission.first_answer).toBe("Actual answer");
    await expect(
      assignmentAccess({ ...student, userId: "student-b" }, assignmentId, true),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("revoked teachers cannot manage classes, and grants cannot bypass ownership", async () => {
    await expect(
      classAccess({ ...teacher, role: "user" }, classId),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      classAccess(
        { ...teacher, userId: "unrelated", sections: ["teacher"] },
        classId,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("requires active membership in the class school even for a globally enabled teacher", async () => {
    state.rows.classroom_classes[0].school_id='school-a';
    state.rows.school_staff=[{school_id:'school-a',profile_id:teacher.userId,active:true}];
    expect((await classAccess(teacher,classId)).manage).toBe(true);
    state.rows.school_staff[0].active=false;
    await expect(classAccess(teacher,classId)).rejects.toMatchObject({status:403});
    const snapshot=await classroomSnapshot(teacher);
    expect(snapshot.classes).toEqual([]);
    await expect(classroomMutation(teacher,{action:'create_class',schoolId:'school-a',title:'Blocked'})).rejects.toMatchObject({status:403});
  });
  it("allows a scoped school teacher without granting independent class creation", async () => {
    state.rows.classroom_classes[0].school_id='school-a';
    state.rows.school_staff=[{school_id:'school-a',profile_id:student.userId,active:true}];
    state.rows.classroom_classes[0].teacher_id=student.userId;
    expect((await classAccess(student,classId)).manage).toBe(true);
    await expect(classroomMutation(student,{action:'create_class',title:'Independent'})).rejects.toMatchObject({status:403});
    await classroomMutation(student,{action:'create_class',schoolId:'school-a',title:'School class'});
    expect(state.writes[0].value).toMatchObject({school_id:'school-a',teacher_id:student.userId});
  });

});

describe("expanded reading assignment catalog", () => {
  it("offers each canonical reading once despite reuse across paths", () => {
    const readings=classroomCatalog().filter(item=>item.kind==='reading');
    expect(readings).toHaveLength(84);
    expect(new Set(readings.map(item=>item.id)).size).toBe(readings.length);
    expect(readings.some(item=>item.id==='reading-dewey-time-to-reflect')).toBe(true);
  });
});
