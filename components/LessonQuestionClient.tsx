'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adaptQuestionForAge, ageBandLabel, normalizeAgeBand } from '@/lib/ageAdaptivePrompts';
import { challengeSessionKey, createChallengeSession, isChallengeSession, type ChallengeSession } from '@/lib/challengeSession';
import { languageOptions, localizeCategory, localizeQuestion, setStoredLanguageValue, type Language, uiCopy } from '@/lib/reasoningI18n';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';

type Props = { category: string; questions: string[] };
type Feedback = { analysis: string; contrarian: string; followUp: string; strengths?: string[]; weaknesses?: string[]; score?: number; xp?: number };
const flowCopy = {
  en: { category: 'Lesson Category', intro: 'Choose one question and complete a focused four-step thinking session.', selected: 'Main Question', firstHint: 'Give your first answer. One or two thoughtful sentences is enough.', firstPlaceholder: 'Write your first answer…', begin: 'Expand my perspective', perspective: 'Perspective Expansion', secondary: 'Secondary Question', secondHint: 'Use the new angles to deepen or revise your thinking.', secondPlaceholder: 'Write your second answer…', finish: 'Create final synthesis', synthesis: 'Final Synthesis', complete: 'Challenge complete', restored: 'Your saved session was restored.', required: 'Write or speak your answer first.', failure: 'UThynk could not continue this session. Please try again.', progress: ['Main Question', 'Perspective Expansion', 'Secondary Question', 'Final Synthesis'] },
  es: { category: 'Categoria de leccion', intro: 'Elige una pregunta y completa una sesion de pensamiento de cuatro pasos.', selected: 'Pregunta principal', firstHint: 'Da tu primera respuesta. Una o dos frases reflexivas bastan.', firstPlaceholder: 'Escribe tu primera respuesta…', begin: 'Ampliar mi perspectiva', perspective: 'Expansion de perspectiva', secondary: 'Pregunta secundaria', secondHint: 'Usa los nuevos angulos para profundizar o revisar tu pensamiento.', secondPlaceholder: 'Escribe tu segunda respuesta…', finish: 'Crear sintesis final', synthesis: 'Sintesis final', complete: 'Desafio completado', restored: 'Se restauro tu sesion guardada.', required: 'Escribe o dicta tu respuesta primero.', failure: 'UThynk no pudo continuar esta sesion. Intentalo de nuevo.', progress: ['Pregunta principal', 'Expansion de perspectiva', 'Pregunta secundaria', 'Sintesis final'] },
  fr: { category: 'Categorie de lecon', intro: 'Choisis une question et termine une session de reflexion ciblee en quatre etapes.', selected: 'Question principale', firstHint: 'Donne ta premiere reponse. Une ou deux phrases reflechies suffisent.', firstPlaceholder: 'Ecris ta premiere reponse…', begin: 'Elargir ma perspective', perspective: 'Elargissement de perspective', secondary: 'Question secondaire', secondHint: 'Utilise les nouveaux angles pour approfondir ou revoir ta reflexion.', secondPlaceholder: 'Ecris ta deuxieme reponse…', finish: 'Creer la synthese finale', synthesis: 'Synthese finale', complete: 'Defi termine', restored: 'Ta session sauvegardee a ete restauree.', required: "Ecris ou dicte d'abord ta reponse.", failure: "UThynk n'a pas pu continuer cette session. Reessaie.", progress: ['Question principale', 'Elargissement de perspective', 'Question secondaire', 'Synthese finale'] },
} satisfies Record<Language, Record<string, string | string[]>>;

