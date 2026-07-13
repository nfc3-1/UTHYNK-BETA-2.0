'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredLanguageValue, type Language, UTHYNK_LANGUAGE_EVENT, uiCopy } from '@/lib/reasoningI18n';

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
  return getStoredLanguageValue();
}

export default function LocalizedNavLinks({ className = 'appNav', items = primaryNavItems }: Props) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    function syncLanguage() {
      setLanguage(getStoredLanguage());
    }

    function syncStorageLanguage(event: StorageEvent) {
      if (event.key === 'uthynk-language') {
        syncLanguage();
      }
    }

    syncLanguage();
    window.addEventListener('storage', syncStorageLanguage);
    window.addEventListener(UTHYNK_LANGUAGE_EVENT, syncLanguage);

    return () => {
      window.removeEventListener('storage', syncStorageLanguage);
      window.removeEventListener(UTHYNK_LANGUAGE_EVENT, syncLanguage);
    };
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
