'use client';

/**
 * ProductionCard — one production as it appears on the /projects listing.
 *
 * Split out of the index route for the same reason ProductionView is split out
 * of the detail route: the markup should not care where the row came from, so
 * the same card can be rendered from sample data.
 */

import Link from 'next/link';
import { PRODUCTION_KIND_LABELS, type ProductionWithDates } from '@/lib/supabase';
import { formatDate, formatWhere, upcomingDates } from '@/lib/productions';
import { htmlToText } from '@/lib/sanitize-html';
import { AccessChips, PostFrame, X, navLink } from './xanga-ui';


export function SectionHeading({ children }: { children: React.ReactNode }) {
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

export function ProductionCard({ production: p, past = false }: { production: ProductionWithDates; past?: boolean }) {
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
