'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { CATEGORIES, ALL_RESOURCES, type ResourceType, type Resource } from '@/lib/resources-data';

// ── Design tokens ─────────────────────────────────────────────────────────────
const NP = {
  bg:          '#fdf8ed',
  gold:        '#b8860b',
  goldLight:   '#f0e0a0',
  ink:         '#1c1200',
  ink2:        '#4a3c10',
  ink3:        '#8a7040',
  border:      '#d4b96a',
  borderLight: '#ede0b8',
  link:        '#0a3d7a',
  red:         '#8b0000',
  white:       '#fffdf5',
  fontHead:    '"Arial Narrow", Arial, Helvetica, sans-serif',
  fontBody:    'Georgia, "Times New Roman", serif',
  fontMono:    '"Courier New", Courier, monospace',
  fontUI:      'system-ui, -apple-system, Arial, sans-serif',
};

// Browser chrome tokens
const IE = {
  chrome:    '#d4d0c8',
  chromeMid: '#c0bdb5',
  border:    '#808080',
  titleBar:  'linear-gradient(to right, #0a246a 0%, #3169c4 60%, #0a246a 100%)',
  linkBar:   '#ece9d8',
  font:      '"Tahoma", "Verdana", Arial, sans-serif',
};

// ── Tag config ────────────────────────────────────────────────────────────────
const TAG_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  'Disabled Voice':     { label: 'By Disabled People', bg: '#2a2a2a', fg: '#e8c840' },
  'Deaf-Centered':      { label: 'Deaf / ASL',          bg: '#6b0000', fg: '#ffffff' },
  'Open Access':        { label: 'Free',                bg: '#1a4a1a', fg: '#ffffff' },
  'By Disabled People': { label: 'By Disabled People', bg: '#2a2a2a', fg: '#e8c840' },
  'Deaf / ASL':         { label: 'Deaf / ASL',          bg: '#6b0000', fg: '#ffffff' },
  'Free to Use':        { label: 'Free',                bg: '#1a4a1a', fg: '#ffffff' },
  'Captioning':         { label: 'Captioning',          bg: '#00205b', fg: '#ffffff' },
  'Audio Description':  { label: 'Audio Desc.',         bg: '#3b006b', fg: '#ffffff' },
  'Neurodivergent':     { label: 'Neurodivergent',      bg: '#5c2d00', fg: '#ffffff' },
};

const ALL_TAGS = [
  'By Disabled People', 'Deaf / ASL', 'Free to Use',
  'Captioning', 'Audio Description', 'Neurodivergent',
];

const TYPE_LABELS: Record<string, string> = {
  tool:     'Tool',
  guide:    'Guide',
  org:      'Organization',
  standard: 'Standard',
  media:    'Article / Media',
  course:   'Course',
};

// ── Browser chrome helpers ────────────────────────────────────────────────────

