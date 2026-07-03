import data from '@/data/questions.json';
import metadata from '@/data/categories.json';

export type QuestionBank = Record<string, string[]>;
export type CategoryMetadata = {
  coachingLens: string;
  description: string;
  name: string;
  purpose: string;
  shortDescription: string;
  slug: string;
  subtitle: string;
  title: string;
  sourceMaterial?: string[];
};

export const questionBank = data as QuestionBank;
export const categoryMetadata = metadata as CategoryMetadata[];

export function slugifyCategory(category: string) {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/\band\b/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function canonicalizeSlug(slug: string) {
  return slug
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/(^|-)and(-|$)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategories() {
  return Object.keys(questionBank);
}

export function getCategoryMetadata(category: string) {
  return categoryMetadata.find((item) => item.title === category || item.name === category);
}

export function getCategoryMetadataBySlug(slug: string) {
  const requested = canonicalizeSlug(slug);

  return categoryMetadata.find((item) => canonicalizeSlug(item.slug) === requested);
}

export function getQuestionsForCategory(category: string) {
  return questionBank[category] || [];
}

export function getCategoryBySlug(slug: string) {
  const requested = canonicalizeSlug(slug);

  return getCategories().find((category) => canonicalizeSlug(slugifyCategory(category)) === requested);
}
