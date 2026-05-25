'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CINEMA_ITEM_BY_SLUG, CINEMA_CATEGORY_BY_ID, type CinemaItem } from '@/lib/cinema-data';
import ItemReactions from '@/components/ItemReactions';
import ItemComments from '@/components/ItemComments';

// TV-guide blue palette
const C = {
  bg:      '#062586',
  bgDeep:  '#062586',
  bgCard:  '#0a3bb8',
  yellow:  '#fcdd2c',
  white:   '#ffffff',
  soft:    '#c8d5ff',
  cyan:    '#22e5d6',
  magenta: '#ff3b8d',
  red:     '#ff4040',
  green:   '#4dff7c',
  dim:     '#8099cc',
  sans:    '"Arial Narrow", Arial, "Helvetica Neue", Helvetica, sans-serif',
  mono:    '"Courier New", Courier, monospace',
};

const TYPE_LABEL: Record<string, string> = {
  documentary:            'Documentary',
  'performance-recording':'Performance Recording',
  'short-film':           'Short Film',
  podcast:                'Podcast',
  series:                 'Series',
  film:                   'Film',
  talk:                   'Talk / Lecture',
  'video-essay':          'Video Essay',
};

export default function CinemaItemPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const item: CinemaItem | undefined = CINEMA_ITEM_BY_SLUG[slug];

  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (item) document.title = `${item.title} — The Cinema · AAC`;
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, [item]);

  if (!item) {
    return (
      <main style={{ minHeight: '100vh', background: C.bgDeep, fontFamily: C.sans, color: C.white, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em', color: C.yellow }}>◆ TITLE NOT FOUND: <code>{slug}</code></div>
        <Link href="/cinema" style={{ color: C.yellow, textDecoration: 'underline' }}>← Back to The Cinema</Link>
      </main>
    );
  }

  const category = CINEMA_CATEGORY_BY_ID[item.category];
  const creator = item.director || item.creator || '';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.bgDeep,
        fontFamily: C.sans,
        color: C.white,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)',
        paddingBottom: 60,
      }}
    >
      <h1 className="sr-only">{item.title} — The Cinema · Artistic Accessibility Collective</h1>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px' }}>

        {/* Status bar */}
        <div
          aria-label="System status"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: 16,
            padding: '6px 14px',
            background: C.bgDeep,
            borderBottom: `2px solid ${C.yellow}`,
            fontFamily: C.mono,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.yellow,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 13, letterSpacing: '0.04em' }}>
            <span aria-hidden="true" style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 10px', borderColor: `transparent transparent transparent ${C.yellow}`, display: 'inline-block' }} />
            AAC CINEMA
          </div>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, alignItems: 'center', overflow: 'hidden', color: C.soft, fontSize: 11 }}>
            <Link href="/cinema" style={{ color: C.yellow, textDecoration: 'none' }} className="cinema-link">THE CINEMA</Link>
            <span aria-hidden="true">›</span>
            {category && (
              <>
                <Link href={`/cinema?category=${item.category}`} style={{ color: C.soft, textDecoration: 'none' }} className="cinema-link">CH {category.channel} {category.call}</Link>
                <span aria-hidden="true">›</span>
              </>
            )}
            <span style={{ color: C.yellow, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title.toUpperCase()}</span>
          </nav>
          <div style={{ color: C.yellow, fontSize: 12 }}>{clock}</div>
        </div>

        {/* Main program card */}
        <article
          aria-label={`Program details for ${item.title}`}
          style={{ border: `3px solid ${C.yellow}`, background: C.bgCard, marginTop: 24, boxShadow: '0 0 40px rgba(10,59,184,0.5)', backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)' }}
        >
          {/* Channel + badges header */}
          <div style={{ background: C.yellow, color: C.bgDeep, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {category && (
              <div style={{ fontFamily: C.mono, fontWeight: 900, fontSize: 13, letterSpacing: '0.1em', borderRight: `2px solid ${C.bgDeep}`, paddingRight: 14 }}>
                CH {category.channel} {category.call}
              </div>
            )}
            <div style={{ fontWeight: 900, fontSize: 14, flex: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {TYPE_LABEL[item.type] ?? item.type}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {item.isEssential && (
                <span style={{ background: C.magenta, color: C.white, fontFamily: C.mono, fontWeight: 700, fontSize: 9, padding: '2px 8px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  ★ ESSENTIAL
                </span>
              )}
              {item.isFree && (
                <span style={{ background: C.green, color: C.bgDeep, fontFamily: C.mono, fontWeight: 700, fontSize: 9, padding: '2px 8px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  FREE ★
                </span>
              )}
              {item.hasAD && (
                <span style={{ background: 'rgba(34,229,214,0.2)', color: C.cyan, fontFamily: C.mono, fontWeight: 700, fontSize: 9, padding: '2px 8px', letterSpacing: '0.14em', border: `1px solid ${C.cyan}` }}>
                  AUDIO DESC
                </span>
              )}
              {item.hasCaptions && (
                <span style={{ background: 'rgba(34,229,214,0.1)', color: C.cyan, fontFamily: C.mono, fontWeight: 700, fontSize: 9, padding: '2px 8px', letterSpacing: '0.14em', border: `1px solid ${C.cyan}` }}>
                  CC
                </span>
              )}
            </div>
          </div>

          {/* Title block */}
          <div style={{ padding: '20px 24px 16px', borderBottom: `2px solid rgba(252,221,44,0.25)` }}>
            <h2 style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 26, lineHeight: 1.1, color: C.white, margin: '0 0 6px', letterSpacing: '-0.01em', textShadow: `0 2px 0 ${C.bgDeep}` }}>
              {item.title}
              {item.year && <span style={{ fontWeight: 400, color: C.soft, fontSize: 18, marginLeft: 10 }}>({item.year})</span>}
            </h2>
            {creator && (
              <div style={{ fontFamily: C.mono, fontSize: 13, color: C.cyan, letterSpacing: '0.06em' }}>
                {item.director ? 'DIR.' : 'BY'} {creator.toUpperCase()}
              </div>
            )}
            {item.runtimeMinutes && (
              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginTop: 4, letterSpacing: '0.1em' }}>
                {item.runtimeMinutes} MIN
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ padding: '18px 24px', borderBottom: `1px solid rgba(252,221,44,0.2)` }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.85, color: C.soft }}>{item.description}</p>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div style={{ padding: '12px 24px', borderBottom: `1px solid rgba(252,221,44,0.2)`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  style={{ display: 'inline-block', border: `1px solid ${C.dim}`, color: C.dim, fontFamily: C.mono, fontSize: 10, padding: '2px 8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Platform / access */}
          <div style={{ padding: '16px 24px', borderBottom: `2px solid rgba(252,221,44,0.25)` }}>
            {item.platform && item.platform.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.yellow, letterSpacing: '0.1em', textTransform: 'uppercase' }}>PLATFORM:</span>
                {item.platform.map((p) => (
                  <span key={p} style={{ fontFamily: C.mono, fontSize: 12, background: 'rgba(252,221,44,0.15)', border: `1px solid rgba(252,221,44,0.4)`, color: C.yellow, padding: '2px 10px', letterSpacing: '0.06em' }}>{p}</span>
                ))}
              </div>
            )}
            {item.isFree && item.url ? (
              <div>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.green, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ◆ FREE — STREAM NOW
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.cyan, textDecoration: 'underline', fontSize: 14, wordBreak: 'break-all' }}
                  className="cinema-link"
                >
                  {item.url}
                </a>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginLeft: 8 }}>(opens in new tab)</span>
              </div>
            ) : item.howToAccess ? (
              <div>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.yellow, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ◆ HOW TO WATCH
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: C.soft }}>{item.howToAccess}</p>
              </div>
            ) : null}
          </div>

          {/* Reactions */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid rgba(252,221,44,0.2)` }}>
            <div style={{ fontFamily: C.mono, fontSize: 11, color: C.yellow, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>◆ REACTIONS</div>
            <ItemReactions itemSlug={item.slug} itemType="cinema" palette="blue" />
          </div>

          {/* Comments */}
          <div style={{ padding: '16px 24px' }}>
            <ItemComments itemSlug={item.slug} itemType="cinema" palette="blue" />
          </div>
        </article>

        {/* Nav links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 24, fontSize: 14, fontFamily: C.mono }}>
          <Link href="/cinema" style={{ color: C.yellow, textDecoration: 'none', fontWeight: 700 }} className="cinema-link">← Back to The Cinema</Link>
          <Link href="/resources" style={{ color: C.soft, textDecoration: 'none' }} className="cinema-link">Resources →</Link>
          <Link href="/" style={{ color: C.soft, textDecoration: 'none' }} className="cinema-link">Home</Link>
        </div>
      </div>

      <style>{`
        .cinema-link:hover, .cinema-link:focus-visible {
          text-decoration: underline;
          outline: 3px solid ${C.magenta};
          outline-offset: 3px;
          border-radius: 1px;
        }
        @media (max-width: 640px) {
          [style*="grid-template-columns: auto 1fr auto"] { grid-template-columns: auto 1fr !important; }
        }
      `}</style>
    </main>
  );
}
