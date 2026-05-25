'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CINEMA_CATEGORIES, CINEMA_ITEMS, CINEMA_CATEGORY_BY_ID, type CinemaItem } from '@/lib/cinema-data';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// ─── Design Tokens ───────────────────────────────────────────
const C = {
  bg:       '#0a3bb8',
  bgDeep:   '#062586',
  bgRow:    '#1c1f8c',
  bgRow2:   '#2d1664',
  bgCh:     '#08032e',
  yellow:   '#fcdd2c',
  yellowD:  '#fbcc1c',
  white:    '#ffffff',
  soft:     '#c8d5ff',
  cyan:     '#22e5d6',
  magenta:  '#ff3b8d',
  red:      '#ff4040',
  green:    '#4dff7c',
  dim:      '#8099cc',
  sans:     '"Arial Narrow", Arial, "Helvetica Neue", Helvetica, sans-serif',
  mono:     '"Courier New", Courier, monospace',
};

const MEDIA_TYPES = ['Documentary', 'Film', 'Short Film', 'Podcast', 'Series', 'Performance Recording', 'Talk / Lecture', 'Video Essay', 'Other'];

const TICKER_ITEMS = [
  'CAPTIONS ON ALL CONTENT',
  'AUDIO DESCRIPTION WHERE AVAILABLE',
  'MEMBER CURATED PICKS',
  'FREE ★ = LEGALLY FREE TO STREAM',
  'CRIP CAMP ON NETFLIX',
  'SUGGEST A FILM BELOW',
  'DEAF WEST: SPRING AWAKENING',
  'DISABILITY VISIBILITY PROJECT',
  'AXIS DANCE FREE ON YOUTUBE',
  'JOYBUBBLES — FIRST OPEN AD AT SUNDANCE',
];

// Decorative channel grid data (preview of what's in the catalog)
type ShowCell = { title: string; kind: string; isNew?: boolean; isFree?: boolean; span?: number };
type Channel = { num: string; call: string; shows: ShowCell[] };
const CHANNELS: Channel[] = [
  { num: '01', call: 'DOCS', shows: [{ title: 'Crip Camp', kind: 'Documentary' }, { title: 'Lives Worth Living', kind: 'Documentary', isFree: true }, { title: 'Sound and Fury', kind: 'Documentary' }, { title: 'Sins Invalid', kind: 'Documentary' }, { title: 'Far From the Tree', kind: 'Documentary' }] },
  { num: '02', call: 'PERF', shows: [{ title: 'AXIS Dance Archive', kind: 'Dance', isFree: true, span: 2 }, { title: 'Kinetic Light: WIRED', kind: 'Dance Film', isFree: true }, { title: 'Graeae Archive', kind: 'Theater' }, { title: 'Deaf West', kind: 'Theater' }] },
  { num: '03', call: 'SHRT', shows: [{ title: 'DFC Winners', kind: 'Short Film', isFree: true }, { title: 'Superfest Archive', kind: 'Short', isFree: true }, { title: 'DVP Films', kind: 'Video Essay', isFree: true }, { title: 'DisabilityArts.TV', kind: 'Archive', isFree: true }, { title: 'Open Channel', kind: 'Coming' }] },
  { num: '04', call: 'CAST', shows: [{ title: 'Disability Visibility Project', kind: 'Podcast', isFree: true, span: 2, isNew: true }, { title: 'Reid My Mind Radio', kind: 'Podcast', isFree: true }, { title: 'Accessible Stall', kind: 'Podcast', isFree: true }] },
  { num: '05', call: 'SERS', shows: [{ title: 'Speechless', kind: 'Comedy' }, { title: 'Special', kind: 'Comedy' }, { title: 'Deaf U', kind: 'Documentary' }, { title: 'The A Word', kind: 'Drama' }, { title: 'MORE COMING', kind: 'TBD' }] },
  { num: '06', call: 'DRAM', shows: [{ title: 'Children of a Lesser God', kind: 'Drama' }, { title: 'Keep the Change', kind: 'Drama', isNew: true }, { title: 'Sound of Metal', kind: 'Drama' }, { title: 'CODA', kind: 'Drama' }, { title: 'Diving Bell', kind: 'Drama' }] },
  { num: '07', call: 'TALK', shows: [{ title: 'Stella Young — TED', kind: 'Talk', isFree: true, isNew: true }, { title: 'Haben Girma — TED', kind: 'Talk', isFree: true }, { title: 'Judy Heumann — TED', kind: 'Talk', isFree: true }, { title: 'Alice Wong Lectures', kind: 'Talk', isFree: true }, { title: 'Thomas Reid — AD', kind: 'Training', isFree: true }] },
  { num: '08', call: 'FEST', shows: [{ title: 'Joybubbles (Sundance \'26)', kind: 'Documentary', isNew: true }, { title: 'Disposable Humanity', kind: 'Documentary', isNew: true }, { title: 'VIKTOR', kind: 'Documentary', isNew: true }, { title: 'ReelAbilities \'26', kind: 'Festival' }, { title: 'MORE COMING', kind: 'TBD' }] },
];

