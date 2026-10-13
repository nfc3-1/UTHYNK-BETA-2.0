import { readLessonSession } from '@/lib/lessonSessionStorage';
import type { Language } from '@/lib/reasoningI18n';
import type { ReadingModule } from '@/lib/thinkingPathTypes';
export function readingProgress(storage: Pick<Storage, 'getItem'>, module: Pick<ReadingModule, 'id' | 'category'>, userId: string, ageBand: string, language: Language) {
  const session = readLessonSession(storage, { category: module.category, questionId: module.id, questionIndex: 0, userId, ageBand, language });
  return session?.completed ? 'complete' : session ? 'saved' : 'untouched';
}
