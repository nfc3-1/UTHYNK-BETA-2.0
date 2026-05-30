'use client';

import { useEffect, useMemo, useState } from 'react';
import { adaptQuestionForAge, ageBandLabel, normalizeAgeBand } from '@/lib/ageAdaptivePrompts';

type Props = {
  category: string;
  questions: string[];
};

export default function LessonQuestionClient({ category, questions }: Props) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ageBand, setAgeBand] = useState('18_plus');
  const [error, setError] = useState('');
  const safeAgeBand = normalizeAgeBand(ageBand);
  const adaptedQuestions = useMemo(
    () => questions.map((question, index) => adaptQuestionForAge(question, category, safeAgeBand, index)),
    [category, questions, safeAgeBand]
  );
  const selectedQuestion = adaptedQuestions[selectedIndex] || adaptedQuestions[0] || '';

  useEffect(() => {
    const stored = localStorage.getItem('uthynk-profile');

    if (!stored) return;

    try {
      const profile = JSON.parse(stored);
      setAgeBand(profile?.age_band || '18_plus');
    } catch {
      setAgeBand('18_plus');
    }
  }, []);

  async function startLesson(question = selectedQuestion) {
    if (!question || !answer.trim()) return;

    try {
      setLoading(true);
      setError('');
      setFeedback(null);

      const response = await fetch('/api/reasoning', {
        body: JSON.stringify({
          category,
          ageBand: safeAgeBand,
          challenge: question,
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Lesson could not start.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="lessonQuestionLayout">
      <div className="lessonQuestionList">
        {adaptedQuestions.map((question, index) => (
          <button
            className={selectedIndex === index ? 'lessonQuestion active' : 'lessonQuestion'}
            key={`${category}-${index}-${question}`}
            onClick={() => setSelectedIndex(index)}
            type="button"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="card lessonStartPanel">
        <div className="panelLabel">Selected Question</div>
        {safeAgeBand !== '18_plus' ? (
          <div className="ageModeBadge">{ageBandLabel(safeAgeBand)}</div>
        ) : null}
        <h2>{selectedQuestion}</h2>
        <textarea
          className="textarea conversationInput"
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Answer the question, make a claim, or test an assumption."
          value={answer}
        />
        {error ? <p className="authError">{error}</p> : null}
        <button
          className="btn btnPrimary"
          disabled={loading || !answer.trim()}
          onClick={() => startLesson()}
          type="button"
        >
          {loading ? 'UThynk is reasoning...' : 'Start Lesson'}
        </button>
        {feedback ? (
          <div className="lessonFeedback">
            <strong>{feedback.trait || 'UThynk feedback'}</strong>
            <p>{feedback.analysis}</p>
            <p>{feedback.contrarian}</p>
            <p>{feedback.followUp}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
