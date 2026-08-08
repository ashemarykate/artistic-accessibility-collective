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
import { PRODUCTION_KIND_LABELS, type ProductionWithDates } from '@/lib/supabase';
import {
  fetchPublishedProductions,
  formatDate,
  formatWhere,
  isPast,
  nextDate,
  sortByNextDate,
  upcomingDates,
} from '@/lib/productions';
import { htmlToText } from '@/lib/sanitize-html';
import {
  AccessChips, Banner, ElsewhereModule, Module, PostFrame, X, XangaLayout, navLink, pageBackground,
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

// ── Pieces ────────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      margin: '0 0 0.75rem', padding: '0.375rem 0.625rem',
      fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: X.plum,
      background: X.haze, border: `1px solid ${X.rule}`, borderRadius: 3,
    }}>
      {children}
    </h2>
  );
}

function ProductionCard({ production: p, past = false }: { production: ProductionWithDates; past?: boolean }) {
  const upcoming = upcomingDates(p.dates);
  const visible  = p.dates.filter((d) => d.is_visible);
  const shown    = past ? visible.slice(-2) : upcoming.slice(0, 3);
  const more     = past ? 0 : Math.max(0, upcoming.length - shown.length);

  // Falls back to the opening of the post when there's no summary, so a card
  // written in a hurry still says something.
  const blurb = p.summary?.trim() || truncate(htmlToText(p.body_html), 220);

  return (
    <PostFrame
      eyebrow={
        <span>
          {PRODUCTION_KIND_LABELS[p.kind]}
          {past && ' · past'}
          {!past && upcoming.length > 1 && ` · ${upcoming.length} dates`}
        </span>
      }
    >
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.375rem', lineHeight: 1.2 }}>
        <Link
          href={`/projects/${p.slug}`}
          className="xanga-link"
          style={{ color: X.plum, textDecoration: 'none', fontWeight: 700 }}
        >
          {p.title}
        </Link>
      </h3>

      {p.tagline && (
        <p style={{ margin: '0 0 0.625rem', fontSize: '1rem', color: X.muted, fontStyle: 'italic' }}>
          {p.tagline}
        </p>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {p.hero_photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.hero_photo_url}
            alt={p.hero_photo_alt ?? ''}
            style={{
              width: 168, height: 126, objectFit: 'cover',
              border: `2px solid ${X.rule}`, borderRadius: 3, flexShrink: 0,
            }}
          />
        )}

        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          {p.schedule_note && (
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.9375rem' }}>
              {p.schedule_note}
            </p>
          )}

          {shown.length > 0 && (
            <ul style={{ listStyle: 'none', margin: '0 0 0.625rem', padding: 0, display: 'grid', gap: '0.25rem' }}>
              {shown.map((d) => (
                <li key={d.id} style={{ fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 700 }}>{d.label ? `${d.label}: ` : ''}{formatDate(d)}</span>
                  <span style={{ color: X.muted }}> · {formatWhere(d)}</span>
                  {d.is_sold_out && (
                    <span style={{ marginLeft: 6, fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: '#f7e2e0', color: '#8e1a11' }}>
                      Sold out
                    </span>
                  )}
                </li>
              ))}
              {more > 0 && (
                <li style={{ fontSize: '0.8125rem', color: X.muted }}>
                  and {more} more date{more === 1 ? '' : 's'}
                </li>
              )}
            </ul>
          )}

          {blurb && <p style={{ margin: '0 0 0.5rem' }}>{blurb}</p>}

          <AccessChips features={p.access_features} />

          <p style={{ margin: '0.5rem 0 0' }}>
            <Link href={`/projects/${p.slug}`} className="xanga-link" style={navLink}>
              {past ? 'Read about it »' : 'Read the whole thing »'}
            </Link>
          </p>
        </div>
      </div>
    </PostFrame>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  // Cut on a word boundary so the ellipsis doesn't land mid-word.
  return `${text.slice(0, text.lastIndexOf(' ', max) || max).trimEnd()}…`;
}
