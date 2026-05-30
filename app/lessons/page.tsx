import Link from 'next/link';
import { getCategories, getQuestionsForCategory, slugifyCategory } from '@/lib/questionBank';

export default function LessonsPage() {
  const categories = getCategories();

  return (
    <main className="appShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
          <span className="brandCopy">
            <strong>UThynk</strong>
            <small>Better thinking. <em>Better decisions.</em></small>
          </span>
        </Link>

        <nav className="appNav">
          <Link href="/">Home</Link>
          <Link href="/lessons">Lessons</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/store">Store</Link>
        </nav>
      </header>

      <section className="appHero card" style={{ marginTop: 18 }}>
        <div className="heroCopy">
          <div className="eyebrow">Lessons</div>
          <h1>Choose a thinking category.</h1>
          <p>
            Each category opens a focused question list so UThynk can train the
            exact reasoning lens you want to practice.
          </p>
        </div>
      </section>

      <section className="lessonCategoryGrid">
        {categories.map((category) => {
          const questions = getQuestionsForCategory(category);

          return (
            <Link
              className="card lessonCategoryCard"
              href={`/lessons/${slugifyCategory(category)}`}
              key={category}
            >
              <span className="panelLabel">{questions.length} questions</span>
              <strong>{category}</strong>
              <p>Open a focused list of prompts for this reasoning lens.</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
