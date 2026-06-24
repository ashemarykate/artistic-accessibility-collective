'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ── constants ─────────────────────────────────────────────────────────────────

const RAISED = 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf';
const SUNKEN = 'inset 1px 1px 0 #0a0a0a, inset -1px -1px 0 #fff, inset 2px 2px 0 #808080, inset -2px -2px 0 #dfdfdf';
const FIELD  = 'inset 1px 1px 0 #808080, inset -1px -1px 0 #fff';
const SILVER = '#c3c3c3';
const UIFONT = '"Tahoma","MS Sans Serif",Arial,sans-serif';

const IMG = (n: string | number) => `/images/desktop-icons/icon-${n}.png`;

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 137.508) % 100,
  y: (i * 71.234) % 100,
  r: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.4,
  o: 0.25 + (i % 6) * 0.1,
}));

const BETA_MSG = `✶  This site is currently in BETA. We’d love your feedback while it’s still developing. Thanks for helping us build it!`;

// ── types ─────────────────────────────────────────────────────────────────────

type WinKind = 'app' | 'aim' | 'explorer' | 'folder';

interface ItemDef {
  label: string;
  icon: string | number;
  kind: WinKind | 'ext';
  cat?: string;
  href?: string;
  blurb?: string;
  soon?: boolean;
  links?: Array<{ key: string; label: string; icon: string | number; ext?: boolean }>;
}

interface WinState {
  id: string;
  key: string;
  kind: WinKind;
  pos: { x: number; y: number };
  z: number;
}

// ── content model ─────────────────────────────────────────────────────────────

const ITEMS: Record<string, ItemDef> = {
  'about':            { label: 'About Us',               icon: 'about-blue', kind: 'app',      cat: 'Artistic Accessibility', href: '/about',           blurb: 'Meet the people behind Artistic Accessibility, artists and advocates making creativity open to everyone.' },
  'all-folders':      { label: 'All Folders',            icon: 'folders', kind: 'folder' },
  'make-art':         { label: 'Make Art',               icon: 70,        kind: 'app',      cat: 'Play',          href: '/make-art',        blurb: 'Step into the studio. Paint, draw and experiment with our accessible online art tools.' },
  'calendar':         { label: 'Calendar',               icon: 'cal',     kind: 'app',      cat: 'More to Come',  href: '/calendar',        blurb: 'Workshops, classes and community events, all in one place. Save your spot.' },
  'connect':          { label: 'Log In',                 icon: 'aim',     kind: 'aim' },
  'resources':        { label: 'Resources',              icon: 48,        kind: 'explorer' },
  'learning':         { label: 'Learning Hub',           icon: 80,        kind: 'app',      cat: 'More to Come',  href: '/learning-hub',    blurb: 'Guided lessons and tutorials at your own pace.' },
  'faq':              { label: 'FAQs',                   icon: 'faq',     kind: 'app',      cat: 'Resources',     href: '/help',            blurb: 'Frequently asked questions and answers, plus how to reach our support team.' },
  'hire':             { label: 'Work With Us',            icon: 62,        kind: 'app',      cat: 'Connect',       href: '/work-with-us',         blurb: 'Book us for workshops, talks and commissioned work.' },
  'join':             { label: 'Join the Collective',    icon: 50,        kind: 'app',      cat: 'Connect',       href: '/submit',          blurb: 'Become a member and join a welcoming creative community.' },
  'instagram':        { label: 'Instagram',              icon: 51,        kind: 'ext',      href: 'https://instagram.com/artisticaccessibility' },
  'collective':       { label: 'The Collective',         icon: 63,        kind: 'app',      cat: 'Members',       href: '/collective',      blurb: 'Member homepages, shared studios and the collective gallery.' },
  'contact':          { label: 'Contact Us',             icon: 64,        kind: 'app',      cat: 'Connect',       href: '/contact',         blurb: 'Drop us a line, we would love to hear from you.', links: [{ key: 'instagram', label: 'Instagram', icon: 51, ext: true }] },
  'access-resources': { label: 'Accessibility Resources', icon: 71,       kind: 'app',      cat: 'Resources',     href: '/accessibility',   blurb: 'Tools, guides and links to help make art accessible for every body and mind.' },
  'library':          { label: 'The Library',            icon: 82,        kind: 'app',      cat: 'Resources',     href: '/library',         blurb: 'Browse our growing collection of accessible reading and reference material.' },
  'cinema':           { label: 'The Cinema',             icon: 56,        kind: 'app',      cat: 'Resources',     href: '/cinema',          blurb: 'Watch films, recorded talks and described screenings on demand.' },
  'printer':          { label: 'The Printer',            icon: 'printer', kind: 'app',      cat: 'Resources',     href: '/printer',         blurb: 'A shared print room, drop PDFs and worksheets here so members can help each other.' },
  'access-card':      { label: 'Get an Access Card',     icon: 52,        kind: 'app',      cat: 'Connect',       href: '/access-card',     blurb: 'Your key to member benefits, discounts and accessible bookings.' },
};

