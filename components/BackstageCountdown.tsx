'use client';

import { useEffect, useState } from 'react';
import { useConfirm } from '@/components/useConfirm';
import SeeOnSite from '@/components/SeeOnSite';
import { PORTAL_PANEL_STYLE } from '@/lib/production-admin-copy';
import {
  fetchCountdown, createCountdownVideo, saveCountdownVideo, deleteCountdownVideo,
  fetchStandings, youtubeId, type CountdownVideo,
} from '@/lib/backstage';

/**
 * The Video Countdown, as the cast sees it.
 *
 * Every row here is a slot on the public ballot. The public page reads this
 * table, so a save here changes the site on the next load. A row's id is what
 * votes are stored against, never the YouTube link or the title, which is the
 * whole trick: point a row at our own version and rename it, and every vote it
 * had comes along.
 *
 * While voting is open the rows sort by votes and show the count, which is
 * the same standings the page shows. Check it as each show starts and play
 * that order.
 *
 * Submissions that arrive through the form are added here by hand once one of
 * us has put the file on our YouTube. A row that somebody submitted directly
 * lands unapproved and waits at the bottom until it is approved.
 */

const SAMPLE: CountdownVideo[] = [
  { id: 'p1', production_id: 'preview', title: 'Fergalicious', artist: 'Fergie', year: '2006',
    youtube_id: '5T0utQ-XWGY', submitted_by: null, approved: true, is_inspo: false, ours: false, sort_order: 1 },
  { id: 'p2', production_id: 'preview', title: 'Here It Goes Again', artist: 'OK Go', year: '2006',
    youtube_id: 'dTAAsCNK7RA', submitted_by: null, approved: true, is_inspo: false, ours: false, sort_order: 2 },
  { id: 'p3', production_id: 'preview', title: 'me and my sister doing the hips dont lie dance', artist: 'sk8rgrl2006', year: '2026',
    youtube_id: '', submitted_by: 'sk8rgrl2006', approved: false, is_inspo: false, ours: false, sort_order: 3 },
];

