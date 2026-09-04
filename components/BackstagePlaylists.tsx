'use client';

import { useEffect, useState } from 'react';
import { PORTAL_PANEL_STYLE, SECTIONS } from '@/lib/production-admin-copy';
import {
  fetchPlaylists, createPlaylist, savePlaylist, deletePlaylist, type Playlist,
} from '@/lib/backstage';

/**
 * Make a mix. Add songs. Say why each one is on there.
 *
 * Everyone on the show sees everyone's playlists, which is the point: they are
 * meant to be read. You can only edit your own, and that is enforced by RLS
 * rather than by hiding buttons, so a failed save reports the real reason.
 *
 * Tracks are a JSONB array, so adding and reordering is local state until you
 * press Save. That keeps a half built playlist out of the public site.
 */

const SAMPLE: Playlist[] = [{
  id: 'preview-1', production_id: 'preview', created_by: 'preview',
  title: 'burn this for me', byline: 'a mix by mkashe9',
  description: 'track 4 is the one. sorry about track 7.',
  tracks: [
    { t: 'Welcome to the Black Parade', a: 'My Chemical Romance', note: 'october. the whole year turns.' },
    { t: 'Chasing Cars', a: 'Snow Patrol', note: 'for crying in the car' },
  ],
  is_visible: true, sort_order: 0,
}];

