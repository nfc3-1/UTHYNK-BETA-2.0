import { notFound } from 'next/navigation';
import ThinkingPathsClient from '@/components/ThinkingPathsClient';
import { getThinkingPath, publicPathSummaries } from '@/lib/thinkingPaths';
export default function ThinkingPathPage({ params }: { params: { path: string } }) {
  if (!getThinkingPath(params.path)) notFound();
  return <ThinkingPathsClient paths={publicPathSummaries().filter(path => path.slug === params.path)} selectedPath={params.path} />;
}
