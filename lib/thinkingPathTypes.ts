import type { Language } from '@/lib/reasoningI18n';
export type PathText = Record<Language, string>;
export type ReadingModule = {
  id: string; title: PathText; work: PathText; author: string; edition: string;
  location: PathText; sourceUrl: string;
  sourceKind: 'excerpt' | 'guided_reading';
  rights: 'public_domain_us' | 'government_text';
  rightsEvidence: { jurisdiction: 'US'; statusUrl: string; checkedAt: string };
  editorialStatus: 'needs_review' | 'approved';
  text: PathText; plainLanguage: PathText; lenses: [PathText, PathText];
  question: PathText; category: string; contentNote?: PathText;
};
export type ReadingPath = { slug: string; title: PathText; description: PathText; practiceGoal?: PathText; connections?: PathText[]; modules: ReadingModule[] };
export type ThinkingPath = { slug: string; title: PathText; description: PathText; readingPaths: ReadingPath[] };
export type PathSummary = Omit<ThinkingPath, 'readingPaths'> & {
  readingPaths: Array<Omit<ReadingPath, 'modules'> & { modules: Array<Pick<ReadingModule, 'id' | 'title' | 'work' | 'author'>> }>;
};
