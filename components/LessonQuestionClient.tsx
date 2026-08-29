'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adaptQuestionForAge, ageBandLabel, normalizeAgeBand } from '@/lib/ageAdaptivePrompts';
import {
  applyFinalSynthesis,
  applyPerspectiveExpansion,
  canSubmitChallengeAnswer,
  captureAnswerDraft,
  challengeSessionKey,
  createChallengeSession,
  restoreChallengeSession,
  shouldRenderAnswerInput,
  type ChallengeSession,
  type ChallengeSessionKeyInput,
} from '@/lib/challengeSession';
import {
  languageOptions,
  localizeCategory,
  localizeQuestion,
  localizeText,
  setStoredLanguageValue,
  type Language,
  uiCopy,
} from '@/lib/reasoningI18n';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';

type Props = {
  category: string;
  questions: string[];
};

type Feedback = {
  analysis?: string;
  contrarian?: string;
  finalSynthesis?: string;
  followUp?: string;
  perspectiveExpansion?: string;
  score?: number;
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
    selectQuestion: 'Start with this',
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
    selectQuestion: 'Empezar con esta',
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
    selectQuestion: 'Commencer avec celle-ci',
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

function getQuestionId(category: string, index: number) {
  return `${category}-${index}`;
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

export default function LessonQuestionClient({ category, questions }: Props) {
  const [language, setLanguage] = useState<Language>('en');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ageBand, setAgeBand] = useState('18_plus');
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const copy = uiCopy[language];
  const flow = flowCopy[language];
  const visibleCategory = localizeCategory(category, language);
  const safeAgeBand = normalizeAgeBand(ageBand);
  const localizedQuestions = useMemo(
    () => questions.map((question, index) => localizeQuestion(category, index, question, language)),
    [category, language, questions]
  );
  const adaptedQuestions = useMemo(
    () =>
      localizedQuestions.map((question, index) =>
        adaptQuestionForAge(question, category, safeAgeBand, index)
      ),
    [category, localizedQuestions, safeAgeBand]
  );
  const selectedQuestion = adaptedQuestions[selectedIndex] || adaptedQuestions[0] || '';
  const profile = typeof window === 'undefined' ? null : readProfile();
  const userId = profile?.id || null;
  const keyInput: ChallengeSessionKeyInput = {
    ageBand: safeAgeBand,
    category,
    language,
    questionId: getQuestionId(category, selectedIndex),
    questionIndex: selectedIndex,
    userId,
  };
  const activeStorageKey = challengeSessionKey(keyInput);

  useEffect(() => {
    const storedLanguage = localStorage.getItem('uthynk-language');
    const initialProfile = readProfile();

    if (storedLanguage === 'en' || storedLanguage === 'es' || storedLanguage === 'fr') {
      setLanguage(storedLanguage);
    }

    setAgeBand(initialProfile?.age_band || '18_plus');

    trackEvent(
      createTelemetryEvent('lesson_category_arrived', initialProfile?.id, {
        category,
        questions: questions.length,
      })
    );
  }, [category, questions.length]);

  useEffect(() => {
    const raw = localStorage.getItem(activeStorageKey);

    if (!raw) {
      setSession(null);
      setAnswer('');
      setRestored(false);
      return;
    }

    try {
      const parsed = restoreChallengeSession(JSON.parse(raw));

      if (parsed) {
        setSession(parsed);
        setAnswer(parsed.activeAnswerDraft);
        setRestored(true);
        return;
      }
    } catch {
      localStorage.removeItem(activeStorageKey);
    }

    setSession(null);
    setAnswer('');
    setRestored(false);
  }, [activeStorageKey]);

  useEffect(() => {
    if (!session) return;
    localStorage.setItem(challengeSessionKey(session), JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'es' ? 'es-US' : language === 'fr' ? 'fr-FR' : 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      setAnswer(transcript);
      setSession((current) => captureAnswerDraft(current, transcript));
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
    setSession((current) => captureAnswerDraft(current, nextAnswer));
  }

  function startNewChallenge() {
    localStorage.removeItem(activeStorageKey);
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
        category,
        challenge: active.originalQuestion,
        conversationId: active.conversationId,
        displayedQuestion: active.originalQuestion,
        firstUserAnswer: active.firstResponse,
        language,
        originalQuestion: active.originalQuestion,
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
        session ||
        createChallengeSession({
          ...keyInput,
          conversationId: crypto.randomUUID(),
          originalQuestion: selectedQuestion,
          sessionId: crypto.randomUUID(),
        });

      if (active.step === 'main_question') {
        const feedback = await requestFeedback('follow_up', active, submittedAnswer);
        setSession(applyPerspectiveExpansion(active, submittedAnswer, feedback));
        setAnswer('');
        return;
      }

      if (active.step === 'secondary_question') {
        const feedback = await requestFeedback('synthesis', active, submittedAnswer);
        const completed = applyFinalSynthesis(active, submittedAnswer, feedback);
        setSession(completed);
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
      <header className="appTop card">
        <a href="/" className="appBrandText">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
          <span className="brandCopy">
            <strong>UThynk</strong>
            <small>Better thinking. <em>Better decisions.</em></small>
          </span>
        </a>

        <div className="topControls">
          <nav className="appNav">
            <a href="/">{copy.home}</a>
            <a href="/lessons">{copy.lessonsNav}</a>
            <a href="/teacher">{copy.teacherNav}</a>
            <a href="/profile">{copy.profileNav}</a>
            <a href="/feedback">{copy.feedbackNav}</a>
            <a href="/store">{copy.storeNav}</a>
          </nav>

          <label className="languageSelectLabel topLanguageSelect">
            <span>{copy.adaptiveLanguage}</span>
            <select
              aria-label={copy.adaptiveLanguage}
              className="languageSelect"
              value={language}
              disabled={loading}
              onChange={(event) => changeLanguage(event.target.value as Language)}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">{flow.category}</div>
          <h1>{visibleCategory}</h1>
          <p>{flow.intro}</p>
        </div>
      </section>

      <section className="lessonQuestionLayout" style={{ maxWidth: '100%', minWidth: 0, width: '100%' }}>
        <div className="lessonQuestionList" style={{ minWidth: 0 }}>
          {adaptedQuestions.map((question, index) => (
            <button
              className={selectedIndex === index ? 'lessonQuestion active' : 'lessonQuestion'}
              disabled={loading || Boolean(session)}
              key={`${category}-${index}-${question}`}
              onClick={() => selectQuestion(index)}
              type="button"
            >
              <span>{flow.selectQuestion}</span>
              {question}
            </button>
          ))}
        </div>

        <div className="card lessonStartPanel" style={{ minWidth: 0 }}>
          <div className="panelLabel">{flow.selected}</div>
          {safeAgeBand !== '18_plus' ? (
            <div className="ageModeBadge">{ageBandLabel(safeAgeBand)}</div>
          ) : null}
          <h2>{session?.originalQuestion || selectedQuestion}</h2>

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
              {session.growthIndicators.length ? (
                <div className="thinkingLabelLayer">
                  {session.growthIndicators.map((item) => (
                    <span key={item}>{localizeText(item, language)}</span>
                  ))}
                </div>
              ) : null}
              <strong>{flow.complete}</strong>
            </div>
          ) : null}

          {inputVisible ? (
            <>
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
            <button className="btn" disabled={loading} onClick={startNewChallenge} type="button">
              {flow.clear}
            </button>
          ) : null}
        </div>
      </section>
    </>
  );
}
