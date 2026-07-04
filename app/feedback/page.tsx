import Link from 'next/link';
import FeedbackForm from '@/components/FeedbackForm';
import LocalizedNavLinks from '@/components/LocalizedNavLinks';

export default function FeedbackPage() {
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
