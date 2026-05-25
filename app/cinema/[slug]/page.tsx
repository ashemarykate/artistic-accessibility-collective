'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CINEMA_ITEM_BY_SLUG, CINEMA_CATEGORY_BY_ID, type CinemaItem } from '@/lib/cinema-data';
import ItemReactions from '@/components/ItemReactions';
import ItemComments from '@/components/ItemComments';

// ── Print TV-guide palette (matches listing page) ─────────────────────────────
const C = {
  teal:   '#2aacb8',
  navy:   '#0c1e3e',
  yellow: '#e8c800',
  white:  '#ffffff',
  cream:  '#f8f8f4',
  black:  '#111111',
  gray:   '#555555',
  lgray:  '#dddddd',
  red:    '#c01a1a',
  border: '#111111',
  sans:   '"Arial Narrow", Arial, "Helvetica Neue", Helvetica, sans-serif',
  mono:   '"Courier New", Courier, monospace',
};

const TYPE_LABEL: Record<string, string> = {
  documentary:             'Documentary',
  'performance-recording': 'Performance Recording',
  'short-film':            'Short Film',
  podcast:                 'Podcast',
  series:                  'Series',
  film:                    'Film',
  talk:                    'Talk / Lecture',
  'video-essay':           'Video Essay',
};

