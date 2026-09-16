'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { LIBRARY_CATEGORIES, LIBRARY_ITEMS, LIBRARY_CATEGORY_BY_ID, type LibraryItem } from '@/lib/library-data';
import { supabase } from '@/lib/supabase';
import BrowserChrome from '@/components/BrowserChrome';

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

const PER_PAGE = 25;

type SortKey = 'shelf' | 'title' | 'author' | 'year';

/** Library filing order: ignore a leading article, the way a card catalog does. */
function titleSortKey(title: string): string {
  return title.replace(/^(a|an|the)\s+/i, '').toLowerCase();
}

/**
 * File by the first author's surname. Handles the shapes used in the catalog:
 * "Name, illustrated by X", "A & B", "Name (ed.)", "Dr. Name".
 */
function authorSortKey(author: string): string {
  let s = author.split(',')[0];                 // drop ", illustrated by ..." / ", translated by ..."
  s = s.split('&')[0];                          // file under the first author
  s = s.split(/\swith\s/i)[0];                  // "Judith Heumann with Kristen Joiner" files under Heumann
  s = s.replace(/\([^)]*\)/g, '');              // drop "(ed.)", "(curator)"
  s = s.replace(/^\s*(dr|mr|mrs|ms|prof)\.?\s+/i, '');
  s = s.trim();
  const parts = s.split(/\s+/).filter(Boolean);
  // A generational suffix is not a surname: "Leroy F. Moore Jr." files under Moore.
  while (parts.length > 1 && /^(jr|sr|i{1,3}|iv|v)\.?$/i.test(parts[parts.length - 1])) parts.pop();
  const surname = parts.length ? parts[parts.length - 1] : s;
  return `${surname} ${s}`.toLowerCase();
}

/** The quick filters offered as chips above a shelf. */
const QUICK_FILTERS: { id: string; label: string; match: (i: LibraryItem) => boolean }[] = [
  { id: 'free',      label: 'FREE',           match: (i) => !!i.isFree },
  { id: 'essential', label: '★ ESSENTIAL',    match: (i) => !!i.isEssential },
  { id: 'voice',     label: 'DISABLED VOICE', match: (i) => i.tags.includes('Disabled Voice') },
  { id: 'young',     label: 'YOUNG READERS',  match: (i) => i.tags.includes('Young Readers') || i.tags.includes('Young Adult') },
];

// ── Map a resources DB row → LibraryItem ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToLibraryItem(row: any): LibraryItem {
  return {
    slug:         row.slug          ?? row.id,
    title:        row.title         ?? '',
    author:       row.author        ?? '',
    year:         row.year          ?? undefined,
    description:  row.description   ?? '',
    url:          row.url           ?? undefined,
    type:         (row.item_type    ?? 'book') as LibraryItem['type'],
    category:     row.category      ?? '',
    tags:         row.tags          ?? [],
    isFree:       row.is_free       ?? false,
    format:       row.format_list   ?? undefined,
    howToAccess:  row.how_to_access ?? undefined,
    isEssential:  row.is_essential  ?? false,
  };
}

