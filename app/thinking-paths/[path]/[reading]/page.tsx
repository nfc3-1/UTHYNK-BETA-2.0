import { notFound } from 'next/navigation';
import ReadingPathClient from '@/components/ReadingPathClient';
import { getThinkingPath, getPreviousReadingModules } from '@/lib/thinkingPaths';
import { getAccountAccess } from '@/lib/accessControl';
export const dynamic = 'force-dynamic';
export default async function ReadingPathPage({ params, searchParams }: { params: { path: string; reading: string }; searchParams: { lesson?: string } }) {
  const path = getThinkingPath(params.path);
  const reading = path?.readingPaths.find(reading => reading.slug === params.reading);
  if (!path || !reading) notFound();
  const previousModules = getPreviousReadingModules(path.slug, reading.slug);
  const readingModule = searchParams.lesson === undefined ? reading.modules[0] : [...reading.modules, ...previousModules].find(readingModule => readingModule.id === searchParams.lesson);
  if (!readingModule) notFound();
  const access = await getAccountAccess();
  return <ReadingPathClient pathSlug={path.slug} pathTitle={path.title} reading={reading} previousModules={previousModules} moduleId={readingModule.id} userId={access.userId} />;
}
