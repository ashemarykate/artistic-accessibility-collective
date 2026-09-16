'use client';

import { useEffect, useState } from 'react';
import SeeOnSite from '@/components/SeeOnSite';
import { useConfirm } from '@/components/useConfirm';
import { PORTAL_PANEL_STYLE } from '@/lib/production-admin-copy';
import {
  fetchMovies, createMovie, saveMovie, deleteMovie,
  type Movie, type MovieEmphasis,
} from '@/lib/backstage';

/**
 * OUR 2006 BLOCKBUSTERS.
 *
 * A list of titles, and for each one how it should be set on the wall. That
 * choice is the whole look of the page: a rental shelf was never uniformly
 * typeset, so bold and italic are content here rather than styling, which is
 * why they are stored per title instead of alternated automatically.
 *
 * The note is the aside in brackets. It exists because of Flushed Away, where
 * the memory is the singing slugs in the trailer and not the film.
 */

const EMPHASIS: { value: MovieEmphasis; label: string; css: React.CSSProperties }[] = [
  { value: 'normal',     label: 'Plain',       css: {} },
  { value: 'italic',     label: 'Italic',      css: { fontStyle: 'italic' } },
  { value: 'bold',       label: 'Bold',        css: { fontWeight: 700 } },
  { value: 'bolditalic', label: 'Bold italic', css: { fontWeight: 700, fontStyle: 'italic' } },
];

const SAMPLE: Movie[] = [
  { id: 'p1', production_id: 'preview', title: 'Nacho Libre', note: '',
    emphasis: 'bold', sort_order: 1, is_visible: true },
  { id: 'p2', production_id: 'preview', title: 'Flushed Away',
    note: 'not the movie, the singing guys from the trailer',
    emphasis: 'bolditalic', sort_order: 2, is_visible: true },
];

