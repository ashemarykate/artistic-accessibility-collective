'use client';

import { useEffect } from 'react';

const MESSAGE = 'You have unsaved changes. Leave this page without saving?';

/**
 * Warn before a half-filled form is lost. While `isDirty` is true this:
 *  - triggers the browser's native "Leave site?" prompt on reload, tab close,
 *    Back/Forward, or typing a new URL (via beforeunload), and
 *  - intercepts clicks on in-app links (header nav, footer, etc.) and asks for
 *    confirmation before the soft navigation happens.
 *
 * Explicit buttons that navigate in JS (Cancel, Sign Out) aren't links, so
 * guard those with `confirmDiscardIfDirty(isDirty)` at the top of their handler.
 *
 * A link that should bypass the guard (e.g. a "Discard and leave" action) can
 * set `data-allow-unsaved` on the anchor.
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy browsers need returnValue set; the text itself is ignored.
      e.returnValue = '';
    };

    const onClick = (e: MouseEvent) => {
      // Let modified clicks (open in new tab), non-primary buttons, and clicks
      // already handled elsewhere pass through untouched.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.target === '_blank') return;
      if (anchor.hasAttribute('data-allow-unsaved')) return;
      if (!window.confirm(MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // Capture phase so we run before Next's Link click handler.
    document.addEventListener('click', onClick, true);
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [isDirty]);
}

/** For explicit JS navigations (Cancel, Sign Out). Returns true if it's OK to
 *  proceed, i.e. the form is clean or the user confirmed discarding. */
export function confirmDiscardIfDirty(isDirty: boolean): boolean {
  return !isDirty || window.confirm(MESSAGE);
}
