import { describe, expect, it } from 'vitest';
import { thinkingPaths, getReadingModule, getThinkingPath, getPreviousReadingModules, publicPathSummaries, readingReasoningContext } from '../lib/thinkingPaths';
import { createHash } from 'node:crypto';
import originalIdentities from './fixtures/readingIdentities.v1.json';
import expandedIdentities from './fixtures/readingIdentities.v2.json';
import { getCategories } from '../lib/questionBank';
import { pathCopy } from '../lib/pathCopy';
import passageData from '../data/readingPassages.json';
const placements = thinkingPaths.flatMap(path => path.readingPaths).flatMap(path => path.modules);
const modules = [...new Map(placements.map(module => [module.id, module])).values()];
const previous = thinkingPaths.flatMap(path => path.readingPaths.flatMap(reading => getPreviousReadingModules(path.slug, reading.slug)));
const catalog = [...modules, ...previous];
describe('Thinking Paths catalog contract', () => {
  it('keeps thematic identities separate from existing challenge categories', () => {
    expect(thinkingPaths.map(path => path.title.en)).toEqual(['Power & Leadership','Freedom & Government','Meaning, Morality & Suffering','Truth & Knowledge','Human Nature','Civilizations & Culture','Economics & Society']);
    expect(thinkingPaths).toHaveLength(7); expect(placements).toHaveLength(210); expect(modules).toHaveLength(84);
    expect(new Set(modules.map(module => module.id)).size).toBe(modules.length);
    expect(new Set(thinkingPaths.map(path => path.slug)).size).toBe(thinkingPaths.length);
    thinkingPaths.forEach(path => {
      expect(getThinkingPath(path.slug)).toBe(path);
      expect(path.readingPaths).toHaveLength(3);
      path.readingPaths.forEach(reading => {
        expect(reading.modules).toHaveLength(10);
        expect(new Set(reading.modules.map(module => module.id)).size).toBe(10);
        for (const language of ['en','es','fr'] as const) expect(reading.practiceGoal?.[language]).toBeTruthy();
      });
      const starterIds = new Set(path.readingPaths[0].modules.map(module => module.id));
      path.readingPaths.slice(1).forEach(reading => expect(reading.modules.filter(module => !starterIds.has(module.id)).length).toBeGreaterThanOrEqual(4));
      expect(new Set(path.readingPaths.map(reading => reading.slug)).size).toBe(path.readingPaths.length);
    });
    modules.forEach(module => { expect(getReadingModule(module.id)).toBe(module); expect(getCategories()).toContain(module.category); });
    expect(getReadingModule('missing')).toBeUndefined();
  });
  it('offers at least six distinct authors and works per ten-part path, with at most two readings per author or work', () => {
    for (const path of thinkingPaths) for (const reading of path.readingPaths) {
      expect(new Set(reading.modules.map(module => module.author)).size).toBeGreaterThanOrEqual(6);
      expect(new Set(reading.modules.map(module => module.work.en)).size).toBeGreaterThanOrEqual(6);
      for (const field of ['author', 'sourceUrl'] as const) {
        const counts = new Map<string, number>();
        reading.modules.forEach(module => counts.set(module[field], (counts.get(module[field]) || 0) + 1));
        expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
      }
    }
    expect(new Set(thinkingPaths[6].readingPaths[0].modules.map(module => module.author)).size).toBe(9);
    expect(modules.filter(module => module.author === 'Adam Smith')).toHaveLength(2);
  });
  it('preserves every original reading and question under its old ID while giving replacements fresh identities', () => {
    expect(previous).toHaveLength(33);
    expect(catalog).toHaveLength(117);
    expect(new Set(catalog.map(module => module.id)).size).toBe(117);
    previous.forEach(module => expect(modules.some(active => active.id === module.id)).toBe(false));
    for (const [id, hash] of Object.entries({...originalIdentities,...expandedIdentities})) {
      const module = getReadingModule(id)!;
      expect(module, id).toBeTruthy();
      const content = JSON.stringify({ question: module.question, text: module.text, category: module.category });
      expect(createHash('sha256').update(content).digest('hex'), id).toBe(hash);
    }
    expect(Object.keys(originalIdentities)).toHaveLength(70);
    expect(Object.keys(expandedIdentities)).toHaveLength(103);
    expect(getPreviousReadingModules('missing', 'rulers-responsibility')).toEqual([]);
    expect(getPreviousReadingModules('power-leadership', 'the-examined-life')).toEqual([]);
  });
  it('covers every module and UI field in all three languages without generic substitution', () => {
    const textFields = ['title', 'work', 'location', 'text', 'plainLanguage', 'question'] as const;
    for (const module of catalog) for (const language of ['en', 'es', 'fr'] as const) {
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
      expect(new Set(modules.map(module => module.question[language])).size).toBe(84);
      expect(new Set(modules.map(module => module.text[language])).size).toBe(84);
      expect(new Set(modules.map(module => module.title[language])).size).toBe(84);
    }
    expect(new Set(modules.map(module => module.question.es)).size).toBe(modules.length);
    expect(new Set(modules.map(module => module.question.fr)).size).toBe(modules.length);
  });
  it('exposes only catalog metadata to accounts without beta access', () => {
    const publicJson = JSON.stringify(publicPathSummaries());
    expect(publicJson).not.toContain('plainLanguage'); expect(publicJson).not.toContain('sourceUrl'); expect(publicJson).not.toContain('"text":');
    catalog.forEach(module => { expect(publicJson).not.toContain(module.question.en); expect(publicJson).not.toContain(module.text.en); });
    previous.forEach(module => expect(publicJson).not.toContain(module.id));
  });
  it('includes substantial source passages and verifiable attribution', () => {
    catalog.forEach(module => {
      expect(module.sourceUrl).toMatch(/^https:\/\//); expect(module.edition).toBeTruthy();
      expect(module.rightsEvidence.jurisdiction).toBe('US'); expect(module.rightsEvidence.statusUrl).toMatch(/^https:\/\//); expect(['2026-10-14','2026-10-15']).toContain(module.rightsEvidence.checkedAt);
      expect(module.sourceKind).toBe('excerpt');
      for (const language of ['en','es','fr'] as const) {
        expect(module.text[language].split(/\s+/).length).toBeGreaterThanOrEqual(90);
        expect(module.text[language]).not.toMatch(/[…]$/);
      }
      const context = readingReasoningContext(module);
      expect(context).toContain(module.text.en); expect(context).toContain(module.question.en); expect(context).toContain(module.work.en);
    });
    expect(Object.keys(passageData.passages).sort()).toEqual(catalog.map(module => module.id).sort());
    expect(passageData.schemaVersion).toBe(1);
    expect(getReadingModule('reading-achebe-culture-guide')).toBeUndefined();
    modules.forEach(module => expect(['public_domain_us', 'government_text']).toContain(module.rights));
  });
});
