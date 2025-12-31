import './styles/globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'UThynk — Learn how to think',
  description: 'Learn how to think — not what to think.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="topbar">
            <div className="brand">
              <div className="brandMark"><span>🧠</span></div>
              <div>UThynk</div>
            </div>
            <div className="navRight">
              <Link className="navPill" href="/login">Login</Link>
              <Link className="navPill" href="/store">Store</Link>
              <Link className="navPill" href="/about">About Us</Link>
            </div>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
