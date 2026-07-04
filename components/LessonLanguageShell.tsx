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
  description: string;
};

type Props = {
  categories: LessonCategory[];
};

const categoryDescriptions: Record<Language, Record<string, string>> = {
  en: {},
  es: {
    'Logic & Critical Thinking': 'Evalua argumentos, suposiciones, contradicciones y afirmaciones debiles.',
    Epistemology: 'Pregunta como sabemos que algo es cierto y cuanta certeza esta justificada.',
    'Ethics & Moral Reasoning': 'Razona sobre justicia, deber, dano, responsabilidad y consecuencias.',
    'Strategic Thinking': 'Piensa varios movimientos adelante antes de decidir.',
    'Street Lessons': 'Practica juicio real sobre confianza, respeto, presion, riesgo y consecuencias.',
    'Financial Judgment': 'Toma mejores decisiones sobre dinero, riesgo, deuda y tiempo.',
    'Leadership & Influence': 'Dirige, comunica, persuade y construye confianza con responsabilidad.',
    'Media & Information Literacy': 'Evalua titulares, encuadres, fuentes, sesgos y contexto faltante.',
    'Science & Evidence': 'Entiende estudios, incertidumbre, causalidad y calidad de evidencia.',
    'History & Civilization': 'Aprende de eventos historicos, lideres, instituciones y consecuencias.',
    'Technology & AI': 'Piensa con claridad sobre IA, privacidad, automatizacion, algoritmos y tradeoffs.',
    'Creativity & Innovation': 'Reformula problemas, prueba ideas y crea alternativas practicas.',
    'Work, Purpose & Ambition': 'Piensa con claridad sobre carrera, disciplina, sacrificio, proposito y exito.',
    'Identity & Human Behavior': 'Desarrolla autoconciencia sobre emociones, habitos, sesgos y patrones.',
    'Literature & Timeless Wisdom': 'Usa historias, libros, proverbios e ideas clasicas para entender la vida.',
  },
  fr: {
    'Logic & Critical Thinking': 'Evalue les arguments, les hypotheses, les contradictions et les affirmations faibles.',
    Epistemology: 'Demande comment nous savons ce qui est vrai et quel degre de certitude est justifie.',
    'Ethics & Moral Reasoning': 'Raisonne sur l equite, le devoir, le tort, la responsabilite et les consequences.',
    'Strategic Thinking': 'Pense plusieurs coups a l avance avant de choisir.',
    'Street Lessons': 'Travaille le jugement pratique sur la confiance, le respect, la pression, le risque et les consequences.',
    'Financial Judgment': 'Prends de meilleures decisions sur l argent, le risque, la dette et le temps.',
    'Leadership & Influence': 'Dirige, communique, persuade et construis la confiance avec responsabilite.',
    'Media & Information Literacy': 'Evalue les titres, le cadrage, les sources, les biais et le contexte manquant.',
    'Science & Evidence': 'Comprends les etudes, l incertitude, la causalite et la qualite des preuves.',
    'History & Civilization': 'Apprends des evenements historiques, des dirigeants, des institutions et des consequences.',
    'Technology & AI': 'Pense clairement a l IA, la vie privee, l automatisation, les algorithmes et les compromis.',
    'Creativity & Innovation': 'Reformule les problemes, teste les idees et cree des alternatives pratiques.',
    'Work, Purpose & Ambition': 'Pense clairement a la carriere, la discipline, le sacrifice, le but et la reussite.',
    'Identity & Human Behavior': 'Developpe la conscience de soi autour des emotions, des habitudes, des biais et des comportements.',
    'Literature & Timeless Wisdom': 'Utilise les histoires, les livres, les proverbes et les idees classiques pour comprendre la vie.',
  },
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

  function getDescription(item: LessonCategory) {
    return categoryDescriptions[language][item.category] || item.description;
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
            <Link href="/lessons">{copy.lessonsNav}</Link>
            <Link href="/teacher">{copy.teacherNav}</Link>
            <Link href="/profile">{copy.profileNav}</Link>
            <Link href="/feedback">{copy.feedbackNav}</Link>
            <Link href="/store">{copy.storeNav}</Link>
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
          <div className="eyebrow">{copy.lessonsNav}</div>
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
            <p>{getDescription(item)}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
