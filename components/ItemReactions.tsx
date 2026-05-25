'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Reaction = 'thumbs_up' | 'thumbs_down' | 'heart';

type Counts = { thumbs_up: number; thumbs_down: number; heart: number };

type Props = {
  itemSlug: string;
  itemType: 'library' | 'cinema';
  /** palette: 'amber' for library, 'blue' for cinema */
  palette?: 'amber' | 'blue';
};

const EMOJI: Record<Reaction, string> = {
  thumbs_up:   '👍',
  thumbs_down: '👎',
  heart:       '♥',
};
const LABEL: Record<Reaction, string> = {
  thumbs_up:   'Helpful',
  thumbs_down: 'Not helpful',
  heart:       'Save to my profile',
};

const REACTIONS: Reaction[] = ['thumbs_up', 'thumbs_down', 'heart'];

export default function ItemReactions({ itemSlug, itemType, palette = 'amber' }: Props) {
  const isAmber = palette === 'amber';

  const C = isAmber
    ? { bg: '#0f140e', border: '#ffb000', active: '#ffb000', activeTxt: '#0f140e', text: '#ffb000', dim: '#b87800', heart: '#ff6b6b', mono: '"Courier New", Courier, monospace' }
    : { bg: '#062586', border: '#fcdd2c', active: '#fcdd2c', activeTxt: '#062586', text: '#fcdd2c', dim: '#c8d5ff', heart: '#ff3b8d', mono: '"Arial Narrow", Arial, sans-serif' };

  const [counts, setCounts] = useState<Counts>({ thumbs_up: 0, thumbs_down: 0, heart: 0 });
  const [mine, setMine] = useState<Set<Reaction>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Reaction | null>(null);
  const [loginPrompt, setLoginPrompt] = useState(false);

  const fetchData = useCallback(async (uid: string | null) => {
    // Fetch aggregate counts
    const { data: rows } = await supabase
      .from('item_reactions')
      .select('reaction')
      .eq('item_slug', itemSlug)
      .eq('item_type', itemType);

    const c: Counts = { thumbs_up: 0, thumbs_down: 0, heart: 0 };
    rows?.forEach((r) => { c[r.reaction as Reaction] = (c[r.reaction as Reaction] || 0) + 1; });
    setCounts(c);

    // Fetch this user's reactions
    if (uid) {
      const { data: myRows } = await supabase
        .from('item_reactions')
        .select('reaction')
        .eq('item_slug', itemSlug)
        .eq('item_type', itemType)
        .eq('user_id', uid);
      setMine(new Set((myRows ?? []).map((r) => r.reaction as Reaction)));
    }
  }, [itemSlug, itemType]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      fetchData(uid).finally(() => setLoading(false));
    });
  }, [fetchData]);

  async function toggle(reaction: Reaction) {
    if (!userId) {
      setLoginPrompt(true);
      setTimeout(() => setLoginPrompt(false), 4000);
      return;
    }
    setToggling(reaction);
    const isActive = mine.has(reaction);

    // Optimistic update
    const newMine = new Set(mine);
    const newCounts = { ...counts };
    if (isActive) {
      newMine.delete(reaction);
      newCounts[reaction] = Math.max(0, newCounts[reaction] - 1);
    } else {
      newMine.add(reaction);
      newCounts[reaction] = newCounts[reaction] + 1;
    }
    setMine(newMine);
    setCounts(newCounts);

    // Persist
    if (isActive) {
      await supabase
        .from('item_reactions')
        .delete()
        .eq('user_id', userId)
        .eq('item_slug', itemSlug)
        .eq('item_type', itemType)
        .eq('reaction', reaction);
    } else {
      await supabase.from('item_reactions').insert({
        user_id: userId,
        item_slug: itemSlug,
        item_type: itemType,
        reaction,
      });
    }
    setToggling(null);
  }

  if (loading) {
    return (
      <div style={{ fontFamily: C.mono, fontSize: 12, color: C.dim, padding: '12px 0' }} aria-busy="true">
        Loading reactions…
      </div>
    );
  }

  return (
    <div>
      <div
        role="group"
        aria-label="React to this item"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}
      >
        {REACTIONS.map((r) => {
          const active = mine.has(r);
          const busy = toggling === r;
          return (
            <button
              key={r}
              onClick={() => toggle(r)}
              disabled={busy}
              aria-pressed={active}
              aria-label={`${LABEL[r]}${counts[r] > 0 ? ` (${counts[r]})` : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                background: active
                  ? (r === 'heart' ? C.heart : C.active)
                  : 'transparent',
                color: active
                  ? (r === 'heart' ? '#fff' : C.activeTxt)
                  : C.text,
                border: `2px solid ${active ? (r === 'heart' ? C.heart : C.active) : C.border}`,
                fontFamily: C.mono,
                fontSize: 15,
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1,
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                borderRadius: 2,
              }}
              className="item-reaction-btn"
            >
              <span aria-hidden="true" style={{ fontSize: 17, lineHeight: 1 }}>
                {EMOJI[r]}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {counts[r] > 0 ? counts[r] : ''}
              </span>
              {r === 'heart' && (
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  {active ? 'Saved' : 'Save'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loginPrompt && (
        <p
          role="status"
          aria-live="polite"
          style={{
            marginTop: 10,
            fontFamily: C.mono,
            fontSize: 13,
            color: C.dim,
          }}
        >
          <a
            href="/login"
            style={{ color: C.text, textDecoration: 'underline', fontWeight: 700 }}
          >
            Log in
          </a>{' '}
          to react and save items to your profile.
        </p>
      )}

      <style>{`
        .item-reaction-btn:focus-visible {
          outline: 3px solid #f5d84a;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
