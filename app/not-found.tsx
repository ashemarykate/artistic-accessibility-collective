import type { Metadata } from 'next';
import NotFoundScreen from '@/components/NotFoundScreen';

// The screen itself has to be a client component (it listens for "press any
// key"), and a client component cannot export metadata. Splitting the two lets
// the 404 carry a real title instead of the generic site name.
export const metadata: Metadata = {
  title: 'Page Not Found · Artistic Accessibility Collective',
};

export default function NotFound() {
  return <NotFoundScreen />;
}
