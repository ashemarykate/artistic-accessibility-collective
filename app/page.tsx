'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ── Nav structure — two sub-folders under Artistic Accessibility ──────────────
type NavItem = { label: string; href: string; icon: string; iconBg: string; iconName: string; external?: boolean; iconSrc?: string };

const RESOURCES_ITEMS: NavItem[] = [
  { label: 'Accessibility Resources', href: '/resources', icon: '🔵', iconBg: '#2272c8', iconName: 'Blue Circle',       iconSrc: '/images/icons/info.svg' },
  { label: 'The Library',             href: '/library',   icon: '📚', iconBg: '#2a7a52', iconName: 'Books',             iconSrc: '/images/icons/books.svg' },
  { label: 'The Cinema',              href: '/cinema',    icon: '🎬', iconBg: '#7a3abf', iconName: 'Movie Clapper',     iconSrc: '/images/icons/film.svg' },
];

const TOGETHER_ITEMS: NavItem[] = [
  { label: 'Make Art', href: '/make-art', icon: '🎨', iconBg: '#c85a20', iconName: 'Artist Palette', iconSrc: '/images/icons/palette.svg' },
];

const MORE_ITEMS: NavItem[] = [
  { label: 'Contact Us',     href: '/contact',          icon: '✉️', iconBg: '#3a6abf', iconName: 'Envelope',        iconSrc: '/images/icons/envelope.svg' },
  {
    label: 'Instagram',
    href: 'https://instagram.com/artisticaccessibility',
    icon: '📸', iconBg: '#b83878', iconName: 'Camera',
    external: true,
    iconSrc: '/images/icons/camera.svg',
  },
  { label: 'Help',           href: '/help',             icon: '🔍', iconBg: '#9a7212', iconName: 'Magnifying Glass', iconSrc: '/images/icons/magnifier.svg' },
];

// ── Member nav items (shown in Explorer when logged in) ───────────────────────
type MemberNavItem = { label: string; href: string; icon: string; iconBg: string };

const MEMBER_NAV: MemberNavItem[] = [
  { label: 'Buddy List',   href: '/messages',    icon: '💬', iconBg: '#1a4fbb' },
  { label: 'Backstage',       href: '/dashboard',   icon: '🔦', iconBg: '#2a6a9a' },
  { label: 'My Lists',     href: '/my-lists',    icon: '📋', iconBg: '#2a7a52' },
  { label: 'Feedback',     href: '/feedback',    icon: '📝', iconBg: '#7a3abf' },
  { label: 'My Resources', href: '/my-resources',icon: '⭐', iconBg: '#9a7212' },
];

