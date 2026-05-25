'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CINEMA_CATEGORIES, CINEMA_ITEMS, type CinemaItem, type CinemaCategory } from '@/lib/cinema-data';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Printed TV-guide palette ──────────────────────────────────────────────────
const C = {
  teal:   '#2aacb8',   // page background — slightly muted from original
  navy:   '#0c1e3e',   // section headers
  yellow: '#e8c800',   // free items — warmer, less neon than pure yellow
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

const MEDIA_TYPES = ['Documentary', 'Film', 'Short Film', 'Podcast', 'Series', 'Performance Recording', 'Talk / Lecture', 'Video Essay', 'Other'];

// Left column: first 4 channels. Right column: last 4.
const LEFT_CATS  = CINEMA_CATEGORIES.slice(0, 4);
const RIGHT_CATS = CINEMA_CATEGORIES.slice(4, 8);

export default function CinemaPage() {
  const [search,         setSearch        ] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFreeOnly,   setShowFreeOnly  ] = useState(false);
  const [suggest,        setSuggest       ] = useState({ title: '', type: '', why: '', name: '', email: '' });
  const [suggestStatus,  setSuggestStatus ] = useState<FormStatus>('idle');

  useEffect(() => {
    document.title = 'AAC Presents: The Cinema — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!suggest.title.trim()) return;
    setSuggestStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggest.name.trim() || 'Anonymous',
          email: suggest.email.trim() || 'no-reply@artisticaccessibility.com',
          subject: `Cinema Suggestion: ${suggest.title.trim()}`,
          message: [
            `Title: ${suggest.title.trim()}`,
            suggest.type  ? `Type: ${suggest.type}` : '',
            suggest.why.trim() ? `Why: ${suggest.why.trim()}` : '',
            suggest.name.trim() ? `From: ${suggest.name.trim()}` : '',
          ].filter(Boolean).join('\n'),
        }),
      });
      setSuggestStatus(res.ok ? 'success' : 'error');
    } catch { setSuggestStatus('error'); }
  }

  const filtered = useMemo<CinemaItem[]>(() => {
    const q = search.toLowerCase().trim();
    return CINEMA_ITEMS.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (showFreeOnly && !item.isFree) return false;
      if (q) return (
        item.title.toLowerCase().includes(q) ||
        (item.director ?? '').toLowerCase().includes(q) ||
        (item.creator ?? '').toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
      return true;
    });
  }, [search, activeCategory, showFreeOnly]);

  const byCategory = useMemo(() => {
    const map = new Map<string, CinemaItem[]>();
    CINEMA_CATEGORIES.forEach((cat) => map.set(cat.id, []));
    filtered.forEach((item) => { map.get(item.category)?.push(item); });
    return map;
  }, [filtered]);

  const isFiltering = search.trim() || activeCategory || showFreeOnly;
  const freeCount = CINEMA_ITEMS.filter((i) => i.isFree).length;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.teal,
        fontFamily: C.sans,
        color: C.black,
        padding: '0 0 48px',
      }}
    >
      <h1 className="sr-only">AAC Presents: The Cinema — Artistic Accessibility Collective</h1>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Top search bar ───────────────────────────────────────── */}
        <div
          style={{
            background: C.navy,
            color: C.white,
            padding: '8px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            marginBottom: 14,
            borderBottom: `3px solid ${C.black}`,
          }}
        >
          <span style={{ fontWeight: 900, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            SEARCH LISTINGS:
          </span>
          <label htmlFor="cinema-search" className="sr-only">Search titles, creators, keywords</label>
          <input
            id="cinema-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, director, keyword…"
            style={{ flex: 1, minWidth: 160, background: C.white, border: `1px solid ${C.lgray}`, color: C.black, fontFamily: C.sans, fontSize: 13, padding: '4px 9px' }}
            className="cinema-ctrl-input"
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={showFreeOnly} onChange={(e) => setShowFreeOnly(e.target.checked)} style={{ accentColor: C.yellow, width: 14, height: 14 }} />
            FREE ONLY ★
          </label>
          {isFiltering && (
            <button
              onClick={() => { setSearch(''); setActiveCategory(null); setShowFreeOnly(false); }}
              style={{ background: C.teal, border: `1px solid ${C.black}`, color: C.black, fontFamily: C.sans, fontWeight: 700, fontSize: 11, padding: '3px 10px', cursor: 'pointer', letterSpacing: '0.06em' }}
              className="cinema-ctrl-btn"
            >
              CLEAR ✕
            </button>
          )}
          <div aria-live="polite" aria-atomic="true" style={{ fontFamily: C.mono, fontSize: 11, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
            {isFiltering ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : `${CINEMA_ITEMS.length} titles · ${freeCount} free`}
          </div>
        </div>

        {/* ── Category filter pills ─────────────────────────────────── */}
        <div
          role="group"
          aria-label="Filter by channel"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}
        >
          {[{ id: null, channel: 'ALL', call: 'ALL CHANNELS' }, ...CINEMA_CATEGORIES.map(c => ({ id: c.id, channel: c.channel, call: c.call + ' — ' + c.title }))].map((opt) => {
            const active = opt.id === null ? activeCategory === null : activeCategory === opt.id;
            return (
              <button
                key={opt.id ?? 'all'}
                onClick={() => setActiveCategory(opt.id === null ? null : (activeCategory === opt.id ? null : opt.id))}
                aria-pressed={active}
                style={{
                  background: active ? C.navy : C.white,
                  color: active ? C.white : C.black,
                  border: `2px solid ${C.navy}`,
                  fontFamily: C.sans,
                  fontWeight: 900,
                  fontSize: 10,
                  padding: '3px 9px',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
                className="cinema-cat-btn"
              >
                {opt.channel} {opt.call !== 'ALL CHANNELS' ? '' : ''}
              </button>
            );
          })}
        </div>

        {/* ── Main two-column printed schedule grid ─────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'start' }} className="cinema-schedule-grid">

          {/* LEFT COLUMN */}
          <div>
            {/* Title block — sits above the left column items, on the teal background */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontFamily: C.sans, letterSpacing: '-0.01em', lineHeight: 1.0, color: C.black }}>
                <div style={{ fontSize: 12, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', opacity: 0.65 }}>&apos;25&ndash;&apos;26 SEASON</div>
                <div style={{ fontSize: 13, letterSpacing: '0.14em', fontWeight: 900, marginTop: 4 }}>AAC PRESENTS:</div>
                <div style={{ fontSize: 42, lineHeight: 0.88, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 2 }}>THE<br/>CINEMA</div>
              </div>
              <div style={{ marginTop: 12, borderTop: `2px solid ${C.black}`, paddingTop: 10 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, lineHeight: 1.65 }}>
                  A community-curated schedule of films, documentaries, podcasts, and more — centered on disability representation and accessibility in the arts.
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 11, lineHeight: 1.65, color: C.gray }}>
                  Ratings and comments aren&apos;t extras. They&apos;re how this community holds the record honest — whether a film treats its subjects with dignity, whether accessibility features are actually good, what it means to see your experience onscreen. Watch. Then weigh in.
                </p>
                <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.5 }}>★ Free items in yellow &nbsp;·&nbsp; ★ Essential picks</div>
                <div style={{ fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>Click any title to rate, comment, and save.</div>
                <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.5, color: C.gray }}>
                  Something missing?{' '}
                  <a href="#suggest-form" style={{ color: C.black, fontWeight: 700 }}>Suggest a title ↓</a>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Link href="/library" style={{ color: C.black, fontWeight: 700, fontSize: 12, textDecoration: 'underline' }} className="cinema-nav-link">The Library →</Link>
                  <Link href="/resources" style={{ color: C.black, fontSize: 12, textDecoration: 'underline' }} className="cinema-nav-link">Resources →</Link>
                  <Link href="/" style={{ color: C.black, fontSize: 12, textDecoration: 'underline' }} className="cinema-nav-link">← Home</Link>
                </div>
              </div>
            </div>

            {/* Left-column category sections */}
            {LEFT_CATS.map((cat) => {
              const items = byCategory.get(cat.id) ?? [];
              if (activeCategory && activeCategory !== cat.id) return null;
              return <ScheduleSection key={cat.id} cat={cat} items={items} />;
            })}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RIGHT_CATS.map((cat) => {
              const items = byCategory.get(cat.id) ?? [];
              if (activeCategory && activeCategory !== cat.id) return null;
              return <ScheduleSection key={cat.id} cat={cat} items={items} />;
            })}
          </div>
        </div>

        {/* ── Suggest form ─────────────────────────────────────────── */}
        <div
          id="suggest-form"
          style={{ marginTop: 20, background: C.white, border: `2px solid ${C.black}` }}
        >
          {/* Form header */}
          <div style={{ background: C.navy, color: C.white, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                SUGGEST A TITLE
              </div>
              <div style={{ fontWeight: 400, fontSize: 11, opacity: 0.8, marginTop: 1 }}>
                Documentary · Film · Podcast · Short · Performance · Talk — anything that belongs here
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 18px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.65, color: C.gray }}>
              This schedule is built by the community. What should anyone interested in disability arts watch? Free-access preferred but not required — include the platform if you know it.
            </p>

            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ padding: '12px 16px', background: '#e8fae8', border: `1px solid #2a7a2a`, color: '#1a5a1a', fontSize: 14 }}>
                ✓ Suggestion received — thank you. We&apos;ll review it for the next update.
              </div>
            ) : (
              <form onSubmit={handleSuggest} noValidate style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="cinema-form-grid">
                  <div>
                    <label htmlFor="sug-title" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                      Title <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                    </label>
                    <input id="sug-title" type="text" value={suggest.title} onChange={(e) => setSuggest((s) => ({ ...s, title: e.target.value }))} placeholder="Film, podcast, or show title" required disabled={suggestStatus === 'loading'} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.lgray}`, padding: '7px 9px', fontFamily: C.sans, fontSize: 13 }} className="cinema-ctrl-input" />
                  </div>
                  <div>
                    <label htmlFor="sug-type" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                      Type <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                    </label>
                    <select id="sug-type" value={suggest.type} onChange={(e) => setSuggest((s) => ({ ...s, type: e.target.value }))} disabled={suggestStatus === 'loading'} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.lgray}`, padding: '7px 9px', fontFamily: C.sans, fontSize: 13, background: C.white, appearance: 'none' }} className="cinema-ctrl-input">
                      <option value="">Select…</option>
                      {MEDIA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="sug-why" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Why does this belong here? <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                  </label>
                  <textarea id="sug-why" value={suggest.why} onChange={(e) => setSuggest((s) => ({ ...s, why: e.target.value }))} placeholder="Why should anyone interested in disability arts watch this?" rows={3} disabled={suggestStatus === 'loading'} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.lgray}`, padding: '7px 9px', fontFamily: C.sans, fontSize: 13, resize: 'vertical', lineHeight: 1.6 }} className="cinema-ctrl-input" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="cinema-form-grid">
                  <div>
                    <label htmlFor="sug-name" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Your Name <span style={{ fontWeight: 400 }}>(optional)</span></label>
                    <input id="sug-name" type="text" value={suggest.name} onChange={(e) => setSuggest((s) => ({ ...s, name: e.target.value }))} placeholder="Optional" disabled={suggestStatus === 'loading'} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.lgray}`, padding: '7px 9px', fontFamily: C.sans, fontSize: 13 }} className="cinema-ctrl-input" />
                  </div>
                  <div>
                    <label htmlFor="sug-email" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Your Email <span style={{ fontWeight: 400 }}>(optional)</span></label>
                    <input id="sug-email" type="email" value={suggest.email} onChange={(e) => setSuggest((s) => ({ ...s, email: e.target.value }))} placeholder="Optional" disabled={suggestStatus === 'loading'} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.lgray}`, padding: '7px 9px', fontFamily: C.sans, fontSize: 13 }} className="cinema-ctrl-input" />
                  </div>
                </div>

                <div style={{ paddingTop: 2 }}>
                  <button
                    type="submit"
                    disabled={suggestStatus === 'loading' || !suggest.title.trim()}
                    style={{
                      background: (suggestStatus === 'loading' || !suggest.title.trim()) ? C.lgray : C.navy,
                      color: (suggestStatus === 'loading' || !suggest.title.trim()) ? C.gray : C.white,
                      border: `2px solid ${C.navy}`,
                      fontFamily: C.sans,
                      fontWeight: 900,
                      fontSize: 13,
                      padding: '9px 22px',
                      cursor: (suggestStatus === 'loading' || !suggest.title.trim()) ? 'default' : 'pointer',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                    className="cinema-ctrl-btn"
                  >
                    {suggestStatus === 'loading' ? 'Sending…' : 'Submit Suggestion'}
                  </button>
                </div>

                {suggestStatus === 'error' && (
                  <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>
                    Something went wrong — please try again or email us directly.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

      </div>{/* end container */}

      <style>{`
        .cinema-ctrl-input:focus-visible,
        .cinema-ctrl-input:focus {
          outline: 3px solid #0c1e3e;
          outline-offset: 0;
        }
        .cinema-ctrl-btn:focus-visible,
        .cinema-cat-btn:focus-visible {
          outline: 3px solid #0c1e3e;
          outline-offset: 2px;
        }
        .cinema-nav-link:hover,
        .cinema-nav-link:focus-visible {
          background: ${C.black};
          color: ${C.white};
          outline: none;
        }
        .cinema-item-link:hover .cinema-item-title {
          text-decoration: underline;
        }
        .cinema-item-link:focus-visible {
          outline: 3px solid #0c1e3e;
          outline-offset: -2px;
        }
        @media (max-width: 680px) {
          .cinema-schedule-grid { grid-template-columns: 1fr !important; }
          .cinema-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

// ── Schedule section component ────────────────────────────────────────────────

function ScheduleSection({ cat, items }: { cat: CinemaCategory; items: CinemaItem[] }) {
  return (
    <section aria-labelledby={`ch-label-${cat.id}`} style={{ marginBottom: 10 }}>
      {/* Channel header — dark navy like the ABC/CBS/NBC headers in the original */}
      <div
        id={`ch-label-${cat.id}`}
        style={{
          background: C.navy,
          color: C.white,
          padding: '6px 10px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em', opacity: 0.7 }}>
          {cat.channel}
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {cat.call} — {cat.title.toUpperCase()}
          </div>
          <div style={{ fontSize: 10, opacity: 0.65, lineHeight: 1.3, marginTop: 1 }}>{cat.description}</div>
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 10, opacity: 0.6, whiteSpace: 'nowrap' }}>
          {items.length} TITLE{items.length !== 1 ? 'S' : ''}
        </div>
      </div>

      {/* Item cells */}
      <div style={{ border: `2px solid ${C.navy}`, borderTop: 'none' }}>
        {items.length === 0 ? (
          <div style={{ padding: '10px 10px', fontSize: 12, color: C.gray, fontStyle: 'italic', background: C.white }}>
            No titles match current filters.
          </div>
        ) : (
          items.map((item, idx) => <ScheduleCell key={item.slug} item={item} idx={idx} total={items.length} />)
        )}
      </div>
    </section>
  );
}