export default function CinemaPage() {
  const [suggest, setSuggest] = useState({ title: '', type: '', why: '', name: '', email: '' });
  const [suggestStatus, setSuggestStatus] = useState<FormStatus>('idle');
  const [clock, setClock] = useState('');
  const [scrollPx, setScrollPx] = useState(0);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const ROW_H = 68;
  const totalScrollH = CHANNELS.length * ROW_H;

  useEffect(() => {
    document.title = 'The Cinema — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setScrollPx((p) => (p + 1) % totalScrollH), 50);
    return () => clearInterval(id);
  }, [totalScrollH]);

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
          message: [`Title: ${suggest.title.trim()}`, suggest.type ? `Type: ${suggest.type}` : '', suggest.why.trim() ? `Why: ${suggest.why.trim()}` : '', suggest.name.trim() ? `From: ${suggest.name.trim()}` : ''].filter(Boolean).join('\n'),
        }),
      });
      setSuggestStatus(res.ok ? 'success' : 'error');
    } catch {
      setSuggestStatus('error');
    }
  }

  // Filtered items
  const filtered = useMemo<CinemaItem[]>(() => {
    const q = search.toLowerCase().trim();
    return CINEMA_ITEMS.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (showFreeOnly && !item.isFree) return false;
      if (q) {
        return (
          item.title.toLowerCase().includes(q) ||
          (item.director ?? '').toLowerCase().includes(q) ||
          (item.creator ?? '').toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search, activeCategory, showFreeOnly]);

  // Group by category
  const byCategory = useMemo(() => {
    const map = new Map<string, CinemaItem[]>();
    CINEMA_CATEGORIES.forEach((cat) => map.set(cat.id, []));
    filtered.forEach((item) => { const arr = map.get(item.category); if (arr) arr.push(item); });
    return map;
  }, [filtered]);

  const isFiltering = search.trim() || activeCategory || showFreeOnly;
  const loopedChannels = [...CHANNELS, ...CHANNELS];

  const inputBase: React.CSSProperties = { background: C.bgDeep, border: `1px solid rgba(252,221,44,0.3)`, color: C.white, fontFamily: C.sans, fontSize: 14, padding: '9px 12px', width: '100%', boxSizing: 'border-box' };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.bgDeep,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 0 40px',
        fontFamily: C.sans,
        color: C.white,
      }}
    >
      <h1 className="sr-only">The Cinema — Artistic Accessibility Collective</h1>

      <div style={{ width: '100%', maxWidth: 920, margin: '24px 16px 0', border: `3px solid ${C.yellow}`, boxShadow: `0 0 60px rgba(10,59,184,0.6), 0 4px 40px rgba(0,0,0,0.7)`, position: 'relative', backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)` }}>

        {/* ── Status bar ───────────────────────────────────────── */}
        <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 16, padding: '5px 14px', background: C.bgDeep, borderBottom: `2px solid ${C.yellow}`, fontFamily: C.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.yellow }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 13, letterSpacing: '0.04em' }}>
            <span style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 10px', borderColor: `transparent transparent transparent ${C.yellow}`, display: 'inline-block' }} />
            AAC CINEMA
          </div>
          <div style={{ overflow: 'hidden', position: 'relative', height: 15 }}>
            <div className="cinema-ticker" style={{ display: 'inline-block', whiteSpace: 'nowrap', color: C.white }}>
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} style={{ padding: '0 24px', color: i % 3 === 1 ? C.magenta : C.white }}>◆ {item}</span>
              ))}
            </div>
          </div>
          <div style={{ color: C.yellow, fontSize: 12, letterSpacing: '0.1em' }}>{clock}</div>
        </div>

        {/* ── Grid header ──────────────────────────────────────── */}
        <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr)', background: C.yellow, color: C.bgDeep, borderBottom: `3px solid ${C.bgDeep}`, fontFamily: C.sans, fontWeight: 900, fontSize: 13 }}>
          <div style={{ background: C.bgCh, color: C.yellow, padding: '8px 10px', textAlign: 'center', borderRight: `3px solid ${C.yellow}`, fontFamily: C.mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CH</div>
          {['NOW ON', 'UP NEXT', 'LATER', 'TONIGHT', 'COMING SOON'].map((slot, i) => (
            <div key={i} style={{ padding: '8px 12px', borderRight: i < 4 ? `2px solid ${C.bgDeep}` : 'none', display: 'flex', alignItems: 'center', fontSize: 12 }}>{slot}</div>
          ))}
        </div>

        {/* ── Scrolling grid ───────────────────────────────────── */}
        <div aria-hidden="true" style={{ height: 204, overflow: 'hidden', background: C.bgRow, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 32, background: `linear-gradient(to bottom, ${C.bgDeep}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: `linear-gradient(to top, ${C.bgDeep}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ transform: `translateY(-${scrollPx}px)`, willChange: 'transform' }}>
            {loopedChannels.map((ch, rowIdx) => (
              <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr)', borderBottom: `2px solid ${C.bgCh}`, minHeight: ROW_H, background: rowIdx % 2 === 0 ? C.bgRow : C.bgRow2, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 4px)' }}>
                <div style={{ background: C.bgCh, color: C.yellow, padding: '8px 10px', display: 'grid', gridTemplateRows: 'auto auto', alignContent: 'center', rowGap: 2, borderRight: `3px solid ${C.yellow}`, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)' }}>
                  <div style={{ fontWeight: 900, fontSize: 24, lineHeight: 1, letterSpacing: '-0.02em', color: C.yellowD, textShadow: `0 0 8px rgba(252,204,28,0.45)` }}>{ch.num}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.cyan, textTransform: 'uppercase', textShadow: `0 0 6px rgba(34,229,214,0.35)` }}>{ch.call}</div>
                </div>
                {ch.shows.slice(0, 5).map((show, si) => (
                  <div key={si} style={{ gridColumn: show.span ? `span ${show.span}` : undefined, padding: '8px 12px', borderRight: `1.5px solid rgba(252,221,44,0.2)`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, position: 'relative', color: C.white }}>
                    {show.isNew && <span style={{ position: 'absolute', top: 5, right: 5, background: C.magenta, color: C.white, fontFamily: C.mono, fontWeight: 700, fontSize: 8, padding: '1px 4px', letterSpacing: '0.14em' }}>NEW</span>}
                    <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.15, letterSpacing: '-0.005em' }}>{show.title}{show.isFree && <span style={{ color: C.yellow }}> ★</span>}</div>
                    <div style={{ fontFamily: C.mono, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', color: C.cyan, textTransform: 'uppercase' }}>{show.kind}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Main content area ─────────────────────────────────── */}
        <div style={{ background: C.bg, padding: '24px 28px 28px', backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)' }}>

          {/* About */}
          <section aria-label="About The Cinema" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.02em', color: C.white, margin: '0 0 4px', textShadow: `0 2px 0 ${C.bgDeep}, 0 0 24px rgba(252,221,44,0.18)` }}>
              THE <span style={{ color: C.yellow }}>CINEMA</span>
            </h2>
            <p style={{ fontFamily: C.mono, fontSize: 10, color: C.cyan, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>
              Ch. 42 — Disability Arts Film, Video & Audio
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: C.soft, margin: '0 0 10px' }}>
              A community-curated film and video library for the disability arts field. Documentaries, podcasts, performance recordings, talks, and narrative films — with a focus on work that is accessible, and on work made by disabled artists rather than about them.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: C.soft, margin: '0 0 10px' }}>
              <strong style={{ color: C.yellow }}>★ = free to stream legally.</strong> Every FREE-marked item links directly to the source. Non-free items include platform and access instructions. Click any title for the full record, member reactions, and community comments.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: C.dim, margin: 0 }}>
              This list is built by the community. Have something to add? Use the suggest form below.
            </p>
          </section>

          {/* Search + filter */}
          <section aria-label="Search and filter" style={{ background: C.bgDeep, border: `2px solid ${C.yellow}`, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label htmlFor="cinema-search" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Search titles, creators, keywords
                </label>
                <input
                  id="cinema-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Film title, director, keyword…"
                  style={inputBase}
                  className="cinema-input"
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: C.yellow, fontFamily: C.mono, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap', paddingBottom: 2 }}>
                <input type="checkbox" checked={showFreeOnly} onChange={(e) => setShowFreeOnly(e.target.checked)} style={{ accentColor: C.yellow, width: 15, height: 15 }} />
                FREE ONLY ★
              </label>
              {isFiltering && (
                <button onClick={() => { setSearch(''); setActiveCategory(null); setShowFreeOnly(false); }} style={{ background: 'none', border: `1px solid ${C.dim}`, color: C.dim, fontFamily: C.mono, fontSize: 11, padding: '8px 14px', cursor: 'pointer', letterSpacing: '0.06em', whiteSpace: 'nowrap' }} className="cinema-btn">
                  CLEAR ✕
                </button>
              )}
            </div>

            {/* Channel (category) filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }} role="group" aria-label="Filter by channel">
              <button
                onClick={() => setActiveCategory(null)}
                aria-pressed={activeCategory === null}
                style={{ fontFamily: C.mono, fontSize: 10, padding: '4px 10px', background: activeCategory === null ? C.yellow : 'transparent', color: activeCategory === null ? C.bgDeep : C.yellow, border: `1px solid ${activeCategory === null ? C.yellow : 'rgba(252,221,44,0.4)'}`, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                className="cinema-btn"
              >
                ALL CH
              </button>
              {CINEMA_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  aria-pressed={activeCategory === cat.id}
                  style={{ fontFamily: C.mono, fontSize: 10, padding: '4px 10px', background: activeCategory === cat.id ? C.yellow : 'transparent', color: activeCategory === cat.id ? C.bgDeep : C.soft, border: `1px solid ${activeCategory === cat.id ? C.yellow : 'rgba(200,213,255,0.3)'}`, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                  className="cinema-btn"
                >
                  CH {cat.channel} {cat.call}
                </button>
              ))}
            </div>
          </section>

          {/* Result count */}
          <div aria-live="polite" aria-atomic="true" style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            {isFiltering
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} — ${CINEMA_ITEMS.filter((i) => i.isFree).length} free items in full catalog`
              : `${CINEMA_ITEMS.length} items · ${CINEMA_ITEMS.filter((i) => i.isFree).length} free · ${CINEMA_ITEMS.filter((i) => i.isEssential).length} essential`
            }
          </div>

          {/* Catalog listing by channel */}
          {filtered.length === 0 ? (
            <div style={{ background: C.bgDeep, border: `1px solid rgba(252,221,44,0.3)`, padding: '20px', color: C.dim, fontFamily: C.mono, fontSize: 14 }}>
              ◆ No items match your search. Try clearing a filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {CINEMA_CATEGORIES.map((cat) => {
                const items = byCategory.get(cat.id) ?? [];
                if (items.length === 0) return null;
                return (
                  <section key={cat.id} aria-labelledby={`ch-${cat.id}`}>
                    {/* Channel header */}
                    <div
                      style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', alignItems: 'center', background: C.bgCh, border: `2px solid ${C.yellow}`, borderBottom: 'none', padding: '8px 14px', gap: 12 }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 20, color: C.yellowD, fontFamily: C.mono, letterSpacing: '-0.01em', textShadow: `0 0 8px rgba(252,204,28,0.45)` }}>
                        CH {cat.channel}
                      </div>
                      <div>
                        <div id={`ch-${cat.id}`} style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: C.cyan, textTransform: 'uppercase' }}>{cat.call} — {cat.title.toUpperCase()}</div>
                        <div style={{ fontFamily: C.sans, fontSize: 12, color: C.dim, marginTop: 2 }}>{cat.description}</div>
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>{items.length} TITLE{items.length !== 1 ? 'S' : ''}</div>
                    </div>

                    {/* Items */}
                    <div style={{ border: `2px solid rgba(252,221,44,0.4)`, borderTop: 'none' }}>
                      {items.map((item, idx) => (
                        <CinemaRow key={item.slug} item={item} idx={idx} total={items.length} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* Suggest a film */}
          <section
            aria-label="Suggest a film or show for The Cinema"
            style={{ background: C.bgDeep, border: `1px solid rgba(252,221,44,0.35)`, padding: '20px', marginTop: 28 }}
          >
            <h2 style={{ fontFamily: C.mono, fontSize: 11, color: C.yellow, margin: '0 0 4px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              ▶ Suggest a Film, Podcast, or Talk
            </h2>
            <p style={{ fontFamily: C.mono, fontSize: 10, color: C.soft, margin: '0 0 16px', letterSpacing: '0.06em', lineHeight: 1.6 }}>
              What should every disability arts person watch? This list grows through community suggestions. Share a documentary, podcast, short film, talk — anything that belongs here. Free access preferred but not required.
            </p>

            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ background: 'rgba(77,255,124,0.12)', border: `1px solid ${C.green}`, padding: '12px 16px', color: C.green, fontSize: 14, fontFamily: C.mono, letterSpacing: '0.05em' }}>
                ✓ Suggestion received — thank you! We&apos;ll add it to the screening queue.
              </div>
            ) : (
              <form onSubmit={handleSuggest} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="cinema-grid-2">
                  <div>
                    <label htmlFor="cinema-suggest-title" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Title <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                    </label>
                    <input id="cinema-suggest-title" type="text" value={suggest.title} onChange={(e) => setSuggest((s) => ({ ...s, title: e.target.value }))} placeholder="Film, podcast, or show title" required disabled={suggestStatus === 'loading'} className="cinema-input" style={inputBase} />
                  </div>
                  <div>
                    <label htmlFor="cinema-suggest-type" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Type <span style={{ opacity: 0.6 }}>(optional)</span>
                    </label>
                    <select id="cinema-suggest-type" value={suggest.type} onChange={(e) => setSuggest((s) => ({ ...s, type: e.target.value }))} disabled={suggestStatus === 'loading'} className="cinema-input" style={{ ...inputBase, appearance: 'none' }}>
                      <option value="">Select type…</option>
                      {MEDIA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="cinema-suggest-why" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Why this one? <span style={{ opacity: 0.6 }}>(optional)</span>
                  </label>
                  <textarea id="cinema-suggest-why" value={suggest.why} onChange={(e) => setSuggest((s) => ({ ...s, why: e.target.value }))} placeholder="Why should this be in The Cinema?" rows={3} disabled={suggestStatus === 'loading'} className="cinema-input" style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="cinema-grid-2">
                  <div>
                    <label htmlFor="cinema-suggest-name" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Your Name <span style={{ opacity: 0.6 }}>(optional)</span></label>
                    <input id="cinema-suggest-name" type="text" value={suggest.name} onChange={(e) => setSuggest((s) => ({ ...s, name: e.target.value }))} placeholder="Name" disabled={suggestStatus === 'loading'} className="cinema-input" style={inputBase} />
                  </div>
                  <div>
                    <label htmlFor="cinema-suggest-email" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Your Email <span style={{ opacity: 0.6 }}>(optional)</span></label>
                    <input id="cinema-suggest-email" type="email" value={suggest.email} onChange={(e) => setSuggest((s) => ({ ...s, email: e.target.value }))} placeholder="your@email.com" disabled={suggestStatus === 'loading'} className="cinema-input" style={inputBase} />
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <button type="submit" disabled={suggestStatus === 'loading' || !suggest.title.trim()} className="cinema-btn" style={{ background: (suggestStatus === 'loading' || !suggest.title.trim()) ? 'rgba(252,221,44,0.2)' : C.yellow, color: (suggestStatus === 'loading' || !suggest.title.trim()) ? 'rgba(252,221,44,0.5)' : C.bgDeep, border: `2px solid ${C.yellow}`, fontWeight: 900, fontSize: 13, padding: '10px 22px', cursor: (suggestStatus === 'loading' || !suggest.title.trim()) ? 'default' : 'pointer', letterSpacing: '0.04em', fontFamily: C.sans, textTransform: 'uppercase' }}>
                    {suggestStatus === 'loading' ? 'Sending…' : 'Submit Suggestion'}
                  </button>
                </div>
                {suggestStatus === 'error' && <p role="alert" style={{ color: C.red, fontFamily: C.mono, fontSize: 11, margin: 0, letterSpacing: '0.05em' }}>✗ Something went wrong — please try again.</p>}
              </form>
            )}
          </section>

          {/* Nav links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 14, marginTop: 24 }}>
            <Link href="/library" className="cinema-link" style={{ color: C.yellow, textDecoration: 'none', fontWeight: 700, letterSpacing: '0.03em' }}>The Library →</Link>
            <Link href="/resources" className="cinema-link" style={{ color: C.soft, textDecoration: 'none' }}>Browse Resources →</Link>
            <Link href="/" className="cinema-link" style={{ color: C.soft, textDecoration: 'none' }}>← Back Home</Link>
          </div>
        </div>

        {/* ── Bottom ticker ─────────────────────────────────────── */}
        <div aria-hidden="true" style={{ background: C.bgCh, borderTop: `2px solid ${C.yellow}`, padding: '5px 14px', overflow: 'hidden', display: 'flex' }}>
          <div className="cinema-ticker-bottom" style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: C.mono, fontSize: 11, letterSpacing: '0.1em', color: C.yellow }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} style={{ padding: '0 20px', color: i % 4 === 2 ? C.cyan : C.yellow }}>◆ {item}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cinema-scroll-x { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .cinema-ticker { animation: cinema-scroll-x 34s linear infinite; }
        .cinema-ticker-bottom { animation: cinema-scroll-x 42s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .cinema-ticker, .cinema-ticker-bottom { animation: none; } }
        .cinema-input:focus-visible, .cinema-input:focus { outline: 3px solid ${C.magenta}; outline-offset: 0; border-color: ${C.yellow}; }
        .cinema-btn:focus-visible { outline: 3px solid ${C.magenta}; outline-offset: 2px; }
        .cinema-link:hover, .cinema-link:focus-visible { text-decoration: underline; outline: 3px solid ${C.magenta}; outline-offset: 3px; border-radius: 1px; }
        .cinema-row-link:hover .cinema-row-title, .cinema-row-link:focus-visible .cinema-row-title { text-decoration: underline; }
        .cinema-row-link:focus-visible { outline: 3px solid ${C.magenta}; outline-offset: -2px; }
        .cinema-input::placeholder { color: rgba(200,213,255,0.35); }
        .cinema-input option { background: #062586; color: #ffffff; }
        @media (max-width: 560px) { .cinema-grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>
    </main>
  );
}

// ── Row component ──────────────────────────────────────────────────────────────

function CinemaRow({ item, idx, total }: { item: CinemaItem; idx: number; total: number }) {
  const creator = item.director || item.creator || '';

  return (
    <Link
      href={`/cinema/${item.slug}`}
      className="cinema-row-link"
      style={{
        display: 'block',
        padding: '12px 16px',
        borderBottom: idx < total - 1 ? `1px solid rgba(252,221,44,0.15)` : 'none',
        textDecoration: 'none',
        background: idx % 2 === 0 ? 'rgba(28,31,140,0.5)' : 'rgba(10,59,184,0.3)',
        position: 'relative',
      }}
    >
      {/* Badges + title row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        {item.isEssential && (
          <span aria-label="Essential pick" style={{ background: C.magenta, color: C.white, fontFamily: C.mono, fontWeight: 700, fontSize: 8, padding: '2px 6px', letterSpacing: '0.14em', textTransform: 'uppercase', flex: '0 0 auto', lineHeight: 1.4 }}>★ ESSENTIAL</span>
        )}
        {item.isFree && (
          <span style={{ background: C.green, color: C.bgDeep, fontFamily: C.mono, fontWeight: 700, fontSize: 8, padding: '2px 6px', letterSpacing: '0.14em', textTransform: 'uppercase', flex: '0 0 auto', lineHeight: 1.4 }}>FREE ★</span>
        )}
        {item.hasAD && (
          <span style={{ border: `1px solid rgba(34,229,214,0.5)`, color: C.cyan, fontFamily: C.mono, fontSize: 8, padding: '1px 5px', letterSpacing: '0.1em', flex: '0 0 auto', lineHeight: 1.4 }}>AD</span>
        )}
        {item.hasCaptions && (
          <span style={{ border: `1px solid rgba(34,229,214,0.5)`, color: C.cyan, fontFamily: C.mono, fontSize: 8, padding: '1px 5px', letterSpacing: '0.1em', flex: '0 0 auto', lineHeight: 1.4 }}>CC</span>
        )}
        <span
          className="cinema-row-title"
          style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 15, color: C.white, lineHeight: 1.2, letterSpacing: '-0.01em' }}
        >
          {item.title}
        </span>
        {item.year && <span style={{ fontFamily: C.mono, fontSize: 12, color: C.dim }}>({item.year})</span>}
      </div>

      {/* Creator + platform */}
      <div style={{ marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {creator && (
          <span style={{ fontFamily: C.mono, fontSize: 12, color: C.cyan, letterSpacing: '0.04em' }}>
            {item.director ? 'dir. ' : ''}{creator}
          </span>
        )}
        {item.platform && item.platform.length > 0 && (
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>
            {item.platform.join(' / ')}
          </span>
        )}
        {item.runtimeMinutes && (
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>{item.runtimeMinutes}m</span>
        )}
      </div>
    </Link>
  );
}
