'use client';

import { useState } from 'react';

type Props = {
  category: string;
  questions: string[];
};

export default function LessonQuestionClient({ category, questions }: Props) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(questions[0] || '');
  const [error, setError] = useState('');

  async function startLesson(question = selectedQuestion) {
    if (!question || !answer.trim()) return;

    try {
      setLoading(true);
      setError('');
      setFeedback(null);

      const response = await fetch('/api/reasoning', {
        body: JSON.stringify({
          category,
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
        {questions.map((question) => (
          <button
            className={selectedQuestion === question ? 'lessonQuestion active' : 'lessonQuestion'}
            key={question}
            onClick={() => setSelectedQuestion(question)}
            type="button"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="card lessonStartPanel">
        <div className="panelLabel">Selected Question</div>
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