// ── Individual cell ───────────────────────────────────────────────────────────

function ScheduleCell({ item, idx, total }: { item: CinemaItem; idx: number; total: number }) {
  const creator = item.director || item.creator || '';
  const isEven = idx % 2 === 0;

  return (
    <Link
      href={`/cinema/${item.slug}`}
      className="cinema-item-link"
      style={{
        display: 'block',
        padding: '7px 10px',
        borderBottom: idx < total - 1 ? `1px solid ${C.lgray}` : 'none',
        background: item.isFree
          ? C.yellow
          : isEven
          ? C.white
          : C.cream,
        textDecoration: 'none',
        color: C.black,
        position: 'relative',
      }}
    >
      {/* Top row: title + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, flexWrap: 'wrap' }}>
        {item.isEssential && (
          <span
            aria-label="Essential"
            title="Essential pick"
            style={{ flex: '0 0 auto', fontWeight: 900, fontSize: 12, color: item.isFree ? C.black : C.navy, lineHeight: 1.3 }}
          >★</span>
        )}
        <span
          className="cinema-item-title"
          style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.25, letterSpacing: '-0.01em', flex: 1 }}
        >
          {item.title}
          {item.year ? <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 5, opacity: 0.7 }}>({item.year})</span> : null}
        </span>
        <div style={{ display: 'flex', gap: 3, flex: '0 0 auto' }}>
          {item.isFree && (
            <span aria-label="Free to stream" style={{ fontWeight: 900, fontSize: 9, letterSpacing: '0.12em', background: C.black, color: C.yellow, padding: '1px 4px' }}>FREE★</span>
          )}
          {item.hasAD && (
            <span aria-label="Audio description available" style={{ fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', border: `1px solid ${C.black}`, padding: '0 3px' }}>AD</span>
          )}
          {item.hasCaptions && (
            <span aria-label="Captions available" style={{ fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', border: `1px solid ${C.black}`, padding: '0 3px' }}>CC</span>
          )}
        </div>
      </div>

      {/* Bottom row: creator + platform */}
      <div style={{ marginTop: 2, fontSize: 11, color: item.isFree ? '#333' : C.gray, lineHeight: 1.3 }}>
        {creator && <span>{item.director ? 'dir. ' : ''}{creator}</span>}
        {creator && item.platform && item.platform.length > 0 && <span> · </span>}
        {item.platform && item.platform.length > 0 && (
          <span>{item.platform.join(' / ')}</span>
        )}
        {item.runtimeMinutes && <span> · {item.runtimeMinutes}m</span>}
      </div>
    </Link>
  );
}
