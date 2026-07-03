import fs from 'node:fs';

const questionBank = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));
const categories = JSON.parse(fs.readFileSync('data/categories.json', 'utf8'));
const challenges = JSON.parse(fs.readFileSync('data/challenges.json', 'utf8'));

const expectedCategories = [
  'Logic & Critical Thinking',
  'Epistemology',
  'Ethics & Moral Reasoning',
  'Strategic Thinking',
  'Street Lessons',
  'Financial Judgment',
  'Leadership & Influence',
  'Media & Information Literacy',
  'Science & Evidence',
  'History & Civilization',
  'Technology & AI',
  'Creativity & Innovation',
  'Work, Purpose & Ambition',
  'Identity & Human Behavior',
  'Literature & Timeless Wisdom',
];

const sourceAnchors = {
  'Logic & Critical Thinking': [
    'ad',
    'advertisement',
    'commercial',
    'political',
    'speech',
    'sales',
    'pitch',
    'debate',
    'social media',
    'courtroom',
    'marketing',
    'public claim',
  ],
  Epistemology: [
    'news',
    'expert',
    'eyewitness',
    'rumor',
    'viral',
    'doctor',
    'scientist',
    'scientific',
    'study',
    'source',
    'report',
  ],
  'Ethics & Moral Reasoning': [
    'school',
    'hospital',
    'family',
    'workplace',
    'business',
    'sports',
    'government',
    'ethics',
    'student',
    'coach',
    'patient',
    'employee',
  ],
  'Strategic Thinking': [
    'military',
    'business',
    'sports',
    'negotiation',
    'investing',
    'politics',
    'political',
    'strategy',
    'career',
    'netflix',
    'blockbuster',
    'coach',
    'investor',
  ],
  'Street Lessons': [
    'work',
    'coworker',
    'neighborhood',
    'friend',
    'family',
    'business',
    'negotiation',
    'trust',
    'reputation',
    'manager',
    'customer',
  ],
  'Financial Judgment': [
    'mortgage',
    'car',
    'invest',
    'credit card',
    'retirement',
    'business',
    'budget',
    'warren buffett',
    'charlie munger',
    'loan',
    'interest',
  ],
  'Leadership & Influence': [
    'principal',
    'coach',
    'ceo',
    'military',
    'parent',
    'teacher',
    'manager',
    'team',
    'leader',
  ],
  'Media & Information Literacy': [
    'youtube',
    'tiktok',
    'x',
    'facebook',
    'podcast',
    'tv',
    'headline',
    'viral',
    'video',
    'ai-generated',
    'news',
  ],
  'Science & Evidence': [
    'medical',
    'nutrition',
    'exercise',
    'weather',
    'vaccine',
    'climate',
    'experiment',
    'statistic',
    'study',
    'headline',
  ],
  'History & Civilization': [
    'roman',
    'business history',
    'american revolution',
    'apollo',
    'challenger',
    'berlin airlift',
    'printing press',
    'great depression',
    'reconstruction',
    'black death',
    'cold war',
    'civil rights',
    'cuban missile',
    'industrial revolution',
    'world war',
    'marshall plan',
    'history',
  ],
  'Technology & AI': [
    'chatgpt',
    'autonomous',
    'deepfake',
    'privacy',
    'cybersecurity',
    'algorithm',
    'social media',
    'ai',
    'company',
  ],
  'Creativity & Innovation': [
    'apple',
    'lego',
    'dyson',
    'airbnb',
    'spacex',
    'restaurant',
    'inventor',
    'entrepreneur',
    'innovation',
    'artist',
    'nonprofit',
    'library',
    'fashion',
    'family',
    'company',
  ],
  'Work, Purpose & Ambition': [
    'promotion',
    'career',
    'entrepreneur',
    'burnout',
    'overtime',
    'interview',
    'military',
    'apprentice',
    'job',
    'work',
  ],
  'Identity & Human Behavior': [
    'friend',
    'parent',
    'relationship',
    'habit',
    'social pressure',
    'feedback',
    'confidence',
    'failure',
    'family',
  ],
  'Literature & Timeless Wisdom': [
    'odyssey',
    'shakespeare',
    'aesop',
    'great gatsby',
    'to kill a mockingbird',
    'prince',
    'art of war',
    'story',
    'proverb',
    'character',
    'book',
  ],
};

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesAnchor(category, question) {
  const lower = question.toLowerCase();
  return sourceAnchors[category].some((anchor) => lower.includes(anchor));
}

const questionCategories = Object.keys(questionBank);

if (questionCategories.length !== expectedCategories.length) {
  fail(`Expected ${expectedCategories.length} categories, found ${questionCategories.length}.`);
}

expectedCategories.forEach((category) => {
  if (!questionBank[category]) {
    fail(`Missing question category: ${category}`);
  }
});

questionCategories.forEach((category) => {
  const questions = questionBank[category];
  if (questions.length !== 30) {
    fail(`${category} should have 30 questions, found ${questions.length}.`);
  }

  const unanchored = questions.filter((question) => !includesAnchor(category, question));
  if (unanchored.length) {
    fail(`${category} has ${unanchored.length} unanchored questions:\n- ${unanchored.join('\n- ')}`);
  }
});

if (categories.length !== expectedCategories.length) {
  fail(`Expected ${expectedCategories.length} metadata categories, found ${categories.length}.`);
}

categories.forEach((category) => {
  if (!Array.isArray(category.sourceMaterial) || category.sourceMaterial.length < 5) {
    fail(`${category.name} needs sourceMaterial metadata.`);
  }
});

if (challenges.length !== 450) {
  fail(`Expected 450 generated challenges, found ${challenges.length}.`);
}

if (!process.exitCode) {
  console.log('Question bank QA passed: 15 categories, 30 anchored questions each, 450 challenges.');
}
