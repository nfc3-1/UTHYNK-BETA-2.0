import { getReadingModule, readingReasoningContext } from '@/lib/thinkingPaths';

/** Public beta practice; resolve canonical source content on every turn.
 * Classroom assignments retain their independent membership checks. */
export async function resolveReadingRequest(id: unknown) {
  const readingModule = typeof id === 'string' ? getReadingModule(id) : undefined;
  if (!readingModule) return { ok: false as const, status: 404, error: 'Reading module not found.' };
  return { ok: true as const, module: readingModule, context: readingReasoningContext(readingModule) };
}
