'use client';

/**
 * ProductionView — the rendered body of one production page.
 *
 * Split out from app/projects/[slug]/page.tsx so the presentation has no
 * opinion about where the data came from. The route fetches and passes a
 * production in; this file only knows how to lay one out. That separation is
 * what lets the same markup be rendered from sample data, and is what an
 * in-admin live preview would use later.
 *
 * Section order is deliberate: what it is, when and where, how to get in, who
 * is making it, what access is in place. Every section is skipped entirely when
 * its fields are blank, so this page never shows an empty label.
 */

import Link from 'next/link';
import AttendingButton from '@/components/AttendingButton';
import { PRODUCTION_KIND_LABELS, profileHref, type ProductionWithDates } from '@/lib/supabase';
import { formatDate, isPast, kindLabel, upcomingDates } from '@/lib/productions';
import { isBlankHtml, sanitizeHtml } from '@/lib/sanitize-html';
import {
  AccessChips, Banner, ElsewhereModule, Module, PostBodyStyles, PostFrame, X, XangaLayout, navLink,
} from './xanga-ui';

export default function ProductionView({ production }: { production: ProductionWithDates }) {
  const p = production;
  const upcoming = upcomingDates(p.dates);
  const visibleDates = p.dates.filter((d) => d.is_visible);
  const datesToShow = upcoming.length > 0 ? upcoming : visibleDates;
  const finished = isPast(p);
  const liveTiers = p.ticket_tiers.filter((t) => t.label.trim());
  const hasBody = !isBlankHtml(p.body_html);

  return (
    <>
    <Banner subtitle={p.tagline ?? undefined} />

    <p style={{ margin: '0 0 1rem' }}>
      <Link href="/projects" className="xanga-link" style={navLink}>
        « All projects and events
      </Link>
    </p>

    {p.status !== 'published' && (
      <p role="status" style={{
        margin: '0 0 1rem', padding: '0.75rem', borderRadius: 4,
        background: '#fdf1b8', border: '2px solid #d9a300', color: '#6b5300',
        fontWeight: 700, fontSize: '0.875rem',
      }}>
        This is a {p.status} preview. Only admins can see this page. Patrons get a not found message
        until you publish it.
      </p>
    )}

    <XangaLayout
      main={
        <>
          <PostFrame
            eyebrow={
              <span>
                {kindLabel(p)}
                {finished && ' · this one has finished'}
              </span>
            }
          >
            <h2 style={{ margin: '0 0 0.375rem', fontSize: 'clamp(1.5rem, 4vw, 2rem)', lineHeight: 1.15, color: X.plum }}>
              {p.title}
            </h2>

            {p.tagline && (
              <p style={{ margin: '0 0 0.875rem', fontSize: '1.0625rem', color: X.muted, fontStyle: 'italic' }}>
                {p.tagline}
              </p>
            )}

            {p.hero_photo_url && (
              <figure style={{ margin: '0 0 1rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.hero_photo_url}
                  alt={p.hero_photo_alt ?? ''}
                  style={{
                    width: '100%', height: 'auto', display: 'block',
                    border: `2px solid ${X.rule}`, borderRadius: 3,
                  }}
                />
              </figure>
            )}

            {p.summary && (
              <p style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.55 }}>
                {p.summary}
              </p>
            )}

            {hasBody && (
              <div
                className="xanga-post"
                // Sanitized on save and again here: the database is the
                // untrusted boundary, not the admin who typed it.
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.body_html) }}
              />
            )}

            {!hasBody && !p.summary && (
              <p style={{ margin: 0, color: X.muted }}>
                More details are on the way. Check back soon, or{' '}
                <Link href="/contact" className="xanga-link" style={{ color: X.plum, fontWeight: 700 }}>
                  ask us about it
                </Link>.
              </p>
            )}
          </PostFrame>

          {/* ── When and where ── */}
          {(datesToShow.length > 0 || p.schedule_note) && (
            <PostFrame eyebrow="When and where">
              {p.schedule_note && (
                <p style={{ margin: '0 0 0.875rem', fontSize: '1rem', fontWeight: 700 }}>
                  {p.schedule_note}
                </p>
              )}

              {datesToShow.length > 0 && (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.875rem' }}>
                  {datesToShow.map((d) => (
                    <li key={d.id} style={{
                      padding: '0.75rem', background: X.haze,
                      border: `1px solid ${X.rule}`, borderRadius: 4,
                    }}>
                      <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1rem' }}>
                        {d.label && <span style={{ color: X.plum }}>{d.label}: </span>}
                        {formatDate(d)}
                        {d.is_sold_out && (
                          <span style={{
                            marginLeft: 8, fontSize: '0.6875rem', fontWeight: 700,
                            padding: '2px 6px', borderRadius: 3, background: '#f7e2e0', color: '#8e1a11',
                          }}>
                            Sold out
                          </span>
                        )}
                      </p>

                      <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem' }}>
                        {d.location_type === 'online' ? 'Online'
                          : d.location_type === 'hybrid' ? 'Online and in person'
                          : 'In person'}
                        {d.venue_name && d.location_type !== 'online' && (
                          <span style={{ fontWeight: 600 }}> at {d.venue_name}</span>
                        )}
                      </p>

                      {d.venue_address && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: X.muted }}>
                          <a
                            className="xanga-link"
                            href={`https://maps.google.com/?q=${encodeURIComponent(d.venue_address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: X.plum }}
                          >
                            {d.venue_address}
                          </a>
                        </p>
                      )}
                      {d.venue_note && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem' }}>{d.venue_note}</p>
                      )}
                      {d.online_url && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem' }}>
                          <a
                            className="xanga-link"
                            href={d.online_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={navLink}
                          >
                            Join online
                          </a>
                        </p>
                      )}
                      {d.online_note && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: X.muted }}>{d.online_note}</p>
                      )}
                      {d.note && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem' }}>{d.note}</p>
                      )}
                      {d.ticket_url && !d.is_sold_out && (
                        <p style={{ margin: '0.5rem 0 0' }}>
                          <a
                            className="xanga-link"
                            href={d.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', minHeight: 44,
                              padding: '0 16px', borderRadius: 4, background: X.plum,
                              color: X.white, fontWeight: 700, textDecoration: 'none',
                              fontSize: '0.875rem',
                            }}
                          >
                            Get tickets for this date
                          </a>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </PostFrame>
          )}

          {/* ── Presenters ── */}
          {p.presenters.length > 0 && (
            <PostFrame eyebrow={p.presenters.length === 1 ? 'Who is making it' : 'Who is making it'}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem' }}>
                {p.presenters.map((person, i) => (
                  <li key={`${person.name}-${i}`} style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                    {person.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.photo_url}
                        alt={person.photo_alt ?? ''}
                        style={{
                          width: 84, height: 84, objectFit: 'cover', borderRadius: '50%',
                          border: `2px solid ${X.rule}`, flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <p style={{ margin: '0 0 0.125rem', fontWeight: 700, fontSize: '1rem' }}>
                        {person.profile_id ? (
                          <Link
                            href={profileHref({ id: person.profile_id })}
                            className="xanga-link"
                            style={{ color: X.plum }}
                          >
                            {person.name}
                          </Link>
                        ) : person.name}
                      </p>
                      {person.role && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: X.muted, fontWeight: 600 }}>
                          {person.role}
                        </p>
                      )}
                      {person.bio && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', lineHeight: 1.55 }}>{person.bio}</p>
                      )}
                      {person.link_url && (
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                          <a
                            className="xanga-link"
                            href={person.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={navLink}
                          >
                            {person.link_label || 'More about them'}
                          </a>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </PostFrame>
          )}

          {/* ── Gallery ── */}
          {p.gallery.length > 0 && (
            <PostFrame eyebrow="Photos">
              <ul style={{
                listStyle: 'none', margin: 0, padding: 0, display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem',
              }}>
                {p.gallery.map((photo, i) => (
                  <li key={`${photo.url}-${i}`}>
                    <figure style={{ margin: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.alt}
                        loading="lazy"
                        style={{
                          width: '100%', aspectRatio: '4 / 3', objectFit: 'cover',
                          border: `2px solid ${X.rule}`, borderRadius: 3, display: 'block',
                        }}
                      />
                      {photo.caption && (
                        <figcaption style={{ fontSize: '0.75rem', color: X.muted, marginTop: '0.25rem' }}>
                          {photo.caption}
                        </figcaption>
                      )}
                    </figure>
                  </li>
                ))}
              </ul>
            </PostFrame>
          )}

          {/* ── Access ── */}
          {(p.access_features.length > 0 || p.access_note || p.contact_email) && (
            <PostFrame eyebrow="Accessibility">
              {p.access_features.length > 0 && <AccessChips features={p.access_features} />}
              {p.access_note && (
                <p style={{ margin: p.access_features.length > 0 ? '0.875rem 0 0' : 0, lineHeight: 1.6 }}>
                  {p.access_note}
                </p>
              )}
              {p.contact_email && (
                <p style={{ margin: '0.875rem 0 0', fontSize: '0.9375rem' }}>
                  Need something that is not listed? Email{' '}
                  <a
                    className="xanga-link"
                    href={`mailto:${p.contact_email}`}
                    style={{ color: X.plum, fontWeight: 700 }}
                  >
                    {p.contact_email}
                  </a>
                  {' '}and we will sort it out.
                </p>
              )}
            </PostFrame>
          )}

          {/* ── Extra links ── */}
          {p.links.length > 0 && (
            <PostFrame eyebrow="More reading">
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                {p.links.map((l, i) => (
                  <li key={`${l.url}-${i}`}>
                    <a
                      className="xanga-link"
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={navLink}
                    >
                      {l.label} »
                    </a>
                  </li>
                ))}
              </ul>
            </PostFrame>
          )}
        </>
      }
      sidebar={
        <>
          {/* Attending sits at the top of the sidebar: it is the one thing on
              this page we want someone to do. */}
          {p.rsvp_enabled && !finished && (
            <Module title="Are you coming?" id="attending">
              <AttendingButton
                productionId={p.id}
                productionTitle={p.title}
                dates={p.dates}
                rsvpCapacity={p.rsvp_capacity}
                accent={X.plum}
              />
            </Module>
          )}

          {(liveTiers.length > 0 || p.price_note) && (
            <Module title="Tickets" id="tickets">
              {liveTiers.length > 0 && (
                <ul style={{ listStyle: 'none', margin: '0 0 0.75rem', padding: 0, display: 'grid', gap: '0.75rem' }}>
                  {liveTiers.map((t, i) => (
                    <li key={`${t.label}-${i}`} style={{
                      padding: '0.625rem', background: X.haze,
                      border: `1px solid ${X.rule}`, borderRadius: 4,
                    }}>
                      <p style={{ margin: '0 0 0.125rem', fontWeight: 700 }}>{t.label}</p>
                      {t.price_text && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem' }}>{t.price_text}</p>
                      )}
                      {t.note && (
                        <p style={{ margin: '0 0 0.375rem', fontSize: '0.8125rem', color: X.muted }}>{t.note}</p>
                      )}
                      {t.sold_out ? (
                        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#8e1a11' }}>
                          Sold out
                        </p>
                      ) : t.url ? (
                        <a
                          className="xanga-link"
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', minHeight: 44,
                            padding: '0 14px', borderRadius: 4, background: X.plum,
                            color: X.white, fontWeight: 700, textDecoration: 'none',
                            fontSize: '0.875rem',
                          }}
                        >
                          {finished ? 'Details' : 'Get tickets'}
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {p.price_note && (
                <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.55 }}>{p.price_note}</p>
              )}
            </Module>
          )}

          {p.access_features.length > 0 && (
            <Module title="Access at a glance" id="access-glance">
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.375rem' }}>
                {p.access_features.map((f) => (
                  <li key={f} style={{ fontSize: '0.8125rem', display: 'flex', gap: 6 }}>
                    <span aria-hidden="true" style={{ color: X.plum, fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </Module>
          )}

          <Module title="Filed under" id="filed">
            <p style={{ margin: 0 }}>
              {PRODUCTION_KIND_LABELS[p.kind]}, produced by the Artistic Accessibility team.
            </p>
          </Module>

          <ElsewhereModule />
        </>
      }
    />

    <PostBodyStyles />
      <PostBodyStyles />
    </>
  );
}
