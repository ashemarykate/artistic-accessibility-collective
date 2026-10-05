import type { MetadataRoute } from 'next';
import { CINEMA_ITEMS } from '@/lib/cinema-data';
import { LIBRARY_ITEMS } from '@/lib/library-data';
import { PRINTER_ITEM_BY_SLUG } from '@/lib/printer-data';
import { HOT_TOPICS_PUBLIC, visibleTopics } from '@/lib/hot-topics-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.artisticaccessibility.com';

// Only pages a stranger can open without signing in.
const PUBLIC_PATHS = [
  '/', '/about', '/help', '/contact', '/work-with-us', '/calendar', '/library', '/cinema',
  '/resources', '/learning-hub', '/make-art', '/printer', '/projects', '/access-card',
  '/submit', '/submit-event', '/login',
  // Hot Topics is listed only while at least one topic is live (or drafts are
  // switched on for a preview build). While every topic is a draft the pages
  // return 404, so the sitemap must not point at them.
  ...(HOT_TOPICS_PUBLIC ? ['/resources/hot-topics'] : []),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = PUBLIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === '/' || p === '/calendar' ? 'daily' : 'weekly',
    priority: p === '/' ? 1 : 0.7,
  }));
  const items: MetadataRoute.Sitemap = [
    ...CINEMA_ITEMS.map((i) => `/cinema/${i.slug}`),
    ...LIBRARY_ITEMS.map((i) => `/library/${i.slug}`),
    ...Object.keys(PRINTER_ITEM_BY_SLUG).map((slug) => `/printer/${slug}`),
    // visibleTopics() leaves out drafts unless drafts are switched on.
    ...(HOT_TOPICS_PUBLIC ? visibleTopics().map((t) => `/resources/hot-topics/${t.slug}`) : []),
  ].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 }));
  return [...pages, ...items];
}
