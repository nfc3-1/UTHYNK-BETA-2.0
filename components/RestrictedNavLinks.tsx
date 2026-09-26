'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredLanguageValue, UTHYNK_LANGUAGE_EVENT, uiCopy, type Language } from '@/lib/reasoningI18n';

export default function RestrictedNavLinks() {
  const [access, setAccess] = useState<{ role?: string; sections?: string[]; userId?: string }>({});
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
  const teacher = Boolean(access.userId) && (admin || access.role === 'teacher' || access.sections?.includes('teacher'));
  const studio = Boolean(access.userId) && (admin || access.sections?.includes('studio'));
  return <>{teacher ? <Link href="/teacher">{uiCopy[language].teacherNav}</Link> : null}{studio ? <Link href="/studio">Studio</Link> : null}{admin ? <Link href="/admin/access">{language === 'es' ? 'Administración' : language === 'fr' ? 'Administration' : 'Admin'}</Link> : null}</>;
}
