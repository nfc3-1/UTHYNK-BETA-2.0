// Current sequences use distinct excerpts. The frozen catalog only restores previous URLs and sessions.
import connectedParts from '@/data/connectedReadingModules.json';
import connectedPaths from '@/data/connectedReadingPaths.json';
import passageData from '@/data/readingPassages.json';
import { thinkingPaths as previousPaths, getReadingModule as previousModule, getPreviousReadingModules as olderModules } from '@/lib/legacyReadingCatalog';
import type { ReadingModule, ThinkingPath, PathSummary } from '@/lib/thinkingPathTypes';

type Part = Omit<ReadingModule, 'text' | 'location' | 'contentNote'>;
type Passage = Pick<ReadingModule, 'text' | 'location' | 'sourceUrl' | 'contentNote'> & { checkedAt?: string };
const passages: Record<string, Passage> = passageData.passages;
const moduleLibrary = new Map<string, ReadingModule>();
for (const part of connectedParts as Part[]) {
  const passage = passages[part.id];
  if (!passage || part.sourceUrl !== passage.sourceUrl || moduleLibrary.has(part.id)) throw new Error(`Invalid connected reading: ${part.id}`);
  const { checkedAt: _checkedAt, ...content } = passage;
  moduleLibrary.set(part.id, { ...part, ...content });
}
const usedIds = new Set<string>();
const usedPassages = new Set<string>();
export const thinkingPaths: ThinkingPath[] = connectedPaths.map(path => ({
  ...path,
  readingPaths: path.readingPaths.map(({ moduleIds, ...reading }) => ({
    ...reading,
    modules: moduleIds.map(id => {
      const readingModule = moduleLibrary.get(id);
      if (!readingModule || usedIds.has(id)) throw new Error(`Missing or reused active reading: ${id}`);
      const textIdentity = readingModule.text.en.toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, ' ').trim();
      if (usedPassages.has(textIdentity)) throw new Error(`Reused active passage: ${id}`);
      usedIds.add(id); usedPassages.add(textIdentity);
      return readingModule;
    }),
  })),
}));
if (usedIds.size !== moduleLibrary.size) throw new Error('Connected catalog contains an unassigned reading.');
export function getCurrentReadingModules(): ReadingModule[] { return [...moduleLibrary.values()]; }
export function getThinkingPath(slug: string) { return thinkingPaths.find(path => path.slug === slug); }
export function getPreviousReadingModules(pathSlug: string, readingSlug: string): ReadingModule[] {
  const reading = previousPaths.find(path => path.slug === pathSlug)?.readingPaths.find(path => path.slug === readingSlug);
  if (!reading || !getThinkingPath(pathSlug)?.readingPaths.some(path => path.slug === readingSlug)) return [];
  return [...new Map([...reading.modules, ...olderModules(pathSlug, readingSlug)].map(item => [item.id, item])).values()];
}
export function getReadingModule(id: string) { return moduleLibrary.get(id) || previousModule(id); }
export function publicPathSummaries(): PathSummary[] {
  return thinkingPaths.map(path => ({ ...path, readingPaths: path.readingPaths.map(reading => ({ ...reading, modules: reading.modules.map(({ id, title, work, author }) => ({ id, title, work, author })) })) }));
}
export function readingReasoningContext(readingModule: ReadingModule) {
  return `Reading: ${readingModule.work.en} — ${readingModule.author}. ${readingModule.location.en}.\n${readingModule.sourceKind === 'excerpt' ? 'Excerpt' : 'UThynk guided adaptation of the referenced source'}: ${readingModule.text.en}\nContext: ${readingModule.plainLanguage.en}\nQuestion: ${readingModule.question.en}${readingModule.pathContext ? `\nSequence context: ${readingModule.pathContext}` : ''}\nReading-specific guidance: The learner must interpret the supplied passage and support the answer with its details. The secondary question must name or interpret a concrete detail, contrast, action, or wording actually present in this passage. Do not replace it with a general opinion question answerable without the text. If support is missing, invite attention to a specific detail without inventing a quotation or supplying the learner's answer. Do not assume earlier readings or answers have been completed. Keep exactly two learner answers and the existing four stages.`;
}
