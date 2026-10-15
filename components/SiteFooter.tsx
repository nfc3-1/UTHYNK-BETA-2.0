'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredLanguageValue, UTHYNK_LANGUAGE_EVENT, type Language } from '@/lib/reasoningI18n';
export default function SiteFooter() {
  const [language,setLanguage] = useState<Language>('en');
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguageValue());
    sync(); window.addEventListener(UTHYNK_LANGUAGE_EVENT,sync); window.addEventListener('storage',sync);
    return () => { window.removeEventListener(UTHYNK_LANGUAGE_EVENT,sync); window.removeEventListener('storage',sync); };
  },[]);
  return <footer className="siteFooter"><Link href="/about">{{en:'About UThynk',es:'Acerca de UThynk',fr:'À propos de UThynk'}[language]}</Link></footer>;
}
