'use client';

import { useState } from 'react';
import SeeOnSite from '@/components/SeeOnSite';
import { PORTAL_PANEL_STYLE } from '@/lib/production-admin-copy';
import { saveMicrositeSettings, type MicrositeState } from '@/lib/backstage';

/**
 * The switches and the two links the front door needs. Producers only.
 *
 * Every switch here changes the public site within a second or two of Save,
 * on every phone in the room. The one that matters most is voting: flip it on
 * the day before the first show and off the day after the last, and say so
 * from the stage. The rest are there for the night something goes sideways.
 */

const KEYS = [
  'show_mode', 'voting_open', 'submissions_open',
  'wall_open', 'wall_frozen', 'photo_question', 'photo_answer', 'wall_wordlist',
  'reserve_url', 'submit_form_url',
] as const;
type Key = typeof KEYS[number];

export default function BackstageShowSettings({
  site, productionId, canEdit, preview, siteUrl, onChange,
}: {
  site: MicrositeState;
  productionId: string;
  canEdit: boolean;
  preview?: boolean;
  siteUrl: string;
  onChange: (patch: Partial<MicrositeState>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const save = async () => {
    if (preview) { setNote('Preview only, nothing was saved.'); return; }
    setSaving(true);
    const patch: Partial<MicrositeState> = {};
    KEYS.forEach((k: Key) => { (patch as Record<string, unknown>)[k] = site[k] ?? (typeof site[k] === 'boolean' ? false : ''); });
    const res = await saveMicrositeSettings(productionId, patch);
    setSaving(false);
    setNote(res.ok ? 'Saved. The site has it now.' : `Could not save: ${res.error}`);
  };

  const Switch = ({ k, label, help, danger }: { k: Key; label: string; help: string; danger?: boolean }) => (
    <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.5rem 0', borderTop: '1px solid #e3e0d6' }}>
      <input type="checkbox" checked={Boolean(site[k])} disabled={!canEdit}
             onChange={(e) => onChange({ [k]: e.target.checked } as Partial<MicrositeState>)}
             style={{ marginTop: '0.25rem', width: '1.1rem', height: '1.1rem' }} />
      <span>
        <span style={{ fontWeight: 700, color: danger ? '#a00' : '#222' }}>{label}</span>
        <span style={{ display: 'block', fontSize: '0.85rem', color: '#444' }}>{help}</span>
      </span>
    </label>
  );

  const Text = ({ k, label, help, placeholder }: { k: Key; label: string; help: string; placeholder?: string }) => (
    <div style={{ padding: '0.5rem 0', borderTop: '1px solid #e3e0d6' }}>
      <label htmlFor={`set-${k}`} style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem' }}>{label}</label>
      <span style={{ display: 'block', fontSize: '0.85rem', color: '#444', margin: '0.1rem 0 0.35rem' }}>{help}</span>
      <input id={`set-${k}`} className="form-input" disabled={!canEdit} placeholder={placeholder}
             value={String(site[k] ?? '')}
             onChange={(e) => onChange({ [k]: e.target.value } as Partial<MicrositeState>)} />
    </div>
  );

  return (
    <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginBottom: '1.25rem', color: '#222' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h2 style={{ marginTop: 0, marginBottom: 0, color: 'var(--aac-blue)' }}>The switches</h2>
        <SeeOnSite href={`${siteUrl}#show`} label="The Show: Live" />
      </div>
      <p style={{ color: '#444', margin: '0.5rem 0 0.75rem' }}>
        What the site is doing right now. Every one of these changes the public
        page within a second or two of Save, so take a beat before a show.
      </p>
      {!canEdit && <p style={{ color: '#777', fontStyle: 'italic' }}>Producers flip these.</p>}

      <h3 style={{ fontSize: '0.95rem', color: 'var(--aac-blue)', margin: '0.75rem 0 0' }}>The show</h3>
      <Switch k="voting_open" label="Voting is open"
        help="The big one. On the day before the first show, flip it on and say so from the stage. Off again the day after the last. While it is on, the countdown counts for real, the site shows the standings, and we check them as each show starts." />
      <Switch k="show_mode" label="Show mode"
        help="Opens the message windows so the audience can write to the cast during a performance, and the buddy list shows who is online." />
      <Switch k="submissions_open" label="Taking video submissions"
        help="Shows the submit button on the countdown. Off, and the page says submissions are closed." />

      <h3 style={{ fontSize: '0.95rem', color: 'var(--aac-blue)', margin: '1rem 0 0' }}>The wall and the blog</h3>
      <Switch k="wall_open" label="The audience can write"
        help="One switch for both: confessions on the wall and entries on the blog. Off, and the page says it is closed, nothing is deleted." />
      <Switch k="wall_frozen" label="Freeze the wall" danger
        help="The panic button. The wall instantly shows starred posts only, on every phone. Nothing is deleted, and unfreezing puts everything back. For the night something is on a screen that should not be." />
      <Text k="photo_question" label="The question in front of a picture"
        help="A person answers it once to add a photo. It stops crawlers, not people. Change both fields to something only the room knows if that ever stops being enough."
        placeholder="what year is it?" />
      <Text k="photo_answer" label="The answer" placeholder="2006"
        help="Spaces and capitals do not matter." />
      <Text k="wall_wordlist" label="Words to flag" placeholder="comma, separated"
        help="A post with one of these still goes up, immediately, like everything else. It is marked so it sorts to the top of your pile. Nobody is ever told their post did not work." />

      <h3 style={{ fontSize: '0.95rem', color: 'var(--aac-blue)', margin: '1rem 0 0' }}>The two links</h3>
      <Text k="reserve_url" label="Reserve a seat" placeholder="https://forms.gle/..."
        help="The form for a free seat in the studio. One form with a dropdown for which show is simplest. Empty, and the site says reservations open soon." />
      <Text k="submit_form_url" label="Submit a video" placeholder="https://forms.gle/..."
        help="The public video submission form. The button on the countdown points here." />

      {canEdit && (
        <p style={{ margin: '1rem 0 0', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save the switches'}</button>
          {note && <span style={{ color: '#356' }} role="status">{note}</span>}
        </p>
      )}
    </section>
  );
}
