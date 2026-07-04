'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  languageOptions,
  localizeCategory,
  type Language,
  uiCopy,
} from '@/lib/reasoningI18n';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';
import { slugifyCategory } from '@/lib/questionBank';

type LessonCategory = {
  category: string;
  count: number;
};

type Props = {
  categories: LessonCategory[];
};

export default function LessonLanguageShell({ categories }: Props) {
  const [language, setLanguage] = useState<Language>('en');
  const copy = uiCopy[language];

  useEffect(() => {
    const storedLanguage = localStorage.getItem('uthynk-language');
    const storedProfile = localStorage.getItem('uthynk-profile');
    const profile = storedProfile ? JSON.parse(storedProfile) : null;

    if (storedLanguage === 'en' || storedLanguage === 'es' || storedLanguage === 'fr') {
      setLanguage(storedLanguage);
    }

    trackEvent(createTelemetryEvent('lessons_arrived', profile?.id, { categories: categories.length }));
  }, []);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    localStorage.setItem('uthynk-language', nextLanguage);
  }

  function trackCategorySelection(category: string, source: string) {
    const storedProfile = localStorage.getItem('uthynk-profile');
    const profile = storedProfile ? JSON.parse(storedProfile) : null;

    trackEvent(
      createTelemetryEvent('selected_category', profile?.id, {
        category,
        source,
      })
    );
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

        <div className="topControls">
          <nav className="appNav">
            <Link href="/">{copy.home}</Link>
            <Link href="/lessons">Lessons</Link>
            <Link href="/teacher">Teacher</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/feedback">Feedback</Link>
            <Link href="/store">Store</Link>
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
          <div className="eyebrow">Lessons</div>
          <div className="panelLabel">Question Bank: Real-World Micro-Cases v4</div>
          <h1>{language === 'es' ? 'Elige una categoria de pensamiento.' : language === 'fr' ? 'Choisis une categorie de pensee.' : 'Choose a thinking category.'}</h1>
          <p>
            {language === 'es'
              ? 'Cada categoria abre una lista enfocada de preguntas para practicar una lente de razonamiento especifica.'
              : language === 'fr'
                ? 'Chaque categorie ouvre une liste de questions ciblees pour pratiquer une lentille de raisonnement precise.'
                : 'Each category opens a focused question list so UThynk can train the exact reasoning lens you want to practice.'}
          </p>
        </div>
      </section>

      <section className="lessonCategoryGrid">
        {categories.map((item) => (
          <Link
            className="card lessonCategoryCard"
            href={`/lessons/${slugifyCategory(item.category)}`}
            key={item.category}
            onClick={() => trackCategorySelection(item.category, 'lessons')}
          >
            <span className="panelLabel">
              {item.count} {language === 'es' ? 'preguntas' : language === 'fr' ? 'questions' : 'questions'}
            </span>
            <strong>{localizeCategory(item.category, language)}</strong>
            <p>
              {language === 'es'
                ? 'Abre una lista enfocada de preguntas para esta lente de razonamiento.'
                : language === 'fr'
                  ? 'Ouvre une liste de questions ciblees pour cette lentille de raisonnement.'
                  : 'Open a focused list of prompts for this reasoning lens.'}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
