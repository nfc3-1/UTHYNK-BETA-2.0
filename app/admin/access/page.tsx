import { redirect } from 'next/navigation';
import { getAccountAccess, permits } from '@/lib/accessControl';
import AdminAccess from '@/components/AdminAccess';
import LocalizedNavLinks from '@/components/LocalizedNavLinks';
import Link from 'next/link';
import CalibrationCheck from '@/components/CalibrationCheck';

export const dynamic = 'force-dynamic';
export default async function AccessPage() {
  const access = await getAccountAccess();
  if (!permits(access, 'admin')) redirect(access.userId ? '/profile' : '/login?next=/admin/access');
  return <main className="appShell"><LocalizedNavLinks /><section className="card" style={{ padding: 24 }}><h1>Account access</h1><p><Link href="/school">School & district administration</Link></p><AdminAccess /></section><CalibrationCheck /></main>;
}
