import { readFileSync } from 'node:fs';

const bank = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(readFileSync(new URL('../data/i18n/lessonQuestions.json', import.meta.url), 'utf8'));
const errors = [];
const ids = new Set();
const sources = new Set();
const legacyIds = new Set();
const review = [];
const categories = [];
for (const question of catalog) {
  if (!question.id || ids.has(question.id)) errors.push(`Duplicate or empty ID: ${question.id}`);
  ids.add(question.id);
  const sourceKey = JSON.stringify([question.category, question.source]);
  if (sources.has(sourceKey)) errors.push(`Duplicate source: ${question.id}`);
  sources.add(sourceKey);
  const legacyId = `${question.category}-${question.legacyIndex}`;
  if (!Number.isInteger(question.legacyIndex) || question.legacyIndex < 0 || legacyIds.has(legacyId)) errors.push(`Invalid legacy identity: ${question.id}`);
  legacyIds.add(legacyId);
  if (!bank[question.category]?.includes(question.source)) errors.push(`Stale or orphaned source: ${question.id}`);
  for (const language of ['es', 'fr']) {
    const translation = question.translations[language];
    if (!translation?.text?.trim() || translation.text === question.source) errors.push(`Missing translation: ${question.id}:${language}`);
    if (!['needs_review', 'approved'].includes(translation?.status)) errors.push(`Invalid review status: ${question.id}:${language}`);
    if (translation?.status === 'needs_review') review.push({ id: question.id, category: question.category, language });
  }
}
for (const [category, questions] of Object.entries(bank)) {
  const entries = catalog.filter(question => question.category === category);
  for (const source of questions) {
    if (!sources.has(JSON.stringify([category, source]))) errors.push(`Uncatalogued source: ${category}: ${source}`);
  }
  if (new Set(questions).size !== questions.length) errors.push(`Duplicate English source in ${category}`);
  const coverage = { category, total: questions.length };
  for (const language of ['es', 'fr']) {
    coverage[language] = entries.filter(question => question.translations[language]?.text?.trim()).length;
    const texts = entries.map(question => question.translations[language]?.text).filter(Boolean);
    if (new Set(texts).size !== texts.length) errors.push(`Duplicate translated prompts: ${category}:${language}`);
  }
  categories.push(coverage);
}
const report = { total: Object.values(bank).reduce((sum, questions) => sum + questions.length, 0), categories, coverageGaps: errors, editorialReview: review };
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.table(categories);
  console.log(`Coverage gaps: ${errors.length}. Translations awaiting editorial review: ${review.length}.`);
  for (const error of errors) console.error(error);
}
if (errors.length) process.exitCode = 1;
