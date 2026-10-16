import type { ReadingModule } from '@/lib/thinkingPathTypes';
import type { Language } from '@/lib/reasoningI18n';

/** Keep the second answer tied to the actual, authorized passage in JSON and SSE flows. */
export function groundReadingFollowUp<T extends { secondaryQuestion: string; followUp: string }>(feedback: T, reading: ReadingModule | undefined, language: Language, phase: 'follow_up' | 'synthesis'): T {
  if (!reading || phase === 'synthesis') return feedback;
  const text = reading.text[language].trim();
  const stretches = text.split(/[?!]/).filter(part => part.trim().split(/\s+/).length >= 8);
  const closingStretch = stretches[stretches.length - 1] || text.split(/[?!]/).sort((a,b) => b.length-a.length)[0];
  const excerpt = closingStretch.trim();
  const words = [...excerpt.matchAll(/\S+/g)];
  const quote = excerpt.slice(words[Math.max(0, words.length - 10)]?.index || 0).replace(/[.!?…"”’']+$/g, '');
  if (!quote || feedback.secondaryQuestion.includes(quote)) return feedback;
  const instruction = {
    en: `Use the passage’s wording “${quote}” and another detail from elsewhere in the passage to support or challenge your interpretation.`,
    es: `Usa las palabras del pasaje «${quote}» y otro detalle de otra parte del pasaje para apoyar o cuestionar tu interpretación.`,
    fr: `Utilise les mots du passage «${quote}» et un autre détail situé ailleurs dans le passage pour appuyer ou remettre en question ton interprétation.`,
  }[language];
  const secondaryQuestion = `${feedback.secondaryQuestion} ${instruction}`;
  return { ...feedback, secondaryQuestion, followUp: secondaryQuestion };
}
