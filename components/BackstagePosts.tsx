'use client';

import { useEffect, useRef, useState } from 'react';
import { PORTAL_PANEL_STYLE } from '@/lib/production-admin-copy';
import { fetchPosts, createPost, savePost, deletePost, type Post } from '@/lib/backstage';
import { sanitizeHtml, POST_FONTS } from '@/lib/sanitize-html';

/**
 * Blog posts. Writing by the company that ends up on the public site.
 *
 * A post starts unpublished, so you can leave it half finished without anyone
 * seeing it. Publishing is a checkbox rather than a separate button because
 * unpublishing has to be just as easy: the fastest way to fix a post you
 * regret is to take it down, not to edit it under pressure.
 */

/**
 * The formatting bar.
 *
 * It wraps whatever you have selected, which is how every editor anybody has
 * used works, rather than asking people to type markup. The stored value is
 * plain HTML, but only the handful of tags sanitizeHtml allows survive, and
 * colour and font are re-emitted from a fixed table rather than echoed. So a
 * post can look like a Xanga entry without a post being able to run anything.
 */
const SWATCHES = [
  '#000000', '#ffffff', '#ff2e88', '#39ff14', '#00e9ff',
  '#ffd652', '#9b59ff', '#ff6a00', '#c3adaf', '#5ce9f5',
];

const SAMPLE: Post[] = [{
  id: 'preview-1', production_id: 'preview', created_by: 'preview',
  title: 'we found the RAZR', byline: 'mkashe9',
  body: 'It still turns on. The alarm still works. Someone in 2007 set it for 6:40am and it has been waiting ever since.',
  is_published: true, pinned: false, posted_at: new Date(0).toISOString(),
}];

