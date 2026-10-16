import Link from 'next/link';
import type { Language } from '@/lib/reasoningI18n';
import styles from './BetaPracticeEntry.module.css';

const copy = {
  en: {
    title: 'Choose how to think today.', free: 'Try UThynk free during beta',
    access: 'No account, payment, or special access needed. Both options use the same four thinking steps.',
    challenges: 'Thinking Challenges', challengeDetail: 'Choose a topic and work through a question. Start with your own ideas.',
    paths: 'Reading Paths', pathDetail: 'Follow a connected theme, read a passage, and use its details to build your answer.',
    tryChallenges: 'Try a thinking challenge', tryPaths: 'Explore reading paths',
    local: 'Guest answers stay in this browser. Sign in to use your classroom and school records.',
    review: 'Spanish and French are working translations awaiting human review.',
  },
  es: {
    title: 'Elige cómo pensar hoy.', free: 'Prueba UThynk gratis durante la beta',
    access: 'Sin cuenta, pago ni acceso especial. Ambas opciones usan los mismos cuatro pasos de reflexión.',
    challenges: 'Desafíos de pensamiento', challengeDetail: 'Elige un tema y reflexiona sobre una pregunta. Empieza con tus propias ideas.',
    paths: 'Rutas de lectura', pathDetail: 'Sigue un tema, lee un pasaje y usa sus detalles para desarrollar tu respuesta.',
    tryChallenges: 'Probar un desafío', tryPaths: 'Explorar rutas de lectura',
    local: 'Las respuestas como invitado se guardan en este navegador. Inicia sesión para usar tu aula y los registros escolares.',
    review: 'Las traducciones al español y al francés están pendientes de revisión humana.',
  },
  fr: {
    title: 'Choisis comment réfléchir aujourd’hui.', free: 'Essaie UThynk gratuitement pendant la bêta',
    access: 'Sans compte, paiement ni accès spécial. Les deux options suivent les mêmes quatre étapes de réflexion.',
    challenges: 'Défis de réflexion', challengeDetail: 'Choisis un sujet et réfléchis à une question. Commence par tes propres idées.',
    paths: 'Parcours de lecture', pathDetail: 'Suis un thème, lis un passage et utilise ses détails pour construire ta réponse.',
    tryChallenges: 'Essayer un défi', tryPaths: 'Explorer les parcours de lecture',
    local: 'Les réponses des invités restent dans ce navigateur. Connecte-toi pour accéder à ta classe et aux dossiers scolaires.',
    review: 'Les traductions espagnoles et françaises attendent une révision humaine.',
  },
};

export default function BetaPracticeEntry({ language }: { language: Language }) {
  const text = copy[language];
  return <section className={`card ${styles.entry}`} aria-labelledby="beta-practice-title" data-beta-practice>
    <p className={styles.eyebrow}>{text.free}</p>
    <h2 id="beta-practice-title">{text.title}</h2>
    <p className={styles.intro}>{text.access}</p>
    <div className={styles.choices}>
      <article><h3>{text.challenges}</h3><p>{text.challengeDetail}</p><Link href="/lessons" className="btn">{text.tryChallenges} <span aria-hidden="true">→</span></Link></article>
      <article><h3>{text.paths}</h3><p>{text.pathDetail}</p><Link href="/thinking-paths" className="btn">{text.tryPaths} <span aria-hidden="true">→</span></Link></article>
    </div>
    <p className={styles.note}>{text.local}</p>
    {language !== 'en' && <p className={styles.note}>{text.review}</p>}
  </section>;
}
