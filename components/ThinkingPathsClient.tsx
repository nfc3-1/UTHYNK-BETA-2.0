'use client';
import Link from 'next/link';
import PathShell, { PathGuide, usePathLanguage } from './PathShell';
import type { PathSummary } from '@/lib/thinkingPathTypes';
import { pathCopy } from '@/lib/pathCopy';
import styles from './ThinkingPaths.module.css';

export default function ThinkingPathsClient({ paths, selectedPath, locked = false, signedIn = false }: { paths: PathSummary[]; selectedPath?: string; locked?: boolean; signedIn?: boolean }) {
  const { language, changeLanguage } = usePathLanguage();
  const copy = pathCopy[language];
  const selected = paths.find(path => path.slug === selectedPath);
  return <PathShell language={language} changeLanguage={changeLanguage}>
    <section className={`card ${styles.hero}`}><span className={styles.badge}>{copy.title} · {copy.beta}</span><h1>{selected ? selected.title[language] : copy.title}</h1><p>{selected ? selected.description[language] : copy.intro}</p></section>
    {locked ? <section className={`card ${styles.locked}`}><h2>{copy.locked}</h2><p>{copy.access}</p>{!signedIn && <Link href="/login">{copy.signin}</Link>}<Link href="/lessons">{copy.lessons}</Link></section> : null}
    <PathGuide language={language} />
    <div className={styles.grid}>{(selected ? selected.readingPaths : paths).map(item => {
      const reading = 'modules' in item;
      const count = reading ? item.modules.length : item.readingPaths.reduce((n, path) => n + path.modules.length, 0);
      const href = selected ? `/thinking-paths/${selected.slug}/${item.slug}` : `/thinking-paths/${item.slug}`;
      return <article className={`card ${styles.pathCard}`} key={item.slug}>
        <span className={styles.badge}>{reading ? copy.reading : copy.title}</span><h2>{item.title[language]}</h2><p>{item.description[language]}</p>
        <p className={styles.meta}>{count} {copy.module.toLowerCase()}</p>
        {reading && <ul>{item.modules.map(module => <li key={module.id}>{module.work[language]} · {module.author}</li>)}</ul>}
        <Link className="btn btnPrimary" href={href}>{reading ? copy.start : copy.open}<span aria-hidden="true"> →</span></Link>
      </article>;
    })}</div>
    {selected && <Link href="/thinking-paths">← {copy.title}</Link>}
  </PathShell>;
}
