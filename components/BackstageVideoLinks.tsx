'use client';

import { useEffect, useState } from 'react';
import { PORTAL_PANEL_STYLE } from '@/lib/production-admin-copy';
import {
  fetchVideoLinks, createVideoLink, saveVideoLink, deleteVideoLink, youtubeId,
  type VideoLink,
} from '@/lib/backstage';

/**
 * The video list on the public page.
 *
 * Grouped by category, and the category is free text so the company can invent
 * one whenever they feel like it rather than asking for a new option.
 *
 * Paste anything: a watch URL, a youtu.be short link, a shorts link, or a bare
 * id. youtubeId() pulls the id out, because nobody has ever had the bare id on
 * their clipboard. What was pasted is shown back as a working link so it is
 * obvious when a paste did not parse.
 */

const SAMPLE: VideoLink[] = [
  { id: 'p1', production_id: 'preview', category: 'emo hours',
    title: 'My Chemical Romance - Welcome to the Black Parade',
    youtube_id: 'dQw4w9WgXcQ', sort_order: 1, is_visible: true },
  { id: 'p2', production_id: 'preview', category: 'weird internet',
    title: 'Chocolate Rain', youtube_id: 'dQw4w9WgXcQ', sort_order: 1, is_visible: true },
];

export default function BackstageVideoLinks({
  productionId, canCurate, preview,
}: {
  productionId: string;
  canCurate: boolean;
  preview?: boolean;
}) {
  const [links, setLinks] = useState<VideoLink[]>([]);
  const [newCat, setNewCat] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (preview) { setLinks(SAMPLE); return; }
    fetchVideoLinks(productionId).then(setLinks);
  }, [productionId, preview]);

  const patch = (id: string, p: Partial<VideoLink>) =>
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  const categories = Array.from(new Set(links.map((l) => l.category))).sort();

  const add = async (category: string) => {
    if (preview) {
      const id = `p-${links.length + 1}`;
      setLinks((ls) => [...ls, { id, production_id: 'preview', category,
        title: '', youtube_id: '', sort_order: ls.length, is_visible: true }]);
      return;
    }
    setBusy(true);
    const res = await createVideoLink(productionId, category);
    setBusy(false);
    if (!res.ok) { setNote(`Could not add it: ${res.error}`); return; }
    setLinks(await fetchVideoLinks(productionId));
  };

  const save = async (l: VideoLink) => {
    if (preview) { setNote('Preview only, nothing was saved.'); return; }
    setBusy(true);
    const res = await saveVideoLink(l);
    setBusy(false);
    setNote(res.ok ? 'Saved.' : `Could not save: ${res.error}`);
  };

  const remove = async (l: VideoLink) => {
    if (!confirm(`Remove "${l.title || 'this video'}"?`)) return;
    if (preview) { setLinks((ls) => ls.filter((x) => x.id !== l.id)); return; }
    setBusy(true);
    const res = await deleteVideoLink(l.id);
    setBusy(false);
    if (res.ok) setLinks((ls) => ls.filter((x) => x.id !== l.id));
    else setNote(`Could not remove it: ${res.error}`);
  };

  return (
    <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginBottom: '1.25rem', color: '#222' }}>
      <h2 style={{ marginTop: 0, color: 'var(--aac-blue)' }}>
        <img src="/images/desktop-icons/icon-50.png" alt="" width={24} height={24}
             style={{ verticalAlign: '-5px', marginRight: '0.5rem', imageRendering: 'pixelated' }} />
        Videos on the public page
      </h2>
      <p style={{ color: '#444', marginTop: 0 }}>
        The list people browse on the site, grouped however you like. Paste a
        YouTube link in any shape and the id gets pulled out for you. Untick
        Show and it stays here but comes off the site.
      </p>

      {!canCurate && (
        <p style={{ color: '#777', fontStyle: 'italic' }}>
          Producers and creators look after this one.
        </p>
      )}

      {canCurate && (
        <>
          <p style={{ margin: '0.75rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              style={{ maxWidth: '14rem' }}
              placeholder="new category name"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <button className="btn btn-sm" disabled={busy || !newCat.trim()}
                    onClick={() => { add(newCat.trim()); setNewCat(''); }}>
              Start a category
            </button>
            {note && <span style={{ marginLeft: '0.5rem', color: '#356' }} role="status">{note}</span>}
          </p>

          {categories.length === 0 && (
            <p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>
              No videos yet. Name a category above to start one.
            </p>
          )}

          {categories.map((cat) => (
            <div key={cat} style={{ marginTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--aac-blue)', margin: 0 }}>{cat || 'uncategorised'}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {links.filter((l) => l.category === cat).map((l) => {
                  const id = youtubeId(l.youtube_id);
                  return (
                    <li key={l.id} style={{ borderTop: '1px solid #e3e0d6', padding: '0.6rem 0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '0.4rem' }}>
                        <input className="form-input" aria-label="Title" placeholder="what it is"
                               value={l.title} onChange={(e) => patch(l.id, { title: e.target.value })} />
                        <input className="form-input" aria-label="YouTube link" placeholder="paste a YouTube link"
                               value={l.youtube_id}
                               onChange={(e) => patch(l.id, { youtube_id: youtubeId(e.target.value) || e.target.value })} />
                      </div>
                      <p style={{ margin: '0.4rem 0 0', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                        <button className="btn btn-sm" onClick={() => save(l)} disabled={busy}>Save</button>
                        <label>
                          <input type="checkbox" checked={l.is_visible}
                                 onChange={(e) => patch(l.id, { is_visible: e.target.checked })} />
                          {' '}Show
                        </label>
                        {id
                          ? <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
                              check it plays
                            </a>
                          : l.youtube_id && <span style={{ color: '#a33' }}>that does not look like a YouTube link</span>}
                        <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}
                                onClick={() => remove(l)}>Remove</button>
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p style={{ margin: '0.5rem 0 0' }}>
                <button className="btn btn-sm btn-outline" onClick={() => add(cat)} disabled={busy}>
                  Add a video to {cat || 'this'}
                </button>
              </p>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
