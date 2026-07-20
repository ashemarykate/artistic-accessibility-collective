'use client';
/**
 * BrowserChrome — retro "browser inside a browser" wrapper
 *
 * Variants and their era / page pairings:
 *   mosaic   → NCSA Mosaic 1993-94  → Library pages (amber OPAC)
 *   netscape → Netscape Nav 2, 1995 → Cinema pages (print TV guide)
 *   ie3      → Internet Explorer 3, 1996 → Contact / Login
 *   aol      → AOL 5.0, 1999        → Share Feedback
 *
 * All chrome elements are aria-hidden / tabIndex=-1 so they don't
 * interfere with the page's real interactive content.
 */

import React from 'react';

export type BrowserVariant = 'mosaic' | 'netscape' | 'ie3' | 'aol';

interface BrowserChromeProps {
  variant: BrowserVariant;
  /** Text shown in the title bar */
  title: string;
  /** URL shown in the address / location / keyword bar */
  url: string;
  /** Background of the scrollable content area (transparent by default) */
  contentBg?: string;
  /** Overrides the theme's outer desktop background color */
  desktopBg?: string;
  children: React.ReactNode;
}

// ── Per-variant visual tokens ─────────────────────────────────────────────────

const THEMES = {
  mosaic: {
    desktop:     '#263590',           // AAC blue
    chrome:      '#c3c3c3',
    chromeLight: '#e0e0e0',
    chromeDark:  '#808080',
    titleBg:     '#c3c3c3',           // flat gray — Mosaic had no OS gradient
    titleFg:     '#000000',
    titleFont:   '"Helvetica Neue", Helvetica, Arial, sans-serif',
    menuItems:   ['Document', 'Navigate', 'Annotate', 'Options', 'Help'],
    addrLabel:   'URL:',
    statusText:  'Document: Done.',
    logo:        '📄',
    logoLabel:   'Mosaic',
    toolbarBtns: ['◀ Back', '▶ Fwd', '⟳ Reload', '🏠 Home'],
    font:        '"Helvetica Neue", Helvetica, Arial, sans-serif',
    borderStyle: '2px solid',         // flat — Mosaic was pre-inset/outset fashion
  },
  netscape: {
    desktop:     '#263590',           // AAC blue
    chrome:      '#c0c0c0',
    chromeLight: '#dfdfdf',
    chromeDark:  '#7a7a7a',
    titleBg:     'linear-gradient(90deg, #4d009a 0%, #7030c0 55%, #4d009a 100%)',
    titleFg:     '#ffffff',
    titleFont:   '"Arial", "Helvetica", sans-serif',
    menuItems:   ['File', 'Edit', 'View', 'Go', 'Bookmarks', 'Options', 'Directory', 'Help'],
    addrLabel:   'Location:',
    statusText:  '✓ Document: Done.',
    logo:        'N',
    logoLabel:   'Netscape Navigator',
    toolbarBtns: ['◀ Back', '▶ Fwd', '🏠 Home', '⟳ Reload', '🖨 Print'],
    font:        '"Arial", Helvetica, sans-serif',
    borderStyle: '2px outset',
  },
  ie3: {
    desktop:     '#008080',
    chrome:      '#c0c0c0',
    chromeLight: '#e4e4e4',
    chromeDark:  '#7a7a7a',
    titleBg:     'linear-gradient(90deg, #08006a 0%, #1464c8 60%, #0a2a8a 100%)',
    titleFg:     '#ffffff',
    titleFont:   '"Tahoma", Arial, sans-serif',
    menuItems:   ['File', 'Edit', 'View', 'Go', 'Favorites', 'Help'],
    addrLabel:   'Address:',
    statusText:  'Done',
    logo:        'e',
    logoLabel:   'Internet Explorer',
    toolbarBtns: ['◀', '▶', '⟳ Refresh', '🏠 Home'],
    font:        '"Tahoma", "Verdana", Arial, sans-serif',
    borderStyle: '2px outset',
  },
  aol: {
    desktop:     '#263590',           // AAC blue
    chrome:      '#f0f0f0',
    chromeLight: '#ffffff',
    chromeDark:  '#b0b0b0',
    titleBg:     'linear-gradient(90deg, #1442a0 0%, #2060c8 50%, #1442a0 100%)',
    titleFg:     '#ffffff',
    titleFont:   '"Arial", sans-serif',
    menuItems:   ['Sign On', 'Mail', 'People', 'Channels', 'Favorites', 'Help'],
    addrLabel:   'Keyword:',
    statusText:  'Page loaded successfully',
    logo:        '💬',
    logoLabel:   'AOL',
    toolbarBtns: ['◀ Back', '▶ Fwd', '🏠 Home', '📧 Email'],
    font:        '"Arial", sans-serif',
    borderStyle: '2px outset',
  },
} as const;

