'use client';

/**
 * StartBar — persistent bottom taskbar + Start menu for every page except home.
 *
 * The home page (app/page.tsx) has its own richer Win95 taskbar that also
 * manages the little windows opening on the desktop. Every other page is a
 * standalone screen, so this gives them a shared, consistent way to jump
 * anywhere on the site without going Home first.
 *
 * The Start menu keeps the retro collapsible-folder shape: top-level leaves
 * plus folders you tap to expand. All items are real navigation (Links), so
 * the menu works the same on desktop and phone.
 *
 * Space for the bar is reserved by the --startbar-h CSS var: BrowserChrome and
 * the full-screen pages leave that much room at the bottom so nothing hides
 * behind it. This component sets the var and never overlaps content.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const RAISED = 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf';
const SUNKEN = 'inset 1px 1px 0 #0a0a0a, inset -1px -1px 0 #fff, inset 2px 2px 0 #808080, inset -2px -2px 0 #dfdfdf';
const SILVER = '#c3c3c3';
const UIFONT = '"Tahoma","MS Sans Serif",Arial,sans-serif';

const IMG = (n: string | number) => `/images/desktop-icons/icon-${n}.png`;

// ── Navigation model ──────────────────────────────────────────────────────────
// Reorganized for simple use: single-item folders (PLAY, MORE TO COME) folded
// into logical groups. Every destination is one tap away, two for folder items.

type Leaf = { label: string; icon: string | number; href: string; ext?: boolean };
type Node =
  | { type: 'leaf'; item: Leaf }
  | { type: 'folder'; name: string; children: Leaf[] };

const NAV: Node[] = [
  { type: 'leaf', item: { label: 'Home', icon: 'about-blue', href: '/' } },
  { type: 'folder', name: 'EXPLORE', children: [
    { label: 'Make Art',    icon: 70,        href: '/make-art' },
    { label: 'Calendar',    icon: 'cal',     href: '/calendar' },
    { label: 'The Library', icon: 82,        href: '/library' },
    { label: 'The Cinema',  icon: 56,        href: '/cinema' },
    { label: 'The Printer', icon: 'printer', href: '/printer' },
  ] },
  { type: 'folder', name: 'RESOURCES', children: [
    { label: 'Resources',    icon: 48, href: '/resources' },
    { label: 'Learning Hub', icon: 80, href: '/learning-hub' },
  ] },
  { type: 'folder', name: 'CONNECT', children: [
    { label: 'About Us',     icon: 'about-blue', href: '/about' },
    { label: 'Work With Us', icon: 62,           href: '/work-with-us' },
    { label: 'Contact Us',   icon: 64,           href: '/contact' },
    { label: 'Instagram',    icon: 51,           href: 'https://instagram.com/artisticaccessibility', ext: true },
  ] },
  { type: 'folder', name: 'MEMBERS', children: [
    { label: 'The Collective',     icon: 63, href: '/collective' },
    { label: 'Get an Access Card', icon: 52, href: '/access-card' },
  ] },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function Ico({ n, size }: { n: string | number; size: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={IMG(n)} alt="" aria-hidden="true" width={size} height={size}
    style={{ display: 'block', objectFit: 'contain' }} draggable={false} />;
}

function MenuLeaf({ item, size = 24, onNavigate }: { item: Leaf; size?: number; onNavigate: () => void }) {
  const common: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
    background: 'none', border: 'none', cursor: 'pointer', minHeight: 44,
    padding: '5px 14px 5px 10px', fontFamily: UIFONT, fontSize: 13.5, color: '#101010',
    textDecoration: 'none',
  };
  const inner = (
    <>
      <span aria-hidden="true" style={{ width: size, height: size, flexShrink: 0 }}><Ico n={item.icon} size={size} /></span>
      <span>{item.label}</span>
      {item.ext && <span className="sb-sr"> (opens in new tab)</span>}
    </>
  );
  if (item.ext) {
    return (
      <a className="sb-row" href={item.href} target="_blank" rel="noopener noreferrer" style={common} onClick={onNavigate}>
        {inner}
      </a>
    );
  }
  return <Link className="sb-row" href={item.href} style={common} onClick={onNavigate}>{inner}</Link>;
}

function MenuFolder({ name, kids, onNavigate }: { name: string; kids: Leaf[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'sb-folder' + (open ? ' open' : '')} style={{ position: 'relative' }}>
      <button type="button" className="sb-row" aria-haspopup="true" aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, padding: '5px 12px 5px 10px', fontFamily: UIFONT, fontSize: 13.5, color: '#101010', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
        <span aria-hidden="true" style={{ width: 26, height: 26, flexShrink: 0 }}><Ico n={48} size={26} /></span>
        <span style={{ flex: 1 }}>{name}</span>
        <span aria-hidden="true" style={{ fontSize: 10 }}>▶</span>
      </button>
      <div className="sb-sub" aria-label={name}
        style={{ position: 'absolute', left: '100%', bottom: -3, minWidth: 220, background: SILVER, boxShadow: RAISED, padding: 3, zIndex: 9902 }}>
        {kids.map(c => <MenuLeaf key={c.label} item={c} onNavigate={onNavigate} />)}
      </div>
    </div>
  );
}

function Menu({ onClose }: { onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    return () => {
      if (document.activeElement === document.body) {
        document.getElementById('sb-start-btn')?.focus();
      }
    };
  }, []);

  return (
    <>
      <button aria-label="Close menu" onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9900, background: 'none', border: 'none', cursor: 'default' }} />
      <div ref={menuRef} aria-label="Start menu" className="sb-menu"
        style={{ position: 'absolute', left: 4, bottom: 'calc(var(--startbar-h) + 2px)', zIndex: 9901, width: 252, background: SILVER, boxShadow: RAISED, padding: 3, display: 'flex', fontFamily: UIFONT }}>
        <div aria-hidden="true" style={{ width: 30, background: 'linear-gradient(#1c84d8,#000a7a)', position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%) rotate(-90deg)', transformOrigin: 'center', whiteSpace: 'nowrap', color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>
            Artistic <span style={{ fontWeight: 400 }}>Accessibility</span>
          </span>
        </div>
        <div className="sb-list" style={{ flex: 1, padding: '4px 0' }}>
          {NAV.map((node, i) => node.type === 'leaf'
            ? <MenuLeaf key={i} item={node.item} size={26} onNavigate={onClose} />
            : <MenuFolder key={i} name={node.name} kids={node.children} onNavigate={onClose} />)}
          <div aria-hidden="true" style={{ height: 2, background: '#808080', boxShadow: '0 1px 0 #fff', margin: '4px 6px' }} />
          <MenuLeaf item={{ label: 'Log In', icon: 46, href: '/login' }} size={26} onNavigate={onClose} />
        </div>
      </div>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function StartBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Close the menu whenever the route changes (a link was followed).
  useEffect(() => { setOpen(false); }, [pathname]);

  // Pages that already own their full-screen chrome, so a second taskbar would
  // just double up: the home desktop, the Make Art studio (its own taskbar),
  // and the immersive "channel" experiences (their own exits).
  const OWNS_CHROME =
    pathname === '/' ||
    pathname.startsWith('/make-art') ||
    pathname.endsWith('/the-channel');
  if (OWNS_CHROME) return null;

  return (
    <>
      {open && <Menu onClose={() => setOpen(false)} />}
      <div className="startbar" role="navigation" aria-label="Site taskbar"
        style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 'var(--startbar-h)', background: SILVER, boxShadow: 'inset 0 2px 0 #fff', borderTop: '2px solid #fff', display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px', zIndex: 9899, fontFamily: UIFONT, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button
          id="sb-start-btn"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-haspopup="true"
          style={{ height: 'calc(var(--startbar-h) - 8px)', minHeight: 40, background: SILVER, boxShadow: open ? SUNKEN : RAISED, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 0 8px', fontFamily: UIFONT, fontWeight: 700, fontSize: 15, color: '#0a0a0a' }}>
          <span aria-hidden="true" style={{ width: 24, height: 24, flexShrink: 0 }}><Ico n={56} size={24} /></span>
          Start
        </button>
        <div style={{ flex: 1 }} />
        <div aria-hidden="true" style={{ boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #fff', padding: '5px 12px', fontSize: 13, color: '#0a0a0a', flexShrink: 0 }}>
          {time}
        </div>
      </div>

      <style>{`
        :root { --startbar-h: 44px; }
        .sb-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .sb-row:hover,.sb-row:focus-visible{background:#0a246a;color:#fff!important;outline:2px solid #ffd21a;outline-offset:-2px;text-decoration:none}
        .sb-sub{display:none}
        .sb-folder:hover>.sb-sub,.sb-folder.open>.sb-sub{display:block}
        .sb-folder:hover>.sb-row,.sb-folder:focus-within>.sb-row,.sb-folder.open>.sb-row{background:#0a246a;color:#fff}
        @media (max-width: 600px){
          :root { --startbar-h: 42px; }
          .sb-menu{width:calc(100vw - 10px)!important}
          .sb-list{max-height:calc(100dvh - 96px)!important;overflow-y:auto!important}
          .sb-sub{position:static!important;left:auto!important;bottom:auto!important;min-width:0!important;box-shadow:none!important;background:#d4d4d4!important;border-left:3px solid #9a9a9a!important;margin:0 8px 4px 30px!important;padding:2px 0!important}
          .sb-folder:hover>.sb-sub{display:none}
          .sb-folder.open>.sb-sub{display:block}
        }
        @media (prefers-reduced-motion: reduce){.startbar *{animation:none!important}}
      `}</style>
    </>
  );
}
