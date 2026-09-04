import type { Metadata } from 'next';
import { fetchProductionBySlug } from '@/lib/productions';

// generateMetadata here, not document.title in the page: a client effect's
// title is overridden by Next's metadata on load, so the production name
// never reached the browser tab on a hard load. Published productions are
// readable without a session, so the anon client is enough.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const production = await fetchProductionBySlug(slug).catch(() => null);
  return {
    title: production
      ? `${production.title} · Artistic Accessibility Collective`
      : 'Current Projects & Events · Artistic Accessibility Collective',
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
