// app/layout.tsx
import "./styles/globals.css";
import BetaBrowserNotice from "@/components/BetaBrowserNotice";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="brandWatermark" aria-hidden="true" />
        <BetaBrowserNotice />
        {children}
      </body>
    </html>
  );
}
