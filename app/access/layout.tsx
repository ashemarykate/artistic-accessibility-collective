import type { Metadata } from 'next';

// Route-level metadata is the only reliable way to set a page title in the App
// Router. See CLAUDE.md: never document.title.
export const metadata: Metadata = {
  title: 'Access Statement · Artistic Accessibility Collective',
  description: 'What this site does for access, what is not finished yet, and how to tell us about a barrier.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
