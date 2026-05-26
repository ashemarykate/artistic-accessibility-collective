'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Comment = {
  id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
  is_acc: boolean;
};

type Props = {
  itemSlug: string;
  itemType: 'library' | 'cinema' | 'resource' | 'event';
  palette?: 'amber' | 'blue';
};

export default function ItemComments({ itemSlug, itemType, palette = 'amber' }: Props) {
  const isAmber = palette === 'amber';

  const C = isAmber
    ? {
        bg:    '#0a0e0a',
        bg2:   '#0f140e',
        amber: '#ffb000',
        hi:    '#ffd166',
        dim:   '#b87800',
        green: '#4dff7c',
        red:   '#ff5a4a',
        cyan:  '#5ce1ff',
        mono:  '"Courier New", Courier, monospace',
      }
    : {
        bg:    '#062586',
        bg2:   '#0a3bb8',
        amber: '#fcdd2c',
        hi:    '#ffffff',
        dim:   '#c8d5ff',
        green: '#4dff7c',
        red:   '#ff4040',
        cyan:  '#22e5d6',
        mono:  '"Arial Narrow", Arial, sans-serif',
      };

  const [comments, setComments]   = useState<Comment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isAcc, setIsAcc]         = useState(false);   // true = Collective or admin
  const [draft, setDraft]         = useState('');
  const [posting, setPosting]     = useState(false);
  const [postError, setPostError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('item_comments')
      .select('id, user_id, display_name, body, created_at, is_acc')
      .eq('item_slug', itemSlug)
      .eq('item_type', itemType)
      .order('created_at', { ascending: true });
    setComments(data ?? []);
  }, [itemSlug, itemType]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        // Fetch profile for display name + member_type
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, full_name, member_type')
          .eq('user_id', uid)
          .maybeSingle();

        setDisplayName(profile?.display_name || profile?.full_name || 'Member');

        // Collective members get the (ACC) badge
        const isCollective = profile?.member_type === 'collective';

        // Admins also get the (ACC) badge
        const { data: adminRow } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', uid)
          .maybeSingle();

        setIsAcc(isCollective || !!adminRow);
      }

      await fetchComments();
      setLoading(false);
    });
  }, [fetchComments]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !userId) return;
    setPosting(true);
    setPostError('');

    const { error } = await supabase.from('item_comments').insert({
      user_id:      userId,
      display_name: displayName,
      item_slug:    itemSlug,
      item_type:    itemType,
      body:         draft.trim(),
      is_acc:       isAcc,
    });

    if (error) {
      setPostError('Something went wrong. Please try again.');
    } else {
      setDraft('');
      await fetchComments();
      announce('Comment posted.');
    }
    setPosting(false);
  }

  async function handleDelete(id: string, date: string) {
    setDeletingId(id);
    await supabase.from('item_comments').delete().eq('id', id).eq('user_id', userId!);
    await fetchComments();
    setDeletingId(null);
    announce('Comment deleted.');
  }

  function announce(msg: string) {
    if (liveRef.current) {
      liveRef.current.textContent = msg;
      setTimeout(() => { if (liveRef.current) liveRef.current.textContent = ''; }, 3000);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  const inputSty: React.CSSProperties = {
    background:  C.bg,
    border:      `1px solid ${C.amber}`,
    color:       C.hi,
    fontFamily:  C.mono,
    fontSize:    14,
    padding:     '8px 10px',
    width:       '100%',
    boxSizing:   'border-box',
    resize:      'vertical',
    lineHeight:  1.6,
  };

  return (
    <section aria-label="Community comments">
      {/* Screen reader live region */}
      <div ref={liveRef} role="status" aria-live="polite" className="sr-only" />

      <h3 style={{
        fontFamily:    C.mono,
        fontSize:      isAmber ? 14 : 13,
        color:         C.amber,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin:        '0 0 16px',
        borderTop:     `1px solid ${C.dim}`,
        paddingTop:    18,
      }}>
        {isAmber ? '── COMMUNITY COMMENTS ──' : '◆ COMMUNITY COMMENTS'}
      </h3>

      {loading ? (
        <p style={{ fontFamily: C.mono, fontSize: 13, color: C.dim }}>Loading comments…</p>
      ) : (
        <>
          {/* Comment list */}
          {comments.length === 0 ? (
            <p style={{ fontFamily: C.mono, fontSize: 13, color: C.dim, margin: '0 0 20px' }}>
              No comments yet — be the first.
            </p>
          ) : (
            <ol
              aria-label={`${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
              style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {comments.map((c) => (
                <li
                  key={c.id}
                  style={{
                    background: C.bg2,
                    border:     `1px solid ${C.dim}`,
                    padding:    '12px 14px',
                    position:   'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: C.mono, fontSize: 12, color: C.amber, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      {c.display_name}
                      {c.is_acc && (
                        <span
                          aria-label="Artistic Accessibility Collective member"
                          title="Artistic Accessibility Collective member"
                          style={{
                            fontSize:      10,
                            fontWeight:    700,
                            letterSpacing: '0.06em',
                            color:         C.bg,
                            background:    C.amber,
                            padding:       '1px 5px',
                            borderRadius:  2,
                            lineHeight:    1.5,
                            flexShrink:    0,
                          }}
                        >
                          AAC
                        </span>
                      )}
                    </span>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>
                      <time dateTime={c.created_at}>{formatDate(c.created_at)}</time>
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: C.hi, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {c.body}
                  </p>
                  {userId === c.user_id && (
                    <button
                      onClick={() => handleDelete(c.id, formatDate(c.created_at))}
                      disabled={deletingId === c.id}
                      aria-label={`Delete your comment from ${formatDate(c.created_at)}`}
                      style={{
                        position:      'absolute',
                        top:           10,
                        right:         10,
                        background:    'none',
                        border:        'none',
                        color:         C.dim,
                        fontFamily:    C.mono,
                        fontSize:      11,
                        cursor:        'pointer',
                        padding:       '2px 6px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                      className="comment-delete-btn"
                    >
                      {deletingId === c.id ? '…' : '✕ delete'}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}

          {/* Post form or login prompt */}
          {!userId ? (
            <p style={{ fontFamily: C.mono, fontSize: 13, color: C.dim }}>
              <a href="/login" style={{ color: C.amber, textDecoration: 'underline', fontWeight: 700 }}>Log in</a>
              {' '}or{' '}
              <a href="/access-card/signup" style={{ color: C.amber, textDecoration: 'underline', fontWeight: 700 }}>get a free Access Card</a>
              {' '}to leave a comment.
            </p>
          ) : (
            <form onSubmit={handlePost} noValidate>
              <label
                htmlFor={`comment-draft-${itemSlug}`}
                style={{
                  display:       'block',
                  fontFamily:    C.mono,
                  fontSize:      12,
                  color:         C.amber,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom:  6,
                }}
              >
                Add a comment
                {isAcc && (
                  <span aria-hidden="true" style={{ marginLeft: 8, fontSize: 10, color: C.amber, background: `${C.amber}22`, border: `1px solid ${C.amber}44`, padding: '1px 6px', borderRadius: 2 }}>
                    posting as AAC member
                  </span>
                )}
              </label>
              <textarea
                id={`comment-draft-${itemSlug}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What do you think? Practical notes, reactions, context, or questions — all welcome."
                rows={4}
                maxLength={2000}
                disabled={posting}
                required
                style={inputSty}
                className="opac-input cinema-input"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={posting || !draft.trim()}
                  style={{
                    background:    posting || !draft.trim() ? `rgba(255,176,0,0.2)` : C.amber,
                    color:         posting || !draft.trim() ? C.dim : C.bg,
                    border:        `1px solid ${C.amber}`,
                    fontFamily:    C.mono,
                    fontWeight:    700,
                    fontSize:      13,
                    padding:       '8px 20px',
                    cursor:        posting || !draft.trim() ? 'default' : 'pointer',
                    letterSpacing: '0.08em',
                    textShadow:    'none',
                  }}
                  className="opac-btn cinema-btn"
                >
                  {posting ? 'Posting…' : isAmber ? '< POST COMMENT >' : '▶ Post Comment'}
                </button>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>
                  {2000 - draft.length} chars remaining
                </span>
              </div>
              {postError && (
                <p role="alert" style={{ color: C.red, fontFamily: C.mono, fontSize: 12, margin: '8px 0 0' }}>
                  ▶ {postError}
                </p>
              )}
            </form>
          )}
        </>
      )}

      <style>{`
        .comment-delete-btn:focus-visible {
          outline: 2px solid #f5d84a;
          outline-offset: 2px;
        }
        .opac-input:focus-visible,
        .opac-input:focus,
        .cinema-input:focus-visible,
        .cinema-input:focus {
          outline: 3px solid #f5d84a;
          outline-offset: 0;
        }
        .opac-btn:focus-visible,
        .cinema-btn:focus-visible {
          outline: 3px solid #f5d84a;
          outline-offset: 2px;
        }
      `}</style>
    </section>
  );
}
