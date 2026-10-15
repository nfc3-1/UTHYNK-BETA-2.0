"use client";
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import RestrictedNavLinks from '@/components/RestrictedNavLinks';
import NavigationDisclosure from '@/components/NavigationDisclosure';
import { LessonsNavLink } from '@/components/LessonDiscovery';
import { uiCopy, type Language } from '@/lib/reasoningI18n';
import { pathCopy } from '@/lib/pathCopy';

const labels = {
  en: { nav:'Main navigation', learning:'More learning options', staff:'Staff tools', signIn:'Sign in' },
  es: { nav:'Navegación principal', learning:'Más opciones de aprendizaje', staff:'Herramientas del personal', signIn:'Iniciar sesión' },
  fr: { nav:'Navigation principale', learning:'Autres options d’apprentissage', staff:'Outils du personnel', signIn:'Se connecter' },
};
export default function AppNavigation({ language, className = 'appNav', extra }: {
  language: Language; className?: string; extra?: ReactNode;
}) {
  const nav = useRef<HTMLElement>(null);
  const copy = uiCopy[language];
  const text = labels[language];
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      const target = event.target;
      nav.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(details => {
        if (!details.contains(target)) details.removeAttribute('open');
      });
    }
    window.addEventListener('pointerdown', outside);
    return () => window.removeEventListener('pointerdown', outside);
  }, []);
  return <nav ref={nav} className={`${className} compactNavigation`} aria-label={text.nav}>
    <div className="primaryNavigationLinks">
      <Link href="/daily">{copy.dailyNav}</Link>
      <div className="learningNavigationSplit">
        <LessonsNavLink language={language} />
        <NavigationDisclosure label={text.learning} iconOnly>
          <Link href="/thinking-paths">{pathCopy[language].title}</Link>
        </NavigationDisclosure>
      </div>
      <NavigationDisclosure label={copy.classroomNav}>
        <Link href="/classroom">{copy.classroomNav}</Link>
        <Link href="/leaderboard">{copy.participationNav}</Link>
      </NavigationDisclosure>
      <Link href="/feedback">{copy.feedbackNav}</Link>
      <Link href="/store">{copy.storeNav}</Link>
    </div>
    <RestrictedNavLinks language={language}
      renderAccount={signedIn => <div className="accountNavigation">
        <Link href="/profile" className="profileNavigationLink">{copy.profileNav}</Link>
        {!signedIn && <Link href="/login?mode=login&force=1">{text.signIn}</Link>}
        {extra}
      </div>}
      render={links => <NavigationDisclosure label={text.staff} iconOnly staff>{links}</NavigationDisclosure>}
    />
  </nav>;
}
