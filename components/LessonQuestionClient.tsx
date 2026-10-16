'use client';

import AssessmentBreakdown from '@/components/AssessmentBreakdown';
import type { SavedAssessment } from '@/lib/qualitativeAssessment';

import BetaFeedbackNotice from '@/components/BetaFeedbackNotice';

import LessonAppHeader from './LessonAppHeader';

import { LessonQuestionListHint } from '@/components/LessonDiscovery';
import ThinkingWalkthrough, { ThinkingStepHint } from '@/components/ThinkingWalkthrough';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ageBandLabel, normalizeAgeBand } from '@/lib/ageAdaptivePrompts';
import { getLessonQuestion } from '@/lib/lessonQuestions';
import { lessonSelectionKey, readLessonSelection, readLessonSession } from '@/lib/lessonSessionStorage';
import {
  applyFinalSynthesis,
  applyPerspectiveExpansion,
  canSubmitChallengeAnswer,
  captureAnswerDraft,
  challengeSessionKey,
  createChallengeSession,
  shouldRenderAnswerInput,
  type ChallengeSession,
  type ChallengeSessionKeyInput,
} from '@/lib/challengeSession';
import {
  localizeCategory,
  localizeQuestion,
  localizeText,
  setStoredLanguageValue,
  getStoredLanguageValue,
  isLanguage,
  UTHYNK_LANGUAGE_EVENT,
  type Language,
  uiCopy,
} from '@/lib/reasoningI18n';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';

type Props = {
  assignmentId?: string;
  initialSession?: ChallengeSession | null;
  category: string;
  questions: string[];
  questionIds?: string[];
  questionTranslations?: Record<Language, string[]>;
  readingModuleId?: string;
  sessionUserId?: string | null;
  onSessionChange?: (session: ChallengeSession | null) => void;
};

type Feedback = {
  assessment?: SavedAssessment;
  analysis?: string;
  contrarian?: string;
  finalSynthesis?: string;
  followUp?: string;
  perspectiveExpansion?: string;
  score?: number | null;
  secondaryQuestion?: string;
  strengths?: string[];
  trait?: string;
  weaknesses?: string[];
  xp?: number;
};

const flowCopy = {
  en: {
    begin: 'Expand my perspective',
    category: 'Lesson Category',
    clear: 'Start New Challenge',
    complete: 'Challenge complete',
    failure: 'UThynk could not continue this session. Your answer is still here. Please try again.',
    finish: 'Create final synthesis',
    firstHint: 'Give your first answer. You can type or use voice to text.',
    firstPlaceholder: 'Write your first answer.',
    intro: 'Choose one question and complete a focused thinking session.',
    perspective: 'Perspective Expansion',
    required: 'Write or speak your answer first.',
    restored: 'Your saved session was restored.',
    secondary: 'Secondary Question',
    secondHint: 'Use the new angles to deepen or revise your thinking.',
    secondPlaceholder: 'Write your second answer.',
    selected: 'Main Question',
    synthesis: 'Final Synthesis',
    progress: ['Main Question', 'Perspective Expansion', 'Secondary Question', 'Final Synthesis'],
  },
  es: {
    begin: 'Ampliar mi perspectiva',
    category: 'Categoria de leccion',
    clear: 'Empezar nuevo desafio',
    complete: 'Desafio completado',
    failure: 'UThynk no pudo continuar esta sesion. Tu respuesta sigue aqui. Intentalo de nuevo.',
    finish: 'Crear sintesis final',
    firstHint: 'Da tu primera respuesta. Puedes escribir o usar voz a texto.',
    firstPlaceholder: 'Escribe tu primera respuesta.',
    intro: 'Elige una pregunta y completa una sesion de pensamiento enfocada.',
    perspective: 'Expansion de perspectiva',
    required: 'Escribe o dicta tu respuesta primero.',
    restored: 'Se restauro tu sesion guardada.',
    secondary: 'Pregunta secundaria',
    secondHint: 'Usa los nuevos angulos para profundizar o revisar tu pensamiento.',
    secondPlaceholder: 'Escribe tu segunda respuesta.',
    selected: 'Pregunta principal',
    synthesis: 'Sintesis final',
    progress: ['Pregunta principal', 'Expansion de perspectiva', 'Pregunta secundaria', 'Sintesis final'],
  },
  fr: {
    begin: 'Elargir ma perspective',
    category: 'Categorie de lecon',
    clear: 'Commencer un nouveau defi',
    complete: 'Defi termine',
    failure: "UThynk n'a pas pu continuer cette session. Ta reponse est toujours ici. Reessaie.",
    finish: 'Creer la synthese finale',
    firstHint: 'Donne ta premiere reponse. Tu peux ecrire ou utiliser la dictee vocale.',
    firstPlaceholder: 'Ecris ta premiere reponse.',
    intro: 'Choisis une question et termine une session de reflexion ciblee.',
    perspective: 'Elargissement de perspective',
    required: "Ecris ou dicte d'abord ta reponse.",
    restored: 'Ta session sauvegardee a ete restauree.',
    secondary: 'Question secondaire',
    secondHint: 'Utilise les nouveaux angles pour approfondir ou revoir ta reflexion.',
    secondPlaceholder: 'Ecris ta deuxieme reponse.',
    selected: 'Question principale',
    synthesis: 'Synthese finale',
    progress: ['Question principale', 'Elargissement de perspective', 'Question secondaire', 'Synthese finale'],
  },
} satisfies Record<Language, Record<string, string | string[]>>;

