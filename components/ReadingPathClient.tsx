'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import LessonQuestionClient from './LessonQuestionClient';
import PathShell, { usePathLanguage } from './PathShell';
import type { ReadingPath, PathText } from '@/lib/thinkingPathTypes';
import { pathCopy } from '@/lib/pathCopy';
import { readingProgress } from '@/lib/readingProgress';
import { normalizeAgeBand } from '@/lib/ageAdaptivePrompts';
import styles from './ThinkingPaths.module.css';

export default function ReadingPathClient({ pathSlug, pathTitle, reading, moduleId, userId }: { pathSlug: string; pathTitle: PathText; reading: ReadingPath; moduleId: string; userId: string }) {
  const { language, changeLanguage } = usePathLanguage();
  const copy = pathCopy[language];
  const [progress, setProgress] = useState<Record<string, 'complete' | 'saved' | 'untouched'>>({});
  const moduleIndex = reading.modules.findIndex(readingModule => readingModule.id === moduleId);
  const readingModule = reading.modules[moduleIndex];
  const next = reading.modules[moduleIndex + 1];
  const baseUrl = `/thinking-paths/${pathSlug}/${reading.slug}`;
  const questions = useMemo(() => [readingModule.question.en], [readingModule]);
  const ids = useMemo(() => [readingModule.id], [readingModule]);
  const translations = useMemo(() => ({ en: [readingModule.question.en], es: [readingModule.question.es], fr: [readingModule.question.fr] }), [readingModule]);
  const refreshProgress = useCallback(() => {
    let ageBand = '18_plus';
    try { ageBand = normalizeAgeBand(JSON.parse(localStorage.getItem('uthynk-profile') || '{}')?.age_band); } catch { /* Use existing adult default. */ }
    setProgress(Object.fromEntries(reading.modules.map(readingModule => [readingModule.id, readingProgress(localStorage, readingModule, userId, ageBand, 'en')])));
  }, [reading, userId]);
  useEffect(() => { refreshProgress(); window.addEventListener('storage', refreshProgress); return () => window.removeEventListener('storage', refreshProgress); }, [refreshProgress]);
  return <PathShell language={language} changeLanguage={changeLanguage}>
    <section className={`card ${styles.hero}`}><Link href={`/thinking-paths/${pathSlug}`}>{pathTitle[language]}</Link><h1>{reading.title[language]}</h1><p>{reading.description[language]}</p></section>
    <div className={styles.readingLayout}>
      <aside className={`card ${styles.readingNav}`}><h2>{copy.progress}</h2><ol>{reading.modules.map((item, index) => <li key={item.id}><Link href={`${baseUrl}?lesson=${item.id}`} aria-current={item.id === readingModule.id ? 'page' : undefined}>{index + 1}. {item.title[language]}<span className={styles.status}>{copy[progress[item.id] || 'untouched']}</span></Link></li>)}</ol><p className={styles.review}>{copy.local}</p></aside>
      <div className={styles.readingContent}><article className={`card ${styles.passage}`}><span className={styles.badge}>{copy.reading} · {moduleIndex + 1} / {reading.modules.length}</span><h2 className={styles.readingTitle}>{readingModule.title[language]}</h2><p>{readingModule.work[language]} · {readingModule.author}</p><p className={styles.review}>{readingModule.location[language]} · {readingModule.edition}</p>
        {readingModule.contentNote && <p className={styles.note}>{readingModule.contentNote[language]}</p>}
        <h2>{readingModule.sourceKind === 'excerpt' ? copy.excerpt : copy.guided}</h2>
        <div className={styles.passageText} data-reading-passage={readingModule.id}>{readingModule.text[language].split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        <a href={readingModule.sourceUrl} target="_blank" rel="noopener noreferrer">{copy.source} ↗</a>
        <p className={styles.review}><a href={readingModule.rightsEvidence.statusUrl} target="_blank" rel="noopener noreferrer">{copy.publicDomain}</a></p>
        <details className={styles.angles}><summary>{copy.context}</summary><p>{readingModule.plainLanguage[language]}</p><h3>{copy.lenses}</h3><ul>{readingModule.lenses.map(lens => <li key={lens.en}>{lens[language]}</li>)}</ul></details>
        {readingModule.editorialStatus === 'needs_review' && <p className={styles.review}>{copy.review}</p>}
        <a className={`btn ${styles.thinkLink}`} href="#reading-thinking">{copy.thinkAfterReading} ↓</a>
      </article>
      <section id="reading-thinking" className={styles.thinking} aria-label={copy.thinkAfterReading}>
    <LessonQuestionClient key={readingModule.id} category={readingModule.category} questions={questions} questionIds={ids} questionTranslations={translations} readingModuleId={readingModule.id} sessionUserId={userId} onSessionChange={refreshProgress} />
      </section>
    <section className={`card ${styles.footer}`}><Link href={`/thinking-paths/${pathSlug}`}>← {copy.back}</Link>{next ? <Link className="btn btnPrimary" href={`${baseUrl}?lesson=${next.id}`}>{copy.next}: {next.title[language]} →</Link> : <p>{copy.end}</p>}</section>
      </div>
    </div>
  </PathShell>;
}
