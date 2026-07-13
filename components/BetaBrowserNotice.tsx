'use client';

import { useEffect, useState } from 'react';
import { getStoredLanguageValue, type Language, UTHYNK_LANGUAGE_EVENT } from '@/lib/reasoningI18n';

const noticeCopy = {
  en: { label: 'Beta Notice:', text: 'For the best experience, please use Google Chrome.' },
  es: { label: 'Aviso beta:', text: 'Para la mejor experiencia, usa Google Chrome.' },
  fr: { label: 'Avis beta :', text: 'Pour une meilleure experience, utilise Google Chrome.' },
} satisfies Record<Language, { label: string; text: string }>;

export default function BetaBrowserNotice() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    function syncLanguage() {
      setLanguage(getStoredLanguageValue());
    }

    function syncStorageLanguage(event: StorageEvent) {
      if (event.key === 'uthynk-language') syncLanguage();
    }

    syncLanguage();
    window.addEventListener('storage', syncStorageLanguage);
    window.addEventListener(UTHYNK_LANGUAGE_EVENT, syncLanguage);

    return () => {
      window.removeEventListener('storage', syncStorageLanguage);
      window.removeEventListener(UTHYNK_LANGUAGE_EVENT, syncLanguage);
    };
  }, []);

  const copy = noticeCopy[language];

  return (
    <div className="betaBrowserNotice" role="status">
      <strong>{copy.label}</strong> {copy.text}
    </div>
  );
}
