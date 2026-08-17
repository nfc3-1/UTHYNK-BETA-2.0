import { describe, expect, it } from 'vitest';
import { challengeSessionKey, createChallengeSession, isChallengeSession } from '../lib/challengeSession';

describe('finite challenge session', () => {
  it('creates a refresh-safe main-question session', () => {
    const session = createChallengeSession({
      category: 'Street Lessons', questionIndex: 2, language: 'es', ageBand: '13_17',
      originalQuestion: 'Pregunta', sessionId: 'session-1', conversationId: 'conversation-1',
    });
    expect(session.step).toBe('main_question');
    expect(session.completed).toBe(false);
    expect(isChallengeSession(JSON.parse(JSON.stringify(session)))).toBe(true);
  });

  it('isolates persisted sessions by category, question, and language', () => {
    expect(challengeSessionKey('Science & Evidence', 1, 'fr')).toBe(
      'uthynk-challenge:v1:Science & Evidence:1:fr'
    );
    expect(challengeSessionKey('Science & Evidence', 1, 'fr') ===
      challengeSessionKey('Science & Evidence', 1, 'en')).toBe(false);
  });
});
