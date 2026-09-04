import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#263590",
};
import "./globals.css";
import { DevAutoLogin } from "@/components/DevAutoLogin";
import StartBar from "@/components/StartBar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.artisticaccessibility.com';
const DESCRIPTION = "A directory, community, and resource hub for anyone passionate about accessibility in the arts: practitioners, disabled community members, and curious learners alike.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Artistic Accessibility Collective",
  description: DESCRIPTION,
  openGraph: {
    siteName: 'Artistic Accessibility Collective',
    type: 'website',
    locale: 'en_US',
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
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
        {process.env.NODE_ENV !== 'production' && (
          <DevAutoLogin
            email={process.env.DEV_AUTO_LOGIN_EMAIL}
            password={process.env.DEV_AUTO_LOGIN_PASSWORD}
          />
        )}
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <StartBar />
      </body>
    </html>
  );
}
