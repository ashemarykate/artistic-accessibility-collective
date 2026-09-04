import type { MetadataRoute } from 'next';
import { CINEMA_ITEMS } from '@/lib/cinema-data';
import { LIBRARY_ITEMS } from '@/lib/library-data';
import { PRINTER_ITEM_BY_SLUG } from '@/lib/printer-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.artisticaccessibility.com';

// Only pages a stranger can open without signing in.
const PUBLIC_PATHS = [
  '/', '/about', '/help', '/contact', '/work-with-us', '/calendar', '/library', '/cinema',
  '/resources', '/learning-hub', '/make-art', '/printer', '/projects', '/access-card',
  '/submit', '/submit-event', '/login',
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
  ].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 }));
  return [...pages, ...items];
}
