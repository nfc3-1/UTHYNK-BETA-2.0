import LessonLanguageShell from '@/components/LessonLanguageShell';
import { getCategories, getCategoryMetadata, getQuestionsForCategory } from '@/lib/questionBank';

export default function LessonsPage() {
  const categories = getCategories().map((category) => ({
    category,
    count: getQuestionsForCategory(category).length,
    description:
      getCategoryMetadata(category)?.shortDescription ||
      getCategoryMetadata(category)?.description ||
      'Practice this reasoning category with real-world questions.',
  }));

  return <LessonLanguageShell categories={categories} />;
}