export default function BackstagePosts({
  productionId, userId, myScreenName, canPin, preview,
}: {
  productionId: string;
  userId: string | null;
  myScreenName: string;
  canPin: boolean;
  preview?: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const bodyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  /** Wraps the current selection, or drops the tags at the caret if nothing is
   *  selected so you can type inside them. */
  const wrapSelection = (id: string, before: string, after: string) => {
    const el = bodyRefs.current[id];
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const next = value.slice(0, a) + before + value.slice(a, b) + after + value.slice(b);
    patch(id, { body: next });
    requestAnimationFrame(() => {
      el.focus();
      const caret = a + before.length + (b - a);
      el.setSelectionRange(caret, caret);
    });
  };

  useEffect(() => {
    if (preview) { setPosts(SAMPLE); return; }
    fetchPosts(productionId).then(setPosts);
  }, [productionId, preview]);

  const patch = (id: string, p: Partial<Post>) =>
    setPosts((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const add = async () => {
    if (preview) {
      const id = `preview-${posts.length + 1}`;
      setPosts((ps) => [{
        id, production_id: 'preview', created_by: 'preview',
        title: '', byline: myScreenName, body: '',
        is_published: false, pinned: false, posted_at: new Date(0).toISOString(),
      }, ...ps]);
      setOpenId(id);
      return;
    }
    if (!userId) return;
    setBusy(true);
    const res = await createPost(productionId, userId, myScreenName);
    setBusy(false);
    if (!res.ok) { setNote(`Could not start it: ${res.error}`); return; }
    setPosts(await fetchPosts(productionId));
    if (res.id) setOpenId(res.id);
  };

  const save = async (p: Post) => {
    if (preview) { setNote('Preview only, nothing was saved.'); return; }
    setBusy(true);
    const res = await savePost(p);
    setBusy(false);
    setNote(res.ok ? 'Saved.' : `Could not save: ${res.error}`);
  };

  const remove = async (p: Post) => {
    if (!confirm(`Delete "${p.title || 'this post'}"? This cannot be undone.`)) return;
    if (preview) { setPosts((ps) => ps.filter((x) => x.id !== p.id)); return; }
    setBusy(true);
    const res = await deletePost(p.id);
    setBusy(false);
    if (res.ok) setPosts((ps) => ps.filter((x) => x.id !== p.id));
    else setNote(`Could not delete: ${res.error}`);
  };

  const mine = (p: Post) => preview || (userId != null && p.created_by === userId);

  return (
    <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginBottom: '1.25rem', color: '#222' }}>
      <h2 style={{ marginTop: 0, color: 'var(--aac-blue)' }}>
        <img src="/images/desktop-icons/icon-70.png" alt="" width={24} height={24}
             style={{ verticalAlign: '-5px', marginRight: '0.5rem', imageRendering: 'pixelated' }} />
        Posts
      </h2>
      <p style={{ color: '#444', marginTop: 0 }}>
        Write something and it shows up on the public site under your screen
        name. A post stays private until you tick Published, so you can leave
        one half finished. Untick it and it comes straight back down.
      </p>

      <p style={{ margin: '0.75rem 0' }}>
        <button className="btn btn-sm" onClick={add} disabled={busy}>Write a post</button>
        {note && <span style={{ marginLeft: '0.75rem', color: '#356' }} role="status">{note}</span>}
      </p>

      {posts.length === 0 && (
        <p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>Nothing written yet.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {posts.map((p) => {
          const open = openId === p.id;
          const editable = mine(p);
          return (
            <li key={p.id} style={{ borderTop: '1px solid #e3e0d6', padding: '0.75rem 0' }}>
              <button
                onClick={() => setOpenId(open ? null : p.id)}
                aria-expanded={open}
                style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer',
                         textAlign: 'left', width: '100%', font: 'inherit', color: '#222' }}
              >
                <strong>{p.title || 'untitled post'}</strong>
                <span style={{ color: '#5a6b8c', fontSize: '0.85rem' }}>
                  {'  '}{p.byline}
                  {p.pinned && ' · pinned'}
                  {p.is_published ? ' · live' : ' · draft'}
                  {!editable && ' · not yours'}
                </span>
              </button>

              {open && (
                <div style={{ marginTop: '0.75rem', paddingLeft: '0.5rem', borderLeft: '3px solid #ddd' }}>
                  {editable ? (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Title</label>
                      <input className="form-input" value={p.title}
                             onChange={(e) => patch(p.id, { title: e.target.value })} />

                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>
                        Posting as
                      </label>
                      <input className="form-input" value={p.byline}
                             onChange={(e) => patch(p.id, { byline: e.target.value })} />

                      <label htmlFor={`body-${p.id}`} style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>
                        The post
                      </label>
                      <Toolbar
                        onWrap={(before, after) => wrapSelection(p.id, before, after)}
                      />
                      <textarea
                        id={`body-${p.id}`}
                        ref={(el) => { bodyRefs.current[p.id] = el; }}
                        className="form-input"
                        rows={8}
                        value={p.body}
                        onChange={(e) => patch(p.id, { body: e.target.value })}
                      />

                      <p style={{ fontSize: '0.75rem', color: '#667', margin: '0.4rem 0 0.2rem' }}>
                        How it will look
                      </p>
                      <div
                        style={{
                          border: '1px solid #ddd', background: '#fff', padding: '0.6rem 0.75rem',
                          minHeight: '3rem', fontFamily: "'Times New Roman', Times, serif",
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.body) || '<em style="color:#999">nothing yet</em>' }}
                      />

                      <p style={{ margin: '0.85rem 0 0', display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-sm" onClick={() => save(p)} disabled={busy}>Save</button>
                        <label style={{ fontSize: '0.85rem' }}>
                          <input type="checkbox" checked={p.is_published}
                                 onChange={(e) => patch(p.id, { is_published: e.target.checked })} />
                          {' '}Published
                        </label>
                        {canPin && (
                          <label style={{ fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={p.pinned}
                                   onChange={(e) => patch(p.id, { pinned: e.target.checked })} />
                            {' '}Pin to the top
                          </label>
                        )}
                        <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}
                                onClick={() => remove(p)}>Delete</button>
                      </p>
                    </>
                  ) : (
                    <p style={{ whiteSpace: 'pre-line', margin: 0, color: '#333' }}>{p.body}</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}


/** Formatting buttons. Kept out of the post loop so the markup it inserts is
 *  defined in exactly one place. */
function Toolbar({ onWrap }: { onWrap: (before: string, after: string) => void }) {
  const btn: React.CSSProperties = {
    border: '1px solid #bbb', background: '#f4f2ea', cursor: 'pointer',
    padding: '0.15rem 0.5rem', font: 'inherit', fontSize: '0.85rem', borderRadius: '2px',
  };
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center',
      border: '1px solid #ddd', borderBottom: 0, background: '#faf9f5', padding: '0.35rem',
    }}>
      <button type="button" style={{ ...btn, fontWeight: 'bold' }}
              onClick={() => onWrap('<strong>', '</strong>')} aria-label="Bold">B</button>
      <button type="button" style={{ ...btn, fontStyle: 'italic' }}
              onClick={() => onWrap('<em>', '</em>')} aria-label="Italic">I</button>
      <button type="button" style={{ ...btn, textDecoration: 'underline' }}
              onClick={() => onWrap('<u>', '</u>')} aria-label="Underline">U</button>
      <button type="button" style={btn}
              onClick={() => {
                const url = prompt('Link to where?', 'https://');
                if (url) onWrap(`<a href="${url.replace(/"/g, '&quot;')}">`, '</a>');
              }}>Link</button>

      <span style={{ width: 1, alignSelf: 'stretch', background: '#ddd', margin: '0 0.2rem' }} />

      <label style={{ fontSize: '0.75rem', color: '#556' }}>Font</label>
      <select
        style={{ ...btn, padding: '0.15rem' }}
        defaultValue=""
        onChange={(e) => {
          if (!e.target.value) return;
          onWrap(`<span style="font-family:${e.target.value}">`, '</span>');
          e.target.value = '';
        }}
      >
        <option value="">choose…</option>
        {Object.keys(POST_FONTS).map((k) => <option key={k} value={k}>{k}</option>)}
      </select>

      <label style={{ fontSize: '0.75rem', color: '#556', marginLeft: '0.3rem' }}>Colour</label>
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Colour ${c}`}
          title={c}
          onClick={() => onWrap(`<span style="color:${c}">`, '</span>')}
          style={{
            width: 18, height: 18, borderRadius: '2px', cursor: 'pointer',
            background: c, border: '1px solid #999',
          }}
        />
      ))}
    </div>
  );
}
