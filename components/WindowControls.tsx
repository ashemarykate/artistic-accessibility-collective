'use client';

/**
 * WindowControls — the minimise / maximise / close trio in a retro title bar.
 *
 * This exists because the same seven lines were copy-pasted into seven pages
 * (Make Art and its three sub-pages, the Learning Hub and its channel, the
 * Calendar), each with its own colours, and in every copy the ✕ was a plain
 * div that did nothing. Meanwhile the 31 pages using BrowserChrome had a ✕ that
 * closed the window and announced itself. Same glyph, top right of the screen,
 * two different behaviours depending on which page you were on.
 *
 * The rules this component fixes in one place:
 *
 *   ✕  is a real button. It goes home, which is the honest meaning of "close"
 *      for a page that is not in a tab of its own. Its spoken name is the same
 *      sentence BrowserChrome uses, "Close and go home", so the whole site says
 *      it the same way.
 *
 *   ─ □ stay decoration: aria-hidden, not focusable, cursor: default. There is
 *      no sensible thing for minimise or maximise to do to a web page, and a
 *      control that looks live and is not is worse than one that clearly is
 *      not. They are there because the era demands three buttons.
 *
 * The 44px touch target comes from .tap-target-btn in globals.css, which grows
 * the hit area without changing the 16x14 pixel-button look.
 */

import { useRouter } from 'next/navigation';

interface Props {
  /** Button face colour, so each page keeps its own palette. */
  bg: string;
  /** Button border colour. */
  border: string;
  /** Gap between the three buttons. The Calendar uses 2, everywhere else 3. */
  gap?: number;
  /**
   * Where ✕ goes. Defaults to the home page. Pass a different path for a
   * sub-page where "close" more naturally means "back to the app I am inside",
   * e.g. a Make Art sub-page closing to /make-art.
   */
  closeTo?: string;
  /** Overrides the spoken name when closeTo is not home. */
  closeLabel?: string;
}

export default function WindowControls({
  bg, border, gap = 3, closeTo = '/', closeLabel,
}: Props) {
  const router = useRouter();

  const face: React.CSSProperties = {
    width: 16, height: 14, background: bg, border: `1px solid ${border}`,
    borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: 9, fontWeight: 'bold',
  };

  return (
    <div style={{ display: 'flex', gap }}>
      {['_', '□'].map((c) => (
        <div key={c} aria-hidden="true" style={{ ...face, cursor: 'default' }}>{c}</div>
      ))}
      <button
        type="button"
        className="tap-target-btn"
        aria-label={closeLabel ?? (closeTo === '/' ? 'Close and go home' : 'Close')}
        onClick={() => router.push(closeTo)}
        style={{ ...face, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
