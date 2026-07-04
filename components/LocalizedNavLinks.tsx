'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type Language, uiCopy } from '@/lib/reasoningI18n';

type NavItem = {
  href: string;
  key:
    | 'dailyNav'
    | 'feedbackNav'
    | 'home'
    | 'howToUseNav'
    | 'lessonsNav'
    | 'logoutNav'
    | 'profileNav'
    | 'reasoningNav'
    | 'storeNav'
    | 'teacherNav';
};

type Props = {
  className?: string;
  items?: NavItem[];
};

export const primaryNavItems: NavItem[] = [
  { href: '/', key: 'home' },
  { href: '/daily', key: 'dailyNav' },
  { href: '/lessons', key: 'lessonsNav' },
  { href: '/teacher', key: 'teacherNav' },
  { href: '/profile', key: 'profileNav' },
  { href: '/feedback', key: 'feedbackNav' },
  { href: '/store', key: 'storeNav' },
];

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  const storedLanguage = window.localStorage.getItem('uthynk-language');

  return storedLanguage === 'es' || storedLanguage === 'fr' ? storedLanguage : 'en';
}

export default function LocalizedNavLinks({ className = 'appNav', items = primaryNavItems }: Props) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    setLanguage(getStoredLanguage());

    function syncLanguage(event: StorageEvent) {
      if (event.key === 'uthynk-language') {
        setLanguage(getStoredLanguage());
      }
    }

    window.addEventListener('storage', syncLanguage);

    return () => window.removeEventListener('storage', syncLanguage);
  }, []);

  const copy = uiCopy[language];

  return (
    <nav className={className}>
      {items.map((item) => (
        <Link href={item.href} key={`${item.href}-${item.key}`}>
          {copy[item.key]}
        </Link>
      ))}
    </nav>
  );
}
