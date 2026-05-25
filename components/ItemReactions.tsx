'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Palette  = 'amber' | 'blue' | 'print';
type Reaction = 'thumbs_up' | 'thumbs_down' | 'heart';
type Counts   = { thumbs_up: number; thumbs_down: number; heart: number };

type Props = {
  itemSlug: string;
  itemType: 'library' | 'cinema';
  /** 'amber' = library OPAC, 'blue' = cinema dark (legacy), 'print' = cinema print aesthetic */
  palette?: Palette;
  /** When true: show 1–5 star rating + heart instead of thumbs + heart */
  starMode?: boolean;
};

const THUMB_LABEL: Record<Reaction, string> = {
  thumbs_up:   'Helpful',
  thumbs_down: 'Not helpful',
  heart:       'Save to my profile',
};

const PAL: Record<Palette, {
  bg: string; border: string; active: string; activeTxt: string;
  text: string; dim: string; heart: string; mono: string;
  starFilled: string; starEmpty: string;
}> = {
  amber: {
    bg: '#0f140e', border: '#ffb000', active: '#ffb000', activeTxt: '#0f140e',
    text: '#ffb000', dim: '#b87800', heart: '#ff6b6b',
    mono: '"Courier New", Courier, monospace',
    starFilled: '#ffb000', starEmpty: '#b87800',
  },
  blue: {
    bg: '#062586', border: '#fcdd2c', active: '#fcdd2c', activeTxt: '#062586',
    text: '#fcdd2c', dim: '#c8d5ff', heart: '#ff3b8d',
    mono: '"Arial Narrow", Arial, sans-serif',
    starFilled: '#fcdd2c', starEmpty: '#8099cc',
  },
  print: {
    bg: '#ffffff', border: '#0c1e3e', active: '#0c1e3e', activeTxt: '#ffffff',
    text: '#0c1e3e', dim: '#666666', heart: '#c01a1a',
    mono: '"Arial Narrow", Arial, sans-serif',
    starFilled: '#c8a800', starEmpty: '#cccccc',
  },
};

