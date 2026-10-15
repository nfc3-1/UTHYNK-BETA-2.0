"use client";
import { useEffect, useState } from "react";
import LessonQuestionClient from "@/components/LessonQuestionClient";
import {
  getStoredLanguageValue,
  setStoredLanguageValue,
  languageOptions,
  uiCopy,
  UTHYNK_LANGUAGE_EVENT,
  type Language,
} from "@/lib/reasoningI18n";
export default function AssignedLesson({
  target,
  assignmentId,
  userId,
  initialSession,
  comments,
  preview = false,
}: {
  target: any;
  preview?: boolean;
  assignmentId: string;
  userId: string;
  initialSession: any;
  comments: any[];
}) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguageValue());
    sync();
    window.addEventListener(UTHYNK_LANGUAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UTHYNK_LANGUAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return (
    <>
      <label className="languageSelectLabel">
        <span>{uiCopy[language].adaptiveLanguage}</span>
        <select
          aria-label={uiCopy[language].adaptiveLanguage}
          value={language}
          onChange={(e) => setStoredLanguageValue(e.target.value as Language)}
        >
          {languageOptions.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      {target.reading && (
        <article className="card teacherPanel">
          <h2>{target.reading.title[language]}</h2>
          <p>
            {target.reading.author} — {target.reading.work[language]}
          </p>
          {target.reading.text[language]
            .split(/\n\s*\n/)
            .map((text: string, i: number) => (
              <p key={i} style={{ whiteSpace: "pre-wrap" }}>
                {text}
              </p>
            ))}
          <a href={target.reading.sourceUrl} target="_blank" rel="noreferrer">
            {target.reading.location[language]}
          </a>
        </article>
      )}
      {preview ? (
        <section className="card teacherPanel">
          <h2>{target.translations[language]}</h2>
        </section>
      ) : (
        <LessonQuestionClient
          category={target.category}
          questions={[target.question]}
          questionIds={[target.id]}
          questionTranslations={{
            en: [target.translations.en],
            es: [target.translations.es],
            fr: [target.translations.fr],
          }}
          sessionUserId={userId}
          assignmentId={assignmentId}
          initialSession={initialSession}
        />
      )}
      {comments.length > 0 && (
        <section className="card teacherPanel">
          <h2>
            {language === "es"
              ? "Comentarios del profesor"
              : language === "fr"
                ? "Commentaires du professeur"
                : "Teacher comments"}
          </h2>
          {comments.map((c) => (
            <p key={c.id}>{c.body}</p>
          ))}
        </section>
      )}
    </>
  );
}
