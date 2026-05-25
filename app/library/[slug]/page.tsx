'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LIBRARY_ITEM_BY_SLUG, LIBRARY_CATEGORY_BY_ID, type LibraryItem } from '@/lib/library-data';
import ItemReactions from '@/components/ItemReactions';
import ItemComments from '@/components/ItemComments';
import BrowserChrome from '@/components/BrowserChrome';

// Amber OPAC palette
const C = {
  bg:    '#0a0e0a',
  bg2:   '#0f140e',
  amber: '#ffb000',
  hi:    '#ffd166',
  dim:   '#b87800',
  green: '#4dff7c',
  red:   '#ff5a4a',
  cyan:  '#5ce1ff',
  mono:  '"Courier New", Courier, monospace',
};

const TYPE_LABEL: Record<string, string> = {
  book:      'Book',
  essay:     'Essay',
  article:   'Article',
  journal:   'Journal',
  zine:      'Zine',
  workbook:  'Workbook',
  anthology: 'Anthology',
  standard:  'Standard',
  blog:      'Blog / Archive',
  toolkit:   'Toolkit',
};

export default function LibraryItemPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const item: LibraryItem | undefined = LIBRARY_ITEM_BY_SLUG[slug];

  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (item) document.title = `${item.title} — The Library · AAC`;
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, [item]);

  if (!item) {
    return (
      <BrowserChrome variant="mosaic" title="Record Not Found — The Library" url="http://library.artisticaccessibility.com/">
        <main style={{ minHeight: '100%', background: C.bg, fontFamily: C.mono, color: C.amber, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <div style={{ fontSize: 16, letterSpacing: '0.1em' }}>▶ RECORD NOT FOUND: <code style={{ color: C.hi }}>{slug}</code></div>
          <Link href="/library" style={{ color: C.amber, textDecoration: 'underline' }}>← Back to The Library</Link>
        </main>
      </BrowserChrome>
    );
  }

  const category = LIBRARY_CATEGORY_BY_ID[item.category] ?? null;

  return (
    <BrowserChrome
      variant="mosaic"
      title={`${item.title} — The Library · Artistic Accessibility Collective`}
      url={`http://library.artisticaccessibility.com/${item.slug}`}
    >
    <main
      style={{
        minHeight: '100%',
        background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%), repeating-linear-gradient(0deg, rgba(255,176,0,0.035) 0 1px, transparent 1px 3px), ${C.bg}`,
        fontFamily: C.mono,
        color: C.amber,
        position: 'relative',
      }}
    >
      <h1 className="sr-only">{item.title} — The Library · Artistic Accessibility Collective</h1>

      {/* CRT overlays — hidden for high-contrast / reduced-motion users */}
      <div aria-hidden="true" className="crt-overlay" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0 1px, transparent 1px 3px)', mixBlendMode: 'multiply' }} />
      <div aria-hidden="true" className="crt-overlay" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 61, boxShadow: 'inset 0 0 100px 16px rgba(0,0,0,0.5)' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* Status bar */}
        <div
          aria-label="System status"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '7px 14px', marginBottom: 10, border: `1px solid ${C.amber}`, background: C.bg2, fontSize: 13, letterSpacing: '0.04em' }}
        >
          <span>
            <span aria-hidden="true" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}`, marginRight: 8, verticalAlign: 'middle' }} />
            CATALOG RECORD · OPAC v3.04
          </span>
          <span style={{ textAlign: 'center', color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title.toUpperCase()}</span>
          <span style={{ textAlign: 'right', color: C.dim }}>{clock}</span>
        </div>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, marginBottom: 14, color: C.dim }}>
          <Link href="/library" style={{ color: C.amber, textDecoration: 'none' }} className="opac-link">THE LIBRARY</Link>
          <span aria-hidden="true"> / </span>
          {category && (
            <>
              <Link href={`/library?category=${item.category}`} style={{ color: C.amber, textDecoration: 'none' }} className="opac-link">{category.code} {category.title.toUpperCase()}</Link>
              <span aria-hidden="true"> / </span>
            </>
          )}
          <span style={{ color: C.hi }}>{item.title}</span>
        </nav>

        {/* Main catalog card */}
        <article
          aria-label={`Catalog record for ${item.title}`}
          style={{ border: `1px solid ${C.amber}`, background: C.bg2, marginBottom: 14 }}
        >
          {/* Card header */}
          <div style={{ borderBottom: `1px solid ${C.amber}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              {item.isEssential && (
                <div style={{ display: 'inline-block', background: C.amber, color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '2px 9px', marginBottom: 8, textTransform: 'uppercase' }}>
                  ★ ESSENTIAL
                </div>
              )}
              {item.isFree && !item.isEssential && (
                <div style={{ display: 'inline-block', background: C.green, color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', padding: '2px 9px', marginBottom: 8, textTransform: 'uppercase' }}>
                  FREE
                </div>
              )}
              <h2
                style={{ fontFamily: C.mono, fontSize: 22, lineHeight: 1.25, color: C.hi, margin: '0 0 4px', letterSpacing: '-0.01em', textShadow: `0 0 4px rgba(255,209,102,0.4)` }}
              >
                {item.title}
              </h2>
              <div style={{ fontSize: 15, color: C.amber }}>
                {item.author}{item.year ? `, ${item.year}` : ''}
              </div>
            </div>

            {/* Type + call number */}
            <div style={{ fontSize: 12, textAlign: 'right', lineHeight: 1.9, color: C.dim, minWidth: 160 }}>
              {category && (
                <div><span style={{ color: C.amber }}>CALL NO...:</span> {category.code}-{String(item.type).toUpperCase().slice(0,3)}</div>
              )}
              <div><span style={{ color: C.amber }}>TYPE......:</span> {TYPE_LABEL[item.type] ?? item.type}</div>
              {item.isFree
                ? <div><span style={{ color: C.amber }}>ACCESS....:</span> <span style={{ color: C.green }}>FREE</span></div>
                : <div><span style={{ color: C.amber }}>ACCESS....:</span> <span>SEE BELOW</span></div>
              }
              {item.format && (
                <div><span style={{ color: C.amber }}>FORMAT....:</span> {item.format.join(', ')}</div>
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.dim}` }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.85, color: C.hi }}>{item.description}</p>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.dim}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  style={{ display: 'inline-block', border: `1px solid ${C.dim}`, color: C.dim, fontFamily: C.mono, fontSize: 12, padding: '2px 9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Access */}
          <div style={{ padding: '14px 20px' }}>
            {item.isFree && item.url ? (
              <div>
                <div style={{ fontSize: 13, color: C.amber, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ▶ FREE: AVAILABLE NOW
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.cyan, textDecoration: 'underline', fontSize: 14, wordBreak: 'break-all' }}
                  className="opac-link"
                >
                  {item.url}
                </a>
                <span style={{ fontSize: 12, color: C.dim, marginLeft: 8 }}>(opens in new tab)</span>
              </div>
            ) : item.howToAccess ? (
              <div>
                <div style={{ fontSize: 13, color: C.amber, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ▶ HOW TO ACCESS
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: C.hi }}>{item.howToAccess}</p>
              </div>
            ) : null}
          </div>
        </article>

        {/* Reactions */}
        <div style={{ border: `1px solid ${C.amber}`, background: C.bg2, padding: '16px 20px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.amber, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            ── REACTIONS ──
          </div>
          <ItemReactions itemSlug={item.slug} itemType="library" palette="amber" />
        </div>

        {/* Comments */}
        <div style={{ border: `1px solid ${C.amber}`, background: C.bg2, padding: '16px 20px', marginBottom: 14 }}>
          <ItemComments itemSlug={item.slug} itemType="library" palette="amber" />
        </div>

        {/* Function key bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${C.amber}` }} aria-label="Navigation">
          {[
            ['F1', '← Library', '/library'],
            ['F2', 'Resources', '/resources'],
            ['F3', 'Home', '/'],
            ['F4', 'Contact', '/contact'],
          ].map(([key, label, href]) => (
            <Link
              key={key}
              href={href}
              style={{ padding: '8px 12px', textDecoration: 'none', color: C.amber, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, letterSpacing: '0.04em', borderRight: `1px solid ${C.dim}` }}
              className="opac-fkey"
            >
              <span style={{ background: C.amber, color: C.bg, padding: '1px 6px', fontWeight: 700, textShadow: 'none', fontSize: 12 }}>{key}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .opac-link:hover, .opac-link:focus-visible { text-decoration: underline; outline: 2px solid ${C.cyan}; outline-offset: 2px; }
        .opac-fkey:hover, .opac-fkey:focus-visible { background: ${C.amber}; color: ${C.bg}; text-decoration: none; outline: 2px solid ${C.cyan}; }
        .opac-fkey:last-child { border-right: none; }
        /* Remove CRT overlays for high-contrast users */
        @media (prefers-contrast: more) {
          .crt-overlay { display: none !important; }
        }
        @media (max-width: 640px) {
          [style*="grid-template-columns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; text-align: left !important; }
          [style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
    </BrowserChrome>
  );
}
