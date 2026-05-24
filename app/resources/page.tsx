'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { CATEGORIES, ALL_RESOURCES, type ResourceType, type Resource } from '@/lib/resources-data';

// ── Type index config ─────────────────────────────────────────────────────────
const TYPE_INDEX: { type: ResourceType | 'all'; label: string; icon: string }[] = [
  { type: 'all',      label: 'Everything',             icon: '★' },
  { type: 'tool',     label: 'Tools & Software',        icon: '🛠' },
  { type: 'guide',    label: 'Guides & How-Tos',        icon: '📖' },
  { type: 'org',      label: 'Organizations',           icon: '🏛' },
  { type: 'standard', label: 'Standards & Frameworks',  icon: '📋' },
  { type: 'media',    label: 'Articles, Essays & Media',icon: '🎬' },
  { type: 'course',   label: 'Courses & Webinars',      icon: '🎓' },
];

// ── Tag config — old DB values map to new display labels ──────────────────────
const TAG_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  'Disabled Voice':     { label: 'By Disabled People',  bg: '#1a1a1a', fg: '#F2C134' },
  'Deaf-Centered':      { label: 'Deaf / ASL',           bg: '#bf1d0e', fg: '#ffffff' },
  'Open Access':        { label: 'Free to Use',          bg: '#1a6e3c', fg: '#ffffff' },
  'By Disabled People': { label: 'By Disabled People',  bg: '#1a1a1a', fg: '#F2C134' },
  'Deaf / ASL':         { label: 'Deaf / ASL',           bg: '#bf1d0e', fg: '#ffffff' },
  'Free to Use':        { label: 'Free to Use',          bg: '#1a6e3c', fg: '#ffffff' },
  'Captioning':         { label: 'Captioning',           bg: '#1a409f', fg: '#ffffff' },
  'Audio Description':  { label: 'Audio Description',    bg: '#5e1a9f', fg: '#ffffff' },
  'Neurodivergent':     { label: 'Neurodivergent',       bg: '#a04a00', fg: '#ffffff' },
};
const ALL_TAGS = [
  'By Disabled People', 'Deaf / ASL', 'Free to Use',
  'Captioning', 'Audio Description', 'Neurodivergent',
];

function TagBadge({ tag }: { tag: string }) {
  const cfg = TAG_CONFIG[tag];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', fontSize: '0.625rem', fontWeight: 700,
      background: cfg.bg, color: cfg.fg, border: `1.5px solid ${cfg.bg}`,
      whiteSpace: 'nowrap',
      fontFamily: '"Courier New", Courier, monospace',
      letterSpacing: '0.07em', textTransform: 'uppercase',
    }}>
      {cfg.label}
    </span>
  );
}

