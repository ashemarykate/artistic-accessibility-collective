import type { Metadata } from 'next';

// Staffing sheets are client documents. Each sets its own title; none index.
export const metadata: Metadata = {
  title: 'Staffing Proposal · Artistic Accessibility Collective',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
