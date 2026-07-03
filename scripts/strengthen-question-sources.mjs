import fs from 'node:fs';

const questionPath = 'data/questions.json';
const questionBank = JSON.parse(fs.readFileSync(questionPath, 'utf8'));

const sourceFrames = {
  'Logic & Critical Thinking': [
    'In a public claim',
    'In a political speech',
    'In a sales pitch',
    'In a social media debate',
    'In courtroom-style argument',
    'In company marketing',
  ],
  Epistemology: [
    'In a news report',
    'During an expert disagreement',
    'In eyewitness testimony',
    'In a viral post',
    'In a scientific disagreement',
    'In a rumor spreading through a community',
  ],
  'Ethics & Moral Reasoning': [
    'In a workplace',
    'At a school',
    'In a hospital',
    'Inside a family decision',
    'In a local business',
    'In a government decision',
  ],
  'Strategic Thinking': [
    'In a business decision',
    'In sports strategy',
    'During a negotiation',
    'In investing',
    'In a political campaign',
    'During a career decision',
  ],
  'Street Lessons': [
    'At work',
    'In a neighborhood',
    'In a friendship',
    'Inside a family conflict',
    'In a business deal',
    'During a negotiation',
  ],
  'Financial Judgment': [
    'When thinking about a mortgage',
    'When buying a car',
    'In an investing decision',
    'With credit card debt',
    'During retirement planning',
    'In a family budget',
  ],
  'Leadership & Influence': [
    'As a coach',
    'As a principal',
    'As a CEO',
    'As a military leader',
    'As a teacher',
    'As a manager',
  ],
  'Media & Information Literacy': [
    'In a YouTube clip',
    'In a TikTok video',
    'On X',
    'On Facebook',
    'In a podcast',
    'In a TV news segment',
  ],
  'Science & Evidence': [
    'In a medical study',
    'In a nutrition headline',
    'In an exercise claim',
    'In a weather forecast',
    'In a vaccine debate',
    'In an experiment',
  ],
  'History & Civilization': [
    'In Roman history',
    'During the American Revolution',
    'During Apollo 13',
    'After the Challenger disaster',
    'During the Civil Rights Movement',
    'During World War II',
  ],
  'Technology & AI': [
    'With ChatGPT',
    'With autonomous vehicles',
    'In a deepfake case',
    'In a privacy dispute',
    'After a cybersecurity breach',
    'In a social media algorithm',
  ],
  'Creativity & Innovation': [
    'At Apple',
    'At LEGO',
    'At Dyson',
    'At Airbnb',
    'At SpaceX',
    'In a local restaurant',
  ],
  'Work, Purpose & Ambition': [
    'During a promotion decision',
    'In a career change',
    'In entrepreneurship',
    'During burnout',
    'During an interview',
    'In an apprenticeship',
  ],
  'Identity & Human Behavior': [
    'In a friendship',
    'In parenting',
    'In a relationship',
    'With a habit',
    'Under social pressure',
    'After receiving feedback',
  ],
  'Literature & Timeless Wisdom': [
    'In The Odyssey',
    'In Shakespeare',
    'In an Aesop fable',
    'In The Great Gatsby',
    'In To Kill a Mockingbird',
    'In The Art of War',
  ],
};

const sourceAnchors = {
  'Logic & Critical Thinking': ['ad', 'advertisement', 'commercial', 'political', 'speech', 'sales', 'pitch', 'debate', 'social media', 'courtroom', 'marketing', 'public claim'],
  Epistemology: ['news', 'expert', 'eyewitness', 'rumor', 'viral', 'doctor', 'scientist', 'scientific', 'study', 'source', 'report'],
  'Ethics & Moral Reasoning': ['school', 'hospital', 'family', 'workplace', 'business', 'sports', 'government', 'ethics', 'student', 'coach', 'patient', 'employee'],
  'Strategic Thinking': ['military', 'business', 'sports', 'negotiation', 'investing', 'politics', 'political', 'strategy', 'career', 'netflix', 'blockbuster', 'coach', 'investor'],
  'Street Lessons': ['work', 'coworker', 'neighborhood', 'friend', 'family', 'business', 'negotiation', 'trust', 'reputation', 'manager', 'customer'],
  'Financial Judgment': ['mortgage', 'car', 'invest', 'credit card', 'retirement', 'business', 'budget', 'warren buffett', 'charlie munger', 'loan', 'interest'],
  'Leadership & Influence': ['principal', 'coach', 'ceo', 'military', 'parent', 'teacher', 'manager', 'team', 'leader'],
  'Media & Information Literacy': ['youtube', 'tiktok', 'x', 'facebook', 'podcast', 'tv', 'headline', 'viral', 'video', 'ai-generated', 'news'],
  'Science & Evidence': ['medical', 'nutrition', 'exercise', 'weather', 'vaccine', 'climate', 'experiment', 'statistic', 'study', 'headline'],
  'History & Civilization': ['roman', 'business history', 'american revolution', 'apollo', 'challenger', 'berlin airlift', 'printing press', 'great depression', 'reconstruction', 'black death', 'cold war', 'civil rights', 'cuban missile', 'industrial revolution', 'world war', 'marshall plan', 'history'],
  'Technology & AI': ['chatgpt', 'autonomous', 'deepfake', 'privacy', 'cybersecurity', 'algorithm', 'social media', 'ai', 'company'],
  'Creativity & Innovation': ['apple', 'lego', 'dyson', 'airbnb', 'spacex', 'restaurant', 'inventor', 'entrepreneur', 'innovation', 'artist', 'nonprofit', 'library', 'fashion', 'family', 'company'],
  'Work, Purpose & Ambition': ['promotion', 'career', 'entrepreneur', 'burnout', 'overtime', 'interview', 'military', 'apprentice', 'job', 'work'],
  'Identity & Human Behavior': ['friend', 'parent', 'relationship', 'habit', 'social pressure', 'feedback', 'confidence', 'failure', 'family'],
  'Literature & Timeless Wisdom': ['odyssey', 'shakespeare', 'aesop', 'great gatsby', 'to kill a mockingbird', 'prince', 'art of war', 'story', 'proverb', 'character', 'book'],
};