// ── Favorite button ───────────────────────────────────────────────────────────
function FavoriteButton({
  slug, count, isFaved, isLoggedIn, onToggle,
}: {
  slug: string; count: number; isFaved: boolean; isLoggedIn: boolean; onToggle: (s: string) => void;
}) {
  if (!isLoggedIn) {
    return (
      <span aria-label={count > 0 ? `${count} saved. Log in to save.` : 'Log in to save'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'rgba(14,14,14,0.22)', fontSize: '0.75rem', cursor: 'default', userSelect: 'none', flexShrink: 0 }}>
        <span aria-hidden="true">♡</span>
        {count > 0 && <span style={{ fontSize: '0.6875rem' }}>{count}</span>}
      </span>
    );
  }
  return (
    <button onClick={() => onToggle(slug)}
      aria-label={isFaved ? `Remove from favorites (${count} saved)` : `Save to favorites${count > 0 ? ` (${count} saved)` : ''}`}
      aria-pressed={isFaved}
      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, color: isFaved ? '#bf1d0e' : 'rgba(14,14,14,0.28)', fontSize: '0.8rem', padding: '2px 4px', flexShrink: 0 }}>
      <span aria-hidden="true">{isFaved ? '♥' : '♡'}</span>
      {count > 0 && <span style={{ fontSize: '0.6875rem', fontWeight: 700 }}>{count}</span>}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResourcesPage() {
  const [search, setSearch]               = useState('');
  const [activeType, setActiveType]       = useState<ResourceType | 'all'>('all');
  const [sortPopular, setSortPopular]     = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);

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
    setSubmitName(''); setSubmitUrl(''); setSubmitCategory(''); setSubmitDescription(''); setSubmitTags([]); setSubmitterName(''); setSubmitterEmail('');
  }, [submitName, submitUrl, submitCategory, submitDescription, submitTags, submitterName, submitterEmail, userId]);

  const toggleTag = (tag: string) => setSubmitTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_RESOURCES.filter((r) => {
      const matchSearch = !q
        || r.name.toLowerCase().includes(q)
        || r.description.toLowerCase().includes(q)
        || (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
        || r.categoryTitle.toLowerCase().includes(q);
      const matchType = activeType === 'all' || r.type === activeType;
      return matchSearch && matchType;
    });
  }, [search, activeType]);

  const visibleCategories = useMemo(() => {
    if (search || activeType !== 'all') {
      const ids = new Set(filtered.map((r) => r.categoryId));
      return CATEGORIES.filter((c) => ids.has(c.id));
    }
    return CATEGORIES;
  }, [search, activeType, filtered]);

  const sortResources = useCallback((resources: Resource[]) => {
    if (!sortPopular) return resources;
    return [...resources].sort((a, b) => (favCounts[b.url] ?? 0) - (favCounts[a.url] ?? 0));
  }, [sortPopular, favCounts]);

  // ── Type counts (across all resources, ignores current filters) ────────────
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<ResourceType, number>> = {};
    for (const r of ALL_RESOURCES) counts[r.type] = (counts[r.type] ?? 0) + 1;
    return counts;
  }, []);

  const totalCount = ALL_RESOURCES.length;
  const isLoggedIn = userId !== null;

  // ── Design tokens ─────────────────────────────────────────────────────────
  const YB = {
    paper:    '#F2C134',
    paper2:   '#E8B820',
    ink:      '#0e0e0e',
    ink2:     '#3a3020',
    ink3:     '#6b5f38',
    red:      '#bf1d0e',
    white:    '#fffdf0',
    fontHeavy: '"Arial Black", "Arial Bold", Arial, Helvetica, sans-serif',
    fontCond:  '"Arial Narrow", Arial, Helvetica, sans-serif',
    fontMono:  '"Courier New", Courier, monospace',
    fontSerif: 'Georgia, "Times New Roman", serif',
  };

  // ── Resource row renderer ──────────────────────────────────────────────────
  const renderResource = (resource: Resource, i: number, total: number) => {
    const count   = favCounts[resource.url] ?? 0;
    const isFaved = userFavs.has(resource.url);
    const extraTags = (resource.tags ?? []).filter((t) => t !== 'FREE');
    return (
      <div key={resource.url}
        style={{ padding: '10px 18px', borderBottom: i < total - 1 ? `1px solid rgba(14,14,14,0.12)` : 'none', background: i % 2 === 0 ? YB.white : YB.paper }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
          {/* FREE badge — always shown, first badge */}
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', fontSize: '0.625rem', fontWeight: 700, background: '#1a6e3c', color: '#ffffff', border: '1.5px solid #1a6e3c', whiteSpace: 'nowrap', fontFamily: YB.fontMono, letterSpacing: '0.07em', textTransform: 'uppercase', flexShrink: 0 }}>
            ★ FREE
          </span>
          {/* Resource link */}
          <a href={resource.url} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: YB.fontCond, fontWeight: 700, fontSize: '1rem', color: YB.ink, flex: 1, minWidth: 180, textDecoration: 'underline', textDecorationThickness: '1.5px', textUnderlineOffset: '3px', letterSpacing: '0.01em' }}>
            {resource.name}
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          {/* Location badge */}
          {resource.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', fontSize: '0.625rem', fontWeight: 700, background: '#F2C134', color: '#0e0e0e', border: `1.5px solid #0e0e0e`, whiteSpace: 'nowrap', fontFamily: YB.fontMono, letterSpacing: '0.07em', textTransform: 'uppercase', flexShrink: 0 }}>
              📍 {resource.location}
            </span>
          )}
          {/* Tag badges */}
          {extraTags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          {/* Favorite */}
          <FavoriteButton slug={resource.url} count={count} isFaved={isFaved} isLoggedIn={isLoggedIn} onToggle={toggleFavorite} />
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: YB.ink2, lineHeight: 1.65, fontFamily: YB.fontSerif }}>
          {resource.description}
        </p>
      </div>
    );
  };

  // ── Category section renderer ──────────────────────────────────────────────
  const catSection = (cat: { id: string; title: string; emoji: string; description: string; resources: Resource[] }) => {
    const catResources = sortResources(
      (search || activeType !== 'all')
        ? filtered.filter((r) => r.categoryId === cat.id)
        : cat.resources
    );
    if (catResources.length === 0) return null;
    const catFavTotal = catResources.reduce((s, r) => s + (favCounts[r.url] ?? 0), 0);
    return (
      <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'stretch', border: `3px solid ${YB.ink}`, borderBottom: 'none', background: YB.paper }}>
          <div style={{ background: YB.ink, color: YB.paper, padding: '12px 16px', minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, flexShrink: 0 }}>
            <span style={{ fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.14em', color: 'rgba(242,193,52,0.6)' }}>ITEMS</span>
            <strong style={{ fontFamily: YB.fontHeavy, fontSize: 30, lineHeight: 1, fontWeight: 900 }}>{catResources.length}</strong>
          </div>
          <h2 id={`cat-${cat.id}`} style={{ fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 'clamp(18px, 3vw, 30px)', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.05, margin: 0, padding: '10px 18px', flex: 1, alignSelf: 'center', color: YB.ink }}>
            {cat.emoji}&ensp;{cat.title}
          </h2>
          {catFavTotal > 0 && (
            <div style={{ alignSelf: 'center', padding: '0 16px', borderLeft: `2px solid ${YB.ink}`, fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.06em', flexShrink: 0, color: YB.red }}>
              ♥ {catFavTotal}
            </div>
          )}
        </div>
        {/* Description strip */}
        <div style={{ padding: '7px 18px', background: YB.paper2, border: `3px solid ${YB.ink}`, borderTop: `1px solid rgba(14,14,14,0.25)`, borderBottom: 'none' }}>
          <p style={{ margin: 0, fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.04em', color: YB.ink2 }}>{cat.description}</p>
        </div>
        {/* Listings */}
        <div style={{ border: `3px solid ${YB.ink}`, borderTop: `1px solid rgba(14,14,14,0.15)`, marginBottom: 28 }}>
          {catResources.map((resource, i) => renderResource(resource, i, catResources.length))}
        </div>
      </section>
    );
  };

  return (
    <main style={{ background: YB.paper, minHeight: '100vh', borderLeft: `8px solid ${YB.ink}`, borderRight: `8px solid ${YB.ink}`, maxWidth: 1100, margin: '0 auto', boxSizing: 'border-box' }}>
      <a className="sr-only" href="#main-content">Skip to main content</a>
      <h1 className="sr-only">Free Resource Directory — Artistic Accessibility Collective</h1>

      {/* ── Masthead ── */}
      <div style={{ background: YB.ink, color: YB.paper, padding: '7px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: `4px double ${YB.paper}` }}>
        <span>ARTISTICACCESSIBILITY.COM</span>
        <nav aria-label="Site navigation" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <a href="/directory" style={{ color: YB.paper, textDecoration: 'none' }}>Directory</a>
          <a href="/contact"   style={{ color: YB.paper, textDecoration: 'none' }}>Contact</a>
          {isLoggedIn
            ? <a href="/collective" style={{ color: YB.paper, textDecoration: 'none' }}>My Account</a>
            : <a href="/login"      style={{ color: YB.paper, textDecoration: 'none' }}>Log In</a>
          }
        </nav>
      </div>

      {/* ── Logo bar ── */}
      <div style={{ borderBottom: `6px solid ${YB.ink}`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: YB.ink }} aria-label="Artistic Accessibility Collective — Home">
          <div style={{ width: 64, height: 64, background: YB.ink, color: YB.paper, display: 'grid', placeItems: 'center', fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 28, lineHeight: 1, boxShadow: `5px 5px 0 ${YB.ink2}`, flexShrink: 0 }}>
            AAC
          </div>
          <div>
            <div style={{ fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Artistic Accessibility</div>
            <div style={{ fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 5, color: YB.ink2 }}>Collective</div>
          </div>
        </a>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {/* Directory toggle */}
          <button
            onClick={() => setShowDirectory((v) => !v)}
            aria-expanded={showDirectory}
            aria-controls="member-directory-panel"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: showDirectory ? YB.ink : 'transparent', color: showDirectory ? YB.paper : YB.ink, border: `2px solid ${YB.ink}`, padding: '6px 14px', fontFamily: YB.fontCond, fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <span aria-hidden="true">{showDirectory ? '▲' : '▼'}</span>
            Meet Our Members
          </button>
          <div style={{ fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.08em', textAlign: 'right', lineHeight: 1.8, color: YB.ink2 }}>
            <div><strong style={{ color: YB.ink }}>FREE Resource Directory</strong></div>
            <div>May 2026 · {totalCount} verified resources</div>
          </div>
        </div>
      </div>

      {/* ── Member directory panel ── */}
      {showDirectory && (
        <div id="member-directory-panel" style={{ background: YB.white, border: `3px solid ${YB.ink}`, borderTop: 'none', padding: '24px', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 22, textTransform: 'uppercase', margin: '0 0 8px', color: YB.ink }}>
                👥 Meet Our Members
              </h2>
              <p style={{ fontFamily: YB.fontSerif, fontSize: 15, color: YB.ink2, margin: '0 0 14px', lineHeight: 1.7, maxWidth: 560 }}>
                Once members opt in to a public contact card, you&apos;ll be able to browse ASL interpreters,
                captioners, audio describers, and other accessibility professionals right here.
                For now, you can browse the full directory below.
              </p>
              <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: YB.ink, color: YB.paper, padding: '10px 20px', fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Browse the Directory →
              </Link>
            </div>
            <div style={{ fontFamily: YB.fontMono, fontSize: 12, color: YB.ink3, letterSpacing: '0.06em', lineHeight: 1.9, borderLeft: `3px solid ${YB.ink}`, paddingLeft: 20, flexShrink: 0 }}>
              <div><strong style={{ color: YB.ink2 }}>COMING SOON</strong></div>
              <div>Public contact cards</div>
              <div>Member-to-member referrals</div>
              <div>Searchable by specialty</div>
            </div>
          </div>
        </div>
      )}

      {/* ── FREE banner strip ── */}
      <div style={{ background: YB.ink, color: YB.paper, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em' }}>★ ALL {totalCount} RESOURCES ARE FREE</span>
          <span style={{ fontFamily: YB.fontMono, fontSize: 12, color: 'rgba(242,193,52,0.75)', letterSpacing: '0.1em' }}>NO SUBSCRIPTIONS · NO PAYWALLS · NO COST</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagBadge tag="By Disabled People" />
          <TagBadge tag="Deaf / ASL" />
          <TagBadge tag="Captioning" />
          <TagBadge tag="Audio Description" />
          <TagBadge tag="Neurodivergent" />
        </div>
      </div>

      {/* ── Main content ── */}
      <div id="main-content" style={{ padding: '0 24px' }}>

        {/* ── Search ── */}
        <div style={{ padding: '20px 0 16px', borderBottom: `6px solid ${YB.ink}` }}>
          <div style={{ display: 'flex', gap: 0, border: `3px solid ${YB.ink}`, background: YB.white, marginBottom: 10 }}>
            <span style={{ background: YB.ink, color: YB.paper, padding: '14px 20px', fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 16, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', flexShrink: 0 }} aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="2"/>
                <line x1="11.5" y1="11.5" x2="16" y2="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              FIND
            </span>
            <label htmlFor="resource-search" className="sr-only">Search resources</label>
            <input
              id="resource-search"
              type="search"
              placeholder="Search by name, topic, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', padding: '14px 18px', fontFamily: YB.fontSerif, fontSize: 16, background: YB.white, color: YB.ink, outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', borderLeft: `2px solid rgba(14,14,14,0.2)`, padding: '0 14px', fontFamily: YB.fontMono, fontSize: 12, cursor: 'pointer', color: YB.ink2, letterSpacing: '0.06em' }}>
                ✕ CLEAR
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ margin: 0, fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.04em', color: YB.ink2 }}>
              {!isLoggedIn && <><a href="/login" style={{ color: YB.ink, fontWeight: 700 }}>Log in</a> to save favorites · </>}
              {search
                ? <span aria-live="polite">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</span>
                : <span>{totalCount} free resources</span>
              }
            </p>
            <button
              onClick={() => { setShowSubmitForm((v) => !v); setSubmitStatus('idle'); }}
              aria-expanded={showSubmitForm}
              aria-controls="suggest-form"
              style={{ background: showSubmitForm ? YB.red : YB.ink, color: YB.paper, border: 'none', padding: '8px 18px', fontFamily: YB.fontCond, fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span aria-hidden="true">{showSubmitForm ? '✕' : '✚'}</span>
              {showSubmitForm ? 'Close form' : 'Suggest a Resource'}
            </button>
          </div>
        </div>

        {/* ── Suggest form ── */}
        {showSubmitForm && (
          <div id="suggest-form" style={{ background: YB.white, border: `3px solid ${YB.ink}`, borderTop: 'none', padding: '20px 24px', marginBottom: 0 }}>
            <h2 style={{ fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 22, textTransform: 'uppercase', margin: '0 0 4px', color: YB.ink }}>✚ Suggest a Free Resource</h2>
            <p style={{ fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.04em', color: YB.ink2, margin: '0 0 16px' }}>
              All resources must be free to access. Every suggestion is reviewed before being added.
            </p>
            {submitStatus === 'success' ? (
              <div role="status" style={{ background: YB.paper, border: `2px solid ${YB.ink}`, padding: '12px 16px', fontFamily: YB.fontMono, fontSize: 13, letterSpacing: '0.04em', color: YB.ink }}>
                {isLoggedIn
                  ? <><strong>Your resource is live!</strong> Added to the directory — admin notified. Thank you!</>
                  : <><strong>Thank you!</strong> Received and will be reviewed before adding.</>
                }
                {' '}<button onClick={() => setSubmitStatus('idle')} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit', color: YB.ink }}>Suggest another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate aria-label="Suggest a free resource">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="sub-name" style={{ display: 'block', fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, color: YB.ink }}>
                      Resource Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                    </label>
                    <input id="sub-name" type="text" value={submitName} onChange={(e) => setSubmitName(e.target.value)} required placeholder="e.g. DCMP Captioning Key"
                      style={{ width: '100%', border: `2px solid ${YB.ink}`, padding: '9px 12px', fontFamily: YB.fontSerif, fontSize: 15, background: YB.white, color: YB.ink, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label htmlFor="sub-url" style={{ display: 'block', fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, color: YB.ink }}>
                      URL <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                    </label>
                    <input id="sub-url" type="url" value={submitUrl} onChange={(e) => setSubmitUrl(e.target.value)} required placeholder="https://…"
                      style={{ width: '100%', border: `2px solid ${YB.ink}`, padding: '9px 12px', fontFamily: YB.fontMono, fontSize: 13, background: YB.white, color: YB.ink, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label htmlFor="sub-cat" style={{ display: 'block', fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, color: YB.ink }}>Region (optional)</label>
                    <select id="sub-cat" value={submitCategory} onChange={(e) => setSubmitCategory(e.target.value)}
                      style={{ width: '100%', border: `2px solid ${YB.ink}`, padding: '9px 12px', fontFamily: YB.fontMono, fontSize: 13, background: YB.white, color: YB.ink, boxSizing: 'border-box' }}>
                      <option value="">— pick one —</option>
                      {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>)}
                      <option value="other">Other / Not sure</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="sub-desc" style={{ display: 'block', fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, color: YB.ink }}>Why is it valuable?</label>
                    <textarea id="sub-desc" rows={3} value={submitDescription} onChange={(e) => setSubmitDescription(e.target.value)} placeholder="What does it cover? Who is it for?"
                      style={{ width: '100%', border: `2px solid ${YB.ink}`, padding: '9px 12px', fontFamily: YB.fontSerif, fontSize: 15, background: YB.white, color: YB.ink, resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                      <legend style={{ fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, color: YB.ink }}>Labels — check all that apply</legend>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {ALL_TAGS.map((tag) => (
                          <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input type="checkbox" checked={submitTags.includes(tag)} onChange={() => toggleTag(tag)} style={{ accentColor: YB.ink, width: 16, height: 16 }} />
                            <TagBadge tag={tag} />
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                  <div>
                    <label htmlFor="sub-pname" style={{ display: 'block', fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, color: YB.ink }}>Your Name (optional)</label>
                    <input id="sub-pname" type="text" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} placeholder="So we can credit you"
                      style={{ width: '100%', border: `2px solid ${YB.ink}`, padding: '9px 12px', fontFamily: YB.fontSerif, fontSize: 15, background: YB.white, color: YB.ink, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label htmlFor="sub-pemail" style={{ display: 'block', fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, color: YB.ink }}>Your Email (optional)</label>
                    <input id="sub-pemail" type="email" value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} placeholder="In case we have questions"
                      style={{ width: '100%', border: `2px solid ${YB.ink}`, padding: '9px 12px', fontFamily: YB.fontMono, fontSize: 13, background: YB.white, color: YB.ink, boxSizing: 'border-box' }} />
                  </div>
                </div>
                {submitError && <p role="alert" style={{ color: YB.red, fontFamily: YB.fontMono, fontSize: 13, margin: '8px 0 0', letterSpacing: '0.04em' }}>{submitError}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button type="submit" disabled={submitLoading}
                    style={{ background: YB.ink, color: YB.paper, border: `2px solid ${YB.ink}`, padding: '10px 22px', fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 14, letterSpacing: '0.04em', cursor: 'pointer', textTransform: 'uppercase' }}>
                    {submitLoading ? 'Submitting…' : 'Submit Suggestion'}
                  </button>
                  <button type="button" onClick={() => setShowSubmitForm(false)}
                    style={{ background: 'transparent', color: YB.ink, border: `2px solid ${YB.ink}`, padding: '10px 18px', fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 14, letterSpacing: '0.04em', cursor: 'pointer', textTransform: 'uppercase' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Type index ── */}
        <div style={{ padding: '20px 0 4px', borderBottom: `6px solid ${YB.ink}`, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 18, marginBottom: 14 }}>
            <h2 style={{ fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0, color: YB.ink }}>
              📋 Browse by Type
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setSortPopular((v) => !v)} aria-pressed={sortPopular}
                style={{ background: sortPopular ? YB.red : 'transparent', color: sortPopular ? YB.paper : YB.red, border: `2px solid ${YB.red}`, padding: '5px 14px', fontFamily: YB.fontCond, fontWeight: 700, fontSize: 14, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ♥ Popular
              </button>
            </div>
          </div>

          {/* Type rows — dotted leader lines */}
          <div role="list" style={{ borderTop: `2px solid ${YB.ink}` }}>
            {TYPE_INDEX.map(({ type, label, icon }) => {
              const count = type === 'all' ? totalCount : (typeCounts[type as ResourceType] ?? 0);
              const isActive = activeType === type;
              return (
                <div role="listitem" key={type}>
                  <button
                    onClick={() => setActiveType(type)}
                    aria-pressed={isActive}
                    style={{ display: 'flex', alignItems: 'baseline', width: '100%', padding: '9px 0', background: 'none', border: 'none', borderBottom: `1px dotted ${YB.ink}`, cursor: 'pointer', textAlign: 'left', color: YB.ink }}
                  >
                    <span style={{ fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: '-0.005em', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {isActive && <span aria-hidden="true" style={{ color: YB.red, fontSize: 18 }}>☞</span>}
                      <span aria-hidden="true" style={{ fontSize: 17 }}>{icon}</span>
                      {label}
                    </span>
                    <span style={{ flex: 1, borderBottom: `2px dotted rgba(14,14,14,0.35)`, margin: '0 12px 4px' }} aria-hidden="true" />
                    <span style={{ fontFamily: YB.fontMono, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: isActive ? YB.red : YB.ink, flexShrink: 0 }}>
                      {count}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active filter pill */}
          {activeType !== 'all' && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: YB.fontMono, fontSize: 12, color: YB.ink2, letterSpacing: '0.06em' }}>Showing:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: YB.red, color: YB.paper, padding: '4px 12px', fontFamily: YB.fontCond, fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {TYPE_INDEX.find((t) => t.type === activeType)?.icon}{' '}
                {TYPE_INDEX.find((t) => t.type === activeType)?.label}
                <button onClick={() => setActiveType('all')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: YB.fontMono, fontSize: 14, padding: 0, lineHeight: 1 }} aria-label="Clear type filter">✕</button>
              </span>
              <span style={{ fontFamily: YB.fontMono, fontSize: 12, color: YB.ink2 }}>{filtered.length} resource{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* ── Region sections ── */}
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 24px', border: `3px solid ${YB.ink}`, textAlign: 'center', fontFamily: YB.fontSerif, fontSize: 18, color: YB.ink2, marginBottom: 24 }}>
            No resources found{search ? <> for &ldquo;{search}&rdquo;</> : ''}.{' '}
            <button onClick={() => { setSearch(''); setActiveType('all'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit', color: YB.ink }}>Clear filters</button>
          </div>
        ) : (
          visibleCategories.map((cat) => catSection(cat))
        )}

        {/* ── Member-submitted resources ── */}
        {memberResources.length > 0 && (
          <section aria-labelledby="member-heading" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'stretch', border: `3px solid ${YB.ink}`, borderBottom: 'none', background: YB.paper }}>
              <div style={{ background: YB.red, color: YB.paper, padding: '12px 16px', minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, flexShrink: 0 }}>
                <span style={{ fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.14em' }}>MEMBER</span>
                <strong style={{ fontFamily: YB.fontHeavy, fontSize: 30, lineHeight: 1, fontWeight: 900 }}>{memberResources.length}</strong>
                <span style={{ fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.1em' }}>PICKS</span>
              </div>
              <h2 id="member-heading" style={{ fontFamily: YB.fontHeavy, fontWeight: 900, fontSize: 'clamp(18px, 3vw, 30px)', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.05, margin: 0, padding: '10px 18px', flex: 1, alignSelf: 'center', color: YB.ink }}>
                ✨ Member-Submitted Resources
              </h2>
            </div>
            <div style={{ padding: '7px 18px', background: YB.paper2, border: `3px solid ${YB.ink}`, borderTop: `1px solid rgba(14,14,14,0.25)`, borderBottom: 'none' }}>
              <p style={{ margin: 0, fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.04em', color: YB.ink2 }}>
                Resources submitted by Collective members — reviewed and added directly. All free to access.
              </p>
            </div>
            <div style={{ border: `3px solid ${YB.ink}`, borderTop: `1px solid rgba(14,14,14,0.15)`, marginBottom: 28 }}>
              {memberResources.map((resource, i) => {
                const count = favCounts[resource.url] ?? 0;
                const isFaved = userFavs.has(resource.url);
                return (
                  <div key={resource.url} style={{ padding: '10px 18px', borderBottom: i < memberResources.length - 1 ? `1px solid rgba(14,14,14,0.12)` : 'none', background: i % 2 === 0 ? YB.white : YB.paper }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ display: 'inline-flex', padding: '2px 7px', fontSize: '0.625rem', fontWeight: 700, border: `1.5px solid ${YB.red}`, whiteSpace: 'nowrap', fontFamily: YB.fontMono, letterSpacing: '0.07em', textTransform: 'uppercase', background: YB.red, color: YB.paper, flexShrink: 0 }}>★ FREE · Member Pick</span>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: YB.fontCond, fontWeight: 700, fontSize: '1rem', color: YB.ink, flex: 1, minWidth: 180, textDecoration: 'underline' }}>
                        {resource.name}<span className="sr-only"> (opens in new tab)</span>
                      </a>
                      {(resource.tags ?? []).filter((t) => t !== 'FREE').map((tag) => <TagBadge key={tag} tag={tag} />)}
                      <FavoriteButton slug={resource.url} count={count} isFaved={isFaved} isLoggedIn={isLoggedIn} onToggle={toggleFavorite} />
                    </div>
                    {resource.description && <p style={{ margin: 0, fontSize: '0.875rem', color: YB.ink2, lineHeight: 1.65, fontFamily: YB.fontSerif }}>{resource.description}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <footer aria-label="Site footer" style={{ borderTop: `6px solid ${YB.ink}`, padding: '16px 24px', fontFamily: YB.fontMono, fontSize: 12, letterSpacing: '0.08em', color: YB.ink2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>Free resource directory · May 2026 · All {totalCount} resources verified free at time of publication.</span>
        <nav aria-label="Footer links" style={{ display: 'flex', gap: 20 }}>
          <a href="/" style={{ color: YB.ink }}>Home</a>
          <a href="/directory" style={{ color: YB.ink }}>Directory</a>
          <a href="/contact" style={{ color: YB.ink }}>Contact</a>
        </nav>
      </footer>

      <style>{`
        #resource-search:focus-visible { outline: 3px solid #1851d6; outline-offset: 2px; }
        a:focus-visible { outline: 3px solid #1851d6; outline-offset: 3px; border-radius: 1px; }
        button:focus-visible { outline: 3px solid #1851d6; outline-offset: 3px; }
        input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 3px solid #1851d6; outline-offset: 0; }
        @media (max-width: 600px) {
          .yb-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
