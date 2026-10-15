'use client';

import Link from 'next/link';
import { LessonsNavLink } from './LessonDiscovery';
import RestrictedNavLinks from './RestrictedNavLinks';
import { languageOptions, uiCopy, type Language } from '@/lib/reasoningI18n';
import { pathCopy } from '@/lib/pathCopy';

export default function LessonAppHeader({ language, changeLanguage, disabled = false }: {
  language: Language;
  changeLanguage: (language: Language) => void;
  disabled?: boolean;
}) {
  const copy = uiCopy[language];
  return <header className="appTop card">
    <Link href="/" className="appBrandText">
      <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
      <span className="brandCopy"><strong>UThynk</strong><small>Better thinking. <em>Better decisions.</em></small></span>
    </Link>
    <div className="topControls">
      <nav className="appNav">
        <Link href="/">{copy.home}</Link>
        <LessonsNavLink language={language} />
        <Link href="/thinking-paths">{pathCopy[language].title} <small>{pathCopy[language].beta}</small></Link>
        <Link href="/classroom">{copy.classroomNav}</Link>
        <Link href="/leaderboard">{copy.participationNav}</Link>
        <RestrictedNavLinks />
        <Link href="/profile">{copy.profileNav}</Link>
        <Link href="/feedback">{copy.feedbackNav}</Link>
        <Link href="/store">{copy.storeNav}</Link>
      </nav>
      <label className="languageSelectLabel topLanguageSelect">
        <span>{copy.adaptiveLanguage}</span>
        <select aria-label={copy.adaptiveLanguage} className="languageSelect" value={language} disabled={disabled}
          onChange={event => changeLanguage(event.target.value as Language)}>
          {languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </div>
  </header>;
}
