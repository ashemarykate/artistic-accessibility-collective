import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artistic Accessibility Collective",
  description: "A professional registry and community for accessibility specialists — together, together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