export default function BackstagePlaylists({
  productionId, userId, myScreenName, preview,
}: {
  productionId: string;
  userId: string | null;
  myScreenName: string;
  preview?: boolean;
}) {
  const [lists, setLists] = useState<Playlist[]>(preview ? SAMPLE : []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (preview) return; // sample data is seeded as the initial state
    fetchPlaylists(productionId).then(setLists);
  }, [productionId, preview]);

  const patch = (id: string, p: Partial<Playlist>) =>
    setLists((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  const add = async () => {
    if (preview) {
      const id = `preview-${lists.length + 1}`;
      setLists((ls) => [...ls, {
        id, production_id: 'preview', created_by: 'preview',
        title: 'untitled mix', byline: `a mix by ${myScreenName}`,
        description: '', tracks: [], is_visible: true, sort_order: ls.length,
      }]);
      setOpenId(id);
      return;
    }
    if (!userId) return;
    setBusy(true);
    const res = await createPlaylist(productionId, userId, 'untitled mix', `a mix by ${myScreenName}`);
    setBusy(false);
    if (!res.ok) { setNote(`Could not make it: ${res.error}`); return; }
    const fresh = await fetchPlaylists(productionId);
    setLists(fresh);
    if (res.id) setOpenId(res.id);
  };

  const save = async (l: Playlist) => {
    if (preview) { setNote('Preview only, nothing was saved.'); return; }
    setBusy(true);
    const res = await savePlaylist(l);
    setBusy(false);
    setNote(res.ok ? 'Saved.' : `Could not save: ${res.error}`);
  };

  const remove = async (l: Playlist) => {
    if (!confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
    if (preview) { setLists((ls) => ls.filter((x) => x.id !== l.id)); return; }
    setBusy(true);
    const res = await deletePlaylist(l.id);
    setBusy(false);
    if (res.ok) setLists((ls) => ls.filter((x) => x.id !== l.id));
    else setNote(`Could not delete: ${res.error}`);
  };

  const mine = (l: Playlist) => preview || (userId != null && l.created_by === userId);

  return (
    <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginBottom: '1.25rem', color: '#222' }}>
      <h2 style={{ marginTop: 0, color: 'var(--aac-blue)' }}>
        <img src="/images/desktop-icons/icon-80.png" alt="" width={24} height={24}
             style={{ verticalAlign: '-5px', marginRight: '0.5rem', imageRendering: 'pixelated' }} />
        {SECTIONS.playlists.title}
      </h2>
      <p style={{ color: '#444', marginTop: 0 }}>{SECTIONS.playlists.blurb}</p>

      <p style={{ margin: '0.75rem 0' }}>
        <button className="btn btn-sm" onClick={add} disabled={busy}>Start a new mix</button>
        {note && <span style={{ marginLeft: '0.75rem', color: '#356' }} role="status">{note}</span>}
      </p>

      {lists.length === 0 && (
        <p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>
          Nobody has made one yet. Yours would be the first.
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {lists.map((l) => {
          const open = openId === l.id;
          const editable = mine(l);
          return (
            <li key={l.id} style={{ borderTop: '1px solid #e3e0d6', padding: '0.75rem 0' }}>
              <button
                onClick={() => setOpenId(open ? null : l.id)}
                aria-expanded={open}
                style={{
                  background: 'none', border: 0, padding: 0, cursor: 'pointer',
                  textAlign: 'left', width: '100%', font: 'inherit', color: '#222',
                }}
              >
                <strong>{l.title || 'untitled mix'}</strong>
                <span style={{ color: '#5a6b8c', fontSize: '0.85rem' }}>
                  {'  '}{l.byline} · {l.tracks.length} song{l.tracks.length === 1 ? '' : 's'}
                  {!l.is_visible && ' · hidden'}
                  {!editable && ' · not yours'}
                </span>
              </button>

              {open && (
                <div style={{ marginTop: '0.75rem', paddingLeft: '0.5rem', borderLeft: '3px solid #ddd' }}>
                  {editable ? (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Name</label>
                      <input className="form-input" value={l.title}
                             onChange={(e) => patch(l.id, { title: e.target.value })} />

                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>
                        Byline
                      </label>
                      <input className="form-input" value={l.byline}
                             onChange={(e) => patch(l.id, { byline: e.target.value })} />

                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>
                        What is it for
                      </label>
                      <textarea className="form-input" rows={2} value={l.description}
                                onChange={(e) => patch(l.id, { description: e.target.value })} />

                      <p style={{ fontWeight: 600, fontSize: '0.8rem', margin: '0.85rem 0 0.35rem' }}>Songs</p>
                      {l.tracks.map((tr, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr auto', gap: '0.4rem', marginBottom: '0.35rem' }}>
                          <input className="form-input" placeholder="title" value={tr.t}
                                 onChange={(e) => patch(l.id, { tracks: l.tracks.map((x, j) => j === i ? { ...x, t: e.target.value } : x) })} />
                          <input className="form-input" placeholder="artist" value={tr.a}
                                 onChange={(e) => patch(l.id, { tracks: l.tracks.map((x, j) => j === i ? { ...x, a: e.target.value } : x) })} />
                          <input className="form-input" placeholder="why it is on here" value={tr.note ?? ''}
                                 onChange={(e) => patch(l.id, { tracks: l.tracks.map((x, j) => j === i ? { ...x, note: e.target.value } : x) })} />
                          <button className="btn btn-sm btn-outline" aria-label={`Remove song ${i + 1}`}
                                  onClick={() => patch(l.id, { tracks: l.tracks.filter((_, j) => j !== i) })}>×</button>
                        </div>
                      ))}
                      <button className="btn btn-sm btn-outline"
                              onClick={() => patch(l.id, { tracks: [...l.tracks, { t: '', a: '', note: '' }] })}>
                        Add a song
                      </button>

                      <p style={{ margin: '0.85rem 0 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="btn btn-sm" onClick={() => save(l)} disabled={busy}>Save</button>
                        <label style={{ fontSize: '0.85rem' }}>
                          <input type="checkbox" checked={l.is_visible}
                                 onChange={(e) => patch(l.id, { is_visible: e.target.checked })} />
                          {' '}Show on the site
                        </label>
                        <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}
                                onClick={() => remove(l)}>Delete</button>
                      </p>
                    </>
                  ) : (
                    <>
                      {l.description && <p style={{ fontStyle: 'italic', color: '#555' }}>{l.description}</p>}
                      <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        {l.tracks.map((tr, i) => (
                          <li key={i} style={{ marginBottom: '0.25rem' }}>
                            <strong>{tr.t}</strong> <span style={{ color: '#5a6b8c' }}>{tr.a}</span>
                            {tr.note && <em style={{ display: 'block', color: '#8a7b1e', fontSize: '0.85rem' }}>{tr.note}</em>}
                          </li>
                        ))}
                      </ol>
                    </>
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
