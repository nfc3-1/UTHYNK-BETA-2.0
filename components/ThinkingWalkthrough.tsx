'use client';

import { useEffect, useId, useState } from 'react';
import type { Language } from '@/lib/reasoningI18n';
import styles from './ThinkingWalkthrough.module.css';

export const VISUAL_GUIDE_DISMISSED = 'uthynk-visual-guide-dismissed-v1';
const guideCopy = {
  en: {
    title: 'How to use UThynk', intro: 'See it in action. Two answers. One new angle. Better thinking.',
    watch: 'Watch an example', close: 'Start thinking', pause: 'Pause', play: 'Play', replay: 'Replay',
    next: 'Next step', previous: 'Previous step', example: 'Example only — these are not your answers',
    you: 'You', question: 'Should phones be allowed during class?',
    steps: [
      { title: 'Give your answer', hint: 'Say what you think and why. A short answer is enough. Type or hold the talk button.', prompt: 'Should phones be allowed during class?', response: 'No, because messages can distract us.' },
      { title: 'Look at another angle', hint: 'Read the new perspective. You can change your mind or keep your view — explain why.', prompt: 'What if someone needs a phone for learning or an emergency?', response: '' },
      { title: 'Answer the follow-up', hint: 'Use the new angle to answer one more question.', prompt: 'What rule would reduce distractions and still help people who need a phone?', response: 'Keep phones away unless the teacher says to use them.' },
      { title: 'See how your ideas connect', hint: 'Read the final synthesis. Notice what you kept, changed, or still need to test.', prompt: 'You began with a ban. Then you considered exceptions. Your idea now balances focus with useful phone access.', response: '' },
    ],
  },
  es: {
    title: 'Cómo usar UThynk', intro: 'Mira cómo funciona. Dos respuestas. Un nuevo ángulo. Piensa mejor.',
    watch: 'Ver un ejemplo', close: 'Empezar a pensar', pause: 'Pausar', play: 'Reproducir', replay: 'Repetir',
    next: 'Paso siguiente', previous: 'Paso anterior', example: 'Solo un ejemplo: estas no son tus respuestas',
    you: 'Tú', question: '¿Se deberían permitir los teléfonos durante la clase?',
    steps: [
      { title: 'Da tu respuesta', hint: 'Di qué piensas y por qué. Una respuesta breve basta. Escribe o mantén pulsado el botón para hablar.', prompt: '¿Se deberían permitir los teléfonos durante la clase?', response: 'No, porque los mensajes pueden distraernos.' },
      { title: 'Mira otro ángulo', hint: 'Lee la nueva perspectiva. Puedes cambiar de opinión o mantenerla: explica por qué.', prompt: '¿Y si alguien necesita un teléfono para aprender o para una emergencia?', response: '' },
      { title: 'Responde la pregunta siguiente', hint: 'Usa el nuevo ángulo para responder una pregunta más.', prompt: '¿Qué regla reduciría las distracciones y ayudaría a quienes necesitan un teléfono?', response: 'Guardar los teléfonos salvo cuando el profesor indique que se usen.' },
      { title: 'Ve cómo se conectan tus ideas', hint: 'Lee la síntesis final. Observa qué mantuviste, qué cambiaste y qué falta comprobar.', prompt: 'Empezaste con una prohibición. Después consideraste excepciones. Tu idea ahora equilibra la concentración con el uso útil del teléfono.', response: '' },
    ],
  },
  fr: {
    title: 'Comment utiliser UThynk', intro: 'Regarde un exemple. Deux réponses. Un nouvel angle. Pense mieux.',
    watch: 'Voir un exemple', close: 'Commencer à réfléchir', pause: 'Pause', play: 'Lecture', replay: 'Revoir',
    next: 'Étape suivante', previous: 'Étape précédente', example: 'Un exemple seulement : ce ne sont pas tes réponses',
    you: 'Toi', question: 'Devrait-on autoriser les téléphones pendant les cours ?',
    steps: [
      { title: 'Donne ta réponse', hint: 'Dis ce que tu penses et pourquoi. Une réponse courte suffit. Écris ou maintiens le bouton pour parler.', prompt: 'Devrait-on autoriser les téléphones pendant les cours ?', response: 'Non, car les messages peuvent nous distraire.' },
      { title: 'Regarde un autre angle', hint: 'Lis la nouvelle perspective. Tu peux changer d’avis ou garder ton point de vue : explique pourquoi.', prompt: 'Et si quelqu’un a besoin d’un téléphone pour apprendre ou pour une urgence ?', response: '' },
      { title: 'Réponds à la question suivante', hint: 'Utilise le nouvel angle pour répondre à une autre question.', prompt: 'Quelle règle réduirait les distractions tout en aidant ceux qui ont besoin d’un téléphone ?', response: 'Ranger les téléphones sauf quand le professeur demande de les utiliser.' },
      { title: 'Relie tes idées', hint: 'Lis la synthèse finale. Observe ce que tu as gardé, changé ou dois encore vérifier.', prompt: 'Tu as commencé par une interdiction. Puis tu as envisagé des exceptions. Ton idée équilibre maintenant la concentration et l’usage utile du téléphone.', response: '' },
    ],
  },
};

