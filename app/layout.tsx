// app/layout.tsx
import "../styles/globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen w-screen overflow-x-hidden bg-uthynk text-white">
        {children}
      </body>
    </html>
  );
}
