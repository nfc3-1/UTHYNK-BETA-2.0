import { NextResponse } from 'next/server';
import { getAccountAccess } from '@/lib/accessControl';

export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json(await getAccountAccess(), { headers: { 'Cache-Control': 'private, no-store' } });
}