export default function CinemaItemPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const item: CinemaItem | undefined = CINEMA_ITEM_BY_SLUG[slug];

  useEffect(() => {
    if (item) document.title = `${item.title} — AAC Presents: The Cinema`;
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, [item]);

  if (!item) {
    return (
      <main style={{ minHeight: '100vh', background: C.teal, fontFamily: C.sans, color: C.black, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontFamily: C.mono, fontSize: 15, fontWeight: 700 }}>TITLE NOT FOUND: <code>{slug}</code></div>
        <Link href="/cinema" style={{ color: C.black, fontWeight: 700, textDecoration: 'underline' }}>← Back to The Cinema</Link>
      </main>
    );
  }

  const category = CINEMA_CATEGORY_BY_ID[item.category];
  const creator  = item.director || item.creator || '';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.teal,
        fontFamily: C.sans,
        color: C.black,
        paddingBottom: 48,
      }}
    >
      <h1 className="sr-only">{item.title} — AAC Presents: The Cinema · Artistic Accessibility Collective</h1>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Top nav bar ──────────────────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          style={{
            background: C.navy,
            color: C.white,
            padding: '7px 14px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            fontFamily: C.mono,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderBottom: `3px solid ${C.black}`,
          }}
        >
          <span style={{ fontWeight: 900, fontSize: 12, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            ▶ AAC PRESENTS: THE CINEMA
          </span>
          <span aria-hidden="true" style={{ opacity: 0.5 }}>›</span>
          <Link href="/cinema" style={{ color: C.yellow, textDecoration: 'none', fontWeight: 700 }} className="cinema-detail-link">
            SCHEDULE
          </Link>
          {category && (
            <>
              <span aria-hidden="true" style={{ opacity: 0.5 }}>›</span>
              <Link href={`/cinema?category=${item.category}`} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }} className="cinema-detail-link">
                CH {category.channel} {category.call}
              </Link>
            </>
          )}
          <span aria-hidden="true" style={{ opacity: 0.5 }}>›</span>
          <span style={{ color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
            {item.title.toUpperCase()}
          </span>
        </nav>

        {/* ── Main program card ─────────────────────────────────────────────── */}
        <article
          aria-label={`Program details for ${item.title}`}
          style={{ background: C.white, border: `2px solid ${C.black}`, marginTop: 20 }}
        >

          {/* Card header: channel + type + badges */}
          <div
            style={{
              background: item.isFree ? C.yellow : C.navy,
              color: item.isFree ? C.black : C.white,
              padding: '9px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {category && (
              <div style={{
                fontFamily: C.mono,
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: '0.1em',
                paddingRight: 12,
                borderRight: `2px solid ${item.isFree ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}`,
              }}>
                CH {category.channel} {category.call}
              </div>
            )}
            <div style={{ fontWeight: 900, fontSize: 13, flex: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {TYPE_LABEL[item.type] ?? item.type}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {item.isEssential && (
                <span style={{
                  background: item.isFree ? C.black : C.yellow,
                  color: item.isFree ? C.yellow : C.black,
                  fontFamily: C.mono, fontWeight: 900, fontSize: 9,
                  padding: '2px 7px', letterSpacing: '0.14em',
                }}>
                  ★ ESSENTIAL
                </span>
              )}
              {item.isFree && (
                <span style={{
                  background: C.black, color: C.yellow,
                  fontFamily: C.mono, fontWeight: 900, fontSize: 9,
                  padding: '2px 7px', letterSpacing: '0.14em',
                }}>
                  FREE ★
                </span>
              )}
              {item.hasAD && (
                <span style={{
                  border: `1px solid ${item.isFree ? C.black : C.white}`,
                  color: item.isFree ? C.black : C.white,
                  fontFamily: C.mono, fontWeight: 700, fontSize: 9,
                  padding: '1px 6px', letterSpacing: '0.1em',
                }}>
                  AUDIO DESC
                </span>
              )}
              {item.hasCaptions && (
                <span style={{
                  border: `1px solid ${item.isFree ? C.black : C.white}`,
                  color: item.isFree ? C.black : C.white,
                  fontFamily: C.mono, fontWeight: 700, fontSize: 9,
                  padding: '1px 6px', letterSpacing: '0.1em',
                }}>
                  CC
                </span>
              )}
            </div>
          </div>

          {/* Title block */}
          <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.lgray}` }}>
            <h2 style={{
              fontFamily: C.sans, fontWeight: 900, fontSize: 28,
              lineHeight: 1.05, color: C.black, margin: '0 0 5px',
              letterSpacing: '-0.02em',
            }}>
              {item.title}
              {item.year && (
                <span style={{ fontWeight: 400, color: C.gray, fontSize: 20, marginLeft: 10 }}>
                  ({item.year})
                </span>
              )}
            </h2>
            {creator && (
              <div style={{ fontFamily: C.mono, fontSize: 13, color: C.navy, letterSpacing: '0.04em', fontWeight: 700 }}>
                {item.director ? 'DIR. ' : 'BY '}{creator.toUpperCase()}
              </div>
            )}
            {item.runtimeMinutes && (
              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.gray, marginTop: 3, letterSpacing: '0.08em' }}>
                {item.runtimeMinutes} MIN
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.lgray}` }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.85, color: C.black }}>{item.description}</p>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div style={{ padding: '11px 22px', borderBottom: `1px solid ${C.lgray}`, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    border: `1px solid ${C.lgray}`,
                    color: C.gray,
                    fontFamily: C.mono,
                    fontSize: 10,
                    padding: '2px 8px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Platform + access */}
          <div style={{ padding: '14px 22px', borderBottom: `2px solid ${C.navy}` }}>
            {item.platform && item.platform.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontFamily: C.mono, fontSize: 10, color: C.gray, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                  PLATFORM:
                </span>
                {item.platform.map((p) => (
                  <span
                    key={p}
                    style={{
                      fontFamily: C.mono, fontSize: 11,
                      background: C.cream, border: `1px solid ${C.lgray}`,
                      color: C.navy, padding: '1px 8px', letterSpacing: '0.04em', fontWeight: 700,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            {item.isFree && item.url ? (
              <div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.black, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  ★ FREE — WATCH NOW
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.navy, textDecoration: 'underline', fontSize: 14, wordBreak: 'break-all', fontWeight: 700 }}
                  className="cinema-detail-link"
                >
                  {item.url}
                </a>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.gray, marginLeft: 8 }}>(opens in new tab)</span>
              </div>
            ) : item.howToAccess ? (
              <div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.navy, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  HOW TO WATCH
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: C.black }}>{item.howToAccess}</p>
              </div>
            ) : null}
          </div>

          {/* ── Ratings + save ──────────────────────────────────────────────── */}
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.lgray}` }}>
            <div style={{
              fontFamily: C.mono, fontSize: 10, fontWeight: 900,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: C.navy, marginBottom: 14,
            }}>
              COMMUNITY RATING
            </div>
            <ItemReactions itemSlug={item.slug} itemType="cinema" palette="print" starMode={true} />
          </div>

          {/* ── Comments ────────────────────────────────────────────────────── */}
          <div style={{ padding: '16px 22px' }}>
            <ItemComments itemSlug={item.slug} itemType="cinema" palette="blue" />
          </div>

        </article>

        {/* ── Footer nav ───────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 16,
          marginTop: 18, fontFamily: C.mono, fontSize: 12,
        }}>
          <Link href="/cinema" style={{ color: C.black, fontWeight: 900, textDecoration: 'underline' }} className="cinema-detail-link">
            ← Back to The Cinema
          </Link>
          <Link href="/library" style={{ color: C.black, textDecoration: 'underline' }} className="cinema-detail-link">
            The Library →
          </Link>
          <Link href="/resources" style={{ color: C.black, textDecoration: 'underline' }} className="cinema-detail-link">
            Resources →
          </Link>
          <Link href="/" style={{ color: C.black, textDecoration: 'underline' }} className="cinema-detail-link">
            Home
          </Link>
        </div>
      </div>

      <style>{`
        .cinema-detail-link:hover,
        .cinema-detail-link:focus-visible {
          outline: 3px solid ${C.black};
          outline-offset: 2px;
          text-decoration: underline;
        }
        @media (max-width: 640px) {
          [style*="font-size: 28px"] { font-size: 22px !important; }
        }
      `}</style>
    </main>
  );
}
