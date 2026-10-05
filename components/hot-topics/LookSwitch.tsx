'use client';

import { useLook } from './useLook';

/**
 * Punk or Plain. Plain removes every decorative layer (checkers, studs, tape,
 * stickers, tilt, hard shadows, the display type) and keeps all the content.
 * The choice is remembered in the browser, see useLook.
 */
export default function LookSwitch() {
  const [look, setLook] = useLook();
  return (
    <div className="ht-seg" role="group" aria-label="Look of this page">
      <span className="ht-seg-label" aria-hidden="true">
        Look
      </span>
      <button type="button" className="ht-pill" aria-pressed={look === 'punk'} onClick={() => setLook('punk')}>
        Punk
      </button>
      <button type="button" className="ht-pill" aria-pressed={look === 'plain'} onClick={() => setLook('plain')}>
        Plain
      </button>
    </div>
  );
}