function readProfile() {
  try {
    const storedProfile = localStorage.getItem('uthynk-profile');
    return storedProfile ? JSON.parse(storedProfile) : null;
  } catch {
    return null;
  }
}

function normalizeFeedback(payload: Feedback, phase: 'follow_up' | 'synthesis'): Feedback {
  return {
    ...payload,
    contrarian: payload.contrarian || payload.perspectiveExpansion,
    finalSynthesis: phase === 'synthesis' ? payload.finalSynthesis || payload.analysis : '',
    followUp: phase === 'synthesis' ? '' : payload.followUp || payload.secondaryQuestion,
    perspectiveExpansion: payload.perspectiveExpansion || payload.contrarian || payload.analysis,
    secondaryQuestion: phase === 'synthesis' ? '' : payload.secondaryQuestion || payload.followUp,
  };
}

export default function LessonQuestionClient({ category, questions, questionIds, questionTranslations, readingModuleId, sessionUserId, onSessionChange, assignmentId, initialSession }: Props) {
  const [language, setLanguage] = useState<Language>('en');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ageBand, setAgeBand] = useState('18_plus');
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [ready, setReady] = useState(false);
  const [loadedStorageKey, setLoadedStorageKey] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);
  const draftUpdateRef = useRef<(draft: string) => void>(() => {});
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const copy = uiCopy[language];
  const flow = flowCopy[language];
  const visibleCategory = localizeCategory(category, language);
  const safeAgeBand = normalizeAgeBand(ageBand);
  const localizedQuestions = useMemo(
    () => questionTranslations?.[language] || questions.map((question, index) => localizeQuestion(category, index, question, language)),
    [category, language, questions, questionTranslations]
  );
  // Lesson scenarios retain their meaning for every age band. The reasoning API
  // still receives ageBand; generic English age frames must not replace translations.
  const selectedQuestion = localizedQuestions[selectedIndex] || localizedQuestions[0] || '';
  const sourceQuestion = questions[selectedIndex] || questions[0] || '';
  const questionRecord = getLessonQuestion(category, sourceQuestion);
  const profile = typeof window === 'undefined' ? null : readProfile();
  const userId = sessionUserId !== undefined ? sessionUserId : profile?.id || null;
  const keyInput: ChallengeSessionKeyInput = {
    assignmentId,
    ageBand: safeAgeBand,
    category,
    language,
    questionId: questionIds?.[selectedIndex] || questionRecord?.id || `${category}-${selectedIndex}`,
    questionIndex: selectedIndex,
    userId,
  };
  const activeStorageKey = challengeSessionKey(keyInput);
  const selectionStorageKey = lessonSelectionKey(keyInput);

  useEffect(() => {
    const initialProfile = readProfile();
    setLanguage(getStoredLanguageValue());
    const initialAge = normalizeAgeBand(initialProfile?.age_band || '18_plus');
    setAgeBand(initialAge);
    setSelectedIndex(readingModuleId ? 0 : readLessonSelection(localStorage, {
      category, ageBand: initialAge, userId: sessionUserId !== undefined ? sessionUserId : initialProfile?.id, language: getStoredLanguageValue(),
    }, questions));
    setReady(true);

    trackEvent(
      createTelemetryEvent('lesson_category_arrived', initialProfile?.id, {
        category,
        questions: questions.length,
      })
    );
  }, [category, questions, readingModuleId, sessionUserId]);

  useEffect(() => {
    function updateLanguage() {
      const nextLanguage = getStoredLanguageValue();
      setLanguage(nextLanguage);
      setSession(current => current ? { ...current, language: nextLanguage } : current);
    }
    function onLanguageEvent(event: Event) {
      const nextLanguage = (event as CustomEvent).detail;
      if (!isLanguage(nextLanguage)) return;
      setLanguage(nextLanguage);
      setSession(current => current ? { ...current, language: nextLanguage } : current);
    }
    function onStorage(event: StorageEvent) {
      if (event.key === 'uthynk-language' || event.key === null) updateLanguage();
    }
    window.addEventListener(UTHYNK_LANGUAGE_EVENT, onLanguageEvent);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(UTHYNK_LANGUAGE_EVENT, onLanguageEvent);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const local = readLessonSession(localStorage, keyInput, questionRecord);
    const server = initialSession ? { ...initialSession, ageBand: safeAgeBand, userId, language } : null;
    const parsed = server && (!local || server.completed || local.sessionId !== server.sessionId || (server.firstResponse && !local.firstResponse)) ? server : local;
    setSession(parsed);
    setAnswer(parsed?.activeAnswerDraft || '');
    setRestored(Boolean(parsed));
    setLoadedStorageKey(activeStorageKey);
  }, [activeStorageKey, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || loadedStorageKey !== activeStorageKey || !session || challengeSessionKey(session) !== activeStorageKey) return;
    localStorage.setItem(challengeSessionKey(session), JSON.stringify(session));
  }, [session, ready, loadedStorageKey, activeStorageKey]);

  useEffect(() => {
    if (ready && loadedStorageKey === activeStorageKey) onSessionChange?.(session);
  }, [session, ready, loadedStorageKey, activeStorageKey, onSessionChange]);

  useEffect(() => {
    if (!ready || loadedStorageKey !== activeStorageKey || !questionRecord) return;
    localStorage.setItem(selectionStorageKey, questionRecord.id);
  }, [ready, loadedStorageKey, activeStorageKey, selectionStorageKey, questionRecord]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    let disposed = false;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'es' ? 'es-US' : language === 'fr' ? 'fr-FR' : 'en-US';

    recognition.onresult = (event: any) => {
      if (disposed) return;
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      draftUpdateRef.current(transcript);
    };

    recognition.onerror = () => {
      listeningRef.current = false;
      setVoiceStatus(
        language === 'es'
          ? 'No se pudo escuchar. Revisa el permiso del microfono.'
          : language === 'fr'
            ? "Impossible d'ecouter. Verifie l'autorisation du micro."
            : 'Could not listen. Check microphone permission.'
      );
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setVoiceStatus('');
    };

    recognitionRef.current = recognition;

    return () => {
      disposed = true;
      listeningRef.current = false;
      try {
        recognition.stop();
      } catch {
        // Browsers can throw if speech recognition was never started.
      }
      recognitionRef.current = null;
    };
  }, [language]);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setSession(current => current ? { ...current, language: nextLanguage } : current);
    setStoredLanguageValue(nextLanguage);
    setError('');
  }

  function selectQuestion(index: number) {
    if (loading) return;
    setSelectedIndex(index);
    setError('');
    setRestored(false);

    const selectedProfile = readProfile();
    trackEvent(
      createTelemetryEvent('selected_question', selectedProfile?.id, {
        category,
        questionIndex: index,
        source: 'lesson',
      })
    );

    window.setTimeout(() => answerRef.current?.focus(), 0);
  }

  function startVoiceInput() {
    if (!recognitionRef.current) {
      setVoiceStatus(
        language === 'es'
          ? 'La voz a texto no esta disponible en este navegador.'
          : language === 'fr'
            ? "La dictee vocale n'est pas disponible dans ce navigateur."
            : 'Voice to text is not available in this browser.'
      );
      return;
    }

    setVoiceStatus(
      language === 'es'
        ? 'Escuchando...'
        : language === 'fr'
          ? 'Ecoute...'
          : 'Listening...'
    );

    if (listeningRef.current) return;

    try {
      listeningRef.current = true;
      recognitionRef.current.start();
    } catch {
      listeningRef.current = false;
    }
  }

  function stopVoiceInput() {
    if (!listeningRef.current) return;
    listeningRef.current = false;
    recognitionRef.current?.stop();
    setVoiceStatus('');
  }

  function updateAnswer(nextAnswer: string) {
    setAnswer(nextAnswer);
    setSession((current) => captureAnswerDraft(current || createChallengeSession({ ...keyInput, conversationId: crypto.randomUUID(), originalQuestion: sourceQuestion, sessionId: crypto.randomUUID() }), nextAnswer));
  }
  // Speech callbacks must capture the currently selected question, not the
  // question that happened to be selected when recognition was initialized.
  draftUpdateRef.current = updateAnswer;

  function startNewChallenge() {
    // A tombstone prevents older v2 language slots from reappearing after a deliberate reset.
    localStorage.setItem(activeStorageKey, 'null');
    setSession(null);
    setAnswer('');
    setError('');
    setRestored(false);
    window.setTimeout(() => answerRef.current?.focus(), 0);
  }

  async function requestFeedback(phase: 'follow_up' | 'synthesis', active: ChallengeSession, responseText: string) {
    const response = await fetch('/api/reasoning', {
      body: JSON.stringify({
        ageBand: safeAgeBand,
        assignmentId,
        readingModuleId,
        category,
        challenge: active.originalQuestion,
        conversationId: active.conversationId,
        displayedQuestion: selectedQuestion,
        firstUserAnswer: active.firstResponse,
        language,
        originalQuestion: active.originalQuestion,
        questionId: active.questionId,
        perspectiveExpansion: active.perspectiveExpansion,
        phase,
        question: phase === 'synthesis' ? active.secondaryQuestion : active.originalQuestion,
        response: responseText,
        secondUserAnswer: phase === 'synthesis' ? responseText : undefined,
        secondaryQuestion: active.secondaryQuestion,
        section: `lesson:${category}`,
        sessionId: active.sessionId,
        stream: false,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || (flow.failure as string));
    }

    return normalizeFeedback(payload as Feedback, phase);
  }

  async function submitAnswer() {
    if (!canSubmitChallengeAnswer(session, answer, loading)) {
      if (!answer.trim()) {
        setError(flow.required as string);
        answerRef.current?.focus();
      }
      return;
    }

    const submittedAnswer = answer.trim();
    setLoading(true);
    setError('');

    try {
      const active =
        (session ? { ...session, language } : null) ||
        createChallengeSession({
          ...keyInput,
          conversationId: crypto.randomUUID(),
          originalQuestion: sourceQuestion,
          sessionId: crypto.randomUUID(),
        });

      if (active.step === 'main_question') {
        const feedback = await requestFeedback('follow_up', active, submittedAnswer);
        setSession(current => ({ ...applyPerspectiveExpansion(active, submittedAnswer, feedback), language: current?.language || active.language }));
        setAnswer('');
        return;
      }

      if (active.step === 'secondary_question') {
        const feedback = await requestFeedback('synthesis', active, submittedAnswer);
        const completed = applyFinalSynthesis(active, submittedAnswer, feedback);
        setSession(current => ({ ...completed, language: current?.language || active.language }));
        setAnswer('');
        trackEvent(
          createTelemetryEvent('completed_reasoning_loop', userId, {
            category,
            questionIndex: selectedIndex,
            score: feedback.score,
            source: 'lesson',
            xp: feedback.xp,
          })
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : (flow.failure as string));
      setAnswer(submittedAnswer);
      setSession((current) => captureAnswerDraft(current, submittedAnswer));
    } finally {
      setLoading(false);
    }
  }

  const stepNumber = session?.step === 'secondary_question' ? 3 : session?.step === 'final_synthesis' ? 4 : 1;
  const progressLabels = flow.progress as string[];
  const inputVisible =
    shouldRenderAnswerInput(session) &&
    (!session || session.step !== 'secondary_question' || Boolean(session.secondaryQuestion));

  return (
    <>
      {!(readingModuleId || assignmentId) && <LessonAppHeader language={language} changeLanguage={changeLanguage} disabled={loading} />}

      {!(readingModuleId || assignmentId) && <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">{flow.category}</div>
          <h1>{visibleCategory}</h1>
          <p>{flow.intro}</p>
        </div>
      </section>}

      {!(readingModuleId || assignmentId) && <ThinkingWalkthrough language={language} />}

      <section className={readingModuleId || assignmentId ? "readingThinkingSession" : "lessonQuestionLayout"} style={{ maxWidth: '100%', minWidth: 0, width: '100%' }}>
        {!(readingModuleId || assignmentId) && <div className="lessonQuestionList" style={{ minWidth: 0 }}>
          {!(readingModuleId || assignmentId) && <LessonQuestionListHint language={language} />}
          {localizedQuestions.map((question, index) => (
            <button
              className={selectedIndex === index ? 'lessonQuestion active' : 'lessonQuestion'}
              aria-pressed={selectedIndex === index}
              disabled={loading || Boolean(session)}
              key={questionIds?.[index] || getLessonQuestion(category, questions[index])?.id || `${category}-${index}`}
              onClick={() => selectQuestion(index)}
              type="button"
            >
              {question}
            </button>
          ))}
        </div>}

        <div className="card lessonStartPanel" style={{ minWidth: 0 }}>
          <div className="panelLabel">{flow.selected}</div>
          {safeAgeBand !== '18_plus' ? (
            <div className="ageModeBadge">{ageBandLabel(safeAgeBand)}</div>
          ) : null}
          <h2>{selectedQuestion}</h2>

          <div className="thinkingLabelLayer" aria-label="Challenge progress">
            {progressLabels.map((label, index) => (
              <span key={label} className={index + 1 <= stepNumber ? 'active' : ''}>
                {index + 1}. {label}
              </span>
            ))}
          </div>

          {restored ? <p className="panelNote">{flow.restored}</p> : null}

          {session?.firstResponse ? (
            <div className="advancedExplanationLayer">
              <strong>{copy.userLabel}</strong>
              <p>{session.firstResponse}</p>
            </div>
          ) : null}

          {session?.perspectiveExpansion && <BetaFeedbackNotice language={language} />}

          {session?.perspectiveExpansion ? (
            <div className="plainResponseLayer">
              <span>{flow.perspective}</span>
              <p>{session.perspectiveExpansion}</p>
            </div>
          ) : null}

          {session?.secondaryQuestion ? (
            <div className="advancedExplanationLayer">
              <strong>{flow.secondary}</strong>
              <p>{session.secondaryQuestion}</p>
            </div>
          ) : null}

          {session?.secondResponse ? (
            <div className="advancedExplanationLayer">
              <strong>{copy.userLabel}</strong>
              <p>{session.secondResponse}</p>
            </div>
          ) : null}

          {session?.finalSynthesis ? (
            <div className="plainResponseLayer">
              <span>{flow.synthesis}</span>
              <p>{session.finalSynthesis}</p>
              <AssessmentBreakdown assessment={session.assessment} language={language} />
              {session.growthIndicators.length ? (
                <div className="thinkingLabelLayer">
                  {session.growthIndicators.filter(item => !/^Score\s+\d/.test(item)).map((item) => (
                    <span key={item}>{localizeText(item, language)}</span>
                  ))}
                </div>
              ) : null}
              <strong>{flow.complete}</strong>
            </div>
          ) : null}

          {inputVisible ? (
            <>
              <ThinkingStepHint language={language} step={session?.step === 'secondary_question' ? 2 : 0} />
              <p className="lessonPromptHint">
                {session?.step === 'secondary_question' ? flow.secondHint : flow.firstHint}
              </p>
              <textarea
                ref={answerRef}
                className="textarea conversationInput"
                onChange={(event) => updateAnswer(event.target.value)}
                placeholder={
                  (session?.step === 'secondary_question'
                    ? flow.secondPlaceholder
                    : flow.firstPlaceholder) as string
                }
                value={answer}
              />
              {error ? <p className="authError">{error}</p> : null}
              {voiceStatus ? <p className="panelNote">{voiceStatus}</p> : null}
              <div className="lessonActionRow">
                <button
                  className="btn btnPrimary"
                  disabled={loading}
                  onClick={submitAnswer}
                  type="button"
                >
                  {loading ? copy.sending : session?.step === 'secondary_question' ? flow.finish : flow.begin}
                </button>
                <button
                  className="btn"
                  disabled={!voiceSupported || loading}
                  onMouseDown={startVoiceInput}
                  onMouseUp={stopVoiceInput}
                  onMouseLeave={stopVoiceInput}
                  onTouchStart={startVoiceInput}
                  onTouchEnd={stopVoiceInput}
                  type="button"
                >
                  {copy.holdToTalk}
                </button>
              </div>
            </>
          ) : null}

          {session ? (
            <button className="btn" hidden={Boolean(assignmentId)} disabled={loading} onClick={startNewChallenge} type="button">
              {flow.clear}
            </button>
          ) : null}
        </div>
      </section>
    </>
  );
}
