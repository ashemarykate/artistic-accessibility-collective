'use client';

/**
 * RichTextEditor — the free-write post box in Admin -> Productions
 *
 * The point of this box is that a production page shouldn't have to look like a
 * form. Everything above it in the admin panel is structured fields the site
 * needs to understand (dates, venue, ticket links); this is the part where you
 * write however you want, and it comes out looking like you wrote it.
 *
 * Implementation notes for whoever touches this next:
 *
 *  - It uses document.execCommand, which is formally deprecated and still the
 *    only thing every browser implements for "make the selection bold". The
 *    replacement everyone reaches for is a 100kb editor framework, which is a
 *    bad trade for bold, italic, headings, lists, quotes, links and images.
 *
 *  - contentEditable and React re-renders fight each other: writing innerHTML
 *    on every keystroke moves the caret to the start. So innerHTML is set only
 *    when the value arrives from OUTSIDE (mount, or switching to a different
 *    production), tracked with lastEmitted. Typing never triggers a write back.
 *
 *  - Output goes through sanitizeHtml on the way out, so a paste from Word or
 *    a webpage lands as clean markup and nothing unexpected can be saved even
 *    though the person typing is an admin.
 *
 *  - Accessibility: role="toolbar" with arrow-key navigation between buttons
 *    (one tab stop for the whole toolbar, per the ARIA toolbar pattern), the
 *    editing surface is a labelled textbox, aria-pressed reflects the live
 *    formatting state of the caret, and every button clears 44px.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitize-html';

// `shortcut` is on the shared base rather than only on the inline variant so
// the toolbar can read it off any command without narrowing first.
type CmdBase = { id: string; label: string; icon: string; shortcut?: string };
type Cmd =
  | (CmdBase & { kind: 'inline'; cmd: string })
  | (CmdBase & { kind: 'block'; tag: string })
  | (CmdBase & { kind: 'list'; cmd: string })
  | (CmdBase & { kind: 'action' });

const COMMANDS: Cmd[][] = [
  [
    { kind: 'inline', id: 'bold',      cmd: 'bold',          label: 'Bold',          icon: 'B',  shortcut: 'Ctrl or Cmd plus B' },
    { kind: 'inline', id: 'italic',    cmd: 'italic',        label: 'Italic',        icon: 'I',  shortcut: 'Ctrl or Cmd plus I' },
    { kind: 'inline', id: 'underline', cmd: 'underline',     label: 'Underline',     icon: 'U',  shortcut: 'Ctrl or Cmd plus U' },
    { kind: 'inline', id: 'strike',    cmd: 'strikeThrough', label: 'Strikethrough', icon: 'S' },
  ],
  [
    { kind: 'block', id: 'h2', tag: 'h2', label: 'Big heading',    icon: 'H2' },
    { kind: 'block', id: 'h3', tag: 'h3', label: 'Small heading',  icon: 'H3' },
    { kind: 'block', id: 'p',  tag: 'p',  label: 'Normal text',    icon: '¶' },
  ],
  [
    { kind: 'list',  id: 'ul',    cmd: 'insertUnorderedList', label: 'Bulleted list', icon: '•' },
    { kind: 'list',  id: 'ol',    cmd: 'insertOrderedList',   label: 'Numbered list', icon: '1.' },
    { kind: 'block', id: 'quote', tag: 'blockquote',          label: 'Quote',         icon: '❝' },
  ],
  [
    { kind: 'action', id: 'link',    label: 'Add link',        icon: '🔗' },
    { kind: 'action', id: 'unlink',  label: 'Remove link',     icon: '⛓' },
    { kind: 'action', id: 'image',   label: 'Add photo',       icon: '🖼' },
    { kind: 'action', id: 'hr',      label: 'Divider line',    icon: '―' },
    { kind: 'action', id: 'clear',   label: 'Clear formatting', icon: '⌫' },
  ],
];

const FLAT = COMMANDS.flat();

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Visible label for the editing surface. */
  label: string;
  /** Hint text rendered under the toolbar and wired up via aria-describedby. */
  hint?: string;
  /** Opens the photo picker and resolves with what to insert, or null if
   *  cancelled. Without it, the Add photo button asks for a URL instead. */
  onRequestImage?: () => Promise<{ url: string; alt: string } | null>;
  minHeight?: number;
}

