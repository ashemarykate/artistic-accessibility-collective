import type { Metadata } from 'next';

// Route-level metadata is the only reliable way to set a page title in the App
// Router. See CLAUDE.md: never document.title.
export const metadata: Metadata = {
  title: 'Your Privacy · Artistic Accessibility Collective',
  description: 'What the Artistic Accessibility Collective collects, who can see it, and what you can ask us to do with it.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
