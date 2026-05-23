import type { Metadata } from "next";
import "./globals.css";
import { DevAutoLogin } from "@/components/DevAutoLogin";

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
        <DevAutoLogin />
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
