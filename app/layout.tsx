import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artistic Accessibility Collective",
  description: "Professional registry for accessibility professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
