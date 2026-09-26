'use client';

import RestrictedNavLinks from '@/components/RestrictedNavLinks';
import { profileText } from '@/lib/profileI18n';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  getAdaptiveChallenges,
  getCoachingIntensity,
} from '@/lib/adaptive';
import { type Language, localizeText, localizeCategory, localizeChallenge, getStoredLanguageValue, UTHYNK_LANGUAGE_EVENT, uiCopy } from '@/lib/reasoningI18n';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';

const STORAGE_KEY = 'uthynk-profile';

export default function Profile() {
  const [style, setStyle] = useState('balanced');
  const [data, setData] = useState<any>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [snapshotStatus, setSnapshotStatus] = useState('');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('uthynk-language');
    if (storedLanguage === 'es' || storedLanguage === 'fr') {
      setLanguage(storedLanguage);
    }

    async function loadProfile() {
      const stored = localStorage.getItem(STORAGE_KEY);
      const profile = stored ? JSON.parse(stored) : null;
      const res = await fetch('/api/dashboard');
      const json = await res.json();

      setData({
        ...json,
        profile: {
          ...(json.profile || {}),
          ...(profile || {}),
          xp: json.profile?.xp ?? profile?.xp,
          streak: json.profile?.streak ?? profile?.streak,
          rank: json.profile?.rank ?? profile?.rank,
          reasoning_score: json.profile?.reasoning_score ?? profile?.reasoning_score,
          primary_trait: json.profile?.primary_trait ?? profile?.primary_trait,
        },
      });
    }

    loadProfile();
  }, []);

  useEffect(() => {
    function syncLanguage() { setLanguage(getStoredLanguageValue()); }
    window.addEventListener(UTHYNK_LANGUAGE_EVENT, syncLanguage);
    window.addEventListener('storage', syncLanguage);
    return () => { window.removeEventListener(UTHYNK_LANGUAGE_EVENT, syncLanguage); window.removeEventListener('storage', syncLanguage); };
  }, []);
  const t = (value: string) => profileText(value, language);
  const copy = uiCopy[language];
  const profile = useMemo(() => data?.profile || {}, [data?.profile]);
  const sessions = useMemo(() => data?.sessions || [], [data?.sessions]);
  const traits = useMemo(() => {
    const counts = new Map<string, number>();

    sessions.forEach((session: any) => {
      if (!session.trait_detected) return;
      counts.set(session.trait_detected, (counts.get(session.trait_detected) || 0) + 1);
    });

    const dynamicTraits = Array.from(counts.entries()).map(([label, count]) => ({
      label,
      value: Math.min(100, 62 + count * 6),
    }));

    return dynamicTraits.length
      ? dynamicTraits
      : [{ label: profile.primary_trait || 'Analytical', value: profile.reasoning_score || 70 }];
  }, [profile.primary_trait, profile.reasoning_score, sessions]);
  const averageReasoning = sessions.length
    ? Math.round(
        sessions.reduce((sum: number, session: any) => sum + (session.reasoning_score || 0), 0) /
          sessions.length
      )
    : profile.reasoning_score || 70;
  const recommendations = useMemo(() => getAdaptiveChallenges(profile), [profile]);
  const coachingIntensity = getCoachingIntensity(profile.streak, profile.reasoning_score);
  const identityLabels = [
    profile.primary_trait || 'Analytical Thinker',
    sessions.length >= 3 ? 'Evidence Builder' : 'Question Assumptions',
    averageReasoning >= 80 ? 'Strategic Pattern Spotter' : 'Growth in Progress',
  ];
  const snapshotText = [
    t('UThynk Thinking Snapshot'),
    `${t('Logic')}: ${averageReasoning}`,
    `${t('Strategy')}: ${Math.min(99, Math.max(0, averageReasoning + (sessions.length >= 3 ? 4 : 0)))}`,
    `${t('Evidence')}: ${traits[0]?.value || averageReasoning}`,
    `${t('Current trait')}: ${t(profile.primary_trait || 'Analytical Thinker')}`,
    `${t('Rank')}: ${t(profile.rank || 'Observer')}`,
    'https://uthynk-beta-2-0.vercel.app',
  ].join('\n');

  async function writeSnapshotToClipboard() {
    try {
      await navigator.clipboard.writeText(snapshotText);
      return true;
    } catch {
      const textarea = document.createElement('textarea');

      textarea.value = snapshotText;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);

      return copied;
    }
  }

  async function copySnapshot() {
    const copied = await writeSnapshotToClipboard();

    setSnapshotStatus(copied ? t('Snapshot copied') : t('Snapshot ready to share'));
    trackEvent(createTelemetryEvent('shared_thinking_snapshot', profile?.id, { method: copied ? 'copy' : 'copy_attempt' }));
  }

  function downloadSnapshot() {
    const blob = new Blob([snapshotText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'uthynk-thinking-snapshot.txt';
    link.click();
    URL.revokeObjectURL(url);
    setSnapshotStatus(t('Snapshot downloaded'));
    trackEvent(createTelemetryEvent('shared_thinking_snapshot', profile?.id, { method: 'download' }));
  }

  async function shareSnapshot() {
    try {
      if (navigator.share) {
        await navigator.share({
          text: snapshotText,
          title: t('UThynk Thinking Snapshot'),
          url: 'https://uthynk-beta-2-0.vercel.app',
        });
        setSnapshotStatus(t('Snapshot shared'));
        trackEvent(createTelemetryEvent('shared_thinking_snapshot', profile?.id, { method: 'native_share' }));
        return;
      }
    } catch {
      setSnapshotStatus(t('Share canceled'));
      return;
    }

    await copySnapshot();
  }

  return (
    <main className="appShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
          <span className="brandCopy">
            <strong>UThynk</strong>
            <small>Better thinking. <em>Better decisions.</em></small>
          </span>
        </Link>

        <nav className="appNav">
          <Link href="/">{copy.home}</Link>
          <Link href="/daily">{copy.dailyNav}</Link>
          <Link href="/lessons">{copy.lessonsNav}</Link>
          <RestrictedNavLinks />
          <Link href="/reasoning">{copy.reasoningNav}</Link>
          <Link href="/profile">{copy.profileNav}</Link>
          <Link href="/feedback">{copy.feedbackNav}</Link>
          <Link href="/store">{copy.storeNav}</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">{copy.profileNav}</div>
          <h1>{localizeText(profile.rank || 'Observer', language)}</h1>
          <p>
            {language === 'es'
              ? 'Tu identidad, progreso, rasgos e historial de sesiones viven en un solo lugar. UThynk sigue en quien se esta convirtiendo tu pensamiento.'
              : language === 'fr'
                ? 'Ton identite, tes progres, tes traits et ton historique de sessions vivent au meme endroit. UThynk suit ce que ton raisonnement devient.'
                : 'Your identity, progress, traits, and session history now live in one place. UThynk tracks who your thinking is becoming, not just what you scored.'}
          </p>
          <div className="profileIdentityTags">
            {identityLabels.map((label) => (
              <span key={label}>{t(label)}</span>
            ))}
          </div>
        </div>

        <div className="challengePreview">
          <div className="panelLabel">
            {language === 'es' ? 'Resumen de crecimiento' : language === 'fr' ? 'Apercu de progression' : 'Growth Snapshot'}
          </div>
          <h2>{localizeText(profile.primary_trait || 'Analytical Thinker', language)}</h2>
          <p>
            {language === 'es'
              ? `Modo de entrenamiento: ${t(coachingIntensity)}. Tus proximas sesiones deben fortalecer evidencia, adaptabilidad y restriccion estrategica.`
              : language === 'fr'
                ? `Mode d'accompagnement : ${t(coachingIntensity)}. Tes prochaines sessions devraient renforcer les preuves, l'adaptabilite et la retenue strategique.`
                : `Coaching mode: ${coachingIntensity}. Your next sessions should strengthen evidence, adaptability, and strategic restraint.`}
          </p>
          <div className="profileMetricStrip">
            <div>
              <strong>{profile.xp || 0}</strong>
              <span>XP</span>
            </div>
            <div>
              <strong>{profile.streak || 0}</strong>
              <span>{t('day streak')}</span>
            </div>
            <div>
              <strong>{profile.reasoning_score || 70}</strong>
              <span>{t('score')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="appGrid">
        <aside className="card statPanel">
          <div className="panelLabel">{t('Overview')}</div>

          <div className="statList">
            <div className="statItem">
              <span>{t('Current identity')}</span>
              <strong>{t(profile.primary_trait || 'Analytical')}</strong>
            </div>

            <div className="statItem">
              <span>{t('Completed')}</span>
              <strong>{sessions.length}</strong>
            </div>

            <div className="statItem">
              <span>{t('Average Reasoning')}</span>
              <strong>{averageReasoning}</strong>
            </div>

            <div className="statItem">
              <span>{t('Growth Trend')}</span>
              <strong>{t(sessions.length > 1 ? 'Active' : 'Starting')}</strong>
            </div>
          </div>
        </aside>

        <section className="card methodPanel">
          <div className="panelLabel">{t('Traits')}</div>

          <div className="methodSteps">
            {traits.map((trait) => (
              <div key={trait.label}>
                <strong>{trait.value}</strong>
                <span>{t(trait.label)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card snapshotPanel">
          <div className="panelLabel">{t('Thinking Snapshot')}</div>
          <div className="snapshotScoreGrid">
            <div>
              <strong>{averageReasoning}</strong>
              <span>{t('Logic')}</span>
            </div>
            <div>
              <strong>{Math.min(99, Math.max(0, averageReasoning + (sessions.length >= 3 ? 4 : 0)))}</strong>
              <span>{t('Strategy')}</span>
            </div>
            <div>
              <strong>{traits[0]?.value || averageReasoning}</strong>
              <span>{t('Evidence')}</span>
            </div>
          </div>
          <p>
            {t('Current trait')}: <strong>{t(profile.primary_trait || 'Analytical Thinker')}</strong>
          </p>
          <div className="snapshotActions">
            <button className="btn btnPrimary" type="button" onClick={shareSnapshot}>{t('Share')}</button>
            <button className="btn" type="button" onClick={copySnapshot}>{t('Copy')}</button>
            <button className="btn" type="button" onClick={downloadSnapshot}>{t('Download')}</button>
          </div>
          {snapshotStatus ? <span className="snapshotStatus">{snapshotStatus}</span> : null}
        </section>

        <section className="card focusPanel">
          <div className="panelLabel">{t('Recommended Next')}</div>

          <div className="focusGrid" style={{ gridTemplateColumns: '1fr' }}>
            {recommendations.slice(0, 4).map((challenge) => (
              <Link
                href={`/reasoning?id=${challenge.id}`}
                className="focusCard"
                key={challenge.id}
              >
                <strong>{localizeChallenge(challenge, language).title}</strong>
                <span>{localizeCategory(challenge.category, language)} - {localizeText(challenge.difficulty, language)}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="appGrid profileLowerGrid">
        <section className="card focusPanel">
          <div className="panelLabel">{t('Session History')}</div>

          <div className="focusGrid" style={{ gridTemplateColumns: '1fr' }}>
            {sessions.slice(0, 6).map((session: any) => (
              <div className="focusCard" key={session.id}>
                <strong>{t(session.trait_detected || 'Trait evolving')}</strong>
                <span>
                  {localizeCategory(session.challenge_category, language) || t('Reasoning Session')} - {session.reasoning_score || 0}
                </span>
              </div>
            ))}
            {!sessions.length ? (
              <div className="focusCard">
                <strong>{t('No completed sessions yet')}</strong>
                <span>{t('Complete a reasoning challenge to start building history.')}</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="card methodPanel">
          <div className="panelLabel">{t('Challenge Intensity')}</div>

          <div className="methodSteps">
            {[
              ['gentle', 'Gentle Reflection'],
              ['balanced', 'Balanced Challenge'],
              ['strong', 'Strong Challenge'],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  checked={style === value}
                  onChange={() => setStyle(value)}
                />{' '}
                {t(label)}
              </label>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
