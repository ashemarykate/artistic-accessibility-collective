'use client';

import { useState } from 'react';
import { PORTAL_PANEL_STYLE } from '@/lib/production-admin-copy';
import { saveMicrositeLinks, type MicrositeState } from '@/lib/backstage';
import Link from 'next/link';

/**
 * The launcher: everywhere the company needs to go, as clickable desktop icons.
 *
 * Icons come from public/images/desktop-icons, the same set the Collective uses
 * elsewhere, so Backstage looks like the rest of the house rather than like a
 * form. A link with no URL set still shows, greyed, with "not set yet" under
 * it: an empty slot is information, and it tells a producer what is missing.
 *
 * Only producers see the edit fields. Everyone else just gets the buttons.
 */

export interface LinkSlot {
  key: 'public_url' | 'drive_url' | 'submissions_url';
  label: string;
  icon: string;
  hint: string;
  external: boolean;
  /** Shown under the icon when nothing is set yet. */
  empty: string;
}

export const LINK_SLOTS: LinkSlot[] = [
  {
    key: 'public_url',
    label: 'The public site',
    icon: '/images/desktop-icons/icon-54.png',
    hint: 'What the audience sees. Opens in a new tab.',
    external: false,
    empty: 'not set yet',
  },
  {
    key: 'drive_url',
    label: 'Company drive',
    icon: '/images/desktop-icons/icon-projects-open.png',
    hint: 'Scripts, schedules, everything that is not on this site.',
    external: true,
    empty: 'paste the link',
  },
  {
    key: 'submissions_url',
    label: 'Video submissions',
    icon: '/images/desktop-icons/icon-50.png',
    hint: 'The drive folder submitted videos land in.',
    external: true,
    empty: 'paste the folder link',
  },
];

export default function BackstageLinks({
  site,
  productionId,
  canEdit,
  preview,
  hasProfile,
  onChange,
}: {
  site: MicrositeState;
  productionId: string;
  canEdit: boolean;
  preview?: boolean;
  /** null while we are still finding out. */
  hasProfile: boolean | null;
  onChange: (patch: Partial<MicrositeState>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const save = async () => {
    if (preview) { setNote('Preview only, nothing was saved.'); setEditing(false); return; }
    setSaving(true);
    const res = await saveMicrositeLinks(productionId, {
      public_url: site.public_url,
      drive_url: site.drive_url,
      submissions_url: site.submissions_url,
    });
    setSaving(false);
    setNote(res.ok ? 'Saved.' : `Could not save: ${res.error}`);
    if (res.ok) setEditing(false);
  };

  return (
    <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginBottom: '1.25rem', color: '#222' }}>
      <h2 style={{ marginTop: 0, color: 'var(--aac-blue)' }}>Where everything lives</h2>
      <p style={{ color: '#444', marginTop: 0 }}>
        The places this show keeps things. A greyed out icon means nobody has
        added that link yet.
      </p>

      <ul style={{
        listStyle: 'none', padding: 0, margin: '1rem 0 0',
        display: 'flex', flexWrap: 'wrap', gap: '1.25rem',
      }}>
        {LINK_SLOTS.map((slot) => {
          const url = site[slot.key];
          const on = Boolean(url);
          const inner = (
            <>
              <img
                src={slot.icon}
                alt=""
                width={44}
                height={44}
                style={{
                  display: 'block', margin: '0 auto 0.4rem', imageRendering: 'pixelated',
                  filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.45,
                }}
              />
              <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>{slot.label}</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: on ? '#5a6b8c' : '#98a', marginTop: '0.1rem' }}>
                {on ? slot.hint : slot.empty}
              </span>
            </>
          );
          return (
            <li key={slot.key} style={{ width: '9.5rem', textAlign: 'center' }}>
              {on ? (
                <a
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: '#222', display: 'block', padding: '0.4rem', borderRadius: '4px' }}
                >
                  {inner}
                </a>
              ) : (
                <span style={{ display: 'block', padding: '0.4rem', color: '#888' }}>{inner}</span>
              )}
            </li>
          );
        })}
        {/* Always here, not a configurable slot. Where it sends you depends on
            whether you already have a Collective profile: Backstage never
            required one, so plenty of people on a show will not have one. */}
        <li style={{ width: '9.5rem', textAlign: 'center' }}>
          <Link
            href={hasProfile ? '/dashboard' : '/submit'}
            style={{ textDecoration: 'none', color: '#222', display: 'block', padding: '0.4rem', borderRadius: '4px' }}
          >
            <img
              src="/images/desktop-icons/icon-46.png"
              alt=""
              width={44}
              height={44}
              style={{ display: 'block', margin: '0 auto 0.4rem', imageRendering: 'pixelated' }}
            />
            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>The Collective</span>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#5a6b8c', marginTop: '0.1rem' }}>
              {hasProfile === null
                ? 'checking…'
                : hasProfile
                  ? 'your member profile'
                  : 'you do not have a profile yet, make one'}
            </span>
          </Link>
        </li>
      </ul>

      {canEdit && !editing && (
        <p style={{ margin: '1rem 0 0' }}>
          <button className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>
            Edit these links
          </button>
          {note && <span style={{ marginLeft: '0.75rem', color: '#356' }} role="status">{note}</span>}
        </p>
      )}

      {canEdit && editing && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
          {LINK_SLOTS.map((slot) => (
            <div key={slot.key} style={{ marginBottom: '0.85rem' }}>
              <label htmlFor={`link-${slot.key}`} style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>
                {slot.label}
              </label>
              <input
                id={`link-${slot.key}`}
                className="form-input"
                value={site[slot.key] ?? ''}
                placeholder={slot.external ? 'https://…' : '/2006'}
                onChange={(e) => onChange({ [slot.key]: e.target.value || null } as Partial<MicrositeState>)}
              />
            </div>
          ))}
          <button className="btn btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save links'}
          </button>
          <button className="btn btn-sm btn-outline" style={{ marginLeft: '0.5rem' }} onClick={() => setEditing(false)}>
            Cancel
          </button>
          {note && <span style={{ marginLeft: '0.75rem', color: '#356' }} role="status">{note}</span>}
        </div>
      )}
    </section>
  );
}