/** Classic XP-style window control button (decorative) */
function WinControl({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <span aria-hidden="true" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 16, fontSize: '9px', fontWeight: 'bold',
      background: danger ? '#cc0000' : IE.chrome,
      border: '1px outset #e0ddd8',
      color: danger ? '#fff' : '#000',
      fontFamily: IE.font, cursor: 'default', userSelect: 'none',
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

/** IE toolbar button */
function ToolbarBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      tabIndex={-1}
      aria-hidden="true"
      style={{
        background: 'none', border: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '1px 6px', cursor: onClick ? 'pointer' : 'default',
        gap: '1px', flexShrink: 0,
      }}>
      <span style={{ fontSize: '13px', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: '9px', fontFamily: IE.font, color: '#000', lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

// ── Retro components ──────────────────────────────────────────────────────────

function Odometer({ n }: { n: number }) {
  const digits = String(n).split('');
  return (
    <span aria-label={`${n} resources`} style={{ display: 'inline-flex', gap: '1px', verticalAlign: 'middle' }}>
      {digits.map((d, i) => (
        <span key={i} aria-hidden="true" style={{
          display: 'inline-block', width: '1.1em', textAlign: 'center',
          background: '#0a0a0a', color: '#00e000',
          fontFamily: NP.fontMono, fontSize: '0.9375rem', fontWeight: 'bold',
          lineHeight: '1.5', border: '1px solid #333',
        }}>{d}</span>
      ))}
    </span>
  );
}

function MarqueeStrip({ text }: { text: string }) {
  return (
    <div aria-hidden="true" style={{
      background: NP.ink, color: NP.gold, overflow: 'hidden',
      height: '26px', display: 'flex', alignItems: 'center',
      borderTop: `1px solid ${NP.gold}`, borderBottom: `1px solid ${NP.gold}`,
    }}>
      <div className="marquee-track" style={{ display: 'flex', whiteSpace: 'nowrap', willChange: 'transform' }}>
        {[0, 1].map((k) => (
          <span key={k} className="marquee-inner" style={{
            fontFamily: NP.fontMono, fontSize: '0.6875rem',
            letterSpacing: '0.12em', paddingRight: '4rem',
          }}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

function WebButton({ href, label, bg, fg = '#ffffff' }: { href: string; label: string; bg: string; fg?: string }) {
  return (
    <a href={href} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 88, height: 31, flexShrink: 0,
      background: bg, color: fg,
      border: `2px outset ${bg}`,
      fontFamily: NP.fontMono, fontSize: '9px',
      fontWeight: 'bold', letterSpacing: '0.06em', textTransform: 'uppercase',
      textDecoration: 'none', textAlign: 'center', lineHeight: 1.2, padding: '0 4px',
    }}>
      {label}
    </a>
  );
}

// ── Content components ────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.625rem', fontFamily: NP.fontMono,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: NP.ink3, border: `1px solid ${NP.borderLight}`,
      padding: '1px 5px', lineHeight: '14px', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const cfg = TAG_CONFIG[tag];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.625rem', fontFamily: NP.fontMono,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      background: cfg.bg, color: cfg.fg,
      padding: '1px 5px', lineHeight: '14px', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
}

function FavoriteButton({ slug, count, isFaved, isLoggedIn, onToggle }: {
  slug: string; count: number; isFaved: boolean; isLoggedIn: boolean; onToggle: (s: string) => void;
}) {
  const base: React.CSSProperties = {
    background: 'none', border: 'none', fontSize: '0.8125rem', padding: '0 2px',
    flexShrink: 0, fontFamily: NP.fontMono, color: isFaved ? NP.red : NP.ink3,
    display: 'inline-flex', alignItems: 'center', gap: 2,
  };
  if (!isLoggedIn) return (
    <span aria-label={count > 0 ? `${count} saved` : 'Log in to save'} style={{ ...base, cursor: 'default' }}>
      {count > 0 ? `♡ ${count}` : '♡'}
    </span>
  );
  return (
    <button onClick={() => onToggle(slug)}
      aria-label={isFaved ? `Remove from favorites (${count} saved)` : `Save to favorites${count > 0 ? ` (${count})` : ''}`}
      aria-pressed={isFaved}
      style={{ ...base, cursor: 'pointer' }}>
      {isFaved ? '♥' : '♡'}{count > 0 && <span style={{ fontSize: '0.6875rem' }}>{count}</span>}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResourcesPage() {
  const [search, setSearch]                     = useState('');
  const [activeType, setActiveType]             = useState<ResourceType | 'all'>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [sortPopular, setSortPopular]           = useState(false);

  const [userId, setUserId]         = useState<string | null>(null);
  const [favCounts, setFavCounts]   = useState<Record<string, number>>({});
  const [userFavs, setUserFavs]     = useState<Set<string>>(new Set());
  const [favPending, setFavPending] = useState<Set<string>>(new Set());
  const [memberResources, setMemberResources] = useState<Resource[]>([]);

  const [showSubmitForm, setShowSubmitForm]       = useState(false);
  const [submitName, setSubmitName]               = useState('');
  const [submitUrl, setSubmitUrl]                 = useState('');
  const [submitCategory, setSubmitCategory]       = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitTags, setSubmitTags]               = useState<string[]>([]);
  const [submitterName, setSubmitterName]         = useState('');
  const [submitterEmail, setSubmitterEmail]       = useState('');
  const [submitLoading, setSubmitLoading]         = useState(false);
  const [submitStatus, setSubmitStatus]           = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError]             = useState('');

  const loadData = useCallback(async () => {
    const { data: submissions } = await supabase
      .from('resource_submissions').select('resource_name,resource_url,description,special_tags')
      .eq('status', 'approved').order('created_at', { ascending: false });
    if (submissions?.length) {
      setMemberResources(submissions.map((s) => ({
        name: s.resource_name, url: s.resource_url,
        description: s.description || '', type: 'org' as ResourceType, tags: s.special_tags || [],
      })));
    }
    const { data: counts } = await supabase.from('resource_favorites').select('resource_slug');
    if (counts) {
      const tally: Record<string, number> = {};
      for (const row of counts) tally[row.resource_slug] = (tally[row.resource_slug] ?? 0) + 1;
      setFavCounts(tally);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: mine } = await supabase.from('resource_favorites').select('resource_slug').eq('user_id', user.id);
    if (mine) setUserFavs(new Set(mine.map((r) => r.resource_slug)));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFavorite = useCallback(async (slug: string) => {
    if (!userId || favPending.has(slug)) return;
    setFavPending((p) => new Set(p).add(slug));
    const isFaved = userFavs.has(slug);
    setUserFavs((p) => { const n = new Set(p); isFaved ? n.delete(slug) : n.add(slug); return n; });
    setFavCounts((p) => ({ ...p, [slug]: Math.max(0, (p[slug] ?? 0) + (isFaved ? -1 : 1)) }));
    if (isFaved) {
      await supabase.from('resource_favorites').delete().eq('user_id', userId).eq('resource_slug', slug);
    } else {
      await supabase.from('resource_favorites').insert({ user_id: userId, resource_slug: slug });
    }
    setFavPending((p) => { const n = new Set(p); n.delete(slug); return n; });
  }, [userId, userFavs, favPending]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitName.trim() || !submitUrl.trim()) { setSubmitError('Resource name and URL are required.'); return; }
    setSubmitLoading(true); setSubmitError('');
    const isMember = userId !== null;
    const { error } = await supabase.from('resource_submissions').insert({
      resource_name: submitName.trim(), resource_url: submitUrl.trim(),
      description: submitDescription.trim() || null, category: submitCategory || null,
      special_tags: submitTags, submitter_name: submitterName.trim() || null,
      submitter_email: submitterEmail.trim() || null, submitter_user_id: userId || null,
      status: isMember ? 'approved' : 'pending',
    });
    if (error) { setSubmitError('Something went wrong. Please try again.'); setSubmitLoading(false); return; }
    if (isMember) {
      try {
        await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: submitterName.trim() || 'A member', email: submitterEmail.trim() || 'member@artisticaccessibility.com',
            subject: `New member-submitted resource: ${submitName.trim()}`,
            message: `Member submitted a resource.\n\nResource: ${submitName.trim()}\nURL: ${submitUrl.trim()}\nCategory: ${submitCategory || 'Not specified'}\nDescription: ${submitDescription.trim() || 'None'}\nSubmitter: ${submitterName.trim() || 'Anonymous'} (${submitterEmail.trim() || 'no email'})` }) });
      } catch { /* best-effort */ }
    }
    setSubmitStatus('success'); setSubmitLoading(false);
    setSubmitName(''); setSubmitUrl(''); setSubmitCategory(''); setSubmitDescription('');
    setSubmitTags([]); setSubmitterName(''); setSubmitterEmail('');
  }, [submitName, submitUrl, submitCategory, submitDescription, submitTags, submitterName, submitterEmail, userId]);

  const toggleTag = (tag: string) => setSubmitTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  const clearFilters = () => { setSearch(''); setActiveType('all'); setActiveCategoryId(null); };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_RESOURCES.filter((r) => {
      const matchSearch = !q
        || r.name.toLowerCase().includes(q)
        || r.description.toLowerCase().includes(q)
        || (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
        || r.categoryTitle.toLowerCase().includes(q);
      const matchType     = activeType === 'all' || r.type === activeType;
      const matchCategory = !activeCategoryId || r.categoryId === activeCategoryId;
      return matchSearch && matchType && matchCategory;
    });
  }, [search, activeType, activeCategoryId]);

  const visibleCategories = useMemo(() => {
    if (activeCategoryId) return CATEGORIES.filter((c) => c.id === activeCategoryId);
    if (search || activeType !== 'all') {
      const ids = new Set(filtered.map((r) => r.categoryId));
      return CATEGORIES.filter((c) => ids.has(c.id));
    }
    return CATEGORIES;
  }, [search, activeType, activeCategoryId, filtered]);

  const categoryFilteredCounts = useMemo(() => {
    const q = search.toLowerCase().trim();
    const counts: Record<string, number> = {};
    for (const r of ALL_RESOURCES) {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      const matchType   = activeType === 'all' || r.type === activeType;
      if (matchSearch && matchType) counts[r.categoryId] = (counts[r.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [search, activeType]);

  const sortResources = useCallback((resources: Resource[]) => {
    if (!sortPopular) return resources;
    return [...resources].sort((a, b) => (favCounts[b.url] ?? 0) - (favCounts[a.url] ?? 0));
  }, [sortPopular, favCounts]);

  const totalCount   = ALL_RESOURCES.length;
  const visibleCount = filtered.length;
  const isLoggedIn   = userId !== null;

  const NAV_LINKS = [
    { label: 'Library',   href: '/library' },
    { label: 'Cinema',    href: '/cinema' },
    { label: 'Contact',   href: '/contact' },
    { label: 'Feedback',  href: '/feedback' },
    { label: isLoggedIn ? 'My Account' : 'Log In', href: isLoggedIn ? '/dashboard' : '/login' },
  ];

  // ── Resource row ───────────────────────────────────────────────────────────
  const renderResource = (resource: Resource, i: number, total: number) => {
    const count   = favCounts[resource.url] ?? 0;
    const isFaved = userFavs.has(resource.url);
    const extraTags = (resource.tags ?? []).filter((t) => t !== 'FREE');
    return (
      <div key={resource.url} style={{ padding: '10px 0', borderBottom: i < total - 1 ? `1px dotted ${NP.borderLight}` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{
            fontFamily: NP.fontHead, fontWeight: 'bold', fontSize: '1rem', color: NP.link,
            textDecoration: 'underline', textDecorationThickness: '1px', textUnderlineOffset: '2px',
          }}>
            {resource.name}
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          {count >= 2 && (
            <span aria-label="Popular resource" style={{
              fontSize: '0.625rem', fontFamily: NP.fontMono, fontWeight: 'bold',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: '#cc3300', color: '#fff',
              padding: '1px 5px', lineHeight: '14px', flexShrink: 0,
            }}>🔥 HOT</span>
          )}
          <TypeBadge type={resource.type} />
          {resource.location && (
            <span style={{ fontSize: '0.625rem', fontFamily: NP.fontMono, color: NP.ink3, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
              📍 {resource.location}
            </span>
          )}
          {extraTags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          <FavoriteButton slug={resource.url} count={count} isFaved={isFaved} isLoggedIn={isLoggedIn} onToggle={toggleFavorite} />
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: NP.ink2, lineHeight: 1.65, fontFamily: NP.fontBody }}>
          {resource.description}
        </p>
      </div>
    );
  };

  // ── Category section ───────────────────────────────────────────────────────
  const catSection = (cat: typeof CATEGORIES[0]) => {
    const hasFilter = search || activeType !== 'all' || activeCategoryId;
    const catResources = sortResources(
      hasFilter ? filtered.filter((r) => r.categoryId === cat.id) : cat.resources
    );
    if (catResources.length === 0) return null;
    return (
      <section key={cat.id} id={`cat-${cat.id}`} aria-labelledby={`cat-title-${cat.id}`} style={{ marginBottom: '2rem' }}>
        <div style={{
          borderTop: `2px solid ${NP.ink}`, borderBottom: `1px solid ${NP.border}`,
          padding: '6px 0 5px', display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px',
        }}>
          <span aria-hidden="true" style={{ fontSize: '1rem' }}>{cat.emoji}</span>
          <h2 id={`cat-title-${cat.id}`} style={{
            margin: 0, fontFamily: NP.fontHead, fontWeight: 'bold',
            fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: NP.ink,
          }}>
            {cat.title}
          </h2>
          <span style={{ marginLeft: 'auto', fontFamily: NP.fontMono, fontSize: '0.6875rem', color: NP.ink3 }}>
            {catResources.length} item{catResources.length !== 1 ? 's' : ''}
          </span>
        </div>
        {catResources.map((r, i) => renderResource(r, i, catResources.length))}
      </section>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Skip link — must be first focusable element before all chrome */}
      <a className="sr-only" href="#main-content">Skip to main content</a>

      {/* Outer wrapper: teal desktop + browser window */}
      <div style={{
        position: 'fixed', inset: 0,
        background: '#008080',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px',
      }}>
        {/* Browser window */}
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.5), inset 1px 1px 0 #fff',
          border: `2px outset ${IE.chrome}`,
          background: NP.bg,
          maxWidth: 1100,
        }}>

          {/* ── IE Title bar ── */}
          <div style={{
            background: IE.titleBar,
            height: 28, flexShrink: 0,
            display: 'flex', alignItems: 'center',
            padding: '0 4px 0 6px', gap: 6, userSelect: 'none',
          }}>
            <span aria-hidden="true" style={{ fontSize: '14px' }}>🌐</span>
            <span style={{ flex: 1, fontSize: '11px', fontFamily: IE.font, color: '#ffffff', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              Accessibility Resources — Artistic Accessibility Collective
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              <WinControl label="─" />
              <WinControl label="□" />
              <WinControl label="✕" danger />
            </div>
          </div>

          {/* ── Menu bar ── */}
          <div className="ie-menubar" style={{
            background: IE.chrome, flexShrink: 0,
            height: 22, display: 'flex', alignItems: 'center',
            padding: '0 2px', borderBottom: `1px solid ${IE.border}`,
          }}>
            {['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].map((item) => (
              <button key={item} aria-hidden="true" tabIndex={-1} style={{
                background: 'none', border: 'none', fontSize: '11px',
                fontFamily: IE.font, padding: '2px 7px', cursor: 'default', color: '#000',
              }}>{item}</button>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="ie-toolbar" style={{
            background: IE.chrome, flexShrink: 0,
            height: 36, display: 'flex', alignItems: 'center',
            padding: '0 4px', gap: '2px',
            borderBottom: `1px solid ${IE.border}`,
          }}>
            <ToolbarBtn icon="◀" label="Back" onClick={() => window.history.back()} />
            <ToolbarBtn icon="▶" label="Forward" onClick={() => window.history.forward()} />
            <div aria-hidden="true" style={{ width: 1, height: 24, background: IE.border, margin: '0 2px' }} />
            <ToolbarBtn icon="⟳" label="Refresh" onClick={() => window.location.reload()} />
            <ToolbarBtn icon="🏠" label="Home" onClick={() => window.location.href = '/'} />
            <div aria-hidden="true" style={{ width: 1, height: 24, background: IE.border, margin: '0 4px' }} />
            {/* Address bar */}
            <span style={{ fontSize: '11px', fontFamily: IE.font, color: '#000', flexShrink: 0 }}>Address</span>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: '#fff', border: `2px inset ${IE.border}`,
              height: 22, padding: '0 6px', overflow: 'hidden',
            }}>
              <span aria-hidden="true" style={{ fontSize: '10px', fontFamily: '"Courier New"', color: '#000', whiteSpace: 'nowrap' }}>
                http://www.artisticaccessibility.com/resources
              </span>
            </div>
            <button aria-hidden="true" tabIndex={-1} style={{
              fontSize: '11px', fontFamily: IE.font,
              background: IE.chrome, border: `2px outset ${IE.chrome}`,
              padding: '2px 10px', cursor: 'pointer', flexShrink: 0,
            }}>Go</button>
          </div>

          {/* ── Links bar ── */}
          <div style={{
            background: IE.linkBar, flexShrink: 0,
            height: 24, display: 'flex', alignItems: 'center',
            padding: '0 8px', gap: '0',
            borderBottom: `1px solid #d0ccc0`,
            overflow: 'hidden',
          }}>
            <span aria-hidden="true" style={{ fontSize: '10px', fontFamily: IE.font, color: '#666', marginRight: '8px', flexShrink: 0 }}>Links:</span>
            <nav aria-label="Site navigation" style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              {NAV_LINKS.map(({ label, href }) => (
                <Link key={href} href={href} style={{
                  fontSize: '11px', fontFamily: IE.font, color: '#0000cc',
                  textDecoration: 'underline', padding: '0 10px',
                  borderRight: `1px solid #d0ccc0`, whiteSpace: 'nowrap',
                  lineHeight: '24px',
                }}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Scrollable page content ── */}
          <main id="main-content" style={{ flex: 1, overflow: 'auto', background: NP.bg }}>
            <h1 className="sr-only">Free Resource Directory — Artistic Accessibility Collective</h1>

            {/* Marquee */}
            <MarqueeStrip text="✦ ALL RESOURCES ARE FREE ✦ NO SUBSCRIPTIONS ✦ NO PAYWALLS ✦ BY THE COMMUNITY, FOR THE COMMUNITY ✦ VERIFIED MAY 2026 ✦" />

            {/* Page header */}
            <div style={{ borderBottom: `2px solid ${NP.gold}`, padding: '1.25rem 1rem 1rem', maxWidth: '860px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                <p style={{ fontFamily: NP.fontMono, fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: NP.ink3, margin: 0 }}>
                  Free Resource Directory · May 2026 ·
                </p>
                <Odometer n={totalCount} />
                <p style={{ fontFamily: NP.fontMono, fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: NP.ink3, margin: 0 }}>
                  verified free resources
                </p>
              </div>
              <p style={{ fontFamily: NP.fontHead, fontWeight: 'bold', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: NP.ink, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                Accessibility Resources
              </p>
            </div>

            {/* Search + filters */}
            <div style={{ padding: '1rem', borderBottom: `1px solid ${NP.border}`, maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <label htmlFor="resource-search" className="sr-only">Search resources</label>
                <span aria-hidden="true" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: NP.ink3, fontSize: '0.875rem', pointerEvents: 'none' }}>🔍</span>
                <input
                  id="resource-search" type="search"
                  placeholder="Search by name, topic, or description…"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 36px 10px 32px', border: `1.5px solid ${NP.border}`, background: NP.white, color: NP.ink, fontFamily: NP.fontBody, fontSize: '1rem', outline: 'none' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Clear search" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: NP.ink3, fontSize: '0.875rem', padding: '4px' }}>✕</button>
                )}
              </div>

              {/* Category pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                <button onClick={() => setActiveCategoryId(null)} aria-pressed={activeCategoryId === null}
                  style={{ flexShrink: 0, padding: '5px 10px', cursor: 'pointer', border: `1.5px solid ${activeCategoryId === null ? NP.ink : NP.border}`, background: activeCategoryId === null ? NP.goldLight : 'transparent', fontFamily: NP.fontUI, fontSize: '0.8125rem', color: NP.ink, whiteSpace: 'nowrap' }}>
                  All ({search || activeType !== 'all' ? visibleCount : totalCount})
                </button>
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategoryId === cat.id;
                  const count = categoryFilteredCounts[cat.id] ?? cat.resources.length;
                  return (
                    <button key={cat.id} onClick={() => setActiveCategoryId(isActive ? null : cat.id)} aria-pressed={isActive}
                      style={{ flexShrink: 0, padding: '5px 10px', cursor: 'pointer', border: `1.5px solid ${isActive ? NP.ink : NP.border}`, background: isActive ? NP.goldLight : 'transparent', fontFamily: NP.fontUI, fontSize: '0.8125rem', color: NP.ink, whiteSpace: 'nowrap' }}>
                      {cat.emoji} {cat.title} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: NP.fontUI, fontSize: '0.8125rem', color: NP.ink2 }}>
                  Type:
                  <select value={activeType} onChange={(e) => setActiveType(e.target.value as ResourceType | 'all')}
                    style={{ border: `1px solid ${NP.border}`, background: NP.white, color: NP.ink, fontFamily: NP.fontUI, fontSize: '0.8125rem', padding: '3px 6px', cursor: 'pointer' }}>
                    <option value="all">All</option>
                    <option value="tool">Tools &amp; Software</option>
                    <option value="guide">Guides &amp; How-Tos</option>
                    <option value="org">Organizations</option>
                    <option value="standard">Standards</option>
                    <option value="media">Articles &amp; Media</option>
                    <option value="course">Courses</option>
                  </select>
                </label>
                <button onClick={() => setSortPopular((v) => !v)} aria-pressed={sortPopular}
                  style={{ background: 'none', border: `1px solid ${sortPopular ? NP.red : NP.border}`, color: sortPopular ? NP.red : NP.ink2, fontFamily: NP.fontUI, fontSize: '0.8125rem', padding: '3px 10px', cursor: 'pointer' }}>
                  {sortPopular ? '♥ Popular' : '♡ Popular'}
                </button>
                <span style={{ flex: 1 }} />
                <span aria-live="polite" aria-atomic="true" style={{ fontFamily: NP.fontMono, fontSize: '0.6875rem', color: NP.ink3, letterSpacing: '0.04em' }}>
                  {(search || activeType !== 'all' || activeCategoryId) ? `${visibleCount} result${visibleCount !== 1 ? 's' : ''}` : `${totalCount} free resources`}
                </span>
                <button onClick={() => { setShowSubmitForm((v) => !v); setSubmitStatus('idle'); }} aria-expanded={showSubmitForm}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: NP.fontUI, fontSize: '0.8125rem', color: NP.link, textDecoration: 'underline', padding: 0 }}>
                  {showSubmitForm ? 'Close' : '+ Suggest a Resource'}
                </button>
              </div>

              {(search || activeType !== 'all' || activeCategoryId) && (
                <p style={{ margin: 0, fontFamily: NP.fontMono, fontSize: '0.6875rem', color: NP.ink3, letterSpacing: '0.04em' }}>
                  Filtering{activeCategoryId && ` · ${CATEGORIES.find((c) => c.id === activeCategoryId)?.title}`}{activeType !== 'all' && ` · ${activeType}`}{search && ` · "${search}"`} ·{' '}
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', color: NP.link, fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}>clear all</button>
                </p>
              )}
            </div>

            {/* Suggest form */}
            {showSubmitForm && (
              <div style={{ background: NP.white, borderBottom: `1px solid ${NP.border}`, padding: '1rem', maxWidth: '860px', margin: '0 auto' }}>
                <p style={{ fontFamily: NP.fontHead, fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: NP.ink, margin: '0 0 4px' }}>Suggest a Free Resource</p>
                <p style={{ fontFamily: NP.fontMono, fontSize: '0.6875rem', color: NP.ink3, letterSpacing: '0.04em', margin: '0 0 0.875rem' }}>All resources must be free to access. Every suggestion is reviewed before being added.</p>
                {submitStatus === 'success' ? (
                  <div role="status" style={{ background: NP.bg, border: `1px solid ${NP.border}`, padding: '10px 14px', fontFamily: NP.fontBody, fontSize: '0.9375rem', color: NP.ink }}>
                    {isLoggedIn ? <><strong>Your resource is live!</strong> Added to the directory. Admin notified. Thank you!</> : <><strong>Thank you!</strong> Your suggestion will be reviewed before adding.</>}
                    {' '}<button onClick={() => setSubmitStatus('idle')} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit', color: NP.link }}>Suggest another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate aria-label="Suggest a free resource">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="sub-name" style={{ display: 'block', fontFamily: NP.fontUI, fontSize: '0.8125rem', marginBottom: '3px', color: NP.ink }}>Resource name <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
                        <input id="sub-name" type="text" value={submitName} onChange={(e) => setSubmitName(e.target.value)} required style={{ width: '100%', border: `1.5px solid ${NP.border}`, padding: '7px 10px', fontFamily: NP.fontBody, fontSize: '0.9375rem', background: NP.white, color: NP.ink, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label htmlFor="sub-url" style={{ display: 'block', fontFamily: NP.fontUI, fontSize: '0.8125rem', marginBottom: '3px', color: NP.ink }}>URL <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
                        <input id="sub-url" type="url" value={submitUrl} onChange={(e) => setSubmitUrl(e.target.value)} required placeholder="https://…" style={{ width: '100%', border: `1.5px solid ${NP.border}`, padding: '7px 10px', fontFamily: NP.fontMono, fontSize: '0.875rem', background: NP.white, color: NP.ink, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label htmlFor="sub-cat" style={{ display: 'block', fontFamily: NP.fontUI, fontSize: '0.8125rem', marginBottom: '3px', color: NP.ink }}>Category (optional)</label>
                        <select id="sub-cat" value={submitCategory} onChange={(e) => setSubmitCategory(e.target.value)} style={{ width: '100%', border: `1.5px solid ${NP.border}`, padding: '7px 10px', fontFamily: NP.fontUI, fontSize: '0.875rem', background: NP.white, color: NP.ink, boxSizing: 'border-box' }}>
                          <option value="">pick one</option>
                          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>)}
                          <option value="other">Other / Not sure</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="sub-desc" style={{ display: 'block', fontFamily: NP.fontUI, fontSize: '0.8125rem', marginBottom: '3px', color: NP.ink }}>Why is it valuable?</label>
                        <textarea id="sub-desc" rows={3} value={submitDescription} onChange={(e) => setSubmitDescription(e.target.value)} placeholder="What does it cover? Who is it for?" style={{ width: '100%', border: `1.5px solid ${NP.border}`, padding: '7px 10px', fontFamily: NP.fontBody, fontSize: '0.875rem', background: NP.white, color: NP.ink, resize: 'vertical', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                          <legend style={{ fontFamily: NP.fontUI, fontSize: '0.8125rem', marginBottom: '6px', color: NP.ink }}>Labels (check all that apply)</legend>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {ALL_TAGS.map((tag) => (
                              <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={submitTags.includes(tag)} onChange={() => toggleTag(tag)} style={{ width: 14, height: 14, accentColor: NP.ink }} />
                                <TagBadge tag={tag} />
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                      <div>
                        <label htmlFor="sub-pname" style={{ display: 'block', fontFamily: NP.fontUI, fontSize: '0.8125rem', marginBottom: '3px', color: NP.ink }}>Your name (optional)</label>
                        <input id="sub-pname" type="text" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} style={{ width: '100%', border: `1.5px solid ${NP.border}`, padding: '7px 10px', fontFamily: NP.fontBody, fontSize: '0.875rem', background: NP.white, color: NP.ink, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label htmlFor="sub-pemail" style={{ display: 'block', fontFamily: NP.fontUI, fontSize: '0.8125rem', marginBottom: '3px', color: NP.ink }}>Your email (optional)</label>
                        <input id="sub-pemail" type="email" value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} style={{ width: '100%', border: `1.5px solid ${NP.border}`, padding: '7px 10px', fontFamily: NP.fontMono, fontSize: '0.875rem', background: NP.white, color: NP.ink, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    {submitError && <p role="alert" style={{ color: NP.red, fontFamily: NP.fontMono, fontSize: '0.8125rem', margin: '0 0 0.5rem' }}>{submitError}</p>}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" disabled={submitLoading} style={{ background: NP.ink, color: NP.white, border: 'none', padding: '8px 18px', fontFamily: NP.fontUI, fontSize: '0.875rem', cursor: 'pointer' }}>
                        {submitLoading ? 'Submitting…' : 'Submit'}
                      </button>
                      <button type="button" onClick={() => setShowSubmitForm(false)} style={{ background: 'none', border: `1px solid ${NP.border}`, padding: '8px 14px', fontFamily: NP.fontUI, fontSize: '0.875rem', cursor: 'pointer', color: NP.ink2 }}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Resources */}
            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.25rem 1rem 2rem' }}>
              {!isLoggedIn && (
                <p style={{ fontFamily: NP.fontMono, fontSize: '0.6875rem', color: NP.ink3, letterSpacing: '0.04em', margin: '0 0 1.25rem' }}>
                  <a href="/login" style={{ color: NP.link }}>Log in</a> to save resources to your favorites.
                </p>
              )}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', fontFamily: NP.fontBody, fontSize: '1rem', color: NP.ink2 }}>
                  No resources found{search ? <> for &ldquo;{search}&rdquo;</> : ''}.{' '}
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit', color: NP.link }}>Clear filters</button>
                </div>
              ) : (
                visibleCategories.map((cat) => catSection(cat))
              )}

              {memberResources.length > 0 && (
                <section aria-labelledby="member-heading" style={{ marginBottom: '2rem' }}>
                  <div style={{ borderTop: `2px solid ${NP.ink}`, borderBottom: `1px solid ${NP.border}`, padding: '6px 0 5px', display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                    <span aria-hidden="true">✨</span>
                    <h2 id="member-heading" style={{ margin: 0, fontFamily: NP.fontHead, fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: NP.ink }}>Member-Submitted Resources</h2>
                    <span style={{ marginLeft: 'auto', fontFamily: NP.fontMono, fontSize: '0.6875rem', color: NP.ink3 }}>{memberResources.length} item{memberResources.length !== 1 ? 's' : ''}</span>
                  </div>
                  {memberResources.map((resource, i) => {
                    const count = favCounts[resource.url] ?? 0;
                    const isFaved = userFavs.has(resource.url);
                    return (
                      <div key={resource.url} style={{ padding: '10px 0', borderBottom: i < memberResources.length - 1 ? `1px dotted ${NP.borderLight}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: NP.fontHead, fontWeight: 'bold', fontSize: '1rem', color: NP.link, textDecoration: 'underline', textDecorationThickness: '1px', textUnderlineOffset: '2px' }}>
                            {resource.name}<span className="sr-only"> (opens in new tab)</span>
                          </a>
                          <span style={{ fontSize: '0.625rem', fontFamily: NP.fontMono, color: NP.ink3, letterSpacing: '0.04em' }}>✨ member pick</span>
                          {(resource.tags ?? []).filter((t) => t !== 'FREE').map((tag) => <TagBadge key={tag} tag={tag} />)}
                          <FavoriteButton slug={resource.url} count={count} isFaved={isFaved} isLoggedIn={isLoggedIn} onToggle={toggleFavorite} />
                        </div>
                        {resource.description && <p style={{ margin: 0, fontSize: '0.875rem', color: NP.ink2, lineHeight: 1.65, fontFamily: NP.fontBody }}>{resource.description}</p>}
                      </div>
                    );
                  })}
                </section>
              )}
            </div>

            {/* Footer */}
            <footer aria-label="Site footer" style={{ borderTop: `2px solid ${NP.ink}`, background: NP.bg, padding: '1.25rem 1rem', maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <WebButton href="/"          label="🏠 Home"           bg="#00205b" />
                <WebButton href="/library"   label="📚 Library"        bg="#1a4a1a" />
                <WebButton href="/cinema"    label="🎬 Cinema"         bg="#4b0082" />
                <WebButton href="/directory" label="📋 Directory"      bg="#6b4400" />
                <WebButton href="/contact"   label="✉ Contact Us"      bg="#2a2a2a" />
              </div>
              <p style={{ fontFamily: NP.fontMono, fontSize: '0.6875rem', color: NP.ink3, letterSpacing: '0.06em', margin: 0, lineHeight: 1.8 }}>
                Free resource directory · All {totalCount} resources verified free at time of publication.<br />
                <span aria-hidden="true">Best viewed with: an open mind · Est. 2024 · 🖥️ Optimized for accessibility</span>
              </p>
            </footer>
          </main>{/* end scrollable content */}

          {/* ── Status bar ── */}
          <div aria-hidden="true" style={{
            background: IE.chrome, flexShrink: 0,
            height: 22, display: 'flex', alignItems: 'center',
            padding: '0 8px', borderTop: `1px solid ${IE.border}`,
            fontSize: '11px', fontFamily: IE.font, gap: '0',
          }}>
            <span style={{ paddingRight: '10px', borderRight: `1px solid ${IE.border}`, marginRight: '10px' }}>✓ Done</span>
            <span style={{ color: '#555' }}>
              {search ? `Searching: "${search}"` : `${totalCount} resources`}
            </span>
            <span style={{ marginLeft: 'auto', paddingLeft: '10px', borderLeft: `1px solid ${IE.border}` }}>🌐 Internet</span>
          </div>

        </div>{/* end browser window */}
      </div>{/* end outer wrapper */}

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee-scroll 28s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
          .marquee-inner:last-child { display: none; }
        }
        .ie-menubar, .ie-toolbar { display: flex; }
        @media (max-width: 540px) {
          .ie-menubar, .ie-toolbar { display: none; }
        }
        @media (max-width: 480px) {
          /* Category filter pills — bigger on phone */
          .ie-menubar, .ie-toolbar { display: none; }
          #resource-search { font-size: 16px !important; min-height: 44px !important; }
        }
        #resource-search:focus-visible { outline: 2px solid ${NP.link}; outline-offset: 0; }
        a:focus-visible      { outline: 2px solid ${NP.link}; outline-offset: 3px; }
        button:focus-visible { outline: 2px solid ${NP.link}; outline-offset: 2px; }
        input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid ${NP.link}; outline-offset: 0; }
      `}</style>
    </>
  );
}
