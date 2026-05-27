'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RESOURCE_BY_SLUG } from '@/lib/resources-data';
import { LIBRARY_ITEMS, type LibraryItem } from '@/lib/library-data';
import { CINEMA_ITEMS, type CinemaItem } from '@/lib/cinema-data';
import BrowserChrome from '@/components/BrowserChrome';

type SavedResource = { slug: string; name: string; categoryTitle: string };
type LoadState = 'loading' | 'ready' | 'error';

export default function MyResourcesPage() {
  const router = useRouter();
  const [state,        setState       ] = useState<LoadState>('loading');
  const [resources,    setResources   ] = useState<SavedResource[]>([]);
  const [libItems,     setLibItems    ] = useState<LibraryItem[]>([]);
  const [cinemaItems,  setCinemaItems ] = useState<CinemaItem[]>([]);

  useEffect(() => {
    document.title = 'My Resources · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [
        { data: resFavs  },
        { data: libFavs  },
        { data: cinFavs  },
      ] = await Promise.all([
        supabase.from('resource_favorites').select('resource_slug').eq('user_id', user.id),
        supabase.from('content_favorites').select('item_slug').eq('user_id', user.id).eq('section', 'library'),
        supabase.from('content_favorites').select('item_slug').eq('user_id', user.id).eq('section', 'cinema'),
      ]);

      if (resFavs?.length) {
        const saved: SavedResource[] = resFavs
          .map((r) => {
            const info = RESOURCE_BY_SLUG[r.resource_slug];
            return info ? { slug: r.resource_slug, name: info.name, categoryTitle: info.categoryTitle } : null;
          })
          .filter((r): r is SavedResource => r !== null);
        setResources(saved);
      }

      if (libFavs?.length) {
        const slugSet = new Set(libFavs.map((r) => r.item_slug));
        setLibItems(LIBRARY_ITEMS.filter((i) => slugSet.has(i.slug)));
      }

      if (cinFavs?.length) {
        const slugSet = new Set(cinFavs.map((r) => r.item_slug));
        setCinemaItems(CINEMA_ITEMS.filter((i) => slugSet.has(i.slug)));
      }

      setState('ready');
    }

    load().catch(() => setState('error'));
  }, [router]);

  const totalSaved = resources.length + libItems.length + cinemaItems.length;

  return (
    <BrowserChrome
      variant="netscape"
      title="My Resources — Artistic Accessibility Collective"
      url="http://members.artisticaccessibility.com/my-resources"
    >
    <main
      aria-label="My Resources"
      style={{
        minHeight: '100%',
        background: 'var(--aac-blue)',
        padding: '2.5rem 1.5rem 4rem',
        fontFamily: '"Tahoma", "MS Sans Serif", Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Back link */}
        <Link
          href="/collective"
          style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', textDecoration: 'underline', display: 'inline-block', marginBottom: '1.5rem' }}
        >
          ← Back to hub
        </Link>

        {/* Page heading */}
        <h1 style={{ color: '#fff', fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.25rem', letterSpacing: '0.01em' }}>
          ♥ My Resources
        </h1>
        {state === 'ready' && (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem', margin: '0 0 2rem', lineHeight: 1.5 }}>
            {totalSaved === 0
              ? 'Nothing saved yet. Heart items in the Library, Cinema, or Resources to save them here.'
              : `${totalSaved} item${totalSaved !== 1 ? 's' : ''} saved across your collections.`}
          </p>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div role="status" aria-label="Loading your saved items" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', padding: '2rem 0' }}>
            Loading…
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div role="alert" style={{ color: '#ffaaaa', fontSize: '0.875rem', padding: '2rem 0' }}>
            Something went wrong loading your saves. Please refresh and try again.
          </div>
        )}

        {/* Content */}
        {state === 'ready' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── My Library ─────────────────────────────────────────── */}
            <SavedSection
              title="My Library"
              href="/library"
              browseLinkLabel="Browse The Library"
              emptyText="Heart items in The Library to save them here."
              isEmpty={libItems.length === 0}
            >
              {libItems.map((item) => (
                <SavedRow
                  key={item.slug}
                  href={`/library/${item.slug}`}
                  title={item.title}
                  subtitle={item.author}
                  year={item.year}
                  badge={item.isFree ? 'Free' : undefined}
                  isEssential={item.isEssential}
                />
              ))}
            </SavedSection>

            {/* ── My Cinema ──────────────────────────────────────────── */}
            <SavedSection
              title="My Cinema"
              href="/cinema"
              browseLinkLabel="Browse The Cinema"
              emptyText="Heart items in The Cinema to save them here."
              isEmpty={cinemaItems.length === 0}
            >
              {cinemaItems.map((item) => (
                <SavedRow
                  key={item.slug}
                  href={`/cinema/${item.slug}`}
                  title={item.title}
                  subtitle={item.director ? `dir. ${item.director}` : (item.creator ?? '')}
                  year={item.year}
                  badge={item.isFree ? 'Free' : undefined}
                  isEssential={item.isEssential}
                />
              ))}
            </SavedSection>

            {/* ── Accessibility Resources ────────────────────────────── */}
            <SavedSection
              title="My Accessibility Resources"
              href="/resources"
              browseLinkLabel="Browse Resources"
              emptyText="Heart items in Accessibility Resources to save them here."
              isEmpty={resources.length === 0}
            >
              {resources.map((r) => (
                <SavedRow
                  key={r.slug}
                  href={r.slug}
                  title={r.name}
                  subtitle={r.categoryTitle}
                  external
                />
              ))}
            </SavedSection>

          </div>
        )}

      </div>

      <style>{`
        .my-res-row:hover, .my-res-row:focus-visible {
          background: rgba(255,255,255,0.14) !important;
          color: #ffffff !important;
          outline: 2px solid var(--aac-yellow, #f5d84a);
          outline-offset: -2px;
        }
        .my-res-back:hover, .my-res-back:focus-visible {
          color: rgba(255,255,255,0.9) !important;
        }
      `}</style>
    </main>
    </BrowserChrome>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SavedSection({
  title, href, browseLinkLabel, emptyText, isEmpty, children,
}: {
  title: string;
  href: string;
  browseLinkLabel: string;
  emptyText: string;
  isEmpty: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {title}
        </h2>
        <Link
          href={href}
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textDecoration: 'underline' }}
          className="my-res-back"
        >
          {browseLinkLabel} →
        </Link>
      </div>

      {/* List or empty state */}
      {isEmpty ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', margin: 0, padding: '0.75rem 0', fontStyle: 'italic' }}>
          {emptyText}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
          {children}
        </ul>
      )}
    </section>
  );
}

// ── Individual saved row ──────────────────────────────────────────────────────

function SavedRow({
  href, title, subtitle, year, badge, isEssential, external,
}: {
  href: string;
  title: string;
  subtitle?: string;
  year?: number;
  badge?: string;
  isEssential?: boolean;
  external?: boolean;
}) {
  const linkProps = external
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  return (
    <li style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <a
        href={href}
        {...linkProps}
        className="my-res-row"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          textDecoration: 'none',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '0.8125rem',
          lineHeight: 1.45,
          flexWrap: 'wrap',
        }}
      >
        {isEssential && <span aria-label="Essential pick" style={{ color: '#f5d84a', flexShrink: 0, fontSize: '0.75rem' }}>★</span>}
        <span style={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
          {title}
          {external && <span className="sr-only"> (opens in new tab)</span>}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {subtitle}{subtitle && year ? ' · ' : ''}{year ?? ''}
          {badge && <span style={{ marginLeft: 6, background: 'rgba(77,255,124,0.2)', color: '#4dff7c', padding: '0 5px', borderRadius: 2, fontSize: '0.6875rem', fontWeight: 700 }}>{badge}</span>}
        </span>
      </a>
    </li>
  );
}
