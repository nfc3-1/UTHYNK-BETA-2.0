import Link from 'next/link';
import type { Language } from '@/lib/reasoningI18n';

export default function BrandHome({ language = 'en' }: { language?: Language }) {
  return <Link href="/" className="appBrandText" aria-label={{en:'UThynk home',es:'Inicio de UThynk',fr:'Accueil UThynk'}[language]}>
    <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
    <span className="brandCopy"><strong>UThynk</strong><small>Better thinking. <em>Better decisions.</em></small></span>
  </Link>;
}
