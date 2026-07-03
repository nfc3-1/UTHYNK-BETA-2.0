import fs from 'node:fs';

const questionBank = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));

function slugifyCategory(category) {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/\band\b/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleForPrompt(prompt, index) {
  const firstClause = prompt
    .split('?')[0]
    .replace(/^(A|An|The|In)\s+/i, '')
    .trim();

  if (!firstClause) return `Scenario ${index + 1}`;

  return firstClause.length > 44 ? `${firstClause.slice(0, 41)}...` : firstClause;
}

function difficultyForIndex(index) {
  if (index < 8) return 'everyday';
  if (index < 16) return 'practical';
  if (index < 24) return 'critical';
  return 'strategic';
}

const challenges = Object.entries(questionBank).flatMap(([category, questions]) =>
  questions.map((prompt, index) => ({
    id: `${slugifyCategory(category)}-${String(index + 1).padStart(2, '0')}`,
    category: slugifyCategory(category),
    title: titleForPrompt(prompt, index),
    prompt,
    minutes: 3,
    xp: 20,
    difficulty: difficultyForIndex(index),
  }))
);

fs.writeFileSync('data/challenges.json', `${JSON.stringify(challenges, null, 2)}\n`);

console.log(`Regenerated ${challenges.length} challenges.`);
