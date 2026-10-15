import { NextResponse } from 'next/server';
import { getAccountAccess } from '@/lib/accessControl';
import { schoolCapabilities } from '@/lib/schoolAccess';

export const dynamic = 'force-dynamic';
export async function GET() {
  const access = await getAccountAccess();
  const school = await schoolCapabilities(access).catch(() => ({ schoolAdmin: false, schoolTeacher: false }));
  return NextResponse.json({ ...access, ...school }, { headers: { 'Cache-Control': 'private, no-store' } });
}
