import { rubricCopy } from '@/lib/pointRubric';
import { observationCopy, type SavedAssessment } from '@/lib/qualitativeAssessment';

export default function ReasoningObservations({ assessment, language }: { assessment?: SavedAssessment | null; language: 'en' | 'es' | 'fr' }) {
  if (!assessment) return null;
  const copy = observationCopy[language];
  if (assessment.rubricVersion !== 'reasoning-feedback-v1') return <p className="subtle">{copy.legacy}</p>;
  return <section className="reasoningObservations" aria-label={copy.title}>
    <h3>{copy.title}</h3>
    <p className="subtle">{copy.provisional}</p>
    {assessment.language !== language && <p className="subtle">{copy.savedLanguage}: {({en: "English", es: "Español", fr: "Français"})[assessment.language]}</p>}
    {assessment.observations.map(item => <article className="focusCard" key={item.id}>
      <h4>{rubricCopy[language].labels[item.id]}</h4>
      <strong>{copy[item.status]}</strong>
      {item.note && <p>{item.note}</p>}
      {item.evidence.length > 0 && <div aria-label={copy.support}><p className="subtle">{copy.support}</p>{item.evidence.map((quote, i) => <blockquote key={i}>{quote}</blockquote>)}</div>}
    </article>)}
    {assessment.nextFocus && <p><strong>{copy.next}: </strong>{assessment.nextFocus}</p>}
  </section>;
}
