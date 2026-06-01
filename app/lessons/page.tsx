import LessonLanguageShell from '@/components/LessonLanguageShell';
import { getCategories, getQuestionsForCategory } from '@/lib/questionBank';

export default function LessonsPage() {
  const categories = getCategories().map((category) => ({
    category,
    count: getQuestionsForCategory(category).length,
  }));

  return <LessonLanguageShell categories={categories} />;
}
