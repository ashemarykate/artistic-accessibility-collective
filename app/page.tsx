'use client';
import Link from 'next/link';

// ── Nav structure — two sub-folders under Artistic Accessibility ──────────────
type NavItem = { label: string; href: string; folderColor: string; tabColor: string; external?: boolean };

const RESOURCES_ITEMS: NavItem[] = [
  { label: 'Accessibility Resources', href: '/resources', folderColor: '#e0a030', tabColor: '#c08020' },
  { label: 'The Library',             href: '/library',   folderColor: '#4aaa7f', tabColor: '#3a8a65' },
  { label: 'The Cinema',              href: '/cinema',    folderColor: '#9a5abf', tabColor: '#7a3a9f' },
  { label: 'Help',                    href: '/help',      folderColor: '#d08030', tabColor: '#b06020' },
];

const COLLECTIVE_ITEMS: NavItem[] = [
  { label: 'Contact Us',  href: '/contact',  folderColor: '#d05a40', tabColor: '#b04030' },
  {
    label: 'Instagram',
    href: 'https://instagram.com/artisticaccessibility',
    folderColor: '#d44a88',
    tabColor: '#b03a6a',
    external: true,
  },
  { label: 'The Collective', href: '/members',  folderColor: '#3a6abf', tabColor: '#2a5aaf' },
  { label: 'Make Art',      href: '/make-art', folderColor: '#cc4488', tabColor: '#aa2266' },
];

// ── Small folder SVG icon ─────────────────────────────────────────────────────
function FolderIcon({ body, tab }: { body: string; tab: string }) {
  return (
    <svg width="20" height="17" viewBox="0 0 20 17" aria-hidden="true" style={{ flexShrink: 0, marginRight: 5, verticalAlign: 'middle' }}>
      {/* Tab */}
      <path d="M1,6 L1,15 Q1,16 2,16 L18,16 Q19,16 19,15 L19,6 Z" fill={body} />
      <path d="M1,6 L1,5 Q1,4 2,4 L7,4 L8.5,6 Z" fill={tab} />
      {/* Body */}
      <rect x="1" y="6" width="18" height="10" rx="1" fill={body} />
      <rect x="1" y="6" width="18" height="3" rx="0" fill={tab} opacity="0.25" />
    </svg>
  );
}