// ── Helper sub-components (all aria-hidden / decorative) ──────────────────────

function WinBtn({ label, danger, theme, onClick, ariaLabel }: { label: string; danger?: boolean; theme: typeof THEMES[BrowserVariant]; onClick?: () => void; ariaLabel?: string }) {
  const style = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 18, height: 14, fontSize: '9px', fontWeight: 'bold',
    background: danger ? '#cc0000' : theme.chrome,
    border: `1px outset ${theme.chromeLight}`,
    color: danger ? '#fff' : '#000',
    fontFamily: theme.font, cursor: onClick ? 'pointer' : 'default', userSelect: 'none' as const,
    flexShrink: 0,
  };
  if (onClick) {
    // Real navigation: must be reachable by keyboard/screen reader, unlike the
    // purely decorative minimize/maximize glyphs below. tap-target-btn adds an
    // invisible 44x44 hit area without changing the retro pixel-button size.
    return <button className="tap-target-btn" aria-label={ariaLabel ?? label} onClick={onClick} style={{ ...style, padding: 0 }}>{label}</button>;
  }
  return <span aria-hidden="true" style={style}>{label}</span>;
}

function TBtn({
  label, onClick, theme, ariaLabel,
}: {
  label: string;
  onClick?: () => void;
  theme: typeof THEMES[BrowserVariant];
  ariaLabel?: string;
}) {
  const style: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '2px 7px',
    fontSize: '11px',
    fontFamily: theme.font,
    color: '#000',
    cursor: onClick ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    flexShrink: 0,
  };
  if (onClick) {
    // Real action (Back/Fwd/Reload/Home/Print/Email): keep it reachable.
    return <button className="tap-target-btn" aria-label={ariaLabel ?? label} onClick={onClick} style={style}>{label}</button>;
  }
  // Decorative-only menu items (File, Edit, Help, Favorites, etc.) do nothing.
  return <button aria-hidden="true" tabIndex={-1} style={style}>{label}</button>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BrowserChrome({
  variant,
  title,
  url,
  contentBg,
  desktopBg,
  children,
}: BrowserChromeProps) {
  const T = THEMES[variant];

  const back    = () => typeof window !== 'undefined' && window.history.back();
  const forward = () => typeof window !== 'undefined' && window.history.forward();
  const reload  = () => typeof window !== 'undefined' && window.location.reload();
  const home    = () => typeof window !== 'undefined' && (window.location.href = '/');
  const print   = () => typeof window !== 'undefined' && window.print();
  const contact = () => typeof window !== 'undefined' && (window.location.href = '/contact');

  // Map toolbar button labels to actions and to clean spoken names
  // (the visible labels lead with a decorative glyph that reads oddly on its own).
  const actions: Record<string, (() => void) | undefined> = {
    '◀ Back': back, '◀': back,
    '▶ Fwd': forward, '▶': forward,
    '⟳ Reload': reload, '⟳ Refresh': reload,
    '🏠 Home': home,
    '🖨 Print': print,
    '📧 Email': contact,
  };
  const toolbarAriaLabels: Record<string, string> = {
    '◀ Back': 'Back', '◀': 'Back',
    '▶ Fwd': 'Forward', '▶': 'Forward',
    '⟳ Reload': 'Reload', '⟳ Refresh': 'Refresh',
    '🏠 Home': 'Home',
    '🖨 Print': 'Print',
    '📧 Email': 'Email us',
  };

  return (
    <>
      {/* ── Desktop / outer frame ──────────────────────────────────────────── */}
      {/* Bottom stops short by --startbar-h so the persistent site taskbar
          (components/StartBar) never covers the browser window. */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 'var(--startbar-h, 0px)',
          background: desktopBg ?? T.desktop,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px',
          fontFamily: T.font,
        }}
      >
        {/* ── Browser window ──────────────────────────────────────────────── */}
        <div
          style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            border: T.borderStyle + ' ' + T.chromeLight,
            boxShadow: '3px 3px 0 rgba(0,0,0,0.6)',
            maxWidth: 1200,
          }}
        >

          {/* ── Title bar ────────────────────────────────────────────────── */}
          {/* Not aria-hidden overall: the close button below is a real,
              working control and a blanket aria-hidden on this container
              would hide it from screen readers no matter what the button
              itself declares. The logo glyph and fake title text are
              decorative/redundant with document.title, so those are
              hidden individually instead. */}
          <div
            style={{
              background: T.titleBg,
              height: 26, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              padding: '0 4px 0 6px', gap: 5,
              userSelect: 'none',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '13px', flexShrink: 0 }}>{T.logo}</span>
            <span aria-hidden="true" style={{
              flex: 1, fontSize: '11px', fontFamily: T.titleFont,
              color: T.titleFg, fontWeight: 'bold',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {title}
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              <WinBtn label="─" theme={T} />
              <WinBtn label="□" theme={T} />
              <WinBtn label="✕" danger theme={T} onClick={home} ariaLabel="Close and go home" />
            </div>
          </div>

          {/* ── Menu bar ─────────────────────────────────────────────────── */}
          <div
            aria-hidden="true"
            className="retro-chrome-menubar"
            style={{
              background: T.chrome, flexShrink: 0,
              height: 22, display: 'flex', alignItems: 'center',
              borderBottom: `1px solid ${T.chromeDark}`,
              padding: '0 2px',
            }}
          >
            {T.menuItems.map((item) => (
              <TBtn key={item} label={item} theme={T} />
            ))}
          </div>

          {/* ── Toolbar ──────────────────────────────────────────────────── */}
          {/* Not aria-hidden overall: Back/Fwd/Reload/Home/Print/Email below are
              real, working controls. The address bar segment (pure decoration)
              is hidden individually instead. */}
          <div
            className="retro-chrome-toolbar"
            style={{
              background: T.chrome, flexShrink: 0,
              minHeight: 30, display: 'flex', alignItems: 'center',
              padding: '2px 4px', gap: '1px',
              borderBottom: `1px solid ${T.chromeDark}`,
              flexWrap: 'nowrap', overflow: 'hidden',
            }}
          >
            {T.toolbarBtns.map((btn) => (
              <TBtn key={btn} label={btn} onClick={actions[btn]} ariaLabel={toolbarAriaLabels[btn]} theme={T} />
            ))}
            {/* Address / Location / Keyword segment: pure decoration, hidden on
                phones so the working buttons keep a single clean row */}
            <div aria-hidden="true" className="retro-chrome-addr" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <div style={{ width: 1, height: 20, background: T.chromeDark, margin: '0 3px', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontFamily: T.font, color: '#000', flexShrink: 0 }}>
                {T.addrLabel}
              </span>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', minWidth: 0,
                background: '#fff',
                border: `2px inset ${T.chromeDark}`,
                height: 20, padding: '0 5px', overflow: 'hidden',
              }}>
                <span style={{
                  fontSize: '10px', fontFamily: '"Courier New", Courier, monospace',
                  color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {url}
                </span>
              </div>
              {variant !== 'mosaic' && (
                <button tabIndex={-1} style={{
                  background: T.chrome, border: `1px outset ${T.chromeLight}`,
                  padding: '1px 8px', fontSize: '11px', fontFamily: T.font,
                  cursor: 'default', flexShrink: 0,
                }}>
                  Go
                </button>
              )}
            </div>
          </div>

          {/* ── Scrollable content ────────────────────────────────────────── */}
          {/* overflow:auto + flex:1 makes this a fixed-height scroll box.
              Do NOT add display:flex here — flex containers with overflow:auto
              cause min-height:100% on children to stop working past the scroll
              point, cutting off page backgrounds. Plain block layout lets
              <main> grow naturally with its content. */}
          <div
            id="browser-content"
            style={{
              flex: 1,
              overflow: 'auto',
              background: contentBg ?? 'transparent',
            }}
          >
            {children}
          </div>

          {/* ── Status bar ───────────────────────────────────────────────── */}
          <div
            aria-hidden="true"
            style={{
              background: T.chrome, flexShrink: 0,
              height: 20, display: 'flex', alignItems: 'center',
              padding: '0 6px',
              borderTop: `1px solid ${T.chromeDark}`,
              fontSize: '10px', fontFamily: T.font, color: '#000',
              gap: 8,
            }}
          >
            <span>{T.statusText}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
              {[0,1,2,3,4].map((i) => (
                <div key={i} style={{
                  width: 18, height: 12,
                  background: i < 4 ? '#1464c8' : T.chrome,
                  border: `1px solid ${T.chromeDark}`,
                }} />
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        /* Small screens: drop the decorative menu bar and address bar so the
           working Back / Fwd / Home buttons sit on one clean row */
        @media (max-width: 560px) {
          .retro-chrome-menubar { display: none !important; }
          .retro-chrome-addr { display: none !important; }
        }
        /* Ensure <main> always fills the browser content area so backgrounds don't cut short.
           min-height:100% (not flex:1) is the correct fix — flex:1 constrains <main> to
           the visible viewport height, so long pages scroll *outside* the element and lose
           its background. min-height:100% sets a floor of the visible height while allowing
           the element to grow naturally with its content. */
        #browser-content > main { min-height: 100%; }
      `}</style>
    </>
  );
}
