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
  const [recommendations, setRecommendations] = useState<LessonCategory[]>(
    getRecommendedCategories(categories, null)
  );
  const copy = uiCopy[language];

  useEffect(() => {
    const storedLanguage = localStorage.getItem('uthynk-language');
    const storedProfile = localStorage.getItem('uthynk-profile');
    const profile = storedProfile ? JSON.parse(storedProfile) : null;

    if (storedLanguage === 'en' || storedLanguage === 'es' || storedLanguage === 'fr') {
      setLanguage(storedLanguage);
    }

    setRecommendations(getRecommendedCategories(categories, profile));

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

      <section className="recommendedLessons">
        <div className="recommendedLessonsHeader">
          <div>
            <span className="panelLabel">
              {language === 'es' ? 'Recomendado para ti' : language === 'fr' ? 'Recommande pour toi' : 'Recommended For You'}
            </span>
            <h2>
              {language === 'es'
                ? 'Empieza con una ruta clara.'
                : language === 'fr'
                  ? 'Commence avec une piste claire.'
                  : 'Start with a clearer path.'}
            </h2>
          </div>
          <p>
            {language === 'es'
              ? 'Basado en tu perfil, estas categorias reducen la decision inicial.'
              : language === 'fr'
                ? 'Selon ton profil, ces categories reduisent le choix initial.'
                : 'Based on your profile, these categories reduce the first-choice friction.'}
          </p>
        </div>

        <div className="recommendedLessonGrid">
          {recommendations.map((item) => (
            <Link
              className="card recommendedLessonCard"
              href={`/lessons/${slugifyCategory(item.category)}`}
              key={`recommended-${item.category}`}
              onClick={() => trackCategorySelection(item.category, 'lesson_recommendation')}
            >
              <span className="panelLabel">
                {item.count} {language === 'es' ? 'preguntas' : language === 'fr' ? 'questions' : 'questions'}
              </span>
              <strong>{localizeCategory(item.category, language)}</strong>
              <p>
                {language === 'es'
                  ? 'Buena opcion para empezar sin revisar toda la lista.'
                  : language === 'fr'
                    ? 'Un bon choix pour commencer sans parcourir toute la liste.'
                    : 'A strong starting point without scanning the whole library.'}
              </p>
            </Link>
          ))}
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

function getRecommendedCategories(categories: LessonCategory[], profile: any) {
  const available = new Map(categories.map((item) => [item.category, item]));
  const profileText = [
    profile?.primary_trait,
    profile?.rank,
    profile?.onboarding_goal,
    profile?.onboarding_style,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const preferred = [
    ...(profileText.includes('strateg') ? ['Strategic Thinking', 'Work & Ambition'] : []),
    ...(profileText.includes('evidence') || profileText.includes('analyt')
      ? ['Science & Evidence', 'Epistemology', 'Logic & Debate']
      : []),
    ...(profileText.includes('financial') || profileText.includes('money')
      ? ['Financial Judgment']
      : []),
    ...(profileText.includes('ethic') || profileText.includes('value')
      ? ['Ethics & Values']
      : []),
    'Work & Ambition',
    'Logic & Debate',
    'Financial Judgment',
    'Epistemology',
    'Strategic Thinking',
  ];

  const selected: LessonCategory[] = [];

  preferred.forEach((category) => {
    const match = available.get(category);
    if (match && !selected.some((item) => item.category === match.category)) {
      selected.push(match);
    }
  });

  categories.forEach((item) => {
    if (selected.length < 3 && !selected.some((selectedItem) => selectedItem.category === item.category)) {
      selected.push(item);
    }
  });

  return selected.slice(0, 3);
}
