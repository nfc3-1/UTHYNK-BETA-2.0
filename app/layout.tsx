// app/layout.tsx
import "./styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="brandWatermark" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}