function Illustration({ step }: { step: number }) {
  return <svg className={styles.illustration} viewBox="0 0 160 140" aria-hidden="true" focusable="false">
    <circle cx="80" cy="70" r="58" className={styles.halo} />
    {step === 0 ? <g className={styles.moving}><rect x="51" y="24" width="58" height="94" rx="12" /><path d="M69 34h22M72 106h16" /><path d="M27 55h32v23H40l-13 10z" className={styles.accent} /><path d="M35 63h16M35 70h10" /></g>
      : step === 1 ? <g className={styles.moving}><path d="M58 86c-25-27-8-59 22-59s47 32 22 59l-6 12H64z" /><path d="M65 108h30M72 118h16M80 10V2M34 29l-9-9M126 29l9-9M22 62H9M138 62h13" className={styles.accent} /><path d="M67 70l13 10 17-23" /></g>
      : step === 2 ? <g className={styles.moving}><path d="M21 27h91v50H63L42 94V77H21z" /><path d="M64 87h75v32h-17l-14 10v-10H64z" className={styles.accent} /><path d="M38 43h54M38 58h36M80 99h43M80 109h25" /></g>
      : <g className={styles.moving}><circle cx="41" cy="48" r="19" /><circle cx="119" cy="48" r="19" /><path d="M41 68v20l39 22 39-22V68" /><circle cx="80" cy="104" r="22" className={styles.accent} /><path d="M68 104l8 8 17-18" /></g>}
  </svg>;
}

export function ThinkingStepHint({ language, step }: { language: Language; step: number }) {
  const copy = guideCopy[language].steps[Math.max(0, Math.min(3, step))];
  return <p className={styles.hint}><span aria-hidden="true">{step + 1}</span>{copy.hint}</p>;
}

export default function ThinkingWalkthrough({ language, open, onOpenChange }: {
  language: Language; open?: boolean; onOpenChange?: (value: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const id = useId();
  const pageVisible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';
  const expanded = open ?? internalOpen;
  const copy = guideCopy[language];

  useEffect(() => {
    if (open === undefined && localStorage.getItem(VISUAL_GUIDE_DISMISSED) !== 'true') setInternalOpen(true);
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    function update() { setReducedMotion(Boolean(media?.matches)); if (media?.matches) setPlaying(false); }
    update(); media?.addEventListener?.('change', update);
    return () => media?.removeEventListener?.('change', update);
  }, [open]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    function hide() { if (document.visibilityState === 'hidden') setPlaying(false); }
    document.addEventListener?.('visibilitychange', hide);
    hide();
    return () => document.removeEventListener?.('visibilitychange', hide);
  }, []);

  useEffect(() => {
    if (!expanded || !playing || reducedMotion || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return;
    const timer = setTimeout(() => {
      const next = Math.min(3, step + 1);
      setStep(next);
      if (next === 3) setPlaying(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [expanded, playing, reducedMotion, step]);

  useEffect(() => {
    if (expanded) { setStep(0); setPlaying(!reducedMotion && pageVisible()); }
  }, [expanded, reducedMotion]);

  function changeOpen(next: boolean) {
    if (onOpenChange) onOpenChange(next); else setInternalOpen(next);
    if (next) { setStep(0); setPlaying(!reducedMotion && pageVisible()); }
    else { setPlaying(false); localStorage.setItem(VISUAL_GUIDE_DISMISSED, 'true'); }
  }
  function selectStep(index: number) { setStep(index); setPlaying(false); }

  return <section className={styles.guide} aria-labelledby={`${id}-title`}>
    <div className={styles.header}>
      <div><strong id={`${id}-title`}>{copy.title}</strong><p>{copy.intro}</p></div>
      <button type="button" className="btn" aria-expanded={expanded} aria-controls={`${id}-demo`} onClick={() => changeOpen(!expanded)}>{expanded ? copy.close : copy.watch}</button>
    </div>
    {expanded ? <div id={`${id}-demo`} onFocusCapture={event => {
      if (!(event.target as HTMLElement).closest('[data-playback-control]')) setPlaying(false);
    }}>
      <ol className={styles.steps}>{copy.steps.map((item, index) => <li key={index}><button type="button" aria-current={index === step ? 'step' : undefined} onClick={() => selectStep(index)}><span>{index + 1}</span>{item.title}</button></li>)}</ol>
      <div className={styles.scene} data-step={step} data-playing={playing && !reducedMotion}>
        <Illustration step={step} />
        <div className={styles.sceneText}><small>{copy.example}</small><h3>{copy.steps[step].title}</h3><p>{copy.steps[step].hint}</p>
          <div className={styles.bubble} key={`${language}-${step}`}><strong>UThynk</strong><p>{copy.steps[step].prompt}</p></div>
          {copy.steps[step].response ? <div className={`${styles.bubble} ${styles.answer}`}><strong>{copy.you}</strong><p>{copy.steps[step].response}</p></div> : null}
        </div>
      </div>
      <div className={styles.controls}>
        <button type="button" className="btn" disabled={step === 0} onClick={() => selectStep(step - 1)}>{copy.previous}</button>
        <button type="button" className="btn" data-playback-control="true" disabled={reducedMotion} aria-pressed={playing && !reducedMotion} onClick={() => {
          if (step === 3) setStep(0);
          setPlaying(current => !current);
        }}>{playing && !reducedMotion ? copy.pause : step === 3 ? copy.replay : copy.play}</button>
        <button type="button" className="btn" disabled={step === 3} onClick={() => selectStep(step + 1)}>{copy.next}</button>
      </div>
    </div> : null}
  </section>;
}