export default function LibraryPage() {
  const [suggest, setSuggest] = useState({ title: '', author: '', why: '', name: '', email: '' });
  const [suggestStatus, setSuggestStatus] = useState<FormStatus>('idle');
  const [clock, setClock] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dbItems, setDbItems] = useState<LibraryItem[]>([]);

  // Browsing state: the catalog opens on the drawer view, then you step into a shelf.
  const [showDrawers, setShowDrawers] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('shelf');
  const [page, setPage] = useState(1);
  const [quickFilters, setQuickFilters] = useState<Set<string>>(new Set());
  const shelfHeadingRef = useRef<HTMLHeadingElement>(null);

  // Favorites state
  const [libUserId,     setLibUserId    ] = useState<string | null>(null);
  const [libFavSlugs,   setLibFavSlugs  ] = useState<Set<string>>(new Set());
  const [libFavCounts,  setLibFavCounts ] = useState<Record<string, number>>({});
  const [libFavPending, setLibFavPending] = useState<Set<string>>(new Set());


  // Fetch any DB-managed library items and merge with static data
  useEffect(() => {
    supabase
      .from('resources')
      .select('*')
      .eq('section', 'library')
      .eq('status', 'approved')
      .then(({ data }) => {
        if (data?.length) setDbItems(data.map(dbRowToLibraryItem));
      });
  }, []);

  // Load favorites (counts + user's own saved items)
  const loadLibFavs = useCallback(async () => {
    const { data: counts } = await supabase
      .from('content_favorites')
      .select('item_slug')
      .eq('section', 'library');
    if (counts) {
      const tally: Record<string, number> = {};
      for (const row of counts) tally[row.item_slug] = (tally[row.item_slug] ?? 0) + 1;
      setLibFavCounts(tally);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLibUserId(user.id);
    const { data: mine } = await supabase
      .from('content_favorites')
      .select('item_slug')
      .eq('user_id', user.id)
      .eq('section', 'library');
    if (mine) setLibFavSlugs(new Set(mine.map((r) => r.item_slug)));
  }, []);

  useEffect(() => { queueMicrotask(() => { loadLibFavs(); }); }, [loadLibFavs]);

  const toggleLibFav = useCallback(async (slug: string) => {
    if (!libUserId || libFavPending.has(slug)) return;
    setLibFavPending((p) => new Set(p).add(slug));
    const isFaved = libFavSlugs.has(slug);
    setLibFavSlugs((p) => { const n = new Set(p); isFaved ? n.delete(slug) : n.add(slug); return n; });
    setLibFavCounts((p) => ({ ...p, [slug]: Math.max(0, (p[slug] ?? 0) + (isFaved ? -1 : 1)) }));
    const { error } = isFaved
      ? await supabase.from('content_favorites').delete().eq('user_id', libUserId).eq('section', 'library').eq('item_slug', slug)
      : await supabase.from('content_favorites').insert({ user_id: libUserId, section: 'library', item_slug: slug });
    if (error) {
      // Revert the optimistic update since the save didn't actually persist
      setLibFavSlugs((p) => { const n = new Set(p); isFaved ? n.add(slug) : n.delete(slug); return n; });
      setLibFavCounts((p) => ({ ...p, [slug]: Math.max(0, (p[slug] ?? 0) + (isFaved ? 1 : -1)) }));
    }
    setLibFavPending((p) => { const n = new Set(p); n.delete(slug); return n; });
  }, [libUserId, libFavSlugs, libFavPending]);

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
    const { error } = await supabase.from('resource_submissions').insert({
      resource_name:   suggest.title.trim(),
      resource_url:    null,
      description:     suggest.why.trim() || null,
      submitter_name:  suggest.name.trim()  || null,
      submitter_email: suggest.email.trim() || null,
      submitter_notes: suggest.author.trim(), // author stored here
      section:         'library',
      special_tags:    [],
    });
    if (error) {
      setSuggestStatus('error');
    } else {
      setSuggestStatus('success');
      setSuggest({ title: '', author: '', why: '', name: '', email: '' });
    }
  }

  // Merge: DB items override static items with the same slug
  const allItems = useMemo<LibraryItem[]>(() => {
    const dbSlugs = new Set(dbItems.map((i) => i.slug));
    return [...LIBRARY_ITEMS.filter((i) => !dbSlugs.has(i.slug)), ...dbItems];
  }, [dbItems]);

  // Catalog-wide totals, counted from the merged list so admin-added items are included
  const totals = useMemo(() => ({
    all:       allItems.length,
    free:      allItems.filter((i) => i.isFree).length,
    essential: allItems.filter((i) => i.isEssential).length,
  }), [allItems]);

  // Per-subject counts and the Essential titles shown on each drawer
  const drawers = useMemo(() => LIBRARY_CATEGORIES.map((cat) => {
    const items = allItems.filter((i) => i.category === cat.id);
    const essentials = items.filter((i) => i.isEssential);
    return { cat, count: items.length, picks: (essentials.length ? essentials : items).slice(0, 3) };
  }), [allItems]);

  // Filter items
  const filtered = useMemo<LibraryItem[]>(() => {
    const q = search.toLowerCase().trim();
    const active = QUICK_FILTERS.filter((f) => quickFilters.has(f.id));
    return allItems.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (!active.every((f) => f.match(item))) return false;
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
  }, [search, activeCategory, quickFilters, allItems]);

  // Sort. 'shelf' keeps the curated order the catalog file is written in.
  const sorted = useMemo<LibraryItem[]>(() => {
    if (sortBy === 'shelf') return filtered;
    const out = [...filtered];
    out.sort((a, b) => {
      if (sortBy === 'title')  return titleSortKey(a.title).localeCompare(titleSortKey(b.title));
      if (sortBy === 'author') return authorSortKey(a.author).localeCompare(authorSortKey(b.author));
      // year: newest first, undated titles last
      const ay = a.year ?? -Infinity;
      const by = b.year ?? -Infinity;
      if (ay === by) return titleSortKey(a.title).localeCompare(titleSortKey(b.title));
      return by - ay;
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

  /** Step into a shelf and move focus to its heading. */
  const openShelf = useCallback((categoryId: string | null) => {
    setActiveCategory(categoryId);
    setShowDrawers(false);
    setPage(1);
    requestAnimationFrame(() => shelfHeadingRef.current?.focus());
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

  /** Clear search and filters without leaving the shelf. */
  const clearFilters = useCallback(() => {
    setSearch('');
    setActiveCategory(null);
    setQuickFilters(new Set());
    setPage(1);
  }, []);

  const activeCat = activeCategory ? LIBRARY_CATEGORY_BY_ID[activeCategory] : null;

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
    <BrowserChrome
      variant="mosaic"
      title="The Library · Artistic Accessibility Collective · NCSA Mosaic"
      url="http://library.artisticaccessibility.com/"
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
      <h1 className="sr-only">The Library - Artistic Accessibility Collective</h1>

      {/* CRT scanline overlay - hidden for high-contrast / reduced-motion users */}
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
          <span style={{ textAlign: 'center', color: C.dim }}>THE LIBRARY</span>
          <span className="lib-clock-cell" style={{ textAlign: 'right', color: C.dim }}>{clock}</span>
        </div>

        {/* Masthead */}
        <div className="lib-masthead" style={{ padding: '16px 20px', border: `1px solid ${C.amber}`, background: `repeating-linear-gradient(135deg, rgba(255,176,0,0.04) 0 6px, transparent 6px 12px), ${C.bg2}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start', marginBottom: 14 }}>
          <div>
            <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ display: 'inline-block', textDecoration: 'none', color: C.amber, fontFamily: C.mono, fontSize: 12, letterSpacing: '0.16em', fontWeight: 900 }}>
              ▶ AAC PRESENTS:
            </Link>
            <div className="lib-title" style={{ fontSize: 36, fontWeight: 400, letterSpacing: '0.04em', margin: '6px 0 0', color: C.hi, textShadow: `0 0 4px rgba(255,209,102,0.4)` }}>
              THE LIBRARY
            </div>
            <div style={{ fontSize: 13, letterSpacing: '0.06em', color: C.amber }}>DISABILITY · ACCESSIBILITY · ARTS</div>
          </div>

          <div className="lib-stats" style={{ fontSize: 12, lineHeight: 1.9, textAlign: 'right', color: C.dim }}>
            <div><span style={{ color: C.amber }}>HOLDINGS.......:</span> {totals.all} ITEMS</div>
            <div><span style={{ color: C.amber }}>FREE ACCESS....:</span> {totals.free} ITEMS</div>
            <div><span style={{ color: C.amber }}>SUBJECTS.......:  </span>{LIBRARY_CATEGORIES.length} AREAS</div>
            <div><span style={{ color: C.amber }}>STATUS.........:  </span><span style={{ color: C.green }}>OPEN</span></div>
          </div>
        </div>

        {/* Community framing banner, shown at the front door only */}
        {showDrawers && (
          <div style={{ padding: '14px 20px', background: C.bg, color: C.hi, border: `2px solid ${C.green}`, textShadow: `0 0 4px rgba(255,209,102,0.25)`, fontFamily: C.mono, fontSize: 14, letterSpacing: '0.03em', marginBottom: 14, lineHeight: 1.6 }}>
            <strong style={{ color: C.hi }}>★ Community-built reading list.</strong> This catalog is curated by and for anyone who wants to understand disability arts and accessibility better - whether you work in the field, are part of the disability community, or are simply curious and want to learn. Centering disabled voices, disability justice frameworks, and the people doing this work. Items marked FREE link directly to legal, freely accessible versions. All suggestions welcome: see the form below.
          </div>
        )}

        {/* Search, always available as the fast path into the catalog */}
        <div style={{ padding: '14px 18px', border: `1px solid ${C.amber}`, background: C.bg2, marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="lib-search" style={labelSty}>SEARCH.........:</label>
            <input
              id="lib-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
                if (e.target.value.trim()) setShowDrawers(false);
              }}
              placeholder="Title, author, or keyword…"
              style={inputSty}
              className="opac-input"
            />
          </div>
          <a
            href="#lib-suggest-form"
            style={{ background: C.amber, color: C.bg, border: `1px solid ${C.amber}`, fontFamily: C.mono, fontWeight: 700, fontSize: 12, padding: '6px 13px', textDecoration: 'none', letterSpacing: '0.08em', whiteSpace: 'nowrap', textShadow: 'none', display: 'inline-block' }}
            className="opac-btn"
          >
            + SUGGEST A TITLE
          </a>
        </div>

        {/* ── Front door: the card catalog drawers ─────────────────────────── */}
        {showDrawers ? (
          <div id="lib-catalog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, padding: '8px 14px', background: C.bg2, border: `1px solid ${C.amber}`, marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontFamily: C.mono, fontWeight: 400, fontSize: 13, letterSpacing: '0.1em', color: C.hi }}>
                ── CARD CATALOG · CHOOSE A SUBJECT ──
              </h2>
              <span style={{ color: C.dim, fontSize: 12 }}>{totals.all} ITEMS · {totals.free} FREE · {totals.essential} ESSENTIAL</span>
            </div>

            <ul className="lib-drawers" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {drawers.map(({ cat, count, picks }) => (
                <li key={cat.id} style={{ display: 'flex', minWidth: 0 }}>
                  <button
                    onClick={() => openShelf(cat.id)}
                    aria-label={`Open ${cat.title}, ${count} item${count !== 1 ? 's' : ''}`}
                    className="lib-drawer"
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 8, width: '100%', minWidth: 0, textAlign: 'left',
                      padding: '12px 14px', cursor: 'pointer',
                      background: `repeating-linear-gradient(135deg, rgba(255,176,0,0.04) 0 6px, transparent 6px 12px), ${C.bg2}`,
                      border: `1px solid ${C.amber}`, color: C.amber, fontFamily: C.mono,
                    }}
                  >
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ color: C.dim, fontSize: 11, letterSpacing: '0.12em' }}>{cat.code}</span>
                      <span style={{ color: C.hi, fontSize: 11, letterSpacing: '0.06em' }}>{count} ITEMS</span>
                    </span>

                    <span className="lib-drawer-title" style={{ color: C.hi, fontSize: 14, fontWeight: 700, lineHeight: 1.3, textShadow: `0 0 4px rgba(255,209,102,0.3)` }}>
                      {cat.title.toUpperCase()}
                    </span>

                    {/* A few cards peeking out of the drawer */}
                    <span aria-hidden="true" style={{ borderTop: `1px solid rgba(255,176,0,0.25)`, paddingTop: 7, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      {picks.map((p) => (
                        <span key={p.slug} style={{ fontSize: 11, color: C.amber, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.isEssential ? '★ ' : '· '}{p.title}
                        </span>
                      ))}
                    </span>

                    <span aria-hidden="true" style={{ marginTop: 'auto', paddingTop: 4, fontSize: 11, letterSpacing: '0.1em', color: C.green }}>
                      ▶ OPEN DRAWER
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => openShelf(null)}
              style={{ width: '100%', marginTop: 12, padding: '12px 16px', background: C.amber, color: C.bg, border: `1px solid ${C.amber}`, fontFamily: C.mono, fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer', textShadow: 'none' }}
              className="opac-btn"
            >
              {'< '}SEE FULL LIBRARY · ALL {totals.all} ITEMS{' >'}
            </button>
          </div>
        ) : (
          /* ── A shelf: sorted, filtered, paged ──────────────────────────────── */
          <div id="lib-catalog">
            {/* Back to the drawers */}
            <button
              onClick={() => { setShowDrawers(true); setActiveCategory(null); setSearch(''); setQuickFilters(new Set()); }}
              style={{ background: 'none', border: `1px solid ${C.dim}`, color: C.amber, fontFamily: C.mono, fontSize: 12, padding: '7px 13px', cursor: 'pointer', letterSpacing: '0.08em', marginBottom: 12 }}
              className="opac-btn"
            >
              ◀ BACK TO CARD CATALOG
            </button>

            {/* Shelf header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, padding: '8px 14px', background: C.bg2, border: `1px solid ${C.amber}`, borderBottom: 'none' }}>
              <h2
                ref={shelfHeadingRef}
                tabIndex={-1}
                style={{ margin: 0, fontFamily: C.mono, fontWeight: 400, fontSize: 13, letterSpacing: '0.1em', color: C.hi, outline: 'none' }}
              >
                {activeCat
                  ? <><span style={{ color: C.dim, marginRight: 8 }}>{activeCat.code}</span>{activeCat.title.toUpperCase()}</>
                  : 'ALL SUBJECTS'}
              </h2>
              <span style={{ color: C.dim, fontSize: 13 }}>{sorted.length} ITEM{sorted.length !== 1 ? 'S' : ''}</span>
            </div>

            {/* Sort + quick filters */}
            <div style={{ border: `1px solid ${C.amber}`, borderBottom: 'none', background: C.bg2, padding: '10px 14px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <label htmlFor="lib-sort" style={{ color: C.amber, fontFamily: C.mono, fontSize: 12, letterSpacing: '0.06em' }}>SORT BY:</label>
                <select
                  id="lib-sort"
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as SortKey); setPage(1); }}
                  className="opac-input"
                  style={{ background: C.bg, border: `1px solid ${C.amber}`, color: C.hi, fontFamily: C.mono, fontSize: 12, padding: '5px 8px', minHeight: 32 }}
                >
                  <option value="shelf">SHELF ORDER</option>
                  <option value="title">TITLE</option>
                  <option value="author">AUTHOR</option>
                  <option value="year">YEAR (NEWEST)</option>
                </select>
              </span>

              <span aria-hidden="true" style={{ color: C.dim }}>│</span>

              <span style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {QUICK_FILTERS.map((f) => {
                  const on = quickFilters.has(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleQuickFilter(f.id)}
                      aria-pressed={on}
                      className="opac-btn lib-chip"
                      style={{
                        background: on ? C.amber : 'none', color: on ? C.bg : C.amber,
                        border: `1px solid ${on ? C.amber : C.dim}`, fontFamily: C.mono, fontSize: 11,
                        padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.06em',
                        textShadow: 'none', minHeight: 32,
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </span>

              {isFiltering && (
                <button
                  onClick={clearFilters}
                  style={{ background: 'none', border: `1px solid ${C.dim}`, color: C.dim, fontFamily: C.mono, fontSize: 11, padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.06em', minHeight: 32 }}
                  className="opac-btn"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Result line */}
            <div
              aria-live="polite"
              aria-atomic="true"
              style={{ padding: '7px 14px', background: C.bg, border: `1px solid ${C.amber}`, borderBottom: sorted.length ? 'none' : `1px solid ${C.amber}`, fontSize: 12, color: C.dim, letterSpacing: '0.06em' }}
            >
              {sorted.length === 0
                ? 'NO RESULTS'
                : `SHOWING ${(safePage - 1) * PER_PAGE + 1}-${Math.min(safePage * PER_PAGE, sorted.length)} OF ${sorted.length}${totalPages > 1 ? ` · PAGE ${safePage} OF ${totalPages}` : ''}`}
            </div>

            {sorted.length === 0 ? (
              <div style={{ padding: '24px 20px', border: `1px solid ${C.dim}`, borderTop: 'none', background: C.bg2, color: C.dim, fontSize: 14 }}>
                ▶ No items match your search. Try clearing a filter or broadening your keywords.
              </div>
            ) : (
              <div style={{ border: `1px solid ${C.amber}`, background: C.bg2 }}>
                {pageItems.map((item, idx) => (
                  <LibraryRow
                    key={item.slug}
                    item={item}
                    idx={idx}
                    total={pageItems.length}
                    isFaved={libFavSlugs.has(item.slug)}
                    favCount={libFavCounts[item.slug] ?? 0}
                    userId={libUserId}
                    onToggle={toggleLibFav}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Catalog pages" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <button
                  onClick={() => { setPage(safePage - 1); shelfHeadingRef.current?.focus(); }}
                  disabled={safePage <= 1}
                  className="opac-btn"
                  style={{ background: 'none', border: `1px solid ${safePage <= 1 ? C.dim : C.amber}`, color: safePage <= 1 ? C.dim : C.amber, fontFamily: C.mono, fontSize: 12, padding: '8px 14px', cursor: safePage <= 1 ? 'default' : 'pointer', letterSpacing: '0.08em', minHeight: 40 }}
                >
                  ◀ PREV
                </button>
                <span style={{ color: C.dim, fontSize: 12, letterSpacing: '0.08em' }}>PAGE {safePage} OF {totalPages}</span>
                <button
                  onClick={() => { setPage(safePage + 1); shelfHeadingRef.current?.focus(); }}
                  disabled={safePage >= totalPages}
                  className="opac-btn"
                  style={{ background: 'none', border: `1px solid ${safePage >= totalPages ? C.dim : C.amber}`, color: safePage >= totalPages ? C.dim : C.amber, fontFamily: C.mono, fontSize: 12, padding: '8px 14px', cursor: safePage >= totalPages ? 'default' : 'pointer', letterSpacing: '0.08em', minHeight: 40 }}
                >
                  NEXT ▶
                </button>
              </nav>
            )}
          </div>
        )}

        {/* How to submit a suggestion */}
        <div style={{ padding: '20px', border: `1px solid ${C.amber}`, background: C.bg2, marginTop: 14, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: 16, padding: '0 8px', background: C.bg2, color: C.hi, fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em' }} aria-hidden="true">── HOW TO SUBMIT ──</div>
          <section aria-label="How the catalog is built and how to submit" style={{ marginTop: 6 }}>
            <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.75, color: C.hi }}>
              This catalog is built and maintained by the AAC community. Every person who reads something essential and shares it makes this resource better for everyone.
            </p>
            <p style={{ margin: '0 0 0', fontSize: 13, lineHeight: 1.75, color: C.amber }}>
              To suggest a book, essay, or resource: use the form below. Include the author, and a brief note on why this belongs in the catalog. Suggestions are reviewed and added by the AAC team. You may submit anything (books, essays, toolkits, syllabi, open-access journals, free PDFs). The only requirement is that it centers disability and is worth someone&apos;s time.
            </p>
          </section>
        </div>

        {/* Suggest a book */}
        <div id="lib-suggest-form" style={{ padding: '20px', border: `1px solid ${C.amber}`, background: C.bg2, marginTop: 14, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: 16, padding: '0 8px', background: C.bg2, color: C.hi, fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em' }} aria-hidden="true">── SUGGEST A BOOK OR RESOURCE ──</div>
          <section aria-label="Suggest a book for The Library" style={{ marginTop: 6 }}>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: C.dim, letterSpacing: '0.04em' }}>
              What should everyone interested in disability arts be reading?
            </p>
            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ color: C.green, fontSize: 14, padding: '4px 0' }}>
                <span aria-hidden="true">▶ </span>SUBMISSION RECEIVED. Thank you; we&apos;ll add it to the catalog queue.
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
        <div className="lib-fkeys" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${C.amber}`, marginTop: 14 }} aria-label="Navigation">
          {[['F1', 'Resources', '/resources'], ['F2', 'Cinema', '/cinema'], ['F3', 'Home', '/'], ['F4', 'Contact', '/contact']].map(([key, label, href]) => (
            <Link key={key} href={href} style={{ padding: '8px 12px', textDecoration: 'none', color: C.amber, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, letterSpacing: '0.04em', borderRight: `1px solid ${C.dim}`, minHeight: 44 }} className="opac-fkey">
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
        .lib-drawer:hover, .lib-drawer:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: -2px; }
        .lib-drawer:hover .lib-drawer-title { text-decoration: underline; }
        .lib-chip:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
        select.opac-input:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
        @media (max-width: 860px) {
          .lib-drawers { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .lib-drawers { grid-template-columns: 1fr !important; }
        }
        .lib-row-link:hover .lib-row-title, .lib-row-link:focus-visible .lib-row-title { text-decoration: underline; }
        .lib-row-link:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: -2px; }
        .lib-heart-btn:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
        .lib-heart-btn:not(:disabled):hover { color: ${C.hi} !important; }
        /* Stop blinking animation for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          @keyframes blink { 0%, 100% { opacity: 1; } }
        }
        /* Remove CRT overlays when user has requested more contrast */
        @media (prefers-contrast: more) {
          .crt-overlay { display: none !important; }
        }
        @media (max-width: 780px) {
        }
        @media (max-width: 600px) {
          /* Stack masthead — title above stats */
          .lib-masthead { grid-template-columns: 1fr !important; }
          .lib-stats { text-align: left !important; }
          /* Shrink the big title so it fits comfortably */
          .lib-title { font-size: 26px !important; }
          /* Status bar — hide the clock on tiny screens to avoid wrapping */
          .lib-clock-cell { display: none !important; }
        }
        @media (max-width: 540px) {
          .lib-form-grid-2 { grid-template-columns: 1fr !important; }
          .lib-fkeys { grid-template-columns: repeat(2, 1fr) !important; }
          .lib-fkeys > a:nth-child(2) { border-right: none !important; }
          /* Bigger tap targets on filter buttons and suggest link */
          .opac-subject-btn { min-height: 44px !important; font-size: 14px !important; }
          .opac-btn { min-height: 44px !important; padding: 10px 16px !important; font-size: 13px !important; }
          .opac-fkey { padding: 12px !important; font-size: 14px !important; }
        }
      `}</style>
    </main>
    </BrowserChrome>
  );
}

// ── Row component ──────────────────────────────────────────────────────────────

function LibraryRow({
  item, idx, total, isFaved, favCount, userId, onToggle,
}: {
  item: LibraryItem; idx: number; total: number;
  isFaved: boolean; favCount: number; userId: string | null;
  onToggle: (slug: string) => void;
}) {
  const cat = LIBRARY_CATEGORY_BY_ID[item.category];
  const rowBg = idx % 2 === 0 ? C.bg2 : `rgba(255,176,0,0.03)`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: idx < total - 1 ? `1px solid rgba(255,176,0,0.18)` : 'none',
        background: rowBg,
      }}
    >
      {/* Main clickable area */}
      <Link
        href={`/library/${item.slug}`}
        className="lib-row-link"
        style={{ flex: 1, display: 'block', padding: '11px 14px', textDecoration: 'none', position: 'relative' }}
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

      {/* Heart / save button */}
      <button
        onClick={() => onToggle(item.slug)}
        disabled={!userId}
        aria-label={isFaved ? `Remove "${item.title}" from My Library` : `Save "${item.title}" to My Library${favCount > 0 ? ` (${favCount} saved)` : ''}`}
        aria-pressed={userId ? isFaved : undefined}
        title={userId ? (isFaved ? 'Remove from My Library' : 'Save to My Library') : 'Log in to save'}
        className="lib-heart-btn"
        style={{
          background: 'none', border: 'none', padding: '0 14px',
          color: isFaved ? C.amber : C.dim,
          cursor: userId ? 'pointer' : 'default',
          fontSize: '15px', fontFamily: C.mono, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
          minWidth: 44, minHeight: 44,
        }}
      >
        <span aria-hidden="true">{isFaved ? '♥' : '♡'}</span>
        {favCount > 0 && <span style={{ fontSize: '9px', lineHeight: 1 }}>{favCount}</span>}
      </button>
    </div>
  );
}
