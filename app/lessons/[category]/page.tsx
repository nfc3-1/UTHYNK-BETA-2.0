import Link from 'next/link';
import { notFound } from 'next/navigation';
import LessonQuestionClient from '@/components/LessonQuestionClient';
import { getCategoryBySlug, getQuestionsForCategory } from '@/lib/questionBank';

type Props = {
  params: {
    category: string;
  };
};

export default function LessonCategoryPage({ params }: Props) {
  const category = getCategoryBySlug(params.category);

  if (!category) {
    notFound();
  }

  const questions = getQuestionsForCategory(category);

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
          <div className="eyebrow">Lesson Category</div>
          <h1>{category}</h1>
          <p>
            Pick one question. UThynk will evaluate your answer with this category
            attached as lesson memory.
          </p>
        </div>
      </section>

      <LessonQuestionClient category={category} questions={questions} />
    </main>
  );
}
