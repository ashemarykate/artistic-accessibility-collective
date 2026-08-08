'use client';

/**
 * /projects/[slug] — one production's full page
 *
 * This file is the data half: find the production for this slug, handle the
 * loading and not-found states, and hand the row to ProductionView, which owns
 * the layout.
 *
 * Drafts render here too, but only for an admin: RLS refuses the row to anyone
 * else, so the same URL is a not-found for a patron. That's what the Preview
 * page link in the admin panel relies on, and why ProductionView shows a draft
 * banner, so nobody mistakes a preview for the live page.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';
import type { ProductionWithDates } from '@/lib/supabase';
import { fetchProductionBySlug } from '@/lib/productions';
import ProductionView from '../ProductionView';
import { Banner, PostFrame, X, navLink, pageBackground } from '../xanga-ui';

type Load = 'loading' | 'found' | 'missing';

export default function ProductionPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [production, setProduction] = useState<ProductionWithDates | null>(null);
  const [load, setLoad] = useState<Load>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // First try as a patron would. If nothing comes back, retry including
      // drafts: that only succeeds for an admin, and it's what makes the
      // Preview page button work without a separate preview route.
      let found = await fetchProductionBySlug(slug);
      if (!found) found = await fetchProductionBySlug(slug, true);
      if (cancelled) return;
      setProduction(found);
      setLoad(found ? 'found' : 'missing');
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const previous = document.title;
    document.title = production
      ? `${production.title} · Current Projects & Events · Artistic Accessibility Collective`
      : 'Current Projects & Events · Artistic Accessibility Collective';
    return () => { document.title = previous; };
  }, [production]);

  const shell = (children: React.ReactNode, title: string) => (
    <BrowserChrome variant="ie3" title={title} url="http://projects.artisticaccessibility.com/">
      <main style={{
        minHeight: '100%', background: pageBackground,
        padding: 'clamp(0.75rem, 3vw, 1.5rem)', fontFamily: X.sans, color: X.ink,
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>{children}</div>
      </main>
    </BrowserChrome>
  );

  if (load === 'loading') {
    return shell(
      <>
        <Banner />
        <p role="status" aria-live="polite" style={{
          padding: '1.25rem', background: X.white, border: `2px solid ${X.grape}`, borderRadius: 4,
        }}>
          Loading…
        </p>
      </>,
      'Current Projects & Events · Artistic Accessibility Collective',
    );
  }

  if (load === 'missing' || !production) {
    return shell(
      <>
        <Banner />
        <PostFrame eyebrow="Not found">
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: X.plum }}>
            We could not find that one
          </h2>
          <p style={{ margin: '0 0 0.75rem' }}>
            It may have been taken down, or the link may have a typo in it.
          </p>
          <Link href="/projects" className="xanga-link" style={navLink}>
            « Back to all projects and events
          </Link>
        </PostFrame>
      </>,
      'Not found · Artistic Accessibility Collective',
    );
  }
  return shell(
    <ProductionView production={production} />,
    `${production.title} · Current Projects & Events · Artistic Accessibility Collective`,
  );
}
