import type { Metadata } from 'next';
import { CINEMA_ITEM_BY_SLUG } from '@/lib/cinema-data';

// generateMetadata, not an imperative document.title in the page: a client
// effect's title is overridden by Next's metadata system on load, so the item
// name never reached the browser tab, the history entry or a bookmark.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = CINEMA_ITEM_BY_SLUG[slug];
  return { title: item ? `${item.title} · AAC Presents: The Cinema` : 'AAC Presents: The Cinema · Artistic Accessibility Collective' };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
