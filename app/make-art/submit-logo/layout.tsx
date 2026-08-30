import type { Metadata } from 'next';

// Route-level metadata is the only reliable way to set a page title in the App
// Router. An imperative document.title in a client effect is overridden by
// Next's metadata system on load, so it never actually took effect.
export const metadata: Metadata = {
  title: 'Submissions · Artistic Accessibility Collective',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
