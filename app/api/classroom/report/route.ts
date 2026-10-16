import { classroomActor, classroomSnapshot, ClassroomError } from '@/lib/classroom';
import { progressRows, progressCsv } from '@/lib/schoolReports';
import { isLanguage } from '@/lib/reasoningI18n';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };

export async function GET(request: Request) {
  try {
    const access = await classroomActor();
    const params = new URL(request.url).searchParams;
    const classId = params.get('classId');
    const view = params.get('view') || 'learning';
    const language = params.get('language') || 'en';
    if (!classId || !isLanguage(language) || (view !== 'learning' && view !== 'teaching')) throw new ClassroomError('Choose a class, report view, and supported language.');
    const snapshot = await classroomSnapshot(access, classId, view);
    if (view === 'teaching' && !snapshot.manage) throw new ClassroomError('Only this class teacher may export its roster report.', 403);
    const assignmentId = params.get('assignmentId');
    if (assignmentId && !snapshot.assignments.some(a => a.id === assignmentId)) throw new ClassroomError('Assignment not found in this class.', 404);
    const assignments = assignmentId ? snapshot.assignments.filter(a => a.id === assignmentId) : snapshot.assignments;
    const personal = view === 'learning';
    const members = personal ? [{ profile_id: access.userId!, display_name: '', active: true }] : snapshot.members;
    const rows = progressRows(assignments, members, snapshot.submissions);
    const classroom = snapshot.classes.find(c => c.id === classId)!.title;
    return new Response(progressCsv(rows, language, classroom, personal), { headers: {
      ...headers, 'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="uthynk-${personal ? 'my' : 'class'}-participation.csv"`,
    } });
  } catch (error) {
    return Response.json({ error: error instanceof ClassroomError ? error.message : 'The report could not be generated.' },
      { status: error instanceof ClassroomError ? error.status : 500, headers });
  }
}
