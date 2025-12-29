import './styles/globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'UThynk',
  description: 'Learn how to think — not what to think.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="topbar">
            <Link href="/" className="brand" aria-label="UThynk Home">
              <div className="brandMark"><span>🧠</span></div>
              <div>
                <div style={{lineHeight:1}}>UThynk</div>
                <div className="smallMuted" style={{lineHeight:1.1}}>Learn how to think</div>
              </div>
            </Link>

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
