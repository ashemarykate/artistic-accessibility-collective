'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Wraps a report/staffing-sheet document so a teammate can make a quick,
 * one-time editing pass (fix a number, retype a line, swap a name) right in
 * the browser before printing or exporting. Nothing is saved anywhere: this
 * is a "click Edit, fix what needs fixing, print" tool, not a CMS. Reloading
 * the page discards all changes, which is the point.
 *
 * How it works: the whole document becomes a single contentEditable region,
 * the same idea as editing a Google Doc, so nothing has to be individually
 * wired up field by field. Links are click-disabled while editing (so
 * placing a cursor doesn't accidentally navigate away) and restored on exit.
 */
export default function EditableDocument({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  // While editing, suppress link navigation so clicking inside a link to
  // place a text cursor doesn't send the whole tab somewhere else.
  useEffect(() => {
    const node = docRef.current;
    if (!node) return;
    const onClickCapture = (e: MouseEvent) => {
      if (!editing) return;
      const link = (e.target as HTMLElement).closest('a');
      if (link) e.preventDefault();
    };
    node.addEventListener('click', onClickCapture, true);
    return () => node.removeEventListener('click', onClickCapture, true);
  }, [editing]);

  return (
    <>
      {/* Stacked directly above the Print/Save button (which sits at bottom:32
          right:32), rather than beside it, so the two floating controls never
          overlap on narrow screens. */}
      <div
        className="no-print"
        style={{
          position: 'fixed', bottom: 88, right: 32, zIndex: 201,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
          maxWidth: 'calc(100vw - 64px)',
        }}
      >
        {editing && (
          <span style={{
            background: '#1a1a2e', color: '#fff',
            fontSize: 12, fontWeight: 600,
            padding: '8px 14px', borderRadius: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            textAlign: 'right', maxWidth: '100%',
          }}>
            Click anywhere to edit. Nothing saves, so print or export when done.
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          aria-pressed={editing}
          style={{
            background: editing ? '#1a7a4a' : '#263590',
            color: 'white', border: 'none',
            padding: '12px 20px', minHeight: 44, boxSizing: 'border-box',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            letterSpacing: '0.02em', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          {editing ? '✓ Done Editing' : '✎ Edit This Document'}
        </button>
      </div>

      <div
        ref={docRef}
        contentEditable={editing}
        suppressContentEditableWarning
        spellCheck={editing}
        style={editing ? {
          outline: '3px dashed #263590',
          outlineOffset: 6,
          cursor: 'text',
        } : undefined}
      >
        {children}
      </div>
    </>
  );
}
