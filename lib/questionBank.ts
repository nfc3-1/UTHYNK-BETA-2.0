import data from '@/data/questions.json';

export type QuestionBank = Record<string, string[]>;

export const questionBank = data as QuestionBank;

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

export function getCategories() {
  return Object.keys(questionBank);
}

export function getQuestionsForCategory(category: string) {
  return questionBank[category] || [];
}

export function getCategoryBySlug(slug: string) {
  return getCategories().find((category) => slugifyCategory(category) === slug);
}
