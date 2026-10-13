import ThinkingPathsClient from '@/components/ThinkingPathsClient';
import { publicPathSummaries } from '@/lib/thinkingPaths';
export const metadata = { title: 'Thinking Paths | UThynk' };
export default function ThinkingPathsPage() {
  return <ThinkingPathsClient paths={publicPathSummaries()} />;
}
