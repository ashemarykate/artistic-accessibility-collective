import type { Metadata } from 'next';
import { HOT_TOPIC_BY_SLUG, isTopicOpen } from '@/lib/hot-topics-data';

// generateMetadata, not an imperative document.title: Next's metadata system
// would override a title set from a client effect.
//
// A topic that is not open (a draft on the live site) gets the generic title, so
// the unread editorial title can never leak through the tab or a link preview.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isTopicOpen(slug)) {
    return { title: 'Hot Topics · Artistic Accessibility Collective' };
  }
  const topic = HOT_TOPIC_BY_SLUG[slug];
  return {
    title: `${topic.title} · Hot Topics · Artistic Accessibility Collective`,
    description: topic.summary,
    ...(topic.status === 'draft' ? { robots: { index: false, follow: false } } : {}),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
