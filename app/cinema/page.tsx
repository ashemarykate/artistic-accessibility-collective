'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { CINEMA_CATEGORIES, CINEMA_ITEMS, type CinemaItem } from '@/lib/cinema-data';
import { supabase } from '@/lib/supabase';
import BrowserChrome from '@/components/BrowserChrome';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Printed TV-guide palette ──────────────────────────────────────────────────
const C = {
  teal:   '#2aacb8',   // page background — slightly muted from original
  navy:   '#0c1e3e',   // section headers
  yellow: '#e8c800',   // free items — warmer, less neon than pure yellow
  white:  '#ffffff',
  cream:  '#f8f8f4',
  black:  '#111111',
  gray:   '#0d0d0d',   // darkened for 4.5:1 contrast on teal background (was #555555)
  lgray:  '#dddddd',
  red:    '#c01a1a',
  border: '#111111',
  sans:   '"Arial Narrow", Arial, "Helvetica Neue", Helvetica, sans-serif',
  mono:   '"Courier New", Courier, monospace',
};

const MEDIA_TYPES = ['Documentary', 'Film', 'Short Film', 'Podcast', 'Series', 'Performance Recording', 'Talk / Lecture', 'Video Essay', 'Other'];

const PER_PAGE = 25;

type SortKey = 'schedule' | 'title' | 'year' | 'runtime';

/** Listing order: ignore a leading article, the way a printed guide files titles. */
function titleSortKey(title: string): string {
  return title.replace(/^(a|an|the)\s+/i, '').toLowerCase();
}

/** Quick filters offered as chips on a channel. AD and CC matter to this audience. */
const QUICK_FILTERS: { id: string; label: string; match: (i: CinemaItem) => boolean }[] = [
  { id: 'free',      label: 'FREE ★',         match: (i) => !!i.isFree },
  { id: 'essential', label: '★ ESSENTIAL',    match: (i) => !!i.isEssential },
  { id: 'voice',     label: 'DISABLED VOICE', match: (i) => i.tags.includes('Disabled Voice') },
  { id: 'ad',        label: 'AD',             match: (i) => !!i.hasAD },
  { id: 'cc',        label: 'CC',             match: (i) => !!i.hasCaptions },
];

// ── Map a resources DB row → CinemaItem ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToCinemaItem(row: any): CinemaItem {
  return {
    slug:           row.slug             ?? row.id,
    title:          row.title            ?? '',
    director:       row.director         ?? undefined,
    creator:        row.creator          ?? undefined,
    year:           row.year             ?? undefined,
    description:    row.description      ?? '',
    url:            row.url              ?? undefined,
    type:           (row.item_type       ?? 'film') as CinemaItem['type'],
    category:       row.category         ?? '',
    tags:           row.tags             ?? [],
    isFree:         row.is_free          ?? false,
    platform:       row.platform_list    ?? undefined,
    howToAccess:    row.how_to_access    ?? undefined,
    isEssential:    row.is_essential     ?? false,
    runtimeMinutes: row.duration_minutes ?? undefined,
    hasAD:          row.has_ad           ?? false,
    hasCaptions:    row.has_captions     ?? false,
  };
}

