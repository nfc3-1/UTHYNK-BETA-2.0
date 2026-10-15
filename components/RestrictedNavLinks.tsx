'use client';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { getStoredLanguageValue, UTHYNK_LANGUAGE_EVENT, uiCopy, type Language } from '@/lib/reasoningI18n';

export default function RestrictedNavLinks({ render, language: displayLanguage }: { render?: (links: ReactNode) => ReactNode; language?: Language } = {}) {
  const [access, setAccess] = useState<{ role?: string; sections?: string[]; userId?: string; schoolAdmin?: boolean; schoolTeacher?: boolean }>({});
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    let active = true;
    async function refresh() {
      setLanguage(getStoredLanguageValue());
      try {
        const result = await fetch('/api/access', { cache: 'no-store' });
        const value = result.ok ? await result.json() : {};
        if (active) setAccess(value);
      } catch { if (active) setAccess({}); }
    }
    function syncLanguage() { setLanguage(getStoredLanguageValue()); }
    void refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener(UTHYNK_LANGUAGE_EVENT, syncLanguage);
    window.addEventListener('storage', syncLanguage);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener(UTHYNK_LANGUAGE_EVENT, syncLanguage); window.removeEventListener('storage', syncLanguage); };
  }, []);
  const admin = Boolean(access.userId) && access.role === 'admin';
  const teacher = Boolean(access.userId) && (admin || access.role === 'teacher' || access.sections?.includes('teacher') || access.schoolTeacher);
  const studio = Boolean(access.userId) && (admin || access.sections?.includes('studio'));
  const school = Boolean(access.userId) && (admin || access.schoolAdmin);
  const visibleLanguage = displayLanguage || language;
  if (!teacher && !studio && !school) return null;
  const links = <>{teacher ? <Link href="/teacher">{uiCopy[visibleLanguage].teacherNav}</Link> : null}{school ? <Link href="/school">{visibleLanguage === 'es' ? 'Administración escolar' : visibleLanguage === 'fr' ? 'Administration scolaire' : 'School / district'}</Link> : null}{studio ? <Link href="/studio">Studio</Link> : null}{admin ? <Link href="/admin/access">{visibleLanguage === 'es' ? 'Administración' : visibleLanguage === 'fr' ? 'Administration' : 'Admin'}</Link> : null}</>;
  return render ? render(links) : links;
}
