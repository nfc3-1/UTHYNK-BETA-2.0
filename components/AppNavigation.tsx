"use client";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import RestrictedNavLinks from "@/components/RestrictedNavLinks";
import { LessonsNavLink } from "@/components/LessonDiscovery";
import { uiCopy, type Language } from "@/lib/reasoningI18n";
import { pathCopy } from "@/lib/pathCopy";
export default function AppNavigation({
  language,
  className = "appNav",
  extra,
  onHelp,
}: {
  language: Language;
  className?: string;
  extra?: ReactNode;
  onHelp?: () => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const copy = uiCopy[language];
  const menuLabel =
    language === "fr" ? "Outils du personnel" : language === "es" ? "Herramientas del personal" : "Staff tools";
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (e.target instanceof Node && !menu.current?.contains(e.target))
        menu.current?.removeAttribute("open");
    }
    window.addEventListener("pointerdown", outside);
    return () => window.removeEventListener("pointerdown", outside);
  }, []);
  return (
    <nav
      className={`${className} compactNavigation`}
      aria-label={
        language === "es"
          ? "Navegación principal"
          : language === "fr"
            ? "Navigation principale"
            : "Main navigation"
      }
    >
      <Link href="/">{copy.home}</Link>
      <Link href="/daily">{copy.dailyNav}</Link>
      <LessonsNavLink language={language} />
      <Link href="/thinking-paths">{pathCopy[language].title}</Link>
          <Link href="/classroom">{copy.classroomNav}</Link>
          <Link href="/leaderboard">{copy.participationNav}</Link>
          <Link href="/profile">{copy.profileNav}</Link>
          {onHelp ? (
            <button type="button" onClick={onHelp}>
              {copy.howToUseNav}
            </button>
          ) : (
            <Link href="/?guide=1">{copy.howToUseNav}</Link>
          )}
          <Link href="/feedback">{copy.feedbackNav}</Link>
          <Link href="/about">
            {language === "es"
              ? "Acerca de UThynk"
              : language === "fr"
                ? "À propos de UThynk"
                : "About UThynk"}
          </Link>
          <Link href="/store">{copy.storeNav}</Link>
          <Link href="/login?mode=login&force=1">
            {language === "es"
              ? "Iniciar sesión"
              : language === "fr"
                ? "Se connecter"
                : "Sign in"}
          </Link>
          {extra}
      <RestrictedNavLinks language={language} render={(links) => <details
        className="secondaryNavigation"
        ref={menu}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            menu.current?.removeAttribute("open");
            summary.current?.focus();
          }
        }}
      >
        <summary ref={summary} aria-label={menuLabel} title={menuLabel}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M2 4h16M2 10h16M2 16h16" />
          </svg>
        </summary>
        <div
          className="secondaryNavigationLinks"
          onClick={(e) => {
            if ((e.target as Element).closest("a,button"))
              menu.current?.removeAttribute("open");
          }}
        >
          {links}
        </div>
      </details>} />
    </nav>
  );
}