// ── XP window control buttons ─────────────────────────────────────────────────
function WindowButtons() {
  const btn = (label: string, bg: string) => (
    <div
      aria-hidden="true"
      style={{
        width: 18, height: 16,
        background: bg,
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 9, fontWeight: 'bold', lineHeight: 1,
        cursor: 'default', userSelect: 'none', letterSpacing: 0,
      }}
    >
      {label}
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {btn('_', 'rgba(255,255,255,0.18)')}
      {btn('□', 'rgba(255,255,255,0.18)')}
      {btn('✕', '#c0392b')}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--aac-blue)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: '"Tahoma", "MS Sans Serif", Arial, sans-serif',
        fontSize: 12,
        overflow: 'auto',
      }}
    >
      <h1 className="sr-only">Artistic Accessibility Collective</h1>

      {/* ── Explorer Window ─────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 920,
        border: '2px solid #1a4fbb',
        borderRadius: '8px 8px 3px 3px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25)',
        overflow: 'hidden',
      }}>

        {/* ── Title bar ──────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(to right, #245edb 0%, #3c93f5 60%, #2870e0 100%)',
          padding: '4px 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontWeight: 'bold', fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            <span aria-hidden="true" style={{ fontSize: 14 }}>📁</span>
            Artistic Accessibility
          </div>
          <WindowButtons />
        </div>

        {/* ── Menu bar ───────────────────────────────────────────────────────── */}
        <div style={{ background: '#ece9d8', borderBottom: '1px solid #b4b0a8', padding: '1px 4px', display: 'flex', gap: 0 }}>
          {['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].map((item) => (
            <span key={item} style={{ padding: '2px 8px', cursor: 'default', fontSize: 11, color: '#000' }}>{item}</span>
          ))}
        </div>

        {/* ── Standard toolbar ───────────────────────────────────────────────── */}
        <div style={{ background: '#ece9d8', borderBottom: '1px solid #b4b0a8', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {['← Back', '→', '↑'].map((btn) => (
            <span key={btn} aria-hidden="true" style={{
              padding: '1px 6px', fontSize: 11, cursor: 'default',
              border: '1px solid transparent', borderRadius: 2,
              color: '#555', userSelect: 'none',
            }}>{btn}</span>
          ))}
          <div style={{ width: 1, height: 18, background: '#b4b0a8', margin: '0 2px' }} aria-hidden="true" />
          {['🔍 Search', '📁 Folders'].map((btn) => (
            <span key={btn} aria-hidden="true" style={{ padding: '1px 8px', fontSize: 11, cursor: 'default', color: '#333', userSelect: 'none' }}>{btn}</span>
          ))}
        </div>

        {/* ── Address bar ────────────────────────────────────────────────────── */}
        <div style={{ background: '#ece9d8', borderBottom: '2px solid #b4b0a8', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#333', userSelect: 'none' }}>Address</span>
          <div style={{
            flex: 1, background: '#fff',
            border: '1px solid #7a7a7a',
            padding: '1px 6px', fontSize: 11, color: '#000',
            userSelect: 'none',
          }}>
            C:\Artistic Accessibility\
          </div>
          <span aria-hidden="true" style={{ fontSize: 11, padding: '1px 6px', border: '1px solid #b4b0a8', borderRadius: 2, background: '#ece9d8', cursor: 'default', userSelect: 'none' }}>Go</span>
        </div>

        {/* ── Content pane ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', minHeight: 460 }} className="xp-content-pane">

          {/* ── Left panel — navigation ──────────────────────────────────────── */}
          <nav
            aria-label="Artistic Accessibility navigation"
            className="xp-left-panel"
            style={{
              width: 210, flexShrink: 0,
              background: '#dce5f0',
              borderRight: '1px solid #b4b0a8',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* "All Folders" header */}
            <div style={{
              background: 'linear-gradient(to bottom, #5b9bd5 0%, #2e6db4 100%)',
              color: 'white', fontWeight: 'bold', fontSize: 11,
              padding: '4px 10px',
              borderBottom: '1px solid #2060a0',
            }} aria-hidden="true">
              All Folders
            </div>

            {/* Folder tree */}
            <ul style={{ listStyle: 'none', padding: '6px 4px', margin: 0, flex: 1 }} role="list">
              {/* Desktop → Artistic Accessibility (non-link, structural) */}
              <li style={{ color: '#333', padding: '1px 4px', userSelect: 'none', fontSize: 11 }} aria-hidden="true">
                🖥️ Desktop
              </li>
              <li style={{ color: '#333', padding: '1px 4px 1px 16px', userSelect: 'none', fontSize: 11 }} aria-hidden="true">
                <span aria-hidden="true">📂</span>{' '}
                <strong style={{ color: '#000' }}>Artistic Accessibility</strong>
              </li>

              {/* Sub-folder: Resources */}
              <li style={{ paddingLeft: 28, userSelect: 'none', fontSize: 11, color: '#333', marginTop: 1 }} aria-hidden="true">
                <span aria-hidden="true">📂</span>{' '}Resources
              </li>
              {RESOURCES_ITEMS.map((item) => (
                <li key={item.href} style={{ paddingLeft: 40 }}>
                  <Link
                    href={item.href}
                    style={{ display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                    className="xp-folder-link"
                  >
                    <FolderIcon body={item.folderColor} tab={item.tabColor} />
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Sub-folder: The Collective */}
              <li style={{ paddingLeft: 28, userSelect: 'none', fontSize: 11, color: '#333', marginTop: 3 }} aria-hidden="true">
                <span aria-hidden="true">📂</span>{' '}The Collective
              </li>
              {COLLECTIVE_ITEMS.map((item) => (
                <li key={item.href} style={{ paddingLeft: 40 }}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                      className="xp-folder-link"
                    >
                      <FolderIcon body={item.folderColor} tab={item.tabColor} />
                      {item.label}
                      <span className="sr-only"> (opens Instagram in new tab)</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      style={{ display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                      className="xp-folder-link"
                    >
                      <FolderIcon body={item.folderColor} tab={item.tabColor} />
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Right panel — contents ────────────────────────────────────────── */}
          <div
            role="region"
            aria-label="Contents of Artistic Accessibility"
            style={{
              flex: 1,
              background: 'var(--aac-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              minHeight: 400,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/landing.png"
              alt="Artistic Accessibility Collective: together, together"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* ── Status bar ─────────────────────────────────────────────────────── */}
        <div style={{
          background: '#ece9d8',
          borderTop: '1px solid #b4b0a8',
          padding: '2px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 11, color: '#333',
        }} aria-hidden="true">
          <span>8 object(s)</span>
          <span>Ready</span>
        </div>
      </div>

      {/* ── Taskbar ────────────────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 920,
        marginTop: 12,
        background: 'linear-gradient(to bottom, #2a6dd9 0%, #1a4fbb 50%, #1f5ac4 100%)',
        borderRadius: 4,
        padding: '3px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link
            href="/login"
            style={{
              background: 'linear-gradient(to right, #4c8ad4, #2a5abf)',
              borderRadius: 12,
              padding: '3px 12px 3px 8px',
              color: 'white', fontWeight: 'bold', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
              textDecoration: 'none',
            }}
            aria-label="Member Log In"
          >
            <FolderIcon body="#5a9ae4" tab="#3a7abf" />
            Member Log In
          </Link>
          <Link
            href="/share-feedback"
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '3px 12px 3px 10px',
              color: 'white', fontWeight: 'bold', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 5,
              border: '1px solid rgba(255,255,255,0.25)',
              textDecoration: 'none',
            }}
            aria-label="Share Feedback"
          >
            💬 Share Feedback
          </Link>
        </div>
        <div aria-hidden="true" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <style>{`
        .xp-folder-link:hover,
        .xp-folder-link:focus-visible {
          background: #316ac5;
          color: white !important;
          outline: 2px solid #f5d84a;
          outline-offset: 1px;
        }
        .xp-folder-link:hover svg path,
        .xp-folder-link:hover svg rect { opacity: 0.9; }

        /* Mobile: hide left nav panel, let image fill the window */
        @media (max-width: 580px) {
          .xp-left-panel { display: none !important; }
          .xp-content-pane { min-height: 300px !important; }
        }
      `}</style>

    </main>
  );
}

