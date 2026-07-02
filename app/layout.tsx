import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#263590",
};
import "./globals.css";
import { DevAutoLogin } from "@/components/DevAutoLogin";

export const metadata: Metadata = {
  title: "Artistic Accessibility Collective",
  description: "A directory, community, and resource hub for anyone passionate about accessibility in the arts: practitioners, disabled community members, and curious learners alike.",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AAC',
  },
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
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  );
}
