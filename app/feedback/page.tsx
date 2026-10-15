import BrandHome from '@/components/BrandHome';
import FeedbackForm from '@/components/FeedbackForm';
import LocalizedNavLinks from '@/components/LocalizedNavLinks';

export default function FeedbackPage() {
  return (
    <main className="appShell">
      <header className="appTop card">
        <BrandHome />

        <LocalizedNavLinks
          items={[
            { href: '/', key: 'home' },
            { href: '/lessons', key: 'lessonsNav' },
            { href: '/teacher', key: 'teacherNav' },
            { href: '/reasoning', key: 'reasoningNav' },
            { href: '/profile', key: 'profileNav' },
            { href: '/feedback', key: 'feedbackNav' },
          ]}
        />
      </header>

      <FeedbackForm />
    </main>
  );
}
