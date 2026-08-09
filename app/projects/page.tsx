'use client';

/**
 * /projects — Current Projects & Events
 *
 * The public index of Artistic Accessibility Productions: our own shows,
 * workshops and projects, as opposed to /calendar which lists everybody's.
 * Written in Admin -> Productions; see components/ProductionsPanel.tsx.
 *
 * Everything on a card is conditional. A production with only a title still
 * renders as a clean entry, because the whole editing model is "fill in what
 * you know now" and a page full of empty labels would defeat that.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';
import type { ProductionWithDates } from '@/lib/supabase';
import {
  fetchPublishedProductions, formatDate, isPast, nextDate, sortByNextDate,
} from '@/lib/productions';
import { ProductionCard, SectionHeading } from './ProductionCard';
import {
  Banner, ElsewhereModule, Module, PostFrame, X, XangaLayout, navLink, pageBackground,
} from './xanga-ui';

const PAGE_TITLE = 'Current Projects & Events · Artistic Accessibility Collective';

export default function ProjectsPage() {
  const [productions, setProductions] = useState<ProductionWithDates[] | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = PAGE_TITLE;
    return () => { document.title = previous; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchPublishedProductions().then((list) => {
      if (!cancelled) setProductions(list);
    });
    return () => { cancelled = true; };
  }, []);

  const { current, past } = useMemo(() => {
    const list = productions ?? [];
    return {
      current: sortByNextDate(list.filter((p) => !isPast(p))),
      // Most recently finished first, so the archive reads newest to oldest.
      past: list.filter(isPast).sort((a, b) => {
        const aLast = [...a.dates].sort((x, y) => y.start_at.localeCompare(x.start_at))[0]?.start_at ?? '';
        const bLast = [...b.dates].sort((x, y) => y.start_at.localeCompare(x.start_at))[0]?.start_at ?? '';
        return bLast.localeCompare(aLast);
      }),
    };
  }, [productions]);

  const loading = productions === null;

  return (
    <BrowserChrome
      variant="ie3"
      title={PAGE_TITLE}
      url="http://projects.artisticaccessibility.com/"
    >
      <main style={{
        minHeight: '100%',
        background: pageBackground,
        padding: 'clamp(0.75rem, 3vw, 1.5rem)',
        fontFamily: X.sans,
        color: X.ink,
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Banner />

          {/* The company's own door, in the gold the rest of this page keeps
              for emphasis so it reads as a different kind of thing from the
              projects listed below it. Everyone sees it: Backstage explains
              itself if you are not on a show. */}
          <p style={{ margin: '0 0 1rem', textAlign: 'right' }}>
            <Link
              href="/backstage"
              className="xanga-link"
              style={{
                display: 'inline-block',
                background: X.gold,
                color: X.ink,
                border: `2px solid ${X.plum}`,
                borderRadius: 4,
                padding: '0.35rem 0.9rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Backstage
            </Link>
          </p>

          <XangaLayout
            main={
              <>
                {loading && (
                  <p role="status" aria-live="polite" style={{
                    padding: '1.25rem', background: X.white, border: `2px solid ${X.grape}`,
                    borderRadius: 4, margin: 0,
                  }}>
                    Loading what we have going on…
                  </p>
                )}

                {!loading && current.length === 0 && past.length === 0 && (
                  <PostFrame eyebrow="Nothing posted yet">
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: X.plum }}>
                      Watch this space
                    </h2>
                    <p style={{ margin: '0 0 0.75rem' }}>
                      We are putting the finishing touches on a couple of things. In the meantime, the
                      community calendar is full of events from across the field.
                    </p>
                    <Link href="/calendar" className="xanga-link" style={navLink}>
                      See the calendar »
                    </Link>
                  </PostFrame>
                )}

                {current.length > 0 && (
                  <>
                    <SectionHeading>Coming up</SectionHeading>
                    {current.map((p) => <ProductionCard key={p.id} production={p} />)}
                  </>
                )}

                {past.length > 0 && (
                  <>
                    <SectionHeading>Already happened</SectionHeading>
                    {past.map((p) => <ProductionCard key={p.id} production={p} past />)}
                  </>
                )}
              </>
            }
            sidebar={
              <>
                <Module title="What this is" id="what">
                  <p style={{ margin: '0 0 0.5rem' }}>
                    Everything here is produced by the Artistic Accessibility team. Access is not bolted
                    on at the end, it is part of how the work gets made.
                  </p>
                  <p style={{ margin: 0 }}>
                    Signed in? You can mark yourself as attending and we will keep it on your card.
                  </p>
                </Module>

                {current.length > 0 && (
                  <Module title="Jump to" id="jump">
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.375rem' }}>
                      {current.map((p) => {
                        const next = nextDate(p);
                        return (
                          <li key={p.id}>
                            <Link
                              href={`/projects/${p.slug}`}
                              className="xanga-link"
                              style={navLink}
                            >
                              {p.title}
                            </Link>
                            {next && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: X.muted }}>
                                {formatDate(next)}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </Module>
                )}

                <ElsewhereModule />
              </>
            }
          />
        </div>
      </main>
    </BrowserChrome>
  );
}
