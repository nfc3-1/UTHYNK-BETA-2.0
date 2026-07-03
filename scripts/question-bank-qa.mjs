import fs from 'node:fs';

const questionBank = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));
const categories = JSON.parse(fs.readFileSync('data/categories.json', 'utf8'));

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

const concreteAnchors = [
  'ad',
  'audio',
  'articles',
  'barber',
  'bookstore',
  'borrower',
  'brand',
  'business',
  'buyer',
  'car',
  'church',
  'city',
  'classmate',
  'coach',
  'college',
  'community',
  'company',
  'couple',
  'coworker',
  'creator',
  'customer',
  'dealer',
  'doctor',
  'documentary',
  'driverless',
  'employee',
  'family',
  'farm',
  'feed',
  'fitness',
  'friend',
  'government',
  'group',
  'gym',
  'headline',
  'hospital',
  'hotel',
  'influencer',
  'lab',
  'leader',
  'manager',
  'mechanic',
  'money',
  'museum',
  'neighbor',
  'news',
  'parent',
  'person',
  'poll',
  'post',
  'platform',
  'podcast',
  'politician',
  'principal',
  'product',
  'school',
  'scientist',
  'shop',
  'shopper',
  'social media',
  'someone',
  'startup',
  'store',
  'student',
  'supervisor',
  'teacher',
  'team',
  'teenager',
  'user',
  'video',
  'voter',
  'worker',
  'workplace',
  'website',
  'youtube',
  'tiktok',
  'x',
  'facebook',
  'chatbot',
  'ai',
  'algorithm',
  'privacy',
  'deepfake',
  'cybersecurity',
  'rome',
  'roman',
  'kodak',
  'toyota',
  'tylenol',
  'athens',
  'prohibition',
  'apollo',
  'challenger',
  'cuban missile',
  'civil rights',
  'berlin wall',
  'berlin airlift',
  'magna carta',
  'salem',
  'montgomery',
  'space race',
  'hamlet',
  'gatsby',
  'aesop',
  'shakespeare',
  'odyssey',
  'macbeth',
  'mockingbird',
  'animal farm',
  'christmas carol',
  'giving tree',
  'crucible',
  'grapes of wrath',
  'alchemist',
  'intelligent investor',
  'old man and the sea',
  'art of war',
  'prince',
];

const oldBroadPrompts = [
  ['Does history move', 'in cycles or progress forward?'].join(' '),
  ['Does correlation ever', 'justify action?'].join(' '),
  ['Do stories teach better', 'than lectures?'].join(' '),
  ['Is privacy possible', 'in a data-rich world?'].join(' '),
  ['Take a payday loan', 'for rent or seek alternatives?'].join(' '),
  ['Are influencers reviewers', 'or marketers?'].join(' '),
  ['Does failure teach more', 'than success?'].join(' '),
  ['Are human rights universal', 'or cultural?'].join(' '),
  ['Do constraints boost', 'creativity?'].join(' '),
  ['Should everyone have', 'a side hustle?'].join(' '),
];

const bannedQuestionStart = /^(What is|Why is|Is it important|Should people|Can people|Do people|What does it mean|How important is)\b/i;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesAnchor(category, question) {
  const lower = question.toLowerCase();
  return (
    sourceAnchors[category].some((anchor) => lower.includes(anchor)) ||
    concreteAnchors.some((anchor) => lower.includes(anchor))
  );
}

const questionCategories = Object.keys(questionBank);

if (questionCategories.length !== expectedCategories.length) {
  fail(`Expected ${expectedCategories.length} categories, found ${questionCategories.length}.`);
}

if (JSON.stringify(questionCategories) !== JSON.stringify(expectedCategories)) {
  fail('Question categories must match the canonical 15-category order exactly.');
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

  const vagueStarters = questions.filter((question) => bannedQuestionStart.test(question));
  if (vagueStarters.length) {
    fail(`${category} has banned vague starters:\n- ${vagueStarters.join('\n- ')}`);
  }

  const longQuestions = questions.filter((question) => question.split(/\s+/).filter(Boolean).length > 40);
  if (longQuestions.length) {
    fail(`${category} has questions over 40 words:\n- ${longQuestions.join('\n- ')}`);
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

const filesToSearch = [
  'app',
  'components',
  'data',
  'lib',
  'scripts',
].flatMap((path) => {
  const results = [];
  const stack = [path];

  while (stack.length) {
    const current = stack.pop();
    const stat = fs.statSync(current);

    if (stat.isDirectory()) {
      fs.readdirSync(current).forEach((entry) => stack.push(`${current}/${entry}`));
    } else {
      results.push(current);
    }
  }

  return results;
});

for (const file of filesToSearch) {
  if (!/\.(js|jsx|ts|tsx|json|mjs|md|css)$/.test(file)) continue;

  const content = fs.readFileSync(file, 'utf8');
  oldBroadPrompts.forEach((prompt) => {
    if (content.includes(prompt)) {
      fail(`Old broad prompt still appears in ${file}: ${prompt}`);
    }
  });
}

if (!process.exitCode) {
  console.log('Question bank QA passed: 15 categories, 30 grounded questions each, one canonical source.');
}
