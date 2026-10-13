import { getAccountAccess, permits } from '@/lib/accessControl';
import { getReadingModule, readingReasoningContext } from '@/lib/thinkingPaths';

/** Resolve and authorize every call, including synthesis after a revoked grant. */
export async function resolveReadingRequest(id: unknown) {
  const readingModule = typeof id === 'string' ? getReadingModule(id) : undefined;
  if (!readingModule) return { ok: false as const, status: 404, error: 'Reading module not found.' };
  const access = await getAccountAccess();
  if (!permits(access, 'thinking_paths')) return { ok: false as const, status: 403, error: 'Thinking Paths beta access is required.' };
  return { ok: true as const, module: readingModule, context: readingReasoningContext(readingModule), userId: access.userId };
}
