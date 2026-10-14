'use client';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredLanguageValue, setStoredLanguageValue, UTHYNK_LANGUAGE_EVENT, type Language } from '@/lib/reasoningI18n';
import { pathCopy } from '@/lib/pathCopy';
import styles from './ThinkingPaths.module.css';
import LessonAppHeader from './LessonAppHeader';

export function usePathLanguage() {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguageValue());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(UTHYNK_LANGUAGE_EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(UTHYNK_LANGUAGE_EVENT, sync); };
  }, []);
  return { language, changeLanguage: (value: Language) => { setLanguage(value); setStoredLanguageValue(value); } };
}
export function ThinkingPathsNavLink({ language }: { language: Language }) {
  return <Link href="/thinking-paths">{pathCopy[language].title} <small>{pathCopy[language].beta}</small></Link>;
}
export default function PathShell({ language, changeLanguage, children }: { language: Language; changeLanguage: (value: Language) => void; children: ReactNode }) {
  return <main className={`appShell ${styles.shell}`}>
    <LessonAppHeader language={language} changeLanguage={changeLanguage} />
    {children}
  </main>;
}
export function PathGuide({ language }: { language: Language }) {
  const copy = pathCopy[language];
  return <section className={`card ${styles.guide}`}><h2>{copy.guide}</h2><ol>{copy.steps.map((step, index) => <li key={step}><span className={styles.stepIcon} aria-hidden="true">{['◇', '▤', '✦'][index]}</span><strong>{index + 1}. {step}</strong><p>{copy.stepDetails[index]}</p></li>)}</ol></section>;
}