const DESKTOP = ['about', 'all-folders', 'make-art', 'calendar', 'resources', 'learning', 'contact', 'collective'];

const POSITIONS: Record<string, { x: string; y: number }> = {
  'about':       { x: 'max(8px, 2%)',    y: 8   },
  'all-folders': { x: 'max(8px, 2%)',    y: 185 },
  'make-art':    { x: 'max(148px, 18%)', y: 55  },
  'collective':  { x: 'max(148px, 18%)', y: 265 },
  'calendar':    { x: 'max(8px, 2%)',    y: 355 },
  'resources':   { x: 'max(276px, 33%)', y: 18  },
  'contact':     { x: 'max(276px, 33%)', y: 215 },
  'learning':    { x: 'max(148px, 18%)', y: 380 },
};

const TREE: Array<{ type: 'leaf'; key: string } | { type: 'folder'; name: string; children: string[] }> = [
  { type: 'leaf',   key: 'about' },
  { type: 'folder', name: 'PLAY',          children: ['make-art'] },
  { type: 'folder', name: 'MORE TO COME',  children: ['calendar', 'learning'] },
  { type: 'folder', name: 'RESOURCES',     children: ['access-resources', 'library', 'cinema', 'printer'] },
  { type: 'folder', name: 'CONNECT',       children: ['access-card', 'hire', 'contact', 'instagram'] },
  { type: 'folder', name: 'MEMBERS',       children: ['collective'] },
];

// ── sub-components ────────────────────────────────────────────────────────────

function Ico({ n, size }: { n: string | number; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={IMG(n)} alt="" aria-hidden="true" width={size} height={size}
      style={{ display: 'block', objectFit: 'contain' }} draggable={false} />
  );
}

function DeskIcon({ k, onOpen, selected, onSelect }: {
  k: string;
  onOpen: (key: string) => void;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  const it = ITEMS[k];
  return (
    <button
      onClick={() => { onSelect(k); onOpen(k); }}
      onFocus={() => onSelect(k)}
      className="dsk-icon"
      aria-label={it.kind === 'ext' ? `${it.label} (opens in new tab)` : it.label}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 116, padding: '10px 6px 8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, WebkitTapHighlightColor: 'transparent' }}
    >
      <span className="dsk-icon-img-wrap" style={{ filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,.45))' }}>
        <Ico n={it.icon} size={64} />
      </span>
      <span className={'dsk-label' + (selected ? ' sel' : '')}>{it.label}</span>
    </button>
  );
}

function WinClose({ onClose, label, red }: { onClose: () => void; label: string; red?: boolean }) {
  return (
    <button onClick={onClose} aria-label={label} className="win-close"
      style={red
        ? { background: '#c0392b', border: '1px solid #8e1a11', borderRadius: 3, width: 26, height: 22, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }
        : { width: 28, height: 24, background: SILVER, boxShadow: RAISED, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 14, color: '#0a0a0a', fontFamily: UIFONT, paddingBottom: 2, flexShrink: 0 }}>
      ✕
    </button>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div style={{ boxShadow: FIELD, background: '#fff', padding: 3 }} aria-hidden="true">
      <div style={{ height: 90, background: 'repeating-linear-gradient(45deg,#e9e9e9 0 8px,#f6f6f6 8px 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8a8a8a', letterSpacing: 1 }}>{label}</span>
      </div>
    </div>
  );
}

function Btn({ children, onClick, primary, pressed }: { children: React.ReactNode; onClick?: () => void; primary?: boolean; pressed?: boolean }) {
  const [p, setP] = useState(false);
  const sunken = pressed || p;
  return (
    <button onClick={onClick}
      onPointerDown={() => setP(true)}
      onPointerUp={() => setP(false)}
      onPointerLeave={() => setP(false)}
      style={{ minWidth: 74, minHeight: 44, background: SILVER, boxShadow: sunken ? SUNKEN : RAISED, border: 'none', cursor: 'pointer', fontFamily: UIFONT, fontSize: 12.5, color: '#0a0a0a', padding: sunken ? '2px 11px 0 13px' : '0 12px', outline: primary ? '1px solid #0a0a0a' : 'none', outlineOffset: primary ? -3 : 0 }}>
      {children}
    </button>
  );
}

function Row({ icon, label, onClick, indent = 0, external, href }: {
  icon: string | number;
  label: string;
  onClick?: () => void;
  indent?: number;
  external?: boolean;
  href?: string;
}) {
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, padding: '6px 10px', paddingLeft: 10 + indent * 18, fontFamily: UIFONT, fontSize: 13, color: '#101010', borderBottom: '1px solid #f0ede8', boxSizing: 'border-box' };
  const inner = (
    <>
      <span aria-hidden="true" style={{ width: 22, height: 22, flexShrink: 0 }}><Ico n={icon} size={22} /></span>
      <span>{label}</span>
      {external && <span className="sr-only"> (opens in new tab)</span>}
    </>
  );
  if (href) return <Link href={href} className="win-row" style={{ ...rowStyle, textDecoration: 'none' }}>{inner}</Link>;
  return <button onClick={onClick} className="win-row" style={rowStyle}>{inner}</button>;
}

