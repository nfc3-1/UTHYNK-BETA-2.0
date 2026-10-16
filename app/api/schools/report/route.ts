import { schoolActor, schoolSnapshot, SchoolError } from '@/lib/schoolAccess';
import { schoolRows, schoolTotals, schoolCsv, type SchoolReportRow } from '@/lib/schoolReports';
import { isLanguage } from '@/lib/reasoningI18n';
import { checkRateLimit } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };

export async function GET(request: Request) {
  try {
    const access = await schoolActor();
    const params = new URL(request.url).searchParams;
    const schoolId = params.get('schoolId'), districtId = params.get('districtId');
    const language = params.get('language') || 'en', format = params.get('format') || 'json';
    if ((!schoolId && !districtId) || (schoolId && districtId) || !isLanguage(language) || !['json','csv'].includes(format)) throw new SchoolError('Choose one school or district and a supported report format.');
    if (!checkRateLimit(`school-report:${access.userId}`, 30, 60000).allowed) throw new SchoolError('Too many report requests. Try again shortly.', 429);
    const base = await schoolSnapshot(access, schoolId);
    let selected = base.schools.filter(s => s.id === schoolId);
    let label = selected[0]?.name;
    if (districtId) {
      const district = base.districts.find(d => d.id === districtId);
      if (!district || (!base.platformAdmin && !district.canManage)) throw new SchoolError('District access denied.', 403);
      selected = base.schools.filter(s => s.district_id === districtId);
      label = district.name;
    } else if (!selected.length || base.selected !== schoolId) throw new SchoolError('School access denied.', 403);
    const rows: SchoolReportRow[] = [];
    // Reauthorize every school through the existing RPC; never combine raw student records.
    for (let i = 0; i < selected.length; i += 4) {
      const batch = await Promise.all(selected.slice(i, i + 4).map(async school => {
        const data = schoolId ? base : await schoolSnapshot(access, school.id);
        if (data.selected !== school.id) throw new SchoolError('School access denied.', 403);
        return schoolRows(school, data.classes);
      }));
      rows.push(...batch.flat());
    }
    if (format === 'csv') return new Response(schoolCsv(rows, language), { headers: {
      ...headers, 'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="uthynk-${districtId ? 'district' : 'school'}-participation.csv"`,
    } });
    return Response.json({ scope: districtId ? 'district' : 'school', label, rows, totals: schoolTotals(rows),
      schools: selected.map(s => ({ id: s.id, name: s.name, ...schoolTotals(rows.filter(r => r.schoolId === s.id)) })), generatedAt: new Date().toISOString() }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof SchoolError ? error.message : 'The report could not be generated.' },
      { status: error instanceof SchoolError ? error.status : 500, headers });
  }
}
