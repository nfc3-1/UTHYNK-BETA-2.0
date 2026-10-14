import { describe, expect, it } from 'vitest';
import { thinkingPaths, getReadingModule, getThinkingPath, publicPathSummaries, readingReasoningContext } from '../lib/thinkingPaths';
import { getCategories } from '../lib/questionBank';
import { pathCopy } from '../lib/pathCopy';
import passageData from '../data/readingPassages.json';
const modules = thinkingPaths.flatMap(path => path.readingPaths).flatMap(path => path.modules);
describe('Thinking Paths catalog contract', () => {
  it('keeps thematic identities separate from existing challenge categories', () => {
    expect(thinkingPaths.map(path => path.title.en)).toEqual(['Power & Leadership','Freedom & Government','Meaning, Morality & Suffering','Truth & Knowledge','Human Nature','Civilizations & Culture','Economics & Society']);
    expect(thinkingPaths).toHaveLength(7); expect(modules).toHaveLength(70);
    expect(new Set(modules.map(module => module.id)).size).toBe(modules.length);
    expect(new Set(thinkingPaths.map(path => path.slug)).size).toBe(thinkingPaths.length);
    thinkingPaths.forEach(path => {
      expect(getThinkingPath(path.slug)).toBe(path);
      path.readingPaths.forEach(reading => expect(reading.modules).toHaveLength(10));
      expect(new Set(path.readingPaths.map(reading => reading.slug)).size).toBe(path.readingPaths.length);
    });
    modules.forEach(module => { expect(getReadingModule(module.id)).toBe(module); expect(getCategories()).toContain(module.category); });
    expect(getReadingModule('missing')).toBeUndefined();
  });
  it('covers every module and UI field in all three languages without generic substitution', () => {
    const textFields = ['title', 'work', 'location', 'text', 'plainLanguage', 'question'] as const;
    for (const module of modules) for (const language of ['en', 'es', 'fr'] as const) {
      textFields.forEach(field => expect(module[field][language]?.trim()).toBeTruthy());
      if (language !== 'en') { expect(module.text[language]).not.toBe(module.text.en); expect(module.plainLanguage[language]).not.toBe(module.plainLanguage.en); }
      module.lenses.forEach(lens => expect(lens[language]?.trim()).toBeTruthy());
      expect(module.question.es).not.toBe(module.question.en); expect(module.question.fr).not.toBe(module.question.en);
      expect(module.editorialStatus).toBe('needs_review');
    }
    for (const language of ['en','es','fr'] as const) {
      thinkingPaths.forEach(path => { expect(path.title[language]).toBeTruthy(); expect(path.description[language]).toBeTruthy(); path.readingPaths.forEach(reading => { expect(reading.title[language]).toBeTruthy(); expect(reading.description[language]).toBeTruthy(); }); });
      expect(Object.keys(pathCopy[language]).sort()).toEqual(Object.keys(pathCopy.en).sort());
    }
    for (const language of ['en','es','fr'] as const) {
      expect(new Set(modules.map(module => module.question[language])).size).toBe(70);
      expect(new Set(modules.map(module => module.text[language])).size).toBe(70);
      expect(new Set(modules.map(module => module.title[language])).size).toBe(70);
    }
    expect(new Set(modules.map(module => module.question.es)).size).toBe(modules.length);
    expect(new Set(modules.map(module => module.question.fr)).size).toBe(modules.length);
  });
  it('exposes only catalog metadata to accounts without beta access', () => {
    const publicJson = JSON.stringify(publicPathSummaries());
    expect(publicJson).not.toContain('plainLanguage'); expect(publicJson).not.toContain('sourceUrl'); expect(publicJson).not.toContain('"text":');
    modules.forEach(module => { expect(publicJson).not.toContain(module.question.en); expect(publicJson).not.toContain(module.text.en); });
  });
  it('includes substantial source passages and verifiable attribution', () => {
    modules.forEach(module => {
      expect(module.sourceUrl).toMatch(/^https:\/\//); expect(module.edition).toBeTruthy();
      expect(module.rightsEvidence.jurisdiction).toBe('US'); expect(module.rightsEvidence.statusUrl).toMatch(/^https:\/\//); expect(module.rightsEvidence.checkedAt).toBe('2026-10-14');
      expect(module.sourceKind).toBe('excerpt');
      for (const language of ['en','es','fr'] as const) {
        expect(module.text[language].split(/\s+/).length).toBeGreaterThanOrEqual(90);
        expect(module.text[language]).not.toMatch(/[…]$/);
      }
      const context = readingReasoningContext(module);
      expect(context).toContain(module.text.en); expect(context).toContain(module.question.en); expect(context).toContain(module.work.en);
    });
    expect(Object.keys(passageData.passages).sort()).toEqual(modules.map(module => module.id).sort());
    expect(passageData.schemaVersion).toBe(1);
    expect(getReadingModule('reading-achebe-culture-guide')).toBeUndefined();
    modules.forEach(module => expect(['public_domain_us', 'government_text']).toContain(module.rights));
  });
});
