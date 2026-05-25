'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LIBRARY_CATEGORIES, LIBRARY_ITEMS, LIBRARY_CATEGORY_BY_ID, type LibraryItem } from '@/lib/library-data';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// OPAC amber palette
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

const TYPE_SHORT: Record<string, string> = {
  book: 'BK', essay: 'ES', article: 'AR', journal: 'JR', zine: 'ZN',
  workbook: 'WB', anthology: 'AN', standard: 'ST', blog: 'BL', toolkit: 'TK',
};

export default function LibraryPage() {
  const [suggest, setSuggest] = useState({ title: '', author: '', why: '', name: '', email: '' });
  const [suggestStatus, setSuggestStatus] = useState<FormStatus>('idle');
  const [clock, setClock] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  useEffect(() => {
    document.title = 'The Library — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!suggest.title.trim() || !suggest.author.trim()) return;
    setSuggestStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggest.name.trim() || 'Anonymous',
          email: suggest.email.trim() || 'no-reply@artisticaccessibility.com',
          subject: `Library Suggestion: ${suggest.title.trim()}`,
          message: [
            `Title: ${suggest.title.trim()}`,
            `Author: ${suggest.author.trim()}`,
            suggest.why.trim() ? `Notes: ${suggest.why.trim()}` : '',
            suggest.name.trim() ? `From: ${suggest.name.trim()}` : '',
          ].filter(Boolean).join('\n'),
        }),
      });
      setSuggestStatus(res.ok ? 'success' : 'error');
    } catch {
      setSuggestStatus('error');
    }
  }

  // Filter items
  const filtered = useMemo<LibraryItem[]>(() => {
    const q = search.toLowerCase().trim();
    return LIBRARY_ITEMS.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (showFreeOnly && !item.isFree) return false;
      if (q) {
        return (
          item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search, activeCategory, showFreeOnly]);

  // Group filtered items by category order
  const byCategory = useMemo(() => {
    const map = new Map<string, LibraryItem[]>();
    LIBRARY_CATEGORIES.forEach((cat) => map.set(cat.id, []));
    filtered.forEach((item) => {
      const arr = map.get(item.category);
      if (arr) arr.push(item);
    });
    return map;
  }, [filtered]);

  const isFiltering = search.trim() || activeCategory || showFreeOnly;

  const inputSty: React.CSSProperties = {
    background: C.bg,
    border: `1px solid ${C.amber}`,
    color: C.hi,
    fontFamily: C.mono,
    fontSize: 14,
    padding: '7px 10px',
    width: '100%',
    boxSizing: 'border-box',
    textShadow: `0 0 4px rgba(255,176,0,0.4)`,
  };
  const labelSty: React.CSSProperties = {
    display: 'block',
    color: C.amber,
    fontFamily: C.mono,
    fontSize: 13,
    letterSpacing: '0.06em',
    marginBottom: 4,
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%), repeating-linear-gradient(0deg, rgba(255,176,0,0.035) 0 1px, transparent 1px 3px), ${C.bg}`,
        fontFamily: C.mono,
        color: C.amber,
        position: 'relative',
      }}
    >
      <h1 className="sr-only">The Library — Artistic Accessibility Collective</h1>

      {/* CRT scanline overlay — hidden for high-contrast / reduced-motion users */}
      <div aria-hidden="true" className="crt-overlay" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0 1px, transparent 1px 3px)', mixBlendMode: 'multiply' }} />
      <div aria-hidden="true" className="crt-overlay" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 61, boxShadow: 'inset 0 0 100px 16px rgba(0,0,0,0.5)' }} />

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '18px 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* Status bar */}
        <div
          aria-label="System status"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '7px 14px', marginBottom: 10, border: `1px solid ${C.amber}`, background: C.bg2, fontSize: 13, letterSpacing: '0.04em' }}
        >
          <span>
            <span aria-hidden="true" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}`, marginRight: 8, verticalAlign: 'middle', animation: 'blink 1.4s steps(2,end) infinite' }} />
            SYSTEM ONLINE · OPAC v3.04
          </span>
          <span style={{ textAlign: 'center', color: C.dim }}>THE LIBRARY · DISABILITY ARTS EDITION</span>
          <span style={{ textAlign: 'right', color: C.dim }}>{clock}</span>
        </div>

        {/* Masthead */}
        <div style={{ padding: '16px 20px', border: `1px solid ${C.amber}`, background: `repeating-linear-gradient(135deg, rgba(255,176,0,0.04) 0 6px, transparent 6px 12px), ${C.bg2}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: 14 }}>
          <div>
            <a href="/" style={{ display: 'block', textDecoration: 'none' }} aria-label="Artistic Accessibility Collective — Home">
              <pre aria-hidden="true" style={{ fontFamily: C.mono, fontSize: 18, lineHeight: 1.0, whiteSpace: 'pre', color: C.amber, margin: 0, textShadow: `0 0 2px rgba(255,176,0,0.5), 0 0 10px rgba(255,176,0,0.25)` }}>{`╔═══════════════════════════════════════╗
║  A R T I S T I C  A C C E S S I B L  ║
║  I T Y  C O L L E C T I V E          ║
╚═══════════════════════════════════════╝`}</pre>
            </a>
            <div style={{ fontSize: 36, fontWeight: 400, letterSpacing: '0.04em', margin: '8px 0 0', color: C.hi, textShadow: `0 0 4px rgba(255,209,102,0.4), 0 0 16px rgba(255,176,0,0.3)` }}>
              THE LIBRARY
            </div>
            <div style={{ fontSize: 13, letterSpacing: '0.06em', color: C.amber }}>ONLINE PUBLIC ACCESS CATALOG · DISABILITY ARTS EDITION</div>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.9, textAlign: 'right', color: C.dim }}>
            <div><span style={{ color: C.amber }}>HOLDINGS.......:</span> {LIBRARY_ITEMS.length} ITEMS</div>
            <div><span style={{ color: C.amber }}>FREE ACCESS....:</span> {LIBRARY_ITEMS.filter((i) => i.isFree).length} ITEMS</div>
            <div><span style={{ color: C.amber }}>SUBJECTS.......:  </span>{LIBRARY_CATEGORIES.length} AREAS</div>
            <div><span style={{ color: C.amber }}>STATUS.........:  </span><span style={{ color: C.green }}>OPEN</span></div>
          </div>
        </div>

        {/* Community framing banner */}
        <div style={{ padding: '14px 20px', background: C.amber, color: C.bg, textShadow: 'none', fontFamily: C.mono, fontSize: 14, letterSpacing: '0.03em', marginBottom: 14, lineHeight: 1.6 }}>
          <strong>★ Community-built reading list.</strong> This catalog is curated by and for anyone who wants to understand disability arts and accessibility better — whether you work in the field, are part of the disability community, or are simply curious and want to learn. Centering disabled voices, disability justice frameworks, and the people doing this work. Items marked FREE link directly to legal, freely accessible versions. All suggestions welcome: see the form below.
        </div>

        {/* Search + filter controls */}
        <div style={{ padding: '14px 18px', border: `1px solid ${C.amber}`, background: C.bg2, marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="lib-search" style={labelSty}>SEARCH.........:</label>
            <input
              id="lib-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, author, or keyword…"
              style={inputSty}
              className="opac-input"
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: C.hi, fontSize: 13, whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={showFreeOnly}
              onChange={(e) => setShowFreeOnly(e.target.checked)}
              style={{ accentColor: C.amber, width: 16, height: 16 }}
            />
            FREE ONLY
          </label>
          {isFiltering && (
            <button
              onClick={() => { setSearch(''); setActiveCategory(null); setShowFreeOnly(false); }}
              style={{ background: 'none', border: `1px solid ${C.dim}`, color: C.dim, fontFamily: C.mono, fontSize: 12, padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.06em' }}
              className="opac-btn"
            >
              CLEAR FILTERS
            </button>
          )}
        </div>

        {/* Two-column layout: subject index + results */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }} className="lib-grid">

          {/* Left: subject index */}
          <aside aria-label="Filter by subject">
            <div style={{ border: `1px solid ${C.amber}`, background: C.bg2, position: 'sticky', top: 16 }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.dim}`, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.hi }}>
                ── SUBJECTS ──
              </div>
              <nav aria-label="Subject index">
                <button
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                  style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: activeCategory === null ? C.amber : 'none', color: activeCategory === null ? C.bg : C.amber, border: 'none', borderBottom: `1px solid ${C.bg}`, cursor: 'pointer', fontFamily: C.mono, fontSize: 13, letterSpacing: '0.04em', textAlign: 'left', textShadow: 'none' }}
                  className="opac-subject-btn"
                >
                  <span>ALL SUBJECTS</span>
                  <span>{LIBRARY_ITEMS.length}</span>
                </button>
                {LIBRARY_CATEGORIES.map((cat) => {
                  const count = LIBRARY_ITEMS.filter((i) => i.category === cat.id).length;
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(active ? null : cat.id)}
                      aria-pressed={active}
                      style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '9px 14px', background: active ? C.amber : 'none', color: active ? C.bg : C.amber, border: 'none', borderBottom: `1px solid ${C.bg}`, cursor: 'pointer', fontFamily: C.mono, fontSize: 13, letterSpacing: '0.04em', textAlign: 'left', textShadow: active ? 'none' : `0 0 4px rgba(255,176,0,0.3)` }}
                      className="opac-subject-btn"
                    >
                      <span><span style={{ color: active ? C.bg : C.dim, marginRight: 6 }}>{cat.code}</span>{cat.title}</span>
                      <span style={{ color: active ? C.bg : C.hi, flex: '0 0 auto', marginLeft: 4 }}>{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right: results */}
          <div>
            {/* Result count */}
            <div
              aria-live="polite"
              aria-atomic="true"
              style={{ padding: '8px 14px', background: C.bg2, border: `1px solid ${C.dim}`, marginBottom: 10, fontSize: 13, color: C.dim, letterSpacing: '0.06em' }}
            >
              {isFiltering
                ? `${filtered.length} RESULT${filtered.length !== 1 ? 'S' : ''} — ${LIBRARY_ITEMS.filter((i) => i.isFree).length} FREE ITEMS IN FULL CATALOG`
                : `${LIBRARY_ITEMS.length} ITEMS · ${LIBRARY_ITEMS.filter((i) => i.isFree).length} FREE · ${LIBRARY_ITEMS.filter((i) => i.isEssential).length} ESSENTIAL`
              }
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '24px 20px', border: `1px solid ${C.dim}`, background: C.bg2, color: C.dim, fontSize: 14 }}>
                ▶ No items match your search. Try clearing a filter or broadening your keywords.
              </div>
            ) : (
              <>
                {/* If filtered to a single category, show flat list; otherwise show grouped */}
                {LIBRARY_CATEGORIES.map((cat) => {
                  const items = byCategory.get(cat.id) ?? [];
                  if (items.length === 0) return null;
                  return (
                    <section key={cat.id} aria-labelledby={`cat-${cat.id}`} style={{ marginBottom: 18 }}>
                      {/* Category header — real h2 for screen reader heading navigation */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 14px', background: C.bg2, border: `1px solid ${C.amber}`, borderBottom: 'none' }}>
                        <h2
                          id={`cat-${cat.id}`}
                          style={{ margin: 0, fontFamily: C.mono, fontWeight: 400, fontSize: 13, letterSpacing: '0.1em', color: C.hi }}
                        >
                          <span style={{ color: C.dim, marginRight: 8 }}>{cat.code}</span>
                          {cat.title.toUpperCase()}
                        </h2>
                        <span style={{ color: C.dim, fontFamily: C.mono, fontSize: 13 }}>{items.length} ITEM{items.length !== 1 ? 'S' : ''}</span>
                      </div>

                      {/* Item rows */}
                      <div style={{ border: `1px solid ${C.amber}`, background: C.bg2 }}>
                        {items.map((item, idx) => (
                          <LibraryRow key={item.slug} item={item} idx={idx} total={items.length} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* How to submit a suggestion */}
        <div style={{ padding: '20px', border: `1px solid ${C.amber}`, background: C.bg2, marginTop: 14, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: 16, padding: '0 8px', background: C.bg2, color: C.hi, fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em' }} aria-hidden="true">── HOW TO SUBMIT ──</div>
          <section aria-label="How the catalog is built and how to submit" style={{ marginTop: 6 }}>
            <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.75, color: C.hi }}>
              This catalog is built and maintained by the AAC community. Every person who reads something essential and shares it makes this resource better for everyone.
            </p>
            <p style={{ margin: '0 0 0', fontSize: 13, lineHeight: 1.75, color: C.amber }}>
              To suggest a book, essay, or resource: use the form below. Include the author, and a brief note on why this belongs in the catalog. Suggestions are reviewed and added by the AAC team. You may submit anything — books, essays, toolkits, syllabi, open-access journals, free PDFs. The only requirement is that it centers disability and is worth someone&apos;s time.
            </p>
          </section>
        </div>

        {/* Suggest a book */}
        <div style={{ padding: '20px', border: `1px solid ${C.amber}`, background: C.bg2, marginTop: 14, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: 16, padding: '0 8px', background: C.bg2, color: C.hi, fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em' }} aria-hidden="true">── SUGGEST A BOOK OR RESOURCE ──</div>
          <section aria-label="Suggest a book for The Library" style={{ marginTop: 6 }}>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: C.dim, letterSpacing: '0.04em' }}>
              What should everyone interested in disability arts be reading?
            </p>
            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ color: C.green, fontSize: 14, padding: '4px 0' }}>
                <span aria-hidden="true">▶ </span>SUBMISSION RECEIVED. Thank you — we&apos;ll add it to the catalog queue.
              </div>
            ) : (
              <form onSubmit={handleSuggest} noValidate style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="lib-form-grid-2">
                  <div>
                    <label htmlFor="sug-title" style={labelSty}>TITLE <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
                    <input id="sug-title" type="text" value={suggest.title} onChange={(e) => setSuggest((s) => ({ ...s, title: e.target.value }))} placeholder="Book or resource title" required disabled={suggestStatus === 'loading'} style={inputSty} className="opac-input" />
                  </div>
                  <div>
                    <label htmlFor="sug-author" style={labelSty}>AUTHOR / CREATOR <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
                    <input id="sug-author" type="text" value={suggest.author} onChange={(e) => setSuggest((s) => ({ ...s, author: e.target.value }))} placeholder="Author name" required disabled={suggestStatus === 'loading'} style={inputSty} className="opac-input" />
                  </div>
                </div>
                <div>
                  <label htmlFor="sug-why" style={labelSty}>WHY DOES THIS BELONG HERE? <span style={{ opacity: 0.6 }}>(optional)</span></label>
                  <textarea id="sug-why" value={suggest.why} onChange={(e) => setSuggest((s) => ({ ...s, why: e.target.value }))} placeholder="Why should everyone interested in disability arts read this?" rows={3} disabled={suggestStatus === 'loading'} style={{ ...inputSty, resize: 'vertical', lineHeight: 1.6 }} className="opac-input" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="lib-form-grid-2">
                  <div>
                    <label htmlFor="sug-name" style={labelSty}>YOUR NAME <span style={{ opacity: 0.6 }}>(optional)</span></label>
                    <input id="sug-name" type="text" value={suggest.name} onChange={(e) => setSuggest((s) => ({ ...s, name: e.target.value }))} placeholder="Optional" disabled={suggestStatus === 'loading'} style={inputSty} className="opac-input" />
                  </div>
                  <div>
                    <label htmlFor="sug-email" style={labelSty}>YOUR EMAIL <span style={{ opacity: 0.6 }}>(optional)</span></label>
                    <input id="sug-email" type="email" value={suggest.email} onChange={(e) => setSuggest((s) => ({ ...s, email: e.target.value }))} placeholder="Optional" disabled={suggestStatus === 'loading'} style={inputSty} className="opac-input" />
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <button
                    type="submit"
                    disabled={suggestStatus === 'loading' || !suggest.title.trim() || !suggest.author.trim()}
                    style={{ background: (suggestStatus === 'loading' || !suggest.title.trim() || !suggest.author.trim()) ? 'rgba(255,176,0,0.3)' : C.amber, color: C.bg, border: `1px solid ${C.amber}`, fontFamily: C.mono, fontWeight: 700, fontSize: 13, padding: '8px 20px', cursor: 'pointer', letterSpacing: '0.08em', textShadow: 'none' }}
                    className="opac-btn"
                  >
                    {'< '}{suggestStatus === 'loading' ? 'SENDING...' : 'SUBMIT CATALOG REQUEST'}{' >'}
                  </button>
                </div>
                {suggestStatus === 'error' && <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>▶ ERROR: Something went wrong. Please try again.</p>}
              </form>
            )}
          </section>
        </div>

        {/* Function key bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${C.amber}`, marginTop: 14 }} aria-label="Navigation">
          {[['F1', 'Resources', '/resources'], ['F2', 'Cinema', '/cinema'], ['F3', 'Home', '/'], ['F4', 'Contact', '/contact']].map(([key, label, href]) => (
            <Link key={key} href={href} style={{ padding: '8px 12px', textDecoration: 'none', color: C.amber, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, letterSpacing: '0.04em', borderRight: `1px solid ${C.dim}` }} className="opac-fkey">
              <span style={{ background: C.amber, color: C.bg, padding: '1px 6px', fontWeight: 700, textShadow: 'none', fontSize: 12 }}>{key}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0.15} }
        .opac-input:focus-visible, .opac-input:focus { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
        .opac-btn:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
        .opac-fkey:hover, .opac-fkey:focus-visible { background: ${C.amber}; color: ${C.bg}; text-decoration: none; outline: 2px solid ${C.cyan}; }
        .opac-fkey:last-child { border-right: none; }
        .opac-subject-btn:hover, .opac-subject-btn:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: -2px; }
        .lib-row-link:hover .lib-row-title, .lib-row-link:focus-visible .lib-row-title { text-decoration: underline; }
        .lib-row-link:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: -2px; }
        /* Stop blinking animation for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          @keyframes blink { 0%, 100% { opacity: 1; } }
        }
        /* Remove CRT overlays when user has requested more contrast */
        @media (prefers-contrast: more) {
          .crt-overlay { display: none !important; }
        }
        @media (max-width: 780px) {
          .lib-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .lib-form-grid-2 { grid-template-columns: 1fr !important; }
          [style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}

// ── Row component ──────────────────────────────────────────────────────────────

function LibraryRow({ item, idx, total }: { item: LibraryItem; idx: number; total: number }) {
  const cat = LIBRARY_CATEGORY_BY_ID[item.category];

  return (
    <Link
      href={`/library/${item.slug}`}
      className="lib-row-link"
      style={{
        display: 'block',
        padding: '11px 14px',
        borderBottom: idx < total - 1 ? `1px solid rgba(255,176,0,0.18)` : 'none',
        textDecoration: 'none',
        background: idx % 2 === 0 ? C.bg2 : `rgba(255,176,0,0.03)`,
        position: 'relative',
      }}
    >
      {/* Top row: call num, type badge, title */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span aria-hidden="true" style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, flex: '0 0 auto', letterSpacing: '0.1em' }}>
          {cat?.code ?? '--'}-{TYPE_SHORT[item.type] ?? '??'}
        </span>

        {item.isEssential && (
          <span aria-label="Essential pick" style={{ background: C.amber, color: C.bg, fontSize: 11, fontWeight: 700, padding: '1px 7px', letterSpacing: '0.12em', textTransform: 'uppercase', flex: '0 0 auto', textShadow: 'none' }}>
            ★
          </span>
        )}

        {item.isFree && (
          <span aria-label="Free access" style={{ background: 'transparent', border: `1px solid #4dff7c`, color: '#4dff7c', fontSize: 11, fontWeight: 700, padding: '1px 7px', letterSpacing: '0.12em', textTransform: 'uppercase', flex: '0 0 auto' }}>
            FREE
          </span>
        )}

        <span
          className="lib-row-title"
          style={{ fontFamily: C.mono, fontSize: 14, color: C.hi, fontWeight: 700, textShadow: `0 0 4px rgba(255,209,102,0.3)`, lineHeight: 1.3 }}
        >
          {item.title}
        </span>
      </div>

      {/* Author + year */}
      <div style={{ marginTop: 3, fontFamily: C.mono, fontSize: 13, color: C.amber }}>
        {item.author}{item.year ? ` · ${item.year}` : ''}
        {!item.isFree && item.howToAccess && (
          <span style={{ color: C.dim, marginLeft: 10, fontSize: 11 }}>· see how to access →</span>
        )}
      </div>
    </Link>
  );
}
