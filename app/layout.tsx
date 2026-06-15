// app/layout.tsx
import "./styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="brandWatermark" aria-hidden="true" />
        <div className="betaBrowserNotice" role="status">
          <strong>Beta Notice:</strong> For the best experience, please use Google Chrome.
        </div>
        {children}
      </body>
    </html>
  );
}