export default function LessonQuestionClient({ category, questions }: Props) {
  const [language, setLanguage] = useState<Language>('en');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ageBand, setAgeBand] = useState('18_plus');
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);
  const copy = uiCopy[language]; const flow = flowCopy[language];
  const safeAgeBand = normalizeAgeBand(ageBand);
  const visibleCategory = localizeCategory(category, language);
  const localizedQuestions = useMemo(() => questions.map((q, i) => localizeQuestion(category, i, q, language)), [category, language, questions]);
  const adaptedQuestions = useMemo(() => localizedQuestions.map((q, i) => adaptQuestionForAge(q, category, safeAgeBand, i)), [category, localizedQuestions, safeAgeBand]);
  const selectedQuestion = adaptedQuestions[selectedIndex] || adaptedQuestions[0] || '';

  useEffect(() => {
    const storedLanguage = localStorage.getItem('uthynk-language');
    const storedProfile = localStorage.getItem('uthynk-profile');
    let profile: any = null;
    try { profile = storedProfile ? JSON.parse(storedProfile) : null; } catch { profile = null; }
    if (storedLanguage === 'en' || storedLanguage === 'es' || storedLanguage === 'fr') setLanguage(storedLanguage);
    setAgeBand(profile?.age_band || '18_plus');
    trackEvent(createTelemetryEvent('lesson_category_arrived', profile?.id, { category, questions: questions.length }));
  }, [category, questions.length]);

  useEffect(() => {
    const raw = localStorage.getItem(challengeSessionKey(category, selectedIndex, language));
    if (!raw) { setSession(null); setAnswer(''); setRestored(false); return; }
    try { const parsed = JSON.parse(raw); if (isChallengeSession(parsed)) { setSession(parsed); setAnswer(parsed.step === 'secondary_question' ? parsed.secondResponse : parsed.firstResponse); setRestored(true); return; } } catch { /* Ignore corrupt state. */ }
    setSession(null); setAnswer(''); setRestored(false);
  }, [category, language, selectedIndex]);

  useEffect(() => { if (session) localStorage.setItem(challengeSessionKey(session.category, session.questionIndex, session.language), JSON.stringify(session)); }, [session]);
  function changeLanguage(next: Language) { setLanguage(next); setStoredLanguageValue(next); setError(''); }
  function selectQuestion(index: number) { setSelectedIndex(index); setError(''); setRestored(false); window.setTimeout(() => answerRef.current?.focus(), 0); }

  async function requestFeedback(phase: 'follow_up' | 'synthesis', active: ChallengeSession, responseText: string) {
    const response = await fetch('/api/reasoning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, ageBand: safeAgeBand, challenge: active.originalQuestion, question: phase === 'synthesis' ? active.secondaryQuestion : active.originalQuestion, response: phase === 'synthesis' ? JSON.stringify({ firstAnswer: active.firstResponse, secondAnswer: responseText }) : responseText, language, phase, sessionId: active.sessionId, conversationId: active.conversationId, section: `lesson:${category}`, stream: false }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || flow.failure as string);
    return payload as Feedback;
  }

  async function submit() {
    if (!answer.trim()) { setError(flow.required as string); answerRef.current?.focus(); return; }
    setLoading(true); setError('');
    try {
      const active = session || createChallengeSession({ category, questionIndex: selectedIndex, language, ageBand: safeAgeBand, originalQuestion: selectedQuestion, sessionId: crypto.randomUUID(), conversationId: crypto.randomUUID() });
      if (!session || active.step === 'main_question') {
        const feedback = await requestFeedback('follow_up', active, answer.trim());
        setSession({ ...active, firstResponse: answer.trim(), perspectiveExpansion: feedback.contrarian || feedback.analysis, secondaryQuestion: feedback.followUp, growthIndicators: [...(feedback.strengths || []), ...(feedback.weaknesses || [])], step: 'secondary_question' }); setAnswer('');
      } else if (active.step === 'secondary_question') {
        const feedback = await requestFeedback('synthesis', active, answer.trim());
        setSession({ ...active, secondResponse: answer.trim(), finalSynthesis: feedback.analysis || feedback.contrarian, growthIndicators: [...new Set([...active.growthIndicators, ...(feedback.strengths || []), ...(feedback.weaknesses || [])])], completed: true, step: 'final_synthesis' }); setAnswer('');
        trackEvent(createTelemetryEvent('completed_reasoning_loop', undefined, { category, questionIndex: selectedIndex, score: feedback.score, xp: feedback.xp, source: 'lesson' }));
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : flow.failure as string); } finally { setLoading(false); }
  }

  const stepNumber = session?.step === 'secondary_question' ? 3 : session?.step === 'final_synthesis' ? 4 : 1;
  return <>
    <header className="appTop card"><a href="/" className="appBrandText"><img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo"/><span className="brandCopy"><strong>UThynk</strong><small>Better thinking. <em>Better decisions.</em></small></span></a><div className="topControls"><nav className="appNav"><a href="/">{copy.home}</a><a href="/lessons">{copy.lessonsNav}</a><a href="/profile">{copy.profileNav}</a></nav><label className="languageSelectLabel topLanguageSelect"><span>{copy.adaptiveLanguage}</span><select aria-label={copy.adaptiveLanguage} className="languageSelect" value={language} disabled={Boolean(session)} onChange={e => changeLanguage(e.target.value as Language)}>{languageOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label></div></header>
    <section className="appHero card" style={{marginTop:18}}><div className="heroCopy"><div className="eyebrow">{flow.category}</div><h1>{visibleCategory}</h1><p>{flow.intro}</p></div></section>
    <section className="lessonQuestionLayout"><div className="lessonQuestionList">{adaptedQuestions.map((q,i)=><button className={selectedIndex===i?'lessonQuestion active':'lessonQuestion'} key={`${category}-${i}`} disabled={Boolean(session)} onClick={()=>selectQuestion(i)} type="button"><span>{(flow.progress as string[])[0]}</span>{q}</button>)}</div>
      <div className="card lessonStartPanel"><div className="panelLabel">{flow.selected}</div>{safeAgeBand!=='18_plus'?<div className="ageModeBadge">{ageBandLabel(safeAgeBand)}</div>:null}<h2>{session?.originalQuestion || selectedQuestion}</h2>
        <div className="thinkingLabelLayer" aria-label="Challenge progress">{(flow.progress as string[]).map((label,i)=><span key={label} className={i+1<=stepNumber?'active':''}>{i+1}. {label}</span>)}</div>{restored?<p className="panelNote">{flow.restored}</p>:null}
        {session?.perspectiveExpansion?<div className="plainResponseLayer"><span>{flow.perspective}</span><p>{session.perspectiveExpansion}</p></div>:null}{session?.secondaryQuestion?<div className="advancedExplanationLayer"><strong>{flow.secondary}</strong><p>{session.secondaryQuestion}</p></div>:null}
        {session?.finalSynthesis?<div className="plainResponseLayer"><span>{flow.synthesis}</span><p>{session.finalSynthesis}</p>{session.growthIndicators.length?<div className="thinkingLabelLayer">{session.growthIndicators.map(item=><span key={item}>{item}</span>)}</div>:null}<strong>{flow.complete}</strong></div>:null}
        {!session?.completed?<><p className="lessonPromptHint">{session?.step==='secondary_question'?flow.secondHint:flow.firstHint}</p><textarea ref={answerRef} className="textarea conversationInput" onChange={e=>setAnswer(e.target.value)} placeholder={(session?.step==='secondary_question'?flow.secondPlaceholder:flow.firstPlaceholder) as string} value={answer}/>{error?<p className="authError">{error}</p>:null}<div className="lessonActionRow"><button className="btn btnPrimary" disabled={loading} onClick={submit} type="button">{loading?copy.sending:(session?.step==='secondary_question'?flow.finish:flow.begin)}</button></div></>:null}
      </div></section>
  </>;
}
