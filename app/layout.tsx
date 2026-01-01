// app/layout.tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen w-screen bg-uthynk text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