// ── Desktop-style icon (for Explorer nav) ─────────────────────────────────────
// size="sm"  → compact 16×16 tree-view icon (left panel); uses pixel-art imgSrc if provided
// size="md"  → standard 22×22 taskbar/button icon (default); emoji-in-box
function NavIcon({ icon, bg, name: _name, size = 'md', imgSrc }: {
  icon: string; bg: string; name: string; size?: 'sm' | 'md'; imgSrc?: string
}) {
  const dim  = size === 'sm' ? 16  : 22;
  const fs   = size === 'sm' ? 10  : 13;
  const mr   = size === 'sm' ? 5   : 6;
  const br   = size === 'sm' ? 2   : 3;

  // Pixel-art mode: bare image, no coloured box
  if (imgSrc && size === 'sm') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        width={dim}
        height={dim}
        alt=""
        aria-hidden="true"
        className="xp-pixel-icon"
        style={{ marginRight: mr, flexShrink: 0, imageRendering: 'pixelated' }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        minWidth: dim,
        background: bg,
        borderRadius: br,
        fontSize: fs,
        marginRight: mr,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.2)',
        border: '1px solid rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
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

// ── Clock (client-only to avoid hydration mismatch) ───────────────────────────
function Clock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser]           = useState<{ id: string } | null>(null);
  const [memberType, setMemberType] = useState<'collective' | 'access_card' | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      // Fetch member type so we can show the right nav link
      const { data: prof } = await supabase
        .from('profiles')
        .select('member_type')
        .eq('user_id', data.user.id)
        .maybeSingle();
      setMemberType((prof?.member_type as 'collective' | 'access_card') ?? 'collective');
    });
  }, []);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontWeight: 'bold', fontSize: 13, fontFamily: 'var(--font-accent), sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.4)', letterSpacing: '0.01em' }}>
            <span aria-hidden="true" style={{ fontSize: 14 }}>📁</span>
            Artistic Accessibility
          </div>
          <WindowButtons />
        </div>

        {/* ── Mobile brand strip (hidden on desktop, shown on mobile) ───────── */}
        <div className="xp-mobile-brand" aria-hidden="true" style={{
          display: 'none',
          background: 'linear-gradient(to bottom, #1a4fbb 0%, #1c52c8 100%)',
          padding: '12px 20px',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #1a3a8a',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-across-blue-bg.svg"
            alt=""
            style={{ width: '100%', maxWidth: 220, height: 'auto', display: 'block' }}
          />
        </div>

        {/* ── Menu bar ───────────────────────────────────────────────────────── */}
        <div className="xp-menu-bar" style={{ background: '#ece9d8', borderBottom: '1px solid #b4b0a8', padding: '1px 4px', display: 'flex', gap: 0 }}>
          {['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].map((item) => (
            <span key={item} style={{ padding: '2px 8px', cursor: 'default', fontSize: 11, color: '#000' }}>{item}</span>
          ))}
        </div>

        {/* ── Standard toolbar ───────────────────────────────────────────────── */}
        <div className="xp-toolbar" style={{ background: '#ece9d8', borderBottom: '1px solid #b4b0a8', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
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
        <div className="xp-address-bar" style={{ background: '#ece9d8', borderBottom: '2px solid #b4b0a8', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
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
            <div style={{
              background: 'linear-gradient(to bottom, #5b9bd5 0%, #2e6db4 100%)',
              color: 'white', fontWeight: 'bold', fontSize: 11,
              padding: '4px 10px',
              borderBottom: '1px solid #2060a0',
            }} aria-hidden="true">
              All Folders
            </div>

            <ul style={{ listStyle: 'none', padding: '6px 4px', margin: 0, flex: 1 }} role="list">
              <li className="xp-folder-label" style={{ color: '#333', padding: '1px 4px', userSelect: 'none', fontSize: 11 }} aria-hidden="true">
                🖥️ Artistic Accessibility
              </li>

              <li className="xp-folder-label" style={{ paddingLeft: 28, userSelect: 'none', fontSize: 11, color: '#333', marginTop: 1 }} aria-hidden="true">
                <span aria-hidden="true">📂</span>{' '}RESOURCES
              </li>
              {RESOURCES_ITEMS.map((item) => (
                <li key={item.href} style={{ paddingLeft: 40 }}>
                  <Link
                    href={item.href}
                    style={{ display: 'flex', alignItems: 'center', padding: '1px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                    className="xp-folder-link"
                  >
                    <NavIcon icon={item.icon} bg={item.iconBg} name={item.iconName} size="sm" imgSrc={item.iconSrc} />
                    {item.label}
                  </Link>
                </li>
              ))}

              <li className="xp-folder-label" style={{ paddingLeft: 28, userSelect: 'none', fontSize: 11, color: '#333', marginTop: 3 }} aria-hidden="true">
                <span aria-hidden="true">📂</span>{' '}TOGETHER
              </li>
              {TOGETHER_ITEMS.map((item) => (
                <li key={item.href} style={{ paddingLeft: 40 }}>
                  <Link
                    href={item.href}
                    style={{ display: 'flex', alignItems: 'center', padding: '1px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                    className="xp-folder-link"
                  >
                    <NavIcon icon={item.icon} bg={item.iconBg} name={item.iconName} size="sm" imgSrc={item.iconSrc} />
                    {item.label}
                  </Link>
                </li>
              ))}

              <li className="xp-folder-label" style={{ paddingLeft: 28, userSelect: 'none', fontSize: 11, color: '#333', marginTop: 3 }} aria-hidden="true">
                <span aria-hidden="true">📂</span>{' '}MORE
              </li>
              {MORE_ITEMS.map((item) => (
                <li key={item.href} style={{ paddingLeft: 40 }}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', padding: '1px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                      className="xp-folder-link"
                    >
                      <NavIcon icon={item.icon} bg={item.iconBg} name={item.iconName} size="sm" imgSrc={item.iconSrc} />
                      {item.label}
                      <span className="sr-only"> (opens Instagram in new tab)</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      style={{ display: 'flex', alignItems: 'center', padding: '1px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                      className="xp-folder-link"
                    >
                      <NavIcon icon={item.icon} bg={item.iconBg} name={item.iconName} size="sm" imgSrc={item.iconSrc} />
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}

              {/* THE COLLECTIVE — always visible; contents swap on auth state + member type */}
              <li className="xp-folder-label" style={{ paddingLeft: 28, userSelect: 'none', fontSize: 11, color: '#333', marginTop: 3 }} aria-hidden="true">
                <span aria-hidden="true">📂</span>{' '}THE COLLECTIVE
              </li>
              {user && memberType === 'access_card' ? (
                <li style={{ paddingLeft: 40 }}>
                  <Link
                    href="/access-card"
                    style={{ display: 'flex', alignItems: 'center', padding: '1px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                    className="xp-folder-link"
                  >
                    <NavIcon icon="🪪" bg="#2a6a9a" name="Access Card" size="sm" />
                    Access Card
                  </Link>
                </li>
              ) : user ? (
                <li style={{ paddingLeft: 40 }}>
                  <Link
                    href="/dashboard"
                    style={{ display: 'flex', alignItems: 'center', padding: '1px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                    className="xp-folder-link"
                  >
                    <NavIcon icon="🔦" bg="#1a4fbb" name="Backstage" size="sm" imgSrc="/images/icons/flashlight.svg" />
                    Backstage
                  </Link>
                </li>
              ) : (
                <>
                  <li style={{ paddingLeft: 40 }}>
                    <Link
                      href="/login"
                      style={{ display: 'flex', alignItems: 'center', padding: '1px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                      className="xp-folder-link"
                    >
                      <NavIcon icon="🔑" bg="#3a6abf" name="Log In" size="sm" />
                      Log In
                    </Link>
                  </li>
                  <li style={{ paddingLeft: 40 }}>
                    <Link
                      href="/submit"
                      style={{ display: 'flex', alignItems: 'center', padding: '1px 4px', borderRadius: 2, textDecoration: 'none', color: '#000', fontSize: 11 }}
                      className="xp-folder-link"
                    >
                      <NavIcon icon="✨" bg="#7a3abf" name="Join" size="sm" />
                      Join the Collective
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* ── Right panel — contents ────────────────────────────────────────── */}
          <div
            className="xp-image-panel"
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
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontSize: 11, color: '#555',
        }} aria-hidden="true">
          <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-accent), sans-serif', letterSpacing: '0.02em' }}>together, together</span>
        </div>
      </div>

      {/* ── Taskbar ────────────────────────────────────────────────────────────── */}
      <div className="xp-taskbar" style={{
        width: '100%', maxWidth: 920,
        marginTop: 12,
        background: 'linear-gradient(to bottom, #2a6dd9 0%, #1a4fbb 50%, #1f5ac4 100%)',
        borderRadius: 4,
        padding: '3px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {user ? (
            <Link
              href="/dashboard"
              style={{
                background: 'linear-gradient(to right, #4c8ad4, #2a5abf)',
                borderRadius: 12,
                padding: '3px 12px 3px 8px',
                color: 'white', fontWeight: 'bold', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                textDecoration: 'none',
              }}
              aria-label="Go to Backstage"
            >
              <NavIcon icon="🔦" bg="#3a7abf" name="Backstage" />
              Backstage
            </Link>
          ) : (
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
              aria-label="Log In"
            >
              <NavIcon icon="🔑" bg="#3a7abf" name="Key" />
              Log In
            </Link>
          )}
          <Link
            href="/submit"
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '3px 12px 3px 10px',
              color: 'white', fontWeight: 'bold', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 5,
              border: '1px solid rgba(255,255,255,0.25)',
              textDecoration: 'none',
            }}
            aria-label="Join the Collective"
          >
            <NavIcon icon="✨" bg="#7a3abf" name="Sparkles" />
            Join
          </Link>
        </div>
        <div aria-hidden="true" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          <Clock />
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

        /* ── Mobile ────────────────────────────────────────────────────────────── */
        @media (max-width: 580px) {
          /* Show brand strip, hide image panel and redundant chrome */
          .xp-mobile-brand { display: flex !important; }
          .xp-image-panel  { display: none !important; }
          .xp-menu-bar,
          .xp-toolbar,
          .xp-address-bar  { display: none !important; }
          .xp-taskbar      { display: none !important; }

          /* Full-width nav panel */
          .xp-left-panel   { width: 100% !important; border-right: none !important; }
          .xp-content-pane { min-height: auto !important; }

          /* Readable font sizes */
          .xp-folder-link  { font-size: 15px !important; }
          .xp-folder-label { font-size: 13px !important; }

          /* Touch targets: ~44px tall (WCAG 2.5.8) */
          .xp-folder-link {
            padding: 12px 10px !important;
            min-height: 44px !important;
          }

          /* Scale up pixel-art icons to match larger text */
          .xp-pixel-icon {
            width: 20px !important;
            height: 20px !important;
            margin-right: 8px !important;
          }

          /* A little more breathing room between folder sections */
          .xp-folder-label { margin-top: 6px !important; }
        }
      `}</style>

    </main>
  );
}
