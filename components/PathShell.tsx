'use client';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredLanguageValue, setStoredLanguageValue, languageOptions, UTHYNK_LANGUAGE_EVENT, type Language } from '@/lib/reasoningI18n';
import { pathCopy } from '@/lib/pathCopy';
import styles from './ThinkingPaths.module.css';

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
  const copy = pathCopy[language];
  return <main className={styles.shell}>
    <header className={`card ${styles.header}`}>
      <Link href="/" className="appBrandText"><img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" /><strong>UThynk</strong></Link>
      <nav aria-label={copy.title}><Link href="/">{copy.home}</Link><Link href="/lessons">{copy.lessons}</Link><ThinkingPathsNavLink language={language} /></nav>
      <label>{copy.language}<select aria-label={copy.language} value={language} onChange={event => changeLanguage(event.target.value as Language)}>{languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    </header>
    {children}
  </main>;
}
export function PathGuide({ language }: { language: Language }) {
  const copy = pathCopy[language];
  return <section className={`card ${styles.guide}`}><h2>{copy.guide}</h2><ol>{copy.steps.map((step, index) => <li key={step}><span className={styles.stepIcon} aria-hidden="true">{['◇', '▤', '✦'][index]}</span><strong>{index + 1}. {step}</strong><p>{copy.stepDetails[index]}</p></li>)}</ol></section>;
}