const allFrames = Object.values(sourceFrames).flat();

function stripGeneratedFrame(question) {
  const match = allFrames.find((frame) => question.startsWith(`${frame}, `));
  if (!match) return question;

  const stripped = question.slice(match.length + 2);
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function includesAnchor(category, question) {
  const lower = question.toLowerCase();
  return sourceAnchors[category].some((anchor) => lower.includes(anchor));
}

function chooseFrame(category, question, index) {
  const lower = question.toLowerCase();

  if (category === 'History & Civilization') {
    if (lower.includes('kodak') || lower.includes('nokia') || lower.includes('blockbuster')) {
      return 'In business history';
    }
    if (lower.includes('rome')) return 'In Roman history';
    if (lower.includes('berlin airlift')) return 'During the Berlin Airlift';
    if (lower.includes('printing press')) return 'In printing press history';
    if (lower.includes('great depression')) return 'During the Great Depression';
    if (lower.includes('reconstruction')) return 'During Reconstruction history';
    if (lower.includes('black death')) return 'After the Black Death';
    if (lower.includes('cold war')) return 'During the Cold War';
  }

  if (category === 'Creativity & Innovation') {
    if (lower.includes('teacher') || lower.includes('student')) return 'In a classroom innovation challenge';
    if (lower.includes('store')) return 'In a local store innovation challenge';
    if (lower.includes('park') || lower.includes('bus route')) return 'In a city innovation challenge';
    if (lower.includes('startup')) return 'In an entrepreneur case';
    if (lower.includes('family') || lower.includes('parent')) return 'In a family creativity challenge';
    if (lower.includes('musician')) return 'In an artist innovation challenge';
    if (lower.includes('nonprofit')) return 'In a nonprofit innovation challenge';
    if (lower.includes('coffee shop') || lower.includes('bakery')) return 'In a restaurant innovation challenge';
    if (lower.includes('gym')) return 'In a local business innovation challenge';
    if (lower.includes('library')) return 'In a library innovation challenge';
    if (lower.includes('clothing brand')) return 'In a fashion innovation challenge';
  }

  if (category === 'Literature & Timeless Wisdom') {
    if (lower.includes('many stories') || lower.includes('character')) return 'In a well-known story pattern';
    if (lower.includes('student')) return 'In an Aesop-style lesson';
    if (lower.includes('proverb')) return 'In a proverb';
    if (lower.includes('worker') || lower.includes('business owner') || lower.includes('manager')) {
      return 'In a modern story about character';
    }
  }

  if (category === 'Strategic Thinking') {
    if (lower.includes('student') || lower.includes('worker') || lower.includes('person') || lower.includes('family')) {
      return 'During a career or life strategy decision';
    }
    if (lower.includes('city') || lower.includes('community') || lower.includes('politician')) {
      return 'In a political strategy decision';
    }
    if (lower.includes('company') || lower.includes('startup') || lower.includes('store') || lower.includes('brand')) {
      return 'In a business decision';
    }
  }

  if (category === 'Ethics & Moral Reasoning') {
    if (lower.includes('city')) return 'In a government ethics decision';
    if (lower.includes('company')) return 'In a business ethics decision';
    if (lower.includes('friend') || lower.includes('parent')) return 'Inside a family or friendship decision';
  }

  return sourceFrames[category][index % sourceFrames[category].length];
}

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

let updated = 0;

for (const [category, questions] of Object.entries(questionBank)) {
  questionBank[category] = questions.map((question, index) => {
    if (includesAnchor(category, question)) return question;

    question = stripGeneratedFrame(question);
    if (includesAnchor(category, question)) return question;

    updated += 1;
    const frame = chooseFrame(category, question, index);
    return `${frame}, ${lowerFirst(question)}`;
  });
}

fs.writeFileSync(questionPath, `${JSON.stringify(questionBank, null, 2)}\n`);

console.log(`Strengthened ${updated} questions.`);
