import Link from 'next/link';
import FeedbackForm from '@/components/FeedbackForm';

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

        <nav className="appNav">
          <Link href="/">Home</Link>
          <Link href="/lessons">Lessons</Link>
          <Link href="/teacher">Teacher</Link>
          <Link href="/reasoning">Reasoning</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/feedback">Feedback</Link>
        </nav>
      </header>

      <FeedbackForm />
    </main>
  );
}
