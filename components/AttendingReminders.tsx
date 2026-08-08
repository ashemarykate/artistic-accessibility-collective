'use client';

/**
 * AttendingReminders — "you said you're coming to this"
 *
 * The payoff for pressing "I'm attending" on a production page. Drops onto the
 * Access Card and the Collective dashboard so the thing you said yes to comes
 * back to you instead of being forgotten in a browser tab.
 *
 * Renders nothing at all when there's nothing upcoming, rather than an empty
 * state: this is a reminder strip, not a feature to advertise on a page that's
 * already busy.
 *
 * Long game: when tickets live on a profile, this is the strip they belong in,
 * and each row grows a "show ticket" action.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProductionDate, ProductionWithDates } from '@/lib/supabase';
import { fetchMyUpcomingAttending, formatDate, kindLabel } from '@/lib/productions';

type Row = { production: ProductionWithDates; date: ProductionDate | null; rsvpId: string };

interface Props {
  /** Supabase auth user id. Nothing renders without one. */
  userId: string | null | undefined;
  /**
   * Match the host page, which is the whole reason this prop exists: the Access
   * Card is a cream library card, My Collective is an AOL-era window, and a
   * single neutral box would look wrong on both.
   *   card   cream card stock, dark navy rules
   *   msbox  the .ms-box window chrome used across My Collective
   *   plain  white box with AAC blue, for anywhere else
   */
  variant?: 'card' | 'plain' | 'msbox';
  heading?: string;
}

export default function AttendingReminders({ userId, variant = 'plain', heading = "You're attending" }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // No user means nothing to fetch and nothing to show, so `loaded` stays
    // false and the component renders null either way.
    if (!userId) return;
    let cancelled = false;
    void fetchMyUpcomingAttending(userId).then((list) => {
      if (!cancelled) { setRows(list); setLoaded(true); }
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (!loaded || rows.length === 0) return null;

  const isCard = variant === 'card';
  const accent = isCard ? '#1a1a2e' : 'var(--aac-blue)';

  const body = (
    <>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.625rem' }}>
        {rows.map((r) => (
          <li
            key={r.rsvpId}
            style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              paddingBottom: '0.625rem',
              borderBottom: `1px dotted ${isCard ? '#c9c2ad' : 'var(--aac-blue-light, #d8dcf5)'}`,
            }}
          >
            {r.production.hero_photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.production.hero_photo_url}
                alt={r.production.hero_photo_alt ?? ''}
                style={{
                  width: 56, height: 56, objectFit: 'cover', borderRadius: 4,
                  border: `1px solid ${isCard ? '#c9c2ad' : 'var(--aac-blue-light, #d8dcf5)'}`,
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: '0 0 0.125rem', fontSize: '0.9375rem', fontWeight: 700 }}>
                <Link
                  href={`/projects/${r.production.slug}`}
                  style={{ color: accent, textDecoration: 'underline' }}
                >
                  {r.production.title}
                </Link>
              </p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: isCard ? '#4a4534' : 'var(--color-text-muted, #5a5a5a)' }}>
                {r.date
                  ? `${r.date.label ? `${r.date.label}: ` : ''}${formatDate(r.date)}`
                  : `${kindLabel(r.production)} · date to be announced`}
              </p>
              {r.date?.venue_name && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: isCard ? '#4a4534' : 'var(--color-text-muted, #5a5a5a)' }}>
                  {r.date.venue_name}
                </p>
              )}
              {r.date?.location_type === 'online' && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: isCard ? '#4a4534' : 'var(--color-text-muted, #5a5a5a)' }}>
                  Online
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p style={{ margin: '0.625rem 0 0', fontSize: '0.75rem', color: isCard ? '#4a4534' : 'var(--color-text-muted, #5a5a5a)' }}>
        Change your mind on the production page. This is a reminder, not a ticket.
      </p>
    </>
  );

  if (variant === 'msbox') {
    return (
      <div className="ms-box" style={{ marginBottom: '8px' }}>
        <div className="ms-box-header">
          <h2><span aria-hidden="true">🎟 </span>{heading}</h2>
        </div>
        <div style={{ padding: '10px 12px' }}>{body}</div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="attending-reminders-heading"
      style={{
        border: `2px solid ${accent}`,
        borderRadius: 6,
        background: isCard ? '#f7f3e8' : '#fff',
        padding: '0.875rem',
        marginBottom: '1rem',
      }}
    >
      <h2
        id="attending-reminders-heading"
        style={{
          margin: '0 0 0.625rem', fontSize: '0.8125rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: accent,
        }}
      >
        {heading}
      </h2>
      {body}
    </section>
  );
}
