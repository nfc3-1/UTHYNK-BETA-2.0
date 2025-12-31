import './styles/globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'UThynk — Learn how to think',
  description: 'Learn how to think — not what to think.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