export default function RichTextEditor({
  value, onChange, label, hint, onRequestImage, minHeight = 260,
}: RichTextEditorProps) {
  const surfaceRef  = useRef<HTMLDivElement>(null);
  const toolbarRef  = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string>('');
  const uid = useId();
  const surfaceId = `${uid}-surface`;
  const hintId    = `${uid}-hint`;

  const [active, setActive]   = useState<Record<string, boolean>>({});
  const [focusIdx, setFocusIdx] = useState(0);
  const [status, setStatus]   = useState('');

  // Only write innerHTML when the value came from outside this component.
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    if (value === lastEmitted.current) return;
    el.innerHTML = sanitizeHtml(value);
    lastEmitted.current = value;
  }, [value]);

  const emit = useCallback(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const clean = sanitizeHtml(el.innerHTML);
    lastEmitted.current = clean;
    onChange(clean);
  }, [onChange]);

  /** Reads back what the caret is currently sitting inside, so the toolbar can
   *  show it. queryCommandState is as deprecated as execCommand and as widely
   *  supported; a failure just leaves the button un-pressed. */
  const syncActive = useCallback(() => {
    if (typeof document === 'undefined') return;
    const next: Record<string, boolean> = {};
    for (const c of FLAT) {
      try {
        if (c.kind === 'inline' || c.kind === 'list') next[c.id] = document.queryCommandState(c.cmd);
        else if (c.kind === 'block') {
          const block = document.queryCommandValue('formatBlock')?.toLowerCase();
          next[c.id] = block === c.tag || (c.tag === 'p' && (block === '' || block === 'div'));
        }
      } catch {
        next[c.id] = false;
      }
    }
    setActive(next);
  }, []);

  useEffect(() => {
    const onSel = () => {
      const el = surfaceRef.current;
      if (el && document.activeElement === el) syncActive();
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [syncActive]);

  const exec = (cmd: string, arg?: string) => {
    surfaceRef.current?.focus();
    try {
      document.execCommand(cmd, false, arg);
    } catch {
      setStatus('That formatting is not available in this browser.');
      return;
    }
    emit();
    syncActive();
  };

  const run = async (c: Cmd) => {
    if (c.kind === 'inline' || c.kind === 'list') { exec(c.cmd); return; }
    if (c.kind === 'block') {
      // Toggling a heading off returns to a paragraph rather than doing nothing.
      const isOn = active[c.id];
      exec('formatBlock', isOn && c.tag !== 'p' ? 'p' : c.tag);
      return;
    }

    switch (c.id) {
      case 'link': {
        const sel = window.getSelection()?.toString() ?? '';
        const url = window.prompt(
          sel ? `Link "${sel}" to which address?` : 'Paste the web address to link to:',
          'https://',
        );
        if (!url || url === 'https://') return;
        // Blocked here as well as in the sanitizer, so the person pasting gets
        // told why instead of silently losing the link on save.
        if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url.trim())) {
          setStatus('Links need to start with https://, mailto:, or a slash.');
          return;
        }
        if (!sel) {
          // No selection: insert the address as its own visible link text.
          exec('insertHTML', `<a href="${url.trim().replace(/"/g, '%22')}">${url.trim().replace(/[<>&]/g, '')}</a>`);
        } else {
          exec('createLink', url.trim());
        }
        setStatus('Link added.');
        return;
      }
      case 'unlink':
        exec('unlink');
        setStatus('Link removed.');
        return;
      case 'image': {
        let img: { url: string; alt: string } | null = null;
        if (onRequestImage) {
          img = await onRequestImage();
        } else {
          const url = window.prompt('Paste the web address of the photo:', 'https://');
          if (!url || url === 'https://') return;
          const alt = window.prompt('Describe this photo for someone who cannot see it:', '') ?? '';
          img = { url: url.trim(), alt };
        }
        if (!img) return;
        if (!img.alt.trim()) {
          const ok = window.confirm(
            'This photo has no description. Screen reader users will not know what it shows.\n\nInsert it as a decorative photo anyway?',
          );
          if (!ok) return;
        }
        exec('insertHTML',
          `<img src="${img.url.replace(/"/g, '%22')}" alt="${img.alt.replace(/[<>&"]/g, '')}" /><p></p>`);
        setStatus('Photo added.');
        return;
      }
      case 'hr':
        exec('insertHorizontalRule');
        return;
      case 'clear':
        exec('removeFormat');
        setStatus('Formatting cleared.');
        return;
    }
  };

  // ARIA toolbar pattern: the toolbar is one tab stop, arrows move within it.
  const onToolbarKeyDown = (e: React.KeyboardEvent) => {
    const last = FLAT.length - 1;
    let next = focusIdx;
    if (e.key === 'ArrowRight') next = focusIdx >= last ? 0 : focusIdx + 1;
    else if (e.key === 'ArrowLeft') next = focusIdx <= 0 ? last : focusIdx - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    setFocusIdx(next);
    const btns = toolbarRef.current?.querySelectorAll<HTMLButtonElement>('button[data-cmd]');
    btns?.[next]?.focus();
  };

  // Enter inside a heading or quote should drop back to normal text, the way
  // every other editor behaves. Without this you get a page of giant headings.
  const onSurfaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const block = document.queryCommandValue('formatBlock')?.toLowerCase();
    if (block === 'h2' || block === 'h3' || block === 'h4') {
      e.preventDefault();
      document.execCommand('insertParagraph');
      document.execCommand('formatBlock', false, 'p');
      emit();
      syncActive();
    }
  };

  // Paste as plain-ish text: run the clipboard HTML through the sanitizer
  // before it lands, so pasting from Word or a website doesn't import a wall of
  // inline styles and font tags that then have to be cleaned up by hand.
  const onPaste = (e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    e.preventDefault();
    if (html) {
      document.execCommand('insertHTML', false, sanitizeHtml(html));
    } else {
      // Blank lines become paragraphs, single newlines become <br>.
      const asHtml = text
        .split(/\n{2,}/)
        .map((para) => `<p>${para.replace(/\n/g, '<br />').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string))}</p>`)
        .join('');
      document.execCommand('insertHTML', false, asHtml);
    }
    emit();
  };

  const btnStyle = (isActive: boolean): React.CSSProperties => ({
    minWidth: 44, minHeight: 44, padding: '0 10px',
    border: '1px solid var(--color-border, #c8c4bc)',
    borderRadius: 4,
    background: isActive ? 'var(--aac-blue)' : '#fff',
    color: isActive ? '#fff' : 'var(--aac-blue)',
    fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1,
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    outlineOffset: 2,
  });

  let flatIdx = -1;

  return (
    <div>
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label={`${label} formatting`}
        aria-controls={surfaceId}
        onKeyDown={onToolbarKeyDown}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          padding: 8, background: '#ece9d8',
          border: '1px solid var(--color-border, #c8c4bc)',
          borderBottom: 'none',
          borderRadius: '4px 4px 0 0',
        }}
      >
        {COMMANDS.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {gi > 0 && (
              <span aria-hidden="true" style={{ width: 1, height: 28, background: '#b8b4ac', margin: '0 4px' }} />
            )}
            {group.map((c) => {
              flatIdx++;
              const idx = flatIdx;
              const isActive = !!active[c.id];
              const isToggle = c.kind !== 'action';
              return (
                <button
                  key={c.id}
                  type="button"
                  data-cmd={c.id}
                  tabIndex={idx === focusIdx ? 0 : -1}
                  onFocus={() => setFocusIdx(idx)}
                  onClick={() => void run(c)}
                  aria-pressed={isToggle ? isActive : undefined}
                  aria-label={c.shortcut ? `${c.label}, ${c.shortcut}` : c.label}
                  title={c.label}
                  style={{
                    ...btnStyle(isActive),
                    fontStyle: c.id === 'italic' ? 'italic' : undefined,
                    textDecoration: c.id === 'underline' ? 'underline'
                      : c.id === 'strike' ? 'line-through' : undefined,
                  }}
                >
                  <span aria-hidden="true">{c.icon}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {hint && (
        <p id={hintId} style={{
          margin: 0, padding: '6px 10px', fontSize: '0.75rem',
          color: 'var(--color-text-muted, #5a5a5a)', background: '#f6f4ec',
          borderLeft: '1px solid var(--color-border, #c8c4bc)',
          borderRight: '1px solid var(--color-border, #c8c4bc)',
        }}>
          {hint}
        </p>
      )}

      <div
        ref={surfaceRef}
        id={surfaceId}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        onInput={emit}
        onBlur={emit}
        onKeyUp={syncActive}
        onMouseUp={syncActive}
        onFocus={syncActive}
        onKeyDown={onSurfaceKeyDown}
        onPaste={onPaste}
        className="rte-surface"
        style={{
          minHeight,
          padding: '14px 16px',
          border: '1px solid var(--color-border, #c8c4bc)',
          borderRadius: '0 0 4px 4px',
          background: '#fff',
          fontFamily: 'var(--font-body, system-ui)',
          fontSize: '1rem',
          lineHeight: 1.6,
          overflowY: 'auto',
        }}
      />

      {/* Announces the result of toolbar actions that have no visible feedback. */}
      <p role="status" aria-live="polite" style={{
        margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted, #5a5a5a)', minHeight: 16,
      }}>
        {status}
      </p>

      {/* Scoped so the editing surface previews roughly how the post will look
          on the patron page, instead of everything rendering as one flat block. */}
      <style>{`
        .rte-surface:focus-visible { outline: 3px solid var(--aac-yellow, #f5d84a); outline-offset: 2px; }
        .rte-surface h2 { font-size: 1.375rem; font-weight: 700; margin: 1rem 0 .5rem; line-height: 1.25; }
        .rte-surface h3 { font-size: 1.125rem; font-weight: 700; margin: .875rem 0 .375rem; line-height: 1.3; }
        .rte-surface p { margin: 0 0 .75rem; }
        .rte-surface ul, .rte-surface ol { margin: 0 0 .75rem; padding-left: 1.5rem; }
        .rte-surface li { margin-bottom: .25rem; }
        .rte-surface blockquote {
          margin: 0 0 .75rem; padding: .5rem 0 .5rem 1rem;
          border-left: 4px solid var(--aac-blue-light, #d8dcf5); font-style: italic;
        }
        .rte-surface a { color: var(--aac-blue, #263590); text-decoration: underline; }
        .rte-surface img { max-width: 100%; height: auto; border-radius: 4px; margin: .5rem 0; }
        .rte-surface hr { border: none; border-top: 2px solid var(--aac-blue-light, #d8dcf5); margin: 1rem 0; }
        .rte-surface:empty::before {
          content: 'Write here. Use the buttons above to add headings, lists, links and photos.';
          color: #6b7a9e;
        }
      `}</style>
    </div>
  );
}
