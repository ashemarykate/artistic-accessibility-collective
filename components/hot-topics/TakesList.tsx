'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// The approved takes for one topic, read in the browser with the public
// (anon) key. The database only ever hands out rows with status approved, and
// this asks for just the five columns that are safe to show.
//
// Supabase returns errors instead of throwing, so every call is checked.
// Take text is plain text: React escapes it, and the CSS keeps its line breaks.

const PAGE_SIZE = 20;

interface Take {
  id: string;
  body: string;
  display_name: string | null;
  from_member: boolean;
  created_at: string;
}

type LoadState = 'loading' | 'ready' | 'error' | 'unavailable';

interface PageResult {
  rows: Take[];
  more: boolean;
  problem?: 'unavailable' | 'failed';
}

async function fetchTakes(topic: string, offset: number): Promise<PageResult> {
  try {
    // One extra row tells us whether there is another page.
    const { data, error } = await supabase
      .from('topic_takes')
      .select('id, body, display_name, from_member, created_at')
      .eq('topic_slug', topic)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE);
    if (error) {
      // The table does not exist yet (the migration has not been applied).
      const missing = error.code === 'PGRST205' || error.code === '42P01';
      return { rows: [], more: false, problem: missing ? 'unavailable' : 'failed' };
    }
    const rows = (data ?? []) as Take[];
    return { rows: rows.slice(0, PAGE_SIZE), more: rows.length > PAGE_SIZE };
  } catch {
    return { rows: [], more: false, problem: 'failed' };
  }
}

function whoWrote(t: Take): string {
  const name = t.display_name?.trim();
  if (name) return name;
  return t.from_member ? 'A member' : 'A reader';
}

function whenWrote(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function TakesList({ topic }: { topic: string }) {
  const [takes, setTakes] = useState<Take[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // After Try again works, the button is gone, so focus moves to the heading.
  const focusHeadingRef = useRef(false);
  // After Show more, focus moves to the first take that was just added.
  const focusIndexRef = useRef<number | null>(null);

  const applyFirstPage = useCallback((result: PageResult) => {
    if (result.problem) {
      setState(result.problem === 'unavailable' ? 'unavailable' : 'error');
      return;
    }
    setTakes(result.rows);
    setHasMore(result.more);
    setState('ready');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTakes(topic, 0).then((result) => {
      if (!cancelled) applyFirstPage(result);
    });
    return () => {
      cancelled = true;
    };
  }, [topic, applyFirstPage]);

  useEffect(() => {
    if (focusIndexRef.current === null) return;
    const items = listRef.current?.querySelectorAll<HTMLElement>('[data-take]');
    const target = items?.[focusIndexRef.current];
    focusIndexRef.current = null;
    target?.focus();
  }, [takes]);

  useEffect(() => {
    if (!focusHeadingRef.current || (state !== 'ready' && state !== 'unavailable')) return;
    focusHeadingRef.current = false;
    headingRef.current?.focus();
  }, [state]);

  // The error block stays on screen while it tries again, so the button the
  // person pressed keeps focus. Only when it works does focus move on.
  async function retry() {
    if (retrying) return;
    setRetrying(true);
    const result = await fetchTakes(topic, 0);
    setRetrying(false);
    // 'failed' keeps the error block (and the button's focus). Anything else replaces it.
    focusHeadingRef.current = result.problem !== 'failed';
    applyFirstPage(result);
  }

  async function showMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    setMoreFailed(false);
    const result = await fetchTakes(topic, takes.length);
    setLoadingMore(false);
    if (result.problem) {
      setMoreFailed(true);
      return;
    }
    focusIndexRef.current = takes.length;
    setTakes((prev) => [...prev, ...result.rows]);
    setHasMore(result.more);
  }

  return (
    <section className="ht-takes" aria-labelledby="ht-takes-h">
      <h3 id="ht-takes-h" className="ht-display ht-takes-h" tabIndex={-1} ref={headingRef}>
        Takes so far
      </h3>
      {/* One status line that is always on the page, so "Trying again" is announced. */}
      <p className="ht-sr" role="status">
        {retrying ? 'Trying again.' : ''}
      </p>

      {state === 'loading' && (
        <p className="ht-takes-msg" role="status">
          Loading takes
        </p>
      )}

      {state === 'unavailable' && (
        <p className="ht-takes-msg" role="status">
          Takes are not open yet. Check back soon.
        </p>
      )}

      {state === 'error' && (
        <div className="ht-takes-error" role="alert">
          <p>We could not load the takes just now.</p>
          <button type="button" className="ht-btn ht-btn--ghost" aria-disabled={retrying} onClick={retry}>
            {retrying ? 'Trying again' : 'Try again'}
          </button>
        </div>
      )}

      {state === 'ready' && takes.length === 0 && (
        <p className="ht-takes-msg" role="status">
          No takes are up yet.
        </p>
      )}

      {state === 'ready' && takes.length > 0 && (
        <>
          <ul className="ht-take-list" role="list" ref={listRef}>
            {takes.map((t) => (
              <li key={t.id}>
                <article className="ht-take ht-on-paper" data-take tabIndex={-1}>
                  <p className="ht-take-text">{t.body}</p>
                  <footer>
                    {whoWrote(t)}
                    {whenWrote(t.created_at) && (
                      <>
                        {' '}
                        &middot; <time dateTime={t.created_at}>{whenWrote(t.created_at)}</time>
                      </>
                    )}
                  </footer>
                </article>
              </li>
            ))}
          </ul>
          {moreFailed && (
            <p className="ht-takes-msg" role="alert">
              We could not load more takes just now. Try again.
            </p>
          )}
          {hasMore && (
            <button
              type="button"
              className="ht-btn ht-btn--ghost"
              aria-disabled={loadingMore}
              onClick={showMore}
            >
              {loadingMore ? 'Loading more takes' : 'Show more takes'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
