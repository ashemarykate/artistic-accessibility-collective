import type { MetadataRoute } from 'next';

// Public sections are crawlable. Member-only, admin, dev, and client
// documents (reports, staffing sheets, backstage) are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dev', '/reports', '/staffing', '/backstage', '/dashboard', '/messages', '/profile/edit', '/my-lists', '/my-resources', '/api'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.artisticaccessibility.com'}/sitemap.xml`,
  };
}
