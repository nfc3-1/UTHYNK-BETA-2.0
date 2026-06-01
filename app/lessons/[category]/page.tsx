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
      <LessonQuestionClient category={category} questions={questions} />
    </main>
  );
}
