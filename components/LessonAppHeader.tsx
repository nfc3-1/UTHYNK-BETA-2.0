'use client';

import BrandHome from '@/components/BrandHome';
import AppNavigation from './AppNavigation';
import { languageOptions, uiCopy, type Language } from '@/lib/reasoningI18n';

export default function LessonAppHeader({ language, changeLanguage, disabled = false }: {
  language: Language;
  changeLanguage: (language: Language) => void;
  disabled?: boolean;
}) {
  const copy = uiCopy[language];
  return <header className="appTop card">
    <BrandHome language={language} />
    <div className="topControls">
      <AppNavigation language={language} />
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
