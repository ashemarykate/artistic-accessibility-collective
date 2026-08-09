'use client';

import { useEffect, useState } from 'react';
import { PORTAL_PANEL_STYLE } from '@/lib/production-admin-copy';
import {
  fetchGraves, createGrave, saveGrave, deleteGrave, pinGrave, type Grave,
} from '@/lib/backstage';

/**
 * The Graveyard: things the show misses.
 *
 * The public can submit, so this list has two jobs at once. Anything waiting is
 * pulled to the top under its own heading rather than mixed in, because an
 * unapproved row is a task and an approved one is content, and a queue you have
 * to hunt through is a queue that does not get cleared.
 *
 * One entry can be pinned. Pinning clears whatever was pinned before, so
 * "pinned to the top" stays a single thing without a database constraint a
 * producer would have to fight.
 */

const SAMPLE: Grave[] = [
  { id: 'p1', production_id: 'preview', name: 'MySpace Top 8', dates: '2003 to 2009',
    epitaph: 'u were always #1', submitted_by: null, approved: true, pinned: true, sort_order: 1 },
  { id: 'p2', production_id: 'preview', name: 'Burned CDs', dates: 'sharpie titles',
    epitaph: '"summer mix vol. 4"', submitted_by: null, approved: true, pinned: false, sort_order: 2 },
  { id: 'p3', production_id: 'preview', name: 'Blockbuster Friday', dates: 'gone 2010',
    epitaph: 'be kind, rewind', submitted_by: 'xXbrokenheartXx', approved: false, pinned: false, sort_order: 3 },
];

export default function BackstageGraveyard({
  productionId, canCurate, preview,
}: {
  productionId: string;
  canCurate: boolean;
  preview?: boolean;
}) {
  const [graves, setGraves] = useState<Grave[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (preview) { setGraves(SAMPLE); return; }
    fetchGraves(productionId).then(setGraves);
  }, [productionId, preview]);

  const patch = (id: string, p: Partial<Grave>) =>
    setGraves((gs) => gs.map((g) => (g.id === id ? { ...g, ...p } : g)));

  const add = async () => {
    if (preview) {
      const id = `p-${graves.length + 1}`;
      setGraves((gs) => [...gs, { id, production_id: 'preview', name: 'something we miss',
        dates: '', epitaph: '', submitted_by: null, approved: true, pinned: false, sort_order: gs.length }]);
      return;
    }
    setBusy(true);
    const res = await createGrave(productionId);
    setBusy(false);
    if (!res.ok) { setNote(`Could not add it: ${res.error}`); return; }
    setGraves(await fetchGraves(productionId));
  };

  const save = async (g: Grave) => {
    if (preview) { setNote('Preview only, nothing was saved.'); return; }
    setBusy(true);
    const res = await saveGrave(g);
    setBusy(false);
    setNote(res.ok ? 'Saved.' : `Could not save: ${res.error}`);
  };

  const remove = async (g: Grave) => {
    if (!confirm(`Remove "${g.name}"?`)) return;
    if (preview) { setGraves((gs) => gs.filter((x) => x.id !== g.id)); return; }
    setBusy(true);
    const res = await deleteGrave(g.id);
    setBusy(false);
    if (res.ok) setGraves((gs) => gs.filter((x) => x.id !== g.id));
    else setNote(`Could not remove it: ${res.error}`);
  };

  const pin = async (g: Grave) => {
    if (preview) {
      setGraves((gs) => gs.map((x) => ({ ...x, pinned: x.id === g.id })));
      return;
    }
    setBusy(true);
    const res = await pinGrave(productionId, g.id);
    setBusy(false);
    if (res.ok) setGraves(await fetchGraves(productionId));
    else setNote(`Could not pin it: ${res.error}`);
  };

  const waiting = graves.filter((g) => !g.approved);
  const live = graves.filter((g) => g.approved);

  const row = (g: Grave) => (
    <li key={g.id} style={{ borderTop: '1px solid #e3e0d6', padding: '0.75rem 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.6fr', gap: '0.4rem' }}>
        <input className="form-input" aria-label="What it was" placeholder="what it was"
               value={g.name} onChange={(e) => patch(g.id, { name: e.target.value })} />
        <input className="form-input" aria-label="Dates" placeholder="dates"
               value={g.dates} onChange={(e) => patch(g.id, { dates: e.target.value })} />
        <input className="form-input" aria-label="Epitaph" placeholder="epitaph"
               value={g.epitaph} onChange={(e) => patch(g.id, { epitaph: e.target.value })} />
      </div>
      <p style={{ margin: '0.5rem 0 0', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => save(g)} disabled={busy}>Save</button>
        {!g.approved && (
          <button className="btn btn-sm" onClick={() => { patch(g.id, { approved: true }); save({ ...g, approved: true }); }}>
            Approve
          </button>
        )}
        {g.approved && (
          <button className="btn btn-sm btn-outline" onClick={() => pin(g)} disabled={g.pinned}>
            {g.pinned ? 'Pinned to the top' : 'Pin to the top'}
          </button>
        )}
        {g.submitted_by && (
          <span style={{ fontSize: '0.8rem', color: '#5a6b8c' }}>sent in by {g.submitted_by}</span>
        )}
        <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}
                onClick={() => remove(g)}>Remove</button>
      </p>
    </li>
  );

  return (
    <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginBottom: '1.25rem', color: '#222' }}>
      <h2 style={{ marginTop: 0, color: 'var(--aac-blue)' }}>
        <img src="/images/desktop-icons/icon-62.png" alt="" width={24} height={24}
             style={{ verticalAlign: '-5px', marginRight: '0.5rem', imageRendering: 'pixelated' }} />
        The Graveyard
      </h2>
      <p style={{ color: '#444', marginTop: 0 }}>
        Things we miss, shown on the public site. Anyone can send one in, and
        nothing they send appears until somebody here approves it. One entry can
        sit at the top: pinning a new one lets the old one go.
      </p>

      {!canCurate && (
        <p style={{ color: '#777', fontStyle: 'italic' }}>
          Producers and creators look after this one.
        </p>
      )}

      {canCurate && (
        <>
          <p style={{ margin: '0.75rem 0' }}>
            <button className="btn btn-sm" onClick={add} disabled={busy}>Add one yourself</button>
            {note && <span style={{ marginLeft: '0.75rem', color: '#356' }} role="status">{note}</span>}
          </p>

          {waiting.length > 0 && (
            <>
              <h3 style={{ fontSize: '0.95rem', color: '#8a4b00', margin: '1rem 0 0' }}>
                Waiting on you ({waiting.length})
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{waiting.map(row)}</ul>
            </>
          )}

          <h3 style={{ fontSize: '0.95rem', color: '#5a6b8c', margin: '1.25rem 0 0' }}>
            On the site ({live.length})
          </h3>
          {live.length === 0
            ? <p style={{ color: '#777', fontStyle: 'italic', margin: '0.5rem 0 0' }}>Nothing buried yet.</p>
            : <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{live.map(row)}</ul>}
        </>
      )}
    </section>
  );
}
