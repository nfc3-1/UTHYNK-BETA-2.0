import { betaFeedbackCopy } from '@/lib/betaAssessment';

export default function BetaFeedbackNotice({ language }: { language: 'en' | 'es' | 'fr' }) {
  const copy = betaFeedbackCopy[language];
  return <p className="betaFeedbackNotice"><strong>{copy.title}.</strong> {copy.notice}</p>;
}
