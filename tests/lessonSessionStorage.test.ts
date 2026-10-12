import { describe, expect, it } from 'vitest';
import bank from '../data/questions.json';
import { challengeSessionKey, createChallengeSession, legacyChallengeSessionKey } from '../lib/challengeSession';
import { getLessonQuestion } from '../lib/lessonQuestions';
import { readLessonSession } from '../lib/lessonSessionStorage';

const question = getLessonQuestion('Epistemology', bank.Epistemology[0])!;
const input = { category: question.category, ageBand: '18_plus', language: 'fr' as const, questionId: question.id, questionIndex: 0 };
const legacy = { ...input, questionId: 'Epistemology-0' };
function session() {
  return { ...createChallengeSession({ ...legacy, originalQuestion: question.source, conversationId: 'c', sessionId: 's' }), activeAnswerDraft: 'Keep me' };
}
function reader(values: Map<string, string>) { return { getItem: (key: string) => values.get(key) ?? null }; }

describe('lesson session migration', () => {
  it('uses the most recently active legacy language slot', () => {
    const values = new Map([
      [legacyChallengeSessionKey({ ...legacy, language: 'en' }), JSON.stringify({ ...session(), language: 'en', updatedAt: '2026-09-01', activeAnswerDraft: 'Older' })],
      [legacyChallengeSessionKey({ ...legacy, language: 'es' }), JSON.stringify({ ...session(), language: 'es', updatedAt: '2026-09-02' })],
    ]);
    expect(readLessonSession(reader(values), input, question)).toMatchObject({ questionId: question.id, language: 'fr', activeAnswerDraft: 'Keep me', sessionId: 's' });
    expect(values.size).toBe(2);
  });
  it.each([challengeSessionKey(input), challengeSessionKey(legacy)])('honors the reset tombstone at %s', key => {
    const values = new Map([
      [legacyChallengeSessionKey(legacy), JSON.stringify(session())],
      [key, 'null'],
    ]);
    expect(readLessonSession(reader(values), input, question)).toBeNull();
  });
  it('rejects corrupt or mismatched records rather than restoring another question', () => {
    for (const raw of ['{', JSON.stringify({ ...session(), questionId: 'Epistemology-1' }), JSON.stringify({ ...session(), userId: 'another-user' }), JSON.stringify({ ...session(), ageBand: 'under_13' })]) {
      expect(readLessonSession(reader(new Map([[challengeSessionKey(input), raw]])), input, question)).toBeNull();
    }
  });
});
