import catalog from '@/data/i18n/lessonQuestions.json';
import type { Language } from '@/lib/reasoningI18n';

export type LessonQuestion = {
  /** Stored identity: never regenerate IDs when sorting or editing the bank. */
  id: string;
  category: string;
  source: string;
  /** Index in the bank before stable IDs were introduced; migration only. */
  legacyIndex: number;
  translations: Partial<Record<Exclude<Language, 'en'>, {
    text: string;
    status: 'needs_review' | 'approved';
  }>>;
};

export const lessonQuestions = catalog as LessonQuestion[];
const byId = new Map(lessonQuestions.map(question => [question.id, question]));
const bySource = new Map(lessonQuestions.map(question => [JSON.stringify([question.category, question.source]), question]));

export function getLessonQuestion(category: string, source: string) {
  return bySource.get(JSON.stringify([category, source]));
}

export function getLessonQuestionById(id: string) {
  return byId.get(id);
}

/** The compatibility index must never select another question's translation. */
export function translateLessonQuestion(category: string, source: string, language: Language) {
  if (language === 'en') return source;
  return getLessonQuestion(category, source)?.translations[language]?.text || source;
}
