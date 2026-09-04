import type { Metadata } from 'next';
import { fetchProductionBySlug } from '@/lib/productions';

// Backstage pages are private, so the title only uses the production name
// when it is public anyway (published). Otherwise it stays generic rather
// than leaking a draft's name into the tab of someone who cannot see it.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const production = await fetchProductionBySlug(slug).catch(() => null);
  return {
    title: production
      ? `Backstage · ${production.title} · Artistic Accessibility Collective`
      : 'Backstage · Artistic Accessibility Collective',
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
