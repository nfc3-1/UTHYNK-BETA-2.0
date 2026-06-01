'use client';

import { useState } from 'react';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';

export default function FeedbackForm() {
  const [message, setMessage] = useState('');
  const [context, setContext] = useState('general');
  const [status, setStatus] = useState('');

  async function submitFeedback() {
    if (!message.trim()) return;

    const storedProfile = localStorage.getItem('uthynk-profile');
    const profile = storedProfile ? JSON.parse(storedProfile) : null;

    await trackEvent(
      createTelemetryEvent('provided_feedback', profile?.id, {
        context,
        message: message.trim(),
        path: window.location.pathname,
      })
    );

    setMessage('');
    setStatus('Thanks. Your feedback was sent.');
  }

  return (
    <section className="card feedbackPanel">
      <div className="panelLabel">Beta Feedback</div>
      <h1>Help shape UThynk.</h1>
      <p>
        Tell us what felt confusing, useful, slow, repetitive, or surprisingly helpful.
        Short notes are perfect.
      </p>

      <label>
        <span>Feedback area</span>
        <select value={context} onChange={(event) => setContext(event.target.value)}>
          <option value="general">General impression</option>
          <option value="first_session">First session</option>
          <option value="questions">Questions or categories</option>
          <option value="language">Language / translation</option>
          <option value="mobile">Mobile layout</option>
          <option value="profile">Profile / progress</option>
          <option value="bug">Bug or broken flow</option>
        </select>
      </label>

      <label>
        <span>Your note</span>
        <textarea
          className="textarea"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What should we improve before beta?"
        />
      </label>

      <button className="btn btnPrimary" type="button" onClick={submitFeedback} disabled={!message.trim()}>
        Send feedback
      </button>

      {status ? <span className="feedbackStatus">{status}</span> : null}
    </section>
  );
}
