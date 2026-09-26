import { NextResponse } from 'next/server';
import { getAccountAccess, permits } from '@/lib/accessControl';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const access = await getAccountAccess();
  if (!permits(access, 'admin') || !supabaseAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(request.url);
  const search = (url.searchParams.get('q') || '').replace(/[^\p{L}\p{N}@._ +\-]/gu, '').slice(0, 100);
  const page = Math.max(0, Math.min(10000, Number(url.searchParams.get('page')) || 0));
  let query = supabaseAdmin.from('user_profiles').select('id,auth_user_id,email,username,account_access:account_access!account_access_profile_id_fkey(role,section_grants,updated_at)').not('auth_user_id', 'is', null).order('id').range(page * 25, page * 25 + 24);
  if (search) query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
  const [users, sections] = await Promise.all([query, supabaseAdmin.from('restricted_sections').select('id,label').order('id')]);
  if (users.error || sections.error) return NextResponse.json({ error: 'Access records unavailable.' }, { status: 503 });
  return NextResponse.json({ users: users.data, sections: sections.data, actorId: access.userId }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const access = await getAccountAccess();
  if (!permits(access, 'admin') || !supabaseAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || !/^[0-9a-f-]{36}$/i.test(body.userId || '') || !['user', 'teacher', 'admin'].includes(body.role) || !Array.isArray(body.sections) || body.sections.length > 50 || body.sections.some((s: unknown) => typeof s !== 'string' || !/^[a-z][a-z0-9_-]{0,49}$/.test(s))) {
    return NextResponse.json({ error: 'Invalid access settings.' }, { status: 400 });
  }
  const result = await supabaseAdmin.rpc('save_account_access', { actor_id: access.userId, target_id: body.userId, next_role: body.role, next_sections: body.sections });
  if (result.error) return NextResponse.json({ error: 'Changes rejected. You cannot change your own role or remove the last administrator. Refresh and try again.' }, { status: 409 });
  return NextResponse.json({ saved: true });
}
