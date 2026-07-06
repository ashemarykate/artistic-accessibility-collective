import type { Metadata } from 'next';

// Route-level metadata is the reliable way to set the title in the App Router;
// an imperative document.title in the client page is overridden by Next on load.
export const metadata: Metadata = {
  title: 'Login · Artistic Accessibility Collective',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