export default function BackstageCountdown({
  productionId, canCurate, votingOpen, preview, siteUrl,
}: {
  productionId: string;
  canCurate: boolean;
  votingOpen: boolean;
  preview?: boolean;
  siteUrl: string;
}) {
  const [videos, setVideos] = useState<CountdownVideo[]>(preview ? SAMPLE : []);
  const [standings, setStandings] = useState<Record<string, number>>(preview ? { p1: 14, p2: 9 } : {});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    if (preview) return;
    fetchCountdown(productionId).then(setVideos);
  }, [productionId, preview]);

  // Standings only mean something while voting is open, and then they change
  // every few seconds, so poll. Stops the moment the switch goes off.
  useEffect(() => {
    if (preview || !votingOpen) return;
    let alive = true;
    const tick = () => fetchStandings(productionId).then((s) => { if (alive) setStandings(s); });
    tick();
    const t = setInterval(tick, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [productionId, votingOpen, preview]);

  const patch = (id: string, p: Partial<CountdownVideo>) =>
    setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, ...p } : v)));

  const live = videos.filter((v) => v.approved && !v.is_inspo);
  const waiting = videos.filter((v) => !v.approved);
  const ordered = votingOpen
    ? live.slice().sort((a, b) => (standings[b.id] ?? 0) - (standings[a.id] ?? 0) || a.sort_order - b.sort_order)
    : live.slice().sort((a, b) => a.sort_order - b.sort_order);

  const add = async () => {
    const next = videos.length ? Math.max(...videos.map((v) => v.sort_order)) + 1 : 1;
    if (preview) {
      setVideos((vs) => [...vs, { id: `p-${vs.length + 1}`, production_id: 'preview', title: '', artist: '',
        year: '', youtube_id: '', submitted_by: null, approved: true, is_inspo: false, ours: false, sort_order: next }]);
      return;
    }
    setBusy(true);
    const res = await createCountdownVideo(productionId, next);
    setBusy(false);
    if (!res.ok) { setNote(`Could not add it: ${res.error}`); return; }
    setVideos(await fetchCountdown(productionId));
  };

  const save = async (v: CountdownVideo) => {
    if (preview) { setNote('Preview only, nothing was saved.'); return; }
    setBusy(true);
    const res = await saveCountdownVideo(v);
    setBusy(false);
    setNote(res.ok ? 'Saved. The site has it on its next load.' : `Could not save: ${res.error}`);
  };

  const remove = async (v: CountdownVideo) => {
    const votes = standings[v.id] ?? 0;
    const warn = votes ? ` It has ${votes} vote${votes === 1 ? '' : 's'} and they go with it.` : '';
    if (!(await confirm({ title: `Take "${v.title || 'this video'}" off the countdown?${warn}`, confirmLabel: 'Take it off', danger: true }))) return;
    if (preview) { setVideos((vs) => vs.filter((x) => x.id !== v.id)); return; }
    setBusy(true);
    const res = await deleteCountdownVideo(v.id);
    setBusy(false);
    if (res.ok) setVideos((vs) => vs.filter((x) => x.id !== v.id));
    else setNote(`Could not remove it: ${res.error}`);
  };

  const row = (v: CountdownVideo, rank: number | null) => {
    const id = youtubeId(v.youtube_id);
    const votes = standings[v.id] ?? 0;
    return (
      <li key={v.id} style={{ borderTop: '1px solid #e3e0d6', padding: '0.7rem 0', display: 'flex', gap: '0.75rem' }}>
        {rank !== null && (
          <div style={{ flex: 'none', width: '3.2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, color: 'var(--aac-blue)' }}>#{rank}</div>
            <div style={{ fontSize: '0.7rem', color: '#5a6b8c' }}>{votes} vote{votes === 1 ? '' : 's'}</div>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 4.5rem', gap: '0.4rem' }}>
            <input className="form-input" aria-label="Title" placeholder="title"
                   value={v.title} onChange={(e) => patch(v.id, { title: e.target.value })} />
            <input className="form-input" aria-label="Artist" placeholder="artist, or who made it"
                   value={v.artist} onChange={(e) => patch(v.id, { artist: e.target.value })} />
            <input className="form-input" aria-label="Year" placeholder="year"
                   value={v.year} onChange={(e) => patch(v.id, { year: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 4.5rem', gap: '0.4rem', marginTop: '0.4rem' }}>
            <input className="form-input" aria-label="YouTube link" placeholder="paste a YouTube link in any shape"
                   value={v.youtube_id}
                   onChange={(e) => patch(v.id, { youtube_id: youtubeId(e.target.value) || e.target.value })} />
            <input className="form-input" aria-label="Order on the list" type="number" min={1}
                   value={v.sort_order} onChange={(e) => patch(v.id, { sort_order: Number(e.target.value) || 0 })} />
          </div>
          <p style={{ margin: '0.4rem 0 0', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            {!v.approved && (
              <button className="btn btn-sm" disabled={busy}
                      onClick={() => { patch(v.id, { approved: true }); save({ ...v, approved: true }); }}>
                Put it on the countdown
              </button>
            )}
            <button className="btn btn-sm" onClick={() => save(v)} disabled={busy}>Save</button>
            <label title="Our own version: a homemade one, or the swap. The site shows a small tag once this is on, so leave it off until the night.">
              <input type="checkbox" checked={v.ours} onChange={(e) => patch(v.id, { ours: e.target.checked })} />
              {' '}our version
            </label>
            {id
              ? <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">check it plays</a>
              : v.youtube_id && <span style={{ color: '#a33' }}>that does not look like a YouTube link</span>}
            {v.submitted_by && <span style={{ color: '#5a6b8c' }}>sent in by {v.submitted_by}</span>}
            <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }} onClick={() => remove(v)}>
              {v.approved ? 'Take it off' : 'Throw it out'}
            </button>
          </p>
        </div>
      </li>
    );
  };

  return (
    <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginBottom: '1.25rem', color: '#222' }}>
      {confirmDialog}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h2 style={{ marginTop: 0, marginBottom: 0, color: 'var(--aac-blue)' }}>
          <img src="/images/desktop-icons/icon-50.png" alt="" width={24} height={24}
               style={{ verticalAlign: '-5px', marginRight: '0.5rem', imageRendering: 'pixelated' }} />
          The Video Countdown
        </h2>
        <SeeOnSite href={`${siteUrl}#videos`} label="the Video Countdown" />
      </div>
      <p style={{ color: '#444', margin: '0.5rem 0 0' }}>
        The list people vote on. Edit a row and save, and the site has it on its
        next load. {votingOpen
          ? 'Voting is open, so this is sorted by votes: check it as each show starts and play that order.'
          : 'When voting is open this sorts itself by votes.'}
      </p>

      {!canCurate && (
        <p style={{ color: '#777', fontStyle: 'italic' }}>Producers and creators look after this one.</p>
      )}

      {canCurate && (
        <>
          <p style={{ margin: '0.75rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-sm" disabled={busy} onClick={add}>Add a video</button>
            <span style={{ fontSize: '0.8rem', color: '#5a6b8c' }}>
              a submission that came in as a file: put it on our YouTube first, then add the link here
            </span>
            {note && <span style={{ marginLeft: '0.5rem', color: '#356' }} role="status">{note}</span>}
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {ordered.map((v, i) => row(v, votingOpen ? i + 1 : null))}
          </ul>
          {ordered.length === 0 && (
            <p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>
              Nothing on the countdown yet. Until there is, the site shows its built in twelve.
            </p>
          )}

          {waiting.length > 0 && (
            <>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--aac-blue)', margin: '1.25rem 0 0' }}>
                Waiting to be looked at
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#444', margin: '0.25rem 0 0' }}>
                Sent in directly. Nobody sees these until one of us puts them on.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {waiting.map((v) => row(v, null))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