export default function CinemaPage() {
  const [search,         setSearch        ] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [suggest,        setSuggest       ] = useState({ title: '', type: '', why: '', name: '', email: '' });

  // Browsing state: the guide opens on the channel lineup, then you tune to a channel.
  const [showLineup,   setShowLineup  ] = useState(true);
  const [sortBy,       setSortBy      ] = useState<SortKey>('schedule');
  const [page,         setPage        ] = useState(1);
  const [quickFilters, setQuickFilters] = useState<Set<string>>(new Set());
  const channelHeadingRef = useRef<HTMLHeadingElement>(null);
  const [suggestStatus,  setSuggestStatus ] = useState<FormStatus>('idle');
  const [dbItems,        setDbItems       ] = useState<CinemaItem[]>([]);

  // Favorites state
  const [cinUserId,     setCinUserId    ] = useState<string | null>(null);
  const [cinFavSlugs,   setCinFavSlugs  ] = useState<Set<string>>(new Set());
  const [cinFavCounts,  setCinFavCounts ] = useState<Record<string, number>>({});
  const [cinFavPending, setCinFavPending] = useState<Set<string>>(new Set());


  // Fetch DB-managed cinema items
  useEffect(() => {
    supabase
      .from('resources')
      .select('*')
      .eq('section', 'cinema')
      .eq('status', 'approved')
      .then(({ data }) => {
        if (data?.length) setDbItems(data.map(dbRowToCinemaItem));
      });
  }, []);

  // Load favorites (counts + user's own saved items)
  const loadCinFavs = useCallback(async () => {
    const { data: counts } = await supabase
      .from('content_favorites')
      .select('item_slug')
      .eq('section', 'cinema');
    if (counts) {
      const tally: Record<string, number> = {};
      for (const row of counts) tally[row.item_slug] = (tally[row.item_slug] ?? 0) + 1;
      setCinFavCounts(tally);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCinUserId(user.id);
    const { data: mine } = await supabase
      .from('content_favorites')
      .select('item_slug')
      .eq('user_id', user.id)
      .eq('section', 'cinema');
    if (mine) setCinFavSlugs(new Set(mine.map((r) => r.item_slug)));
  }, []);

  useEffect(() => { queueMicrotask(() => { loadCinFavs(); }); }, [loadCinFavs]);

  const toggleCinFav = useCallback(async (slug: string) => {
    if (!cinUserId || cinFavPending.has(slug)) return;
    setCinFavPending((p) => new Set(p).add(slug));
    const isFaved = cinFavSlugs.has(slug);
    setCinFavSlugs((p) => { const n = new Set(p); isFaved ? n.delete(slug) : n.add(slug); return n; });
    setCinFavCounts((p) => ({ ...p, [slug]: Math.max(0, (p[slug] ?? 0) + (isFaved ? -1 : 1)) }));
    const { error } = isFaved
      ? await supabase.from('content_favorites').delete().eq('user_id', cinUserId).eq('section', 'cinema').eq('item_slug', slug)
      : await supabase.from('content_favorites').insert({ user_id: cinUserId, section: 'cinema', item_slug: slug });
    if (error) {
      // Revert optimistic update if the write failed.
      setCinFavSlugs((p) => { const n = new Set(p); isFaved ? n.add(slug) : n.delete(slug); return n; });
      setCinFavCounts((p) => ({ ...p, [slug]: Math.max(0, (p[slug] ?? 0) + (isFaved ? 1 : -1)) }));
    }
    setCinFavPending((p) => { const n = new Set(p); n.delete(slug); return n; });
  }, [cinUserId, cinFavSlugs, cinFavPending]);

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!suggest.title.trim()) return;
    setSuggestStatus('loading');
    const { error } = await supabase.from('resource_submissions').insert({
      resource_name:   suggest.title.trim(),
      resource_url:    null,
      description:     suggest.why.trim() || null,
      category:        suggest.type || null,
      submitter_name:  suggest.name.trim()  || null,
      submitter_email: suggest.email.trim() || null,
      section:         'cinema',
      special_tags:    [],
    });
    if (error) {
      setSuggestStatus('error');
    } else {
      setSuggestStatus('success');
      setSuggest({ title: '', type: '', why: '', name: '', email: '' });
    }
  }

  // Merge: DB items override static items with the same slug
  const allItems = useMemo<CinemaItem[]>(() => {
    const dbSlugs = new Set(dbItems.map((i) => i.slug));
    return [...CINEMA_ITEMS.filter((i) => !dbSlugs.has(i.slug)), ...dbItems];
  }, [dbItems]);

  // Guide-wide totals, counted from the merged list so admin-added titles are included
  const totals = useMemo(() => ({
    all:       allItems.length,
    free:      allItems.filter((i) => i.isFree).length,
    essential: allItems.filter((i) => i.isEssential).length,
  }), [allItems]);

  // Per-channel counts and the Essential titles shown in each lineup card
  const lineup = useMemo(() => CINEMA_CATEGORIES.map((cat) => {
    const items = allItems.filter((i) => i.category === cat.id);
    const essentials = items.filter((i) => i.isEssential);
    return { cat, count: items.length, picks: (essentials.length ? essentials : items).slice(0, 3) };
  }), [allItems]);

  const filtered = useMemo<CinemaItem[]>(() => {
    const q = search.toLowerCase().trim();
    const active = QUICK_FILTERS.filter((f) => quickFilters.has(f.id));
    return allItems.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (!active.every((f) => f.match(item))) return false;
      if (q) return (
        item.title.toLowerCase().includes(q) ||
        (item.director ?? '').toLowerCase().includes(q) ||
        (item.creator ?? '').toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
      return true;
    });
  }, [search, activeCategory, quickFilters, allItems]);

  // Sort. 'schedule' keeps the curated order the data file is written in.
  const sorted = useMemo<CinemaItem[]>(() => {
    if (sortBy === 'schedule') return filtered;
    const out = [...filtered];
    const byTitle = (a: CinemaItem, b: CinemaItem) => titleSortKey(a.title).localeCompare(titleSortKey(b.title));
    out.sort((a, b) => {
      if (sortBy === 'title') return byTitle(a, b);
      if (sortBy === 'year') {                       // newest first, undated last
        const ay = a.year ?? -Infinity, by = b.year ?? -Infinity;
        return ay === by ? byTitle(a, b) : by - ay;
      }
      const ar = a.runtimeMinutes ?? Infinity;        // shortest first, unknown last
      const br = b.runtimeMinutes ?? Infinity;
      return ar === br ? byTitle(a, b) : ar - br;
    });
    return out;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = useMemo(
    () => sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [sorted, safePage],
  );

  const isFiltering = Boolean(search.trim() || activeCategory || quickFilters.size);
  const activeCat   = activeCategory ? CINEMA_CATEGORIES.find((c) => c.id === activeCategory) ?? null : null;

  /** Tune to a channel (null = full schedule) and move focus to its heading. */
  const tuneTo = useCallback((categoryId: string | null) => {
    setActiveCategory(categoryId);
    setShowLineup(false);
    setPage(1);
    requestAnimationFrame(() => channelHeadingRef.current?.focus());
  }, []);

  const toggleQuickFilter = useCallback((id: string) => {
    setQuickFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setActiveCategory(null);
    setQuickFilters(new Set());
    setPage(1);
  }, []);

  const goToPage = useCallback((n: number) => {
    setPage(n);
    channelHeadingRef.current?.focus();
  }, []);

  return (
    <BrowserChrome
      variant="netscape"
      title="AAC Presents: The Cinema · Netscape Navigator"
      url="http://cinema.artisticaccessibility.com/"
    >
    <main
      style={{
        minHeight: '100%',
        background: C.teal,
        fontFamily: C.sans,
        color: C.black,
        padding: '0 0 48px',
      }}
    >
      <h1 className="sr-only">AAC Presents: The Cinema · Artistic Accessibility Collective</h1>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Top search bar, always available ──────────────────────── */}
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              if (e.target.value.trim()) setShowLineup(false);
            }}
            placeholder="Title, director, keyword…"
            style={{ flex: 1, minWidth: 160, background: C.white, border: `1px solid ${C.lgray}`, color: C.black, fontFamily: C.sans, fontSize: 13, padding: '4px 9px' }}
            className="cinema-ctrl-input"
          />
          <div style={{ fontFamily: C.mono, fontSize: 12, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
            {totals.all} titles · {totals.free} free
          </div>
        </div>

        {showLineup ? (
          /* ── Front door: the channel lineup ───────────────────────── */
          <div>
            {/* Masthead */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'end', marginBottom: 14 }} className="cinema-masthead">
              <div style={{ fontWeight: 900, fontFamily: C.sans, letterSpacing: '-0.01em', lineHeight: 1.0, color: C.black }}>
                <div style={{ fontSize: 13, letterSpacing: '0.14em', fontWeight: 900, marginTop: 4 }}>AAC PRESENTS:</div>
                <div className="cinema-title" style={{ fontSize: 38, lineHeight: 0.92, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 2 }}>THE CINEMA</div>
              </div>
              <div style={{ borderTop: `2px solid ${C.black}`, paddingTop: 8 }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, lineHeight: 1.6 }}>
                  A community-curated schedule of films, documentaries, podcasts, and more, centered on disability representation and accessibility in the arts.
                </p>
                <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: C.gray }}>
                  Ratings and comments aren&apos;t extras. They&apos;re how this community holds the record honest: whether a film treats its subjects with dignity, whether accessibility features are actually good, what it means to see your experience onscreen. Watch. Then weigh in.
                </p>
                <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.5 }}>
                  <strong>★ Free items in yellow &nbsp;·&nbsp; ★ Essential picks</strong>
                  &nbsp;·&nbsp; Click any title to rate, comment, and save.
                  &nbsp;·&nbsp; Something missing? <a href="#suggest-form" style={{ color: C.black, fontWeight: 700 }}>Suggest a title ↓</a>
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12 }}>
                  <Link href="/library" style={{ color: C.black, fontWeight: 700, textDecoration: 'underline' }} className="cinema-nav-link">The Library →</Link>
                  <Link href="/resources" style={{ color: C.black, textDecoration: 'underline' }} className="cinema-nav-link">Resources →</Link>
                  <Link href="/" style={{ color: C.black, textDecoration: 'underline' }} className="cinema-nav-link">← Home</Link>
                </div>
              </div>
            </div>

            {/* Lineup header strip */}
            <div style={{ background: C.navy, color: C.white, padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, borderBottom: `3px solid ${C.black}` }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Channel Lineup · Pick a Channel
              </h2>
              <span style={{ fontFamily: C.mono, fontSize: 11, opacity: 0.75 }}>
                {totals.all} TITLES · {totals.free} FREE · {totals.essential} ESSENTIAL
              </span>
            </div>

            <ul className="cinema-lineup" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {lineup.map(({ cat, count, picks }) => (
                <li key={cat.id} style={{ display: 'flex', minWidth: 0 }}>
                  <button
                    onClick={() => tuneTo(cat.id)}
                    aria-label={`Tune to channel ${cat.channel}, ${cat.title}, ${count} title${count !== 1 ? 's' : ''}`}
                    className="cinema-lineup-card"
                    style={{
                      display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, textAlign: 'left',
                      padding: 0, cursor: 'pointer', background: C.white, border: `2px solid ${C.navy}`,
                      fontFamily: C.sans, color: C.black,
                    }}
                  >
                    {/* Channel header, same navy block as the schedule */}
                    <span style={{ background: C.navy, color: C.white, padding: '6px 10px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box' }}>
                      <span style={{ fontWeight: 900, fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em', opacity: 0.7 }}>{cat.channel}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className="cinema-lineup-title" style={{ display: 'block', fontWeight: 900, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                          {cat.call}: {cat.title.toUpperCase()}
                        </span>
                        <span style={{ display: 'block', fontSize: 10, opacity: 0.65, lineHeight: 1.3, marginTop: 1 }}>{cat.description}</span>
                      </span>
                      <span style={{ fontFamily: C.mono, fontSize: 10, opacity: 0.6, whiteSpace: 'nowrap' }}>{count} TITLE{count !== 1 ? 'S' : ''}</span>
                    </span>

                    {/* Three listings peeking out, styled like schedule cells */}
                    <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
                      {picks.map((p, i) => (
                        <span key={p.slug} style={{ display: 'flex', gap: 5, alignItems: 'baseline', padding: '5px 10px', background: p.isFree ? C.yellow : i % 2 === 0 ? C.white : C.cream, borderBottom: `1px solid ${C.lgray}`, minWidth: 0 }}>
                          {p.isEssential && <span style={{ fontWeight: 900, fontSize: 11, color: p.isFree ? C.black : C.navy, flex: '0 0 auto' }}>★</span>}
                          <span style={{ fontWeight: 900, fontSize: 12, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{p.title}</span>
                          {p.year && <span style={{ fontSize: 10, opacity: 0.7, flex: '0 0 auto' }}>({p.year})</span>}
                        </span>
                      ))}
                      <span style={{ padding: '6px 10px', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: C.navy, background: C.white }}>
                        ▶ TUNE IN
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => tuneTo(null)}
              className="cinema-ctrl-btn"
              style={{ width: '100%', marginTop: 10, padding: '11px 16px', background: C.navy, color: C.white, border: `2px solid ${C.black}`, fontFamily: C.sans, fontWeight: 900, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              View Full Schedule · All {totals.all} Titles
            </button>
          </div>
        ) : (
          /* ── Tuned to a channel: sorted, filtered, paged ───────────── */
          <div>
            {/* Back + change channel */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginBottom: 10 }} role="group" aria-label="Change channel">
              <button
                onClick={() => { setShowLineup(true); setActiveCategory(null); setSearch(''); setQuickFilters(new Set()); setPage(1); }}
                className="cinema-ctrl-btn"
                style={{ background: C.white, border: `2px solid ${C.black}`, color: C.black, fontFamily: C.sans, fontWeight: 900, fontSize: 11, padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.08em', marginRight: 6 }}
              >
                ◀ CHANNEL LINEUP
              </button>
              {[{ id: null as string | null, channel: 'ALL' }, ...CINEMA_CATEGORIES.map((c) => ({ id: c.id as string | null, channel: c.channel }))].map((opt) => {
                const active = opt.id === activeCategory;
                return (
                  <button
                    key={opt.id ?? 'all'}
                    onClick={() => tuneTo(opt.id)}
                    aria-pressed={active}
                    aria-label={opt.id === null ? 'All channels' : `Channel ${opt.channel}`}
                    className="cinema-cat-btn"
                    style={{ background: active ? C.navy : C.white, color: active ? C.white : C.black, border: `2px solid ${C.navy}`, fontFamily: C.sans, fontWeight: 900, fontSize: 12, padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.08em', minWidth: 40 }}
                  >
                    {opt.channel}
                  </button>
                );
              })}
            </div>

            {/* Channel header */}
            <div style={{ background: C.navy, color: C.white, padding: '6px 10px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em', opacity: 0.7 }}>
                {activeCat ? activeCat.channel : 'ALL'}
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 ref={channelHeadingRef} tabIndex={-1} style={{ margin: 0, fontWeight: 900, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', outline: 'none' }}>
                  {activeCat ? `${activeCat.call}: ${activeCat.title.toUpperCase()}` : 'FULL SCHEDULE: ALL CHANNELS'}
                </h2>
                <div style={{ fontSize: 10, opacity: 0.65, lineHeight: 1.3, marginTop: 1 }}>
                  {activeCat ? activeCat.description : 'Every title in the guide, in one listing.'}
                </div>
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 10, opacity: 0.6, whiteSpace: 'nowrap' }}>
                {sorted.length} TITLE{sorted.length !== 1 ? 'S' : ''}
              </div>
            </div>

            {/* Sort + quick filters */}
            <div style={{ background: C.cream, border: `2px solid ${C.navy}`, borderTop: 'none', padding: '8px 10px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label htmlFor="cinema-sort" style={{ fontWeight: 900, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sort by:</label>
                <select
                  id="cinema-sort"
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as SortKey); setPage(1); }}
                  className="cinema-ctrl-input"
                  style={{ background: C.white, border: `1px solid ${C.black}`, color: C.black, fontFamily: C.sans, fontWeight: 700, fontSize: 12, padding: '4px 8px', minHeight: 32 }}
                >
                  <option value="schedule">Schedule order</option>
                  <option value="title">Title</option>
                  <option value="year">Year (newest)</option>
                  <option value="runtime">Runtime (shortest)</option>
                </select>
              </span>

              <span aria-hidden="true" style={{ color: C.gray }}>│</span>

              <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {QUICK_FILTERS.map((f) => {
                  const on = quickFilters.has(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleQuickFilter(f.id)}
                      aria-pressed={on}
                      className="cinema-cat-btn cinema-chip"
                      style={{ background: on ? C.navy : C.white, color: on ? C.white : C.black, border: `2px solid ${C.navy}`, fontFamily: C.sans, fontWeight: 900, fontSize: 11, padding: '3px 9px', cursor: 'pointer', letterSpacing: '0.06em', minHeight: 32 }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </span>

              {isFiltering && (
                <button
                  onClick={clearFilters}
                  className="cinema-ctrl-btn"
                  style={{ background: C.teal, border: `1px solid ${C.black}`, color: C.black, fontFamily: C.sans, fontWeight: 700, fontSize: 11, padding: '3px 10px', cursor: 'pointer', letterSpacing: '0.06em', minHeight: 32 }}
                >
                  CLEAR ✕
                </button>
              )}
            </div>

            {/* Result line */}
            <div
              aria-live="polite"
              aria-atomic="true"
              style={{ background: C.white, border: `2px solid ${C.navy}`, borderTop: `1px solid ${C.lgray}`, borderBottom: 'none', padding: '5px 10px', fontFamily: C.mono, fontSize: 11, color: C.gray }}
            >
              {sorted.length === 0
                ? 'NO LISTINGS'
                : `SHOWING ${(safePage - 1) * PER_PAGE + 1}-${Math.min(safePage * PER_PAGE, sorted.length)} OF ${sorted.length}${totalPages > 1 ? ` · PAGE ${safePage} OF ${totalPages}` : ''}`}
            </div>

            {/* Listings */}
            <div style={{ border: `2px solid ${C.navy}`, borderTop: 'none' }}>
              {sorted.length === 0 ? (
                <div style={{ padding: '10px 10px', fontSize: 12, color: C.gray, fontStyle: 'italic', background: C.white }}>
                  No titles match current filters.
                </div>
              ) : (
                pageItems.map((item, idx) => (
                  <ScheduleCell
                    key={item.slug}
                    item={item}
                    idx={idx}
                    total={pageItems.length}
                    isFaved={cinFavSlugs.has(item.slug)}
                    favCount={cinFavCounts[item.slug] ?? 0}
                    userId={cinUserId}
                    onToggle={toggleCinFav}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Schedule pages" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="cinema-ctrl-btn"
                  style={{ background: safePage <= 1 ? C.lgray : C.white, border: `2px solid ${C.navy}`, color: safePage <= 1 ? C.gray : C.black, fontFamily: C.sans, fontWeight: 900, fontSize: 12, padding: '8px 14px', cursor: safePage <= 1 ? 'default' : 'pointer', letterSpacing: '0.08em', minHeight: 40 }}
                >
                  ◀ PREV
                </button>
                <span style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700 }}>PAGE {safePage} OF {totalPages}</span>
                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="cinema-ctrl-btn"
                  style={{ background: safePage >= totalPages ? C.lgray : C.white, border: `2px solid ${C.navy}`, color: safePage >= totalPages ? C.gray : C.black, fontFamily: C.sans, fontWeight: 900, fontSize: 12, padding: '8px 14px', cursor: safePage >= totalPages ? 'default' : 'pointer', letterSpacing: '0.08em', minHeight: 40 }}
                >
                  NEXT ▶
                </button>
              </nav>
            )}
          </div>
        )}

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
                Documentary · Film · Podcast · Short · Performance · Talk · anything that belongs here
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 18px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.65, color: C.gray }}>
              This schedule is built by the community. What should anyone interested in disability arts watch? Free-access preferred but not required. Include the platform if you know it.
            </p>

            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ padding: '12px 16px', background: '#e8fae8', border: `1px solid #2a7a2a`, color: '#1a5a1a', fontSize: 14 }}>
                ✓ Suggestion received. Thank you! We&apos;ll review it for the next update.
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
                    Something went wrong. Please try again or email us directly.
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
        .cinema-heart-btn:focus-visible { outline: 3px solid #0c1e3e; outline-offset: 2px; }
        .cinema-heart-btn:not(:disabled):hover { color: ${C.red} !important; }
        .cinema-lineup-card:hover, .cinema-lineup-card:focus-visible { outline: 3px solid #0c1e3e; outline-offset: 2px; }
        .cinema-lineup-card:hover .cinema-lineup-title { text-decoration: underline; }
        .cinema-chip:focus-visible { outline: 3px solid #0c1e3e; outline-offset: 2px; }
        @media (max-width: 680px) {
          .cinema-lineup { grid-template-columns: 1fr !important; }
          .cinema-masthead { grid-template-columns: 1fr !important; }
          .cinema-form-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          /* Shrink the big title gracefully */
          .cinema-title { font-size: 28px !important; line-height: 1 !important; letter-spacing: -0.01em !important; }
          /* Bigger tap targets on nav links and controls */
          .cinema-nav-link { display: block !important; padding: 8px 0 !important; font-size: 14px !important; min-height: 44px !important; line-height: 44px !important; }
          .cinema-ctrl-input { min-height: 44px !important; font-size: 16px !important; padding: 10px !important; }
          .cinema-ctrl-btn { min-height: 44px !important; padding: 10px 16px !important; font-size: 14px !important; }
        }
      `}</style>
    </main>
    </BrowserChrome>
  );
}

// ── Individual cell ───────────────────────────────────────────────────────────

function ScheduleCell({
  item, idx, total, isFaved, favCount, userId, onToggle,
}: {
  item: CinemaItem; idx: number; total: number;
  isFaved: boolean; favCount: number; userId: string | null;
  onToggle: (slug: string) => void;
}) {
  const creator = item.director || item.creator || '';
  const isEven = idx % 2 === 0;
  const cellBg = item.isFree ? C.yellow : isEven ? C.white : C.cream;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: idx < total - 1 ? `1px solid ${C.lgray}` : 'none',
        background: cellBg,
        color: C.black,
      }}
    >
      {/* Main clickable area */}
      <Link
        href={`/cinema/${item.slug}`}
        className="cinema-item-link"
        style={{ flex: 1, display: 'block', padding: '7px 10px', textDecoration: 'none', color: C.black, position: 'relative' }}
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
              <span aria-label="Free to stream" style={{ fontWeight: 900, fontSize: 11, letterSpacing: '0.1em', background: C.black, color: C.yellow, padding: '1px 5px' }}>FREE★</span>
            )}
            {item.hasAD && (
              <span aria-label="Audio description available" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', border: `1px solid ${C.black}`, padding: '0 4px' }}>AD</span>
            )}
            {item.hasCaptions && (
              <span aria-label="Captions available" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', border: `1px solid ${C.black}`, padding: '0 4px' }}>CC</span>
            )}
          </div>
        </div>

        {/* Bottom row: creator + platform */}
        <div style={{ marginTop: 3, fontSize: 12, color: item.isFree ? '#333' : C.gray, lineHeight: 1.3 }}>
          {creator && <span>{item.director ? 'dir. ' : ''}{creator}</span>}
          {creator && item.platform && item.platform.length > 0 && <span> · </span>}
          {item.platform && item.platform.length > 0 && (
            <span>{item.platform.join(' / ')}</span>
          )}
          {item.runtimeMinutes && <span> · {item.runtimeMinutes}m</span>}
        </div>
      </Link>

      {/* Heart / save button */}
      <button
        onClick={() => onToggle(item.slug)}
        disabled={!userId}
        aria-label={isFaved ? `Remove "${item.title}" from My Cinema` : `Save "${item.title}" to My Cinema${favCount > 0 ? ` (${favCount} saved)` : ''}`}
        aria-pressed={userId ? isFaved : undefined}
        title={userId ? (isFaved ? 'Remove from My Cinema' : 'Save to My Cinema') : 'Log in to save'}
        className="cinema-heart-btn"
        style={{
          background: 'none', border: 'none', padding: '0 10px',
          color: isFaved ? C.red : C.lgray,
          cursor: userId ? 'pointer' : 'default',
          fontSize: '14px', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
          minWidth: 30,
        }}
      >
        <span aria-hidden="true">{isFaved ? '♥' : '♡'}</span>
        {favCount > 0 && <span style={{ fontSize: '9px', lineHeight: 1, color: C.gray }}>{favCount}</span>}
      </button>
    </div>
  );
}
