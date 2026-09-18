import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classync — TA Dashboard",
  description: "Private academic help-seeking for Discord classes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