function AppBody({ k, onOpen, onClose }: { k: string; onOpen: (key: string) => void; onClose?: () => void }) {
  const it = ITEMS[k];
  const btnLink: React.CSSProperties = { minWidth: 74, minHeight: 44, background: SILVER, boxShadow: RAISED, border: 'none', cursor: 'pointer', fontFamily: UIFONT, fontSize: 12.5, color: '#0a0a0a', padding: '0 12px', outline: '1px solid #0a0a0a', outlineOffset: -3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' };

  if (k === 'about') {
    return (
      <div style={{ padding: 12 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          Welcome to ArtisticAccessibility.com! This is a community project filled with resources for those working and playing where the arts and accessibility overlap.
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          If you're here to play, search for something new to watch or read, or just explore, we suggest just clicking around!
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          If you're here looking for professional help with advising, staffing, accessibility designing, captioning, producing, or anything that it seems like we might know something about, click "Work With Us" below for more information.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn onClick={() => onOpen('all-folders')}>All Folders</Btn>
          <Link href="/work-with-us" style={btnLink}>Work With Us</Link>
        </div>
      </div>
    );
  }

  if (k === 'calendar') {
    return (
      <div style={{ padding: 12 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          {it.blurb}
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          We're working on pulling in event calendars from organizations across the arts and accessibility space so their events get more eyes, and we all get a richer calendar in one place.
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          This will include both in-person and online events. Coming soon!
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn onClick={() => onOpen('all-folders')}>All Folders</Btn>
          <Btn primary onClick={onClose}>OK</Btn>
        </div>
      </div>
    );
  }

  if (k === 'access-card') {
    return (
      <div style={{ padding: 12 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          Your Access Card is your digital ID for the arts accessibility community. It shows your credentials, specialties, and how to hire or contact you.
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          Once you have a card, you'll show up in our public directory and professionals in the field can find you directly.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Link href="/login" style={btnLink}>I Already Have One</Link>
          <Link href="/access-card/signup" style={btnLink}>Get Your Card</Link>
        </div>
      </div>
    );
  }

  if (k === 'join') {
    return (
      <div style={{ padding: 12 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          The Collective is currently in beta testing. A testing code is required to join at this stage.
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          Click below if you have a code and we'll get you set up!
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn onClick={onClose}>Close</Btn>
          <Link href="/submit" style={btnLink}>I Have a Code</Link>
        </div>
      </div>
    );
  }

  if (k === 'contact') {
    return (
      <div>
        <div style={{ background: '#fff' }}>
          <Row icon={51} label="Instagram" external onClick={() => window.open(ITEMS.instagram.href, '_blank', 'noopener')} />
          <Row icon={64} label="Send Message" href="/contact" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 12px', background: SILVER }}>
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <span aria-hidden="true" style={{ flexShrink: 0 }}><Ico n={it.icon} size={52} /></span>
        <div>
          {it.cat && <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{it.cat}</div>}
          <p style={{ margin: 0, fontSize: 13.5, color: '#101010', lineHeight: '19px' }}>{it.blurb}</p>
        </div>
      </div>
      <Placeholder label={it.soon ? 'coming soon' : `${k} page`} />
      {it.links && (
        <div style={{ marginTop: 12, boxShadow: FIELD, background: '#fff' }}>
          {it.links.map(l => (
            <Row key={l.key} icon={l.icon} label={l.label} external={l.ext}
              onClick={() => l.ext ? window.open(ITEMS[l.key]?.href, '_blank', 'noopener') : onOpen(l.key)} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <Btn onClick={() => onOpen('all-folders')}>All Folders</Btn>
        {it.href && !it.soon ? (
          <Link href={it.href}
            style={{ minWidth: 74, minHeight: 44, background: SILVER, boxShadow: RAISED, border: 'none', cursor: 'pointer', fontFamily: UIFONT, fontSize: 12.5, color: '#0a0a0a', padding: '0 12px', outline: '1px solid #0a0a0a', outlineOffset: -3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            OK
          </Link>
        ) : (
          <Btn primary onClick={() => {/* just stay in window */}}>OK</Btn>
        )}
      </div>
    </div>
  );
}

function FolderBody({ onOpen }: { onOpen: (key: string) => void }) {
  return (
    <div style={{ padding: 8 }}>
      <div style={{ boxShadow: FIELD, background: '#fff', maxHeight: 340, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px 6px' }}>
          <span aria-hidden="true" style={{ width: 24, height: 24 }}><Ico n={56} size={24} /></span>
          <span style={{ fontFamily: UIFONT, fontSize: 14, fontWeight: 700, color: '#101010' }}>Artistic Accessibility</span>
        </div>
        {TREE.map((node, i) => node.type === 'leaf'
          ? <Row key={i} icon={ITEMS[node.key].icon} label={ITEMS[node.key].label} indent={1} onClick={() => onOpen(node.key)} />
          : (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', paddingLeft: 28 }}>
                <span aria-hidden="true" style={{ width: 22, height: 22 }}><Ico n={48} size={22} /></span>
                <span style={{ fontFamily: UIFONT, fontSize: 12, color: '#333', textTransform: 'uppercase', letterSpacing: .5 }}>{node.name}</span>
              </div>
              {node.children.map(c => <Row key={c} icon={ITEMS[c].icon} label={ITEMS[c].label} indent={2} onClick={() => onOpen(c)} />)}
            </div>
          ))}
      </div>
    </div>
  );
}

function AimBody({ onOpen, account, onSignOut, onNavigate }: {
  onOpen: (key: string) => void;
  account: 'out' | 'collective' | 'access_card';
  onSignOut: () => void;
  onNavigate: (href: string) => void;
}) {
  const GroupHdr = ({ children }: { children: React.ReactNode }) => (
    <div aria-hidden="true" style={{ background: 'linear-gradient(to bottom,#eae7df,#d8d4cc)', borderTop: '1px solid #c8c4bc', borderBottom: '1px solid #c8c4bc', padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#1a4fbb', letterSpacing: '.04em' }}>
      ▶ {children}
    </div>
  );
  return (
    <div style={{ background: '#fff' }}>
      <GroupHdr>CONNECT</GroupHdr>
      <Row icon={52} label="Get an Access Card"  onClick={() => onOpen('access-card')} />
      <Row icon={50} label="Join the Collective" onClick={() => onOpen('join')} />
      <GroupHdr>MY ACCOUNT</GroupHdr>
      {account === 'access_card' ? (<>
        <Row icon={52} label="My Access Card"     onClick={() => onNavigate('/access-card')} />
        <Row icon={50} label="Sign Out"           onClick={onSignOut} />
      </>) : account === 'collective' ? (<>
        <Row icon={63} label="The Collective"     onClick={() => onNavigate('/collective')} />
        <Row icon={50} label="Sign Out"           onClick={onSignOut} />
      </>) : (<>
        <Row icon={46} label="Log In to The Collective"   onClick={() => onNavigate('/login')} />
        <Row icon={52} label="Log In to Your Access Card" onClick={() => onNavigate('/login')} />
      </>)}
      <div aria-hidden="true" style={{ background: '#ece9d8', borderTop: '1px solid #c8c4bc', padding: '4px 8px', fontSize: 10, color: '#666', textAlign: 'center', fontFamily: UIFONT }}>
        artisticaccessibility.com
      </div>
    </div>
  );
}

function ExplorerBody({ onOpen }: { onOpen: (key: string) => void }) {
  return (
    <div>
      <div aria-hidden="true" style={{ background: '#ece9d8', borderBottom: '1px solid #c8c4bc', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: UIFONT }}>
        <span style={{ color: '#555' }}>Address</span>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #7a7a7a', padding: '2px 5px', fontSize: 11, color: '#000' }}>
          C:\Artistic Accessibility\Resources\
        </div>
      </div>
      <div style={{ background: '#fff' }}>
        <Row icon={71} label="Accessibility Resources" href="/accessibility" />
        <Row icon={82} label="The Library"             href="/library" />
        <Row icon={56} label="The Cinema"              href="/cinema" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', minHeight: 44, borderBottom: '1px solid #f0ede8', opacity: 0.55 }}>
          <span aria-hidden="true" style={{ width: 22, height: 22, flexShrink: 0 }}><Ico n="printer" size={22} /></span>
          <span style={{ fontFamily: UIFONT, fontSize: 13, color: '#101010' }}>The Printer</span>
          <span style={{ fontFamily: UIFONT, fontSize: 10, color: '#666', marginLeft: 6, fontStyle: 'italic' }}>coming soon</span>
        </div>
      </div>
      <div aria-hidden="true" style={{ background: '#ece9d8', borderTop: '1px solid #c8c4bc', padding: '4px 8px', fontSize: 10, color: '#666', fontFamily: UIFONT }}>
        4 items
      </div>
    </div>
  );
}

function Win({ win, z, onClose, onFocus, onOpen, account, onSignOut, onNavigate }: {
  win: WinState;
  z: number;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  onOpen: (key: string) => void;
  account: 'out' | 'collective' | 'access_card';
  onSignOut: () => void;
  onNavigate: (href: string) => void;
}) {
  const it = ITEMS[win.key];
  const { kind } = win;
  const title = kind === 'aim' ? 'Buddy List' : kind === 'explorer' ? 'Resources' : kind === 'folder' ? 'All Folders' : it?.label ?? '';
  const titleIcon = kind === 'aim' ? 'aim' : kind === 'explorer' ? 48 : kind === 'folder' ? 'folders' : (it?.icon ?? 56);
  const width = kind === 'aim' ? 268 : kind === 'explorer' ? 286 : kind === 'folder' ? 300 : 308;
  const redClose = kind === 'aim' || kind === 'explorer';

  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(win.pos);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    onFocus(win.id);
    const ox = pos.x, oy = pos.y, sx = e.clientX, sy = e.clientY;
    const move = (ev: PointerEvent) => setPos({ x: Math.max(-40, ox + ev.clientX - sx), y: Math.max(0, oy + ev.clientY - sy) });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('a,button,input');
    (el ?? ref.current)?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const titleBarStyle: React.CSSProperties = kind === 'aim'
    ? { background: 'linear-gradient(to bottom,#ffe566 0%,#e8a800 55%,#c88000 100%)', color: '#3a2000', borderBottom: '1px solid #a06800' }
    : kind === 'explorer'
    ? { background: 'linear-gradient(to right,#1a4fcc 0%,#3c8af5 60%,#1a60e0 100%)', color: '#fff' }
    : { background: 'linear-gradient(90deg,#000a7a,#1c84d8)', color: '#fff' };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      tabIndex={-1}
      onPointerDown={() => onFocus(win.id)}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(win.id); } }}
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: `min(${width}px, calc(100vw - 16px))`,
        zIndex: z, outline: 'none',
        background: redClose ? 'transparent' : SILVER,
        boxShadow: redClose ? '0 0 0 1px rgba(0,0,0,.35), 0 8px 28px rgba(0,0,0,.5)' : `${RAISED}, 0 8px 28px rgba(0,0,0,.45)`,
        borderRadius: redClose ? 4 : 0, overflow: 'hidden',
        padding: redClose ? 0 : 3, fontFamily: UIFONT,
      }}
    >
      <div
        onPointerDown={startDrag}
        style={{ ...titleBarStyle, height: kind === 'app' || kind === 'folder' ? 28 : 26, display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 0 6px', cursor: 'grab', touchAction: 'none' }}
      >
        <span aria-hidden="true" style={{ width: 18, height: 18, flexShrink: 0 }}><Ico n={titleIcon} size={18} /></span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: kind === 'explorer' ? '0 1px 1px rgba(0,0,0,.4)' : 'none' }}>{title}</span>
        <WinClose onClose={() => onClose(win.id)} label={`Close ${title}`} red={redClose} />
      </div>
      {kind === 'app'      && <AppBody k={win.key} onOpen={onOpen} onClose={() => onClose(win.id)} />}
      {kind === 'folder'   && <FolderBody onOpen={onOpen} />}
      {kind === 'aim'      && <AimBody onOpen={onOpen} account={account} onSignOut={onSignOut} onNavigate={onNavigate} />}
      {kind === 'explorer' && <ExplorerBody onOpen={onOpen} />}
    </div>
  );
}

function StartMenu({ onOpen, onClose }: { onOpen: (key: string) => void; onClose: () => void }) {
  const Leaf = ({ k, size = 26 }: { k: string; size?: number }) => (
    <button onClick={() => onOpen(k)} className="win-row"
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, padding: '5px 14px 5px 10px', fontFamily: UIFONT, fontSize: 13.5, color: '#101010' }}>
      <span aria-hidden="true" style={{ width: size, height: size, flexShrink: 0 }}><Ico n={ITEMS[k].icon} size={size} /></span>
      <span>{ITEMS[k].label}</span>
    </button>
  );
  const Folder = ({ name, kids }: { name: string; kids: string[] }) => (
    <div className="start-folder" style={{ position: 'relative' }}>
      <div className="win-row" tabIndex={0} role="menuitem" aria-haspopup="true"
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, padding: '5px 12px 5px 10px', fontFamily: UIFONT, fontSize: 13.5, color: '#101010', cursor: 'default' }}>
        <span aria-hidden="true" style={{ width: 26, height: 26, flexShrink: 0 }}><Ico n={48} size={26} /></span>
        <span style={{ flex: 1 }}>{name}</span>
        <span aria-hidden="true" style={{ fontSize: 10 }}>▶</span>
      </div>
      <div className="start-sub" role="menu" aria-label={name}
        style={{ position: 'absolute', left: '100%', top: -3, minWidth: 214, background: SILVER, boxShadow: RAISED, padding: 3, zIndex: 9002 }}>
        {kids.map(c => <Leaf key={c} k={c} size={24} />)}
      </div>
    </div>
  );
  return (
    <>
      <button aria-label="Close menu" onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'none', border: 'none', cursor: 'default' }} />
      <div role="menu" aria-label="Start" className="start-menu"
        style={{ position: 'absolute', left: 4, bottom: 38, zIndex: 9001, width: 250, background: SILVER, boxShadow: RAISED, padding: 3, display: 'flex', fontFamily: UIFONT }}>
        <div aria-hidden="true" style={{ width: 30, background: 'linear-gradient(#1c84d8,#000a7a)', position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%) rotate(-90deg)', transformOrigin: 'center', whiteSpace: 'nowrap', color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>
            Artistic <span style={{ fontWeight: 400 }}>Accessibility</span>
          </span>
        </div>
        <div className="start-list" style={{ flex: 1, padding: '4px 0' }}>
          {TREE.map((node, i) => node.type === 'leaf'
            ? <Leaf key={i} k={node.key} />
            : <Folder key={i} name={node.name} kids={node.children} />)}
          <div aria-hidden="true" style={{ height: 2, background: '#808080', boxShadow: '0 1px 0 #fff', margin: '4px 6px' }} />
          <Leaf k="connect" />
          <Leaf k="all-folders" />
        </div>
      </div>
    </>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [user, setUser]             = useState<{ id: string } | null>(null);
  const [memberType, setMemberType] = useState<'collective' | 'access_card' | null>(null);
  const [wins, setWins]             = useState<WinState[]>([]);
  const [zTop, setZTop]             = useState(10);
  const [startOpen, setStartOpen]   = useState(false);
  const [sel, setSel]               = useState<string | null>(null);
  const [beta, setBeta]             = useState(true);
  const [time, setTime]             = useState('');

  const cascade = useRef(0);
  const headerH = 44 + (beta ? 38 : 0);

  useEffect(() => {
    document.title = 'Artistic Accessibility Collective';
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      const { data: prof } = await supabase.from('profiles').select('member_type').eq('user_id', data.user.id).maybeSingle();
      setMemberType((prof?.member_type as 'collective' | 'access_card') ?? 'collective');
    });
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && startOpen) setStartOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startOpen]);

  const focusWin = useCallback((id: string) => {
    setZTop(z => {
      const nz = z + 1;
      setWins(ws => ws.map(w => w.id === id ? { ...w, z: nz } : w));
      return nz;
    });
  }, []);

  const DIRECT_NAV = ['make-art', 'learning', 'collective'];

  const open = useCallback((k: string) => {
    setStartOpen(false);
    const it = ITEMS[k];
    if (!it) return;
    if (it.kind === 'ext') { window.open(it.href, '_blank', 'noopener'); return; }
    if (DIRECT_NAV.includes(k) && it.href) { router.push(it.href); return; }
    setWins(ws => {
      const existing = ws.find(w => w.id === k);
      const nz = zTop + 1;
      setZTop(nz);
      if (existing) return ws.map(w => w.id === k ? { ...w, z: nz } : w);
      const c = cascade.current;
      cascade.current = (c + 1) % 6;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const x = Math.max(8, Math.min(60 + c * 34, vw - 324));
      const pos = { x, y: headerH + 14 + c * 30 };
      return [...ws, { id: k, key: k, kind: it.kind as WinKind, pos, z: nz }];
    });
  }, [zTop, headerH, router]);

  const closeWin = (id: string) => setWins(ws => ws.filter(w => w.id !== id));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMemberType(null);
  };

  const account: 'out' | 'collective' | 'access_card' = !user ? 'out' : memberType === 'access_card' ? 'access_card' : 'collective';

  return (
    <div
      onPointerDown={() => setSel(null)}
      style={{ position: 'fixed', inset: 0, background: '#263590', overflow: 'hidden', fontFamily: UIFONT, userSelect: 'none' }}
    >
      <h1 className="sr-only">Artistic Accessibility Collective</h1>

      {/* Starfield */}
      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {STARS.map((s, i) => <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o} />)}
      </svg>

      {/* CRT scanlines */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 8000, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,.06) 0 1px,transparent 1px 3px)' }} />

      {/* Top bar */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44, zIndex: 5, background: 'linear-gradient(to bottom,#e8e5e0,#ccc9c2)', borderBottom: '2px solid #8a8680', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <button
          onClick={() => open('about')}
          aria-label="About, ArtisticAccessibility.com"
          className="top-bar-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, padding: '0 10px' }}
        >
          <span aria-hidden="true" style={{ width: 20, height: 20 }}><Ico n="about-blue" size={20} /></span>
          <span style={{ fontFamily: UIFONT, fontSize: 14, fontWeight: 700, color: '#1a1a2e', letterSpacing: '.01em' }}>ArtisticAccessibility.com</span>
        </button>
      </div>

      {/* Beta ticker */}
      {beta && (
        <div
          role="status"
          onPointerDown={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: 44, left: 0, right: 0, height: 38, zIndex: 5, background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', overflow: 'hidden' }}
        >
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="beta-scroll" style={{ display: 'inline-flex', whiteSpace: 'nowrap', willChange: 'transform' }}>
              <span style={{ padding: '0 50px', color: '#39ff14', fontFamily: UIFONT, fontSize: 12.5, fontWeight: 700 }}>{BETA_MSG}</span>
              <span aria-hidden="true" style={{ padding: '0 50px', color: '#39ff14', fontFamily: UIFONT, fontSize: 12.5, fontWeight: 700 }}>{BETA_MSG}</span>
            </div>
          </div>
          <button
            onClick={() => setBeta(false)}
            aria-label="Dismiss beta notice"
            style={{ flexShrink: 0, height: '100%', minWidth: 30, padding: '0 9px', background: '#000', border: 'none', borderLeft: '1px solid rgba(255,255,255,.2)', color: '#39ff14', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
          >✕</button>
        </div>
      )}

      {/* Desktop icons — hand-placed on desktop, grid on mobile */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        role="list"
        aria-label="Desktop"
        className="dsk-container"
        style={{ position: 'absolute', top: headerH, left: 0, right: 0, bottom: 58, zIndex: 2, pointerEvents: 'none' }}
      >
        {DESKTOP.map(k => {
          const pos = POSITIONS[k] ?? { x: '8px', y: 8 };
          return (
            <div role="listitem" key={k} className="dsk-item" style={{ position: 'absolute', left: pos.x, top: pos.y, pointerEvents: 'all' }}>
              <DeskIcon k={k} onOpen={open} selected={sel === k} onSelect={setSel} />
            </div>
          );
        })}
      </div>

      {/* Windows */}
      {wins.map(w => (
        <Win key={w.id} win={w} z={w.z} onClose={closeWin} onFocus={focusWin} onOpen={open} account={account} onSignOut={handleSignOut} onNavigate={(href) => router.push(href)} />
      ))}

      {/* Start menu */}
      {startOpen && <StartMenu onOpen={open} onClose={() => setStartOpen(false)} />}

      {/* Taskbar */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        role="presentation"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, background: SILVER, boxShadow: 'inset 0 2px 0 #fff', borderTop: '1px solid #fff', display: 'flex', alignItems: 'center', gap: 5, padding: '0 5px', zIndex: 8500, fontFamily: UIFONT }}
      >
        <button
          onClick={() => setStartOpen(s => !s)}
          aria-haspopup="menu"
          aria-expanded={startOpen}
          style={{ height: 36, background: SILVER, boxShadow: startOpen ? SUNKEN : RAISED, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px 0 7px', fontFamily: UIFONT, fontWeight: 700, fontSize: 14, color: '#0a0a0a' }}
        >
          <span aria-hidden="true" style={{ width: 20, height: 20 }}><Ico n={56} size={20} /></span>
          Start
        </button>
        <div aria-hidden="true" style={{ width: 1, height: 24, background: '#808080', boxShadow: '1px 0 0 #fff', margin: '0 3px' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
          {wins.map(w => {
            const wIt = ITEMS[w.key];
            const wTitle = w.kind === 'aim' ? 'Buddy List' : w.kind === 'explorer' ? 'Resources' : w.kind === 'folder' ? 'All Folders' : wIt?.label ?? '';
            const wIc = w.kind === 'aim' ? 'aim' : w.kind === 'explorer' ? 48 : w.kind === 'folder' ? 'folders' : (wIt?.icon ?? 56);
            const top = wins.length > 0 && Math.max(...wins.map(x => x.z)) === w.z;
            return (
              <button key={w.id} onClick={() => focusWin(w.id)}
                style={{ height: 36, maxWidth: 150, boxShadow: top ? SUNKEN : RAISED, background: top ? '#bcbcbc' : SILVER, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '0 9px', fontSize: 12.5, color: '#0a0a0a', fontFamily: UIFONT }}>
                <span aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0 }}><Ico n={wIc} size={16} /></span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wTitle}</span>
              </button>
            );
          })}
        </div>
        <div aria-hidden="true" style={{ boxShadow: FIELD, padding: '5px 10px', fontSize: 12.5, color: '#0a0a0a' }}>
          {time}
        </div>
      </div>

      <style>{`
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .win-close{position:relative;overflow:visible}
        .win-close::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:44px;min-height:44px;display:block}
        .dsk-label{color:#fff;font-family:${UIFONT};font-size:13px;font-weight:600;text-align:center;line-height:1.3;text-shadow:0 1px 0 rgba(0,0,0,.7),0 0 3px rgba(0,0,0,.5);padding:2px 5px;max-width:112px;border:1px dotted transparent}
        .dsk-label.sel{background:#0a246a;border:1px dotted #fff;text-shadow:none}
        .dsk-icon:focus-visible{outline:none}
        .dsk-icon:focus-visible .dsk-label{background:#0a246a;border:1px dotted #fff;text-shadow:none}
        .win-row:hover,.win-row:focus-visible{background:#0a246a;color:#fff!important;outline:2px solid #ffd21a;outline-offset:-2px}
        .top-bar-btn:hover,.top-bar-btn:focus-visible{background:linear-gradient(to bottom,#d0cdc8,#b8b4ae);outline:2px solid #ffd21a;outline-offset:-2px}
        .start-sub{display:none}
        .start-folder:hover>.start-sub,.start-folder:focus-within>.start-sub{display:block}
        .start-folder:hover>.win-row,.start-folder:focus-within>.win-row{background:#0a246a;color:#fff}
        .beta-scroll{animation:beta-marq 30s linear infinite}
        @keyframes beta-marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @media (prefers-reduced-motion: reduce){*{animation-duration:.001ms!important}.beta-scroll{animation:none!important;transform:none!important}}
        @media (max-width: 600px){
          .start-menu{width:calc(100vw - 10px)!important}
          .start-list{max-height:calc(100dvh - 96px)!important;overflow-y:auto!important}
          .start-sub{position:static!important;left:auto!important;top:auto!important;min-width:0!important;box-shadow:none!important;background:#d4d4d4!important;border-left:3px solid #9a9a9a!important;margin:0 8px 4px 30px!important;padding:2px 0!important}
          .start-folder:hover>.start-sub{display:none}
          .start-folder:focus-within>.start-sub{display:block}
          .dsk-container{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:14px!important;padding:16px!important;align-content:center!important;pointer-events:none!important}
          .dsk-item{position:static!important;pointer-events:all!important}
          .dsk-icon{width:100%!important;padding:18px 10px 14px!important;min-height:160px!important;justify-content:center!important}
          .dsk-icon-img-wrap img{width:88px!important;height:88px!important}
          .dsk-label{font-size:13.5px!important;max-width:none!important}
        }
      `}</style>
    </div>
  );
}
