import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AssignedLesson from "@/components/AssignedLesson";
import LocalizedNavLinks from "@/components/LocalizedNavLinks";
import {
  classroomActor,
  assignmentAccess,
  classroomDb,
  requireResult,
  ClassroomError,
} from "@/lib/classroom";
export const dynamic = "force-dynamic";
export default async function AssignmentPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const access = await classroomActor();
    const context = await assignmentAccess(access, params.id);
    const s = context.submission;
    const comments =
      requireResult(
        await classroomDb()
          .from("classroom_comments")
          .select("id,body")
          .eq("assignment_id", params.id)
          .eq("learner_id", access.userId!)
          .order("created_at"),
      ).data || [];
    const initialSession = s
      ? {
          version: 2,
          ageBand: "18_plus",
          category: context.target.category,
          language: s.language,
          questionId: context.target.id,
          questionIndex: 0,
          userId: access.userId,
          assignmentId: params.id,
          activeAnswerDraft: "",
          completed: !!s.completed_at,
          conversationId: s.session_id,
          sessionId: s.session_id,
          finalSynthesis: s.synthesis || "",
          firstResponse: s.first_answer,
          growthIndicators: [],
          originalQuestion: context.target.question,
          perspectiveExpansion: s.perspective,
          secondResponse: s.second_answer || "",
          secondaryQuestion: s.secondary_question,
          step: s.completed_at ? "final_synthesis" : "secondary_question",
          updatedAt: s.updated_at,
          assessment: s.assessment,
        }
      : null;
    return (
      <main className="appShell teacherPage">
        <header className="appTop card">
          <Link href="/classroom">UThynk · Classroom</Link>
          <LocalizedNavLinks />
        </header>
        <section className="appHero card" style={{ marginTop: 18 }}>
          <div className="heroCopy">
            <h1>{context.assignment.title}</h1>
            <p>{context.row.title}</p>
            {!context.membership && (
              <p>
                Join this class with its enrollment code to submit your own
                answers. You can review learner work in the teacher dashboard.
              </p>
            )}
          </div>
        </section>
        {
          <AssignedLesson
            preview={!context.membership}
            target={context.target}
            assignmentId={params.id}
            userId={access.userId!}
            initialSession={initialSession}
            comments={comments}
          />
        }
      </main>
    );
  } catch (e) {
    if (e instanceof ClassroomError) {
      if (e.status === 401)
        redirect(`/login?next=/classroom/assignments/${params.id}`);
      if (e.status === 403 || e.status === 404) notFound();
    }
    throw e;
  }
}
