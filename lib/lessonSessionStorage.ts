import {
  challengeSessionKey,
  legacyChallengeSessionKey,
  restoreChallengeSession,
  type ChallengeSessionKeyInput,
} from '@/lib/challengeSession';
import { getLessonQuestion, type LessonQuestion } from '@/lib/lessonQuestions';

type StorageReader = Pick<Storage, 'getItem'>;

export function lessonSelectionKey(input: Pick<ChallengeSessionKeyInput, 'userId' | 'category' | 'ageBand'>) {
  return `uthynk-lesson-selection:${JSON.stringify([input.userId || 'guest', input.category, input.ageBand])}`;
}

function parseSession(raw: string | null) {
  try { return restoreChallengeSession(JSON.parse(raw || 'null')); }
  catch { return null; }
}

/** Reads old IDs without deleting their history; explicit reset tombstones win. */
export function readLessonSession(storage: StorageReader, input: ChallengeSessionKeyInput, question?: LessonQuestion) {
  const canonical = storage.getItem(challengeSessionKey(input));
  const legacyInput = question ? {
    ...input,
    questionId: `${question.category}-${question.legacyIndex}`,
    questionIndex: question.legacyIndex,
  } : input;
  const previous = storage.getItem(challengeSessionKey(legacyInput));
  const raw = canonical ?? previous;
  const candidate = raw !== null ? parseSession(raw) : (['en', 'es', 'fr'] as const)
    .map(language => parseSession(storage.getItem(legacyChallengeSessionKey({ ...legacyInput, language }))))
    .filter(Boolean)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];

  if (!candidate || candidate.category !== input.category || candidate.ageBand !== input.ageBand ||
      (candidate.userId || null) !== (input.userId || null) ||
      (candidate.questionId !== input.questionId && candidate.questionId !== legacyInput.questionId)) return null;

  return { ...candidate, questionId: input.questionId, questionIndex: input.questionIndex, language: input.language };
}

/** Before this patch there was no selected-question pointer. Recover the newest
 * scoped record once, then the UI writes a stable ID pointer for future visits. */
export function readLessonSelection(storage: StorageReader, input: Omit<ChallengeSessionKeyInput, 'questionId' | 'questionIndex'>, questions: string[]) {
  const savedId = storage.getItem(lessonSelectionKey(input));
  const savedIndex = savedId ? questions.findIndex(source => getLessonQuestion(input.category, source)?.id === savedId) : -1;
  if (savedIndex >= 0) return savedIndex;
  let selectedIndex = 0;
  let latest = '';
  questions.forEach((source, questionIndex) => {
    const question = getLessonQuestion(input.category, source);
    const session = readLessonSession(storage, {
      ...input, questionIndex, questionId: question?.id || `${input.category}-${questionIndex}`,
    }, question);
    if (session && (session.updatedAt || '') > latest) {
      latest = session.updatedAt;
      selectedIndex = questionIndex;
    }
  });
  return selectedIndex;
}
