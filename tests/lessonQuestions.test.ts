import { describe, expect, it } from 'vitest';
import bank from '../data/questions.json';
import { challenges } from '../lib/challenges';
import { getLessonQuestion, getLessonQuestionById, lessonQuestions } from '../lib/lessonQuestions';
import { localizeChallenge, localizeQuestion } from '../lib/reasoningI18n';

describe('lesson translation coverage and identity', () => {
  it('covers every English source exactly once with distinct Spanish and French prompts', () => {
    const sources = Object.entries(bank).flatMap(([category, questions]) => questions.map(source => ({ category, source })));
    expect(lessonQuestions).toHaveLength(sources.length);
    expect(new Set(lessonQuestions.map(question => question.id)).size).toBe(sources.length);
    for (const { category, source } of sources) {
      const question = getLessonQuestion(category, source);
      expect(question, `${category}: ${source}`).toBeDefined();
      expect(getLessonQuestionById(question!.id)).toBe(question);
      for (const language of ['es', 'fr'] as const) {
        const translation = question!.translations[language];
        expect(translation?.text.trim().length, `${question!.id}:${language}`).toBeGreaterThan(30);
        expect(translation?.text).not.toBe(source);
        expect(translation?.text).toContain('?');
        expect(['needs_review', 'approved']).toContain(translation?.status);
        expect(localizeQuestion(category, 999, source, language)).toBe(translation?.text);
      }
    }
    for (const category of Object.keys(bank)) {
      for (const language of ['es', 'fr'] as const) {
        const prompts = lessonQuestions.filter(question => question.category === category).map(question => question.translations[language]!.text);
        expect(new Set(prompts).size).toBe(prompts.length);
      }
    }
  });

  it('keeps identities and translations attached to source questions when reordered or inserted', () => {
    const category = 'Epistemology';
    const original = bank[category].slice(0, 3);
    const ids = original.map(source => getLessonQuestion(category, source)!.id);
    expect(ids).toEqual(['epistemology-01', 'epistemology-02', 'epistemology-03']);
    expect(getLessonQuestion('Logic & Critical Thinking', bank['Logic & Critical Thinking'][0])!.id).toBe('logic-critical-thinking-01');
    const reordered = ['A new untranslated question?', ...original.slice().reverse()];
    for (const source of original) {
      const newIndex = reordered.indexOf(source);
      expect(getLessonQuestion(category, reordered[newIndex])!.id).toBe(ids[original.indexOf(source)]);
      expect(localizeQuestion(category, newIndex, source, 'es')).toBe(localizeQuestion(category, original.indexOf(source), source, 'es'));
    }
    expect(getLessonQuestion(category, reordered[0])).toBeUndefined();
    expect(localizeQuestion(category, 0, reordered[0], 'es')).toBe(reordered[0]);
    expect(localizeQuestion(category, 0, `${original[0]} EDITED`, 'fr')).toBe(`${original[0]} EDITED`);
  });

  it('preserves scenarios, numbers and inquiry rather than replacing them with generic prompts', () => {
    for (const language of ['es', 'fr'] as const) {
      const loan = localizeQuestion('Financial Judgment', 0, bank['Financial Judgment'][0], language);
      expect(loan).toContain('60'); expect(loan).toContain('84');
      expect(loan).toMatch(/coût total|coste total/);
      const trial = localizeQuestion('Science & Evidence', 8, bank['Science & Evidence'][8], language);
      expect(trial).toMatch(/faux positifs|falsos positivos/);
      const claim = localizeQuestion('Logic & Critical Thinking', 2, bank['Logic & Critical Thinking'][2], language);
      expect(claim).toContain('Tesla'); expect(claim).toContain('Elon Musk');
      const follow = localizeQuestion('History & Civilization', 9, bank['History & Civilization'][9], language);
      expect(follow).toMatch(/esclavizadas|esclavisées/);
    }
  });

  it('uses the same IDs and translations for existing challenges, preserving English exactly', () => {
    for (const challenge of challenges) {
      expect(challenge.id).toBe(getLessonQuestion(challenge.category, challenge.prompt)!.id);
      expect(localizeChallenge(challenge, 'en').prompt).toBe(challenge.prompt);
      for (const language of ['es', 'fr'] as const) {
        const localized = localizeChallenge(challenge, language);
        expect(localized.id).toBe(challenge.id);
        expect(localized.prompt).toBe(localizeQuestion(challenge.category, 0, challenge.prompt, language));
      }
    }
  });
});
