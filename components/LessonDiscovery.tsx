import Link from 'next/link';
import { slugifyCategory } from '@/lib/questionBank';
import { localizeCategory, type Language } from '@/lib/reasoningI18n';
import styles from './LessonDiscovery.module.css';

const copy = {
  en: {
    nav: 'All lessons', title: 'There’s more than the daily challenge.',
    description: 'Choose a topic you care about and pick a question from the full lesson library.',
    explore: 'Explore all lessons', stats: (lessons: number, categories: number) => `${lessons} thinking lessons · ${categories} categories`,
    guideTitle: 'How to choose a lesson', guideIntro: 'You can choose your own lesson here, even after finishing the daily challenge.',
    steps: [
      { title: 'Pick a category', text: 'Tap a category card below to open its collection of questions.' },
      { title: 'Pick a question', text: 'On the next screen, tap “Start with this” beside the question you want.' },
      { title: 'Think it through', text: 'Give your answer, explore a new angle, answer the follow-up, and read the final synthesis.' },
    ],
    try: 'Try a category', questions: 'Choose a question from this category',
  },
  es: {
    nav: 'Todas las lecciones', title: 'Hay más que el desafío diario.',
    description: 'Elige un tema que te interese y una pregunta de la biblioteca completa de lecciones.',
    explore: 'Explorar todas las lecciones', stats: (lessons: number, categories: number) => `${lessons} lecciones de pensamiento · ${categories} categorías`,
    guideTitle: 'Cómo elegir una lección', guideIntro: 'Aquí puedes elegir tu propia lección, incluso después de terminar el desafío diario.',
    steps: [
      { title: 'Elige una categoría', text: 'Pulsa una tarjeta de categoría de abajo para abrir su colección de preguntas.' },
      { title: 'Elige una pregunta', text: 'En la siguiente pantalla, pulsa «Empezar con esta» junto a la pregunta que quieras.' },
      { title: 'Piensa a fondo', text: 'Da tu respuesta, explora otro ángulo, responde la pregunta siguiente y lee la síntesis final.' },
    ],
    try: 'Probar una categoría', questions: 'Elige una pregunta de esta categoría',
  },
  fr: {
    nav: 'Toutes les leçons', title: 'Il y a plus que le défi du jour.',
    description: 'Choisis un sujet qui t’intéresse et une question dans la bibliothèque complète de leçons.',
    explore: 'Explorer toutes les leçons', stats: (lessons: number, categories: number) => `${lessons} leçons de réflexion · ${categories} catégories`,
    guideTitle: 'Comment choisir une leçon', guideIntro: 'Ici, tu peux choisir ta propre leçon, même après avoir terminé le défi du jour.',
    steps: [
      { title: 'Choisis une catégorie', text: 'Appuie sur une carte de catégorie ci-dessous pour ouvrir ses questions.' },
      { title: 'Choisis une question', text: 'Sur l’écran suivant, appuie sur «Commencer avec celle-ci» à côté de la question choisie.' },
      { title: 'Réfléchis', text: 'Donne ta réponse, explore un nouvel angle, réponds à la question suivante et lis la synthèse finale.' },
    ],
    try: 'Essayer une catégorie', questions: 'Choisis une question dans cette catégorie',
  },
};

export function LessonsNavLink({ language }: { language: Language }) {
  return <Link href="/lessons" className={styles.navLink}>{copy[language].nav}</Link>;
}

export function LessonDiscoveryBanner({ language, lessonCount, categoryCount }: { language: Language; lessonCount: number; categoryCount: number }) {
  const text = copy[language];
  return <section className={styles.banner} aria-label={text.nav}>
    <div><small>{text.stats(lessonCount, categoryCount)}</small><h2>{text.title}</h2><p>{text.description}</p></div>
    <Link className="btn btnPrimary" href="/lessons">{text.explore} <span aria-hidden="true">→</span></Link>
  </section>;
}

function GuideIllustration({ step }: { step: number }) {
  return <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true" focusable="false">
    {step === 0 ? <><rect x="14" y="14" width="38" height="22" rx="5" /><rect x="64" y="14" width="38" height="22" rx="5" /><rect x="14" y="46" width="38" height="22" rx="5" /><rect x="64" y="46" width="38" height="22" rx="5" className={styles.selected} /></>
      : step === 1 ? <><rect x="18" y="9" width="83" height="62" rx="8" /><path d="M30 23h54M30 37h54M30 51h33" /><path d="M74 47l24 12-14 3-5 13z" className={styles.selected} /></>
      : <><path d="M12 14h67v31H44L30 58V45H12z" /><path d="M53 48h53v24H83l-12 7v-7H53z" className={styles.selected} /><path d="M27 27h34M66 59h25" /></>}
  </svg>;
}

export function LessonLibraryGuide({ language, categories }: {
  language: Language; categories: Array<{ category: string; count: number }>;
}) {
  const text = copy[language];
  const example = categories.find(category => category.count > 0);
  return <section className={styles.guide} aria-label={text.guideTitle}>
    <h2>{text.guideTitle}</h2><p>{text.guideIntro}</p>
    <ol className={styles.steps}>{text.steps.map((step, index) => <li key={index}>
      <GuideIllustration step={index} /><div><span className={styles.number}>{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></div>
    </li>)}</ol>
    {example ? <Link href={`/lessons/${slugifyCategory(example.category)}`} className={styles.exampleLink}>
      {text.try}: {localizeCategory(example.category, language)} <span aria-hidden="true">→</span>
    </Link> : null}
  </section>;
}

export function LessonQuestionListHint({ language }: { language: Language }) {
  return <h3 className={styles.listHint}>{copy[language].questions}</h3>;
}

export function lessonLibraryStats(language: Language, counts: Array<{ count: number }>) {
  return copy[language].stats(counts.reduce((sum, category) => sum + category.count, 0), counts.length);
}
