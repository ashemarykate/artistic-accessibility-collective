import type { Metadata } from "next";
import "./globals.css";
import { DevAutoLogin } from "@/components/DevAutoLogin";

export const metadata: Metadata = {
  title: "Artistic Accessibility Collective",
  description: "A directory, community, and resource hub for anyone passionate about accessibility in the arts — practitioners, disabled community members, and curious learners alike.",
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