export default function BackstageMovies({
  productionId, canCurate, preview, siteUrl = '/2006',
}: {
  productionId: string;
  canCurate: boolean;
  preview?: boolean;
  siteUrl?: string;
}) {
  const [movies, setMovies] = useState<Movie[]>(preview ? SAMPLE : []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    if (preview) return;
    fetchMovies(productionId).then(setMovies);
  }, [productionId, preview]);

  const patch = (id: string, p: Partial<Movie>) =>
    setMovies((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const add = async () => {
    const next = movies.length ? Math.max(...movies.map((m) => m.sort_order)) + 1 : 1;
    if (preview) {
      setMovies((ms) => [...ms, { id: `p-${ms.length + 1}`, production_id: 'preview',
        title: '', note: '', emphasis: 'normal', sort_order: next, is_visible: true }]);
      return;
    }
    setBusy(true);
    const res = await createMovie(productionId, next);
    setBusy(false);
    if (!res.ok) { setNote(`Could not add it: ${res.error}`); return; }
    setMovies(await fetchMovies(productionId));
  };

  const save = async (m: Movie) => {
    if (preview) { setNote('Preview only, nothing was saved.'); return; }
    setBusy(true);
    const res = await saveMovie(m);
    setBusy(false);
    setNote(res.ok ? 'Saved.' : `Could not save: ${res.error}`);
  };

  const remove = async (m: Movie) => {
    if (!(await confirm({ title: `Take "${m.title || 'this one'}" off the wall?`,
      confirmLabel: 'Remove', danger: true }))) return;
    if (preview) { setMovies((ms) => ms.filter((x) => x.id !== m.id)); return; }
    setBusy(true);
    const res = await deleteMovie(m.id);
    setBusy(false);
    if (res.ok) setMovies((ms) => ms.filter((x) => x.id !== m.id));
    else setNote(`Could not remove it: ${res.error}`);
  };

  /** Swaps sort_order with the neighbour and saves both, so the order on the
   *  wall is the order here rather than whatever the database returns. */
  const move = async (m: Movie, dir: -1 | 1) => {
    const ordered = [...movies].sort((a, b) => a.sort_order - b.sort_order);
    const i = ordered.findIndex((x) => x.id === m.id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    const a = { ...ordered[i], sort_order: ordered[j].sort_order };
    const b = { ...ordered[j], sort_order: ordered[i].sort_order };
    setMovies((ms) => ms.map((x) => (x.id === a.id ? a : x.id === b.id ? b : x)));
    if (preview) return;
    setBusy(true);
    await Promise.all([saveMovie(a), saveMovie(b)]);
    setBusy(false);
  };

  const ordered = [...movies].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginBottom: '1.25rem', color: '#222' }}>
      {confirmDialog}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h2 style={{ marginTop: 0, marginBottom: 0, color: 'var(--aac-blue)' }}>
          <img src="/images/desktop-icons/icon-50.png" alt="" width={24} height={24}
               style={{ verticalAlign: '-5px', marginRight: '0.5rem', imageRendering: 'pixelated' }} />
          Our 2006 Blockbusters
        </h2>
        <SeeOnSite href={`${siteUrl}/blockbuster`} label="the Blockbuster wall" />
      </div>
      <p style={{ color: '#444', marginTop: 0 }}>
        The wall of films under Reminisce. Add whatever you rented. Each title
        picks how it is set, because a shelf of rental cases never matched, and
        the note in brackets is for the ones where the memory is not really the
        film.
      </p>

      {!canCurate && (
        <p style={{ color: '#777', fontStyle: 'italic' }}>
          Producers and creators look after this one.
        </p>
      )}

      {canCurate && (
        <>
          <p style={{ margin: '0.75rem 0' }}>
            <button className="btn btn-sm" onClick={add} disabled={busy}>Add a film</button>
            {note && <span style={{ marginLeft: '0.75rem', color: '#356' }} role="status">{note}</span>}
          </p>

          {ordered.length === 0 && (
            <p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>Nothing on the wall yet.</p>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {ordered.map((m, i) => (
              <li key={m.id} style={{ borderTop: '1px solid #e3e0d6', padding: '0.75rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.6fr', gap: '0.4rem' }}>
                  <input className="form-input" aria-label="Film title" placeholder="the film"
                         value={m.title} onChange={(e) => patch(m.id, { title: e.target.value })} />
                  <input className="form-input" aria-label="Note in brackets"
                         placeholder="note in brackets, optional"
                         value={m.note} onChange={(e) => patch(m.id, { note: e.target.value })} />
                </div>

                <p style={{ margin: '0.5rem 0 0', display: 'flex', gap: '0.75rem',
                            alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.85rem' }}>
                    Set it{' '}
                    <select className="form-input" style={{ width: 'auto', display: 'inline-block' }}
                            value={m.emphasis}
                            onChange={(e) => patch(m.id, { emphasis: e.target.value as MovieEmphasis })}>
                      {EMPHASIS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>

                  <span aria-hidden="true" style={{
                    ...(EMPHASIS.find((o) => o.value === m.emphasis)?.css ?? {}),
                    fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                    background: '#0033a0', color: '#fff',
                    padding: '0.2rem 0.5rem', borderRadius: 2, fontSize: '0.9rem',
                  }}>
                    {m.title || 'preview'}
                  </span>

                  <button className="btn btn-sm btn-outline" onClick={() => move(m, -1)}
                          disabled={busy || i === 0} aria-label={`Move ${m.title || 'this one'} up`}>↑</button>
                  <button className="btn btn-sm btn-outline" onClick={() => move(m, 1)}
                          disabled={busy || i === ordered.length - 1}
                          aria-label={`Move ${m.title || 'this one'} down`}>↓</button>

                  <button className="btn btn-sm" onClick={() => save(m)} disabled={busy}>Save</button>
                  <label style={{ fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={m.is_visible}
                           onChange={(e) => patch(m.id, { is_visible: e.target.checked })} />
                    {' '}Show
                  </label>
                  <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}
                          onClick={() => remove(m)}>Remove</button>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
