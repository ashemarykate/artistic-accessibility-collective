import type { Metadata } from 'next';

// Route-level metadata is the only reliable way to set a page title in the App
// Router. See CLAUDE.md: never document.title.
export const metadata: Metadata = {
  title: 'Code of Conduct · Artistic Accessibility Collective',
  description: 'What is expected of everyone in the Artistic Accessibility Collective, and how to report a problem.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
