'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adaptQuestionForAge, ageBandLabel, normalizeAgeBand } from '@/lib/ageAdaptivePrompts';
import {
  languageOptions,
  localizeCategory,
  localizeQuestion,
  localizeText,
  type Language,
  uiCopy,
} from '@/lib/reasoningI18n';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';

type Props = {
  category: string;
  questions: string[];
};

export default function LessonQuestionClient({ category, questions }: Props) {
  const [language, setLanguage] = useState<Language>('en');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ageBand, setAgeBand] = useState('18_plus');
  const [error, setError] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const copy = uiCopy[language];
  const visibleCategory = localizeCategory(category, language);
  const safeAgeBand = normalizeAgeBand(ageBand);
  const localizedQuestions = useMemo(
    () => questions.map((question, index) => localizeQuestion(category, index, question, language)),
    [category, language, questions]
  );
  const adaptedQuestions = useMemo(
    () =>
      localizedQuestions.map((question, index) =>
        adaptQuestionForAge(question, visibleCategory, safeAgeBand, index)
      ),
    [localizedQuestions, safeAgeBand, visibleCategory]
  );
  const selectedQuestion = adaptedQuestions[selectedIndex] || adaptedQuestions[0] || '';

  useEffect(() => {
    const storedLanguage = localStorage.getItem('uthynk-language');
    const storedProfile = localStorage.getItem('uthynk-profile');
    const profile = storedProfile ? JSON.parse(storedProfile) : null;

    if (storedLanguage === 'en' || storedLanguage === 'es' || storedLanguage === 'fr') {
      setLanguage(storedLanguage);
    }

    trackEvent(
      createTelemetryEvent('lesson_category_arrived', profile?.id, {
        category,
        questions: questions.length,
      })
    );

    if (!storedProfile) return;

    try {
      setAgeBand(profile?.age_band || '18_plus');
    } catch {
      setAgeBand('18_plus');
    }
  }, []);

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
    localStorage.setItem('uthynk-language', nextLanguage);
  }

  function selectQuestion(index: number) {
    setSelectedIndex(index);
    setFeedback(null);
    setError('');

    const storedProfile = localStorage.getItem('uthynk-profile');
    const profile = storedProfile ? JSON.parse(storedProfile) : null;
    trackEvent(
      createTelemetryEvent('selected_question', profile?.id, {
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

  async function startLesson(question = selectedQuestion) {
    if (!question) return;

    if (!answer.trim()) {
      setError(
        language === 'es'
          ? 'Escribe o dicta tu respuesta primero. Una o dos frases bastan.'
          : language === 'fr'
            ? "Ecris ou dicte d'abord ta reponse. Une ou deux phrases suffisent."
            : 'Write or speak your answer first. One or two sentences is enough.'
      );
      answerRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      setError('');
      setFeedback(null);
      const storedProfile = localStorage.getItem('uthynk-profile');
      const profile = storedProfile ? JSON.parse(storedProfile) : null;
      trackEvent(
        createTelemetryEvent('submitted_answer', profile?.id, {
          category,
          questionIndex: selectedIndex,
          responseLength: answer.length,
          source: 'lesson',
        })
      );

      const response = await fetch('/api/reasoning', {
        body: JSON.stringify({
          category,
          ageBand: safeAgeBand,
          challenge: question,
          language,
          question,
          response: answer,
          section: `lesson:${category}`,
          stream: false,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Lesson could not start.');
      }

      setFeedback(payload);
      trackEvent(
        createTelemetryEvent('completed_reasoning_loop', profile?.id, {
          category,
          questionIndex: selectedIndex,
          score: payload.score,
          source: 'lesson',
          xp: payload.xp,
        })
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Lesson could not start.');
    } finally {
      setLoading(false);
    }
  }

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
          <div className="eyebrow">{language === 'es' ? 'Categoria de leccion' : language === 'fr' ? 'Categorie de lecon' : 'Lesson Category'}</div>
          <h1>{visibleCategory}</h1>
          <p>
            {language === 'es'
              ? 'Elige una pregunta. UThynk evaluara tu respuesta con esta categoria como memoria de leccion.'
              : language === 'fr'
                ? 'Choisis une question. UThynk evaluera ta reponse avec cette categorie comme memoire de lecon.'
                : 'Pick one question. UThynk will evaluate your answer with this category attached as lesson memory.'}
          </p>
        </div>
      </section>

      <section className="lessonQuestionLayout">
        <div className="lessonQuestionList">
          {adaptedQuestions.map((question, index) => (
            <button
            className={selectedIndex === index ? 'lessonQuestion active' : 'lessonQuestion'}
            key={`${category}-${index}-${question}`}
            onClick={() => selectQuestion(index)}
            type="button"
          >
              <span>{language === 'es' ? 'Empezar con esta' : language === 'fr' ? 'Commencer avec celle-ci' : 'Start with this'}</span>
              {question}
            </button>
          ))}
        </div>

        <div className="card lessonStartPanel">
          <div className="panelLabel">
            {language === 'es' ? 'Pregunta seleccionada' : language === 'fr' ? 'Question selectionnee' : 'Selected Question'}
          </div>
          {safeAgeBand !== '18_plus' ? (
            <div className="ageModeBadge">{ageBandLabel(safeAgeBand)}</div>
          ) : null}
          <h2>{selectedQuestion}</h2>
          <p className="lessonPromptHint">
            {language === 'es'
              ? 'Responde con tu mejor razonamiento. Puedes escribir o usar voz a texto.'
              : language === 'fr'
                ? 'Reponds avec ton meilleur raisonnement. Tu peux ecrire ou utiliser la dictee vocale.'
                : 'Respond with your best reasoning. You can type or use voice to text.'}
          </p>
          <textarea
            ref={answerRef}
            className="textarea conversationInput"
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={copy.placeholder}
            value={answer}
          />
          {error ? <p className="authError">{error}</p> : null}
          {voiceStatus ? <p className="panelNote">{voiceStatus}</p> : null}
          <div className="lessonActionRow">
            <button
              className="btn btnPrimary"
              disabled={loading}
              onClick={() => startLesson()}
              type="button"
            >
              {loading ? copy.sending : language === 'es' ? 'Empezar a pensar' : language === 'fr' ? 'Commencer a penser' : 'Start Thinking'}
            </button>
            <button
              className="btn"
              disabled={!voiceSupported}
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
          {feedback ? (
            <div className="lessonFeedback">
              <div className="plainResponseLayer">
                <span>UThynk</span>
                <p>
                  {language === 'es'
                    ? 'Vas bien, pero necesito una prueba mas clara. Cual es el ejemplo mas fuerte que apoya tu punto?'
                    : language === 'fr'
                      ? "Tu vas dans la bonne direction, mais il manque une preuve plus claire. Quel est l'exemple le plus fort?"
                      : "I like where you're going, but I'm missing proof. What's the strongest example that supports your point?"}
                </p>
              </div>
              <div className="thinkingLabelLayer">
                <span>{localizeText(feedback.trait, language) || copy.rewardPattern}</span>
                <span>{localizeText(feedback.strengths?.[0] || 'Independent Verification', language)}</span>
                <span>{localizeText(feedback.weaknesses?.[0] || 'Evidence +1', language)}</span>
              </div>
              <details className="advancedExplanationLayer">
                <summary>
                  {language === 'es'
                    ? 'Por que UThynk dijo esto'
                    : language === 'fr'
                      ? 'Pourquoi UThynk a dit cela'
                      : 'Why UThynk said this'}
                </summary>
                <div>
                  <p>{localizeText(feedback.analysis, language)}</p>
                  <p>{localizeText(feedback.contrarian, language)}</p>
                  <p>{localizeText(feedback.followUp, language)}</p>
                </div>
              </details>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
