'use client';

/**
 * ProjectIconPicker — choose the icon a project wears in the home page folder.
 *
 * A real radio group, not a grid of buttons, for three reasons: arrow keys move
 * between the icons, a screen reader announces "4 of 17", and the browser keeps
 * exactly one selected without any state juggling here.
 *
 * The images are decorative (`alt=""`). The accessible name comes from the
 * visible text label, which is why every entry in PROJECT_ICONS carries a plain
 * description of what the picture actually shows: "Camera", not "icon 50". An
 * icon nobody can name is an icon nobody can choose.
 */

import { PROJECT_ICONS, resolveProjectIcon } from '@/lib/project-icons';
import type { ProductionKind } from '@/lib/supabase';

interface Props {
  /** Stored choice. '' means "choose for me from the kind". */
  value: string;
  onChange: (key: string) => void;
  /** Drives the "choose for me" preview, so it shows what you would get. */
  kind: ProductionKind;
  kindLabel: string;
}

export default function ProjectIconPicker({ value, onChange, kind, kindLabel }: Props) {
  const options = [{ key: '', label: 'Choose for me' }, ...PROJECT_ICONS];

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: '0 0 0.75rem', minWidth: 0 }}>
      <legend style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 600,
        color: 'var(--color-text-muted, #5a5a5a)', marginBottom: 3, padding: 0,
      }}>
        Icon in the Projects folder on the home page
      </legend>
      <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted, #5a5a5a)', margin: '0 0 0.5rem' }}>
        This is how the project appears inside the pink Current Projects &amp; Events folder.
        Leave it on Choose for me and it picks one to suit a {kindLabel.toLowerCase()}.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {options.map((icon) => {
          const on = value === icon.key;
          // The "choose for me" tile previews the icon that kind would land on,
          // so the default is never a mystery.
          const shownKey = icon.key || resolveProjectIcon(null, kind);
          return (
            <label
              key={icon.key || '__auto__'}
              style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, width: 84, padding: '8px 4px', borderRadius: 6, cursor: 'pointer',
                border: `2px solid ${on ? 'var(--aac-blue)' : 'var(--color-border, #c8c4bc)'}`,
                background: on ? 'var(--aac-blue-light, #d8dcf5)' : '#fff',
                textAlign: 'center',
              }}
            >
              <input
                type="radio"
                name="prod-desktop-icon"
                value={icon.key}
                checked={on}
                onChange={() => onChange(icon.key)}
                style={{ width: 16, height: 16, margin: 0 }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/desktop-icons/icon-${shownKey}.png`}
                alt=""
                aria-hidden="true"
                width={36}
                height={36}
                style={{ display: 'block', imageRendering: 'pixelated' }}
              />
              <span style={{ fontSize: '0.6875rem', lineHeight: 1.25, color: 'var(--aac-blue)' }}>
                {icon.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
