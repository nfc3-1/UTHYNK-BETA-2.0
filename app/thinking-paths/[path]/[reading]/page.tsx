import { notFound } from 'next/navigation';
import ReadingPathClient from '@/components/ReadingPathClient';
import ThinkingPathsClient from '@/components/ThinkingPathsClient';
import { getThinkingPath, getPreviousReadingModules, publicPathSummaries } from '@/lib/thinkingPaths';
import { getAccountAccess, permits } from '@/lib/accessControl';
export const dynamic = 'force-dynamic';
export default async function ReadingPathPage({ params, searchParams }: { params: { path: string; reading: string }; searchParams: { lesson?: string } }) {
  const path = getThinkingPath(params.path);
  const reading = path?.readingPaths.find(reading => reading.slug === params.reading);
  if (!path || !reading) notFound();
  const previousModules = getPreviousReadingModules(path.slug, reading.slug);
  const readingModule = searchParams.lesson === undefined ? reading.modules[0] : [...reading.modules, ...previousModules].find(readingModule => readingModule.id === searchParams.lesson);
  if (!readingModule) notFound();
  const access = await getAccountAccess();
  if (!permits(access, 'thinking_paths') || !access.userId) {
    return <ThinkingPathsClient paths={publicPathSummaries().filter(item => item.slug === path.slug)} selectedPath={path.slug} locked signedIn={Boolean(access.userId)} />;
  }
  return <ReadingPathClient pathSlug={path.slug} pathTitle={path.title} reading={reading} previousModules={previousModules} moduleId={readingModule.id} userId={access.userId} />;
}
