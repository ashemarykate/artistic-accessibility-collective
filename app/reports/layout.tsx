import type { Metadata } from 'next';

// Each report sets its own title via generateMetadata; this is the fallback,
// and the noindex applies to every report (they are for the client, not the web).
export const metadata: Metadata = {
  title: 'Access Report · Artistic Accessibility Collective',
  robots: { index: false, follow: false },
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