export default function ItemReactions({
  itemSlug,
  itemType,
  palette = 'amber',
  starMode = false,
}: Props) {
  const C = PAL[palette];

  // ── Thumbs / heart state ─────────────────────────────────────────────────────
  const [counts,   setCounts  ] = useState<Counts>({ thumbs_up: 0, thumbs_down: 0, heart: 0 });
  const [mine,     setMine    ] = useState<Set<Reaction>>(new Set());
  const [toggling, setToggling] = useState<Reaction | null>(null);

  // ── Star rating state ────────────────────────────────────────────────────────
  const [avgRating,     setAvgRating    ] = useState<number | null>(null);
  const [ratingCount,   setRatingCount  ] = useState(0);
  const [myRating,      setMyRating     ] = useState<number | null>(null);
  const [hoverStar,     setHoverStar    ] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // ── Auth / UI state ──────────────────────────────────────────────────────────
  const [userId,      setUserId     ] = useState<string | null>(null);
  const [loading,     setLoading    ] = useState(true);
  const [loginPrompt, setLoginPrompt] = useState(false);

  const fetchData = useCallback(async (uid: string | null) => {
    // Always fetch heart count (and thumbs in non-star mode)
    const { data: reactionRows } = await supabase
      .from('item_reactions')
      .select('reaction, user_id')
      .eq('item_slug', itemSlug)
      .eq('item_type', itemType);

    const c: Counts = { thumbs_up: 0, thumbs_down: 0, heart: 0 };
    const mySet = new Set<Reaction>();
    reactionRows?.forEach((r) => {
      if (r.reaction in c) c[r.reaction as Reaction]++;
      if (uid && r.user_id === uid) mySet.add(r.reaction as Reaction);
    });
    setCounts(c);
    setMine(mySet);

    // Fetch star ratings only in starMode
    if (starMode) {
      const { data: ratingRows } = await supabase
        .from('item_ratings')
        .select('rating, user_id')
        .eq('item_slug', itemSlug)
        .eq('item_type', itemType);

      if (ratingRows && ratingRows.length > 0) {
        const total = ratingRows.reduce((sum, r) => sum + r.rating, 0);
        setAvgRating(total / ratingRows.length);
        setRatingCount(ratingRows.length);
        if (uid) {
          const myRow = ratingRows.find((r) => r.user_id === uid);
          setMyRating(myRow?.rating ?? null);
        }
      } else {
        setAvgRating(null);
        setRatingCount(0);
        setMyRating(null);
      }
    }
  }, [itemSlug, itemType, starMode]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      fetchData(uid).finally(() => setLoading(false));
    });
  }, [fetchData]);

  // ── Toggle thumbs / heart ────────────────────────────────────────────────────
  async function toggle(reaction: Reaction) {
    if (!userId) {
      setLoginPrompt(true);
      setTimeout(() => setLoginPrompt(false), 4000);
      return;
    }
    setToggling(reaction);
    const isActive = mine.has(reaction);

    const newMine   = new Set(mine);
    const newCounts = { ...counts };
    if (isActive) { newMine.delete(reaction); newCounts[reaction] = Math.max(0, newCounts[reaction] - 1); }
    else           { newMine.add(reaction);    newCounts[reaction]++; }
    setMine(newMine);
    setCounts(newCounts);

    if (isActive) {
      await supabase.from('item_reactions').delete()
        .eq('user_id', userId).eq('item_slug', itemSlug)
        .eq('item_type', itemType).eq('reaction', reaction);
    } else {
      await supabase.from('item_reactions').insert(
        { user_id: userId, item_slug: itemSlug, item_type: itemType, reaction }
      );
    }
    setToggling(null);
  }

  // ── Set star rating (upsert) ─────────────────────────────────────────────────
  async function rateStar(stars: number) {
    if (!userId || ratingLoading) return;
    setRatingLoading(true);
    const prevRating = myRating;
    const prevAvg    = avgRating;
    const prevCount  = ratingCount;

    // Optimistic update
    setMyRating(stars);
    if (prevRating === null) {
      const nc = prevCount + 1;
      setRatingCount(nc);
      setAvgRating(((prevAvg ?? 0) * prevCount + stars) / nc);
    } else {
      setAvgRating(((prevAvg ?? 0) * prevCount - prevRating + stars) / prevCount);
    }

    const { error } = await supabase.from('item_ratings').upsert(
      { user_id: userId, item_slug: itemSlug, item_type: itemType, rating: stars, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,item_slug,item_type' }
    );
    if (error) {
      // Roll back
      setMyRating(prevRating);
      setAvgRating(prevAvg);
      setRatingCount(prevCount);
    }
    setRatingLoading(false);
  }

  if (loading) {
    return <div style={{ fontFamily: C.mono, fontSize: 12, color: C.dim, padding: '10px 0' }} aria-busy="true">Loading…</div>;
  }

  const displayStars = hoverStar ?? myRating ?? 0;

  return (
    <div>
      {starMode ? (
        // ── Star rating + heart (cinema) ─────────────────────────────────────
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>

          {/* Star block */}
          <div>
            {ratingCount > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  aria-label={`Average community rating: ${avgRating!.toFixed(1)} out of 5 from ${ratingCount} rating${ratingCount !== 1 ? 's' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span aria-hidden="true" style={{ fontSize: 24, letterSpacing: 1, lineHeight: 1 }}>
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} style={{ color: s <= Math.round(avgRating!) ? C.starFilled : C.starEmpty }}>★</span>
                    ))}
                  </span>
                  <span style={{ fontFamily: C.mono, fontWeight: 700, fontSize: 14, color: C.text }}>
                    {avgRating!.toFixed(1)}
                  </span>
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>
                    ({ratingCount} rating{ratingCount !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            )}

            {userId ? (
              <div>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {myRating ? `Your rating: ${myRating}/5 — click to change` : 'Rate this:'}
                </div>
                <div
                  role="group"
                  aria-label="Rate this out of 5 stars"
                  style={{ display: 'flex', gap: 2 }}
                  onMouseLeave={() => setHoverStar(null)}
                >
                  {[1,2,3,4,5].map((s) => (
                    <button
                      key={s}
                      onClick={() => rateStar(s)}
                      onMouseEnter={() => setHoverStar(s)}
                      disabled={ratingLoading}
                      aria-label={`${s} star${s !== 1 ? 's' : ''}`}
                      aria-pressed={myRating === s}
                      style={{
                        background: 'none', border: 'none', padding: '1px 3px',
                        cursor: ratingLoading ? 'default' : 'pointer',
                        fontSize: 30, lineHeight: 1,
                        color: s <= displayStars ? C.starFilled : C.starEmpty,
                        transition: 'color 0.08s',
                        opacity: ratingLoading ? 0.5 : 1,
                      }}
                      className="star-btn"
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              ratingCount === 0 ? (
                <div style={{ fontFamily: C.mono, fontSize: 12, color: C.dim }}>
                  No ratings yet —{' '}
                  <a href="/login" style={{ color: C.text, fontWeight: 700, textDecoration: 'underline' }}>log in</a> to be first.
                </div>
              ) : (
                <div style={{ fontFamily: C.mono, fontSize: 12, color: C.dim }}>
                  <a href="/login" style={{ color: C.text, fontWeight: 700, textDecoration: 'underline' }}>Log in</a> to add your rating.
                </div>
              )
            )}
          </div>

          {/* Heart / Save */}
          <div style={{ borderLeft: `1px solid ${C.starEmpty}`, paddingLeft: 24 }}>
            <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Save to profile
            </div>
            <button
              onClick={() => toggle('heart')}
              disabled={toggling === 'heart'}
              aria-pressed={mine.has('heart')}
              aria-label={`Save to my profile${counts.heart > 0 ? ` (${counts.heart} saved)` : ''}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 14px',
                background: mine.has('heart') ? C.heart : 'transparent',
                color:      mine.has('heart') ? '#fff'  : C.heart,
                border: `2px solid ${C.heart}`,
                fontFamily: C.mono, fontSize: 14,
                cursor: toggling === 'heart' ? 'default' : 'pointer',
                opacity: toggling === 'heart' ? 0.6 : 1,
                transition: 'background 0.15s, color 0.15s',
              }}
              className="item-reaction-btn"
            >
              <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>♥</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>
                {mine.has('heart') ? 'Saved' : 'Save'}
              </span>
              {counts.heart > 0 && (
                <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 2 }}>{counts.heart}</span>
              )}
            </button>
          </div>
        </div>

      ) : (
        // ── Thumbs + heart (library) ──────────────────────────────────────────
        <div role="group" aria-label="React to this item" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {(['thumbs_up', 'thumbs_down', 'heart'] as Reaction[]).map((r) => {
            const active = mine.has(r);
            const busy   = toggling === r;
            return (
              <button
                key={r}
                onClick={() => toggle(r)}
                disabled={busy}
                aria-pressed={active}
                aria-label={`${THUMB_LABEL[r]}${counts[r] > 0 ? ` (${counts[r]})` : ''}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px',
                  background: active ? (r === 'heart' ? C.heart : C.active) : 'transparent',
                  color:      active ? (r === 'heart' ? '#fff' : C.activeTxt) : C.text,
                  border: `2px solid ${active ? (r === 'heart' ? C.heart : C.active) : C.border}`,
                  fontFamily: C.mono, fontSize: 15,
                  cursor: busy ? 'default' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  borderRadius: 2,
                }}
                className="item-reaction-btn"
              >
                <span aria-hidden="true" style={{ fontSize: 17, lineHeight: 1 }}>
                  {r === 'thumbs_up' ? '👍' : r === 'thumbs_down' ? '👎' : '♥'}
                </span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  {counts[r] > 0 ? counts[r] : ''}
                </span>
                {r === 'heart' && (
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{active ? 'Saved' : 'Save'}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {loginPrompt && (
        <p role="status" aria-live="polite" style={{ marginTop: 10, fontFamily: C.mono, fontSize: 13, color: C.dim }}>
          <a href="/login" style={{ color: C.text, textDecoration: 'underline', fontWeight: 700 }}>Log in</a>{' '}
          to react and save items to your profile.
        </p>
      )}

      <style>{`
        .item-reaction-btn:focus-visible { outline: 3px solid #f5d84a; outline-offset: 2px; }
        .star-btn:focus-visible { outline: 3px solid #f5d84a; outline-offset: 2px; border-radius: 2px; }
      `}</style>
    </div>
  );
}
