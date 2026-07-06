import type { Metadata } from 'next';

// Route-level metadata is the reliable way to set the page title in the App
// Router: an imperative `document.title` in a client effect is overridden by
// Next's metadata system on load, so the title must come from here.
export const metadata: Metadata = {
  title: 'Community Events Calendar · Artistic Accessibility Collective',
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
