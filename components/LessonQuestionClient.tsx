'use client';

import { useEffect, useMemo, useState } from 'react';
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

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    localStorage.setItem('uthynk-language', nextLanguage);
  }

  async function startLesson(question = selectedQuestion) {
    if (!question || !answer.trim()) return;

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
            <a href="/lessons">Lessons</a>
            <a href="/profile">Profile</a>
            <a href="/feedback">Feedback</a>
            <a href="/store">Store</a>
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
            onClick={() => {
              setSelectedIndex(index);
              const storedProfile = localStorage.getItem('uthynk-profile');
              const profile = storedProfile ? JSON.parse(storedProfile) : null;
              trackEvent(
                createTelemetryEvent('selected_question', profile?.id, {
                  category,
                  questionIndex: index,
                  source: 'lesson',
                })
              );
            }}
            type="button"
          >
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
          <textarea
            className="textarea conversationInput"
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={copy.placeholder}
            value={answer}
          />
          {error ? <p className="authError">{error}</p> : null}
          <button
            className="btn btnPrimary"
            disabled={loading || !answer.trim()}
            onClick={() => startLesson()}
            type="button"
          >
            {loading ? copy.sending : language === 'es' ? 'Empezar leccion' : language === 'fr' ? 'Commencer la lecon' : 'Start Lesson'}
          </button>
          {feedback ? (
            <div className="lessonFeedback">
              <strong>{localizeText(feedback.trait, language) || 'UThynk feedback'}</strong>
              <p>{localizeText(feedback.analysis, language)}</p>
              <p>{localizeText(feedback.contrarian, language)}</p>
              <p>{localizeText(feedback.followUp, language)}</p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
